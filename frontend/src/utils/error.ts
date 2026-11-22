import axios from 'axios'

export function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    if (err.response?.data?.error) {
      return String(err.response.data.error)
    }
    if (err.response?.data?.message) {
      return String(err.response.data.message)
    }
    if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
      return 'The request timed out waiting for the server to respond. Please try again.'
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return 'Network connection error: Unable to reach the backend server. Please verify your connection or ensure backend services are running.'
    }
    if (err.response?.status) {
      return `Server error (${err.response.status}): ${err.response.statusText || 'Unable to complete request'}`
    }
    return err.message || fallback
  }

  if (err instanceof Error) {
    return err.message || fallback
  }

  if (typeof err === 'string' && err.trim()) {
    return err
  }

  return fallback
}
