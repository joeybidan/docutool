import { Copy, Eraser, ListX, Sparkles } from 'lucide-react'
import { NoteEditor } from './NoteEditor.jsx'
import { NoteTabs } from './NoteTabs.jsx'
import { Button } from './ui/Button.jsx'

export function NotesWorkspace({
  activeIndex,
  note,
  onActiveIndexChange,
  onNoteChange,
  onGenerate,
  onCopy,
  onClear,
  onUncheck,
  selectedCount,
}) {
  return (
    <section className="panel notes-workspace" aria-label="Advanced notepad">
      <NoteTabs activeIndex={activeIndex} onChange={onActiveIndexChange} />
      <NoteEditor activeIndex={activeIndex} value={note} onChange={onNoteChange} />
      <div className="note-actions" aria-label="Notepad actions">
        <Button variant="primary" type="button" onClick={onGenerate} disabled={!selectedCount}>
          <Sparkles size={16} />
          Generate
          {selectedCount > 0 && <span className="button-count">{selectedCount}</span>}
        </Button>
        <Button type="button" onClick={onCopy} disabled={!note}>
          <Copy size={16} />
          Copy
        </Button>
        <Button type="button" onClick={onClear} disabled={!note}>
          <Eraser size={16} />
          Clear
        </Button>
        <Button type="button" onClick={onUncheck} disabled={!selectedCount}>
          <ListX size={16} />
          Uncheck
        </Button>
        <span className="autosave-status" aria-live="polite">Saved locally</span>
      </div>
    </section>
  )
}
