import { useRef } from 'react'
import { NoteTools } from './NoteTools.jsx'
import { Copy, Eraser, ListX, Sparkles } from 'lucide-react'
import { NoteEditor, FormatControls } from './NoteEditor.jsx'
import { NoteTabs } from './NoteTabs.jsx'
import { Button } from './ui/Button.jsx'

export function NotesWorkspace({
  activeIndex,
  names, html, onAdd, onRename, saveError,
  note,
  onActiveIndexChange,
  onNoteChange,
  onGenerate,
  onCopy,
  onClear,
  onUncheck,
  selectedCount,
}) {
  const editorRef = useRef(null)
  return (
    <section className="panel notes-workspace" aria-label="Advanced notepad">
      <NoteTools note={note} html={html} name={names[activeIndex]} />
      <NoteTabs activeIndex={activeIndex} onChange={onActiveIndexChange} names={names} onAdd={onAdd} onRename={onRename} />
      <NoteEditor editorRef={editorRef} html={html} activeIndex={activeIndex} value={note} onChange={onNoteChange} />
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
        <FormatControls editorRef={editorRef} onChange={onNoteChange} />
        <span className="autosave-status" role="status">{saveError ? "Could not save locally. Export your notes before closing." : "Saved locally in this browser"}</span>
      </div>
    </section>
  )
}
