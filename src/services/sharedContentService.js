import {
  FALLBACK_ANNOUNCEMENTS,
  FALLBACK_DASHBOARD_MEDIA,
  FALLBACK_LINKS,
  FALLBACK_RECOGNITION,
} from '../constants/defaults.js'
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient.js'
import { loadTeamSpotlight } from './teamSpotlightService.js'

export const RECOGNITION_BUCKET = 'recognition-images'
export const DASHBOARD_MEDIA_BUCKET = 'dashboard-media'

const mapAnnouncement = (row) => ({
  id: row.id,
  title: row.title,
  message: row.message,
  publishedAt: row.published_at || row.created_at,
  sortOrder: row.sort_order ?? 0,
  isPublished: row.is_published ?? true,
})

const mapLink = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description || '',
  url: row.url,
  sortOrder: row.sort_order ?? 0,
  isPublished: row.is_published ?? true,
})

const mapRecognition = (row, client) => {
  const imagePath = row.image_path || null
  const imageUrl = imagePath
    ? client.storage.from(RECOGNITION_BUCKET).getPublicUrl(imagePath).data.publicUrl
    : ''

  return {
    id: row.id,
    employeeName: row.employee_name,
    category: row.category,
    caption: row.caption || '',
    imagePath,
    imageUrl,
    sortOrder: row.sort_order ?? 0,
    isPublished: row.is_published ?? true,
  }
}

const mapPhotoGalleryItem = (row, client) => {
  const imagePath = row.image_path || null
  const imageUrl = imagePath
    ? client.storage.from(RECOGNITION_BUCKET).getPublicUrl(imagePath).data.publicUrl
    : ''

  return {
    id: row.id,
    gallery: row.gallery,
    title: row.title || '',
    caption: row.caption || '',
    imagePath,
    imageUrl,
    sortOrder: row.sort_order ?? 0,
    isPublished: row.is_published ?? true,
  }
}

const mapDashboardMedia = (row, client) => {
  const imagePath = row.image_path || null
  const imageUrl = imagePath
    ? client.storage.from(DASHBOARD_MEDIA_BUCKET).getPublicUrl(imagePath).data.publicUrl
    : ''

  return {
    slot: row.slot,
    imagePath,
    imageUrl,
    answer: row.answer || '',
    revealAt: row.reveal_at || null,
    isPublished: row.is_published ?? true,
  }
}

function dashboardMediaObject(rows, client) {
  const result = Object.fromEntries(
    Object.entries(FALLBACK_DASHBOARD_MEDIA).map(([slot, value]) => [slot, { ...value }]),
  )
  for (const row of rows || []) {
    result[row.slot] = mapDashboardMedia(row, client)
  }
  return result
}

function splitPhotoGalleries(rows, client) {
  const mapped = (rows || []).map((row) => mapPhotoGalleryItem(row, client))
  return {
    kudos: mapped.filter((item) => item.gallery === 'kudos'),
    familyMoments: mapped.filter((item) => item.gallery === 'sharecare_family_moments'),
  }
}

export async function loadSharedContent() {
  if (!isSupabaseConfigured) {
    return {
      announcements: FALLBACK_ANNOUNCEMENTS,
      links: FALLBACK_LINKS,
      recognition: FALLBACK_RECOGNITION,
      dashboardMedia: FALLBACK_DASHBOARD_MEDIA,
      kudos: [],
      familyMoments: [],
      teamSpotlight: null,
      source: 'preview',
    }
  }

  const client = getSupabaseClient()
  const [announcementsResult, linksResult, recognitionResult, mediaResult, galleryResult, spotlightResult] = await Promise.all([
    client
      .from('announcements')
      .select('id,title,message,published_at,sort_order,is_published,created_at')
      .eq('is_published', true)
      .order('sort_order')
      .order('published_at', { ascending: false }),
    client
      .from('shared_links')
      .select('id,title,description,url,sort_order,is_published')
      .eq('is_published', true)
      .order('sort_order'),
    client
      .from('top_performers')
      .select('id,employee_name,category,caption,image_path,sort_order,is_published')
      .eq('is_published', true)
      .order('sort_order'),
    client
      .from('dashboard_media')
      .select('slot,image_path,answer,reveal_at,is_published')
      .eq('is_published', true),
    client
      .from('photo_gallery_items')
      .select('id,gallery,title,caption,image_path,sort_order,is_published')
      .eq('is_published', true)
      .order('sort_order')
      .order('created_at', { ascending: false }),
    loadTeamSpotlight(client).catch((error) => {
      console.warn('Team spotlight is not available yet.', error)
      return null
    }),
  ])

  const firstError = announcementsResult.error || linksResult.error || recognitionResult.error || null
  if (firstError) throw firstError
  if (mediaResult.error) console.warn('Dashboard media is not available yet.', mediaResult.error)
  if (galleryResult.error) console.warn('Photo galleries are not available yet.', galleryResult.error)

  const galleries = galleryResult.error
    ? { kudos: [], familyMoments: [] }
    : splitPhotoGalleries(galleryResult.data, client)

  return {
    announcements: (announcementsResult.data || []).map(mapAnnouncement),
    links: (linksResult.data || []).map(mapLink),
    recognition: (recognitionResult.data || []).map((row) => mapRecognition(row, client)),
    dashboardMedia: mediaResult.error
      ? FALLBACK_DASHBOARD_MEDIA
      : dashboardMediaObject(mediaResult.data, client),
    teamSpotlight: spotlightResult,
    ...galleries,
    source: 'supabase',
  }
}

