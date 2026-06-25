from fastapi import FastAPI, Body, Query, UploadFile, Form, File
from app.rag.engine import RAGEngine
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from app.core.config import PDF_PATH

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
def query(question:str =Form(...)):
    """
    Return an LLM generated answer, grounded using the PDF content
    """
    try:
        file_path = Path(PDF_PATH)
        with open(file_path,"r") as f:
            file = f.read()
        rag_engine = RAGEngine(file)
        answer=rag_engine.generate_answer(question)
        return {
            "question":question,
            "answer":answer
        }
    except Exception as e:
        return {
            "question":question,
            "answer":None,
            "error": str(e)
        }

@app.post("/api/answer")
async def api_answer(question:str =Form(...), notes: UploadFile = File(...)):
    """Return a JSON answer object for the frontend."""
    try:
        rag_engine = RAGEngine(notes.file)
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
        }