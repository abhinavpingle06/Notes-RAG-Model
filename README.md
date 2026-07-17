# 📚 Notes RAG Model

A Full-Stack **Retrieval-Augmented Generation (RAG)** application that allows users to upload PDF notes, process them into embeddings, and ask natural language questions to receive context-aware answers powered by Large Language Models (LLMs).

<div align="center">
  <img width="800" height="591" alt="1782977262403" src="https://github.com/user-attachments/assets/3ace95a6-1884-4ce2-9f0f-22aeecf9af31" />
</div>

---

## ✨ Features

- 📄 Upload PDF notes
- 🔍 Extract and preprocess document text
- ✂️ Intelligent text chunking
- 🧠 Generate embeddings using Hugging Face models
- 📦 Store embeddings in Redis Vector Store
- ⚡ Semantic similarity search
- 🤖 Context-aware responses using Groq LLMs
- 🌐 React frontend for chat interface
- 🚀 Express backend for file uploads and APIs
- 🔄 Background processing using BullMQ workers
- 🐳 Docker support for easy deployment

---

# 🏗️ System Architecture

```text
                User
                  │
                  ▼
         React Frontend (Vite)
                  │
                  ▼
         Express Backend API
                  │
      Upload PDF / Ask Question
                  │
     ┌────────────┴────────────┐
     ▼                         ▼
 BullMQ Worker           AI Service (FastAPI)
     │                         │
 PDF Processing          Query Processing
     │                         │
 Text Extraction      Generate Query Embedding
     │                         │
 Chunking             Semantic Search
     │                         │
 Embedding Generation         ▼
     │                Retrieve Relevant Chunks
     └──────────────► Redis Vector Store
                              │
                              ▼
                     Groq Llama Model
                              │
                              ▼
                         Final Answer
```

---

# 🛠 Tech Stack

## Frontend

- React
- Vite
- TypeScript
- React Markdown

## Backend

- Express.js
- Node.js
- BullMQ
- Multer
- Redis

## AI Service

- FastAPI
- LangChain
- HuggingFace Embeddings
- Redis Vector Store
- Groq API
- Llama 3

## Infrastructure

- Docker
- Docker Compose
- Redis Stack

---

# 📂 Project Structure

```text
Notes-RAG-Model
│
├── frontend/              # React application
│
├── backend/               # Express server + BullMQ worker
│
├── app/
│   ├── core/
│   │     ├── config.py
│   │     └── redis.py
│   │
│   └── rag/
│         ├── loader.py
│         ├── chunker.py
│         ├── embeddings.py
│         ├── vectorstore.py
│         └── engine.py
│
├── data/                  # Sample PDFs
│
├── docker-compose.yml
│
└── README.md
```

---

# 🚀 Workflow

## 1. Upload Notes

The user uploads one or more PDF documents through the frontend.

↓

## 2. Background Processing

BullMQ worker:

- extracts text
- splits into chunks
- generates embeddings
- stores vectors in Redis

↓

## 3. Ask Questions

Users ask questions about uploaded notes.

↓

## 4. Retrieval

The AI service:

- embeds the query
- performs semantic search
- retrieves the most relevant chunks

↓

## 5. Response Generation

Relevant context is sent to the Groq-hosted LLM, which generates an accurate answer.

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/Notes-RAG-Model.git

cd Notes-RAG-Model
```

---

## Environment Variables

Create a `.env` file.

```env
GROQ_API_KEY=your_groq_api_key

REDIS_HOST=redis
REDIS_PORT=6379

PORT=3000
```

---

## Run with Docker

```bash
docker compose up --build
```

Services:

| Service | Port |
|----------|------|
| Frontend | 5173 |
| Backend | 3000 |
| AI Service | 8000 |
| Redis | 6379 |
| Redis Insight | 8001 |

---

# 💬 API Flow

```text
Frontend
    │
    ▼
Express Backend
    │
    ▼
BullMQ Queue
    │
    ▼
Worker
    │
    ▼
FastAPI AI Service
    │
    ▼
Redis Vector Store
    │
    ▼
Groq LLM
```

---

# 📚 Technologies Used

- Retrieval-Augmented Generation (RAG)
- Semantic Search
- Vector Databases
- LangChain
- Hugging Face Embeddings
- Redis Stack
- BullMQ
- FastAPI
- Express
- Docker

---

# 🚀 Future Improvements

- Authentication
- Multiple user workspaces
- Conversation history
- Hybrid search (Keyword + Semantic)
- Document metadata filtering
- Streaming responses
- Citation support
- Multi-document collections
- Better reranking

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature-name
```

3. Commit changes

```bash
git commit -m "Added feature"
```

4. Push

```bash
git push origin feature-name
```

5. Open a Pull Request

---

# 📄 License

This project is licensed under the MIT License.

---

# ⭐ Support

If you found this project useful:

- ⭐ Star the repository
- 🍴 Fork it
- 🛠️ Contribute improvements

It helps support future development.
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

