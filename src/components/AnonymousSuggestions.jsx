import { useCallback, useEffect, useState } from 'react'
import { MessageSquarePlus, Send } from 'lucide-react'
import {
  loadPublicSuggestions,
  submitAnonymousSuggestion,
} from '../services/suggestionsService.js'
import { Button } from './ui/Button.jsx'

function formatSuggestionTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function AnonymousSuggestions({ onNotify }) {
  const [suggestions, setSuggestions] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const items = await loadPublicSuggestions()
      setSuggestions(items)
    } catch (error) {
      console.warn('Anonymous suggestions are unavailable.', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const timer = window.setInterval(refresh, 15_000)
    return () => window.clearInterval(timer)
  }, [refresh])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await submitAnonymousSuggestion(message)
      setMessage('')
      await refresh()
      onNotify?.('Suggestion posted anonymously for everyone to see.')
    } catch (error) {
      onNotify?.(error.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="panel anonymous-suggestions" aria-labelledby="anonymous-suggestions-title">
      <div className="panel-heading">
        <div>
          <h2 id="anonymous-suggestions-title">Anonymous Suggestions</h2>
          <p className="panel-subtitle">Visible to everyone using DocuTool. No name is attached.</p>
        </div>
        <MessageSquarePlus size={18} aria-hidden="true" />
      </div>

      <form className="anonymous-suggestions__form" onSubmit={handleSubmit}>
        <textarea
          rows="3"
          maxLength="500"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Share a process, tool, QA, or workflow suggestion…"
          aria-label="Anonymous suggestion"
          required
        />
        <div className="anonymous-suggestions__form-footer">
          <small>Do not include client, caregiver, member, login, or other private information.</small>
          <Button size="small" variant="primary" type="submit" disabled={submitting || message.trim().length < 2}>
            <Send size={13} />
            {submitting ? 'Sending…' : 'Submit'}
          </Button>
        </div>
      </form>

      <div className="anonymous-suggestions__feed" aria-live="polite">
        {loading ? (
          <p className="empty-message">Loading suggestions…</p>
        ) : suggestions.length ? (
          suggestions.map((item) => (
            <article className="anonymous-suggestion-item" key={item.id}>
              <div className="anonymous-suggestion-item__meta">
                <strong>Anonymous</strong>
                <time dateTime={item.createdAt}>{formatSuggestionTime(item.createdAt)}</time>
              </div>
              <p>{item.message}</p>
            </article>
          ))
        ) : (
          <p className="empty-message">No suggestions yet. Be the first to post one.</p>
        )}
      </div>
    </section>
  )
}
