import { useEffect, useState } from 'react'
import { Bell, ChevronDown, Clock3 } from 'lucide-react'
import { formatDateInZone, formatFullDateTimeInZone, formatTimeInZone, TIMEZONES } from '../utils/timezones.js'
import { CLOCK_ALARMS_KEY, parseClockAlarms, triggerDueAlarms } from '../utils/clockAlarms.js'
import { useAlarmSound } from '../hooks/useAlarmSound.js'
import { ClockAlarmDialog } from './ClockAlarmDialog.jsx'
import { TimezoneConverter } from './TimezoneConverter.jsx'

export function TimezoneClocks() {
  const [now, setNow] = useState(() => new Date())
  const [alarms, setAlarms] = useState(() => {
    try { return parseClockAlarms(window.localStorage.getItem(CLOCK_ALARMS_KEY)) } catch { return {} }
  })
  const [editingZone, setEditingZone] = useState(null)
  const [converterOpen, setConverterOpen] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const ringing = TIMEZONES.filter((zone) => alarms[zone.timeZone]?.status === 'ringing')
  const { soundReady, enableSound, testSound } = useAlarmSound(ringing.length > 0)

  useEffect(() => {
    try {
      window.localStorage.setItem(CLOCK_ALARMS_KEY, JSON.stringify({ version: 1, alarms }))
      setStorageError(false)
    } catch { setStorageError(true) }
  }, [alarms])

  useEffect(() => {
    const tick = () => {
      const current = new Date()
      setNow(current)
      setAlarms((previous) => triggerDueAlarms(previous, current.getTime()))
    }
    tick()
    const timer = window.setInterval(tick, 1000)
    window.addEventListener('pageshow', tick)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('pageshow', tick)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])

  function removeAlarm(timeZone) {
    setAlarms((previous) => {
      const next = { ...previous }
      delete next[timeZone]
      return next
    })
  }

  return (
    <div className="timezone-tools">
      <div className="timezone-clocks" aria-label="Current times by location">
      {TIMEZONES.map((zone) => {
        const alarm = alarms[zone.timeZone]
        return <button type="button" className={`timezone-clock${alarm ? ` timezone-clock--${alarm.status}` : ''}`} key={zone.timeZone}
          onClick={() => { void enableSound(); setEditingZone(zone) }} aria-haspopup="dialog"
          aria-label={`${zone.label} clock — ${alarm?.status === 'ringing' ? 'alarm ringing' : alarm ? 'edit alarm' : 'set alarm'}`}
          title={alarm ? `${alarm.status === 'ringing' ? 'Alarm due' : 'Alarm set'}: ${formatFullDateTimeInZone(new Date(alarm.at), zone.timeZone)}${alarm.label ? ` — ${alarm.label}` : ''}` : `Click to set a ${zone.label} alarm`}>
          {alarm ? <Bell size={15} aria-hidden="true" /> : <Clock3 size={15} strokeWidth={1.8} aria-hidden="true" />}
          <span className="timezone-clock__copy">
            <span className="timezone-clock__label">{zone.label}</span>
            <time dateTime={now.toISOString()}>{formatTimeInZone(now, zone.timeZone)}</time>
            <span className="timezone-clock__date">{formatDateInZone(now, zone.timeZone)}</span>
            {alarm && <span className="timezone-clock__alarm">{alarm.status === 'ringing' ? 'Alarm due!' : `Alarm ${formatDateInZone(new Date(alarm.at), zone.timeZone)} · ${new Intl.DateTimeFormat('en-US', { timeZone: zone.timeZone, hour: 'numeric', minute: '2-digit' }).format(new Date(alarm.at))}`}</span>}
          </span>
        </button>
      })}
      </div>
      <div className={`timezone-converter-drawer${converterOpen ? ' timezone-converter-drawer--open' : ''}`}>
        <button
          type="button"
          className="timezone-converter-toggle"
          aria-expanded={converterOpen}
          aria-controls="timezone-converter-panel"
          onClick={() => setConverterOpen((current) => !current)}
        >
          <span>Timezone converter</span>
          <ChevronDown size={14} aria-hidden="true" />
        </button>
        {converterOpen && (
          <div id="timezone-converter-panel">
            <TimezoneConverter />
          </div>
        )}
      </div>
      {Object.keys(alarms).length > 0 && !soundReady && <button type="button" className="alarm-enable-sound" onClick={testSound}>Enable alarm sound (required after reopening)</button>}
      {storageError && <p className="timezone-converter__error" role="status">Browser storage is unavailable. Alarms will last only while this page is open.</p>}
      {ringing.length > 0 && <div className="clock-alarm-alert" role="alert">
        {ringing.map((zone) => <div key={zone.timeZone} className="clock-alarm-alert__row">
          <span><Bell size={15} aria-hidden="true" /> <strong>{zone.label} alarm</strong>{alarms[zone.timeZone].label && ` — ${alarms[zone.timeZone].label}`}</span>
          <button type="button" onClick={() => removeAlarm(zone.timeZone)} aria-label={`Stop ${zone.label} alarm`}>Stop</button>
          <button type="button" onClick={() => { void enableSound(); setAlarms((previous) => ({ ...previous, [zone.timeZone]: { ...previous[zone.timeZone], at: Date.now() + 300000, status: 'armed' } })) }} aria-label={`Snooze ${zone.label} alarm for 5 minutes`}>Snooze 5 min</button>
        </div>)}
      </div>}
      {editingZone && <ClockAlarmDialog key={editingZone.timeZone} zone={editingZone} alarm={alarms[editingZone.timeZone]}
        soundReady={soundReady} onTestSound={testSound} onClose={() => setEditingZone(null)}
        onSave={(alarm) => { void enableSound(); setAlarms((previous) => ({ ...previous, [editingZone.timeZone]: alarm })); setEditingZone(null) }}
        onRemove={() => { removeAlarm(editingZone.timeZone); setEditingZone(null) }} />}
    </div>
  )
}
