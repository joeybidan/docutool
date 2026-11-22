// One Realtime Presence channel per browser tab, shared by every visitor counter.
// A counter may mount in the dashboard, Focus page and a Document PiP portal.
export function createVisitorPresenceManager({
  getClient,
  getDeviceId,
  isConfigured,
  channelName,
  cleanupDelayMs = 1500,
}) {
  const listeners = new Set()
  let active = null
  let latestCount = null
  let latestError = null
  let cleanupTimer = null

  function reportCount(value) {
    latestCount = value
    latestError = null
    for (const listener of listeners) {
      try { listener.onCount(value) } catch (error) { console.warn('Visitor count listener failed.', error) }
    }
  }

  function reportError(error) {
    latestError = error
    for (const listener of listeners) {
      try { listener.onError(error) } catch (callbackError) { console.warn('Visitor count error handler failed.', callbackError) }
    }
  }

  function releaseChannel(record) {
    if (active === record) active = null
    try { Promise.resolve(record.channel.untrack()).catch(() => {}) } catch { /* Already closed */ }
    try { Promise.resolve(record.client.removeChannel(record.channel)).catch(() => {}) } catch { /* Already closed */ }
  }

  function connect() {
    if (active) return
    let record = null
    try {
      const client = getClient()
      const deviceId = getDeviceId()
      const channel = client.channel(channelName, { config: { presence: { key: deviceId } } })
      record = { client, channel }
      active = record

      const syncCount = () => {
        if (active !== record) return
        try { reportCount(Object.keys(channel.presenceState()).length) } catch (error) { reportError(error) }
      }

      // Supabase requires Presence callbacks to be registered BEFORE subscribe().
      // The sync event also fires when devices join and leave.
      channel.on('presence', { event: 'sync' }, syncCount)
      channel.subscribe(async (status) => {
        if (active !== record) return
        if (status === 'SUBSCRIBED') {
          try {
            const { error } = await channel.track({
              device_id: deviceId,
              online_at: new Date().toISOString(),
            })
            if (active !== record) return
            if (error) reportError(error)
            else syncCount()
          } catch (error) {
            if (active === record) reportError(error)
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          reportError(new Error('Realtime visitor presence is unavailable.'))
        }
      })
    } catch (error) {
      if (record) releaseChannel(record)
      reportError(error)
    }
  }

  function subscribe(onCount, onError) {
    try {
      if (!isConfigured()) {
        onCount(null)
        return () => {}
      }
    } catch (error) {
      onError(error)
      return () => {}
    }

    if (cleanupTimer !== null) {
      clearTimeout(cleanupTimer)
      cleanupTimer = null
    }

    const listener = { onCount, onError }
    listeners.add(listener)
    if (latestCount !== null) {
      try { onCount(latestCount) } catch (error) { console.warn('Visitor count listener failed.', error) }
    }
    if (latestError) {
      try { onError(latestError) } catch (error) { console.warn('Visitor count error handler failed.', error) }
    }
    connect()

    let removed = false
    return () => {
      if (removed) return
      removed = true
      listeners.delete(listener)
      if (!listeners.size && cleanupTimer === null) {
        // Avoid repeated joins/tracks during React StrictMode mount/unmount replay.
        cleanupTimer = setTimeout(() => {
          cleanupTimer = null
          if (listeners.size || !active) return
          releaseChannel(active)
          latestCount = null
          latestError = null
        }, cleanupDelayMs)
      }
    }
  }

  return { subscribe }
}
