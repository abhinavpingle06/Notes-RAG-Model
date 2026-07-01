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

    def __init__(self, embeddings, redis_config):
        self.store = RedisVectorStore(
            index_name="index-pdf",
            embeddings=embeddings.model,
            config=redis_config,
            ttl=3600,
        )
        
    def add(self, session_id, texts):

        metadata = [
            {"session_id": session_id}
            for _ in texts
        ]
        print(type(self.store))
        print(dir(self.store))
        print(self.store._index)
        print(self.store._index.exists())
        if not self.store._index.exists():
            self.store._index.create()

        print(self.store._index.exists())
        self.store.add_texts(
            texts=texts,
            index_name="index-pdf",
            metadatas=metadata,
            ttl=3600,
        )

    def search(self, session_id, query):

        docs = self.store.similarity_search(
            query=query,
            filter=Tag("session_id") == session_id,
            k=3,
        )
        return [doc.page_content for doc in docs]
    
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

    # def search(self, query:str, k:int=3):
    #     """
    #     Retrive tok-k relvant chunks
    #     """
    #     if self.store is None:
    #         raise ValueError("Vector Store not initialized")

    #     logger.info("Performing Simiarity Search...")
    #     docs= self.store.similarity_search(
    #         query, 
    #         k=k,
    #         filter=Tag("session_id") == self.session_id,
    #     )
    #     logger.info("Similarity search complted")
        
    #     return [doc.page_content for doc in docs]
        