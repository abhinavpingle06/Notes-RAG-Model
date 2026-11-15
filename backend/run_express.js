import dotenv from "dotenv";

async function startServer() {
    try {
        if (process.env.MACHINE === "gpu") {
            const { default: loadSecrets } = await import("./load-secrets.js");
            await loadSecrets();
        } else {
            dotenv.config();
        }

        const { default: app } = await import("./index.js");

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Startup failed:", error);
        process.exit(1);
    }
}

startServer();