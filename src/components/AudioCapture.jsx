import { useCallback, useRef, useState } from 'react'
import { Copy, Eraser, Mic, Square, TextCursorInput } from 'lucide-react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition.js'
import { copyToClipboard } from '../utils/text.js'
import { Button } from './ui/Button.jsx'

export function AudioCapture({ activeNoteLabel, onAppend, onNotify }) {
  const [capturedText, setCapturedText] = useState('')
  const baseTextRef = useRef('')

  const handleTranscript = useCallback((sessionTranscript) => {
    const base = baseTextRef.current.trim()
    setCapturedText(base ? `${base} ${sessionTranscript}` : sessionTranscript)
  }, [])

  const { isSupported, isListening, error, start, stop } = useSpeechRecognition({
    onTranscript: handleTranscript,
  })

  const handleStart = () => {
    baseTextRef.current = capturedText
    start()
  }

  const handleCopy = async () => {
    try {
      await copyToClipboard(capturedText)
      onNotify('Captured conversation copied.')
    } catch (copyError) {
      onNotify(copyError.message, 'error')
    }
  }

  const handleClear = () => {
    if (capturedText.length > 80 && !window.confirm('Clear the captured conversation scratchpad?')) return
    setCapturedText('')
    baseTextRef.current = ''
  }

  const handleAppend = () => {
    if (!capturedText.trim()) return
    onAppend(capturedText)
    onNotify(`Captured conversation appended to ${activeNoteLabel}.`)
  }

  return (
    <section className="panel audio-capture" aria-labelledby="capture-heading">
      <div className="audio-capture__heading">
        <div>
          <h2 id="capture-heading">Captured Conversation</h2>
          <p className="panel-subtitle">Temporary speech-to-text scratchpad</p>
        </div>
        <span className={`listening-state ${isListening ? 'listening-state--active' : ''}`}>
          <span aria-hidden="true" />
          {isListening ? 'Listening' : 'Idle'}
        </span>
      </div>

      {!isSupported && (
        <p className="inline-notice" role="status">
          Speech recognition is not supported in this browser. You can still type in the scratchpad.
        </p>
      )}
      {error && <p className="field-error" role="alert">{error}</p>}

      <label className="sr-only" htmlFor="captured-conversation">
        Captured conversation text
      </label>
      <textarea
        id="captured-conversation"
        value={capturedText}
        onChange={(event) => setCapturedText(event.target.value)}
        placeholder="Captured speech or temporary call details will appear here…"
      />

      <div className="audio-actions">
        <Button
          variant="success"
          size="small"
          type="button"
          disabled={!isSupported || isListening}
          onClick={handleStart}
        >
          <Mic size={15} />
          Start Listening
        </Button>
        <Button size="small" type="button" disabled={!isListening} onClick={stop}>
          <Square size={13} fill="currentColor" />
          Stop
        </Button>
        <Button size="small" type="button" disabled={!capturedText} onClick={handleCopy}>
          <Copy size={14} />
          Copy
        </Button>
        <Button size="small" type="button" disabled={!capturedText} onClick={handleClear}>
          <Eraser size={14} />
          Clear
        </Button>
        <Button
          className="audio-actions__append"
          variant="outline-primary"
          size="small"
          type="button"
          disabled={!capturedText.trim()}
          onClick={handleAppend}
        >
          <TextCursorInput size={15} />
          Append to Active Note
        </Button>
      </div>
    </section>
  )
}
