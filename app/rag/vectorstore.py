from langchain_redis import RedisVectorStore
from redisvl.query.filter import Tag

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

        self.store=RedisVectorStore.from_texts(
            index_name="index-pdf",
            metadatas=metadatas,
            texts=texts,
            embedding=self.embeddings.model,
            redis_url="redis://localhost:6379"
        )

    def search(self, query:str, k:int=3):
        """
        Retrive tok-k relvant chunks
        """
        if self.store is None:
            raise ValueError("Vector Store not initialized")
    
        docs=self.store.similarity_search(
            query, 
            k=k,
            filter=Tag("session_id") == self.session_id,
        )
        
        print(docs)
        return [doc.page_content for doc in docs]
        