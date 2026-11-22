import { useRef } from 'react'
import { NoteTools } from './NoteTools.jsx'
import { Eraser, ListX, Sparkles } from 'lucide-react'
import { NoteEditor, FormatControls } from './NoteEditor.jsx'
import { NoteTabs } from './NoteTabs.jsx'
import { QuickCallWrapUp } from './QuickCallWrapUp.jsx'
import { FavoriteTemplates } from './FavoriteTemplates.jsx'
import { QuickDistanceCheck } from './QuickDistanceCheck.jsx'
import { ReviewCopyPanel } from './ReviewCopyPanel.jsx'
import { Button } from './ui/Button.jsx'

export function NotesWorkspace({
  activeIndex,
  names, html, onAdd, onRename, onDelete, saveError,
  templates, favoriteTemplateIds, onInsertFavorite,
  compactDistance = false, onAddDistance,
  note,
  onActiveIndexChange,
  onNoteChange,
  onGenerate,
  onCopy,
  onClear,
  onUncheck,
  selectedCount,
  onAddWrapUp,
}) {
  const editorRef = useRef(null)
  return (
    <section className="panel notes-workspace" aria-label="Advanced notepad">
      <QuickDistanceCheck compact={compactDistance} onAddToNote={onAddDistance} noteName={names[activeIndex]} />
      <NoteTools note={note} html={html} name={names[activeIndex]} />
      <NoteTabs activeIndex={activeIndex} onChange={onActiveIndexChange} names={names}
        onAdd={onAdd} onRename={onRename} onDelete={onDelete} note={note} />
      <FavoriteTemplates templates={templates} favoriteTemplateIds={favoriteTemplateIds}
        noteName={names[activeIndex]} onInsert={onInsertFavorite} />
      <QuickCallWrapUp activeIndex={activeIndex} noteName={names[activeIndex]} onAdd={onAddWrapUp} />
      <NoteEditor editorRef={editorRef} html={html} activeIndex={activeIndex} value={note} onChange={onNoteChange} />
      <div className="note-actions" aria-label="Notepad actions">
        <Button variant="primary" type="button" onClick={onGenerate} disabled={!selectedCount}>
          <Sparkles size={16} />
          Generate
          {selectedCount > 0 && <span className="button-count">{selectedCount}</span>}
        </Button>
        <ReviewCopyPanel note={note} noteName={names[activeIndex]} activeIndex={activeIndex}
          onCopy={onCopy} editorRef={editorRef} />
        <Button type="button" onClick={onClear} disabled={!note}>
          <Eraser size={16} />
          Clear
        </Button>
        <Button type="button" onClick={onUncheck} disabled={!selectedCount}>
          <ListX size={16} />
          Uncheck
        </Button>
        <FormatControls editorRef={editorRef} onChange={onNoteChange} />
        <span className="autosave-status" role="status">{saveError ? "Could not save locally. Export your notes before closing." : "Saved locally in this browser"}</span>
      </div>
    </section>
  )
}
