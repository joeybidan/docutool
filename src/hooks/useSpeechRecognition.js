import { useCallback, useEffect, useRef, useState } from 'react'

export function useSpeechRecognition({ onTranscript }) {
  const recognitionRef = useRef(null)
  const onTranscriptRef = useRef(onTranscript)
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState('')

  const Recognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null
  const isSupported = Boolean(Recognition)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const start = useCallback(() => {
    if (!Recognition || isListening) return

    setError('')
    const recognition = new Recognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = navigator.language || 'en-US'

    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      onTranscriptRef.current?.(transcript)
    }
    recognition.onerror = (event) => {
      const message =
        event.error === 'not-allowed'
          ? 'Microphone permission was denied.'
          : `Speech recognition stopped: ${event.error}.`
      setError(message)
      setIsListening(false)
    }
    recognition.onend = () => {
      setIsListening(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch (startError) {
      setError(startError.message || 'Speech recognition could not start.')
      setIsListening(false)
    }
  }, [Recognition, isListening])

  useEffect(
    () => () => {
      recognitionRef.current?.abort()
    },
    [],
  )

  return { isSupported, isListening, error, start, stop }
}
