from fastapi import FastAPI, Query, UploadFile, Form, File
import json
import traceback
from langchain_redis import RedisVectorStore,RedisConfig
from redisvl.query.filter import Tag
from langchain.agents import create_agent
from fastapi.middleware.cors import CORSMiddleware
from langchain_groq import ChatGroq

from app.rag.engine import RAGEngine
from app.core.config import PDF_PATH
from app.core.redis import redis_server
from app.rag.embeddings import EmbeddingModel
from app.core.config import EMBEDDING_MODEL_NAME

    
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
        context_obj = {
            "user_question":question,
            "assistant_answer":answer
        }
        await redis_server.rpush(f"session:{session_id}:chats",json.dumps(context_obj))

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
    
@app.post("/api/chat")
async def api_chats(question:str = Form(...), session_id:str = Form(...)):
    try:
        config = RedisConfig(
                index_name="index-pdf",
                redis_url="redis://localhost:6379",
            )

        embedding_model = EmbeddingModel(EMBEDDING_MODEL_NAME)
        store = RedisVectorStore(embeddings=embedding_model,config=config)
        similarity_arr = store.similarity_search(
            query=question, 
            k=3,
            filter= Tag("session_id") == session_id,
        )

        combined_text="\n\n".join(doc.page_content for doc in similarity_arr)
        """ GET THE CONTEXT THROUGH SESSION ID"""
        context = await redis_server.lrange(f"session:{session_id}:chats",0,-1)
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

        agent= create_agent(
            model=ChatGroq(model_name="llama-3.3-70b-versatile"),
            system_prompt="You are a helpful assistant"
        )

        result= agent.invoke({
            "messages":[
                {"role":"user", "content":prompt_template}
            ]
        }) 
        answer = result['messages'][-1].content
        
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