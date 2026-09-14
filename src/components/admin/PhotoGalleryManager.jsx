import { useState } from 'react'
import { ImagePlus, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import {
  deletePhotoGalleryItem,
  savePhotoGalleryItem,
} from '../../services/sharedContentService.js'
import { Button } from '../ui/Button.jsx'

export function PhotoGalleryManager({ gallery, label, items, onRefresh, onNotify }) {
  const [values, setValues] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [saving, setSaving] = useState(false)

  const updateValue = (name, value) => setValues((current) => ({ ...current, [name]: value }))
  const startEdit = (item) => {
    setImageFile(null)
    setValues({ ...item })
  }

  const startAdd = () => {
    setImageFile(null)
    setValues({
      gallery,
      title: '',
      caption: '',
      imagePath: null,
      isPublished: true,
      sortOrder: items.length,
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!values.imagePath && !imageFile && !values.imageUrl) {
      onNotify('Choose a photo before saving.', 'error')
      return
    }

    setSaving(true)
    try {
      await savePhotoGalleryItem({ ...values, gallery }, imageFile)
      await onRefresh()
      setValues(null)
      setImageFile(null)
      onNotify(`${label} photo saved globally.`)
    } catch (error) {
      onNotify(error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete this ${label} photo?`)) return
    try {
      await deletePhotoGalleryItem(item.id, item.imagePath)
      await onRefresh()
      onNotify(`${label} photo deleted.`)
    } catch (error) {
      onNotify(error.message, 'error')
    }
  }

  return (
    <div className="admin-manager">
      <div className="admin-manager__toolbar">
        <h3>{label}</h3>
        <Button size="small" variant="primary" type="button" onClick={startAdd}>
          <Plus size={14} />
          Add photo
        </Button>
      </div>

      <div className="admin-list">
        {items.map((item, index) => (
          <div className="admin-list-row admin-list-row--recognition" key={item.id}>
            {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <span className="mini-avatar" />}
            <div>
              <strong>{item.title || `${label} photo ${index + 1}`}</strong>
              <span>{item.caption || 'No caption'}</span>
            </div>
            <span className="admin-list-row__status">{item.isPublished === false ? 'Draft' : 'Published'}</span>
            <div className="admin-list-row__actions">
              <button
                type="button"
                className="icon-button"
                aria-label={`Edit ${label} photo`}
                onClick={() => startEdit(item)}
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                className="icon-button icon-button--danger"
                aria-label={`Delete ${label} photo`}
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
              <span>Photo title (optional)</span>
              <input
                value={values.title || ''}
                onChange={(event) => updateValue('title', event.target.value)}
                placeholder={label}
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
            <label className="form-field form-field--full">
              <span>Caption (optional)</span>
              <textarea
                rows="2"
                value={values.caption || ''}
                onChange={(event) => updateValue('caption', event.target.value)}
              />
            </label>
            <label className="form-field form-field--wide file-field">
              <span>Photo</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => setImageFile(event.target.files?.[0] || null)}
              />
              <small><ImagePlus size={13} /> PNG, JPEG, or WebP. Existing image is kept if no file is selected.</small>
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
