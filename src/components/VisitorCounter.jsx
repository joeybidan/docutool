import { useVisitorCounter } from '../hooks/useVisitorCounter.js'

export function VisitorCounter() {
  const { count, error } = useVisitorCounter()
  const configured = count !== null && !error

  return (
    <div
      className={`visitor-counter ${configured ? 'visitor-counter--live' : ''}`}
      title="Realtime count of unique browser/device profiles currently connected to DocuTool. Multiple tabs on the same browser profile count once."
      aria-label={configured ? `${count} devices currently online` : 'Realtime visitor count unavailable'}
    >
      <span className="visitor-counter__dot" aria-hidden="true" />
      <strong>{configured ? count.toLocaleString() : '—'}</strong>
      <span>{configured ? 'devices online' : 'counter offline'}</span>
    </div>
  )
}
