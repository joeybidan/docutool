import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'

export function NoteTabs({ activeIndex, onChange, names, onAdd, onRename, onDelete, note }) {
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  // An open confirmation must not apply to a different note.
  useEffect(() => {
    setConfirmDelete(false)
    setRenaming(false)
  }, [activeIndex])

  function addTab() {
    onAdd()
    setRenaming(false)
    setConfirmDelete(false)
  }

  return <div className="note-tab-controls">
    <div className="note-tabs" role="tablist" aria-label="Note drafts">
      {names.map((label, index) => <button key={index} type="button" role="tab"
        aria-selected={activeIndex === index}
        className={activeIndex === index ? 'note-tab note-tab--active' : 'note-tab'}
        onClick={() => { onChange(index); setRenaming(false); setConfirmDelete(false) }}
        onDoubleClick={() => { onChange(index); setName(label); setRenaming(true); setConfirmDelete(false) }}>
        {label}
      </button>)}
    </div>
    <div className="note-manage-actions">
      <button type="button" onClick={addTab}>+ New note</button>
      <button type="button" onClick={() => {
        setName(names[activeIndex]); setRenaming(true); setConfirmDelete(false)
      }}>Rename</button>
      <button type="button" className="note-tab-delete" disabled={names.length <= 1}
        title={names.length <= 1 ? 'Keep at least one note tab' : 'Delete the selected note tab'}
        onClick={() => { setConfirmDelete(true); setRenaming(false) }}>
        <Trash2 size={13} aria-hidden="true" /> Delete tab
      </button>
    </div>
    {renaming && <form className="note-rename" onSubmit={e => {
      e.preventDefault()
      if (name.trim()) { onRename(activeIndex, name); setRenaming(false) }
    }}>
      <input aria-label="Note name" value={name} onChange={e => setName(e.target.value)} autoFocus />
      <button type="submit" disabled={!name.trim()}>Save name</button>
      <button type="button" onClick={() => setRenaming(false)}>Cancel</button>
    </form>}
    {confirmDelete && names.length > 1 && (
      <div className="note-tab-delete-confirm" role="group" aria-label="Confirm note tab deletion">
        <div>
          <strong>Delete “{names[activeIndex]}”?</strong>
          <p>{note?.trim()
            ? 'This tab contains saved notes. Export them first if needed—deleting cannot be undone.'
            : 'This empty tab will be removed. Deleting cannot be undone.'}</p>
        </div>
        <div className="note-tab-delete-confirm__actions">
          <button type="button" className="note-tab-delete-confirm__cancel"
            onClick={() => setConfirmDelete(false)}>Cancel</button>
          <button type="button" className="note-tab-delete-confirm__yes"
            onClick={() => { onDelete(activeIndex); setConfirmDelete(false); setRenaming(false) }}>
            Yes, delete tab
          </button>
        </div>
      </div>
    )}
  </div>
}
