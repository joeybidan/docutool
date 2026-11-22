import { useCallback, useMemo, useState } from 'react'
import { AdminModal } from './components/admin/AdminModal.jsx'
import { AnonymousSuggestions } from './components/AnonymousSuggestions.jsx'
import { AppFooter } from './components/AppFooter.jsx'
import { AudioCapture } from './components/AudioCapture.jsx'
import { CallbackList } from './components/CallbackList.jsx'
import { CareMatchLauncher } from './components/CareMatchLauncher.jsx'
import { DocuToolMini } from './components/DocuToolMini.jsx'
import { Header } from './components/Header.jsx'
import { HolidaysPanel } from './components/HolidaysPanel.jsx'
import { CarelinxNewsPanel } from './components/HealthcareNewsPanel.jsx'
import { InfoPanel } from './components/InfoPanel.jsx'
import { KnowledgeBaseSearch } from './components/KnowledgeBaseSearch.jsx'
import { NotesWorkspace } from './components/NotesWorkspace.jsx'
import { PhotoGalleryStrip, RecognitionStrip } from './components/RecognitionStrip.jsx'
import { SCTeamsChannels } from './components/SCTeamsChannels.jsx'
import { SectionFrame, SectionPage, SECTION_META } from './components/SectionFrame.jsx'
import { CSATScoresPanel, DailyRevealCard, QAScoresPanel } from './components/SharedMediaPanels.jsx'
import { TemplatePanel } from './components/TemplatePanel.jsx'
import { Toast } from './components/Toast.jsx'
import { TeamSpotlight } from './components/TeamSpotlight.jsx'
import { useCallbackList } from './hooks/useCallbackList.js'
import { useDocuToolMini } from './hooks/useDocuToolMini.jsx'
import { useLocalWorkspace } from './hooks/useLocalWorkspace.js'
import { useSharedContent } from './hooks/useSharedContent.js'
import { useSynchronizedAudioCapture } from './hooks/useSynchronizedAudioCapture.js'
import { formatCallWrapUpBlock } from './utils/callWrapUp.js'
import {
  appendTextBlock,
  copyToClipboard,
  formatCallbackBlock,
  formatTemplateBlock,
} from './utils/text.js'
import './feature-updates.css'
import './time-tools.css'
import './section-pages.css'
import './phase-one.css'
import './phase-two.css'

