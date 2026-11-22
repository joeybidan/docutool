import test from 'node:test'
import assert from 'node:assert/strict'
import { FAVORITE_LIMIT, normalizeFavoriteIds, toggleFavoriteId, deleteWorkspaceNote } from '../src/utils/workspaceActions.js'
import {
  LOCAL_STORAGE_KEY, LOCAL_SCHEMA_VERSION, parseStoredWorkspace,
  loadLocalWorkspace, saveLocalWorkspace,
} from '../src/services/localStorageService.js'

const templates = Array.from({ length: 7 }, (_, i) => ({
  id: 'phrase-' + (i + 1), group: 'timesheets', text: 'Phrase ' + (i + 1),
}))

test('favorites accept five unique existing templates, never more', () => {
  assert.equal(FAVORITE_LIMIT, 5)
  let ids = []
  for (const template of templates) ids = toggleFavoriteId(ids, template.id, templates)
  assert.deepEqual(ids, templates.slice(0, 5).map(template => template.id))
  assert.equal(toggleFavoriteId(ids, 'missing-id', templates).length, 5)
  assert.deepEqual(toggleFavoriteId(ids, 'phrase-2', templates), ['phrase-1','phrase-3','phrase-4','phrase-5'])
})
test('favorites retain order and remove invalid, duplicate or deleted IDs', () => {
  assert.deepEqual(normalizeFavoriteIds(['phrase-3','phrase-3','deleted','phrase-1'], templates), ['phrase-3','phrase-1'])
  assert.deepEqual(normalizeFavoriteIds(['phrase-3','phrase-1'], templates.slice(0,2)), ['phrase-1'])
})

function workspace() {
  return {
    templates,
    favoriteTemplateIds: ['phrase-2','phrase-1'],
    notes: ['Note alpha','Note beta','Note gamma'],
    noteHtml: ['<b>Note alpha</b>','<i>Note beta</i>','<u>Note gamma</u>'],
    noteNames: ['Start','Middle','End'],
    activeNoteIndex: 1,
  }
}
test('deleting middle active note keeps plain text, HTML and tab names aligned', () => {
  const next = deleteWorkspaceNote(workspace(), 1)
  assert.deepEqual(next.notes, ['Note alpha','Note gamma'])
  assert.deepEqual(next.noteHtml, ['<b>Note alpha</b>','<u>Note gamma</u>'])
  assert.deepEqual(next.noteNames, ['Start','End'])
  assert.equal(next.activeNoteIndex, 1)
  assert.deepEqual(next.favoriteTemplateIds, ['phrase-2','phrase-1'])
})
test('deleting a preceding tab shifts active selection, not its note', () => {
  assert.equal(deleteWorkspaceNote(workspace(), 0).activeNoteIndex, 0)
  assert.equal(deleteWorkspaceNote({...workspace(),activeNoteIndex:2}, 0).activeNoteIndex, 1)
  assert.equal(deleteWorkspaceNote({...workspace(),activeNoteIndex:2}, 2).activeNoteIndex, 1)
})
test('deletion retains at least one note and rejects invalid indices', () => {
  const single = {...workspace(),notes:['Only'],noteHtml:['Only'],noteNames:['Only'],activeNoteIndex:0}
  assert.equal(deleteWorkspaceNote(single, 0),single)
  assert.equal(deleteWorkspaceNote(workspace(), -1).notes.length,3)
  assert.equal(deleteWorkspaceNote(workspace(), 8).notes.length,3)
})
test('favorites are backward compatible with existing v3 storage', () => {
  const original = workspace()
  const stored = parseStoredWorkspace(JSON.stringify({schemaVersion: LOCAL_SCHEMA_VERSION, data: original}))
  assert.deepEqual(stored.favoriteTemplateIds, original.favoriteTemplateIds)
  assert.deepEqual(stored.notes, original.notes)
  const old = parseStoredWorkspace(JSON.stringify({
    schemaVersion: LOCAL_SCHEMA_VERSION, data: { ...original, favoriteTemplateIds: undefined },
  }))
  assert.deepEqual(old.favoriteTemplateIds, [])
})
test('saving and loading preserve existing rich HTML and favorites', () => {
  const saved = new Map()
  const previous = globalThis.window
  globalThis.window = { localStorage: {
    getItem(key) { return saved.get(key) || null },
    setItem(key, value) { saved.set(key, value) },
  } }
  try {
    assert.equal(saveLocalWorkspace(workspace()), true)
    assert.equal(JSON.parse(saved.get(LOCAL_STORAGE_KEY)).schemaVersion, 3)
    const restored = loadLocalWorkspace()
    assert.deepEqual(restored.notes, workspace().notes)
    assert.deepEqual(restored.noteHtml, workspace().noteHtml)
    assert.deepEqual(restored.favoriteTemplateIds, workspace().favoriteTemplateIds)
  } finally {
    if (previous === undefined) delete globalThis.window
    else globalThis.window = previous
  }
})
