import { useEffect, useState } from 'react'
import { Clock3 } from 'lucide-react'
import { formatDateInZone, formatTimeInZone, TIMEZONES } from '../utils/timezones.js'

export function TimezoneClocks() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="timezone-clocks" aria-label="Current times by location">
      {TIMEZONES.map((zone) => (
        <div className="timezone-clock" key={zone.timeZone}>
          <Clock3 size={15} strokeWidth={1.8} aria-hidden="true" />
          <span className="timezone-clock__copy">
            <span className="timezone-clock__label">{zone.label}</span>
            <time dateTime={now.toISOString()}>{formatTimeInZone(now, zone.timeZone)}</time>
          </span>
          <span className="timezone-clock__date">{formatDateInZone(now, zone.timeZone)}</span>
        </div>
      ))}
    </div>
  )
}
