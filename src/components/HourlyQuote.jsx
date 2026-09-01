import { useEffect, useState } from 'react'

const HOURLY_QUOTES = [
  'Your calm focus can turn a difficult call into a better day.',
  'Small steps, done with care, create meaningful progress.',
  'Every clear note is a gift to the person who reads it next.',
  'Patience and preparation make excellent service feel effortless.',
  'Show up ready, stay curious, and let your best work follow.',
  'A thoughtful response can be the bright spot in someone’s day.',
  'Consistency today builds confidence for tomorrow.',
  'Bring clarity, kindness, and purpose to every conversation.',
  'The care you put into the details makes a real difference.',
  'Progress grows when preparation becomes a daily habit.',
  'Listen closely, respond thoughtfully, and finish with confidence.',
  'You do not need a perfect day to do something meaningful.',
]

const currentHourKey = () => Math.floor(Date.now() / 3_600_000)

export function HourlyQuote() {
  const [hourKey, setHourKey] = useState(currentHourKey)

  useEffect(() => {
    let timeoutId

    const scheduleNextHour = () => {
      const now = new Date()
      const delay =
        (60 - now.getMinutes()) * 60_000 - now.getSeconds() * 1_000 - now.getMilliseconds()

      timeoutId = window.setTimeout(() => {
        setHourKey(currentHourKey())
        scheduleNextHour()
      }, delay)
    }

    scheduleNextHour()
    return () => window.clearTimeout(timeoutId)
  }, [])

  return (
    <p className="hourly-quote" aria-label="Motivational quote of the hour">
      “{HOURLY_QUOTES[hourKey % HOURLY_QUOTES.length]}”
    </p>
  )
}

