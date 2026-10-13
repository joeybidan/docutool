import { useCallback, useEffect, useRef, useState } from 'react'

export function useAlarmSound(ringing) {
  const contextRef = useRef(null)
  const [soundReady, setSoundReady] = useState(false)

  const enableSound = useCallback(async () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return false
      if (!contextRef.current || contextRef.current.state === 'closed') {
        contextRef.current = new AudioContext()
        contextRef.current.onstatechange = () => setSoundReady(contextRef.current?.state === 'running')
      }
      await contextRef.current.resume()
      const ready = contextRef.current.state === 'running'
      setSoundReady(ready)
      return ready
    } catch {
      setSoundReady(false)
      return false
    }
  }, [])

  const beep = useCallback(() => {
    const context = contextRef.current
    if (!context || context.state !== 'running') return
    for (let index = 0; index < 3; index += 1) {
      const start = context.currentTime + index * 0.22
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = index % 2 ? 740 : 880
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.16, start + 0.02)
      gain.gain.linearRampToValueAtTime(0, start + 0.17)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
      oscillator.start(start)
      oscillator.stop(start + 0.18)
    }
  }, [])

  const testSound = useCallback(async () => {
    if (await enableSound()) beep()
  }, [enableSound, beep])

  useEffect(() => {
    if (!ringing || !soundReady) return
    beep()
    const timer = window.setInterval(beep, 1600)
    return () => window.clearInterval(timer)
  }, [ringing, soundReady, beep])

  useEffect(() => () => {
    const context = contextRef.current
    if (context) {
      context.onstatechange = null
      context.close().catch(() => {})
      contextRef.current = null
    }
  }, [])

  return { soundReady, enableSound, testSound }
}
