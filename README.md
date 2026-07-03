# 📚 Notes RAG Model

A Retrieval-Augmented Generation (RAG) application that allows users to upload PDF notes and ask questions about their content.

The system extracts text from PDFs, splits it into chunks, converts those chunks into embeddings, stores them in a Redis vector store, retrieves the most relevant context using semantic search, and generates answers using Llama 3.370B and for context-aware response using Groq.

---

## 🚀 Features

- Upload PDF documents
- Extract and process text from PDFs
- Intelligent text chunking
- Generate embeddings using HuggingFace models
- Semantic search using FAISS
- Context-aware question answering
- FastAPI backend
- Groq-powered LLM responses
- Modular and extensible RAG architecture

---

## 🏗️ Architecture

### Indexing Pipeline

```text
PDF
 ↓
Text Extraction
 ↓
Chunking
 ↓
Generate Embeddings
 ↓
FAISS Vector Store
```

### Query Pipeline

```text
User Query
 ↓
Generate Query Embedding
 ↓
Similarity Search
 ↓
Top-K Relevant Chunks
 ↓
LLM (Llama 3.3 70B)
 ↓
Answer
```

---

## 🛠️ Tech Stack

### Backend

- FastAPI
- LangChain
- FAISS
- PyPDF

### Embeddings

- HuggingFace Embeddings
- BAAI/bge-small-en-v1.5

### LLM

- Groq API
- Llama 3.3 70B

### Frontend (Upcoming)

- React
- Vite

---

## 📂 Project Structure

```text
Notes-RAG-Model/
│
├── app/
│   ├── loader.py
│   ├── chunker.py
│   ├── embeddings.py
│   ├── vectorstore.py
│   └── engine.py
│    
│
├── data/
│
├── vector_store/
│
├── main.py
├── requirements.txt
│
└── README.md
```

---

## ⚙️ Installation

### Clone the Repository

```bash
git clone https://github.com/abhinavpingle06/Notes-RAG-Model.git

cd Notes-RAG-Model
```

### Create Virtual Environment

```bash
python -m venv venv
```

### Activate Virtual Environment

#### Windows

```bash
venv\Scripts\activate
```

#### Linux / macOS

```bash
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
GROQ_API_KEY=your_groq_api_key
```

---

## ▶️ Run the Application

```bash
uvicorn app.main:app --reload
```

Server will start at:

```text
http://127.0.0.1:8000
```

---

## 🌱 What I Learned Building This Project

- How Retrieval-Augmented Generation (RAG) works
- Text chunking strategies
- Embeddings and vector representations
- Semantic search with FAISS
- Similarity-based retrieval
- Context injection into LLM prompts
- Building APIs with FastAPI
- Integrating Groq-hosted LLMs

---

## 🔮 Future Improvements

- React + Vite frontend
- Better response formatting
- Chat history support
- Metadata filtering
- Hybrid search (keyword + semantic)
- Reranking for improved retrieval quality
- Support for multiple document uploads

---

## 🤝 Contributions

Suggestions, issues, and improvements are welcome.

Feel free to fork the repository and create a pull request.

---

## 📜 License

This project is licensed under the MIT License.

---

## ⭐ Support

If you found this project helpful, consider giving it a star on GitHub!

```
⭐ Star the repository if you like the project.
```

