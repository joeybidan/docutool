export const TEMPLATE_GROUPS = [
  { id: 'general-questions', label: 'General Questions' },
  { id: 'timesheets', label: 'Timesheets' },
  { id: 'shifts', label: 'Shifts' },
  { id: 'transfer', label: 'Transfer' },
  { id: 'escalation', label: 'Escalation' },
  { id: 'follow-up', label: 'Follow Up' },
]

export const DEFAULT_TEMPLATES = [
  {
    id: 'general-questions-1',
    group: 'general-questions',
    text: 'Caller contacted CareLinx with general questions or requested information.',
  },
  {
    id: 'general-questions-2',
    group: 'general-questions',
    text: 'Reviewed the caller’s concern and provided the requested information or guidance.',
  },
  {
    id: 'general-questions-3',
    group: 'general-questions',
    text: 'Guided the caller through the appropriate CareLinx process and confirmed understanding.',
  },
  {
    id: 'timesheets-1',
    group: 'timesheets',
    text: 'Caller needs assistance with a timesheet, clock in, or clock out concern.',
  },
  {
    id: 'timesheets-2',
    group: 'timesheets',
    text: 'Reviewed the affected timesheet and guided the caller on the required correction or submission.',
  },
  {
    id: 'timesheets-3',
    group: 'timesheets',
    text: 'Timesheet concern resolved; caller confirmed the time entry or submission is accurate.',
  },
  {
    id: 'shifts-1',
    group: 'shifts',
    text: 'Caller contacted CareLinx regarding an upcoming, active, or completed shift.',
  },
  {
    id: 'shifts-2',
    group: 'shifts',
    text: 'Reviewed the shift details, schedule, caregiver/member information, and current status.',
  },
  {
    id: 'shifts-3',
    group: 'shifts',
    text: 'Guided the caller on the next step for the shift and confirmed understanding.',
  },
  {
    id: 'transfer-1',
    group: 'transfer',
    text: 'Transferred the call to the assigned Care Advisor or appropriate support team.',
  },
  {
    id: 'transfer-2',
    group: 'transfer',
    text: 'Warm-transferred the caller after providing the receiving team with the relevant context.',
  },
  {
    id: 'transfer-3',
    group: 'transfer',
    text: 'Provided transfer expectations and confirmed the caller agreed before transferring.',
  },
  {
    id: 'escalation-1',
    group: 'escalation',
    text: 'Issue requires escalation because it cannot be fully resolved within current support scope.',
  },
  {
    id: 'escalation-2',
    group: 'escalation',
    text: 'Documented the concern, actions already completed, and the specific assistance still needed.',
  },
  {
    id: 'escalation-3',
    group: 'escalation',
    text: 'Escalated to the appropriate team or leader and advised the caller of the expected next step.',
  },
  {
    id: 'follow-up-1',
    group: 'follow-up',
    text: 'Follow-up is required to confirm resolution or obtain additional information.',
  },
  {
    id: 'follow-up-2',
    group: 'follow-up',
    text: 'Advised the caller what will be followed up, by whom, and the expected timeframe.',
  },
  {
    id: 'follow-up-3',
    group: 'follow-up',
    text: 'Documented the pending item and next action for continuity on the next contact.',
  },
]

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

export const FALLBACK_DASHBOARD_MEDIA = {
  qa_scores_rank_mtd: {
    slot: 'qa_scores_rank_mtd',
    imagePath: null,
    imageUrl: '',
    answer: '',
    revealAt: null,
    isPublished: true,
  },
  csat_mtd: {
    slot: 'csat_mtd',
    imagePath: null,
    imageUrl: '',
    answer: '',
    revealAt: null,
    isPublished: true,
  },
  puzzle_of_day: {
    slot: 'puzzle_of_day',
    imagePath: null,
    imageUrl: '',
    answer: '',
    revealAt: null,
    isPublished: true,
  },
  caregiver_of_day: {
    slot: 'caregiver_of_day',
    imagePath: null,
    imageUrl: '',
    answer: '',
    revealAt: null,
    isPublished: true,
  },
  sop_quiz_of_day: {
    slot: 'sop_quiz_of_day',
    imagePath: null,
    imageUrl: '',
    answer: '',
    revealAt: null,
    isPublished: true,
  },
}

export const NOTE_LABELS = ['Note 1', 'Note 2', 'Note 3', 'Note 4', 'Note 5']

export const RECOGNITION_CATEGORIES = ['Top Agent', 'Top CSAT', 'Top QA']
