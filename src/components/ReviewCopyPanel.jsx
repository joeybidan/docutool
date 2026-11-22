import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, ClipboardCheck, Copy, Pencil, X } from 'lucide-react'
import { Button } from './ui/Button.jsx'
import { reviewDocumentation } from '../utils/documentationReview.js'

// One local review panel per notepad view. Never modifies or transmits the note.
export function ReviewCopyPanel({ note, noteName, activeIndex, onCopy, editorRef }) {
  const [open, setOpen] = useState(false)
  const [copying, setCopying] = useState(false)
  const [error, setError] = useState('')
  const panelRef = useRef(null)
  const review = reviewDocumentation(note)
  const hasWarnings = review.warningCount > 0
  const hasNote = Boolean(note?.trim())

  useEffect(() => {
    // A review belongs to only one tab; don't accidentally copy a new tab
    // using an old tab's decision.
    setOpen(false)
    setError('')
  }, [activeIndex])

  useEffect(() => {
    if (open) panelRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
  }, [open])

  function editNote() {
    setOpen(false)
    setError('')
    editorRef.current?.focus()
  }

  async function copyReviewed() {
    if (!hasNote || copying) return
    setCopying(true)
    setError('')
    try {
      await onCopy()
      setOpen(false)
    } catch (cause) {
      setError(cause?.message || 'Copy failed. Please focus this browser window and try again.')
    } finally {
      setCopying(false)
    }
  }

  return <>
    <Button type="button" variant="primary" className="review-copy__trigger" disabled={!hasNote || copying}
      aria-expanded={open} onClick={() => { setOpen(current => !current); setError('') }}>
      <ClipboardCheck size={16} aria-hidden="true" />
      Review &amp; Copy
      {hasNote && hasWarnings && <span className="review-copy__count" aria-label={review.warningCount + ' items to review'}>{review.warningCount}</span>}
    </Button>
    {open && (
      <section className="review-copy__panel" aria-label="Review before copying" ref={panelRef}>
        <div className="review-copy__heading">
          <div>
            <strong>Review before copying</strong>
            <p>{hasWarnings
              ? review.warningCount + ' possible documentation gap' + (review.warningCount === 1 ? '' : 's') + ' in ' + noteName
              : 'No gaps detected by these basic checks in ' + noteName + '.'}</p>
          </div>
          <button type="button" className="review-copy__dismiss" onClick={() => setOpen(false)} aria-label="Close review">
            <X size={16} />
          </button>
        </div>
        <ul className="review-copy__list">
          {review.checks.map(check => (
            <li key={check.id} className={check.found ? 'review-copy__found' : 'review-copy__missing'}>
              {check.found
                ? <CheckCircle2 size={17} aria-hidden="true" />
                : <AlertTriangle size={17} aria-hidden="true" />}
              <span><strong>{check.label}: {check.found ? 'Detected' : 'Review needed'}</strong>
                <small>{check.found ? check.explanation : check.suggestion}</small></span>
            </li>
          ))}
        </ul>
        <p className="review-copy__disclaimer">
          This is a local keyword-based reminder, not a formal QA score. It can miss details or flag valid notes.
          Check your account’s documentation policy before copying.
        </p>
        {error && <p className="review-copy__error" role="alert">{error}</p>}
        <div className="review-copy__buttons">
          <Button type="button" onClick={editNote}>
            <Pencil size={15} aria-hidden="true" /> Edit note
          </Button>
          <Button type="button" variant="primary" disabled={copying || !hasNote} onClick={copyReviewed}>
            <Copy size={15} aria-hidden="true" />
            {copying ? 'Copying…' : hasWarnings ? 'Copy anyway' : 'Copy reviewed note'}
          </Button>
        </div>
      </section>
    )}
  </>
}
