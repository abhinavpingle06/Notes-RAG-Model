import React, { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { UploadCloud, FileText, X, CheckCircle2, AlertCircle, BookOpen, GraduationCap } from 'lucide-react'
import { formatBytes } from '../utils/formatters'

interface DocumentUploadProps {
  notesFiles: File[]
  syllabusFiles: File[]
  onNotesChange: (files: File[]) => void
  onSyllabusChange: (files: File[]) => void
  disabled?: boolean
  onError: (msg: string) => void
}

const MAX_NOTES_FILES = 3
const MAX_NOTE_SIZE = 10 * 1024 * 1024 // 10 MB
const MAX_SYLLABUS_SIZE = 10 * 1024 * 1024 // 10 MB

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  notesFiles,
  syllabusFiles,
  onNotesChange,
  onSyllabusChange,
  disabled = false,
  onError,
}) => {
  const [isDraggingNotes, setIsDraggingNotes] = useState(false)
  const [isDraggingSyllabus, setIsDraggingSyllabus] = useState(false)

  const notesInputRef = useRef<HTMLInputElement>(null)
  const syllabusInputRef = useRef<HTMLInputElement>(null)

  // Validate and add notes files
  const processNotesFiles = (newFiles: File[]) => {
    const validPdfs = newFiles.filter((f) => f.name.toLowerCase().endsWith('.pdf'))
    if (validPdfs.length !== newFiles.length) {
      onError('Only PDF documents are supported for Notes.')
    }

    if (validPdfs.length === 0) return

    if (validPdfs.length > MAX_NOTES_FILES) {
      onError(`You can upload at most ${MAX_NOTES_FILES} notes PDFs.`)
      return
    }

    for (const f of validPdfs) {
      if (f.size > MAX_NOTE_SIZE) {
        onError(`"${f.name}" exceeds the 10 MB file size limit.`)
        return
      }
    }

    onNotesChange(validPdfs)
  }

  // Validate and add syllabus file
  const processSyllabusFiles = (newFiles: File[]) => {
    const validPdfs = newFiles.filter((f) => f.name.toLowerCase().endsWith('.pdf'))
    if (validPdfs.length !== newFiles.length) {
      onError('Only PDF documents are supported for Syllabus.')
    }

    if (validPdfs.length === 0) return

    if (validPdfs.length > 1) {
      onError('Please upload exactly 1 syllabus PDF.')
    }

    const singleFile = [validPdfs[0]]
    if (singleFile[0].size > MAX_SYLLABUS_SIZE) {
      onError(`"${singleFile[0].name}" exceeds the 10 MB limit.`)
      return
    }

    onSyllabusChange(singleFile)
  }

  const handleNotesDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!disabled) setIsDraggingNotes(true)
  }

  const handleNotesDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDraggingNotes(false)
  }

  const handleNotesDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDraggingNotes(false)
    if (disabled) return
    const dropped = Array.from(e.dataTransfer.files)
    processNotesFiles(dropped)
  }

  const handleSyllabusDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!disabled) setIsDraggingSyllabus(true)
  }

  const handleSyllabusDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDraggingSyllabus(false)
  }

  const handleSyllabusDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDraggingSyllabus(false)
    if (disabled) return
    const dropped = Array.from(e.dataTransfer.files)
    processSyllabusFiles(dropped)
  }

  const removeNoteFile = (index: number) => {
    const updated = notesFiles.filter((_, i) => i !== index)
    onNotesChange(updated)
    if (notesInputRef.current) notesInputRef.current.value = ''
  }

  const removeSyllabusFile = () => {
    onSyllabusChange([])
    if (syllabusInputRef.current) syllabusInputRef.current.value = ''
  }

  return (
    <div className="upload-grid">
      {/* Notes Upload Card */}
      <section className={`upload-card ${isDraggingNotes ? 'drag-active' : ''}`}>
        <div className="card-header">
          <div className="card-title-group">
            <div className="card-icon-tag notes-tag">
              <BookOpen size={16} />
            </div>
            <div>
              <p className="card-kicker">Knowledge Base</p>
              <h2 className="card-title">Study Notes PDFs</h2>
            </div>
          </div>
          <span className={`status-badge ${notesFiles.length > 0 ? 'badge-success' : 'badge-required'}`}>
            {notesFiles.length > 0 ? (
              <>
                <CheckCircle2 size={12} />
                <span>{notesFiles.length}/{MAX_NOTES_FILES} Added</span>
              </>
            ) : (
              <>
                <AlertCircle size={12} />
                <span>Required</span>
              </>
            )}
          </span>
        </div>

        <p className="card-description">
          Upload 1 to 3 PDF lecture notes, textbooks, or research papers for contextual answer grounding.
        </p>

        <div
          className={`dropzone ${disabled ? 'disabled' : ''}`}
          onDragOver={handleNotesDragOver}
          onDragLeave={handleNotesDragLeave}
          onDrop={handleNotesDrop}
          onClick={() => !disabled && notesInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              notesInputRef.current?.click()
            }
          }}
        >
          <input
            ref={notesInputRef}
            type="file"
            accept=".pdf"
            multiple
            disabled={disabled}
            className="visually-hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              if (e.target.files) {
                processNotesFiles(Array.from(e.target.files))
              }
            }}
          />
          <div className="dropzone-content">
            <div className="dropzone-icon-pulse">
              <UploadCloud size={24} />
            </div>
            <div className="dropzone-text">
              <span className="dropzone-primary-text">
                {isDraggingNotes ? 'Drop notes PDFs here' : 'Click to browse or drop notes PDFs'}
              </span>
              <span className="dropzone-secondary-text">PDF format &bull; Max 3 files &bull; Up to 10 MB each</span>
            </div>
          </div>
        </div>

        {notesFiles.length > 0 && (
          <div className="file-chips-container" aria-label="Selected notes files">
            {notesFiles.map((file, idx) => (
              <div key={`${file.name}-${idx}`} className="file-chip">
                <FileText size={15} className="chip-file-icon" />
                <span className="chip-file-name" title={file.name}>
                  {file.name}
                </span>
                <span className="chip-file-size">{formatBytes(file.size)}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeNoteFile(idx)
                    }}
                    className="chip-remove-btn"
                    title={`Remove ${file.name}`}
                    aria-label={`Remove ${file.name}`}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Syllabus Upload Card */}
      <section className={`upload-card syllabus-card ${isDraggingSyllabus ? 'drag-active' : ''}`}>
        <div className="card-header">
          <div className="card-title-group">
            <div className="card-icon-tag syllabus-tag">
              <GraduationCap size={16} />
            </div>
            <div>
              <p className="card-kicker">Academic Scope</p>
              <h2 className="card-title">Syllabus PDF</h2>
            </div>
          </div>
          <span className={`status-badge ${syllabusFiles.length === 1 ? 'badge-success' : 'badge-required'}`}>
            {syllabusFiles.length === 1 ? (
              <>
                <CheckCircle2 size={12} />
                <span>Ready</span>
              </>
            ) : (
              <>
                <AlertCircle size={12} />
                <span>Required</span>
              </>
            )}
          </span>
        </div>

        <p className="card-description">
          Upload 1 syllabus PDF to align responses precisely with your curriculum objectives and marking scheme.
        </p>

        <div
          className={`dropzone ${disabled ? 'disabled' : ''}`}
          onDragOver={handleSyllabusDragOver}
          onDragLeave={handleSyllabusDragLeave}
          onDrop={handleSyllabusDrop}
          onClick={() => !disabled && syllabusInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              syllabusInputRef.current?.click()
            }
          }}
        >
          <input
            ref={syllabusInputRef}
            type="file"
            accept=".pdf"
            disabled={disabled}
            className="visually-hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              if (e.target.files) {
                processSyllabusFiles(Array.from(e.target.files))
              }
            }}
          />
          <div className="dropzone-content">
            <div className="dropzone-icon-pulse">
              <UploadCloud size={24} />
            </div>
            <div className="dropzone-text">
              <span className="dropzone-primary-text">
                {isDraggingSyllabus ? 'Drop syllabus PDF here' : 'Click to browse or drop syllabus PDF'}
              </span>
              <span className="dropzone-secondary-text">PDF format &bull; 1 file &bull; Up to 10 MB</span>
            </div>
          </div>
        </div>

        {syllabusFiles.length > 0 && (
          <div className="file-chips-container" aria-label="Selected syllabus file">
            {syllabusFiles.map((file, idx) => (
              <div key={`${file.name}-${idx}`} className="file-chip syllabus-chip">
                <FileText size={15} className="chip-file-icon" />
                <span className="chip-file-name" title={file.name}>
                  {file.name}
                </span>
                <span className="chip-file-size">{formatBytes(file.size)}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeSyllabusFile()
                    }}
                    className="chip-remove-btn"
                    title={`Remove ${file.name}`}
                    aria-label={`Remove ${file.name}`}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

