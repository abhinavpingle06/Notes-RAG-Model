const express = require('express')
const multer = require('multer')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { Queue } = require('bullmq');
const axios = require('axios');
const cors = require("cors")
const path = require('path')
const Redis = require('ioredis')
const scanFile = require('./utils/malware_scanner');

if(process.env.NODE_ENV !== "production" ){
    require('dotenv').config({
        path: path.resolve(__dirname, './.env')
    });
}

// Initalize configurations
const PORT = Number(process.env.PORT) || 3000;
const REDIS_URL = process.env.REDIS_URL;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION || process.env.S3_REGION;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

if (!REDIS_URL || !S3_BUCKET_NAME || !AWS_REGION || !AI_SERVICE_URL) {
    throw new Error('Missing required environment variables');
}

// WE WILL PREFRE CONTAINERIZED REDIS 
const redisConnection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    retryStrategy(times) {
        return Math.min(times * 500, 5000);
    }
});

redisConnection.on('error', (error) => {
    console.error('Redis connection error:', error.message);
});

// CONFIIGURE BULLMQ
const jobQueue = new Queue('pdf-processing', {
    connection: redisConnection,
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: {
            count: 3
        }
    }
});

const s3 = new S3Client({
    region: AWS_REGION
});

const app = express();

const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS?.split(',') : [''] ;
if (!process.env.CORS_ORIGINS){
    console.log("No origin were provided")
}

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    console.log(`[EXPRESS] ${req.method} ${req.originalUrl}`);
    next();
});

// MULTER
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 20 * 1024 * 1024,
        files: 4
    },
    fileFilter(req, file, callback) {
        if (file.mimetype !== 'application/pdf') {
            return callback(new Error('Only PDF files are allowed'));
        }

        callback(null, true);
    }
});

// Routes
app.get("/express", (req, res) => {
    res.send("The server is running......");
});

app.post("/express/upload",
    upload.fields([
        { name: "notes_pdfs", maxCount: 4 },
        { name: "syllabus_pdf", maxCount: 4 }
    ]), // Middleware
    async (req, res) => {  // Route handeling
        try {
            const { question, session_id } = req.body;

            const notesFiles = (req.files?.notes_pdfs || []).map(file => ({
                ...file,
                category: "notes"
            }));

            const syllabusFiles = (req.files?.syllabus_pdf || []).map(file => ({
                ...file,
                category: "syllabus"
            }));

            const files = [...notesFiles, ...syllabusFiles];

            if (!files || files.length === 0) {
                return res.status(400).json({
                    error: "No PDF files uploaded"
                });
            }

            // Scan the PDFS
            // await Promise.all(
            //     files.map(file => scanFile(file.buffer))
            // );

            console.log("All PDFs scanned successfully");

            // For polling tracking...
            await redisConnection
                .multi()
                .hset(`user:${session_id}`, {
                    uploaded_pdf: files.length,
                    processed_pdf: 0,
                })
                .expire(`user:${session_id}`, 7200)
                .exec();

            // Promise All
            await Promise.all(
                files.map( async (file) => {
                    // Key for storing path in s3
                    const key = `upload/${session_id}/${Date.now()}-${file.originalname}`
                    await s3.send(new PutObjectCommand({
                        Bucket: process.env.S3_BUCKET_NAME,
                        Key: key,
                        Body: file.buffer,
                        ContentType: file.mimetype,
                    })) 
                    await jobQueue.add("pdf-processing", {
                        session_id: session_id, //To track redis session
                        question: question,
                        files_data: {
                            "filename": file.originalname, // To track redis session files
                            "s3key": key // To download the file
                        },
                    }) 
                })
            )

            return res.json({
                message:"success",
                session_id
            });
        } catch (error) {
            console.error("UPLOAD ERROR:", error);

            return res.status(500).json({
                status: "Error",
                error: error.message
            });
        }
        
});

// FOR POLLING 
app.get("/express/result/:session_id", async (req, res) => {

    const { session_id } = req.params;

    const result = await redisConnection.hgetall(`user:${session_id}`);

    if (Number(result.uploaded_pdf) === Number(result.processed_pdf)) {
        return res.json({
            status: "success"
        });
    }

    return res.json({
        status: "pending"
    });
});


// Health check endpoint for AWS ALB
app.get("/health", async (req, res) => {
    try {
        return res.status(200).json({
            status: "healthy",
            service: "express-backend",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return res.status(503).json({
            status: "unhealthy"
        });
    }
});


app.post("/api/chat", async (req, res) => {
    try {
        const { session_id, question } = req.body;

        if (!session_id || !question) {
            return res.status(400).json({
                error: "session_id and question are required"
            });
        }

        // Forward request to AI service
        const aiResponse = await axios.post(
            `${process.env.AI_SERVICE_URL}/api/chat`,
            {
                session_id,
                question
            },
            {
                timeout: 120000
            }
        );

        // Send AI response back to frontend
        return res.status(200).json(aiResponse.data);

    } catch (error) {
        console.error(
            "Chat API Error:",
            error.response?.data || error.message
        );

        return res.status(error.response?.status || 502).json({
            error: "Failed to communicate with AI service"
        });
    }
});


// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});