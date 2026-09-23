import { getStore, getDeployStore } from '@netlify/blobs'
import type { Config, Context } from '@netlify/functions'
import { handleCareMatch } from './_shared/service.mjs'

export default async (req: Request, context: Context) => {
  try {
    const production = context.deploy.context === 'production'
    const scope = production ? 'production' : context.deploy.id
    const store = production
      ? getStore({ name: 'carematch-v1', consistency: 'strong' })
      : getDeployStore({ name: 'carematch-v1', consistency: 'strong' })
    return await handleCareMatch(req, { store, scope })
  } catch (error) {
    console.error('CareMatch service unavailable', error instanceof Error ? error.name : 'Error')
    return Response.json({ error: 'Rankings are temporarily unavailable. Your round stays saved; try again.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}

export const config: Config = { path: '/api/carematch', rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ['ip', 'domain'] } }
