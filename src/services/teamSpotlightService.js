import { getSupabaseClient } from './supabaseClient.js'

const BUCKET = 'team-spotlight'
const COLUMNS = 'id,employee_name,team,week_label,hook,intro,fun_fact,qa,image_path,is_approved,is_published'

async function adminClient() {
  const client = getSupabaseClient()
  const { data, error } = await client.auth.getUser()
  if (error) throw error
  if (data.user?.app_metadata?.docutool_role !== 'admin') {
    throw new Error('An authorized DocuTool admin account is required.')
  }
  return client
}

async function mapSpotlight(row, client) {
  if (!row) return null
  let imageUrl = ''
  if (row.image_path) {
    const { data, error } = await client.storage.from(BUCKET).createSignedUrl(row.image_path, 3600)
    if (error) console.warn('Team spotlight photo is unavailable.', error)
    else imageUrl = data.signedUrl
  }
  return {
    id: row.id,
    employeeName: row.employee_name,
    team: row.team || '',
    weekLabel: row.week_label || '',
    hook: row.hook || '',
    intro: row.intro || '',
    funFact: row.fun_fact || '',
    qa: row.qa || [],
    imagePath: row.image_path,
    imageUrl,
    isApproved: row.is_approved,
    isPublished: row.is_published,
  }
}

export async function loadTeamSpotlight(client, includeDraft = false) {
  let query = client.from('team_spotlight').select(COLUMNS).eq('id', 1)
  if (!includeDraft) query = query.eq('is_published', true)
  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return mapSpotlight(data, client)
}

export async function saveTeamSpotlight(values, imageFile) {
  const client = await adminClient()
  if (values.isPublished && !values.isApproved) {
    throw new Error('Confirm the employee approved the complete spotlight before publishing.')
  }
  if (values.qa.some(({ question, answer }) => Boolean(question.trim()) !== Boolean(answer.trim()))) {
    throw new Error('Each Q&A needs both a question and an answer.')
  }
  const qa = values.qa.map(({ question, answer }) => ({
    question: question.trim(),
    answer: answer.trim(),
  })).filter(({ question, answer }) => question && answer)
  if (values.isPublished && !qa.length) throw new Error('Add at least one approved Q&A before publishing.')
  if (imageFile && (!['image/jpeg', 'image/png', 'image/webp'].includes(imageFile.type) || imageFile.size > 5 * 1024 * 1024)) {
    throw new Error('Choose a PNG, JPEG, or WebP photo smaller than 5 MB.')
  }

  let imagePath = values.imagePath || null
  let uploadedPath = null
  if (imageFile) {
    uploadedPath = `portraits/${crypto.randomUUID()}.${imageFile.type.split('/')[1] === 'jpeg' ? 'jpg' : imageFile.type.split('/')[1]}`
    const { error } = await client.storage.from(BUCKET).upload(uploadedPath, imageFile, {
      contentType: imageFile.type,
      upsert: false,
    })
    if (error) throw error
    imagePath = uploadedPath
  }

  const payload = {
    id: 1,
    employee_name: values.employeeName.trim(),
    team: values.team.trim(),
    week_label: values.weekLabel.trim(),
    hook: values.hook.trim(),
    intro: values.intro.trim(),
    fun_fact: values.funFact.trim(),
    qa,
    image_path: imagePath,
    is_approved: values.isApproved,
    is_published: values.isPublished,
  }
  const { error } = await client.from('team_spotlight').upsert(payload, { onConflict: 'id' })
  if (error) {
    if (uploadedPath) await client.storage.from(BUCKET).remove([uploadedPath])
    throw error
  }
  if (uploadedPath && values.imagePath) {
    const { error: cleanupError } = await client.storage.from(BUCKET).remove([values.imagePath])
    if (cleanupError) console.warn('Previous spotlight photo could not be removed.', cleanupError)
  }
}

export async function clearTeamSpotlight() {
  const client = await adminClient()
  const { data, error } = await client.from('team_spotlight')
    .delete().eq('id', 1).select('image_path').maybeSingle()
  if (error) throw error
  if (data?.image_path) {
    const { error: cleanupError } = await client.storage.from(BUCKET).remove([data.image_path])
    if (cleanupError) console.warn('Spotlight photo could not be removed.', cleanupError)
  }
}
