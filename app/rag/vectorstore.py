from langchain_redis import RedisVectorStore
from redisvl.query.filter import Tag
from app.core.redis import redis_server
from langchain_redis import RedisConfig
import logging

logger = logging.getLogger(__name__)

class VectorStore:
    """
    FAIIS-based vector store for document retreival
    """

    def __init__(self, session_id:str, embeddings, redis_config):
        self.embeddings=embeddings
        self.session_id = session_id
        self.redis_config = redis_config
        self.store=None

    def build(self, texts):
        """
        Build FAISS from text chunks.
        """
        metadatas = [
            {"session_id": self.session_id}
            for _ in texts
        ]

        logger.info("Initializing store...")
        self.store=RedisVectorStore.from_texts(
            index_name="index-pdf",
            metadatas=metadatas,
            texts=texts,
            embedding=self.embeddings.model,
            config=self.redis_config,           
            ttl=3600,
        )
        logger.info("Initializing store Completed")

    def search(self, query:str, k:int=3):
        """
        Retrive tok-k relvant chunks
        """
        if self.store is None:
            raise ValueError("Vector Store not initialized")

        logger.info("Performing Simiarity Search...")
        docs= self.store.similarity_search(
            query, 
            k=k,
            filter=Tag("session_id") == self.session_id,
        )
        logger.info("Similarity search complted")
        
        return [doc.page_content for doc in docs]
        