from langchain_community.vectorstores import FAISS

class VectorStore:
    """
    FAIIS-based vector store for document retreival
    """

    def __init__(self, embeddings):
        self.embeddings=embeddings
        self.store=None

    def build(self, texts):
        """
        Build FAISS from text chunks.
        """
        self.store=FAISS.from_texts(
            texts=texts,
            embedding=self.embeddings.model
        )

    def search(self, query:str, k:int=3):
        """
        Retrive tok-k relvant chunks
        """
        if self.store is None:
            raise ValueError("Vector Store not initialized")
    
        docs=self.store.similarity_search(query, k=k)
        print(docs)
        return [doc.page_content for doc in docs]
        