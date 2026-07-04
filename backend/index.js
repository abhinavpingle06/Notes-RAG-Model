const express = require('express')
const multer = require('multer')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { Queue, tryCatch }= require('bullmq')
const cors = require("cors")
const path = require('path')
const Redis = require('ioredis')
require('dotenv').config({path:path.resolve(__dirname,"../.env")})

// Initalize
const redis = new Redis({
    host: "localhost",
    port: 6379,
});
const PORT = 3000;

const upload = multer({
    storage:multer.memoryStorage()
})

const jobQueue = new Queue("pdf-processing",{
    connection: {
        host: "localhost",
        port: 6379
    },
    defaultJobOptions:{
        removeOnComplete:true,
        removeOnFail:{count:3}
    }
})

const s3 = new S3Client({
    region: process.env.S3_REGION,
    credentials:{
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    }
})

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/express", (req, res) => {
    res.send("The server is running......");
});

app.post("/express/upload",
    upload.array("pdfs"), // Middleware
    async (req, res) => {  // Route handeling
        try {
            const { question, session_id } = req.body;
            const files = req.files;
            // console.log(question, session_id, files)

            // For polling tracking...
            await redis
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
                    const key = `upload/${session_id}/${file.originalname}`
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
            return res.status(404).json({
                status:"Error",
                error: String(error),
            })
        }
        
});

// FOR POLLING 
app.get("/express/result/:session_id", async (req, res) => {

    const { session_id } = req.params;

    const result = await redis.hgetall(`user:${session_id}`);

    if (Number(result.uploaded_pdf) === Number(result.processed_pdf)) {
        return res.json({
            status: "success"
        });
    }

    return res.json({
        status: "pending"
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});