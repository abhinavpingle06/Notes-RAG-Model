const {Worker} = require("bullmq")
const axios = require('axios')
const Redis = require("ioredis");
const path = require('path')
require('dotenv').config({path:path.resolve(__dirname,"./.env.local")})

const redisConnection = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true
});

redisConnection.on('connect', () => {
    console.log('Redis connected');
});

redisConnection.on('error', (err) => {
    console.error('Redis connection error:', err.message);
});

const worker = new Worker("pdf-processing", async (job) => {
    console.log("job started",)
    const response = await axios.post(`http://${process.env.AI_SERVICE_URL}/api/upload?session_id=${job.data.session_id}`,{
        job_id: job.id,
        session_id: job.data.session_id,
        question: job.data.question,
        files_data: job.data.files_data,
    })  
    // Data body in stored in response.data
    if (response.data.msg === "success") {
        await redisConnection.hincrby(`user:${job.data.session_id}`,"processed_pdf",1)
    } 
},{
    connection: redisConnection,
    concurrency: 1
})

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed`, err);
});

