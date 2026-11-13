import React from 'react'
import { Sparkles, RotateCcw, FileText, CheckCircle2, Space, AppleIcon, NotebookDotIcon, DownloadCloudIcon, NotebookPen, NotepadTextDashedIcon, NotepadText, NotebookTabs, EighthNotesIcon, BotMessageSquare } from 'lucide-react'

interface HeaderProps {
  onReset: () => void
  hasSession: boolean
  notesCount: number
  hasSyllabus: boolean
  isChatActive: boolean
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  notesCount,
  hasSyllabus,
  isChatActive,
}) => {
  return (
    <header className="app-header">
      <div className="header-brand">
        {/* <div className="brand-icon-wrapper"> */}
          <BotMessageSquare className="brand-icon" size={35} />
        {/* </div> */}
        <div className="brand-text">
          <div className="brand-title-row">
            <span className="brand-title">NotesAssist</span>
            <span className="brand-badge">RAG AI</span>
          </div>
          <p className="brand-subtitle">Context-grounded document intelligence</p>
        </div>
      </div>

      <div className="header-actions">
        {isChatActive && (
          <div className="doc-summary-badge" title="Active indexed documents">
            <FileText size={14} className="doc-icon" />
            <span>
              {notesCount} note{notesCount > 1 ? 's' : ''} &bull; {hasSyllabus ? 'Syllabus loaded' : 'No syllabus'}
            </span>
            <CheckCircle2 size={13} className="active-dot" />
          </div>
        )}

        {(isChatActive || notesCount > 0 || hasSyllabus) && (
          <button
            type="button"
            onClick={onReset}
            className="header-btn reset-btn"
            title="Start a new session with new documents"
          >
            <RotateCcw size={15} />
            <span className="btn-label">New Session</span>
          </button>
        )}
      </div>
    </header>
  )
}

