import { useCallback, useMemo, useState } from 'react'
import { AdminModal } from './components/admin/AdminModal.jsx'
import { AnonymousSuggestions } from './components/AnonymousSuggestions.jsx'
import { AppFooter } from './components/AppFooter.jsx'
import { AudioCapture } from './components/AudioCapture.jsx'
import { CallbackList } from './components/CallbackList.jsx'
import { CareMatchLauncher } from './components/CareMatchLauncher.jsx'
import { Header } from './components/Header.jsx'
import { CarelinxNewsPanel } from './components/HealthcareNewsPanel.jsx'
import { InfoPanel } from './components/InfoPanel.jsx'
import { KnowledgeBaseSearch } from './components/KnowledgeBaseSearch.jsx'
import { NotesWorkspace } from './components/NotesWorkspace.jsx'
import { PhotoGalleryStrip, RecognitionStrip } from './components/RecognitionStrip.jsx'
import { SCTeamsChannels } from './components/SCTeamsChannels.jsx'
import { CSATScoresPanel, DailyRevealCard, QAScoresPanel } from './components/SharedMediaPanels.jsx'
import { TemplatePanel } from './components/TemplatePanel.jsx'
import { Toast } from './components/Toast.jsx'
import { TeamSpotlight } from './components/TeamSpotlight.jsx'
import { NOTE_LABELS } from './constants/defaults.js'
import { useCallbackList } from './hooks/useCallbackList.js'
import { useLocalWorkspace } from './hooks/useLocalWorkspace.js'
import { useSharedContent } from './hooks/useSharedContent.js'
import {
  appendTextBlock,
  copyToClipboard,
  formatCallbackBlock,
  formatTemplateBlock,
} from './utils/text.js'
import './feature-updates.css'

function App() {
  const {
    templates,
    notes,
    activeNoteIndex,
    setTemplates,
    updateNote,
    setActiveNoteIndex,
  } = useLocalWorkspace()
  const { callbacks, saveCallback, deleteCallback, setCallbackStatus } = useCallbackList()
  const sharedContent = useSharedContent()
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [selectedCallbackIds, setSelectedCallbackIds] = useState(() => new Set())
  const [toast, setToast] = useState(null)
  const [isAdminOpen, setIsAdminOpen] = useState(false)

  const activeNote = notes[activeNoteIndex]
  const selectedTemplates = useMemo(
    () => templates.filter((template) => selectedIds.has(template.id)),
    [selectedIds, templates],
  )
  const selectedCallbacks = useMemo(
    () => callbacks.filter((callback) => selectedCallbackIds.has(callback.id)),
    [callbacks, selectedCallbackIds],
  )

  const notify = useCallback((message, type = 'success') => {
    setToast({ id: crypto.randomUUID(), message, type })
  }, [])

  const toggleSetValue = (setter, id) => {
    setter((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleTemplateToggle = (templateId) => toggleSetValue(setSelectedIds, templateId)
  const handleCallbackToggle = (callbackId) => toggleSetValue(setSelectedCallbackIds, callbackId)

  const handleTemplatesChange = (nextTemplates) => {
    setTemplates(nextTemplates)
    const validIds = new Set(nextTemplates.map((template) => template.id))
    setSelectedIds((current) => new Set([...current].filter((id) => validIds.has(id))))
  }

  const handleCallbackDelete = (id) => {
    deleteCallback(id)
    setSelectedCallbackIds((current) => {
      const next = new Set(current)
      next.delete(id)
      return next
    })
  }

  const handleGenerate = () => {
    if (!selectedTemplates.length && !selectedCallbacks.length) return
    const blocks = []
    if (selectedTemplates.length) blocks.push(formatTemplateBlock(selectedTemplates))
    if (selectedCallbacks.length) blocks.push(formatCallbackBlock(selectedCallbacks))

    updateNote(activeNoteIndex, (current) =>
      blocks.reduce((note, block) => appendTextBlock(note, block), current),
    )
    const total = selectedTemplates.length + selectedCallbacks.length
    notify(`${total} selected item${total === 1 ? '' : 's'} appended to ${NOTE_LABELS[activeNoteIndex]}.`)
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

  const handleUncheck = () => {
    setSelectedIds(new Set())
    setSelectedCallbackIds(new Set())
  }

  const appendCapturedText = (capturedText) => {
    updateNote(activeNoteIndex, (current) => appendTextBlock(current, capturedText))
  }

  const media = sharedContent.dashboardMedia || {}

  return (
    <div className="app-shell">
      <Header onOpenAdmin={() => setIsAdminOpen(true)} />

      <main id="workspace" className="app-main">
        <div className="workspace-grid">
          <div className="left-column">
            <TemplatePanel
              templates={templates}
              selectedIds={selectedIds}
              onToggle={handleTemplateToggle}
              onTemplatesChange={handleTemplatesChange}
              onNotify={notify}
            />
            <CallbackList
              callbacks={callbacks}
              selectedIds={selectedCallbackIds}
              onToggle={handleCallbackToggle}
              onSave={saveCallback}
              onDelete={handleCallbackDelete}
              onStatusChange={setCallbackStatus}
              onNotify={notify}
            />
            <SCTeamsChannels />
            <CarelinxNewsPanel />
            <AnonymousSuggestions onNotify={notify} />
          </div>

          <div className="center-column">
            <NotesWorkspace
              activeIndex={activeNoteIndex}
              note={activeNote}
              onActiveIndexChange={setActiveNoteIndex}
              onNoteChange={(value) => updateNote(activeNoteIndex, value)}
              onGenerate={handleGenerate}
              onCopy={handleCopy}
              onClear={handleClear}
              onUncheck={handleUncheck}
              selectedCount={selectedTemplates.length + selectedCallbacks.length}
            />
            <AudioCapture
              activeNoteLabel={NOTE_LABELS[activeNoteIndex]}
              onAppend={appendCapturedText}
              onNotify={notify}
            />
            <KnowledgeBaseSearch />
            <QAScoresPanel item={media.qa_scores_rank_mtd} />
            <CSATScoresPanel item={media.csat_mtd} />
            <TeamSpotlight item={sharedContent.teamSpotlight} />
          </div>

          <div className="right-column">
            <InfoPanel
              announcements={sharedContent.announcements}
              links={sharedContent.links}
              source={sharedContent.source}
              loading={sharedContent.loading}
            />
            <DailyRevealCard title="Puzzle of the Day" item={media.puzzle_of_day} />
            <DailyRevealCard title="Caregiver of the Day" item={media.caregiver_of_day} />
            <DailyRevealCard title="SOP Quiz of the Day" item={media.sop_quiz_of_day} />
            <CareMatchLauncher />
          </div>
        </div>

        <RecognitionStrip recognition={sharedContent.recognition} />
        <PhotoGalleryStrip
          title="Kudos"
          subtitle="Shared praise and moments worth celebrating. Hover a photo to magnify; click for a closer look."
          items={sharedContent.kudos || []}
          sectionId="kudos"
          direction="right-to-left"
        />
        <PhotoGalleryStrip
          title="Sharecare Family Moments"
          subtitle="Team memories and shared moments. Hover a photo to magnify; click for a closer look."
          items={sharedContent.familyMoments || []}
          sectionId="sharecare-family-moments"
          direction="left-to-right"
        />
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
