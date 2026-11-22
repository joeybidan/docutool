// Account-neutral, deterministic call wrap-up labels. No AI or server requests.
export const CALLER_OPTIONS = [
  { value: 'member', label: 'Member / client' },
  { value: 'caregiver', label: 'Caregiver / provider' },
  { value: 'third-party', label: 'Representative / third party' },
]

export const ISSUE_OPTIONS = [
  { value: 'general', label: 'General question' },
  { value: 'timesheet', label: 'Timesheet / clock in or out' },
  { value: 'payroll', label: 'Payroll / payment' },
  { value: 'scheduling', label: 'Scheduling / shifts' },
  { value: 'hiring', label: 'Hiring / interviews' },
  { value: 'access', label: 'Account / technical issue' },
  { value: 'other', label: 'Other (describe)' },
]

export const ACTION_OPTIONS = [
  { value: 'answered', label: 'Answered questions' },
  { value: 'guided', label: 'Guided through navigation' },
  { value: 'timesheet', label: 'Created / corrected timesheet' },
  { value: 'transferred', label: 'Transferred to appropriate team' },
  { value: 'escalated', label: 'Escalated for review' },
  { value: 'follow-up', label: 'Follow-up required' },
  { value: 'other', label: 'Other (describe)' },
]

export const OUTCOME_OPTIONS = [
  { value: 'resolved', label: 'Resolved' },
  { value: 'pending', label: 'Pending follow-up' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'escalated', label: 'Escalated' },
]

export const EMPTY_WRAP_UP = Object.freeze({
  caller: '',
  fullName: '',
  issue: '',
  customIssue: '',
  action: '',
  customAction: '',
  outcome: '',
  nextSteps: '',
})

const singleLine = value => String(value ?? '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim()
const description = value => String(value ?? '').trim().replace(/\r\n?/g, '\n')

function getOption(options, value) {
  return options.find(option => option.value === value)?.label || ''
}

export function validateCallWrapUp(draft = {}) {
  const issues = []
  if (!getOption(CALLER_OPTIONS, draft.caller)) issues.push('Choose who called.')
  if (!singleLine(draft.fullName)) issues.push('Enter the client / member full name.')
  if (!getOption(ISSUE_OPTIONS, draft.issue)) issues.push('Choose the issue.')
  if (draft.issue === 'other' && !singleLine(draft.customIssue)) issues.push('Describe the issue.')
  if (!getOption(ACTION_OPTIONS, draft.action)) issues.push('Choose the action taken.')
  if (draft.action === 'other' && !singleLine(draft.customAction)) issues.push('Describe the action taken.')
  if (!getOption(OUTCOME_OPTIONS, draft.outcome)) issues.push('Choose the outcome.')
  if (draft.outcome === 'pending' && !singleLine(draft.nextSteps)) issues.push('Describe the next step for pending follow-up.')
  return issues
}

export function formatCallWrapUpBlock(draft = {}) {
  const errors = validateCallWrapUp(draft)
  if (errors.length) throw new Error(errors[0])
  const issue = draft.issue === 'other'
    ? singleLine(draft.customIssue) : getOption(ISSUE_OPTIONS, draft.issue)
  const action = draft.action === 'other'
    ? singleLine(draft.customAction) : getOption(ACTION_OPTIONS, draft.action)
  const lines = [
    'CALL WRAP-UP',
    'Caller: ' + getOption(CALLER_OPTIONS, draft.caller),
    'Client / member full name: ' + singleLine(draft.fullName),
    'Issue: ' + issue,
    'Action taken: ' + action,
    'Outcome: ' + getOption(OUTCOME_OPTIONS, draft.outcome),
  ]
  if (description(draft.nextSteps)) lines.push('Details / next steps: ' + description(draft.nextSteps))
  return lines.join('\n')
}
