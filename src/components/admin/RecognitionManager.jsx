import { useState } from 'react'
import { ImagePlus, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { RECOGNITION_CATEGORIES } from '../../constants/defaults.js'
import {
  deleteRecognition,
  saveRecognition,
} from '../../services/sharedContentService.js'
import { Button } from '../ui/Button.jsx'

const emptyRecognition = {
  employeeName: '',
  category: RECOGNITION_CATEGORIES[0],
  caption: '',
  imagePath: null,
  isPublished: true,
  sortOrder: 0,
}

export function RecognitionManager({ items, onRefresh, onNotify }) {
  const [values, setValues] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [saving, setSaving] = useState(false)

  const updateValue = (name, value) => setValues((current) => ({ ...current, [name]: value }))
  const startEdit = (item) => {
    setImageFile(null)
    setValues({ ...item })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!values.imagePath && !imageFile && !values.imageUrl) {
      onNotify('Choose a recognition image before saving.', 'error')
      return
    }

    setSaving(true)
    try {
      await saveRecognition(values, imageFile)
      await onRefresh()
      setValues(null)
      setImageFile(null)
      onNotify('Recognition saved globally.')
    } catch (error) {
      onNotify(error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete recognition for ${item.employeeName}?`)) return
    try {
      await deleteRecognition(item.id, item.imagePath)
      await onRefresh()
      onNotify('Recognition deleted.')
    } catch (error) {
      onNotify(error.message, 'error')
    }
  }

  return (
    <div className="admin-manager">
      <div className="admin-manager__toolbar">
        <h3>Recognition</h3>
        <Button
          size="small"
          variant="primary"
          type="button"
          onClick={() => {
            setImageFile(null)
            setValues({ ...emptyRecognition, sortOrder: items.length })
          }}
        >
          <Plus size={14} />
          Add recognition
        </Button>
      </div>

      <div className="admin-list">
        {items.map((item) => (
          <div className="admin-list-row admin-list-row--recognition" key={item.id}>
            {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <span className="mini-avatar" />}
            <div>
              <strong>{item.employeeName}</strong>
              <span>{item.category}</span>
            </div>
            <span className="admin-list-row__status">{item.isPublished === false ? 'Draft' : 'Published'}</span>
            <div className="admin-list-row__actions">
              <button
                type="button"
                className="icon-button"
                aria-label={`Edit recognition for ${item.employeeName}`}
                onClick={() => startEdit(item)}
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                className="icon-button icon-button--danger"
                aria-label={`Delete recognition for ${item.employeeName}`}
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
              <span>Employee name</span>
              <input
                required
                value={values.employeeName}
                onChange={(event) => updateValue('employeeName', event.target.value)}
              />
            </label>
            <label className="form-field">
              <span>Category</span>
              <select
                value={values.category}
                onChange={(event) => updateValue('category', event.target.value)}
              >
                {RECOGNITION_CATEGORIES.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label className="form-field form-field--full">
              <span>Caption</span>
              <textarea
                rows="2"
                value={values.caption}
                onChange={(event) => updateValue('caption', event.target.value)}
              />
            </label>
            <label className="form-field form-field--wide file-field">
              <span>Recognition image</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => setImageFile(event.target.files?.[0] || null)}
              />
              <small><ImagePlus size={13} /> PNG, JPEG, or WebP. Existing image is kept if no file is selected.</small>
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
