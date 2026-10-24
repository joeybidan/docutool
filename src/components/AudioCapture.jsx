import { Copy, Eraser, Mic, Square, TextCursorInput } from 'lucide-react'
import { copyToClipboard } from '../utils/text.js'
import { Button } from './ui/Button.jsx'

export function AudioCapture({
  activeNoteLabel,
  capturedText,
  onCapturedTextChange,
  isSupported,
  isListening,
  error,
  onStart,
  onStop,
  onClear,
  onAppend,
  onNotify,
}) {
  const handleCopy = async () => {
    try {
      await copyToClipboard(capturedText)
      onNotify('Captured conversation copied.')
    } catch (copyError) {
      onNotify(copyError.message, 'error')
    }
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
        onChange={(event) => onCapturedTextChange(event.target.value)}
        placeholder="Captured speech or temporary call details will appear here…"
      />

      <div className="audio-actions">
        <Button
          variant="success"
          size="small"
          type="button"
          disabled={!isSupported || isListening}
          onClick={onStart}
        >
          <Mic size={15} />
          Start Listening
        </Button>
        <Button size="small" type="button" disabled={!isListening} onClick={onStop}>
          <Square size={13} fill="currentColor" />
          Stop
        </Button>
        <Button size="small" type="button" disabled={!capturedText} onClick={handleCopy}>
          <Copy size={14} />
          Copy
        </Button>
        <Button size="small" type="button" disabled={!capturedText} onClick={onClear}>
          <Eraser size={14} />
          Clear
        </Button>
        <Button
          className="audio-actions__append"
          variant="outline-primary"
          size="small"
          type="button"
          disabled={!capturedText.trim()}
          onClick={onAppend}
        >
          <TextCursorInput size={15} />
          Append to {activeNoteLabel}
        </Button>
      </div>
    </section>
  )
}
