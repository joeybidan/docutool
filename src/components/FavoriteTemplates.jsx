import { useState } from 'react'
import { ChevronDown, ChevronRight, Star } from 'lucide-react'

export function FavoriteTemplates({ templates, favoriteTemplateIds, onInsert, noteName }) {
  const [expanded, setExpanded] = useState(true)
  const favorites = favoriteTemplateIds
    .map(id => templates.find(template => template.id === id))
    .filter(Boolean)

  return (
    <section className="favorite-templates" aria-label="Five favorite note templates">
      <button type="button" className="favorite-templates__toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded(current => !current)}>
        <span className="favorite-templates__title">
          <Star size={15} fill={favorites.length ? 'currentColor' : 'none'} aria-hidden="true" />
          <strong>Favorite 5</strong>
          <small>{favorites.length}/5</small>
        </span>
        <span className="favorite-templates__hint">
          {expanded ? 'Tap a phrase to add it' : 'Expand favorites'}
          {expanded ? <ChevronDown size={15} aria-hidden="true" /> : <ChevronRight size={15} aria-hidden="true" />}
        </span>
      </button>
      {expanded && (
        <div className="favorite-templates__content">
          {favorites.length ? (
            <div className="favorite-templates__chips">
              {favorites.map((template, index) => (
                <button type="button" key={template.id}
                  title={'Add to ' + noteName + ': ' + template.text}
                  aria-label={'Add favorite ' + (index + 1) + ' to ' + noteName + ': ' + template.text}
                  onClick={() => onInsert(template)}>
                  <span className="favorite-templates__number">{index + 1}</span>
                  <span className="favorite-templates__text">{template.text}</span>
                </button>
              ))}
            </div>
          ) : <p>Open <strong>Note Templates</strong> and tap ☆ beside up to five phrases. They stay saved in this browser.</p>}
        </div>
      )}
    </section>
  )
}
