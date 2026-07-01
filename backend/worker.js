const {Worker} = require("bullmq")
const axios = require('axios')
const Redis = require("ioredis");
const path = require('path')
require('dotenv').config({path:path.resolve(__dirname,"../.env")})

const redis = new Redis({
    host: "localhost",
    port: 6379,
});

const worker = new Worker("pdf-processing", async (job) => {
    console.log("job started",)
    const response = await axios.post("http://127.0.0.1:8000/api/answer",{
        job_id: job.id,
        session_id: job.data.session_id,
        question: job.data.question,
        files_data: job.data.files_data,
    })  

    if (response.data.msg === "Success") {

        await redis.set(
            `answer:${job.data.session_id}`,
            JSON.stringify({
                status: "completed",
                answer: response.data.answer
            }),
            "EX",
            3600
        );

    } else {
        await redis.set(
            `answer:${job.data.session_id}`,
            JSON.stringify({
                status: "failed",
                error: response.data.error
            }),
            "EX",
            3600
        );
    }
},{
    connection: {
        host: "localhost",
        port: 6379
    },
    concurrency: 3
})

worker.on("completed", (job) => {
    console.log(`✅ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
    console.error(`❌ Job ${job?.id} failed`, err);
});

worker.on("error", (err) => {
    console.error(err);
});