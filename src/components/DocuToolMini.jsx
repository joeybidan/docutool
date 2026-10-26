import { NotesWorkspace } from './NotesWorkspace.jsx'
import { useMemo, useState } from 'react'
import {
  Eraser,
  Mic,
  Square,
  TextCursorInput,
  X,
} from 'lucide-react'
import { TEMPLATE_GROUPS } from '../constants/defaults.js'
import { KnowledgeSearchRows } from './KnowledgeBaseSearch.jsx'

export function DocuToolMini({
  templates,
  selectedIds,
  onToggle,
  notes,
  noteNames, noteHtml, onAdd, onRename, saveError,
  activeNoteIndex,
  onActiveNoteIndexChange,
  onNoteChange,
  onGenerate,
  onCopy,
  onClearNote,
  onUncheck,
  capturedText,
  onCapturedTextChange,
  isSpeechSupported,
  isListening,
  speechError,
  onStartListening,
  onStopListening,
  onClearCaptured,
  onAppendCaptured,
  onClose,
  mode,
}) {
  const [status, setStatus] = useState('')
  const [statusType, setStatusType] = useState('success')
  const activeNote = notes[activeNoteIndex] || ''
  const selectedCount = templates.filter((template) => selectedIds.has(template.id)).length
  const groupedTemplates = useMemo(
    () =>
      TEMPLATE_GROUPS.map((group) => ({
        ...group,
        templates: templates.filter((template) => template.group === group.id),
      })).filter((group) => group.templates.length > 0),
    [templates],
  )

  function setSuccess(message) {
    setStatusType('success')
    setStatus(message)
  }

  function setError(message) {
    setStatusType('error')
    setStatus(message)
  }

  function handleGenerate() {
    if (!selectedCount) return
    try {
      const message = onGenerate?.()
      setSuccess(message || `Generated ${selectedCount} template${selectedCount === 1 ? '' : 's'}.`)
    } catch (error) {
      setError(error.message || 'Could not generate the note.')
    }
  }

  async function handleCopy() {
    if (!activeNote) return
    try {
      const message = await onCopy?.()
      setSuccess(message || `${noteNames[activeNoteIndex]} copied.`)
    } catch (error) {
      setError(error.message || 'Could not copy the note.')
    }
  }

  function handleUncheck() {
    onUncheck?.()
    setStatus('')
  }

  return (
    <main className="docutool-mini" aria-label="DocuTool Mini">
      <header className="docutool-mini__header">
        <div>
          <strong>DocuTool Mini</strong>
          <span>{mode === 'pip' ? 'Always-on-top synchronized workspace' : 'Synchronized compact workspace'}</span>
        </div>
        <button type="button" className="docutool-mini__close" onClick={onClose} aria-label="Close DocuTool Mini">
          <X size={16} />
        </button>
      </header>

      <div className="docutool-mini__scroll">
        <section className="docutool-mini__section docutool-mini__knowledge" aria-labelledby="mini-kb-heading">
          <div className="docutool-mini__section-heading">
            <div>
              <h1 id="mini-kb-heading">Knowledge Base Search</h1>
              <p>Use 3–4 keywords.</p>
            </div>
          </div>
          <KnowledgeSearchRows compact />
        </section>

        <section className="docutool-mini__section" aria-labelledby="mini-template-heading">
          <div className="docutool-mini__section-heading">
            <div>
              <h1 id="mini-template-heading">Note Templates</h1>
              <p>Selections mirror the full DocuTool instantly.</p>
            </div>
            <span className="docutool-mini__count">{selectedCount} selected</span>
          </div>

          <div className="docutool-mini__templates">
            {groupedTemplates.map((group) => (
              <div className="docutool-mini__template-group" key={group.id}>
                <h2>{group.label}</h2>
                {group.templates.map((template) => (
                  <label className="docutool-mini__option" key={template.id}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(template.id)}
                      onChange={() => {
                        onToggle(template.id)
                        setStatus('')
                      }}
                    />
                    <span>{template.text}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="docutool-mini__section docutool-mini__notepad" aria-labelledby="mini-notepad-heading">
          <div className="docutool-mini__section-heading">
            <div>
              <h1 id="mini-notepad-heading">Notepad</h1>
              <p>Named notes and formatting stay synchronized with the browser app.</p>
            </div>
          </div>

          <NotesWorkspace activeIndex={activeNoteIndex} note={activeNote} html={noteHtml[activeNoteIndex]}
            names={noteNames} onAdd={onAdd} onRename={onRename} saveError={saveError}
            onActiveIndexChange={onActiveNoteIndexChange} onNoteChange={onNoteChange}
            onGenerate={handleGenerate} onCopy={handleCopy} onClear={onClearNote}
            onUncheck={handleUncheck} selectedCount={selectedCount} />

          <p className={`docutool-mini__status docutool-mini__status--${statusType}`} aria-live="polite">
            {status || 'Generate updates this Mini and the full DocuTool at the same time.'}
          </p>
        </section>

        <section className="docutool-mini__section docutool-mini__capture" aria-labelledby="mini-capture-heading">
          <div className="docutool-mini__section-heading">
            <div>
              <h1 id="mini-capture-heading">Captured Conversation</h1>
              <p>Shared speech-to-text scratchpad.</p>
            </div>
            <span className={`docutool-mini__listening ${isListening ? 'is-active' : ''}`}>
              {isListening ? 'Listening' : 'Idle'}
            </span>
          </div>

          {!isSpeechSupported && (
            <p className="docutool-mini__notice">Speech recognition is unavailable in this browser.</p>
          )}
          {speechError && <p className="docutool-mini__notice docutool-mini__notice--error">{speechError}</p>}

          <textarea
            className="docutool-mini__captured"
            value={capturedText}
            onChange={(event) => onCapturedTextChange(event.target.value)}
            placeholder="Captured speech or temporary call details…"
          />

          <div className="docutool-mini__actions">
            <button
              type="button"
              className="docutool-mini__listen"
              disabled={!isSpeechSupported || isListening}
              onClick={onStartListening}
            >
              <Mic size={14} />
              Listen
            </button>
            <button
              type="button"
              className="docutool-mini__secondary"
              disabled={!isListening}
              onClick={onStopListening}
            >
              <Square size={12} fill="currentColor" />
              Stop
            </button>
            <button
              type="button"
              className="docutool-mini__secondary"
              disabled={!capturedText}
              onClick={onClearCaptured}
            >
              <Eraser size={14} />
              Clear
            </button>
            <button
              type="button"
              className="docutool-mini__append"
              disabled={!capturedText.trim()}
              onClick={onAppendCaptured}
            >
              <TextCursorInput size={14} />
              Append
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
