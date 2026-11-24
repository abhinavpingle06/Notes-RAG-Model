
const { Worker } = require("bullmq");
const axios = require("axios");
const Redis = require("ioredis");

const redisConnection = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
});

redisConnection.on("connect", () => {
    console.log("Redis connected");
});

redisConnection.on("error", (err) => {
    console.error("Redis connection error:", err.message);
});

const worker = new Worker(
    "pdf-processing",
    async (job) => {
        const start = Date.now();

        console.log(`Job ${job.id}: Sending request to AI service`);

        try {
            // const response = await axios.post(
            //     `${process.env.AI_SERVICE_URL}/api/upload?session_id=${job.data.session_id}`,
            //     {
            //         job_id: job.id,
            //         session_id: job.data.session_id,
            //         enable_advance_text_detection:
            //             job.data.enable_advance_text_detection,
            //         question: job.data.question,
            //         files_data: job.data.files_data,
            //     },
            //     {
            //         timeout: 300000, // 5 minutes
            //     }
            // );

            // console.log(
            //     `Job ${job.id}: AI response received in ${Date.now() - start
            //     }ms`,
            //     response.status,
            //     response.data
            // );

            // if (response.data.msg !== "success") {
            //     throw new Error(
            //         `AI processing failed: ${response.data.error || "Unknown error"}`
            //     );
            // }

            // await redisConnection.hincrby(
            //     `user:${job.data.session_id}`,
            //     "processed_pdf",
            //     1
            // );

            // return response.data;

            const response = await fetch(
                `${process.env.AI_SERVICE_URL}/api/upload?session_id=${encodeURIComponent(job.data.session_id)}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        job_id: job.id,
                        session_id: job.data.session_id,
                        enable_advance_text_detection:
                            job.data.enable_advance_text_detection,
                        question: job.data.question,
                        files_data: job.data.files_data,
                    }),
                    signal: AbortSignal.timeout(300000),
                }
            );

            let responseData;

            try {
                responseData = await response.json();
            } catch {
                throw new Error(
                    `AI service returned invalid JSON. HTTP status: ${response.status}`
                );
            }

            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status}: ${JSON.stringify(responseData)}`
                );
            }

            console.log(
                `Job ${job.id}: AI response received in ${Date.now() - start
                }ms`,
                response.status,
                responseData
            );

            if (responseData.msg !== "success") {
                throw new Error(
                    `AI processing failed: ${responseData.error || "Unknown error"}`
                );
            }

            await redisConnection.hincrby(
                `user:${job.data.session_id}`,
                "processed_pdf",
                1
            );

            return responseData;

        } catch (error) {
            console.error(`Job ${job.id} failed:`, {
                message: error.message,
                status: error.response?.status,
                response: error.response?.data,
                elapsed: Date.now() - start,
            });

            throw error;
        }
    },
    {
        connection: redisConnection,
        concurrency: Math.max(
            1,
            parseInt(process.env.CONCURRENCY, 10) || 1
        ),
    }
);

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
    console.error("Worker error:", err);
});