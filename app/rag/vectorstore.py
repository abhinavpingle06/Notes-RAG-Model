from langchain_redis import RedisVectorStore
from redisvl.query.filter import Tag
from app.core.redis import redis_server
from langchain_redis import RedisConfig

class VectorStore:
    """
    FAIIS-based vector store for document retreival
    """

    def __init__(self, embeddings, session_id):
        self.embeddings=embeddings
        self.session_id = session_id
        self.store=None

    def build(self, texts):
        """
        Build FAISS from text chunks.
        """
        metadatas = [
            {"session_id": self.session_id}
            for _ in texts
        ]

        config = RedisConfig(
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

        self.store=RedisVectorStore.from_texts(
            index_name="index-pdf",
            metadatas=metadatas,
            texts=texts,
            embedding=self.embeddings.model,
            config=config,           
            ttl=3600,
        )

    def search(self, query:str, k:int=3):
        """
        Retrive tok-k relvant chunks
        """
        if self.store is None:
            raise ValueError("Vector Store not initialized")
    
        docs= self.store.similarity_search(
            query, 
            k=k,
            filter=Tag("session_id") == self.session_id,
        )
        
        return [doc.page_content for doc in docs]
        