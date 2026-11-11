import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

BASE_DIR=Path(__file__).resolve().parent.parent.parent

DATA_DIR=BASE_DIR / "data"
PDF_PATH= DATA_DIR / "Memory_Allocation_Algorithm.pdf"

# Divides the text by characters - here 500 chars
CHUNK_SIZE=1000

# To avoid losing context,
# repeat 150 char of the previous chunk in the next one.
CHUNK_OVERLAP=150

EMBEDDING_MODEL_NAME="BAAI/bge-small-en-v1.5"

LLM_MODEL_NAME="openai/gpt-oss-120b"

REDIS_URL="redis://redis:6379"

# REDIS
REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_PORT = os.getenv("REDIS_PORT")

# Top similar embeddins
TOP_K=3

# QDRANT
QDRANT_URL = os.getenv(
    "QDRANT_URL",
    "http://qdrant:6333"
)
QDRANT_COLLECTION = "notes_collection"
# Vector expiration time (seconds)
VECTOR_TTL = int(os.getenv("VECTOR_TTL", "86400"))