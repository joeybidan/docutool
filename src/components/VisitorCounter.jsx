import { useVisitorCounter } from '../hooks/useVisitorCounter.js'

export function VisitorCounter() {
  const { count, error } = useVisitorCounter()
  const configured = count !== null && !error

  return (
    <div
      className={`visitor-counter ${configured ? 'visitor-counter--live' : ''}`}
      title="Counts unique browser-tab sessions through the shared Supabase visitor service."
      aria-label={configured ? `${count} shared visitor sessions` : 'Shared visitor count unavailable'}
    >
      <span className="visitor-counter__dot" aria-hidden="true" />
      <strong>{configured ? count.toLocaleString() : '—'}</strong>
      <span>{configured ? 'sessions' : 'counter offline'}</span>
    </div>
  )
}
