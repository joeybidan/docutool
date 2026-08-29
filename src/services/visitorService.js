import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient.js'

const VISITOR_SESSION_KEY = 'docutool:visitor-session:v1'
let visitPromise = null

function getSessionId() {
  const existing = window.sessionStorage.getItem(VISITOR_SESSION_KEY)
  if (existing) return existing

  const sessionId = crypto.randomUUID()
  window.sessionStorage.setItem(VISITOR_SESSION_KEY, sessionId)
  return sessionId
}

export async function recordVisitorSession() {
  if (!isSupabaseConfigured) return null
  if (visitPromise) return visitPromise

  visitPromise = (async () => {
    const client = getSupabaseClient()
    const { data, error } = await client.rpc('record_docutool_visit', {
      p_session_id: getSessionId(),
    })
    if (error) throw error
    return typeof data === 'number' ? data : Number(data)
  })()

  try {
    return await visitPromise
  } catch (error) {
    visitPromise = null
    throw error
  }
}
