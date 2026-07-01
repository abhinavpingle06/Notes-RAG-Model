from typing import List
from fastapi import FastAPI, Query, Request, UploadFile, Form, File
from pydantic import BaseModel
import json
import traceback
from langchain_redis import RedisVectorStore,RedisConfig
from redisvl.query.filter import Tag
from langchain.agents import create_agent
from fastapi.middleware.cors import CORSMiddleware
from langchain_groq import ChatGroq
import logging
import time
from contextlib import asynccontextmanager
import requests
import boto3
import os
from dotenv import load_dotenv

from app.rag.vectorstore import VectorStore

load_dotenv()

from app.rag.engine import RAGEngine
from app.core.config import DATA_DIR, PDF_PATH
from app.core.redis import redis_server
from app.rag.embeddings import EmbeddingModel
from app.core.config import EMBEDDING_MODEL_NAME, LLM_MODEL_NAME, REDIS_URL

class FILES(BaseModel):
    filename:str
    s3key:str

class PDFrequest(BaseModel):
    job_id:str
    question: str
    session_id: str
    files_data: list[FILES]

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
    system_prompt="You are a helpful assistant",
    )

    redis_config = RedisConfig(
            index_name="index-pdf",
            redis_url="redis://localhost:6379",
            indexing_algorithm="HNSW",
            metadata_schema=[
                {
                    "name":"session_id",
                    "type":"tag"
                }
            ]
        )
    app.state.redis_config = redis_config
    
    store = VectorStore(embeddings=embedding_model, redis_config=redis_config)
    app.state.store = store
    print(store.store._index.exists())
    # app.state.store.add

    print("Startup complete")

    yield

    print("Shutting down...")

# INITIALIZE 
app = FastAPI(lifespan=lifespan)


print(os.getenv("S3_REGION"))
print(os.getenv("S3_ACCESS_KEY"))
print(os.getenv("S3_SECRET_ACCESS_KEY"))

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/")
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
        
        # rag_engine = RAGEngine(
        #     file=PDF_PATH,
        #     session_id="101",
        #     embedding_model= request.app.state.embedding_model,
        #     # vectore_store= request.app.state.vector_store,
        #     redis_config= request.app.state.redis_config,
        #     agent = request.app.state.agent,
        # )
        
        # answer=rag_engine.generate_answer(question)
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

@app.post("/api/answer")
async def api_answer(request: Request,
        # question:str =Form(...), notes: UploadFile = File(...), session_id: str = Form(...)):
        data: PDFrequest):
    """Return a JSON answer object for the frontend."""
    try:
        files_path = []
        for pdf in data.files_data:
            logger.info(f"Downloading file ${pdf.filename} from S3")
            local_path = os.path.join(DATA_DIR, pdf.filename)
            s3.download_file(
                os.getenv("S3_BUCKET_NAME"),
                pdf.s3key,
                local_path
            )
            files_path.append(local_path)
        logger.info(f"Successfully Downloaded file ${pdf.filename} from S3") 
        rag_engine = RAGEngine(
                file= files_path,
                session_id= data.session_id,
                embedding_model= request.app.state.embedding_model,
                vector_store= request.app.state.store,
                redis_config= request.app.state.redis_config,
                agent = request.app.state.agent,
            )
        # UNLESS WE ARE NOT STORING THE PDFS WE ARE NOT CALLING THIS FUNC
        answer = rag_engine.generate_answer(data.question)

        # # Setting answer in redis with session as key 
        # await redis_server.set(
        #     f"answer:${data.session_id}",
        #     json.dumps({
        #         "status": "completed",
        #         "answer":answer
        #     }),
        #     ex=3600,
        # )
        # Setting the context 
        context_obj = {
            "user_question":data.question,
            "assistant_answer":answer
        }
        await redis_server.rpush(f"session:{data.session_id}:chats",json.dumps(context_obj))
        await redis_server.expire(f"session:{data.session_id}:chats", 3600) 

        return {
                "msg": "Success",
                "answer": answer,
            }
    except Exception as e:
        logger.exception("Error while processing request")
        return {
            "msg":"Failed",
            "error": str(e),
            "traceback": traceback.format_exc(),
        }
    
@app.post("/api/chat")
async def api_chats(request: Request, question:str = Form(...), session_id:str = Form(...)):
    try:
        logger.info("Configuration of redis for chat")
        # config = RedisConfig(
        #         index_name="index-pdf",
        #         redis_url="redis://localhost:6379",
        #     )

        # embedding_model = EmbeddingModel(EMBEDDING_MODEL_NAME)
        logger.info("Initializing vector store for chat")
        store = RedisVectorStore(
            embeddings=request.app.state.embedding_model ,
            config= request.app.state.redis_config
        )
        logger.info("Initializing vector similarity search for chat")
        similarity_arr = store.similarity_search(
            query=question, 
            k=3,
            filter= Tag("session_id") == session_id,
        )

        combined_text="\n\n".join(doc.page_content for doc in similarity_arr)
        """ GET THE CONTEXT THROUGH SESSION ID"""
        logger.info("Loading convo from redis...")
        context = await redis_server.lrange(f"session:{session_id}:chats",0,-1)
        logger.info("Loading convo from redis completed...")
        contextObj = [json.loads(obj) for obj in context]

        prompt_template=f"""
            You are a helpful AI assistant that answers questions using the provided document context and the previous conversation.

    Instructions:

    * Answer the user's question using ONLY the information available in the document context.
    * If the context does not contain enough information, reply: **"I couldn't find that information in the uploaded document."**
    * Use the previous conversation only to understand follow-up questions and maintain context.
    * Do not invent or assume facts that are not present in the document.
    * Answer naturally and conversationally.
    * Use Markdown formatting where appropriate (headings, bullet points, tables, code blocks).
    * Keep responses concise unless the user explicitly asks for a detailed explanation.

    ### Previous Conversation

    {contextObj}

    ### Document Context

    {combined_text}

    ### User Question

    {question}

    ### Response
    answer:
            """

        result= request.app.state.agent.invoke({
            "messages":[
                {"role":"user", "content":prompt_template}
            ]
        }) 
        answer = result['messages'][-1].content
        
        context_obj = {
            "user_question":question,
            "assistant_answer":answer
        }
        await redis_server.rpush(f"session:{session_id}:chats",json.dumps(context_obj))
        await redis_server.expire(f"session:{session_id}:chats", 3600) 

        return {
                "question": question,
                "answer": answer,
            }
    except Exception as e:
        logger.exception("Error while processing request")
        return {
            "question": question,
            "answer": None,
            "error": str(e),
            "traceback": traceback.format_exc(),
        }