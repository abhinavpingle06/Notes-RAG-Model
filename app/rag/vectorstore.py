import logging

from langchain_redis import RedisVectorStore
from qdrant_client import QdrantClient, models
from langchain_qdrant import QdrantVectorStore
from langchain_core.documents import Document

logger = logging.getLogger(__name__)

class VectorStore:
    def __init__(self, embeddings, redis_config):
        self.embeddings = embeddings

        dimension = len(embeddings.embed_query("dimension test"))
        if not self.client.collection_exists(collection_name="notes_collection"):
            self.client.create_collection(
                collection_name="notes_collection",
                vectors_config=models.VectorParams(
                    size=dimension,
                    distance=models.Distance.COSINE
                )
            )
        self.store = QdrantVectorStore(
            client=self.client,
            collection_name="notes_collection",
            embedding=embeddings.model,
        )

    def add(self, session_id, texts):
        documents = [
            Document(
                page_content=text,
                metadata={
                    "session_id": session_id
                }
            )
            for text in texts
        ]
        if documents:
            self.store.add_documents(documents)

    def search(self, session_id, query):
        session_filter = models.Filter(
            must=[
                models.FieldCondition(
                    key="metadata.session_id",
                    match=models.MatchValue(
                        value=session_id
                    )
                )
            ]
        )

        docs = self.store.similarity_search(
            query=query,
            k=3,
            filter=session_filter
        )

        return [
            doc.page_content for doc in docs
        ]
    
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
        