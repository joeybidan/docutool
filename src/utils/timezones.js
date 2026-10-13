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

const dateTimeFormatters = new Map()

export function dateTimeInputInZone(date, timeZone) {
  if (!dateTimeFormatters.has(timeZone)) {
    dateTimeFormatters.set(timeZone, new Intl.DateTimeFormat('en-CA', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }))
  }
  const parts = Object.fromEntries(dateTimeFormatters.get(timeZone).formatToParts(date)
    .filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]))
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`
}

// A wall-clock time can map to zero instants (spring forward), one, or two (fall back).
// Sample both sides of the transition, then round-trip each offset through Intl.
export function resolveZonedDateTime(value, timeZone) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value)
  if (!match) return { instants: [], error: 'Choose a valid date and time.' }
  const [, year, month, day, hour, minute, second = '00'] = match
  const normalized = `${year}-${month}-${day}T${hour}:${minute}:${second}`
  const wallTime = Date.parse(`${normalized}Z`)
  if (!Number.isFinite(wallTime) || new Date(wallTime).toISOString().slice(0, 19) !== normalized) {
    return { instants: [], error: 'Choose a valid date and time.' }
  }
  const offsets = new Set([-36, 0, 36].map((hours) => {
    const sample = wallTime + hours * 3600000
    return Date.parse(`${dateTimeInputInZone(new Date(sample), timeZone)}Z`) - sample
  }))
  const instants = [...offsets].map((offset) => wallTime - offset)
    .filter((instant) => dateTimeInputInZone(new Date(instant), timeZone) === normalized)
    .sort((a, b) => a - b)
  return { instants, error: instants.length ? '' : 'This time does not exist because the clocks move forward. Choose another time.' }
}

export function formatFullDateTimeInZone(date, timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  }).format(date)
}
