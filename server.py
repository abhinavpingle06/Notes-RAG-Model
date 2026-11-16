import os
import uvicorn
from dotenv import load_dotenv

def start_server():
    try:
        if os.getenv("MACHINE") == "gpu":
            from env_secrets import load_secrets
            load_secrets()
        else:
            load_dotenv()

        # Import FastAPI application only after loading secrets
        from main import app

        port = 8000

        print("Starting FastAPI application...")

        uvicorn.run(
            app,
            host="0.0.0.0",
            port=port
        )

    except Exception as error:
        print(f"Application startup failed: {error}")
        raise


if __name__ == "__main__":
    start_server()
