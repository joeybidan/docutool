import { useState } from 'react'

export function NoteTabs({ activeIndex, onChange, names, onAdd, onRename }) {
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState('')
  return <div className="note-tab-controls">
    <div className="note-tabs" role="tablist" aria-label="Note drafts">
      {names.map((label, index) => <button key={index} type="button" role="tab" aria-selected={activeIndex === index}
        className={activeIndex === index ? 'note-tab note-tab--active' : 'note-tab'}
        onClick={() => { onChange(index); setRenaming(false) }} onDoubleClick={() => { setName(label); setRenaming(true) }}>{label}</button>)}
    </div>
    <div className="note-manage-actions">
      <button type="button" onClick={() => { onAdd(); setRenaming(false) }}>+ New note</button>
      <button type="button" onClick={() => { setName(names[activeIndex]); setRenaming(true) }}>Rename</button>
    </div>
    {renaming && <form className="note-rename" onSubmit={e => { e.preventDefault(); if (name.trim()) { onRename(activeIndex, name); setRenaming(false) } }}>
      <input aria-label="Note name" value={name} onChange={e => setName(e.target.value)} autoFocus />
      <button type="submit" disabled={!name.trim()}>Save name</button><button type="button" onClick={() => setRenaming(false)}>Cancel</button>
    </form>}
  </div>
}
