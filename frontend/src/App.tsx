import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { v4 as uuidv4 } from 'uuid'

// interface AnswerResponse {
//   question: string
//   answer: string | null
//   error?: string
// }

interface ChatMessage {
  question: string
  answer: string
  createdAt: string
}

function App() {
  const [question, setQuestion] = useState('')
  const [notesFiles, setNotesFiles] = useState<File[]>([])
  const [questionFiles, setQuestionFiles] = useState<File[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [chat , setChat] = useState<boolean>(false)
  const [error, setError] = useState('')
  const [uid, setUid] = useState<string | null>(null)

  useEffect(() => {
    const saved = window.localStorage.getItem('rag-chat-history')
    if (saved) {
      try {
        setMessages(JSON.parse(saved))
      } catch {
        setMessages([])
      }
    }

    const uuid = uuidv4()
    setUid(uuid)
    console.log(uuid)
  }, [])

  useEffect(() => {
    window.localStorage.setItem('rag-chat-history', JSON.stringify(messages))
  }, [messages])

  const handleNotesChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNotesFiles(event.target.files ? Array.from(event.target.files) : [])
  }

  const handleQuestionFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuestionFiles(event.target.files ? Array.from(event.target.files) : [])
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!question.trim() || notesFiles.length === 0) return

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('question', question)
      notesFiles.forEach((file) => formData.append('pdfs', file))
      questionFiles.forEach((file) => formData.append('pdfs', file))
      formData.append('session_id', uid)

      const response = await fetch('/express/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!response.ok || data.error) {
        setError(data.error || 'Failed to load answer.')
        return
      }

      // Now we will start polling 
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/express/result/${uid}`)
          const data = await response.json();

          if (data.status === "success") {
            // If success - call the chat route
            clearInterval(interval)
            const chatsRes = await fetch(`/api/chat`,{
              method:"POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                "session_id":uid,
                "question":question,
              })
            })
            // console.log(await chatsRes.text());
            const data = await chatsRes.json()
            const newMessage: ChatMessage = {
              question,
              answer: data.answer ?? '',
              createdAt: new Date().toISOString(),
            }
            setMessages((prev) => [...prev, newMessage])
            setQuestion('')
            clearInterval(interval)
            setLoading(false)
            setChat(true)
          }

          if (data.status === "failed") {
            const newMessage: ChatMessage = {
              question,
              answer: data.error ?? '',
              createdAt: new Date().toISOString(),
            }
            setMessages((prev) => [...prev, newMessage])
            setQuestion('')
            clearInterval(interval)
            setLoading(false)
            setChat(true)
          }

          console.log("processing...")
        } catch (error) {
          clearInterval(interval);
          setLoading(false);
          setError("Polling failed");
          setChat(true)
        }
        
      },2000)

    } catch (err) {
      setError('Could not reach the backend. Please try again.')
    }
  }

  const handleSubmitChat = async (event: FormEvent) => {
    event.preventDefault()
    if (!question.trim()) return

    setLoading(true)
    setError('')

    try {
      // const formData = new FormData()
      // formData.append('question', question)
      // formData.append('session_id', uid)

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: uid,
          question: question,
        }),
      })

      const data = await response.json()
      if (!response.ok || data.error) {
        setError(data.error || 'Failed to load answer.')
        return
      }

      console.log(data)

      const newMessage: ChatMessage = {
        question,
        answer: data.answer ?? '',
        createdAt: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, newMessage])
      setQuestion('')

      setChat(true)

    } catch (err) {
      setError('Could not reach the backend. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell">
      <div className="hero-panel">
        <div className="hero-badge">
          NotesAssist
        </div>
        <h1>Ask your document question</h1>
        <p>Upload your notes, PDFs, or research papers and ask questions in natural
          language. Get structured, context-aware answers in seconds.
        </p>
      </div>

      <div className="upload-grid">
        <section className="upload-card">
          <div className="upload-row">
            <div>
              <p className="upload-label">Upload the notes</p>
              <h2>Notes PDFs</h2>
            </div>
            <span className="upload-chip required">Required</span>
          </div>
          <p className="upload-description">Upload one or more notes PDFs to ground answer generation in your document content.</p>
          <label className="file-picker" htmlFor="notesFile">
            <span>{notesFiles.length > 0 ? `${notesFiles.length} selected file${notesFiles.length > 1 ? 's' : ''}` : 'Select notes PDF(s)'}</span>
            <input id="notesFile" type="file" accept=".pdf" multiple onChange={handleNotesChange} />
          </label>
          {notesFiles.length > 0 ? (
            <div className="file-list">
              {notesFiles.map((file, index) => (
                <span key={index} className="file-chip">{file.name}</span>
              ))}
            </div>
          ) : null}
          <p className="upload-helper">Supported format: PDF only.</p>
        </section>

        <section className="upload-card secondary-card">
          <div className="upload-row">
            <div>
              <p className="upload-label">Upload the question bank</p>
              <h2>Question Bank PDFs</h2>
            </div>
            <span className="upload-chip optional">Optional</span>
          </div>
          <p className="upload-description">Add one or more optional question bank PDFs to help the assistant answer with syllabus and sample question context.</p>
          <label className="file-picker" htmlFor="questionFile">
            <span>{questionFiles.length > 0 ? `${questionFiles.length} selected file${questionFiles.length > 1 ? 's' : ''}` : 'Select optional question PDF(s)'}</span>
            <input id="questionFile" type="file" accept=".pdf" multiple onChange={handleQuestionFileChange} />
          </label>
          {questionFiles.length > 0 ? (
            <div className="file-list">
              {questionFiles.map((file, index) => (
                <span key={index} className="file-chip">{file.name}</span>
              ))}
            </div>
          ) : null}
          <p className="upload-helper">Supported format: PDF only.</p>
        </section>
      </div>

      <form className="query-card" onSubmit={handleSubmit}>
        <label htmlFor="question">Question</label>
        <input
          id="question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about the document content..."
          autoComplete="off"
        />

        <button type="submit" className="generate-button" disabled={loading || !question.trim() || notesFiles.length === 0}>
          {loading ? 'Generating…' : 'Generate Answer'}
        </button>
        {notesFiles.length === 0 ? <p className="field-note">Upload at least one notes PDF before generating an answer.</p> : null}
      </form>

      {error ? <div className="status-card error-card">{error}</div> : null}

      {messages.map((message, index) => (
        <article key={index} className="message-card">
          <div className="message-bubble question-bubble">
            <div className="message-tag">You</div>
            <p className="message-content">{message.question}</p>
          </div>
          <div className="message-bubble answer-bubble">
            <div className="message-tag answer-tag">Assistant</div>
            <div className="message-content">
              <ReactMarkdown>{message.answer}</ReactMarkdown>
            </div>
          </div>
        </article>
      ))}

      { chat && <form className="query-card sticky-form" onSubmit={handleSubmitChat}>
        <label htmlFor="question">Your question</label>
        <input
          id="question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about the document content..."
          autoComplete="off"
        />

        <button type="submit" className="generate-button" disabled={loading || !question.trim() || notesFiles.length === 0}>
          {loading ? 'Sending…' : 'Send'}
        </button>
      </form> }
    </div>
  )
}

export default App
