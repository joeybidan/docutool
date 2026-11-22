// ZIP-level distance estimates, never address-level distances.
// This module does not save entered locations to localStorage or Supabase.
export const ZIP_API_BASE = 'https://api.zippopotam.us/us/'

export function parseUsArea(value) {
  if (typeof value !== 'string') return null
  const input = value.trim()
  // Accept a ZIP or "City, ST 12345" (optionally ZIP+4). ZIP is required.
  const match = input.match(/(?:^|[\s,])(\d{5})(?:-\d{4})?$/)
  if (!match) return null
  const zip = match[1]
  const beforeZip = input.slice(0, match.index).replace(/[\s,]+$/, '')
  const stateMatch = beforeZip.match(/(?:^|[\s,])([A-Za-z]{2})$/)
  return { zip, state: stateMatch ? stateMatch[1].toUpperCase() : null }
}

export function straightLineMiles(first, second) {
  const radians = degrees => (degrees * Math.PI) / 180
  const aLat = radians(first.latitude)
  const bLat = radians(second.latitude)
  const latDiff = bLat - aLat
  const lngDiff = radians(second.longitude - first.longitude)
  const a = Math.sin(latDiff / 2) ** 2 +
    Math.cos(aLat) * Math.cos(bLat) * Math.sin(lngDiff / 2) ** 2
  return 2 * 3958.7613 * Math.asin(Math.min(1, Math.sqrt(a)))
}

export async function resolveZipArea(zip, options = {}) {
  if (!/^\d{5}$/.test(zip)) throw new Error('Enter a valid 5-digit U.S. ZIP code.')
  const fetcher = options.fetchImpl || globalThis.fetch
  const response = await fetcher(ZIP_API_BASE + zip, { signal: options.signal })
  if (response.status === 404) throw new Error('ZIP ' + zip + ' was not found. Check and try again.')
  if (!response.ok) throw new Error('ZIP lookup is unavailable. Try again, or open Google Maps.')
  const data = await response.json()
  const place = data?.places?.[0]
  const latitude = Number(place?.latitude)
  const longitude = Number(place?.longitude)
  if (!place || !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
    latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error('Location details for ZIP ' + zip + ' are unavailable.')
  }
  return {
    zip,
    city: place['place name'] || 'ZIP ' + zip,
    state: place['state abbreviation'] || '',
    latitude,
    longitude,
  }
}

export async function calculateZipDistance(caregiverValue, clientValue, options = {}) {
  const caregiverInput = parseUsArea(caregiverValue)
  const clientInput = parseUsArea(clientValue)
  if (!caregiverInput || !clientInput) {
    throw new Error('Enter a 5-digit ZIP for both areas. City and state are optional.')
  }
  const [caregiver, client] = await Promise.all([
    resolveZipArea(caregiverInput.zip, options),
    resolveZipArea(clientInput.zip, options),
  ])
  if (caregiverInput.state && caregiverInput.state !== caregiver.state.toUpperCase()) {
    throw new Error('Caregiver ZIP ' + caregiver.zip + ' is in ' + caregiver.state +
      ', not ' + caregiverInput.state + '. Please correct the location.')
  }
  if (clientInput.state && clientInput.state !== client.state.toUpperCase()) {
    throw new Error('Client ZIP ' + client.zip + ' is in ' + client.state +
      ', not ' + clientInput.state + '. Please correct the location.')
  }
  const miles = straightLineMiles(caregiver, client)
  return {
    caregiver, client,
    miles: Math.round(miles),
    kilometers: Math.round(miles * 1.609344),
  }
}

export function googleMapsDirectionsUrl(caregiverZip, clientZip) {
  if (!/^\d{5}$/.test(caregiverZip) || !/^\d{5}$/.test(clientZip)) return ''
  const params = new URLSearchParams({
    api: '1',
    origin: caregiverZip + ', USA',
    destination: clientZip + ', USA',
    travelmode: 'driving',
  })
  return 'https://www.google.com/maps/dir/?' + params.toString()
}
