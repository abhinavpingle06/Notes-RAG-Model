import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { v4 as uuidv4 } from 'uuid'

interface AnswerResponse {
  question: string
  answer: string | null
  error?: string
}

interface ChatMessage {
  question: string
  answer: string
  createdAt: string
}

function App() {
  const [question, setQuestion] = useState('')
  const [notesFile, setNotesFile] = useState<File | null>(null)
  const [questionFile, setQuestionFile] = useState<File | null>(null)
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
    setNotesFile(event.target.files?.[0] ?? null)
  }

  const handleQuestionFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuestionFile(event.target.files?.[0] ?? null)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!question.trim() || !notesFile) return

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('question', question)
      formData.append('notes', notesFile)
      if (questionFile) {
        formData.append('question_file', questionFile)
      }
      
      formData.append('session_id', uid)

      const response = await fetch('/api/answer', {
        method: 'POST',
        body: formData,
      })

      const data = (await response.json()) as AnswerResponse
      if (!response.ok || data.error) {
        setError(data.error || 'Failed to load answer.')
        return
      }

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

  const handleSubmitChat = async (event: FormEvent) => {
    event.preventDefault()
    if (!question.trim()) return

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('question', question)
      formData.append('session_id', uid)

      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      })

      const data = (await response.json()) as AnswerResponse
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
              <h2>Notes PDF</h2>
            </div>
            <span className="upload-chip required">Required</span>
          </div>
          <p className="upload-description">This file is necessary for grounding answers in your document content.</p>
          <label className="file-picker" htmlFor="notesFile">
            <span>{notesFile ? notesFile.name : 'Select notes PDF'}</span>
            <input id="notesFile" type="file" accept=".pdf" onChange={handleNotesChange} />
          </label>
          <p className="upload-helper">Supported format: PDF only.</p>
        </section>

        <section className="upload-card secondary-card">
          <div className="upload-row">
            <div>
              <p className="upload-label">Upload the question bank</p>
              <h2>Question PDF</h2>
            </div>
            <span className="upload-chip optional">Optional</span>
          </div>
          <p className="upload-description">Add an optional question bank or sample exam PDF to get the answers with syllabus context.</p>
          <label className="file-picker" htmlFor="questionFile">
            <span>{questionFile ? questionFile.name : 'Select optional question PDF'}</span>
            <input id="questionFile" type="file" accept=".pdf" onChange={handleQuestionFileChange} />
          </label>
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

        <button type="submit" className="generate-button" disabled={loading || !question.trim() || !notesFile}>
          {loading ? 'Generating…' : 'Generate Answer'}
        </button>
        {!notesFile ? <p className="field-note">Notes upload is required before generating an answer.</p> : null}
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

        <button type="submit" className="generate-button" disabled={loading || !question.trim() || !notesFile}>
          {loading ? 'Sending…' : 'Send'}
        </button>
      </form> }
    </div>
  )
}

export default App
