export const TIMEZONES = [
  { label: 'Cebu City', timeZone: 'Asia/Manila' },
  { label: 'Eastern', timeZone: 'America/New_York' },
  { label: 'Central', timeZone: 'America/Chicago' },
  { label: 'Pacific', timeZone: 'America/Los_Angeles' },
  { label: 'India', timeZone: 'Asia/Kolkata' },
]

export function formatTimeInZone(date, timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

export function formatDateInZone(date, timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
  }).format(date)
}
