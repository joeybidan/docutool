export function NoteEditor({ activeIndex, value, onChange }) {
  return (
    <div
      id={`note-panel-${activeIndex}`}
      className="note-editor-shell"
      role="tabpanel"
      aria-labelledby={`note-tab-${activeIndex}`}
    >
      <label className="sr-only" htmlFor={`note-editor-${activeIndex}`}>
        Editable content for Note {activeIndex + 1}
      </label>
      <textarea
        id={`note-editor-${activeIndex}`}
        className="note-editor"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Type your documentation here, or generate selected phrases…"
        spellCheck="true"
      />
    </div>
  )
}
