from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List
import re

class LangchainTextChunker:
    """
    Uses Langchain's RecursiveCharacterTextSpiiter for production grade chunking
    """
    SUBJECT_PATTERN = re.compile(
        r"Paper\s*/\s*Subject\s*Code:\s*\d+\s*/\s*(.+)"
    )

    QUESTION_PATTERN = re.compile(
        r"([A-Z]\)\s*[\s\S]*?)(?=[A-Z]\)|Q\.\d+|\Z)",
        re.MULTILINE
    )

    def __init__(self, chunk_size: int, chunk_overlap: int):
        SUBJECT_PATTERN = re.compile(
        r"Paper\s*/\s*Subject\s*Code:\s*\d+\s*/\s*(.+)"
        )

        QUESTION_PATTERN = re.compile(
        r"([A-Z]\)\s*[\s\S]*?)(?=[A-Z]\)|Q\.\d+|\Z)",
        re.MULTILINE
        )   
    
    def chunk(self, text: str)-> List[str]:
        # Extract subject
        match = self.SUBJECT_PATTERN.search(text)
        subject = match.group(1).strip() if match else "Unknown"

        chunks = []

        for question in self.QUESTION_PATTERN.findall(text):
            # Remove A), B)...
            question = re.sub(r"^[A-Z]\)\s*", "", question)

            # Remove marks like (10)
            question = re.sub(r"\(\d+\)\s*$", "", question)

            question = " ".join(question.split())

            chunks.append(
                f"[QUESTION]\n{question}\n\n[SUBJECT]\n{subject}"
            )

        return chunks