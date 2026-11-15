import dotenv from "dotenv";

async function startWorker() {
    try {
        if (process.env.MACHINE === "gpu") {
            const { default: loadSecrets } = await import("./load_secrets.js");
            await loadSecrets();
        } else {
            // Local deployment
            dotenv.config();
        }

        // Initialize worker only after secrets are loaded
        await import("./worker.js");

    } catch (error) {
        console.error("Worker startup failed:", error);
        process.exit(1);
    }
}

startWorker();
