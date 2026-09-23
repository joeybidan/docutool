const CURRENT = 'current'
const PHOTO_LIMIT = 5 * 1024 * 1024
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const NO_STORE = { 'Cache-Control': 'no-store' }

const json = (data, status = 200) => Response.json(data, { status, headers: NO_STORE })

function validate(input) {
  if (!input || typeof input !== 'object') throw new Error('Spotlight details are required.')
  const field = (name, limit, required = false) => {
    if (typeof input[name] !== 'string') throw new Error(`${name} must be text.`)
    const value = input[name].trim()
    if (value.length > limit || (required && !value)) throw new Error(`Check the ${name} field.`)
    return value
  }
  if (!Array.isArray(input.qa) || input.qa.length > 3) throw new Error('Use up to three Q&A pairs.')
  const qa = input.qa.map((pair) => {
    if (!pair || typeof pair.question !== 'string' || typeof pair.answer !== 'string') {
      throw new Error('Each Q&A needs a question and an answer.')
    }
    const question = pair.question.trim()
    const answer = pair.answer.trim()
    if (question.length > 200 || answer.length > 600 || Boolean(question) !== Boolean(answer)) {
      throw new Error('Check the Q&A fields.')
    }
    return { question, answer }
  }).filter(({ question }) => question)

  const item = {
    employeeName: field('employeeName', 100, true),
    team: field('team', 100),
    weekLabel: field('weekLabel', 50),
    hook: field('hook', 180, true),
    intro: field('intro', 500, true),
    funFact: field('funFact', 250),
    qa,
    isApproved: input.isApproved === true,
    isPublished: input.isPublished === true,
  }
  if (item.isPublished && (!item.isApproved || !qa.length)) {
    throw new Error('Obtain approval and add at least one Q&A before publishing.')
  }
  return item
}

export async function handleTeamSpotlight(request, { store, verifyAdmin }) {
  try {
    const url = new URL(request.url)
    const draft = url.searchParams.has('draft')
    if (!['GET', 'PUT', 'DELETE'].includes(request.method)) return json({ error: 'Method not allowed.' }, 405)
    if ((request.method !== 'GET' || draft) && !(await verifyAdmin(request))) {
      return json({ error: 'Your admin session expired. Sign in again.' }, 401)
    }

    if (request.method === 'GET') {
      const item = await store.get(CURRENT, { type: 'json' })
      if (!item || (!draft && !item.isPublished)) return json(null)
      if (url.searchParams.has('image')) {
        if (!item.imagePath) return new Response(null, { status: 404, headers: NO_STORE })
        const photo = await store.get(item.imagePath, { type: 'arrayBuffer' })
        if (!photo) return new Response(null, { status: 404, headers: NO_STORE })
        return new Response(photo, {
          headers: { ...NO_STORE, 'Content-Type': item.imageType, 'X-Content-Type-Options': 'nosniff' },
        })
      }
      return json({
        ...item,
        imageUrl: item.imagePath && !draft ? '/api/team-spotlight?image=1' : '',
        imageType: undefined,
      })
    }

    if (request.method === 'DELETE') {
      const current = await store.get(CURRENT, { type: 'json' })
      await store.delete(CURRENT)
      if (current?.imagePath) await store.delete(current.imagePath)
      return json({ ok: true })
    }

    const form = await request.formData()
    const item = validate(JSON.parse(String(form.get('data'))))
    const photo = form.get('photo')
    if (photo && (!(photo instanceof Blob) || !IMAGE_TYPES.includes(photo.type) || photo.size > PHOTO_LIMIT)) {
      return json({ error: 'Choose a PNG, JPEG, or WebP photo smaller than 5 MB.' }, 400)
    }
    const current = await store.get(CURRENT, { type: 'json' })
    let newPath = null
    if (photo) {
      newPath = `photos/${crypto.randomUUID()}`
      await store.set(newPath, await photo.arrayBuffer())
    }
    try {
      await store.setJSON(CURRENT, {
        ...item,
        imagePath: newPath || current?.imagePath || null,
        imageType: newPath ? photo.type : current?.imageType || null,
      })
    } catch (error) {
      if (newPath) await store.delete(newPath)
      throw error
    }
    if (newPath && current?.imagePath) await store.delete(current.imagePath)
    return json({ ok: true })
  } catch (error) {
    if (error instanceof SyntaxError || error.message?.startsWith('Check ') || error.message?.includes('Q&A') || error.message?.includes('Spotlight details') || error.message?.includes('must be text') || error.message?.includes('approval')) {
      return json({ error: error.message }, 400)
    }
    console.error('Team Spotlight unavailable', error instanceof Error ? error.name : 'Error')
    return json({ error: 'Team Spotlight is temporarily unavailable.' }, 503)
  }
}