export async function loadAdminContent() {
  const client = await requireSecureAdmin()
  const [announcementsResult, linksResult, recognitionResult, mediaResult, galleryResult, spotlightResult] = await Promise.all([
    client
      .from('announcements')
      .select('id,title,message,published_at,sort_order,is_published,created_at')
      .order('sort_order')
      .order('published_at', { ascending: false }),
    client
      .from('shared_links')
      .select('id,title,description,url,sort_order,is_published')
      .order('sort_order'),
    client
      .from('top_performers')
      .select('id,employee_name,category,caption,image_path,sort_order,is_published')
      .order('sort_order'),
    client
      .from('dashboard_media')
      .select('slot,image_path,answer,reveal_at,is_published'),
    client
      .from('photo_gallery_items')
      .select('id,gallery,title,caption,image_path,sort_order,is_published')
      .order('sort_order')
      .order('created_at', { ascending: false }),
    loadTeamSpotlight(client, true).catch((error) => {
      console.warn('Team spotlight draft is temporarily unavailable.', error)
      return null
    }),
  ])

  const firstError = announcementsResult.error || linksResult.error || recognitionResult.error || null
  if (firstError) throw firstError
  if (galleryResult.error) console.warn('Photo galleries are not available yet.', galleryResult.error)

  const galleries = galleryResult.error
    ? { kudos: [], familyMoments: [] }
    : splitPhotoGalleries(galleryResult.data, client)

  return {
    announcements: (announcementsResult.data || []).map(mapAnnouncement),
    links: (linksResult.data || []).map(mapLink),
    recognition: (recognitionResult.data || []).map((row) => mapRecognition(row, client)),
    dashboardMedia: mediaResult.error
      ? FALLBACK_DASHBOARD_MEDIA
      : dashboardMediaObject(mediaResult.data, client),
    teamSpotlight: spotlightResult,
    ...galleries,
  }
}

async function requireSecureAdmin() {
  const client = getSupabaseClient()
  const { data, error } = await client.auth.getUser()
  if (error) throw error

  if (data.user?.app_metadata?.docutool_role !== 'admin') {
    const authorizationError = new Error(
      'A signed-in Supabase user with app_metadata.docutool_role = "admin" is required for global writes.',
    )
    authorizationError.code = 'ADMIN_AUTH_REQUIRED'
    throw authorizationError
  }

  return client
}

const announcementPayload = (values) => ({
  title: values.title.trim(),
  message: values.message.trim(),
  is_published: values.isPublished ?? true,
  sort_order: Number(values.sortOrder) || 0,
  published_at: values.publishedAt || new Date().toISOString(),
})

const linkPayload = (values) => ({
  title: values.title.trim(),
  description: values.description?.trim() || null,
  url: values.url.trim(),
  is_published: values.isPublished ?? true,
  sort_order: Number(values.sortOrder) || 0,
})

export async function saveAnnouncement(values) {
  const client = await requireSecureAdmin()
  const query = values.id
    ? client.from('announcements').update(announcementPayload(values)).eq('id', values.id)
    : client.from('announcements').insert(announcementPayload(values))
  const { error } = await query
  if (error) throw error
}

export async function deleteAnnouncement(id) {
  const client = await requireSecureAdmin()
  const { error } = await client.from('announcements').delete().eq('id', id)
  if (error) throw error
}

export async function saveSharedLink(values) {
  const client = await requireSecureAdmin()
  const query = values.id
    ? client.from('shared_links').update(linkPayload(values)).eq('id', values.id)
    : client.from('shared_links').insert(linkPayload(values))
  const { error } = await query
  if (error) throw error
}

