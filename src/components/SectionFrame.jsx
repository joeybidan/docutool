import { ArrowLeft, Maximize2 } from 'lucide-react'

export const SECTION_META = {
  notestemplates: { label: 'Note Templates' },
  callbacklist: { label: 'Callback List' },
  scteamschannels: { label: 'SC Teams Channels' },
  carelinxnews: { label: 'CareLinx News' },
  regularholidays: { label: 'Regular Holidays' },
  anonymoussuggestions: { label: 'Anonymous Suggestions' },
  notepad: { label: 'Notepad' },
  capturedconversation: { label: 'Captured Conversation' },
  knowledgebasesearch: { label: 'Knowledge Base Search' },
  qascoresrankmtd: { label: 'QA Scores Rank MTD' },
  csatmtd: { label: 'CSAT MTD' },
  teamspotlight: { label: 'Team Spotlight' },
  managerannouncements: { label: 'Manager Announcements' },
  soptrainings: { label: 'SOP & Trainings' },
  puzzleoftheday: { label: 'Puzzle of the Day' },
  caregiveroftheday: { label: 'Caregiver of the Day' },
  sopquizoftheday: { label: 'SOP Quiz of the Day' },
  carematch: { label: 'CareMatch' },
  teamrecognition: { label: 'Team Recognition' },
  kudos: { label: 'Kudos' },
  sharecarefamilymoments: { label: 'Sharecare Family Moments' },
}

export function SectionMaximizeButton({ slug, label, inline = false }) {
  return (
    <a
      className={[
        'section-maximize',
        inline ? 'section-maximize--inline' : '',
        slug === 'notepad' ? 'section-maximize--notepad' : '',
      ].filter(Boolean).join(' ')}
      href={`/${slug}`}
      aria-label={slug === 'notepad' ? 'Open Focus Notepad' : `Open ${label} full page`}
      title={slug === 'notepad' ? 'Open Focus Notepad' : `Open ${label} full page`}
    >
      <Maximize2 size={15} aria-hidden="true" />
      {slug === 'notepad' && <span>Focus Notepad</span>}
    </a>
  )
}

export function SectionFrame({ slug, label, children, className = '' }) {
  return (
    <div className={`section-shell ${className}`.trim()}>
      <SectionMaximizeButton slug={slug} label={label} />
      {children}
    </div>
  )
}

export function SectionPage({ slug, label, children }) {
  return (
    <main className={`section-page section-page--${slug}`}>
      <div className="section-page__bar">
        <a href="/" className="section-page__back">
          <ArrowLeft size={16} aria-hidden="true" />
          All DocuTool
        </a>
        <div>
          <span>Focused view</span>
          <h1>{label}</h1>
        </div>
      </div>
      <div className="section-page__content">{children}</div>
    </main>
  )
}
