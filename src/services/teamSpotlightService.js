import { getSupabaseClient } from './supabaseClient.js'

const ENDPOINT = '/api/team-spotlight'

async function adminHeaders(client) {
  const { data: userData, error: userError } = await client.auth.getUser()
  if (userError) throw userError
  if (userData.user?.app_metadata?.docutool_role !== 'admin') {
    throw new Error('An authorized DocuTool admin account is required.')
  }
  const { data, error } = await client.auth.getSession()
  if (error) throw error
  if (!data.session?.access_token) throw new Error('Your admin session expired. Sign in again.')
  return { Authorization: `Bearer ${data.session.access_token}` }
}

async function readResponse(response) {
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Team Spotlight is temporarily unavailable.')
  return data
}

export async function loadTeamSpotlight(client, includeDraft = false) {
  const headers = includeDraft ? await adminHeaders(client) : {}
  const response = await fetch(includeDraft ? `${ENDPOINT}?draft=1` : ENDPOINT, {
    headers,
    cache: 'no-store',
  })
  const item = await readResponse(response)
  if (!item) return null
  if (includeDraft && item.imagePath && !item.isPublished) {
    const photoResponse = await fetch(`${ENDPOINT}?draft=1&image=1`, { headers, cache: 'no-store' })
    if (photoResponse.ok) item.imageUrl = URL.createObjectURL(await photoResponse.blob())
  }
  return item
}

export async function saveTeamSpotlight(values, imageFile) {
  const headers = await adminHeaders(getSupabaseClient())
  if (values.isPublished && !values.isApproved) {
    throw new Error('Confirm the employee approved the complete spotlight before publishing.')
  }
  if (values.qa.some(({ question, answer }) => Boolean(question.trim()) !== Boolean(answer.trim()))) {
    throw new Error('Each Q&A needs both a question and an answer.')
  }
  const qa = values.qa.map(({ question, answer }) => ({
    question: question.trim(),
    answer: answer.trim(),
  })).filter(({ question }) => question)
  if (values.isPublished && !qa.length) throw new Error('Add at least one approved Q&A before publishing.')
  if (imageFile && (!['image/jpeg', 'image/png', 'image/webp'].includes(imageFile.type) || imageFile.size > 5 * 1024 * 1024)) {
    throw new Error('Choose a PNG, JPEG, or WebP photo smaller than 5 MB.')
  }
  const form = new FormData()
  form.append('data', JSON.stringify({ ...values, qa, imageUrl: undefined }))
  if (imageFile) form.append('photo', imageFile)
  await readResponse(await fetch(ENDPOINT, { method: 'PUT', headers, body: form }))
}

export async function clearTeamSpotlight() {
  const headers = await adminHeaders(getSupabaseClient())
  await readResponse(await fetch(ENDPOINT, { method: 'DELETE', headers }))
}
