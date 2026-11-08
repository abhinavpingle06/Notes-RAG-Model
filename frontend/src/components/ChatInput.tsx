import React, { useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react'
import { Send, Sparkles, Loader2 } from 'lucide-react'

interface ChatInputProps {
  value: string
  onChange: (val: string) => void
  onSubmit: (e: FormEvent) => void
  loading: boolean
  placeholder?: string
  isSticky?: boolean
  disabled?: boolean
  suggestionPrompts?: string[]
  onSelectSuggestion?: (prompt: string) => void
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  loading,
  placeholder = 'Ask a question grounded in your documents...',
  isSticky = false,
  disabled = false,
  suggestionPrompts,
  onSelectSuggestion,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const newHeight = Math.min(textareaRef.current.scrollHeight, 160)
      textareaRef.current.style.height = `${Math.max(newHeight, 52)}px`
    }
  }, [value])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!loading && !disabled && value.trim()) {
        onSubmit(e as unknown as FormEvent)
      }
    }
  }

  return (
    <div className={`chat-input-wrapper ${isSticky ? 'sticky-docked' : ''}`}>
      {suggestionPrompts && suggestionPrompts.length > 0 && (
        <div className="suggestion-pills-row">
          <span className="suggestion-label">
            <Sparkles size={13} />
            Try asking:
          </span>
          <div className="suggestion-scroll">
            {suggestionPrompts.map((prompt, i) => (
              <button
                key={i}
                type="button"
                className="suggestion-pill"
                onClick={() => onSelectSuggestion?.(prompt)}
                disabled={loading || disabled}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      <form className="chat-form-bar" onSubmit={onSubmit}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={loading || disabled}
          rows={1}
          className="chat-textarea"
          aria-label="Ask document question"
        />

        <button
          type="submit"
          className="chat-send-btn"
          disabled={loading || disabled || !value.trim()}
          title="Send question"
          aria-label="Send question"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>

      <div className="chat-input-hint">
        <span>Press <kbd>Enter ↵</kbd> to send &bull; <kbd>Shift + Enter</kbd> for line break</span>
      </div>
    </div>
  )
}

