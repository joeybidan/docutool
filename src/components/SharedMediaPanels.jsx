import { useEffect, useMemo, useState } from 'react'
import { Expand, X } from 'lucide-react'

function formatCountdown(ms) {
  if (ms <= 0) return 'Answer available'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatRevealTime(value) {
  if (!value) return 'Reveal time not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Reveal time not set'
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date)
}

function ImageViewer({ src, alt, onClose }) {
  useEffect(() => {
    const handleKey = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="image-viewer-backdrop" role="dialog" aria-modal="true" aria-label={alt} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <button type="button" className="image-viewer-close" onClick={onClose} aria-label="Close image viewer">
        <X size={22} />
      </button>
      <img src={src} alt={alt} />
    </div>
  )
}

function MediaImage({ item, alt, hoverMagnify = false }) {
  const [viewerOpen, setViewerOpen] = useState(false)
  if (!item?.imageUrl) return <p className="empty-message">Admin can upload an image for this section.</p>

  return (
    <>
      <button
        type="button"
        className={`shared-media-image${hoverMagnify ? ' shared-media-image--magnify' : ''}`}
        onClick={() => setViewerOpen(true)}
        title="Click for a closer look"
      >
        <img src={item.imageUrl} alt={alt} />
        <span><Expand size={14} /> Click to enlarge</span>
      </button>
      {viewerOpen && <ImageViewer src={item.imageUrl} alt={alt} onClose={() => setViewerOpen(false)} />}
    </>
  )
}

export function MonthlyScoresPanel({ title, subtitle, item }) {
  const titleId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-title`
  return (
    <section className="panel shared-media-panel monthly-scores-panel" aria-labelledby={titleId}>
      <div className="panel-heading">
        <div>
          <h2 id={titleId}>{title}</h2>
          <p className="panel-subtitle">{subtitle}</p>
        </div>
      </div>
      <MediaImage item={item} alt={title} hoverMagnify />
    </section>
  )
}

export function QAScoresPanel({ item }) {
  return (
    <MonthlyScoresPanel
      title="QA Scores Rank MTD"
      subtitle="Monthly QA ranking uploaded by the admin."
      item={item}
    />
  )
}

export function CSATScoresPanel({ item }) {
  return (
    <MonthlyScoresPanel
      title="CSAT MTD"
      subtitle="Current month CSAT scores uploaded by the admin."
      item={item}
    />
  )
}

export function DailyRevealCard({ title, item }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const revealAt = useMemo(() => {
    if (!item?.revealAt) return null
    const time = new Date(item.revealAt).getTime()
    return Number.isNaN(time) ? null : time
  }, [item?.revealAt])
  const revealed = Boolean(revealAt && now >= revealAt)
  const remaining = revealAt ? revealAt - now : 0

  return (
    <section className="panel daily-reveal-card">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
        </div>
      </div>
      <MediaImage item={item} alt={title} />
      {item?.answer ? (
        <div className={`daily-answer ${revealed ? 'daily-answer--revealed' : ''}`}>
          <strong>Answer</strong>
          <div className="daily-answer__cover" aria-live="polite">
            {revealed ? item.answer : '••••••••••••••••••••'}
          </div>
          <div className="daily-answer__timer">
            {revealAt ? (
              revealed
                ? `Revealed ${formatRevealTime(item.revealAt)}`
                : `Answer reveal by ${formatRevealTime(item.revealAt)} • ${formatCountdown(remaining)}`
            ) : 'Answer reveal time has not been scheduled.'}
          </div>
        </div>
      ) : (
        <p className="empty-message">Admin can add today’s image, answer, and reveal time.</p>
      )}
    </section>
  )
}
