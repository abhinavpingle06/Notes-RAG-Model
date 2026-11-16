const dotenv = require("dotenv");

async function startServer() {
    try {
        if (process.env.MACHINE === "gpu") {
            const loadSecrets = require("./load_secrets");
            await loadSecrets();
        } else {
            dotenv.config();
        }

        const app = require("./index");

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Startup failed:", error);
        process.exit(1);
    }
}

startServer();