export async function deleteSharedLink(id) {
  const client = await requireSecureAdmin()
  const { error } = await client.from('shared_links').delete().eq('id', id)
  if (error) throw error
}

function safeFilename(filename) {
  return filename.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')
}

async function uploadImage(client, bucket, file, prefix = '') {
  const directory = prefix ? `${prefix}/` : `${crypto.randomUUID()}/`
  const filePath = `${directory}${Date.now()}-${safeFilename(file.name)}`
  const { error } = await client.storage.from(bucket).upload(filePath, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  })
  if (error) throw error
  return filePath
}

export async function saveRecognition(values, imageFile) {
  const client = await requireSecureAdmin()
  let imagePath = values.imagePath || null
  let uploadedPath = null

  if (imageFile) {
    uploadedPath = await uploadImage(client, RECOGNITION_BUCKET, imageFile)
    imagePath = uploadedPath
  }

  const payload = {
    employee_name: values.employeeName.trim(),
    category: values.category,
    caption: values.caption?.trim() || null,
    image_path: imagePath,
    is_published: values.isPublished ?? true,
    sort_order: Number(values.sortOrder) || 0,
  }

  const query = values.id
    ? client.from('top_performers').update(payload).eq('id', values.id)
    : client.from('top_performers').insert(payload)
  const { error } = await query

  if (error) {
    if (uploadedPath) await client.storage.from(RECOGNITION_BUCKET).remove([uploadedPath])
    throw error
  }

  if (uploadedPath && values.imagePath) {
    await client.storage.from(RECOGNITION_BUCKET).remove([values.imagePath])
  }
}

export async function deleteRecognition(id, imagePath) {
  const client = await requireSecureAdmin()
  const { error } = await client.from('top_performers').delete().eq('id', id)
  if (error) throw error
  if (imagePath) await client.storage.from(RECOGNITION_BUCKET).remove([imagePath])
}

export async function savePhotoGalleryItem(values, imageFile) {
  const client = await requireSecureAdmin()
  let imagePath = values.imagePath || null
  let uploadedPath = null

  if (imageFile) {
    uploadedPath = await uploadImage(
      client,
      RECOGNITION_BUCKET,
      imageFile,
      `galleries/${values.gallery}`,
    )
    imagePath = uploadedPath
  }

  if (!imagePath) throw new Error('Choose a photo before saving.')

  const payload = {
    gallery: values.gallery,
    title: values.title?.trim() || null,
    caption: values.caption?.trim() || null,
    image_path: imagePath,
    is_published: values.isPublished ?? true,
    sort_order: Number(values.sortOrder) || 0,
  }

  const query = values.id
    ? client.from('photo_gallery_items').update(payload).eq('id', values.id)
    : client.from('photo_gallery_items').insert(payload)
  const { error } = await query

  if (error) {
    if (uploadedPath) await client.storage.from(RECOGNITION_BUCKET).remove([uploadedPath])
    throw error
  }

  if (uploadedPath && values.imagePath) {
    await client.storage.from(RECOGNITION_BUCKET).remove([values.imagePath])
  }
}

export async function deletePhotoGalleryItem(id, imagePath) {
  const client = await requireSecureAdmin()
  const { error } = await client.from('photo_gallery_items').delete().eq('id', id)
  if (error) throw error
  if (imagePath) await client.storage.from(RECOGNITION_BUCKET).remove([imagePath])
}

export async function saveDashboardMedia(values, imageFile) {
  const client = await requireSecureAdmin()
  let imagePath = values.imagePath || null
  let uploadedPath = null

  if (imageFile) {
    uploadedPath = await uploadImage(client, DASHBOARD_MEDIA_BUCKET, imageFile, values.slot)
    imagePath = uploadedPath
  }

  const payload = {
    slot: values.slot,
    image_path: imagePath,
    answer: values.answer?.trim() || null,
    reveal_at: values.revealAt || null,
    is_published: values.isPublished ?? true,
    updated_at: new Date().toISOString(),
  }

  const { error } = await client
    .from('dashboard_media')
    .upsert(payload, { onConflict: 'slot' })

  if (error) {
    if (uploadedPath) await client.storage.from(DASHBOARD_MEDIA_BUCKET).remove([uploadedPath])
    throw error
  }

  if (uploadedPath && values.imagePath) {
    await client.storage.from(DASHBOARD_MEDIA_BUCKET).remove([values.imagePath])
  }
}
