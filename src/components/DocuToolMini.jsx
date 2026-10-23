import { useState } from 'react'
import { CheckCheck, Copy, X } from 'lucide-react'

export function DocuToolMini({
  templates,
  selectedIds,
  onToggle,
  onGenerateCopy,
  onUncheck,
  onClose,
  mode,
}) {
  const [status, setStatus] = useState('')
  const [statusType, setStatusType] = useState('success')
  const selectedCount = templates.filter((template) => selectedIds.has(template.id)).length

  async function handleGenerateCopy() {
    try {
      const message = await onGenerateCopy()
      setStatusType('success')
      setStatus(message || 'Copied ✓')
    } catch (error) {
      setStatusType('error')
      setStatus(error.message || 'Could not generate the note.')
    }
  }

  function handleUncheck() {
    onUncheck()
    setStatus('')
  }

  return (
    <main className="docutool-mini" aria-label="DocuTool Mini">
      <header className="docutool-mini__header">
        <div>
          <strong>DocuTool Mini</strong>
          <span>{mode === 'pip' ? 'Always-on-top workspace' : 'Compact workspace'}</span>
        </div>
        <button type="button" className="docutool-mini__close" onClick={onClose} aria-label="Close DocuTool Mini">
          <X size={16} />
        </button>
      </header>

      <section className="docutool-mini__content">
        <div className="docutool-mini__heading">
          <div>
            <h1>Note Templates</h1>
            <p>Check what applies, then generate and copy.</p>
          </div>
          <span className="docutool-mini__count">{selectedCount} selected</span>
        </div>

        <div className="docutool-mini__templates">
          {templates.map((template) => (
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

      <footer className="docutool-mini__footer">
        <button
          type="button"
          className="docutool-mini__generate"
          disabled={selectedCount === 0}
          onClick={handleGenerateCopy}
        >
          <Copy size={15} />
          Generate + Copy
        </button>
        <button
          type="button"
          className="docutool-mini__uncheck"
          disabled={selectedCount === 0}
          onClick={handleUncheck}
        >
          <CheckCheck size={15} />
          Uncheck
        </button>
        <p className={`docutool-mini__status docutool-mini__status--${statusType}`} aria-live="polite">
          {status || 'Generated text is also added to the active DocuTool note.'}
        </p>
      </footer>
    </main>
  )
}
