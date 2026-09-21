import { useEffect, useState } from 'react'
import { subscribeToOnlineDeviceCount } from '../services/visitorService.js'

export function useVisitorCounter() {
  const [count, setCount] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setError(null)
    const unsubscribe = subscribeToOnlineDeviceCount(
      (value) => {
        setCount(value)
        setError(null)
      },
      (presenceError) => {
        console.warn('DocuTool realtime visitor count is unavailable.', presenceError)
        setError(presenceError)
      },
    )

    return unsubscribe
  }, [])

  return { count, error }
}
