// Small, dependency-free RSS parser for trusted, fixed publisher feeds.
// Only current-month US caregiver/home care stories are displayed.
export const FEEDS = [
  { url: 'https://homehealthcarenews.com/feed/', source: 'Home Health Care News', category: 'Home Care', wide: true },
  { url: 'https://kffhealthnews.org/topics/aging/feed/', source: 'KFF Health News', category: 'Aging' },
  { url: 'https://kffhealthnews.org/topics/medicare/feed/', source: 'KFF Health News', category: 'Medicare' },
  { url: 'https://kffhealthnews.org/topics/medicaid/feed/', source: 'KFF Health News', category: 'Medicaid' },
]
const CARE_RE = /\b(home.?health|home.?care|caregiver|caregiving|older adult|aging|elder|senior|medicare|medicaid|long.term care|hospice|nurs(?:e|ing)|in.home|care aide|care worker|patient access|health insurance|personal care|disability|assisted living)\b/i

export function currentUSMonth(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit',
  }).formatToParts(now)
  const part = name => parts.find(p => p.type === name)?.value
  return `${part('year')}-${part('month')}`
}

export function textValue(raw = '') {
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp|rsquo|lsquo|ldquo|rdquo|hellip|mdash|ndash);/gi,
      (_, entity) => {
        const dict = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘',
          ldquo: '“', rdquo: '”', hellip: '…', mdash: '—', ndash: '–' }
        if (entity.startsWith('#')) {
          const code = entity[1].toLowerCase() === 'x' ? Number.parseInt(entity.slice(2), 16) : Number(entity.slice(1))
          return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ''
        }
        return dict[entity.toLowerCase()] || ''
      })
    .replace(/\s+/g, ' ').trim()
}

function tagValue(item, names) {
  for (const name of names) {
    const match = item.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'))
    if (match) return textValue(match[1])
  }
  return ''
}

function validLink(link) {
  try {
    const url = new URL(link.trim())
    return url.protocol === 'https:' && /(^|\.)(kffhealthnews\.org|homehealthcarenews\.com)$/.test(url.hostname)
      ? url.href : null
  } catch { return null }
}

export function parseFeed(xml, feed, month = currentUSMonth(), now = new Date()) {
  if (typeof xml !== 'string' || xml.length > 2_000_000) return []
  const entries = xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) || []
  const items = []
  for (const entry of entries.slice(0, 90)) {
    const title = tagValue(entry, ['title'])
    const dateText = tagValue(entry, ['pubDate', 'dc:date', 'published', 'updated'])
    const timestamp = Date.parse(dateText)
    if (!Number.isFinite(timestamp) || timestamp > now.getTime() + 86_400_000) continue
    const date = new Date(timestamp).toISOString().slice(0, 10)
    if (!date.startsWith(month)) continue
    const link = validLink(tagValue(entry, ['link']))
    if (!link || !title) continue
    const description = tagValue(entry, ['description', 'content:encoded']).slice(0, 230)
    if (!feed.wide && !CARE_RE.test(title + ' ' + description)) continue
    const imageCandidate = entry.match(/<(?:media:thumbnail|media:content|enclosure)\b[^>]*\burl=["'](https:[^"']+)["']/i)?.[1]
    let imageUrl = null
    try {
      if (imageCandidate) {
        const parsed = new URL(imageCandidate.replace(/&amp;/g, '&'))
        if (parsed.protocol === 'https:' && !parsed.username && !parsed.password) imageUrl = parsed.href
      }
    } catch { /* Image is optional. */ }
    items.push({ title: title.slice(0, 180), date, source: feed.source,
      type: feed.category, region: 'USA', url: link, description, imageUrl })
  }
  return items
}

export function mergeNews(groups, limit = 24) {
  const seen = new Set()
  return groups.flat().sort((a,b) => b.date.localeCompare(a.date))
    .filter(item => {
      const key = item.url.split('?')[0].replace(/\/$/, '').toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, limit)
}
