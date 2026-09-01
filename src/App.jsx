import { useCallback, useMemo, useState } from 'react'
import { AdminModal } from './components/admin/AdminModal.jsx'
import { AppFooter } from './components/AppFooter.jsx'
import { AudioCapture } from './components/AudioCapture.jsx'
import { Header } from './components/Header.jsx'
import { InfoPanel } from './components/InfoPanel.jsx'
import { NotesWorkspace } from './components/NotesWorkspace.jsx'
import { RecognitionStrip } from './components/RecognitionStrip.jsx'
import { TemplatePanel } from './components/TemplatePanel.jsx'
import { Toast } from './components/Toast.jsx'
import { NOTE_LABELS } from './constants/defaults.js'
import { useLocalWorkspace } from './hooks/useLocalWorkspace.js'
import { useSharedContent } from './hooks/useSharedContent.js'
import { appendTextBlock, copyToClipboard, formatTemplateBlock } from './utils/text.js'

function App() {
  const {
    templates,
    notes,
    activeNoteIndex,
    setTemplates,
    updateNote,
    setActiveNoteIndex,
  } = useLocalWorkspace()
  const sharedContent = useSharedContent()
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [toast, setToast] = useState(null)
  const [isAdminOpen, setIsAdminOpen] = useState(false)

  const activeNote = notes[activeNoteIndex]
  const selectedTemplates = useMemo(
    () => templates.filter((template) => selectedIds.has(template.id)),
    [selectedIds, templates],
  )

  const notify = useCallback((message, type = 'success') => {
    setToast({ id: crypto.randomUUID(), message, type })
  }, [])

  const handleTemplateToggle = (templateId) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(templateId)) next.delete(templateId)
      else next.add(templateId)
      return next
    })
  }

  const handleTemplatesChange = (nextTemplates) => {
    setTemplates(nextTemplates)
    const validIds = new Set(nextTemplates.map((template) => template.id))
    setSelectedIds((current) => new Set([...current].filter((id) => validIds.has(id))))
  }

  const handleGenerate = () => {
    if (!selectedTemplates.length) return
    updateNote(activeNoteIndex, (current) =>
      appendTextBlock(current, formatTemplateBlock(selectedTemplates)),
    )
    notify(`${selectedTemplates.length} phrase${selectedTemplates.length === 1 ? '' : 's'} appended to ${NOTE_LABELS[activeNoteIndex]}.`)
  }

  const handleCopy = async () => {
    try {
      await copyToClipboard(activeNote)
      notify(`${NOTE_LABELS[activeNoteIndex]} copied to clipboard.`)
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  const handleClear = () => {
    if (activeNote.length > 80 && !window.confirm(`Clear ${NOTE_LABELS[activeNoteIndex]}?`)) return
    updateNote(activeNoteIndex, '')
    notify(`${NOTE_LABELS[activeNoteIndex]} cleared.`)
  }

  const appendCapturedText = (capturedText) => {
    updateNote(activeNoteIndex, (current) => appendTextBlock(current, capturedText))
  }

  return (
    <div className="app-shell">
      <Header onOpenAdmin={() => setIsAdminOpen(true)} />

      <main id="workspace" className="app-main">
        <div className="workspace-grid">
          <TemplatePanel
            templates={templates}
            selectedIds={selectedIds}
            onToggle={handleTemplateToggle}
            onTemplatesChange={handleTemplatesChange}
            onNotify={notify}
          />

          <div className="center-column">
            <NotesWorkspace
              activeIndex={activeNoteIndex}
              note={activeNote}
              onActiveIndexChange={setActiveNoteIndex}
              onNoteChange={(value) => updateNote(activeNoteIndex, value)}
              onGenerate={handleGenerate}
              onCopy={handleCopy}
              onClear={handleClear}
              onUncheck={() => setSelectedIds(new Set())}
              selectedCount={selectedTemplates.length}
            />
            <AudioCapture
              activeNoteLabel={NOTE_LABELS[activeNoteIndex]}
              onAppend={appendCapturedText}
              onNotify={notify}
            />
          </div>

          <InfoPanel
            announcements={sharedContent.announcements}
            links={sharedContent.links}
            source={sharedContent.source}
            loading={sharedContent.loading}
          />
        </div>

        <RecognitionStrip recognition={sharedContent.recognition} />
      </main>

      <AppFooter />

      {isAdminOpen && (
        <AdminModal
          sharedContent={sharedContent}
          onRefresh={sharedContent.refresh}
          onNotify={notify}
          onClose={() => setIsAdminOpen(false)}
        />
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}

export default App

