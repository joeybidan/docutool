import { useCallback, useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import {
  deleteAnonymousSuggestion,
  loadAdminSuggestions,
} from '../../services/suggestionsService.js'

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function SuggestionsManager({ onNotify }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await loadAdminSuggestions())
    } catch (error) {
      onNotify(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [onNotify])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this anonymous suggestion for all users?')) return
    try {
      await deleteAnonymousSuggestion(item.id)
      await refresh()
      onNotify('Suggestion deleted globally.')
    } catch (error) {
      onNotify(error.message, 'error')
    }
  }

  return (
    <div className="admin-manager">
      <div className="admin-manager__toolbar">
        <div>
          <h3>Anonymous Suggestions</h3>
          <p className="panel-subtitle">Suggestions are public immediately. Delete anything inappropriate or containing private information.</p>
        </div>
      </div>

      {loading ? (
        <p className="empty-message">Loading suggestions…</p>
      ) : items.length ? (
        <div className="admin-list suggestions-admin-list">
          {items.map((item) => (
            <div className="admin-list-row suggestions-admin-row" key={item.id}>
              <div>
                <strong>{formatDate(item.createdAt)}</strong>
                <span>{item.message}</span>
              </div>
              <div className="admin-list-row__actions">
                <button
                  type="button"
                  className="icon-button icon-button--danger"
                  onClick={() => handleDelete(item)}
                  aria-label="Delete anonymous suggestion"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-message">No anonymous suggestions yet.</p>
      )}
    </div>
  )
}
