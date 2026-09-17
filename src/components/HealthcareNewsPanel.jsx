import { ExternalLink, Newspaper } from 'lucide-react'
import { HEALTHCARE_NEWS, HEALTHCARE_NEWS_UPDATED_AT } from '../constants/healthcareNews.js'

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

export function HealthcareNewsPanel() {
  return (
    <section className="panel healthcare-news-panel" aria-labelledby="healthcare-news-title">
      <div className="panel-heading">
        <div>
          <h2 id="healthcare-news-title">US Healthcare News</h2>
          <p className="panel-subtitle">USA, California, and Washington updates relevant to healthcare support.</p>
        </div>
        <Newspaper size={18} aria-hidden="true" />
      </div>

      <div className="healthcare-news-list">
        {HEALTHCARE_NEWS.slice(0, 20).map((item) => (
          <a
            key={`${item.date}-${item.title}`}
            className="healthcare-news-item"
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open ${item.source} article in a new tab`}
          >
            <div className="healthcare-news-item__meta">
              <span className={`healthcare-news-region healthcare-news-region--${item.region.toLowerCase().replaceAll(' ', '-')}`}>
                {item.region}
              </span>
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

      <p className="healthcare-news-footer">Curated for September 2026 • updated {formatUpdatedAt(HEALTHCARE_NEWS_UPDATED_AT)}</p>
    </section>
  )
}
