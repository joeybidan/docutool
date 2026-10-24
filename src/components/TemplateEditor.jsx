import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { TEMPLATE_GROUPS } from '../constants/defaults.js'
import { getDefaultTemplates } from '../services/localStorageService.js'
import { Button } from './ui/Button.jsx'

function moveItem(items, index, direction) {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= items.length) return items
  const reordered = [...items]
  const [item] = reordered.splice(index, 1)
  reordered.splice(nextIndex, 0, item)
  return reordered
}

export function TemplateEditor({ templates, onChange, onDone, onNotify }) {
  const [newPhrase, setNewPhrase] = useState('')
  const [newGroup, setNewGroup] = useState(TEMPLATE_GROUPS[0].id)

  const addPhrase = (event) => {
    event.preventDefault()
    const phrase = newPhrase.trim()
    if (!phrase) return
    onChange([
      ...templates,
      { id: `custom-${crypto.randomUUID()}`, text: phrase, group: newGroup },
    ])
    setNewPhrase('')
    onNotify('Template phrase added.')
  }

  const restoreDefaults = () => {
    if (!window.confirm('Restore the grouped DocuTool template phrases?')) return
    onChange(getDefaultTemplates())
    onNotify('Grouped default templates restored.')
  }

  return (
    <div className="template-editor">
      <p className="panel-subtitle">Changes save only in this browser. Choose a workflow group for each phrase.</p>

      <div className="template-editor__list" aria-label="Editable note template phrases">
        {templates.map((template, index) => (
          <div className="template-edit-row template-edit-row--grouped" key={template.id}>
            <label className="sr-only" htmlFor={`template-${template.id}`}>
              Template phrase {index + 1}
            </label>
            <select
              className="template-edit-row__group"
              aria-label={`Group for ${template.text}`}
              value={template.group}
              onChange={(event) =>
                onChange(
                  templates.map((item) =>
                    item.id === template.id ? { ...item, group: event.target.value } : item,
                  ),
                )
              }
            >
              {TEMPLATE_GROUPS.map((group) => (
                <option key={group.id} value={group.id}>{group.label}</option>
              ))}
            </select>
            <textarea
              id={`template-${template.id}`}
              rows="2"
              value={template.text}
              onChange={(event) =>
                onChange(
                  templates.map((item) =>
                    item.id === template.id ? { ...item, text: event.target.value } : item,
                  ),
                )
              }
            />
            <div className="template-edit-row__actions">
              <button
                type="button"
                className="icon-button"
                aria-label={`Move ${template.text} up`}
                disabled={index === 0}
                onClick={() => onChange(moveItem(templates, index, -1))}
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label={`Move ${template.text} down`}
                disabled={index === templates.length - 1}
                onClick={() => onChange(moveItem(templates, index, 1))}
              >
                <ChevronDown size={14} />
              </button>
              <button
                type="button"
                className="icon-button icon-button--danger"
                aria-label={`Delete ${template.text}`}
                onClick={() => onChange(templates.filter((item) => item.id !== template.id))}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <form className="add-template-form add-template-form--grouped" onSubmit={addPhrase}>
        <label htmlFor="new-template">Add template phrase</label>
        <div className="add-template-form__controls">
          <select
            aria-label="Template group"
            value={newGroup}
            onChange={(event) => setNewGroup(event.target.value)}
          >
            {TEMPLATE_GROUPS.map((group) => (
              <option key={group.id} value={group.id}>{group.label}</option>
            ))}
          </select>
          <input
            id="new-template"
            type="text"
            value={newPhrase}
            onChange={(event) => setNewPhrase(event.target.value)}
            placeholder="Type a reusable phrase"
          />
          <Button size="small" variant="secondary" type="submit">
            <Plus size={14} />
            Add
          </Button>
        </div>
      </form>

      <div className="template-editor__footer">
        <Button size="small" variant="ghost" type="button" onClick={restoreDefaults}>
          <RotateCcw size={14} />
          Restore defaults
        </Button>
        <Button size="small" variant="primary" type="button" onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  )
}
