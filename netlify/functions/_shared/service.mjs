import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { replay, RULES_VERSION } from '../../../src/carematch/engine.mjs'
import { topFive, publicBoard } from './ranking.mjs'

const PLAYER_COOKIE = 'carematch_player='
const ROUND_LIFETIME = 24 * 60 * 60 * 1000
const isUuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
const safeScope = scope => createHash('sha256').update(scope).digest('hex').slice(0, 16)
const prefix = scope => `scores/${safeScope(scope)}/`
const roundPrefix = scope => `rounds/${safeScope(scope)}/`

function reply(body, status = 200, cookie) {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  if (cookie) headers['Set-Cookie'] = cookie
  return new Response(JSON.stringify(body), { status, headers })
}

async function entries(store, base) {
  const { blobs } = await store.list({ prefix: base })
  const result = await Promise.all(blobs.map(async ({ key }) => {
    const data = await store.get(key, { type: 'json' })
    return data && { ...data, key }
  }))
  return result.filter(Boolean)
}

// Each score is its own immutable candidate. There is no shared leaderboard
// blob that could lose a simultaneous update. Store only current Top 5 records.
async function submit(store, candidate, base) {
  const possible = topFive([...(await entries(store, base)), candidate])
  if (possible.some(e => e.id === candidate.id)) await store.setJSON(candidate.key, candidate)
  const snapshot = await entries(store, base)
  const board = topFive(snapshot)
  const keep = new Set(board.map(e => e.key))
  await Promise.all(snapshot.filter(e => !keep.has(e.key)).map(e => store.delete(e.key)))
  return board
}

async function cleanExpiredRounds(store, base, now) {
  // One scan per hour removes abandoned rounds without a background job.
  const marker = `${base}last-cleanup`
  const last = Number(await store.get(marker)) || 0
  if (now - last < 3600000) return
  const rounds = (await entries(store, base)).filter(entry => entry.key !== marker)
  await Promise.all(rounds.filter(r => r.expires < now).map(r => store.delete(r.key)))
  await store.set(marker, String(now))
}

export async function handleCareMatch(req, { store, scope = 'production', now = Date.now() }) {
  const url = new URL(req.url), origin = req.headers.get('origin')
  if (origin && origin !== url.origin) return reply({ error: 'Same-site requests only.' }, 403)
  const rawCookie = (req.headers.get('cookie') || '').split(';').map(s => s.trim())
    .find(s => s.startsWith(PLAYER_COOKIE))?.slice(PLAYER_COOKIE.length)
  // Unlisted player IDs are random browser secrets; the public board exposes
  // only the chosen alias and score. No employee login is required.
  const player = isUuid(rawCookie) ? rawCookie : null
  const scores = prefix(scope)
  if (req.method === 'GET') return reply(publicBoard(topFive(await entries(store, scores)), player))
  if (req.method !== 'POST') return reply({ error: 'Method not allowed.' }, 405)
  if (Number(req.headers.get('content-length')) > 24000) return reply({ error: 'Round too large.' }, 413)
  const raw = await req.text()
  if (Buffer.byteLength(raw) > 24000) return reply({ error: 'Round too large.' }, 413)
  let body
  try { body = JSON.parse(raw) } catch { return reply({ error: 'Invalid request.' }, 400) }
  if (!body || typeof body !== 'object') return reply({ error: 'Invalid request.' }, 400)
  const rounds = roundPrefix(scope)
  if (body.op === 'start') {
    const name = typeof body.name === 'string' ? body.name.trim().toUpperCase() : ''
    if (!/^[A-Z0-9_]{2,10}$/.test(name)) return reply({ error: 'Use 2–10 letters, numbers, or underscores.' }, 400)
    const id = player || randomUUID(), seed = randomBytes(4).readUInt32LE(), round = randomUUID()
    await cleanExpiredRounds(store, rounds, now)
    await store.setJSON(`${rounds}${round}`, { v: RULES_VERSION, seed, player: id, name, scope,
      startedAt: now, expires: now + ROUND_LIFETIME })
    const cookie = `${PLAYER_COOKIE}${id}; HttpOnly; SameSite=Strict; Path=/api/carematch; Max-Age=31536000${url.protocol === 'https:' ? '; Secure' : ''}`
    return reply({ seed, round, expires: now + ROUND_LIFETIME }, 200, cookie)
  }
  if (body.op !== 'submit') return reply({ error: 'Unknown action.' }, 400)
  if (!isUuid(body.round)) return reply({ error: 'Invalid round.' }, 400)
  const stored = await store.get(`${rounds}${body.round}`, { type: 'json' })
  if (!stored || !player || stored.player !== player || stored.scope !== scope || stored.v !== RULES_VERSION || stored.startedAt > now || stored.expires < now) {
    return reply({ error: 'This ranked round expired. Start a new round to compete.' }, 401)
  }
  let state
  try { state = replay(stored.seed, body.actions) } catch { return reply({ error: 'Round could not be verified.' }, 400) }
  if (!state.ended || state.score <= 0) return reply({ error: 'Finish the shift before submitting.' }, 400)
  // A round's first verified score is final. Later submissions use a new round.
  // The action hash separates scores if two requests complete concurrently.
  const id = createHash('sha256').update(`${body.round}:${JSON.stringify(body.actions)}`).digest('hex')
  const candidate = { id, key: `${scores}${id}`, player, name: stored.name, score: state.score,
    supported: state.supported, startedAt: stored.startedAt }
  const board = await submit(store, candidate, scores)
  await store.delete(`${rounds}${body.round}`)
  return reply({ ...publicBoard(board, player), verifiedScore: state.score,
    placed: board.some(e => e.id === id) })
}
