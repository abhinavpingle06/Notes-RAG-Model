import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { User, Bot, Copy, Check, AlertCircle } from 'lucide-react'
import type { ChatMessage } from '../types/chat'
import { formatTime } from '../utils/formatters'

interface ChatMessageItemProps {
  message: ChatMessage
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.answer)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      setCopied(false)
    }
  }

  return (
    <article className="chat-turn-container">
      {/* User Question */}
      <div className="message-wrapper user-wrapper">
        <div className="message-avatar user-avatar" title="You">
          <User size={16} />
        </div>
        <div className="message-box user-box">
          <div className="message-meta">
            <span className="sender-name">You</span>
            {message.createdAt && <span className="message-time">{formatTime(message.createdAt)}</span>}
          </div>
          <div className="user-message-text">{message.question}</div>
        </div>
      </div>

      {/* Assistant Answer */}
      <div className="message-wrapper assistant-wrapper">
        <div className={`message-avatar assistant-avatar ${message.isError ? 'error-avatar' : ''}`} title="NotesAssist AI">
          {message.isError ? <AlertCircle size={16} /> : <Bot size={16} />}
        </div>
        <div className={`message-box assistant-box ${message.isError ? 'error-box' : ''}`}>
          <div className="message-meta assistant-meta">
            <div className="assistant-badge-group">
              <span className="sender-name">NotesAssist AI</span>
              <span className="model-chip">RAG Grounded</span>
            </div>
            <div className="message-actions">
              {message.createdAt && <span className="message-time">{formatTime(message.createdAt)}</span>}
              {!message.isError && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="copy-btn"
                  title={copied ? 'Copied to clipboard' : 'Copy answer'}
                  aria-label="Copy answer to clipboard"
                >
                  {copied ? (
                    <>
                      <Check size={13} className="text-success" />
                      <span className="copy-label">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span className="copy-label">Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="markdown-content">
            <ReactMarkdown>{message.answer}</ReactMarkdown>
          </div>
        </div>
      </div>
    </article>
  )
}

