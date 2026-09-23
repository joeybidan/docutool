import { useCallback, useEffect, useState } from 'react'
import {
  FALLBACK_ANNOUNCEMENTS,
  FALLBACK_DASHBOARD_MEDIA,
  FALLBACK_LINKS,
  FALLBACK_RECOGNITION,
} from '../constants/defaults.js'
import { loadSharedContent } from '../services/sharedContentService.js'

export function useSharedContent() {
  const [state, setState] = useState({
    announcements: FALLBACK_ANNOUNCEMENTS,
    links: FALLBACK_LINKS,
    recognition: FALLBACK_RECOGNITION,
    dashboardMedia: FALLBACK_DASHBOARD_MEDIA,
    kudos: [],
    familyMoments: [],
    teamSpotlight: null,
    source: 'preview',
    loading: true,
    error: null,
  })

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }))
    try {
      const data = await loadSharedContent()
      setState({ ...data, loading: false, error: null })
      return data
    } catch (error) {
      console.warn('DocuTool could not load shared content.', error)
      setState({
        announcements: FALLBACK_ANNOUNCEMENTS,
        links: FALLBACK_LINKS,
        recognition: FALLBACK_RECOGNITION,
        dashboardMedia: FALLBACK_DASHBOARD_MEDIA,
        kudos: [],
        familyMoments: [],
        teamSpotlight: null,
        source: 'unavailable',
        loading: false,
        error,
      })
      return null
    }
  }, [])

  useEffect(() => {
    refresh()
    const timer = window.setInterval(refresh, 45 * 60 * 1000)
    return () => window.clearInterval(timer)
  }, [refresh])

  return { ...state, refresh }
}
