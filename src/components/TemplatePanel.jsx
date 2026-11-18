import { useMemo, useState } from 'react'
import { CheckSquare2, ChevronDown, ChevronRight, Pencil } from 'lucide-react'
import { TEMPLATE_GROUPS } from '../constants/defaults.js'
import { Button } from './ui/Button.jsx'
import { TemplateEditor } from './TemplateEditor.jsx'

export function TemplatePanel({ templates, selectedIds, onToggle, onTemplatesChange, onNotify }) {
  const [isEditing, setIsEditing] = useState(false)
  // Open the first workflow only; each group can be expanded independently.
  // Collapsing hides phrases without modifying any checked selections.
  const [expandedGroups, setExpandedGroups] = useState(() => new Set(['general-questions']))
  const toggleGroup = (groupId) => setExpandedGroups((current) => {
    const updated = new Set(current)
    if (updated.has(groupId)) updated.delete(groupId)
    else updated.add(groupId)
    return updated
  })
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
            {groupedTemplates.map((group) => {
              const expanded = expandedGroups.has(group.id)
              const checkedCount = group.templates.filter((template) => selectedIds.has(template.id)).length
              return (
                <section className="template-group" key={group.id} aria-labelledby={`template-group-${group.id}`}>
                  <h3 id={`template-group-${group.id}`} className="template-group__heading">
                    <button
                      type="button"
                      className="template-group__toggle"
                      aria-expanded={expanded}
                      aria-controls={`template-group-phrases-${group.id}`}
                      onClick={() => toggleGroup(group.id)}
                    >
                      {expanded ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
                      <span>{group.label}</span>
                      {checkedCount > 0 && <span className="template-group__selected">{checkedCount} selected</span>}
                      <span className="template-group__count">{group.templates.length}</span>
                    </button>
                  </h3>
                  <div id={`template-group-phrases-${group.id}`} className="template-group__options" hidden={!expanded}>
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
              )
            })}
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