function App() {
  const {
    templates,
    notes,
    noteNames, noteHtml, addNote, renameNote, saveError,
    activeNoteIndex,
    setTemplates,
    updateNote,
    setActiveNoteIndex,
  } = useLocalWorkspace()
  const { callbacks, saveCallback, deleteCallback, setCallbackStatus } = useCallbackList()
  const audioCapture = useSynchronizedAudioCapture()
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

  const handleMiniGenerate = useCallback(() => {
    if (!selectedTemplates.length) return ''
    const block = formatTemplateBlock(selectedTemplates)
    updateNote(activeNoteIndex, (currentText) => appendTextBlock(currentText, block))
    const message = `${selectedTemplates.length} template${selectedTemplates.length === 1 ? '' : 's'} appended to ${noteNames[activeNoteIndex]}.`
    notify(message)
    return message
  }, [noteNames, activeNoteIndex, notify, selectedTemplates, updateNote])

  const handleMiniCopy = useCallback(async (targetWindow) => {
    if (!activeNote) return ''
    await copyToClipboard(activeNote, targetWindow, noteHtml[activeNoteIndex])
    const message = `${noteNames[activeNoteIndex]} copied from DocuTool Mini.`
    notify(message)
    return message
  }, [activeNote, noteHtml, noteNames, activeNoteIndex, notify])

  const handleAddWrapUp = useCallback((draft) => {
    const block = formatCallWrapUpBlock(draft)
    updateNote(activeNoteIndex, currentText => appendTextBlock(currentText, block))
    notify(`Call wrap-up added to ${noteNames[activeNoteIndex]}.`)
  }, [activeNoteIndex, noteNames, notify, updateNote])

  const handleMiniClearNote = useCallback(() => {
    updateNote(activeNoteIndex, '')
    notify(`${noteNames[activeNoteIndex]} cleared.`)
  }, [noteNames, activeNoteIndex, notify, updateNote])

  const handleAppendCaptured = useCallback(() => {
    const captured = audioCapture.capturedText.trim()
    if (!captured) return
    updateNote(activeNoteIndex, (currentText) => appendTextBlock(currentText, captured))
    notify(`Captured conversation appended to ${noteNames[activeNoteIndex]}.`)
  }, [noteNames, activeNoteIndex, audioCapture.capturedText, notify, updateNote])

  const handleClearCaptured = useCallback(() => {
    if (
      audioCapture.capturedText.length > 80 &&
      !window.confirm('Clear the captured conversation scratchpad?')
    ) return
    audioCapture.clearCapturedText()
  }, [audioCapture])

  const miniWorkspaceProps = {
    templates,
    selectedIds,
    onToggle: handleTemplateToggle,
    notes,
    noteNames, noteHtml, onAdd: addNote, onRename: renameNote, saveError,
    activeNoteIndex,
    onActiveNoteIndexChange: setActiveNoteIndex,
    onNoteChange: (value, html) => updateNote(activeNoteIndex, value, html),
    onGenerate: handleMiniGenerate,
    onAddWrapUp: handleAddWrapUp,
    onCopy: handleMiniCopy,
    onClearNote: handleMiniClearNote,
    onUncheck: () => setSelectedIds(new Set()),
    capturedText: audioCapture.capturedText,
    onCapturedTextChange: audioCapture.setCapturedText,
    isSpeechSupported: audioCapture.isSupported,
    isListening: audioCapture.isListening,
    speechError: audioCapture.error,
    onStartListening: audioCapture.startListening,
    onStopListening: audioCapture.stopListening,
    onClearCaptured: audioCapture.clearCapturedText,
    onAppendCaptured: handleAppendCaptured,
    onNotify: notify,
  }
  const { openMini, miniPortal } = useDocuToolMini(miniWorkspaceProps)

  const handleTemplatesChange = (nextTemplates) => {
    setTemplates(nextTemplates)
    const validIds = new Set(nextTemplates.map((template) => template.id))
    setSelectedIds((currentIds) => new Set([...currentIds].filter((id) => validIds.has(id))))
  }

  const handleCallbackDelete = (id) => {
    deleteCallback(id)
    setSelectedCallbackIds((currentIds) => {
      const next = new Set(currentIds)
      next.delete(id)
      return next
    })
  }

  const handleGenerate = () => {
    if (!selectedTemplates.length && !selectedCallbacks.length) return
    const blocks = []
    if (selectedTemplates.length) blocks.push(formatTemplateBlock(selectedTemplates))
    if (selectedCallbacks.length) blocks.push(formatCallbackBlock(selectedCallbacks))

    updateNote(activeNoteIndex, (currentText) =>
      blocks.reduce((note, block) => appendTextBlock(note, block), currentText),
    )
    const total = selectedTemplates.length + selectedCallbacks.length
    notify(`${total} selected item${total === 1 ? '' : 's'} appended to ${noteNames[activeNoteIndex]}.`)
  }

  const handleCopy = async () => {
    try {
      await copyToClipboard(activeNote, window, noteHtml[activeNoteIndex])
      notify(`${noteNames[activeNoteIndex]} copied to clipboard.`)
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  const handleClear = () => {
    if (activeNote.length > 80 && !window.confirm(`Clear ${noteNames[activeNoteIndex]}?`)) return
    updateNote(activeNoteIndex, '')
    notify(`${noteNames[activeNoteIndex]} cleared.`)
  }

  const handleUncheck = () => {
    setSelectedIds(new Set())
    setSelectedCallbackIds(new Set())
  }

  const media = sharedContent.dashboardMedia || {}

  const renderSection = (slug) => {
    switch (slug) {
      case 'notestemplates':
        return (
          <TemplatePanel
            templates={templates}
            selectedIds={selectedIds}
            onToggle={handleTemplateToggle}
            onTemplatesChange={handleTemplatesChange}
            onNotify={notify}
          />
        )
      case 'callbacklist':
        return (
          <CallbackList
            callbacks={callbacks}
            selectedIds={selectedCallbackIds}
            onToggle={handleCallbackToggle}
            onSave={saveCallback}
            onDelete={handleCallbackDelete}
            onStatusChange={setCallbackStatus}
            onNotify={notify}
          />
        )
      case 'scteamschannels':
        return <SCTeamsChannels />
      case 'carelinxnews':
        return <CarelinxNewsPanel image={media.carelinx_news} />
      case 'regularholidays':
        return <HolidaysPanel />
      case 'anonymoussuggestions':
        return <AnonymousSuggestions onNotify={notify} />
      case 'notepad':
        return (
          <NotesWorkspace
            activeIndex={activeNoteIndex}
            note={activeNote}
            names={noteNames}
            html={noteHtml[activeNoteIndex]}
            onAdd={addNote}
            onRename={renameNote}
            saveError={saveError}
            onActiveIndexChange={setActiveNoteIndex}
            onNoteChange={(value, html) => updateNote(activeNoteIndex, value, html)}
            onGenerate={handleGenerate}
            onAddWrapUp={handleAddWrapUp}
            onCopy={handleCopy}
            onClear={handleClear}
            onUncheck={handleUncheck}
            selectedCount={selectedTemplates.length + selectedCallbacks.length}
          />
        )
      case 'capturedconversation':
        return (
          <AudioCapture
            activeNoteLabel={noteNames[activeNoteIndex]}
            capturedText={audioCapture.capturedText}
            onCapturedTextChange={audioCapture.setCapturedText}
            isSupported={audioCapture.isSupported}
            isListening={audioCapture.isListening}
            error={audioCapture.error}
            onStart={audioCapture.startListening}
            onStop={audioCapture.stopListening}
            onClear={handleClearCaptured}
            onAppend={handleAppendCaptured}
            onNotify={notify}
          />
        )
      case 'knowledgebasesearch':
        return <KnowledgeBaseSearch />
      case 'qascoresrankmtd':
        return <QAScoresPanel item={media.qa_scores_rank_mtd} />
      case 'csatmtd':
        return <CSATScoresPanel item={media.csat_mtd} />
      case 'teamspotlight':
        return <TeamSpotlight item={sharedContent.teamSpotlight} />
      case 'managerannouncements':
        return (
          <InfoPanel
            announcements={sharedContent.announcements}
            links={sharedContent.links}
            source={sharedContent.source}
            loading={sharedContent.loading}
            lockedMode="announcements"
          />
        )
      case 'soptrainings':
        return (
          <InfoPanel
            announcements={sharedContent.announcements}
            links={sharedContent.links}
            source={sharedContent.source}
            loading={sharedContent.loading}
            lockedMode="links"
          />
        )
      case 'puzzleoftheday':
        return <DailyRevealCard title="Puzzle of the Day" item={media.puzzle_of_day} />
      case 'caregiveroftheday':
        return <DailyRevealCard title="Caregiver of the Day" item={media.caregiver_of_day} />
      case 'sopquizoftheday':
        return <DailyRevealCard title="SOP Quiz of the Day" item={media.sop_quiz_of_day} />
      case 'carematch':
        return <CareMatchLauncher />
      case 'teamrecognition':
        return <RecognitionStrip recognition={sharedContent.recognition} />
      case 'kudos':
        return (
          <PhotoGalleryStrip
            title="Kudos"
            subtitle="Shared praise and moments worth celebrating. Hover to pause and magnify; click for a closer look."
            items={sharedContent.kudos || []}
            sectionId="kudos"
            direction="right-to-left"
          />
        )
      case 'sharecarefamilymoments':
        return (
          <PhotoGalleryStrip
            title="Sharecare Family Moments"
            subtitle="Team memories and shared moments. Hover to pause and magnify; click for a closer look."
            items={sharedContent.familyMoments || []}
            sectionId="sharecare-family-moments"
            direction="left-to-right"
          />
        )
      default:
        return null
    }
  }

  const frameSection = (slug) => (
    <SectionFrame slug={slug} label={SECTION_META[slug].label}>
      {renderSection(slug)}
    </SectionFrame>
  )

  const requestedSection = window.location.pathname
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase()

  const isFocusedSection = Boolean(requestedSection && SECTION_META[requestedSection])

  // Standalone Mini works even where browser popup/Picture-in-Picture is blocked.
  if (requestedSection === 'docutoolmini') {
    return (
      <div className="docutool-mini-page">
        <DocuToolMini {...miniWorkspaceProps} mode="page"
          onOpenFloating={openMini}
          onClose={() => { window.location.href = '/' }}
          onCopy={() => handleMiniCopy(window)} />
        <Toast toast={toast} onDismiss={() => setToast(null)} />
        {miniPortal}
      </div>
    )
  }

  if (isFocusedSection) {
    return (
      <div className="app-shell">
        <Header onOpenAdmin={() => setIsAdminOpen(true)} onOpenMini={openMini}
          showVisitorCounter={requestedSection !== 'notepad'} />

        <SectionPage slug={requestedSection} label={SECTION_META[requestedSection].label}>
          {requestedSection === 'notepad' ? (
            <div className="focus-workspace">
              <div className="focus-workspace__helpers" aria-label="Optional documentation tools">
                <details className="focus-workspace__helper">
                  <summary>Note Templates <span>Open when needed</span></summary>
                  {renderSection('notestemplates')}
                </details>
                <details className="focus-workspace__helper">
                  <summary>Knowledge Base Search <span>Open when needed</span></summary>
                  {renderSection('knowledgebasesearch')}
                </details>
              </div>
              {renderSection('notepad')}
              <details className="focus-workspace__capture">
                <summary>Captured Conversation <span>Expand to type or transcribe</span></summary>
                {renderSection('capturedconversation')}
              </details>
            </div>
          ) : renderSection(requestedSection)}
        </SectionPage>

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
        {miniPortal}
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Header onOpenAdmin={() => setIsAdminOpen(true)} onOpenMini={openMini} />

      <main id="workspace" className="app-main">
        <div className="workspace-grid">
          <div className="left-column">
            {frameSection('notestemplates')}
            {frameSection('callbacklist')}
            {frameSection('scteamschannels')}
            {frameSection('carelinxnews')}
            {frameSection('regularholidays')}
            {frameSection('anonymoussuggestions')}
          </div>

          <div className="center-column">
            {frameSection('notepad')}
            {frameSection('capturedconversation')}
            {frameSection('knowledgebasesearch')}
            {frameSection('qascoresrankmtd')}
            {frameSection('csatmtd')}
            {frameSection('teamspotlight')}
          </div>

          <div className="right-column">
            <InfoPanel
              announcements={sharedContent.announcements}
              links={sharedContent.links}
              source={sharedContent.source}
              loading={sharedContent.loading}
              showMaximize
            />
            {frameSection('puzzleoftheday')}
            {frameSection('caregiveroftheday')}
            {frameSection('sopquizoftheday')}
            {frameSection('carematch')}
          </div>
        </div>

        {frameSection('teamrecognition')}
        {frameSection('kudos')}
        {frameSection('sharecarefamilymoments')}
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
      {miniPortal}
    </div>
  )
}

export default App
