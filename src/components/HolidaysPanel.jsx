import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { holidaysForYear, HOLIDAY_SOURCES, HOLIDAY_YEARS } from '../constants/holidays.js'

function HolidayColumn({ title, items, source }) {
  return <div className="holiday-column">
    <h3>{title}</h3>
    <ul>{items.map((item) => <li key={item.name}>
      <span className="holiday-column__date">{item.date ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${item.date}T12:00:00Z`)) : 'TBA'}</span>
      <span>{item.name}{item.observed && <small>Observed</small>}{!item.date && <small>Awaiting proclamation</small>}</span>
    </li>)}</ul>
    <a href={source} target="_blank" rel="noopener noreferrer">Official calendar ↗</a>
  </div>
}

export function HolidaysPanel() {
  const currentYear = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', year: 'numeric' }).format(new Date()))
  const [year, setYear] = useState(HOLIDAY_YEARS.includes(currentYear) ? currentYear : HOLIDAY_YEARS.at(-1))
  const holidays = holidaysForYear(year)
  return <section className="panel holidays-panel" aria-labelledby="holidays-title">
    <div className="panel-heading">
      <div><h2 id="holidays-title"><CalendarDays size={16} aria-hidden="true" /> Regular Holidays</h2>
        <p className="panel-subtitle">US federal &amp; Philippine regular holidays.</p></div>
      <label><span className="sr-only">Holiday year</span><select value={year} onChange={(event) => setYear(Number(event.target.value))}>
        {HOLIDAY_YEARS.map((value) => <option key={value}>{value}</option>)}
      </select></label>
    </div>
    <div className="holiday-columns">
      <HolidayColumn title="US Regular Holidays" items={holidays.us} source={HOLIDAY_SOURCES.us} />
      <HolidayColumn title="Philippine Regular Holidays" items={holidays.philippines} source={HOLIDAY_SOURCES.philippines[year]} />
    </div>
    <p className="holidays-panel__note">US dates show federal observance. Company schedules may differ.</p>
    {year === 2026 && <p className="holidays-panel__note">Eid dates: <a href={HOLIDAY_SOURCES.eidFitr2026} target="_blank" rel="noopener noreferrer">Fitr</a> · <a href={HOLIDAY_SOURCES.eidAdha2026} target="_blank" rel="noopener noreferrer">Adha</a></p>}
    {!HOLIDAY_YEARS.includes(currentYear) && <p className="holidays-panel__note">The {currentYear} calendar has not been added yet; showing {year}.</p>}
  </section>
}
