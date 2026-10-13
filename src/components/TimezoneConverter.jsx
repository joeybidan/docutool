import { useMemo, useState } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { dateTimeInputInZone, formatFullDateTimeInZone, resolveZonedDateTime, TIMEZONES } from '../utils/timezones.js'

export function TimezoneConverter() {
  const [from, setFrom] = useState('Asia/Manila')
  const [to, setTo] = useState('America/New_York')
  const [value, setValue] = useState(() => dateTimeInputInZone(new Date(), 'Asia/Manila').slice(0, 16))
  const [occurrence, setOccurrence] = useState(0)
  const resolved = useMemo(() => resolveZonedDateTime(value, from), [value, from])
  const instant = resolved.instants[occurrence] ?? resolved.instants[0]

  function swap() {
    if (instant !== undefined) setValue(dateTimeInputInZone(new Date(instant), to).slice(0, 16))
    setFrom(to)
    setTo(from)
    setOccurrence(0)
  }

  return (
    <section className="timezone-converter" aria-labelledby="timezone-converter-title">
      <strong id="timezone-converter-title">Timezone converter</strong>
      <div className="timezone-converter__fields">
        <label><span>From</span>
          <select aria-label="From timezone" value={from} onChange={(event) => { setFrom(event.target.value); setOccurrence(0) }}>
            {TIMEZONES.map((zone) => <option key={zone.timeZone} value={zone.timeZone}>{zone.label}</option>)}
          </select>
        </label>
        <label className="timezone-converter__datetime"><span>Date &amp; time</span>
          <input type="datetime-local" value={value} onChange={(event) => { setValue(event.target.value); setOccurrence(0) }} />
        </label>
        <button className="timezone-swap" type="button" onClick={swap} aria-label="Swap timezones" title="Swap timezones"><ArrowRightLeft size={15} /></button>
        <label><span>To</span>
          <select aria-label="To timezone" value={to} onChange={(event) => setTo(event.target.value)}>
            {TIMEZONES.map((zone) => <option key={zone.timeZone} value={zone.timeZone}>{zone.label}</option>)}
          </select>
        </label>
      </div>
      {resolved.instants.length > 1 && <label className="timezone-occurrence">Clocks move back; this time occurs twice.
        <select aria-label="Converter time occurrence" value={occurrence} onChange={(event) => setOccurrence(Number(event.target.value))}>
          <option value={0}>First occurrence</option><option value={1}>Second occurrence</option>
        </select>
      </label>}
      <output className={resolved.error ? 'timezone-converter__error' : 'timezone-converter__result'} aria-live="polite">
        {resolved.error || `${TIMEZONES.find((zone) => zone.timeZone === to).label}: ${formatFullDateTimeInZone(new Date(instant), to)}`}
      </output>
    </section>
  )
}
