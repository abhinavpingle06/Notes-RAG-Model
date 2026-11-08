export interface ChatMessage {
  id: string
  question: string
  answer: string
  createdAt: string
  isError?: boolean
}

export type ProcessingStage = 'idle' | 'uploading' | 'processing' | 'answering'

