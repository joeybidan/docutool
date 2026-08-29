import { useState } from 'react'
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import {
  deleteAnnouncement,
  deleteSharedLink,
  saveAnnouncement,
  saveSharedLink,
} from '../../services/sharedContentService.js'
import { Button } from '../ui/Button.jsx'

const emptyValues = {
  announcements: { title: '', message: '', isPublished: true, sortOrder: 0 },
  links: { title: '', description: '', url: '', isPublished: true, sortOrder: 0 },
}

function valuesFromItem(type, item) {
  if (type === 'announcements') {
    return {
      id: item.id,
      title: item.title,
      message: item.message,
      isPublished: item.isPublished ?? true,
      sortOrder: item.sortOrder ?? 0,
      publishedAt: item.publishedAt,
    }
  }
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    url: item.url,
    isPublished: item.isPublished ?? true,
    sortOrder: item.sortOrder ?? 0,
  }
}

export function AdminContentManager({ type, items, onRefresh, onNotify }) {
  const singular = type === 'announcements' ? 'announcement' : 'link'
  const [values, setValues] = useState(null)
  const [saving, setSaving] = useState(false)

  const updateValue = (name, value) => setValues((current) => ({ ...current, [name]: value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      if (type === 'announcements') await saveAnnouncement(values)
      else await saveSharedLink(values)
      await onRefresh()
      setValues(null)
      onNotify(`${singular[0].toUpperCase() + singular.slice(1)} saved globally.`)
    } catch (error) {
      onNotify(error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete “${item.title}” globally?`)) return
    try {
      if (type === 'announcements') await deleteAnnouncement(item.id)
      else await deleteSharedLink(item.id)
      await onRefresh()
      onNotify(`${singular[0].toUpperCase() + singular.slice(1)} deleted.`)
    } catch (error) {
      onNotify(error.message, 'error')
    }
  }

  return (
    <div className="admin-manager">
      <div className="admin-manager__toolbar">
        <h3>{type === 'announcements' ? 'Announcements' : 'Shared links'}</h3>
        <Button
          size="small"
          variant="primary"
          type="button"
          onClick={() => setValues({ ...emptyValues[type], sortOrder: items.length })}
        >
          <Plus size={14} />
          Add {singular}
        </Button>
      </div>

      <div className="admin-list" aria-label={`Existing ${type}`}>
        {items.map((item) => (
          <div className="admin-list-row" key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <span>{type === 'announcements' ? item.message : item.description || item.url}</span>
            </div>
            <span className="admin-list-row__status">{item.isPublished === false ? 'Draft' : 'Published'}</span>
            <div className="admin-list-row__actions">
              <button
                type="button"
                className="icon-button"
                aria-label={`Edit ${item.title}`}
                onClick={() => setValues(valuesFromItem(type, item))}
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                className="icon-button icon-button--danger"
                aria-label={`Delete ${item.title}`}
                onClick={() => handleDelete(item)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {values && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="form-field form-field--wide">
              <span>Title</span>
              <input
                required
                value={values.title}
                onChange={(event) => updateValue('title', event.target.value)}
              />
            </label>
            <label className="form-field">
              <span>Sort order</span>
              <input
                type="number"
                min="0"
                value={values.sortOrder}
                onChange={(event) => updateValue('sortOrder', event.target.value)}
              />
            </label>
            {type === 'announcements' ? (
              <label className="form-field form-field--full">
                <span>Message</span>
                <textarea
                  required
                  rows="3"
                  value={values.message}
                  onChange={(event) => updateValue('message', event.target.value)}
                />
              </label>
            ) : (
              <>
                <label className="form-field form-field--full">
                  <span>Description</span>
                  <textarea
                    rows="2"
                    value={values.description}
                    onChange={(event) => updateValue('description', event.target.value)}
                  />
                </label>
                <label className="form-field form-field--full">
                  <span>URL</span>
                  <input
                    type="url"
                    required
                    placeholder="https://"
                    value={values.url}
                    onChange={(event) => updateValue('url', event.target.value)}
                  />
                </label>
              </>
            )}
            <label className="checkbox-field form-field--full">
              <input
                type="checkbox"
                checked={values.isPublished}
                onChange={(event) => updateValue('isPublished', event.target.checked)}
              />
              Published
            </label>
          </div>
          <div className="admin-form__actions">
            <Button variant="primary" size="small" type="submit" disabled={saving}>
              <Save size={14} />
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button size="small" type="button" onClick={() => setValues(null)}>
              <X size={14} />
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
