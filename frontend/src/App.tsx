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
  const [syllabusFiles, setsyllabusFiles] = useState<File[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [chat , setChat] = useState<boolean>(false)
  const [error, setError] = useState('')
  const [uid, setUid] = useState<string | Blob >("")

  useEffect(() => {
    // const saved = window.localStorage.getItem('rag-chat-history')
    // if (saved) {
    //   try {
    //     setMessages(JSON.parse(saved))
    //   } catch {
    //     setMessages([])
    //   }
    // }

    const uuid = uuidv4()
    setUid(uuid)
    console.log(uuid)
  }, [])

  // useEffect(() => {
  //   window.localStorage.setItem('rag-chat-history', JSON.stringify(messages))
  // }, [messages])

  const handleNotesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
    const MAX_FILES = 3;
    const files = event.target.files ? Array.from(event.target.files) : [];

    if (files.length > MAX_FILES) {
      alert(`You can upload a maximum of ${MAX_FILES} files.`);
      return;
    }

    for (const file of files) {
      if (file.size > MAX_SIZE) {
        alert(`${file.name} is larger than 10 MB.`);
        event.target.value = "";
        return;
      }
    }

    setNotesFiles(files);
  }

  const handleSyllabusChange = (event: ChangeEvent<HTMLInputElement>) => {
    const MAX_SIZE = 4 * 1024 * 1024; // 4 MB
    const files = event.target.files ? Array.from(event.target.files) : [];

    for (const file of files) {
      if (file.size > MAX_SIZE) {
        alert(`${file.name} is larger than 10 MB.`);
        event.target.value = ""; // Clear the input
        return;
      }
    }
    setsyllabusFiles(event.target.files ? Array.from(event.target.files) : [])
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
      syllabusFiles.forEach((file) => formData.append('pdfs', file))
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
              <p className="upload-label">Upload the Syllabus PDF</p>
              <h2>Syllabus PDFs</h2>
            </div>
            <span className="upload-chip required">Required</span>
          </div>
          <p className="upload-description">Upload syllabus PDF file. This document will be used to provide syllabus-specific context and improve the accuracy of responses.</p>
          <label className="file-picker" htmlFor="questionFile">
            <span>{syllabusFiles.length > 0 ? `${syllabusFiles.length} selected file${syllabusFiles.length > 1 ? 's' : ''}` : 'Select optional question PDF(s)'}</span>
            <input id="questionFile" type="file" accept=".pdf" onChange={handleSyllabusChange}/>
          </label>
          {syllabusFiles.length > 0 ? (
            <div className="file-list">
              {syllabusFiles.map((file, index) => (
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

        <button type="submit" className="generate-button" disabled={loading || !question.trim() || notesFiles.length === 0 || syllabusFiles.length != 1}>
          {loading ? 'Generating…' : 'Generate Answer'}
        </button>
        {notesFiles.length === 0 || syllabusFiles.length != 1 ? <p className="field-note">Upload at least one notes PDF before generating an answer.</p> : null}
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
