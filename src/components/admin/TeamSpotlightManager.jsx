import { useEffect, useState } from 'react'
import { Save, Trash2 } from 'lucide-react'
import { clearTeamSpotlight, saveTeamSpotlight } from '../../services/teamSpotlightService.js'
import { TeamSpotlight } from '../TeamSpotlight.jsx'
import { Button } from '../ui/Button.jsx'

const emptyValues = () => ({
  employeeName: '',
  team: '',
  weekLabel: '',
  hook: '',
  intro: '',
  funFact: '',
  qa: [{ question: '', answer: '' }, { question: '', answer: '' }, { question: '', answer: '' }],
  imagePath: null,
  imageUrl: '',
  isApproved: false,
  isPublished: false,
})

function editableValues(item) {
  const defaults = emptyValues()
  if (!item) return defaults
  return {
    ...defaults,
    ...item,
    qa: defaults.qa.map((pair, index) => item.qa?.[index] || pair),
  }
}

export function TeamSpotlightManager({ item, onRefresh, onNotify }) {
  const [values, setValues] = useState(() => editableValues(item))
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setValues(editableValues(item))
    setImageFile(null)
  }, [item])

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl('')
      return undefined
    }
    const url = URL.createObjectURL(imageFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  const update = (field, value) => setValues((current) => ({
    ...current,
    [field]: value,
    isApproved: false,
    isPublished: false,
  }))

  const updateQA = (index, field, value) => setValues((current) => ({
    ...current,
    qa: current.qa.map((entry, entryIndex) => entryIndex === index ? { ...entry, [field]: value } : entry),
    isApproved: false,
    isPublished: false,
  }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await saveTeamSpotlight(values, imageFile)
      await onRefresh()
      onNotify(values.isPublished ? 'Team Spotlight published globally.' : 'Team Spotlight saved as a draft.')
    } catch (error) {
      onNotify(error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleClear = async () => {
    if (!window.confirm('Remove this Team Spotlight and its photo?')) return
    setSaving(true)
    try {
      await clearTeamSpotlight()
      await onRefresh()
      onNotify('Team Spotlight removed.')
    } catch (error) {
      onNotify(error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-manager spotlight-manager">
      <div className="admin-manager__toolbar">
        <div>
          <h3>Team Spotlight</h3>
          <p className="panel-subtitle">One shared feature below CSAT MTD. Save a draft, review it with the employee, then publish.</p>
        </div>
        {item && <span className="admin-list-row__status">{item.isPublished ? 'Published' : 'Draft'}</span>}
      </div>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="form-field"><span>Employee name</span>
            <input required maxLength="100" value={values.employeeName} onChange={(event) => update('employeeName', event.target.value)} />
          </label>
          <label className="form-field"><span>Team or role</span>
            <input maxLength="100" value={values.team} onChange={(event) => update('team', event.target.value)} placeholder="Caregiver Support" />
          </label>
          <label className="form-field form-field--full"><span>Week label</span>
            <input maxLength="50" value={values.weekLabel} onChange={(event) => update('weekLabel', event.target.value)} placeholder="Sep 21–27" />
          </label>
          <label className="form-field form-field--full"><span>Hook</span>
            <input required maxLength="180" value={values.hook} onChange={(event) => update('hook', event.target.value)} placeholder="A clear next step at work. A new recipe after hours." />
          </label>
          <label className="form-field form-field--full"><span>Short introduction</span>
            <textarea required maxLength="500" rows="2" value={values.intro} onChange={(event) => update('intro', event.target.value)} placeholder="This week, meet…" />
          </label>
          <label className="form-field form-field--full"><span>Fun fact</span>
            <textarea maxLength="250" rows="2" value={values.funFact} onChange={(event) => update('funFact', event.target.value)} />
          </label>
          <label className="form-field form-field--full file-field"><span>Employee-approved photo (optional)</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => {
              setImageFile(event.target.files?.[0] || null)
              setValues((current) => ({ ...current, isApproved: false, isPublished: false }))
            }} />
            <small>PNG, JPEG, or WebP, up to 5 MB. Without a photo, an avatar appears.</small>
          </label>
        </div>

        <div className="spotlight-manager__questions">
          <h4>Approved Q&amp;A</h4>
          <p className="panel-subtitle">Up to three pairs. Leave unused pairs blank.</p>
          {values.qa.map((pair, index) => (
            <div className="spotlight-manager__pair" key={index}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <label className="form-field"><span>Question</span>
                <input maxLength="200" value={pair.question} onChange={(event) => updateQA(index, 'question', event.target.value)} />
              </label>
              <label className="form-field"><span>Answer</span>
                <textarea maxLength="600" rows="2" value={pair.answer} onChange={(event) => updateQA(index, 'answer', event.target.value)} />
              </label>
            </div>
          ))}
        </div>

        <div className="spotlight-manager__publishing">
          <label className="checkbox-field"><input type="checkbox" checked={values.isApproved} onChange={(event) => setValues((current) => ({ ...current, isApproved: event.target.checked, isPublished: event.target.checked ? current.isPublished : false }))} />
            The employee approved this exact text and photo.
          </label>
          <label className="checkbox-field"><input type="checkbox" checked={values.isPublished} disabled={!values.isApproved} onChange={(event) => setValues((current) => ({ ...current, isPublished: event.target.checked }))} />
            Publish globally
          </label>
        </div>

        <div className="admin-form__actions">
          <Button variant="primary" size="small" type="submit" disabled={saving}><Save size={14} />{saving ? 'Saving…' : values.isPublished ? 'Publish spotlight' : 'Save draft'}</Button>
          {item && <Button size="small" type="button" disabled={saving} onClick={handleClear}><Trash2 size={14} />Remove</Button>}
        </div>
      </form>

      <div className="spotlight-manager__preview">
        <h4>Preview</h4>
        <TeamSpotlight preview item={{ ...values, imageUrl: previewUrl || values.imageUrl }} />
      </div>
    </div>
  )
}
