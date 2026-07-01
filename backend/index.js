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

// Routes
app.get("/", (req, res) => {
    res.send("The server is running......");
});

app.post("/upload",
    upload.array("pdfs"), // Middleware
    async (req, res) => {  // Route handeling
        try {
            const { question, session_id } = req.body;
            const files = req.files;
            // console.log(question, session_id, files)

            const worker_job = []
            for (const file of files) {
                const key = `upload/${session_id}/${file.originalname}`

                await s3.send(new PutObjectCommand({
                    Bucket: process.env.S3_BUCKET_NAME,
                    Key: key,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                })) 
                
                worker_job.push({
                    "filename":file.originalname,
                    "s3key": key
                })
            }

            const job = await jobQueue.add("pdf-processing", {
                session_id: session_id,
                question: question,
                files_data: worker_job,
            })

            return res.json({
                message:"success",
                session_id
            });
        } catch (error) {
            return res.status(404).json({
                status:"Error",
                error:error,
            })
        }
        
});

// FOR POLLING 
app.get("/result/:session_id", async (req, res) => {

    const { session_id } = req.params;

    const result = await redis.get(`answer:${session_id}`);

    if (!result) {
        return res.json({
            status: "processing"
        });
    }

    return res.json(JSON.parse(result));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});