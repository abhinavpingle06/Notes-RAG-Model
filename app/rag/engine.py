from app.core.config import PDF_PATH, CHUNK_SIZE, CHUNK_OVERLAP, EMBEDDING_MODEL_NAME, TOP_K
from app.rag.loader import PDFLoader
from app.rag.chunker import LangchainTextChunker
from app.rag.embeddings import EmbeddingModel
from app.rag.vectorstore import VectorStore

from langchain.agents import create_agent
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from dotenv import load_dotenv

class RAGEngine:
    """
    Singleton-style RAG Engine.
    Initialized once and serves all queries
    """

    def __init__(self, file, session_id):
        self.vector_store=None
        self.file = file
        self.session_id = session_id
        self._initialize()

    def _initialize(self):
        load_dotenv()
        # 1.Get text string 
        text=PDFLoader(self.file).load_pdf()
        # 2.Divides in chunks
        chunks=LangchainTextChunker(CHUNK_SIZE, CHUNK_OVERLAP).chunk(text)
        # 3.Convert the chunks into embeddings
        embeddings=EmbeddingModel(EMBEDDING_MODEL_NAME)
        # 4.Store it in vector store
        self.vector_store=VectorStore(embeddings,self.session_id)
        self.vector_store.build(chunks)
        # 5.Initializing Chat Model
        self.llm=ChatGroq(model_name="llama-3.3-70b-versatile")

    def generate_answer(self, question:str):
        """
        Geneate an answer using the vectore store with a grounded prompt.
        Retrieve top -k chunls and pass them to llm with a strict prompt
        """
        contexts= self.vector_store.search(query=question, k=TOP_K)
        print(contexts)
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

        agent=create_agent(
            model=self.llm,
            system_prompt="You are a helpful assistant"
        )

        result=agent.invoke({
            "messages":[
                {"role":"user", "content":prompt_template}
            ]
        }) 

        return result['messages'][-1].content