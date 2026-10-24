import { useCallback, useRef, useState } from 'react'
import { useSpeechRecognition } from './useSpeechRecognition.js'

export function useSynchronizedAudioCapture() {
  const [capturedText, setCapturedText] = useState('')
  const baseTextRef = useRef('')

  const handleTranscript = useCallback((sessionTranscript) => {
    const base = baseTextRef.current.trim()
    setCapturedText(base ? `${base} ${sessionTranscript}` : sessionTranscript)
  }, [])

  const { isSupported, isListening, error, start, stop } = useSpeechRecognition({
    onTranscript: handleTranscript,
  })

  const startListening = useCallback(() => {
    baseTextRef.current = capturedText
    start()
  }, [capturedText, start])

  const clearCapturedText = useCallback(() => {
    setCapturedText('')
    baseTextRef.current = ''
  }, [])

  return {
    capturedText,
    setCapturedText,
    isSupported,
    isListening,
    error,
    startListening,
    stopListening: stop,
    clearCapturedText,
  }
}
