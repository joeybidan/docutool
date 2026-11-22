// Phase 4 helpers. Favorites and note tabs stay local to the browser.
export const FAVORITE_LIMIT = 5

export function normalizeFavoriteIds(ids, templates) {
  const allowed = new Set((templates || []).map(template => template.id))
  const result = []
  for (const id of Array.isArray(ids) ? ids : []) {
    if (typeof id === 'string' && allowed.has(id) && !result.includes(id)) result.push(id)
    if (result.length >= FAVORITE_LIMIT) break
  }
  return result
}

export function toggleFavoriteId(ids, id, templates) {
  const current = normalizeFavoriteIds(ids, templates)
  if (!(templates || []).some(template => template.id === id)) return current
  if (current.includes(id)) return current.filter(item => item !== id)
  if (current.length >= FAVORITE_LIMIT) return current
  return [...current, id]
}

export function deleteWorkspaceNote(workspace, index) {
  const notes = workspace?.notes
  if (!Array.isArray(notes) || notes.length <= 1 ||
    !Number.isInteger(index) || index < 0 || index >= notes.length) return workspace
  const remaining = notes.length - 1
  const active = workspace.activeNoteIndex
  const activeNoteIndex = active > index ? active - 1 :
    active === index ? Math.min(index, remaining - 1) : active
  return {
    ...workspace,
    notes: notes.filter((_, i) => i !== index),
    noteHtml: workspace.noteHtml.filter((_, i) => i !== index),
    noteNames: workspace.noteNames.filter((_, i) => i !== index),
    activeNoteIndex: Math.max(0, Math.min(remaining - 1, activeNoteIndex)),
  }
}
