import { ExternalLink } from 'lucide-react'

export function LinksView({ links }) {
  if (!links.length) return <p className="empty-message">No shared links are published right now.</p>

  return (
    <div className="shared-link-list">
      {links.map((link) => (
        <a
          className="shared-link"
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>
            <strong>{link.title}</strong>
            {link.description && <small>{link.description}</small>}
          </span>
          <ExternalLink size={15} aria-hidden="true" />
        </a>
      ))}
    </div>
  )
}
