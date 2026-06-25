from pypdf import PdfReader
from pathlib import Path

# TESTING PURPOSE
from app.core.config import PDF_PATH

class PDFLoader:
    """
    This class is used to load the pdf file
    """
    def __init__(self, file):
        try:
            if not file:
                raise FileNotFoundError(f"File not found at {file}")
            
            self.file = file
            
        except Exception as e:
            print(e)

    def load_pdf(self)->str:
        try:
            reader = PdfReader(self.file)
            pages_text = []
            
            for page in reader.pages: # .pages func makes a list of pages as PageObj
                text = page.extract_text()
                if text:
                    pages_text.append(text)

            # print(len(pages_text))
            return "\n".join(pages_text)

        except Exception as e:
            print("Invalid PDF: ",e)

# TESTING PURPOSE BLOCK
# if __name__ == "__main__":
#     pdf = PDFLoader(PDF_PATH)
#     pdf.load_pdf()
