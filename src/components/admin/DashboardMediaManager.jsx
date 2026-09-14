import { useMemo, useState } from 'react'
import { ImagePlus, Pencil, Save, X } from 'lucide-react'
import { saveDashboardMedia } from '../../services/sharedContentService.js'
import { Button } from '../ui/Button.jsx'

const SLOT_CONFIG = [
  { slot: 'qa_scores_rank_mtd', label: 'QA Scores Rank MTD', needsAnswer: false },
  { slot: 'puzzle_of_day', label: 'Puzzle of the Day', needsAnswer: true },
  { slot: 'caregiver_of_day', label: 'Caregiver of the Day', needsAnswer: true },
  { slot: 'sop_quiz_of_day', label: 'SOP Quiz of the Day', needsAnswer: true },
]

function timeZoneOffsetMinutes(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'longOffset',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const name = parts.find((part) => part.type === 'timeZoneName')?.value || 'GMT+00:00'
  const match = name.match(/GMT([+-])(\d{2}):(\d{2})/)
  if (!match) return 0
  const minutes = Number(match[2]) * 60 + Number(match[3])
  return match[1] === '-' ? -minutes : minutes
}

function easternDateParts(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  return Object.fromEntries(parts.map((part) => [part.type, part.value]))
}

function easternFivePmIso(year, month, day) {
  const probe = new Date(Date.UTC(year, month - 1, day, 17, 0, 0))
  const offset = timeZoneOffsetMinutes(probe, 'America/New_York')
  return new Date(Date.UTC(year, month - 1, day, 17, 0, 0) - offset * 60_000).toISOString()
}

function nextFivePmEasternIso() {
  const now = new Date()
  const parts = easternDateParts(now)
  let year = Number(parts.year)
  let month = Number(parts.month)
  let day = Number(parts.day)
  let candidate = easternFivePmIso(year, month, day)

  if (new Date(candidate).getTime() <= now.getTime()) {
    const nextDate = new Date(Date.UTC(year, month - 1, day + 1, 12, 0, 0))
    const nextParts = easternDateParts(nextDate)
    year = Number(nextParts.year)
    month = Number(nextParts.month)
    day = Number(nextParts.day)
    candidate = easternFivePmIso(year, month, day)
  }
  return candidate
}

function toLocalInputValue(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function DashboardMediaManager({ items = {}, onRefresh, onNotify }) {
  const [editingSlot, setEditingSlot] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [values, setValues] = useState(null)
  const [saving, setSaving] = useState(false)

  const config = useMemo(
    () => SLOT_CONFIG.find((item) => item.slot === editingSlot) || null,
    [editingSlot],
  )

  const startEdit = (slotConfig) => {
    const current = items[slotConfig.slot] || {}
    setEditingSlot(slotConfig.slot)
    setImageFile(null)
    setValues({
      slot: slotConfig.slot,
      imagePath: current.imagePath || null,
      imageUrl: current.imageUrl || '',
      answer: current.answer || '',
      revealAt: current.revealAt || (slotConfig.needsAnswer ? nextFivePmEasternIso() : null),
      isPublished: current.isPublished ?? true,
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!values.imagePath && !values.imageUrl && !imageFile) {
      onNotify('Choose an image before saving.', 'error')
      return
    }
    if (config?.needsAnswer && !values.answer.trim()) {
      onNotify('Add the answer before saving this daily card.', 'error')
      return
    }

    setSaving(true)
    try {
      await saveDashboardMedia(values, imageFile)
      await onRefresh()
      onNotify(`${config.label} updated globally.`)
      setEditingSlot(null)
      setValues(null)
      setImageFile(null)
    } catch (error) {
      onNotify(error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-manager dashboard-media-manager">
      <div className="admin-manager__toolbar">
        <div>
          <h3>Dashboard Media</h3>
          <p className="panel-subtitle">Upload the shared images shown in the main dashboard.</p>
        </div>
      </div>

      <div className="admin-list">
        {SLOT_CONFIG.map((slotConfig) => {
          const item = items[slotConfig.slot]
          return (
            <div className="admin-list-row admin-list-row--media" key={slotConfig.slot}>
              {item?.imageUrl ? <img src={item.imageUrl} alt="" /> : <span className="mini-avatar" />}
              <div>
                <strong>{slotConfig.label}</strong>
                <span>{item?.imageUrl ? 'Image uploaded' : 'No image yet'}</span>
              </div>
              <span className="admin-list-row__status">{item?.isPublished === false ? 'Draft' : 'Published'}</span>
              <div className="admin-list-row__actions">
                <button className="icon-button" type="button" onClick={() => startEdit(slotConfig)} aria-label={`Edit ${slotConfig.label}`}>
                  <Pencil size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {values && config && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="form-field form-field--full file-field">
              <span>{config.label} image</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => setImageFile(event.target.files?.[0] || null)}
              />
              <small><ImagePlus size={13} /> PNG, JPEG, or WebP. Images display uncropped and auto-fit their box.</small>
            </label>

            {config.needsAnswer && (
              <>
                <label className="form-field form-field--full">
                  <span>Answer</span>
                  <textarea
                    rows="2"
                    required
                    value={values.answer}
                    onChange={(event) => setValues((current) => ({ ...current, answer: event.target.value }))}
                    placeholder="This stays covered until the reveal timer ends."
                  />
                </label>
                <label className="form-field form-field--wide">
                  <span>Answer reveal date/time</span>
                  <input
                    type="datetime-local"
                    value={toLocalInputValue(values.revealAt)}
                    onChange={(event) => setValues((current) => ({
                      ...current,
                      revealAt: event.target.value ? new Date(event.target.value).toISOString() : nextFivePmEasternIso(),
                    }))}
                  />
                  <small>Defaults to the next 5:00 PM Eastern Time. You can change it here.</small>
                </label>
              </>
            )}

            <label className="checkbox-field form-field--full">
              <input
                type="checkbox"
                checked={values.isPublished}
                onChange={(event) => setValues((current) => ({ ...current, isPublished: event.target.checked }))}
              />
              Published
            </label>
          </div>

          <div className="admin-form__actions">
            <Button variant="primary" size="small" type="submit" disabled={saving}>
              <Save size={14} />
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button size="small" type="button" onClick={() => {
              setEditingSlot(null)
              setValues(null)
              setImageFile(null)
            }}>
              <X size={14} />
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
