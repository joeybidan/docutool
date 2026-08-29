export const DEFAULT_TEMPLATES = [
  'Member called in',
  'Caregiver called in',
  'Third party or representative called in',
  'Issue is general questions',
  'Issue is timesheets / clock in clock out',
  'Resolved by guiding navigation and answering questions',
  'Resolved by creating timesheet and confirming submission',
  'Transferred the call to UHC CA team',
  'Transferred the call to payment operations',
  'Transferred the call to recruitment',
  'Transferred to specific assigned CA',
].map((text, index) => ({ id: `default-${index + 1}`, text }))

export const FALLBACK_ANNOUNCEMENTS = [
  {
    id: 'sample-announcement-1',
    title: 'Start with the member’s goal',
    message: 'Confirm the reason for the call before documenting the resolution.',
    publishedAt: '2026-08-25T08:00:00.000Z',
    sortOrder: 0,
  },
  {
    id: 'sample-announcement-2',
    title: 'Protect customer information',
    message: 'Review your note before copying it into any approved system of record.',
    publishedAt: '2026-08-21T08:00:00.000Z',
    sortOrder: 1,
  },
  {
    id: 'sample-announcement-3',
    title: 'Weekly calibration',
    message: 'Bring one documentation example to the next team calibration session.',
    publishedAt: '2026-08-18T08:00:00.000Z',
    sortOrder: 2,
  },
]

export const FALLBACK_LINKS = [
  {
    id: 'sample-link-1',
    title: 'Microsoft 365 training',
    description: 'Self-guided productivity training and reference material.',
    url: 'https://support.microsoft.com/training',
    sortOrder: 0,
  },
  {
    id: 'sample-link-2',
    title: 'SharePoint help',
    description: 'Guidance for files, lists, sites, and team resources.',
    url: 'https://support.microsoft.com/sharepoint',
    sortOrder: 1,
  },
]

export const FALLBACK_RECOGNITION = [
  {
    id: 'sample-recognition-1',
    employeeName: 'Maya Santos',
    category: 'Top Agent',
    caption: 'Consistent quality and thoughtful member care.',
    imageUrl: '/recognition/sample-top-agent.png',
    imagePath: null,
    sortOrder: 0,
  },
  {
    id: 'sample-recognition-2',
    employeeName: 'Andre Reyes',
    category: 'Top CSAT',
    caption: 'Highest customer satisfaction score this cycle.',
    imageUrl: '/recognition/sample-top-csat.png',
    imagePath: null,
    sortOrder: 1,
  },
  {
    id: 'sample-recognition-3',
    employeeName: 'Leah Navarro',
    category: 'Top QA',
    caption: 'Exceptional accuracy and attention to detail.',
    imageUrl: '/recognition/sample-top-qa.png',
    imagePath: null,
    sortOrder: 2,
  },
]

export const NOTE_LABELS = ['Note 1', 'Note 2', 'Note 3', 'Note 4', 'Note 5']

export const RECOGNITION_CATEGORIES = ['Top Agent', 'Top CSAT', 'Top QA']
