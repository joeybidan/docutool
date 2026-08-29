import { CloudOff, Link2, Megaphone } from 'lucide-react'
import { useState } from 'react'
import { AnnouncementsView } from './AnnouncementsView.jsx'
import { LinksView } from './LinksView.jsx'

export function InfoPanel({ announcements, links, source, loading }) {
  const [mode, setMode] = useState('announcements')

  return (
    <aside className="panel info-panel" aria-label="Shared announcements and links">
      <div className="info-panel__switch" role="tablist" aria-label="Shared content type">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'announcements'}
          className={mode === 'announcements' ? 'is-active' : ''}
          onClick={() => setMode('announcements')}
        >
          <Megaphone size={15} />
          Announcements
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'links'}
          className={mode === 'links' ? 'is-active' : ''}
          onClick={() => setMode('links')}
        >
          <Link2 size={15} />
          Links
        </button>
      </div>

      <div className="info-panel__body" role="tabpanel">
        <div className="info-panel__title-row">
          <h2>{mode === 'announcements' ? 'Manager Announcements' : 'Useful Links'}</h2>
          {loading && <span className="loading-dot" aria-label="Loading shared content" />}
        </div>
        {mode === 'announcements' ? (
          <AnnouncementsView announcements={announcements} />
        ) : (
          <LinksView links={links} />
        )}
      </div>

      {source !== 'supabase' && (
        <div className="connection-note">
          <CloudOff size={14} aria-hidden="true" />
          {source === 'unavailable' ? 'Supabase unavailable — preview shown' : 'Preview content — connect Supabase'}
        </div>
      )}
    </aside>
  )
}
