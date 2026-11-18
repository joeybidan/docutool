import { CloudOff, Link2, Maximize2, Megaphone } from 'lucide-react'
import { useState } from 'react'
import { AnnouncementsView } from './AnnouncementsView.jsx'
import { LinksView } from './LinksView.jsx'

export function InfoPanel({ announcements, links, source, loading, forcedMode, onModeChange, onMaximize }) {
  const [localMode, setLocalMode] = useState('announcements')
  const mode = forcedMode || localMode
  const selectMode = (nextMode) => {
    if (onModeChange) onModeChange(nextMode)
    else setLocalMode(nextMode)
  }

  return (
    <aside className="panel info-panel" aria-label="Shared announcements and SOP trainings">
      <div className="info-panel__switch" role="tablist" aria-label="Shared content type">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'announcements'}
          className={mode === 'announcements' ? 'is-active' : ''}
          onClick={() => selectMode('announcements')}
        >
          <Megaphone size={15} />
          Announcements
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'links'}
          className={mode === 'links' ? 'is-active' : ''}
          onClick={() => selectMode('links')}
        >
          <Link2 size={15} />
          SOP &amp; Trainings
        </button>
      </div>

      <div className="info-panel__body" role="tabpanel">
        <div className="info-panel__title-row">
          <h2>{mode === 'announcements' ? 'Manager Announcements' : 'SOP & Trainings'}</h2>
          {loading && <span className="loading-dot" aria-label="Loading shared content" />}
          {onMaximize && (
            <button
              type="button"
              className="info-panel__maximize"
              title={`Maximize ${mode === 'announcements' ? 'Manager Announcements' : 'SOP & Trainings'}`}
              aria-label={`Maximize ${mode === 'announcements' ? 'Manager Announcements' : 'SOP & Trainings'}`}
              onClick={() => onMaximize(mode)}
            >
              <Maximize2 size={15} aria-hidden="true" />
            </button>
          )
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
