from pathlib import Path

BASE_DIR=Path(__file__).resolve().parent.parent.parent

DATA_DIR=BASE_DIR / "data"
PDF_PATH= DATA_DIR / "knowledge.pdf"

# Divides the text by characters - here 500 chars
CHUNK_SIZE=1000
# To avoid losing context,
# repeat 150 char of the previous chunk in the next one.
CHUNK_OVERLAP=150

EMBEDDING_MODEL_NAME="BAAI/bge-small-en-v1.5"

# Top similar embeddins
TOP_K=3