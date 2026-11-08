import React from 'react'
import { Loader2, Database, Sparkles, UploadCloud } from 'lucide-react'
import type { ProcessingStage } from '../types/chat'

interface LoadingIndicatorProps {
  stage: ProcessingStage
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ stage }) => {
  const getStageInfo = () => {
    switch (stage) {
      case 'uploading':
        return {
          icon: <UploadCloud className="stage-icon animate-bounce-subtle" size={20} />,
          title: 'Uploading documents',
          desc: 'Transferring your notes and syllabus securely to the processing pipeline...',
          step: 'Step 1 of 3',
        }
      case 'processing':
        return {
          icon: <Database className="stage-icon animate-spin-slow" size={20} />,
          title: 'Parsing & vectorizing',
          desc: 'Chunking text, extracting semantic embeddings, and indexing in vector storage...',
          step: 'Step 2 of 3',
        }
      case 'answering':
      default:
        return {
          icon: <Sparkles className="stage-icon animate-pulse" size={20} />,
          title: 'Generating grounded answer',
          desc: 'Synthesizing context from your syllabus and notes with AI...',
          step: 'Step 3 of 3',
        }
    }
  }

  const info = getStageInfo()

  return (
    <div className="processing-indicator-card">
      <div className="processing-header">
        <div className="processing-icon-box">
          <Loader2 className="processing-spinner animate-spin" size={22} />
        </div>
        <div className="processing-details">
          <div className="processing-title-row">
            <span className="processing-title">{info.title}</span>
            <span className="processing-step-pill">{info.step}</span>
          </div>
          <p className="processing-desc">{info.desc}</p>
        </div>
      </div>

      <div className="processing-progress-bar">
        <div
          className={`progress-fill stage-${stage}`}
        />
      </div>
    </div>
  )
}

