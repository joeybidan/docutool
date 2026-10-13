import { TIMEZONES } from './timezones.js'

export const CLOCK_ALARMS_KEY = 'docutool.clock-alarms.v1'

export function parseClockAlarms(value) {
  try {
    const parsed = JSON.parse(value)
    if (!parsed || parsed.version !== 1 || !parsed.alarms || typeof parsed.alarms !== 'object') return {}
    return Object.fromEntries(TIMEZONES.flatMap(({ timeZone }) => {
      const alarm = parsed.alarms[timeZone]
      if (!alarm || !Number.isFinite(alarm.at) || Math.abs(alarm.at) > 8.64e15 || !['armed', 'ringing'].includes(alarm.status)) return []
      return [[timeZone, { at: alarm.at, status: alarm.status, label: typeof alarm.label === 'string' ? alarm.label.slice(0, 60) : '' }]]
    }))
  } catch { return {} }
}

export function triggerDueAlarms(alarms, now) {
  let changed = false
  const next = Object.fromEntries(Object.entries(alarms).map(([zone, alarm]) => {
    if (alarm.status !== 'armed' || alarm.at > now) return [zone, alarm]
    changed = true
    return [zone, { ...alarm, status: 'ringing' }]
  }))
  return changed ? next : alarms
}
