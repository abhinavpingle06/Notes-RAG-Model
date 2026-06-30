const {Worker} = require("bullmq")
const axios = require('axios')

const worker = new Worker("pdf-processing", async (job) => {
    console.log("job started",)
    const response = await axios.post("http://127.0.0.1:8000/api/answer",{
        job_id: job.id,
        session_id: job.data.session_id,
        question: job.data.question,
        filename: job.data.filename,
        s3key: job.data.s3key
    })
    return 

},{
    connection: {
        host: "localhost",
        port: 6380
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