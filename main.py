from pathlib import Path
from typing import List
from fastapi import FastAPI, Query, Request, UploadFile, Form, File
from pydantic import BaseModel
import json
import traceback
from langchain.agents import create_agent
from langchain_groq import ChatGroq
import logging
import time
from contextlib import asynccontextmanager
import requests
import boto3
import os
import os
import logging
from dotenv import load_dotenv
from docling.document_converter import DocumentConverter

BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"
load_dotenv(ENV_PATH)

from app.rag.vectorstore import VectorStore
from app.utils.pdf_to_markdown import create_pdf_converter, pdf_to_markdown
from app.rag.engine import RAGEngine
from app.core.redis import redis_server
from app.rag.embeddings import EmbeddingModel
from app.core.config import EMBEDDING_MODEL_NAME, LLM_MODEL_NAME, REDIS_URL, AGENT_PROMPT, RAG_PROMPT_TEMPLATE, MACHINE

os.makedirs("logs", exist_ok=True)

logging.basicConfig(
    handlers=[
        logging.FileHandler("logs/latency.log"),
        logging.StreamHandler()
    ],
    level=logging.INFO
)

class FILES(BaseModel):
    filename:str
    s3key:str

class PDFrequest(BaseModel):
    job_id:str
    question: str
    session_id: str
    files_data: FILES

class chatData(BaseModel):
    session_id:str
    question:str

@asynccontextmanager
async def lifespan(app: FastAPI):

    print("Loading models...")

    embedding_model = EmbeddingModel(EMBEDDING_MODEL_NAME)
    app.state.embedding_model = embedding_model

    llm = ChatGroq(
        model_name=LLM_MODEL_NAME
    )

    app.state.agent = create_agent(
    model= llm,
    system_prompt=AGENT_PROMPT,
    )

    store = VectorStore(embeddings=embedding_model)
    app.state.store = store

    # Initialize PDF converter
    if MACHINE == "local" :
        app.state.pdf_converter = create_pdf_converter()
    else :
        app.state.pdf_converter = DocumentConverter()

    print("Startup complete")

    yield

    print("Shutting down...")

# INITIALIZE 
app = FastAPI(lifespan=lifespan)

s3 = boto3.client(
    "s3",
    region_name= os.getenv("S3_REGION"),
    aws_access_key_id= os.getenv("S3_ACCESS_KEY"),
    aws_secret_access_key= os.getenv("S3_SECRET_ACCESS_KEY"),
    )

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers=[
        logging.FileHandler("logs/latency.log"),
        logging.StreamHandler() # Also prints in console
    ]
)
logger = logging.getLogger(__name__)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    logger.info(f"Request: {request.method} {request.url}")

    response = await call_next(request)
    process_time = time.time() - start_time

    logger.info(
        f"Response: {request.method} {request.url.path} "
        f"Status={response.status_code} "
        f"Time={process_time:.3f}s"
    )

    return response

@app.get("/health")
def root():
    return {"Status":200}

@app.post("/query")
def query(request: Request, question:str= Form(...), pdfs: List[UploadFile] = File(...)):
    """
    Return an LLM generated answer, grounded using the PDF content
    """
    try:
        files = []

        for pdf in pdfs:
            files.append(
            (
                "pdfs",  # Must match upload.array("pdfs")
                (pdf.filename, pdf.file, pdf.content_type)
            )
        )
        data = {
        "session_id": "202",
        "question": question
        }

        response = requests.post("http://localhost:3000/upload",
        files=files,
        data=data
    )
        
        return {
            "question":question,
            # "answer":answer
        }
    except Exception as e:
        return {
            "question":question,
            "answer":None,
            "error": str(e),
            "traceback": traceback.format_exc(),
        }

@app.post("/api/upload")
async def api_answer(request: Request,
        # question:str =Form(...), notes: UploadFile = File(...), session_id: str = Form(...)):
        data: PDFrequest):
    """Return a JSON answer object for the frontend."""
    try:
        file = data.files_data
        logger.info(f"Downloading file ${file.filename} from S3")
        DATA_DIR = Path("/main/data")
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        local_path = DATA_DIR / file.filename
        s3.download_file(
            os.getenv("S3_BUCKET_NAME"),
            file.s3key,
            local_path
        )

        logger.info(f"Successfully Downloaded file ${file.filename} from S3") 

        logger.info("Starting PDF conversion to MARKDOWN...")

        if MACHINE == "local":
            markdown_text = pdf_to_markdown(app.state.pdf_converter, str(local_path))
        else:
            result = app.state.pdf_converter.convert(str(local_path))  
            markdown_text = result.document.export_to_markdown()

        logger.info(
            "Markdown conversion completed. Characters: %s",
            len(markdown_text)
        )

        if not markdown_text.strip():
            raise ValueError("iLovePDF returned empty Markdown")


        rag_engine = RAGEngine(
        file=local_path,
        document_text=markdown_text,
        session_id=data.session_id,
        embedding_model=request.app.state.embedding_model,
        vector_store=request.app.state.store,
        agent=request.app.state.agent,
        )

        logger.info(
            "Document successfully processed for session %s",
            data.session_id
        )
  
        return {"msg":"success"}
        
    except Exception as e:
        logger.exception("Error while processing request")
        return {
            "msg":"Failed",
            "error": str(e),
            "traceback": traceback.format_exc(),
        }
    
    finally :
        if os.path.exists(local_path):
            os.remove(local_path)
            logger.info(f"Deleted local file: {local_path}")
    
@app.post("/api/chat")
async def api_chats(request: Request, data:chatData ):
    try:
        
        logger.info("Initializing vector similarity search for chat")
        similarity_arr = request.app.state.store.search(
            session_id=data.session_id,
            query=data.question, 
        )
        combined_text="\n\n".join(similarity_arr)

        """ GET THE CONTEXT THROUGH SESSION ID"""
        logger.info("Loading convo from redis...")
        context = await redis_server.lrange(f"session:{data.session_id}:chats",0,-1)
        logger.info("Loading convo from redis completed...")
        if context:
            contextObj = [json.loads(obj) for obj in context]
        else:
            contextObj = []
        
        prompt_template = RAG_PROMPT_TEMPLATE.format(
            previous_conversation=contextObj,
            document_context=combined_text,
            question=data.question
        )

        result= request.app.state.agent.invoke({
            "messages":[
                {"role":"user", "content":prompt_template}
            ]
        }) 
        answer = result['messages'][-1].content
        
        context_obj = {
            "user_question":data.question,
            "assistant_answer":answer
        }
        await redis_server.rpush(f"session:{data.session_id}:chats",json.dumps(context_obj))
        await redis_server.expire(f"session:{data.session_id}:chats", 3600) 

        return {
                "question": data.question,
                "answer": answer,
            }
    except Exception as e:
        logger.exception("Error while processing request")
        return {
            "question": data.question,
            "answer": None,
            "error": str(e),
            "traceback": traceback.format_exc(),
        }