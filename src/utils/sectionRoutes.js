// Direct-linkable dashboard sections. Slugs use the visible section name without spaces.
export const SECTION_TITLES = Object.freeze({
  notestemplates: 'Note Templates',
  callbacklist: 'Callback List',
  scteamschannels: 'SC Teams Channels',
  carelinxnews: 'CareLinx News',
  regularholidays: 'Regular Holidays',
  anonymoussuggestions: 'Anonymous Suggestions',
  notepad: 'Notepad',
  capturedconversation: 'Captured Conversation',
  knowledgebasesearch: 'Knowledge Base Search',
  qascoresrankmtd: 'QA Scores Rank MTD',
  csatmtd: 'CSAT MTD',
  teamspotlight: 'Team Spotlight',
  managerannouncements: 'Manager Announcements',
  soptrainings: 'SOP & Trainings',
  puzzleoftheday: 'Puzzle of the Day',
  caregiveroftheday: 'Caregiver of the Day',
  sopquizoftheday: 'SOP Quiz of the Day',
  carematch: 'CareMatch',
  teamrecognition: 'Team Recognition',
  kudos: 'Kudos',
  sharecarefamilymoments: 'Sharecare Family Moments',
  timezones: 'Timezones & Alarms',
  timezoneconverter: 'Timezone Converter',
})

export function getSectionSlug(pathname) {
  const slug = String(pathname || '/').replace(/^\/+|\/+$/g, '').toLowerCase()
  return !slug ? '' : Object.hasOwn(SECTION_TITLES, slug) ? slug : null
}

export function sectionHref(slug) {
  if (!Object.hasOwn(SECTION_TITLES, slug)) throw new Error('Unknown DocuTool section')
  return `/${slug}`
}
