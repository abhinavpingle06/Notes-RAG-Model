import { type ChangeEvent, type FormEvent, useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface AnswerResponse {
  question: string
  answer: string | null
  error?: string
}

function App() {
  const [question, setQuestion] = useState('')
  const [notesFile, setNotesFile] = useState<File | null>(null)
  const [questionFile, setQuestionFile] = useState<File | null>(null)
  const [answer, setAnswer] = useState('')
  const [submittedQuestion, setSubmittedQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    setAnswer('')

    try {
        let formData = new FormData()
        formData.append("question", question);
        formData.append("notes", notesFile);

      const response = await fetch('/api/answer', {
        method: 'POST',
        body: formData,
      })

      const data = (await response.json()) as AnswerResponse
      if (!response.ok || data.error) {
        setError(data.error || 'Failed to load answer.')
        return
      }

      setSubmittedQuestion(question)
      setAnswer(data.answer ?? '')
    } catch (err) {
      setError('Could not reach the backend. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell">
      <div className="hero-panel">
        <div className="hero-badge">RAG Answer Studio - A project made for student by a student</div>
        <h1>Ask your document question</h1>
        <p>Generate a structured answer that keeps paragraph formatting and reads clearly.</p>
      </div>

      <div className="upload-grid">
        <section className="upload-card">
           <div className="upload-row" >
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
          <p className="upload-description">Add an optional question bank or sample exam PDF to enrich the answer context.</p>
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

      {error ? (
        <div className="status-card error-card">{error}</div>
      ) : null}

      {answer ? (
        <section className="answer-card">
          <div className="answer-header">
            <span>Answer for</span>
            <strong>{submittedQuestion}</strong>
          </div>
            <div className="answer-body">
                <ReactMarkdown>{answer}</ReactMarkdown>
            </div>
        </section>
      ) : null}
    </div>
  )
}

export default App
