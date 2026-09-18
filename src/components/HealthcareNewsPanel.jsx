import { ExternalLink, Newspaper, Search } from 'lucide-react'
import { CARELINX_NEWS, CARELINX_NEWS_UPDATED_AT } from '../constants/healthcareNews.js'

const GOOGLE_NEWS_CARELINX = 'https://news.google.com/search?q=CareLinx&hl=en-US&gl=US&ceid=US%3Aen'

function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${value}T12:00:00Z`))
}

function formatUpdatedAt(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

export function CarelinxNewsPanel() {
  return (
    <section className="panel healthcare-news-panel carelinx-news-panel" aria-labelledby="carelinx-news-title">
      <div className="panel-heading">
        <div>
          <h2 id="carelinx-news-title">CareLinx News</h2>
          <p className="panel-subtitle">CareLinx mentions, caregiver travel alerts, and CA/WA caregiver-law updates.</p>
        </div>
        <Newspaper size={18} aria-hidden="true" />
      </div>

      <a
        className="carelinx-google-news-link"
        href={GOOGLE_NEWS_CARELINX}
        target="_blank"
        rel="noopener noreferrer"
        title="Search current Google News results for CareLinx"
      >
        <Search size={13} aria-hidden="true" />
        <span>Live Google News search: CareLinx</span>
        <ExternalLink size={12} aria-hidden="true" />
      </a>

      <div className="healthcare-news-list">
        {CARELINX_NEWS.slice(0, 20).map((item) => (
          <a
            key={`${item.date}-${item.title}`}
            className="healthcare-news-item"
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open ${item.source} in a new tab`}
          >
            <div className="healthcare-news-item__meta">
              <span className={`carelinx-news-type carelinx-news-type--${item.type.toLowerCase().replaceAll(' ', '-')}`}>
                {item.type}
              </span>
              {item.region && <span>{item.region}</span>}
              <span>{formatDate(item.date)}</span>
              <span>{item.source}</span>
            </div>
            <div className="healthcare-news-item__headline">
              <span>{item.title}</span>
              <ExternalLink size={13} aria-hidden="true" />
            </div>
          </a>
        ))}
      </div>

      <p className="healthcare-news-footer">Operational watchlist • refreshed {formatUpdatedAt(CARELINX_NEWS_UPDATED_AT)}</p>
    </section>
  )
}
