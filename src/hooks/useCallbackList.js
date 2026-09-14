import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'docutool:callbacks:v1'

function normalize(items) {
  if (!Array.isArray(items)) return []
  return items
    .filter((item) => item && typeof item.name === 'string')
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
      name: item.name.trim(),
      profileLink: typeof item.profileLink === 'string' ? item.profileLink.trim() : '',
      scheduledAt: typeof item.scheduledAt === 'string' ? item.scheduledAt : '',
      status: ['pending', 'success', 'missed', 'will-call-again'].includes(item.status)
        ? item.status
        : 'pending',
    }))
    .filter((item) => item.name)
}

function loadCallbacks() {
  if (typeof window === 'undefined') return []
  try {
    return normalize(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]'))
  } catch (error) {
    console.warn('DocuTool could not read callback data.', error)
    return []
  }
}

export function useCallbackList() {
  const [callbacks, setCallbacks] = useState(loadCallbacks)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(callbacks))
    } catch (error) {
      console.warn('DocuTool could not save callback data.', error)
    }
  }, [callbacks])

  const saveCallback = useCallback((values) => {
    setCallbacks((current) => {
      const item = {
        id: values.id || crypto.randomUUID(),
        name: values.name.trim(),
        profileLink: values.profileLink?.trim() || '',
        scheduledAt: values.scheduledAt || '',
        status: values.status || 'pending',
      }
      const exists = current.some((callback) => callback.id === item.id)
      return exists
        ? current.map((callback) => (callback.id === item.id ? item : callback))
        : [...current, item]
    })
  }, [])

  const deleteCallback = useCallback((id) => {
    setCallbacks((current) => current.filter((callback) => callback.id !== id))
  }, [])

  const setCallbackStatus = useCallback((id, status) => {
    setCallbacks((current) =>
      current.map((callback) => (callback.id === id ? { ...callback, status } : callback)),
    )
  }, [])

  return { callbacks, saveCallback, deleteCallback, setCallbackStatus }
}
