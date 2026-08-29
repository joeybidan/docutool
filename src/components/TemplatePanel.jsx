import { useState } from 'react'
import { CheckSquare2, Pencil } from 'lucide-react'
import { Button } from './ui/Button.jsx'
import { TemplateEditor } from './TemplateEditor.jsx'

export function TemplatePanel({ templates, selectedIds, onToggle, onTemplatesChange, onNotify }) {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <aside className="panel template-panel" aria-labelledby="template-heading">
      <div className="panel-heading">
        <div>
          <h2 id="template-heading">Note Templates</h2>
          {!isEditing && <p className="panel-subtitle">Select phrases to include in your note.</p>}
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
          <div className="template-list">
            {templates.map((template) => (
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
          <div className="panel-hint">
            <CheckSquare2 size={16} aria-hidden="true" />
            <span>Checked items are inserted in this order when you choose Generate.</span>
          </div>
        </>
      )}
    </aside>
  )
}
