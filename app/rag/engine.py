from app.core.config import PDF_PATH, CHUNK_SIZE, CHUNK_OVERLAP, EMBEDDING_MODEL_NAME, TOP_K
from app.rag.loader import PDFLoader
from app.rag.chunker import LangchainTextChunker
from app.rag.embeddings import EmbeddingModel
from app.rag.vectorstore import VectorStore

from langchain.agents import create_agent
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

class RAGEngine:
    """
    Singleton-style RAG Engine.
    Initialized once and serves all queries
    """

    def __init__(self, file, session_id, embedding_model, redis_config, vector_store, agent):
        self.files = file
        self.session_id = session_id
        self.embedding_model = embedding_model
        self.store = vector_store
        self.redis_config = redis_config
        self.agent = agent
        self._initialize()

    def _initialize(self):
        load_dotenv()
        logger.info("Initializing RAG Engine for session %s", self.session_id)
        # 1.Get text string 
        logger.info("Loading PDF and extracting the text...")
        texts = []
        for file in self.files:
            text=PDFLoader(file).load_pdf()
            texts.append(text)
        whole_text = "\n".join(texts)
        logger.info("Loading PDF and extraction completed")
        # 2.Divides in chunks
        logger.info("Splitting in chunks...")
        chunks=LangchainTextChunker(CHUNK_SIZE, CHUNK_OVERLAP).chunk(whole_text)
        logger.info("Splitting in chunks completed")

        logger.info("Innitializing Vector Store with embedding model...")
        # self.vector_store=VectorStore(embeddings=self.embedding_model,session_id=self.session_id, redis_config=self.redis_config)
        logger.info("Innitializing Vector Store with embedding model completed")

        logger.info("Generating Embedddings...")
        self.store.add(self.session_id, chunks)
        logger.info("Generating Embedddings Finished")

    def generate_answer(self, question:str):
        """
        Geneate an answer using the vectore store with a grounded prompt.
        Retrieve top -k chunls and pass them to llm with a strict prompt
        """
        logger.info("Inside generating answer")
        
        logger.info("Initialize Vector Search...")
        contexts= self.store.search(session_id=self.session_id ,query=question)
        logger.info("Vector search completed...")
        combined_text="\n\n".join(contexts)

        prompt_template=f"""
        You are a helpfile assistant. Use only the information provided in the context below to answer the question.
        If the answer is not present in the context, respond with "I don't know"
        If the answer is not 

        Context: {combined_text}

        question: {question}

        Write a comprehensive answer suitable for a 10-mark exam question. 
        Include definition, working principle, advantages, disadvantages, applications, and a conclusion with headings and sub-headings and points/markdown. 
        Use around 600-1000 words. Dont mention the number of words in answer.

        answer:
        """

        logger.info("Invoking Agent")
        result=self.agent.invoke({
            "messages":[
                {"role":"user", "content":prompt_template}
            ]
        }) 
        logger.info("Got answer from the agent")

        return result['messages'][-1].content
    
    