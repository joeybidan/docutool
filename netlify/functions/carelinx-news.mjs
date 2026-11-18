import { FEEDS, currentUSMonth, parseFeed, mergeNews } from './_shared/caregiverNews.mjs'

let cache = null
let expiresAt = 0

async function getFeed(feed, month, now) {
  try {
    const response = await fetch(feed.url, {
      headers: { Accept: 'application/rss+xml, application/xml, text/xml;q=0.9', 'User-Agent': 'DocuToolNews/1.0 (+https://ctsdocutool.netlify.app)' },
      signal: AbortSignal.timeout(7000),
    })
    if (!response.ok) throw new Error('News provider unavailable')
    const data = await response.text()
    return { ok: true, stories: parseFeed(data.slice(0, 2_000_000), feed, month, now) }
  } catch (error) {
    console.warn('Caregiver news provider unavailable:', feed.source, error.message)
    return { ok: false, stories: [] }
  }
}

export default async function handler(request) {
  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 })
  const now = new Date()
  const month = currentUSMonth(now)
  if (cache && Date.now() < expiresAt && cache.month === month) {
    return Response.json(cache, { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=900, stale-while-revalidate=900' } })
  }
  const results = await Promise.all(FEEDS.map(feed => getFeed(feed, month, now)))
  if (!results.some(result => result.ok)) {
    return Response.json({ month, stories: [], error: 'News feeds temporarily unavailable', refreshedAt: now.toISOString() },
      { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
  cache = {
    month,
    stories: mergeNews(results.map(result => result.stories)),
    refreshedAt: now.toISOString(),
    sourcesAvailable: results.filter(result => result.ok).length,
    sourcesTotal: FEEDS.length,
  }
  expiresAt = Date.now() + 30 * 60 * 1000
  return Response.json(cache, { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=900, stale-while-revalidate=900' } })
}

export const config = {
  path: '/api/carelinx-news',
  method: 'GET',
}
