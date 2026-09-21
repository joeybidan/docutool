import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient.js'

const LAST_SUBMISSION_KEY = 'docutool:last-anonymous-suggestion-at:v1'
const SUBMISSION_COOLDOWN_MS = 30_000

function mapSuggestion(row) {
  return {
    id: row.id,
    message: row.message,
    createdAt: row.created_at,
    isVisible: row.is_visible ?? true,
  }
}

export async function loadPublicSuggestions(limit = 30) {
  if (!isSupabaseConfigured) return []
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('anonymous_suggestions')
    .select('id,message,created_at,is_visible')
    .eq('is_visible', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data || []).map(mapSuggestion)
}

export async function submitAnonymousSuggestion(message) {
  if (!isSupabaseConfigured) throw new Error('Suggestions are unavailable while Supabase is offline.')

  const cleaned = message.trim()
  if (cleaned.length < 2) throw new Error('Please enter a suggestion before submitting.')
  if (cleaned.length > 500) throw new Error('Keep suggestions to 500 characters or fewer.')

  const now = Date.now()
  const previous = Number(window.localStorage.getItem(LAST_SUBMISSION_KEY) || 0)
  if (previous && now - previous < SUBMISSION_COOLDOWN_MS) {
    const seconds = Math.ceil((SUBMISSION_COOLDOWN_MS - (now - previous)) / 1000)
    throw new Error(`Please wait ${seconds} seconds before sending another suggestion.`)
  }

  const client = getSupabaseClient()
  const { error } = await client.from('anonymous_suggestions').insert({ message: cleaned })
  if (error) throw error

  window.localStorage.setItem(LAST_SUBMISSION_KEY, String(now))
}

async function requireSecureAdmin() {
  const client = getSupabaseClient()
  const { data, error } = await client.auth.getUser()
  if (error) throw error
  if (data.user?.app_metadata?.docutool_role !== 'admin') {
    throw new Error('An authorized DocuTool admin account is required.')
  }
  return client
}

export async function loadAdminSuggestions(limit = 100) {
  const client = await requireSecureAdmin()
  const { data, error } = await client
    .from('anonymous_suggestions')
    .select('id,message,created_at,is_visible')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data || []).map(mapSuggestion)
}

export async function deleteAnonymousSuggestion(id) {
  const client = await requireSecureAdmin()
  const { error } = await client.from('anonymous_suggestions').delete().eq('id', id)
  if (error) throw error
}
