import { NOTE_LABELS } from '../constants/defaults.js'

export function NoteTabs({ activeIndex, onChange }) {
  return (
    <div className="note-tabs" role="tablist" aria-label="Independent note drafts">
      {NOTE_LABELS.map((label, index) => (
        <button
          key={label}
          id={`note-tab-${index}`}
          type="button"
          role="tab"
          aria-selected={activeIndex === index}
          aria-controls={`note-panel-${index}`}
          tabIndex={activeIndex === index ? 0 : -1}
          className={activeIndex === index ? 'note-tab note-tab--active' : 'note-tab'}
          onClick={() => onChange(index)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
