# Creating the GOLDEN DATASET
from uuid import uuid4
from langchain_huggingface import HuggingFaceEmbeddings
from pathlib import Path
from app.utils.pdf_to_markdown import create_pdf_converter
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams
from langchain_core.documents import Document
from dotenv import load_dotenv
import os
from datetime import datetime, timezone

# CONFIGS
embedding_model = "BAAI/bge-small-en-v1.5"
BASE_DIR = Path(__file__).resolve().parent
ENV = BASE_DIR.parent
ENV_PATH = ENV / ".env"
files_path = BASE_DIR / "pdfs"
directory = Path(files_path)
chunk_size = 768
chunk_overlap = 75
collection_name = "golden_dataset"
files_list = []

# INITIALIZING
load_dotenv(dotenv_path=ENV_PATH)
converter = create_pdf_converter()
text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
embeddings = HuggingFaceEmbeddings(
    model_name=embedding_model
)
client = QdrantClient(url=os.getenv("QDRANT_URL"),api_key=os.getenv("QDRANT_API_KEY"))
for item in directory.iterdir():
  if item.is_file():
    print(item.name)
    files_list.append(item)


print("Started... ", datetime.now(timezone.utc).isoformat() )

for file in files_list :
    print("File : ", file)
    # TEXT EXTRACTION 
    text = converter.convert(file)
    markdown = text.document.export_to_markdown()

    # CONVERT IT INTO CHUNKS
    texts_chunks = text_splitter.split_text(markdown)

    # GENERATING THE EMBEDDINGS (LANGCHAIN HANDELS IT) 
    if not client.collection_exists(collection_name=collection_name):
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=384 , distance=Distance.COSINE),   
        )

    vector_store = QdrantVectorStore(
        client=client,
        collection_name=collection_name,
        embedding=embeddings,
    )

    # ADD TO THE STORE
    documents = [
        Document(
                page_content=chunk,
                metadata={
                    "chunk_id": i ,
                    "source_file": file.name,
                    "file_type": "pdf",
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
            )
            for i, chunk in enumerate(texts_chunks)
            ]
    ids = [str(uuid4()) for _ in documents]
    vector_store.add_documents(documents, ids=ids)

print("Completed.... ", datetime.now(timezone.utc).isoformat())
client.close()