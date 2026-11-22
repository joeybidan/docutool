// Browser-only completeness hints for the current note. Not a QA grade or AI analysis.
// Do not upload, log, or transmit the note text.
const NAME_LABEL = /^\s*(?:[•*-]\s*)?(?:(?:client(?:\s*\/\s*member)?|member|caller|customer|patient)(?:\s+full)?\s+name|full\s+name|name\s+of\s+(?:the\s+)?(?:caller|client|member|customer)|name)\s*(?::|-|\bis\b)\s*([^\r\n]+)/gim
const ISSUE_LABEL = /^\s*(?:[•*-]\s*)?(?:issue(?:\s+description)?|concern|problem|request|reason\s+for\s+(?:the\s+)?call|purpose\s+of\s+call|called\s+about)\s*(?::|-|\bis\b)\s*([^\r\n]+)/gim
const ACTION_LABEL = /^\s*(?:[•*-]\s*)?(?:action\s+taken|resolution|steps?\s+taken|action\s+performed|assistance\s+provided|resolved\s+by|disposition)\s*(?::|-|\bis\b)\s*([^\r\n]+)/gim
const NEXT_STEP_LABEL = /^\s*(?:[•*-]\s*)?(?:next\s+steps?|follow[- ]?up\s+(?:plan|action|details|owner)|callback\s+(?:plan|details)|details\s*\/\s*next\s+steps)\s*(?::|-|\bis\b)\s*([^\r\n]+)/gim

const PLACEHOLDER = /^(?:n\/?a|not applicable|not provided|none|unknown|tbd|to be determined|pending|unspecified|blank|not sure|to follow|first last|first name last name|same as above|[?._ -]+)$/i
function useful(value) {
  const text = String(value || '').trim()
  return Boolean(text && !PLACEHOLDER.test(text))
}
function labeled(text, pattern, validator = useful) {
  // Each pattern has a /g flag; a later complete value beats an earlier placeholder.
  return [...text.matchAll(pattern)].some(match => validator(match[1]))
}
function looksLikeFullName(raw) {
  if (!useful(raw)) return false
  // Many agents add extra facts after a comma. Evaluate only the name portion.
  const candidate = raw.split(/[,;|]/)[0].trim()
    .replace(/^(?:mr|mrs|ms|dr)\.?\s+/i, '')
  if (candidate.length > 85 || /\b(?:unknown|redacted|not provided)\b/i.test(candidate)) return false
  const words = candidate.split(/\s+/).filter(Boolean)
  return words.length >= 2 && words.length <= 6 &&
    words.every(word => /^[\p{L}][\p{L}.'’-]*$/u.test(word))
}

function hasFullName(text) {
  if (labeled(text, NAME_LABEL, looksLikeFullName)) return true
  // Catch explicit introductions in traditional free-form notes.
  return /\b(?:spoke|talked|connected|followed up|met)\s+with\s+(?:the\s+)?(?:client|member|customer|caller)\s+(?:named\s+)?[\p{L}][\p{L}'’.-]+\s+[\p{L}][\p{L}'’.-]+/iu.test(text)
}
function hasIssue(text) {
  if (labeled(text, ISSUE_LABEL)) return true
  return /\b(?:called|contacted|reached out)\b[^\n.!?]{0,45}\b(?:about|regarding|because of|for help with)\b\s+\S+/i.test(text) ||
    /\b(?:needs?\s+(?:help|assistance)\s+with|requested\s+(?:help|assistance)\s+with|asked\s+about|question\s+about|unable\s+to|could\s+not|cannot|trouble\s+with)\b\s+\S+/i.test(text)
}
function hasAction(text) {
  if (labeled(text, ACTION_LABEL)) return true
  // Do not count only "Outcome: Resolved" as evidence of an actual action.
  return /\b(?:advised|guided|explained|informed|assisted|answered|resolved\s+by|transferred|escalated|submitted|created|corrected|updated|processed|provided|walked\s+(?:the\s+)?(?:client|member|caller)\s+through|scheduled|confirmed)\b/i.test(text)
}
function hasPendingFollowUp(text) {
  return /^\s*(?:[•*-]\s*)?(?:outcome|status|disposition)\s*:\s*(?:pending|awaiting|follow[- ]?up\s+(?:required|needed))\b/im.test(text)
}
function hasNextSteps(text) {
  if (labeled(text, NEXT_STEP_LABEL)) return true
  return /\b(?:will\s+call\s+back|callback\s+scheduled|follow[- ]?up\s+scheduled|will\s+follow\s+up|assigned\s+to\s+\S+)\b/i.test(text)
}

export function reviewDocumentation(note) {
  const text = String(note ?? '').replace(/\r\n?/g, '\n')
  const checks = [
    {
      id: 'full-name',
      label: 'Full name',
      found: hasFullName(text),
      suggestion: 'Add a clearly labeled client/member or caller full name (first and last).',
      explanation: 'A possible full name was detected. Verify it belongs to the correct person.',
    },
    {
      id: 'issue',
      label: 'Reason for the call',
      found: hasIssue(text),
      suggestion: 'Describe the problem or reason for contacting you, for example: Issue: …',
      explanation: 'An issue or reason was detected. Verify it accurately describes the caller’s request.',
    },
    {
      id: 'action',
      label: 'Action / resolution',
      found: hasAction(text),
      suggestion: 'Describe what you actually did, for example: Action taken: … Do not claim a resolution that did not occur.',
      explanation: 'An action was detected. Verify what happened and whether the issue was resolved or transferred.',
    },
  ]
  if (hasPendingFollowUp(text)) {
    checks.push({
      id: 'next-steps',
      label: 'Pending follow-up plan',
      found: hasNextSteps(text),
      suggestion: 'For a pending outcome, record the next action and owner/time when known.',
      explanation: 'A possible follow-up plan was detected. Verify its ownership and timing.',
    })
  }
  return {
    checks,
    warnings: checks.filter(check => !check.found),
    warningCount: checks.filter(check => !check.found).length,
  }
}
