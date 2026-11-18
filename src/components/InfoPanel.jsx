import { CloudOff, Link2, Megaphone } from 'lucide-react'
import { useState } from 'react'
import { AnnouncementsView } from './AnnouncementsView.jsx'
import { LinksView } from './LinksView.jsx'
import { SectionMaximizeButton } from './SectionFrame.jsx'

export function InfoPanel({
  announcements,
  links,
  source,
  loading,
  lockedMode = null,
  showMaximize = false,
}) {
  const [mode, setMode] = useState(lockedMode || 'announcements')
  const activeMode = lockedMode || mode
  const activeLabel = activeMode === 'announcements' ? 'Manager Announcements' : 'SOP & Trainings'
  const activeSlug = activeMode === 'announcements' ? 'managerannouncements' : 'soptrainings'

  return (
    <aside
      className={`panel info-panel${lockedMode ? ' info-panel--locked' : ''}`}
      aria-label="Shared announcements and SOP trainings"
    >
      {!lockedMode && (
        <div
          className={`info-panel__switch${showMaximize ? ' info-panel__switch--with-maximize' : ''}`}
          role="tablist"
          aria-label="Shared content type"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeMode === 'announcements'}
            className={activeMode === 'announcements' ? 'is-active' : ''}
            onClick={() => setMode('announcements')}
          >
            <Megaphone size={15} />
            Announcements
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeMode === 'links'}
            className={activeMode === 'links' ? 'is-active' : ''}
            onClick={() => setMode('links')}
          >
            <Link2 size={15} />
            SOP &amp; Trainings
          </button>
          {showMaximize && (
            <SectionMaximizeButton slug={activeSlug} label={activeLabel} inline />
          )}
        </div>
      )}

      <div className="info-panel__body" role="tabpanel">
        <div className="info-panel__title-row">
          <h2>{activeLabel}</h2>
          {loading && <span className="loading-dot" aria-label="Loading shared content" />}
        </div>
        {activeMode === 'announcements' ? (
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
