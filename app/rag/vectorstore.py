
import logging
import time

from qdrant_client import QdrantClient, models
from langchain_qdrant import QdrantVectorStore

from app.core.config import (
    QDRANT_URL,
    QDRANT_COLLECTION,
    TOP_K,
    VECTOR_TTL
)

logger = logging.getLogger(__name__)


class VectorStore:

    def __init__(self, embeddings):

        self.embeddings = embeddings

        self.client = QdrantClient(
            url=QDRANT_URL
        )

        # Get embedding dimensions
        dimension = len(
            embeddings.embed_query("dimension test")
        )

        # Create collection if it doesn't exist
        if not self.client.collection_exists(
            collection_name=QDRANT_COLLECTION
        ):

            self.client.create_collection(
                collection_name=QDRANT_COLLECTION,
                vectors_config=models.VectorParams(
                    size=dimension,
                    distance=models.Distance.COSINE
                )
            )

        # Index payload fields for filtering
        self.client.create_payload_index(
            collection_name=QDRANT_COLLECTION,
            field_name="metadata.session_id",
            field_schema=models.PayloadSchemaType.KEYWORD
        )

        self.client.create_payload_index(
            collection_name=QDRANT_COLLECTION,
            field_name="metadata.expires_at",
            field_schema=models.PayloadSchemaType.INTEGER
        )

        self.store = QdrantVectorStore(
            client=self.client,
            collection_name=QDRANT_COLLECTION,
            embedding=embeddings.model,
        )

        logger.info("Qdrant initialized successfully")

    def add(self, session_id, texts):

        expires_at = int(time.time()) + VECTOR_TTL

        from langchain_core.documents import Document

        documents = [
            Document(
                page_content=text,
                metadata={
                    "session_id": session_id,
                    "expires_at": expires_at
                }
            )
            for text in texts
        ]

        if documents:
            self.store.add_documents(documents)

        logger.info(
            "Inserted %s chunks for session %s",
            len(documents),
            session_id
        )

    def search(self, session_id, query):

        current_time = int(time.time())

        search_filter = models.Filter(
            must=[
                models.FieldCondition(
                    key="metadata.session_id",
                    match=models.MatchValue(
                        value=session_id
                    )
                ),
                models.FieldCondition(
                    key="metadata.expires_at",
                    range=models.Range(
                        gt=current_time
                    )
                )
            ]
        )

        docs = self.store.similarity_search(
            query=query,
            k=TOP_K,
            filter=search_filter
        )

        return [
            doc.page_content for doc in docs
        ]

    def cleanup_expired(self):

        current_time = int(time.time())

        self.client.delete(
            collection_name=QDRANT_COLLECTION,
            points_selector=models.FilterSelector(
                filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="metadata.expires_at",
                            range=models.Range(
                                lt=current_time
                            )
                        )
                    ]
                )
            )
        )

        logger.info("Expired vectors cleaned up")

    def close(self):

        self.client.close()
