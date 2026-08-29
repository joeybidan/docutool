import { useEffect, useState } from 'react'
import { recordVisitorSession } from '../services/visitorService.js'

export function useVisitorCounter() {
  const [count, setCount] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    recordVisitorSession()
      .then((value) => {
        if (active) setCount(value)
      })
      .catch((visitError) => {
        console.warn('DocuTool visitor count is unavailable.', visitError)
        if (active) setError(visitError)
      })

    return () => {
      active = false
    }
  }, [])

  return { count, error }
}
