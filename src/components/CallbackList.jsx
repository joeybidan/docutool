import { useState } from 'react'
import { Check, Clock3, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from './ui/Button.jsx'

const emptyValues = {
  id: null,
  name: '',
  profileLink: '',
  scheduledAt: '',
  status: 'pending',
}

function formatSchedule(value) {
  if (!value) return 'No date/time set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function CallbackList({
  callbacks,
  selectedIds,
  onToggle,
  onSave,
  onDelete,
  onStatusChange,
  onNotify,
}) {
  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState(emptyValues)

  const startNew = () => {
    setValues(emptyValues)
    setEditing(true)
  }

  const startEdit = (item) => {
    setValues({ ...item })
    setEditing(true)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!values.name.trim()) return
    onSave(values)
    onNotify(values.id ? 'Callback updated.' : 'Callback added.')
    setValues(emptyValues)
    setEditing(false)
  }

  return (
    <section className="panel callback-panel" aria-labelledby="callback-list-title">
      <div className="panel-heading">
        <div>
          <h2 id="callback-list-title">Callback List</h2>
          <p className="panel-subtitle">Personal reminders saved only in this browser.</p>
        </div>
        <Button size="small" type="button" onClick={startNew}>
          <Pencil size={13} />
          Edit
        </Button>
      </div>

      {callbacks.length ? (
        <div className="callback-list">
          {callbacks.map((item) => (
            <article
              key={item.id}
              className={`callback-item callback-item--${item.status}`}
            >
              <label className="callback-item__select">
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.id)}
                  onChange={() => onToggle(item.id)}
                />
                <span className="sr-only">Select callback for {item.name}</span>
              </label>

              <div className="callback-item__body">
                <div className="callback-item__topline">
                  {item.profileLink ? (
                    <a href={item.profileLink} target="_blank" rel="noopener noreferrer">
                      {item.name}
                    </a>
                  ) : (
                    <strong>{item.name}</strong>
                  )}
                  <span><Clock3 size={12} /> {formatSchedule(item.scheduledAt)}</span>
                </div>

                <div className="callback-status-actions" aria-label={`Callback status for ${item.name}`}>
                  <button
                    type="button"
                    className={item.status === 'success' ? 'is-active is-success' : ''}
                    onClick={() => onStatusChange(item.id, 'success')}
                  >
                    Success
                  </button>
                  <button
                    type="button"
                    className={item.status === 'missed' ? 'is-active is-missed' : ''}
                    onClick={() => onStatusChange(item.id, 'missed')}
                  >
                    Missed
                  </button>
                  <button
                    type="button"
                    className={item.status === 'will-call-again' ? 'is-active' : ''}
                    onClick={() => onStatusChange(item.id, 'will-call-again')}
                  >
                    Will Call Again
                  </button>
                </div>
              </div>

              <div className="callback-item__actions">
                <button type="button" className="icon-button" onClick={() => startEdit(item)} aria-label={`Edit ${item.name}`}>
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  className="icon-button icon-button--danger"
                  onClick={() => {
                    if (window.confirm(`Delete callback for ${item.name}?`)) onDelete(item.id)
                  }}
                  aria-label={`Delete ${item.name}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-message">No callbacks yet. Choose Edit to add one.</p>
      )}

      {editing && (
        <form className="callback-form" onSubmit={handleSubmit}>
          <label>
            <span>Name</span>
            <input
              required
              value={values.name}
              onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
              placeholder="Client or member name"
            />
          </label>
          <label>
            <span>Profile Link</span>
            <input
              type="url"
              value={values.profileLink}
              onChange={(event) => setValues((current) => ({ ...current, profileLink: event.target.value }))}
              placeholder="https://..."
            />
          </label>
          <label>
            <span>Date and Time</span>
            <input
              required
              type="datetime-local"
              value={values.scheduledAt}
              onChange={(event) => setValues((current) => ({ ...current, scheduledAt: event.target.value }))}
            />
          </label>
          <div className="callback-form__actions">
            <Button variant="primary" size="small" type="submit">
              {values.id ? <Check size={13} /> : <Plus size={13} />}
              {values.id ? 'Save' : 'Add'}
            </Button>
            <Button size="small" type="button" onClick={() => setEditing(false)}>
              <X size={13} />
              Cancel
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}
