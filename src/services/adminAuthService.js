import { getSupabaseClient } from './supabaseClient.js'

const ADMIN_ROLE = 'admin'

function hasAdminRole(user) {
  return user?.app_metadata?.docutool_role === ADMIN_ROLE
}

function isMissingSession(error) {
  return error?.name === 'AuthSessionMissingError' || error?.message === 'Auth session missing!'
}

function adminAuthorizationError() {
  const error = new Error(
    'This Supabase account is not authorized to manage DocuTool. Use the account marked as a DocuTool admin.',
  )
  error.code = 'ADMIN_AUTH_REQUIRED'
  return error
}

export async function getSignedInAdmin() {
  const client = getSupabaseClient()
  const { data, error } = await client.auth.getUser()

  if (error) {
    if (isMissingSession(error)) return null
    throw error
  }

  return hasAdminRole(data.user) ? data.user : null
}

export async function signInAdmin(email, password) {
  const client = getSupabaseClient()
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  if (error) throw error

  if (!hasAdminRole(data.user)) {
    await client.auth.signOut({ scope: 'local' })
    throw adminAuthorizationError()
  }

  return data.user
}

export async function signOutAdmin() {
  const client = getSupabaseClient()
  const { error } = await client.auth.signOut({ scope: 'local' })
  if (error) throw error
}

