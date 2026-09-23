import { getStore, getDeployStore } from '@netlify/blobs'
import type { Config, Context } from '@netlify/functions'
import { handleTeamSpotlight } from './_shared/team-spotlight.mjs'

async function verifyAdmin(request: Request) {
  const token = request.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1]
  const url = Netlify.env.get('VITE_SUPABASE_URL')
  const key = Netlify.env.get('VITE_SUPABASE_PUBLISHABLE_KEY') || Netlify.env.get('VITE_SUPABASE_ANON_KEY')
  if (!token || !url || !key || new URL(url).hostname !== 'blefujvmurpkgmiazbiq.supabase.co') return false

  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: key, Authorization: `Bearer ${token}` },
  })
  if (!response.ok) return false
  const user = await response.json()
  return user.app_metadata?.docutool_role === 'admin'
}

export default async (request: Request, context: Context) => {
  const store = context.deploy.context === 'production'
    ? getStore({ name: 'team-spotlight-v1', consistency: 'strong' })
    : getDeployStore({ name: 'team-spotlight-v1', consistency: 'strong' })
  return handleTeamSpotlight(request, { store, verifyAdmin })
}

export const config: Config = { path: '/api/team-spotlight' }
