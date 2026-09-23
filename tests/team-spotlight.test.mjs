import { test } from 'node:test'
import assert from 'node:assert/strict'
import { handleTeamSpotlight } from '../netlify/functions/_shared/team-spotlight.mjs'

function harness() {
  const values = new Map()
  const store = {
    get: async (key) => values.get(key) ?? null,
    set: async (key, value) => { values.set(key, value) },
    setJSON: async (key, value) => { values.set(key, value) },
    delete: async (key) => { values.delete(key) },
  }
  const verifyAdmin = async (request) => request.headers.get('Authorization') === 'Bearer admin'
  const run = (request) => handleTeamSpotlight(request, { store, verifyAdmin })
  const makeRequest = (method, data, photo, token = 'admin') => {
    const form = new FormData()
    form.append('data', JSON.stringify(data))
    if (photo) form.append('photo', photo, 'portrait.png')
    return new Request('https://example.com/api/team-spotlight', {
      method, headers: { Authorization: `Bearer ${token}` }, body: form,
    })
  }
  return { run, makeRequest }
}

const sample = {
  employeeName: 'Alex',
  team: 'Caregiver Support',
  weekLabel: 'Sep 21–27',
  hook: 'A helpful teammate.',
  intro: 'Meet Alex.',
  funFact: 'Loves cooking.',
  qa: [{ question: 'Favorite tip?', answer: 'Ask early.' }],
  isApproved: false,
  isPublished: false,
}

test('draft and photo require admin; approved publication becomes visible', async () => {
  const { run, makeRequest } = harness()
  const photo = new Blob(['sample-image'], { type: 'image/png' })
  assert.equal((await run(makeRequest('PUT', sample, photo, 'intruder'))).status, 401)
  assert.equal((await run(makeRequest('PUT', sample, photo))).status, 200)
  assert.equal(await (await run(new Request('https://example.com/api/team-spotlight'))).json(), null)
  assert.equal((await run(new Request('https://example.com/api/team-spotlight?draft=1'))).status, 401)
  assert.equal((await run(new Request('https://example.com/api/team-spotlight?image=1'))).status, 200)
  assert.equal(await (await run(new Request('https://example.com/api/team-spotlight?image=1'))).json(), null)
  const admin = { Authorization: 'Bearer admin' }
  const draft = await (await run(new Request('https://example.com/api/team-spotlight?draft=1', { headers: admin }))).json()
  assert.equal(draft.employeeName, 'Alex')
  const draftPhoto = await run(new Request('https://example.com/api/team-spotlight?draft=1&image=1', { headers: admin }))
  assert.equal(await draftPhoto.text(), 'sample-image')

  const published = { ...sample, isApproved: true, isPublished: true }
  assert.equal((await run(makeRequest('PUT', published))).status, 200)
  const publicItem = await (await run(new Request('https://example.com/api/team-spotlight'))).json()
  assert.equal(publicItem.imageUrl, '/api/team-spotlight?image=1')
  assert.equal(await (await run(new Request('https://example.com/api/team-spotlight?image=1'))).text(), 'sample-image')
  assert.equal((await run(makeRequest('PUT', { ...published, isApproved: false }))).status, 400)
  assert.equal((await run(makeRequest('PUT', { ...published, qa: [{ question: 'Oops', answer: '' }] }))).status, 400)

  assert.equal((await run(makeRequest('PUT', sample))).status, 200)
  assert.equal(await (await run(new Request('https://example.com/api/team-spotlight'))).json(), null)
})
