import { NotesWorkspace } from './NotesWorkspace.jsx'
import { VisitorCounter } from './VisitorCounter.jsx'
import { useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Eraser,
  Maximize2,
  Mic,
  Search,
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
  onAddWrapUp,
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
  onOpenFloating,
  mode,
}) {
  const [status, setStatus] = useState('')
  const [statusType, setStatusType] = useState('success')
  const [activeDrawer, setActiveDrawer] = useState(null)
  const [expandedGroups, setExpandedGroups] = useState(() => new Set(['general-questions']))
  const toggleGroup = (groupId) => setExpandedGroups((current) => {
    const updated = new Set(current)
    if (updated.has(groupId)) updated.delete(groupId)
    else updated.add(groupId)
    return updated
  })
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
      throw error
    }
  }

  function handleUncheck() {
    onUncheck?.()
    setStatus('')
  }

  return (
    <main className={mode === 'page' ? 'docutool-mini docutool-mini--page' : 'docutool-mini'}
      aria-label="DocuTool Mini">
      <header className="docutool-mini__header">
        <div className="docutool-mini__identity">
          <strong>DocuTool Mini</strong>
          <span>{mode === 'pip' ? 'Always-on-top notepad' : 'Your compact documentation workspace'}</span>
          <div className="docutool-mini__live-count" aria-label="Online DocuTool visitors">
            <VisitorCounter />
          </div>
        </div>
        <div className="docutool-mini__header-actions">
          {mode === 'page' ? (
            <>
              <a href="/" title="Return to dashboard">Dashboard</a>
              <a href="/notepad" title="Open full-page Focus Notepad">
                <Maximize2 size={14} aria-hidden="true" /> Focus
              </a>
              <button type="button" className="docutool-mini__float" onClick={onOpenFloating}>Float Mini</button>
            </>
          ) : (
            <button type="button" className="docutool-mini__close" onClick={onClose}
              aria-label="Close floating DocuTool Mini"><X size={16} /></button>
          )}
        </div>
      </header>
      <div className="docutool-mini__scroll">
        <div className="docutool-mini__layout">
          <nav className="docutool-mini__rail" aria-label="Optional tools">
            <button type="button" className={activeDrawer === 'templates' ? 'is-active' : ''}
              title="Note Templates" aria-label="Toggle Note Templates"
              aria-expanded={activeDrawer === 'templates'} aria-controls="docutool-mini-tool-drawer"
              onClick={() => setActiveDrawer(activeDrawer === 'templates' ? null : 'templates')}>
              <ClipboardList size={19} aria-hidden="true" /><span>Templates</span>
              {selectedCount > 0 && <small>{selectedCount}</small>}
            </button>
            <button type="button" className={activeDrawer === 'knowledge' ? 'is-active' : ''}
              title="Knowledge Base Search" aria-label="Toggle Knowledge Base Search"
              aria-expanded={activeDrawer === 'knowledge'} aria-controls="docutool-mini-tool-drawer"
              onClick={() => setActiveDrawer(activeDrawer === 'knowledge' ? null : 'knowledge')}>
              <Search size={19} aria-hidden="true" /><span>Search</span>
            </button>
          </nav>
          <div className="docutool-mini__primary">
            <section className="docutool-mini__section docutool-mini__notepad" aria-labelledby="mini-notepad-heading">
          <div className="docutool-mini__section-heading">
            <div>
              <h1 id="mini-notepad-heading">Your Notepad</h1>
              <p>Drafts are saved locally in this browser.</p>
            </div>
          </div>

          <NotesWorkspace activeIndex={activeNoteIndex} note={activeNote} html={noteHtml[activeNoteIndex]}
            names={noteNames} onAdd={onAdd} onRename={onRename} saveError={saveError}
            onActiveIndexChange={onActiveNoteIndexChange} onNoteChange={onNoteChange}
            onGenerate={handleGenerate} onCopy={handleCopy} onClear={onClearNote}
            onAddWrapUp={onAddWrapUp}
            onUncheck={handleUncheck} selectedCount={selectedCount} />

          <p className={`docutool-mini__status docutool-mini__status--${statusType}`} aria-live="polite">
            {status || 'Generate updates this Mini and the full DocuTool at the same time.'}
          </p>
        </section>
            <details className="docutool-mini__capture-details">
              <summary>
                <Mic size={15} aria-hidden="true" />
                <span>Captured Conversation</span>
                <small>{isListening ? 'Listening' : 'Expand when needed'}</small>
              </summary>
              <div className="docutool-mini__capture-content">
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
              </div>
            </details>
          </div>
          {activeDrawer && (
            <aside id="docutool-mini-tool-drawer" className="docutool-mini__drawer"
              aria-label={activeDrawer === 'templates' ? 'Note Templates drawer' : 'Knowledge Base Search drawer'}>
              <div className="docutool-mini__drawer-header">
                <strong>{activeDrawer === 'templates' ? 'Note Templates' : 'Knowledge Base Search'}</strong>
                <button type="button" aria-label="Close tools" onClick={() => setActiveDrawer(null)}>
                  <X size={17} aria-hidden="true" />
                </button>
              </div>
              {activeDrawer === 'templates' && (<section className="docutool-mini__section" aria-labelledby="mini-template-heading">
          <div className="docutool-mini__section-heading">
            <div>
              <h1 id="mini-template-heading">Note Templates</h1>
              <p>Selections mirror the full DocuTool instantly.</p>
            </div>
            <span className="docutool-mini__count">{selectedCount} selected</span>
          </div>

          <div className="docutool-mini__templates">
            {groupedTemplates.map((group) => {
              const expanded = expandedGroups.has(group.id)
              const selectedInGroup = group.templates.filter((template) => selectedIds.has(template.id)).length
              return (
                <section className="docutool-mini__template-group" key={group.id} aria-label={group.label}>
                  <h2 className="docutool-mini__template-heading">
                    <button
                      type="button"
                      className="docutool-mini__template-toggle"
                      aria-expanded={expanded}
                      aria-controls={`mini-template-phrases-${group.id}`}
                      onClick={() => toggleGroup(group.id)}
                    >
                      {expanded ? <ChevronDown size={13} aria-hidden="true" /> : <ChevronRight size={13} aria-hidden="true" />}
                      <span>{group.label}</span>
                      {selectedInGroup > 0 && <small className="docutool-mini__selected-count">{selectedInGroup} selected</small>}
                      <small className="docutool-mini__group-count">{group.templates.length}</small>
                    </button>
                  </h2>
                  <div id={`mini-template-phrases-${group.id}`} hidden={!expanded}>
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
                </section>
              )
            })}
          </div>
        </section>)}
              {activeDrawer === 'knowledge' && (<section className="docutool-mini__section docutool-mini__knowledge" aria-labelledby="mini-kb-heading">
          <div className="docutool-mini__section-heading">
            <div>
              <h1 id="mini-kb-heading">Knowledge Base Search</h1>
              <p>Use 3–4 keywords.</p>
            </div>
          </div>
          <KnowledgeSearchRows compact />
        </section>)}
            </aside>
          )}
        </div>
      </div>
    </main>
  )
}
