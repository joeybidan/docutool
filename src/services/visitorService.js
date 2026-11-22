import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient.js'
import { createVisitorPresenceManager } from './visitorPresenceManager.js'

const DEVICE_ID_KEY = 'docutool:device-id:v1'
const PRESENCE_CHANNEL = 'docutool-online-devices-v1'

function getDeviceId() {
  const existing = window.localStorage.getItem(DEVICE_ID_KEY)
  if (existing) return existing

  const deviceId = crypto.randomUUID()
  window.localStorage.setItem(DEVICE_ID_KEY, deviceId)
  return deviceId
}

// Shared across all VisitorCounter components in this browser tab and PiP portal.
const visitorPresence = createVisitorPresenceManager({
  getClient: getSupabaseClient,
  getDeviceId,
  isConfigured: () => isSupabaseConfigured,
  channelName: PRESENCE_CHANNEL,
})

export const subscribeToOnlineDeviceCount = visitorPresence.subscribe
