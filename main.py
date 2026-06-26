from fastapi import FastAPI, Query, UploadFile, Form, File
import json
from pydantic import BaseModel
import traceback

from app.rag.engine import RAGEngine
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from app.core.config import PDF_PATH
from app.core.redis import redis_server

    
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"Status":200}

@app.get("/query")
def query(question:str = Query()):
    """
    Return an LLM generated answer, grounded using the PDF content
    """
    try:
        rag_engine = RAGEngine(PDF_PATH,"101")
        answer=rag_engine.generate_answer(question)
        return {
            "question":question,
            "answer":answer
        }
    except Exception as e:
        return {
            "question":question,
            "answer":None,
            "error": str(e),
            "traceback": traceback.format_exc(),
        }

@app.post("/api/answer")
async def api_answer(question:str =Form(...), notes: UploadFile = File(...), session_id: str = Form(...)):
    """Return a JSON answer object for the frontend."""
    try:
        rag_engine = RAGEngine(notes.file,session_id)
        answer = rag_engine.generate_answer(question)
        return {
            "question": question,
            "answer": answer,
        }
    except Exception as e:
        return {
            "question": question,
            "answer": None,
            "error": str(e),
            "traceback": traceback.format_exc(),
        }
    
@app.post("/api/chats")
async def api_chats(question:str = Form(...), session_id:str = Form(...)):
    """ GET THE CONTEXT THROUGH SESSION ID"""
    context = redis_server.get(session_id)
    contextObj = json.loads(context)

    


    return