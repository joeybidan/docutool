import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { Button } from './ui/Button.jsx'
import { dateTimeInputInZone, formatFullDateTimeInZone, resolveZonedDateTime } from '../utils/timezones.js'

export function ClockAlarmDialog({ zone, alarm, onSave, onRemove, onClose, soundReady, onTestSound }) {
  const dialogRef = useRef(null)
  const [value, setValue] = useState(() => dateTimeInputInZone(new Date(alarm?.at > Date.now() ? alarm.at : Date.now() + 300000), zone.timeZone).slice(0, 16))
  const [label, setLabel] = useState(alarm?.label || '')
  const [occurrence, setOccurrence] = useState(() => {
    if (!alarm) return 0
    const existing = resolveZonedDateTime(dateTimeInputInZone(new Date(alarm.at), zone.timeZone).slice(0, 16), zone.timeZone)
    return Math.max(0, existing.instants.indexOf(Math.floor(alarm.at / 60000) * 60000))
  })
  const [error, setError] = useState('')
  const resolved = useMemo(() => resolveZonedDateTime(value, zone.timeZone), [value, zone.timeZone])

  useEffect(() => { dialogRef.current.showModal() }, [])

  function submit(event) {
    event.preventDefault()
    const at = resolved.instants[occurrence] ?? resolved.instants[0]
    if (resolved.error) { setError(resolved.error); return }
    if (at <= Date.now()) { setError('Choose a future date and time in this clock’s timezone.'); return }
    onSave({ at, label: label.trim(), status: 'armed' })
  }

  return <dialog className="clock-alarm-dialog" ref={dialogRef} aria-labelledby="clock-alarm-title" onCancel={(event) => { event.preventDefault(); onClose() }} onClick={(event) => {
    if (event.target !== dialogRef.current) return
    const bounds = dialogRef.current.getBoundingClientRect()
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose()
  }}>
    <div className="clock-alarm-dialog__heading"><h2 id="clock-alarm-title"><Bell size={18} /> {zone.label} alarm</h2>
      <button type="button" className="clock-alarm-close" onClick={onClose} aria-label="Close alarm settings"><X size={18} /></button>
    </div>
    <p>Set the date and time as shown on the <strong>{zone.label}</strong> clock.</p>
    <form onSubmit={submit}>
      <label>Alarm date &amp; time<input type="datetime-local" value={value} required onChange={(event) => { setValue(event.target.value); setOccurrence(0); setError('') }} autoFocus /></label>
      {resolved.instants.length > 1 && <label>This time occurs twice when clocks move back.
        <select aria-label="Alarm time occurrence" value={occurrence} onChange={(event) => setOccurrence(Number(event.target.value))}>
          <option value={0}>First occurrence</option><option value={1}>Second occurrence</option>
        </select>
      </label>}
      <label>Reminder (optional)<input value={label} maxLength={60} placeholder="Lunch, callback, end of shift…" onChange={(event) => setLabel(event.target.value)} /></label>
      {resolved.instants.length > 0 && <p className="clock-alarm-preview">{formatFullDateTimeInZone(new Date(resolved.instants[occurrence] ?? resolved.instants[0]), zone.timeZone)}</p>}
      {(error || resolved.error) && <p className="timezone-converter__error" role="alert">{error || resolved.error}</p>}
      <div className="clock-alarm-dialog__actions">
        <Button variant="primary" type="submit">{alarm ? 'Update alarm' : 'Set alarm'}</Button>
        {alarm && <Button type="button" onClick={onRemove}>Remove alarm</Button>}
        <Button type="button" onClick={onTestSound}>Test sound</Button>
      </div>
    </form>
    <p className="clock-alarm-help">{soundReady ? 'Sound enabled.' : 'Click Test sound to enable audio.'} Green glow = armed. Blinking red = alarm due. Keep DocuTool open and your device awake; muted or sleeping devices may not sound. One alarm per clock, saved in this browser.</p>
  </dialog>
}
