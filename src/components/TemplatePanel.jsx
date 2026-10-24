import { useMemo, useState } from 'react'
import { CheckSquare2, Pencil } from 'lucide-react'
import { TEMPLATE_GROUPS } from '../constants/defaults.js'
import { Button } from './ui/Button.jsx'
import { TemplateEditor } from './TemplateEditor.jsx'

export function TemplatePanel({ templates, selectedIds, onToggle, onTemplatesChange, onNotify }) {
  const [isEditing, setIsEditing] = useState(false)
  const groupedTemplates = useMemo(
    () =>
      TEMPLATE_GROUPS.map((group) => ({
        ...group,
        templates: templates.filter((template) => template.group === group.id),
      })).filter((group) => group.templates.length > 0),
    [templates],
  )

  return (
    <aside className="panel template-panel" aria-labelledby="template-heading">
      <div className="panel-heading">
        <div>
          <h2 id="template-heading">Note Templates</h2>
          {!isEditing && <p className="panel-subtitle">Select phrases by workflow group.</p>}
        </div>
        {!isEditing && (
          <Button size="small" variant="ghost" type="button" onClick={() => setIsEditing(true)}>
            <Pencil size={14} />
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <TemplateEditor
          templates={templates}
          onChange={onTemplatesChange}
          onDone={() => setIsEditing(false)}
          onNotify={onNotify}
        />
      ) : (
        <>
          <div className="template-list template-list--grouped">
            {groupedTemplates.map((group) => (
              <section className="template-group" key={group.id} aria-labelledby={`template-group-${group.id}`}>
                <h3 id={`template-group-${group.id}`}>{group.label}</h3>
                <div className="template-group__options">
                  {group.templates.map((template) => (
                    <label className="template-option" key={template.id}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(template.id)}
                        onChange={() => onToggle(template.id)}
                      />
                      <span>{template.text}</span>
                    </label>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <div className="panel-hint">
            <CheckSquare2 size={16} aria-hidden="true" />
            <span>Checked items stay synchronized with DocuTool Mini and are inserted in this order.</span>
          </div>
        </>
      )}
    </aside>
  )
}
