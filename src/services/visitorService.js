import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient.js'

const DEVICE_ID_KEY = 'docutool:device-id:v1'
const PRESENCE_CHANNEL = 'docutool-online-devices-v1'

function getDeviceId() {
  const existing = window.localStorage.getItem(DEVICE_ID_KEY)
  if (existing) return existing

  const deviceId = crypto.randomUUID()
  window.localStorage.setItem(DEVICE_ID_KEY, deviceId)
  return deviceId
}

function countUniqueDevices(channel) {
  return Object.keys(channel.presenceState()).length
}

export function subscribeToOnlineDeviceCount(onCount, onError) {
  if (!isSupabaseConfigured) {
    onCount(null)
    return () => {}
  }

  const client = getSupabaseClient()
  const deviceId = getDeviceId()
  const channel = client.channel(PRESENCE_CHANNEL, {
    config: {
      presence: {
        key: deviceId,
      },
    },
  })

  const syncCount = () => onCount(countUniqueDevices(channel))

  channel
    .on('presence', { event: 'sync' }, syncCount)
    .on('presence', { event: 'join' }, syncCount)
    .on('presence', { event: 'leave' }, syncCount)
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const { error } = await channel.track({
          device_id: deviceId,
          online_at: new Date().toISOString(),
        })
        if (error) {
          onError(error)
          return
        }
        syncCount()
      }

      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        onError(new Error('Realtime visitor presence is unavailable.'))
      }
    })

  return () => {
    channel.untrack().catch(() => {})
    client.removeChannel(channel)
  }
}
