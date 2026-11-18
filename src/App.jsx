import { useCallback, useEffect, useMemo, useState } from 'react'
import { AdminModal } from './components/admin/AdminModal.jsx'
import { AnonymousSuggestions } from './components/AnonymousSuggestions.jsx'
import { AppFooter } from './components/AppFooter.jsx'
import { AudioCapture } from './components/AudioCapture.jsx'
import { CallbackList } from './components/CallbackList.jsx'
import { CareMatchLauncher } from './components/CareMatchLauncher.jsx'
import { Header } from './components/Header.jsx'
import { HolidaysPanel } from './components/HolidaysPanel.jsx'
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
import { SectionFrame, SectionPage } from './components/SectionFrame.jsx'
import { TimezoneClocks } from './components/TimezoneClocks.jsx'
import { TimezoneConverter } from './components/TimezoneConverter.jsx'
import { useCallbackList } from './hooks/useCallbackList.js'
import { useDocuToolMini } from './hooks/useDocuToolMini.jsx'
import { useLocalWorkspace } from './hooks/useLocalWorkspace.js'
import { useSharedContent } from './hooks/useSharedContent.js'
import { useSynchronizedAudioCapture } from './hooks/useSynchronizedAudioCapture.js'
import { getSectionSlug, SECTION_TITLES, sectionHref } from './utils/sectionRoutes.js'
import {
  appendTextBlock,
  copyToClipboard,
  formatCallbackBlock,
  formatTemplateBlock,
} from './utils/text.js'
import './feature-updates.css'
import './time-tools.css'
import './section-pages.css'

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
  const [activeSection, setActiveSection] = useState(() => getSectionSlug(window.location.pathname))

  useEffect(() => {
    const onPopState = () => setActiveSection(getSectionSlug(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    document.title = activeSection && SECTION_TITLES[activeSection]
      ? `${SECTION_TITLES[activeSection]} | DocuTool`
      : 'DocuTool'
  }, [activeSection])

  const openSection = useCallback((slug) => {
    if (!Object.hasOwn(SECTION_TITLES, slug)) return
    const path = sectionHref(slug)
    if (window.location.pathname !== path) window.history.pushState({ docutoolSection: slug }, '', path)
    setActiveSection(slug)
    window.scrollTo(0, 0)
  }, [])

  const showDashboard = useCallback(() => {
    if (window.location.pathname !== '/') window.history.pushState({}, '', '/')
    setActiveSection('')
    window.scrollTo(0, 0)
  }, [])

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

  const { openMini, miniPortal } = useDocuToolMini({
    templates,
    selectedIds,
    onToggle: handleTemplateToggle,
    notes,
    noteNames, noteHtml, onAdd: addNote, onRename: renameNote, saveError,
    activeNoteIndex,
    onActiveNoteIndexChange: setActiveNoteIndex,
    onNoteChange: (value, html) => updateNote(activeNoteIndex, value, html),
    onGenerate: handleMiniGenerate,
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
  })

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
  const isFocused = activeSection !== ''

  // Use exactly the same components and data as the full dashboard.
  // Moving to a direct URL never requires a new login or a second database.
  const focusedSections = {
    notestemplates: (
      <TemplatePanel
        templates={templates}
        selectedIds={selectedIds}
        onToggle={handleTemplateToggle}
        onTemplatesChange={handleTemplatesChange}
        onNotify={notify}
      />
    ),
    callbacklist: (
      <CallbackList
        callbacks={callbacks}
        selectedIds={selectedCallbackIds}
        onToggle={handleCallbackToggle}
        onSave={saveCallback}
        onDelete={handleCallbackDelete}
        onStatusChange={setCallbackStatus}
        onNotify={notify}
      />
    ),
    scteamschannels: <SCTeamsChannels />,
    carelinxnews: <CarelinxNewsPanel />,
    regularholidays: <HolidaysPanel />,
    anonymoussuggestions: <AnonymousSuggestions onNotify={notify} />,
    notepad: (
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
        onCopy={handleCopy}
        onClear={handleClear}
        onUncheck={handleUncheck}
        selectedCount={selectedTemplates.length + selectedCallbacks.length}
      />
    ),
    capturedconversation: (
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
    ),
    knowledgebasesearch: <KnowledgeBaseSearch />,
    qascoresrankmtd: <QAScoresPanel item={media.qa_scores_rank_mtd} />,
    csatmtd: <CSATScoresPanel item={media.csat_mtd} />,
    teamspotlight: <TeamSpotlight item={sharedContent.teamSpotlight} />,
    managerannouncements: (
      <InfoPanel
        announcements={sharedContent.announcements}
        links={sharedContent.links}
        source={sharedContent.source}
        loading={sharedContent.loading}
        forcedMode="announcements"
        onModeChange={(mode) => openSection(mode === 'links' ? 'soptrainings' : 'managerannouncements')}
      />
    ),
    soptrainings: (
      <InfoPanel
        announcements={sharedContent.announcements}
        links={sharedContent.links}
        source={sharedContent.source}
        loading={sharedContent.loading}
        forcedMode="links"
        onModeChange={(mode) => openSection(mode === 'links' ? 'soptrainings' : 'managerannouncements')}
      />
    ),
    puzzleoftheday: <DailyRevealCard title="Puzzle of the Day" item={media.puzzle_of_day} />,
    caregiveroftheday: <DailyRevealCard title="Caregiver of the Day" item={media.caregiver_of_day} />,
    sopquizoftheday: <DailyRevealCard title="SOP Quiz of the Day" item={media.sop_quiz_of_day} />,
    carematch: <CareMatchLauncher />,
    teamrecognition: <RecognitionStrip recognition={sharedContent.recognition} expanded={isFocused} />,
    kudos: (
      <PhotoGalleryStrip
        title="Kudos"
        subtitle="Shared praise and moments worth celebrating. Hover a photo to magnify; click for a closer look."
        items={sharedContent.kudos || []}
        sectionId="kudos"
        direction="right-to-left"
        expanded={isFocused}
      />
    ),
    sharecarefamilymoments: (
      <PhotoGalleryStrip
        title="Sharecare Family Moments"
        subtitle="Team memories and shared moments. Hover a photo to magnify; click for a closer look."
        items={sharedContent.familyMoments || []}
        sectionId="sharecare-family-moments"
        direction="left-to-right"
        expanded={isFocused}
      />
    ),
    timezones: (
      <section className="panel timezone-focus-panel" aria-label="Timezones and alarms">
        <TimezoneClocks onExpandConverter={() => openSection('timezoneconverter')} />
      </section>
    ),
    timezoneconverter: (
      <section className="panel timezone-focus-panel" aria-label="Timezone converter">
        <TimezoneConverter />
      </section>
    ),
  }

  const dashboardSection = (slug) => (
    <SectionFrame slug={slug} title={SECTION_TITLES[slug]} onOpen={openSection}>
      {focusedSections[slug]}
    </SectionFrame>
  )

  return (
    <div className={isFocused ? 'app-shell app-shell--focused' : 'app-shell'}>
      {isFocused ? (
        activeSection && focusedSections[activeSection] ? (
          <SectionPage
            slug={activeSection}
            title={SECTION_TITLES[activeSection]}
            onBack={showDashboard}
          >
            {focusedSections[activeSection]}
          </SectionPage>
        ) : (
          <div className="section-page-not-found">
            <h1>Section not found</h1>
            <p>This DocuTool page does not exist.</p>
            <a href="/" onClick={(event) => { event.preventDefault(); showDashboard() }}>
              Return to DocuTool
            </a>
          </div>
        )
      ) : (
        <>
          <Header
            onOpenAdmin={() => setIsAdminOpen(true)}
            onOpenMini={openMini}
            onOpenTimezones={() => openSection('timezones')}
            onOpenTimezoneConverter={() => openSection('timezoneconverter')}
          />

          <main id="workspace" className="app-main">
            <div className="workspace-grid">
              <div className="left-column">
                {dashboardSection('notestemplates')}
                {dashboardSection('callbacklist')}
                {dashboardSection('scteamschannels')}
                {dashboardSection('carelinxnews')}
                {dashboardSection('regularholidays')}
                {dashboardSection('anonymoussuggestions')}
              </div>

              <div className="center-column">
                {dashboardSection('notepad')}
                {dashboardSection('capturedconversation')}
                {dashboardSection('knowledgebasesearch')}
                {dashboardSection('qascoresrankmtd')}
                {dashboardSection('csatmtd')}
                {dashboardSection('teamspotlight')}
              </div>

              <div className="right-column">
                <InfoPanel
                  announcements={sharedContent.announcements}
                  links={sharedContent.links}
                  source={sharedContent.source}
                  loading={sharedContent.loading}
                  onMaximize={(mode) => openSection(mode === 'links' ? 'soptrainings' : 'managerannouncements')}
                />
                {dashboardSection('puzzleoftheday')}
                {dashboardSection('caregiveroftheday')}
                {dashboardSection('sopquizoftheday')}
                {dashboardSection('carematch')}
              </div>
            </div>

            {dashboardSection('teamrecognition')}
            {dashboardSection('kudos')}
            {dashboardSection('sharecarefamilymoments')}
          </main>

          <AppFooter />
        </>
      )}

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
