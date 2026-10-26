import { useCallback, useEffect, useState } from 'react'
import { loadLocalWorkspace, saveLocalWorkspace } from '../services/localStorageService.js'
import { textToHtml } from '../utils/richText.js'

export function useLocalWorkspace() {
  const [workspace, setWorkspace] = useState(loadLocalWorkspace)
  const [saveError, setSaveError] = useState(false)

  useEffect(() => {
    setSaveError(!saveLocalWorkspace(workspace))
  }, [workspace])

  const setTemplates = useCallback((templatesOrUpdater) => {
    setWorkspace((current) => ({
      ...current,
      templates:
        typeof templatesOrUpdater === 'function'
          ? templatesOrUpdater(current.templates)
          : templatesOrUpdater,
    }))
  }, [])

  const updateNote = useCallback((index, valueOrUpdater, html) => {
    setWorkspace((current) => {
      const oldText = current.notes[index]
      const value = typeof valueOrUpdater === 'function' ? valueOrUpdater(oldText) : valueOrUpdater
      // Appends keep existing colors; explicit text replacements reset formatting.
      const nextHtml = html ?? (typeof valueOrUpdater === 'function' && value.startsWith(oldText)
        ? current.noteHtml[index] + textToHtml(value.slice(oldText.length)) : textToHtml(value))
      return ({
      ...current,
      notes: current.notes.map((note, noteIndex) =>
        noteIndex === index
          ? value
          : note,
      ),
      noteHtml: current.noteHtml.map((item, i) => i === index ? nextHtml : item),
    })})
  }, [])

  const addNote = useCallback(() => {
    setWorkspace(current => ({ ...current, notes: [...current.notes, ''], noteHtml: [...current.noteHtml, ''],
      noteNames: [...current.noteNames, `Note ${current.notes.length + 1}`], activeNoteIndex: current.notes.length }))
  }, [])
  const renameNote = useCallback((index, name) => {
    if (!name.trim()) return
    setWorkspace(current => ({ ...current, noteNames: current.noteNames.map((old, i) => i === index ? name.trim() : old) }))
  }, [])

  const setActiveNoteIndex = useCallback((activeNoteIndex) => {
    setWorkspace((current) => ({ ...current, activeNoteIndex }))
  }, [])

  return {
    ...workspace,
    setTemplates,
    updateNote,
    setActiveNoteIndex,
    addNote,
    renameNote,
    saveError,
  }
}
