const dotenv = require("dotenv");

async function startWorker() {
    try {
        if (process.env.MACHINE === "gpu") {
            const loadSecrets = require("./load_secrets");
            await loadSecrets();
        } else {
            dotenv.config();
        }

        require("./worker");

        console.log("Worker initialized successfully");

    } catch (error) {
        console.error("Worker startup failed:", error);
        process.exit(1);
    }
}

startWorker();