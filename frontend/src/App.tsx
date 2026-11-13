import { type FormEvent, useEffect, useState, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { AlertCircle, X, ChevronDown, ChevronUp, FileText, ArrowRight, FaceSlightlySmilingIcon } from 'lucide-react'
import { Header } from './components/Header'
import { DocumentUpload } from './components/DocumentUpload'
import { ChatMessageItem } from './components/ChatMessageItem'
import { ChatInput } from './components/ChatInput'
import { LoadingIndicator } from './components/LoadingIndicator'
import type { ChatMessage, ProcessingStage } from './types/chat'
import { express_api } from './axios'

const SUGGESTION_PROMPTS = [
  'Summarize the core syllabus units',
  'What are the key exam-oriented topics?',
  'List high-yield definitions and formulas',
]

function App() {
  const [question, setQuestion] = useState('')
  const [notesFiles, setNotesFiles] = useState<File[]>([])
  const [syllabusFiles, setSyllabusFiles] = useState<File[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState<ProcessingStage>('idle')
  const [chat, setChat] = useState<boolean>(false)
  const [error, setError] = useState('')
  const [uid, setUid] = useState<string>('')
  const [isDocsCollapsed, setIsDocsCollapsed] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize unique session ID
  useEffect(() => {
    setUid(uuidv4())
  }, [])

  // Auto-scroll to latest message or indicator
  useEffect(() => {
    if (messages.length > 0 || loading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading, stage])

  // Reset session handler
  const handleResetSession = () => {
    if (loading) return
    setUid(uuidv4())
    setNotesFiles([])
    setSyllabusFiles([])
    setMessages([])
    setQuestion('')
    setChat(false)
    setError('')
    setStage('idle')
    setIsDocsCollapsed(false)
  }

  // For sequential Polling 
  const pollForResult = async (sessionId: string, currentQ: string) => {
    const maxAttempts = 60;
    const pollingInterval = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {

      // Wait 2 seconds before the next poll
      await new Promise(resolve => setTimeout(resolve, pollingInterval));

      const pollRes = await express_api.get(`/express/result/${sessionId}`);
      const pollData = pollRes.data;

      if (pollData.status === 'success') {

        setStage('answering');

        const chatsRes = await express_api.post('/api/chat', {
          session_id: sessionId,
          question: currentQ,
        });

        const chatData = chatsRes.data;

        if (chatData.error) {
          throw new Error(chatData.error);
        }

        const newMessage: ChatMessage = {
          id: uuidv4(),
          question: currentQ,
          answer: chatData.answer ?? 'No answer generated.',
          createdAt: new Date().toISOString(),
        };

        setMessages(prev => [...prev, newMessage]);
        setQuestion('');
        setChat(true);
        setIsDocsCollapsed(true);

        return;
      }

      if (pollData.status === 'failed') {
        throw new Error(
          pollData.error || 'Document processing failed.'
        );
      }
    }

    throw new Error('Document processing timed out. Please try again.');
  };

  // Initial Document Upload + First Question Submit
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmedQuestion = question.trim()

    if (!trimmedQuestion) {
      setError('Please provide a question about your documents.')
      return
    }

    if (notesFiles.length === 0) {
      setError('Please upload at least one Notes PDF document.')
      return
    }

    if (syllabusFiles.length !== 1) {
      setError('Please upload 1 Syllabus PDF document.')
      return
    }

    setLoading(true)
    setStage('uploading')
    setError('')
    const currentQ = trimmedQuestion

    try {
      const formData = new FormData()
      formData.append('question', currentQ)
      notesFiles.forEach((file) => formData.append('notes_pdfs', file))
      syllabusFiles.forEach((file) => formData.append('syllabus_pdf', file))
      formData.append('session_id', uid)

      const response = await express_api.post(`/express/upload`, formData )
      const data = response.data

      if (data.error) {
        setError(data.error || 'Failed to upload documents to server.')
        setLoading(false)
        setStage('idle')
        return
      }

      // Upload successful -> Transition to background processing & vectorizing
      setStage('processing')

      // Calling polling
      try {
        await pollForResult(uid, currentQ);

      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Document processing failed.'
        );

      } finally {
        setLoading(false);
        setStage('idle');
      }

    } catch {
      setError('Could not reach the server. Please verify the backend services are running.')
      setLoading(false)
      setStage('idle')
    }
  }

  // Follow-up Chat Submit
  const handleSubmitChat = async (event: FormEvent) => {
    event.preventDefault()
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion || loading) return

    setLoading(true)
    setStage('answering')
    setError('')
    const currentQ = trimmedQuestion
    setQuestion('')

    try {
      const response = await express_api.post(`/api/chat`, {
        session_id: uid,
        question: currentQ,
      })
      const data = response.data

      if (data.error) {
        const errorMsg: ChatMessage = {
          id: uuidv4(),
          question: currentQ,
          answer: data.error || 'Failed to retrieve answer from assistant.',
          createdAt: new Date().toISOString(),
          isError: true,
        }
        setMessages((prev) => [...prev, errorMsg])
        return
      }

      const newMessage: ChatMessage = {
        id: uuidv4(),
        question: currentQ,
        answer: data.answer ?? '',
        createdAt: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, newMessage])
    } catch {
      setError('Could not reach the chat backend. Please try again.')
    } finally {
      setLoading(false)
      setStage('idle')
    }
  }

  const isFormValid =
    question.trim().length > 0 &&
    notesFiles.length > 0 &&
    notesFiles.length <= 3 &&
    syllabusFiles.length === 1

  return (
    <div className="page-shell">
      {/* Top Application Header */}
      <Header
        onReset={handleResetSession}
        hasSession={!!uid}
        notesCount={notesFiles.length}
        hasSyllabus={syllabusFiles.length === 1}
        isChatActive={chat}
      />

      <main className="main-content">
        {/* Error notification banner */}
        {error && (
          <div className="status-toast error-toast" role="alert">
            <AlertCircle size={18} className="toast-icon" />
            <span className="toast-text">{error}</span>
            <button
              type="button"
              onClick={() => setError('')}
              className="toast-close-btn"
              aria-label="Dismiss error"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Initial Hero Section (shown only before chat begins) */}
        {!chat && (
          <div className="hero-panel">
            <div className="hero-badge">
              <FaceSlightlySmilingIcon size={16} />
              <span>Next-Gen RAG Engine</span>
            </div>
            <h1 className="hero-title">
              Chat with your <span className="gradient-text">Notes &amp; Syllabus</span>
            </h1>
            <p className="hero-description">
              Upload your lecture notes, textbook chapters, or academic papers alongside your course
              syllabus. NotesAssist indexes your documents and generates precise, grounded answers in
              seconds.
            </p>
          </div>
        )}

        {/* Collapsible Document Summary Bar (when chat is active) */}
        {chat && (
          <div className="active-docs-bar">
            <div className="docs-bar-info">
              <div className="docs-status-indicator">
                <span className="pulse-dot" />
                <span className="docs-bar-heading">Active Knowledge Base</span>
              </div>
              <div className="docs-bar-tags">
                <span className="doc-tag">
                  <FileText size={13} />
                  {notesFiles.length} Notes PDF{notesFiles.length > 1 ? 's' : ''}
                </span>
                <span className="doc-tag">
                  <FileText size={13} />
                  1 Syllabus PDF
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDocsCollapsed((prev) => !prev)}
              className="docs-toggle-btn"
              aria-expanded={!isDocsCollapsed}
              title={isDocsCollapsed ? 'Show document files' : 'Hide document files'}
            >
              <span>{isDocsCollapsed ? 'Show Documents' : 'Collapse'}</span>
              {isDocsCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
            </button>
          </div>
        )}

        {/* Document Upload Area (collapsible when chat active, always visible before chat) */}
        {(!chat || !isDocsCollapsed) && (
          <div className={chat ? 'documents-drawer' : ''}>
            <DocumentUpload
              notesFiles={notesFiles}
              syllabusFiles={syllabusFiles}
              onNotesChange={setNotesFiles}
              onSyllabusChange={setSyllabusFiles}
              disabled={loading || chat}
              onError={(msg) => setError(msg)}
            />
          </div>
        )}

        {/* Initial Question Form (shown only before chat starts) */}
        {!chat && (
          <section className="initial-query-section">
            <form className="query-card" onSubmit={handleSubmit}>
              <div className="query-header">
                <label htmlFor="initial-question" className="query-label">
                  Ask your first question
                </label>
                <span className="query-sub">Grounds the index and generates your first answer</span>
              </div>

              <div className="query-input-box">
                <textarea
                  id="initial-question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., Explain the principal theorems in Unit 2 with examples from the syllabus..."
                  rows={2}
                  disabled={loading}
                  className="initial-textarea"
                />

                <div className="query-footer">
                  <div className="requirements-summary">
                    <span className={`req-item ${notesFiles.length > 0 ? 'req-met' : ''}`}>
                      &bull; Notes PDF ({notesFiles.length}/3)
                    </span>
                    <span className={`req-item ${syllabusFiles.length === 1 ? 'req-met' : ''}`}>
                      &bull; Syllabus PDF ({syllabusFiles.length}/1)
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="generate-button"
                    disabled={loading || !isFormValid}
                  >
                    <span>{loading ? 'Processing…' : 'Generate Answer'}</span>
                    <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            </form>
          </section>
        )}

        {/* Chat Message Thread */}
        {messages.length > 0 && (
          <section className="chat-thread" aria-label="Conversation thread">
            {messages.map((message) => (
              <ChatMessageItem key={message.id} message={message} />
            ))}
          </section>
        )}

        {/* Live Processing Indicator */}
        {loading && <LoadingIndicator stage={stage} />}

        {/* Ref for auto-scrolling */}
        <div ref={messagesEndRef} className="scroll-anchor" />
      </main>

      {/* Sticky Bottom Chat Input Bar (active once conversation has started) */}
      {chat && (
        <footer className="sticky-footer">
          <div className="sticky-footer-inner">
            <ChatInput
              value={question}
              onChange={setQuestion}
              onSubmit={handleSubmitChat}
              loading={loading}
              isSticky={true}
              placeholder="Ask a follow-up question about your notes or syllabus..."
              suggestionPrompts={messages.length === 1 ? SUGGESTION_PROMPTS : undefined}
              onSelectSuggestion={(prompt) => {
                setQuestion(prompt)
              }}
            />
          </div>
        </footer>
      )}
    </div>
  )
}

export default App
