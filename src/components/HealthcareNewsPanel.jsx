import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, Image as ImageIcon, Newspaper, RefreshCw, Search } from 'lucide-react'

const GOOGLE_NEWS = 'https://news.google.com/search?q=home%20care%20caregivers%20Medicare%20Medicaid&hl=en-US&gl=US&ceid=US%3Aen'
const MONTH_LABEL = new Intl.DateTimeFormat('en-US', {
  month: 'long', year: 'numeric', timeZone: 'America/New_York',
}).format(new Date())

function formatDate(value) {
  const parsed = new Date(`${value}T12:00:00Z`)
  return Number.isFinite(parsed.getTime())
    ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(parsed)
    : ''
}

export function CarelinxNewsPanel({ image }) {
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updated, setUpdated] = useState('')
  const [sourceCount, setSourceCount] = useState(0)
  const [month, setMonth] = useState(MONTH_LABEL)
  const [imageOpen, setImageOpen] = useState(false)

  const refresh = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true)
    try {
      const response = await fetch('/api/carelinx-news', { headers: { Accept: 'application/json' } })
      if (!response.ok) throw new Error('Live news is temporarily unavailable.')
      const data = await response.json()
      if (!Array.isArray(data.stories)) throw new Error('News results could not be loaded.')
      const monthNow = new Intl.DateTimeFormat('en-US', {
        month: 'long', year: 'numeric', timeZone: 'America/New_York',
      }).format(new Date())
      const expectedMonth = new Intl.DateTimeFormat('en-US', {
        year: 'numeric', month: '2-digit', timeZone: 'America/New_York',
      }).formatToParts(new Date())
      const monthKey = `${expectedMonth.find(p => p.type === 'year').value}-${expectedMonth.find(p => p.type === 'month').value}`
      // Reject stale cached results from previous months, including on month rollover.
      setStories(data.stories.filter(story => story.date?.startsWith(monthKey) && /^https:\/\//.test(story.url)))
      setUpdated(data.refreshedAt || '')
      setSourceCount(data.sourcesAvailable || 0)
      setMonth(monthNow)
      setError('')
    } catch (caught) {
      setStories([])
      setError(caught.message || 'News feed unavailable.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const timer = window.setInterval(() => refresh({ quiet: true }), 30 * 60 * 1000)
    const onVisible = () => { if (document.visibilityState === 'visible') refresh({ quiet: true }) }
    document.addEventListener('visibilitychange', onVisible)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible) }
  }, [refresh])

  useEffect(() => {
    if (!imageOpen) return
    const onKeyDown = event => { if (event.key === 'Escape') setImageOpen(false) }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [imageOpen])

  return (
    <section className="panel healthcare-news-panel carelinx-news-panel" aria-labelledby="carelinx-news-title">
      <div className="panel-heading">
        <div>
          <h2 id="carelinx-news-title">CareLinx News</h2>
          <p className="panel-subtitle">Current-month U.S. home care, caregivers, Medicare, Medicaid, and aging news.</p>
        </div>
        <Newspaper size={18} aria-hidden="true" />
      </div>

      <div className="carelinx-news-columns">
        <div className="carelinx-news-feature">
          {image?.imageUrl ? (
            <button type="button" className="carelinx-news-feature__image" title="Click to enlarge the admin photo" onClick={() => setImageOpen(true)}>
              <img src={image.imageUrl} alt="CareLinx News image uploaded by the administrator" loading="lazy" />
              <span><ImageIcon size={13} aria-hidden="true" /> Click to enlarge</span>
            </button>
          ) : (
            <div className="carelinx-news-feature__placeholder">
              <ImageIcon size={34} aria-hidden="true" />
              <strong>CareLinx News</strong>
              <span>Admin photo will appear here.</span>
            </div>
          )}
        </div>
        <div className="carelinx-news-stories">
          <div className="carelinx-news-toolbar">
            <a href={GOOGLE_NEWS} target="_blank" rel="noopener noreferrer" className="carelinx-google-news-link">
              <Search size={13} aria-hidden="true" />
              <span>More U.S. caregiver news</span>
              <ExternalLink size={12} aria-hidden="true" />
            </a>
            <button type="button" className="carelinx-news-refresh" onClick={() => refresh()} disabled={loading} title="Check news now" aria-label="Refresh caregiver news">
              <RefreshCw size={14} aria-hidden="true" /> Refresh
            </button>
          </div>

          {loading && !stories.length ? <p className="carelinx-news-status" role="status">Checking current caregiver news…</p> : null}
          {error && <p className="carelinx-news-status carelinx-news-status--error" role="status">{error} Use the news search link above or retry.</p>}
          {!loading && !error && !stories.length && <p className="carelinx-news-status">No new relevant stories published this month yet. Check again soon.</p>}
          <div className="healthcare-news-list">
            {stories.map(item => (
              <a key={item.url} className="healthcare-news-item" href={item.url}
                target="_blank" rel="noopener noreferrer" title={`Read ${item.source} article in a new tab`}>
                <div className="carelinx-news-story-preview">
                  {item.imageUrl ? <img src={item.imageUrl} alt="" loading="lazy" onError={e => { e.currentTarget.style.display = 'none' }} /> :
                    <Newspaper size={23} aria-hidden="true" />}
                </div>
                <div className="healthcare-news-item__meta">
                  <span className="carelinx-news-type">{item.type}</span>
                  <span>{formatDate(item.date)}</span>
                  <span>{item.source}</span>
                </div>
                <div className="healthcare-news-item__headline"><span>{item.title}</span><ExternalLink size={13} aria-hidden="true" /></div>
                {item.description && <p className="carelinx-news-story-summary">{item.description}</p>}
              </a>
            ))}
          </div>
          <p className="healthcare-news-footer">
            {month} only · {sourceCount} live news {sourceCount === 1 ? 'source' : 'sources'}
            {updated && ` · Last checked ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York', timeZoneName: 'short' }).format(new Date(updated))}`}
          </p>
        </div>
      </div>

      {imageOpen && image?.imageUrl && (
        <div className="image-viewer-backdrop" role="dialog" aria-label="CareLinx News large image" aria-modal="true"
          onMouseDown={e => e.target === e.currentTarget && setImageOpen(false)}>
          <button className="image-viewer-close" type="button" onClick={() => setImageOpen(false)} aria-label="Close image">×</button>
          <img src={image.imageUrl} alt="CareLinx News administrator image, expanded" />
        </div>
      )}
    </section>
  )
}
