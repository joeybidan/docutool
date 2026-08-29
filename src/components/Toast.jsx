import { useEffect } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

export function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(onDismiss, 3200)
    return () => window.clearTimeout(timer)
  }, [toast, onDismiss])

  if (!toast) return null

  return (
    <div className={`toast toast--${toast.type || 'success'}`} role="status" aria-live="polite">
      {toast.type === 'error' ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
      <span>{toast.message}</span>
      <button type="button" aria-label="Dismiss message" onClick={onDismiss}>
        <X size={14} />
      </button>
    </div>
  )
}
