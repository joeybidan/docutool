import { useCallback, useEffect, useRef, useState } from 'react'
import {
  LOCAL_STORAGE_KEY,
  loadLocalWorkspace,
  parseStoredWorkspace,
  saveLocalWorkspace,
} from '../services/localStorageService.js'
import { textToHtml } from '../utils/richText.js'

export function useLocalWorkspace() {
  const [workspace, setWorkspace] = useState(loadLocalWorkspace)
  const [saveError, setSaveError] = useState(false)
  const lastRemoteSnapshot = useRef(null)

  useEffect(() => {
    // Do not write an incoming update back to localStorage and cause an echo loop.
    if (lastRemoteSnapshot.current === JSON.stringify(workspace)) {
      lastRemoteSnapshot.current = null
      setSaveError(false)
      return
    }
    setSaveError(!saveLocalWorkspace(workspace))
  }, [workspace])

  useEffect(() => {
    function onRemoteWorkspace(event) {
      if (event.key !== LOCAL_STORAGE_KEY || !event.newValue) return
      const incoming = parseStoredWorkspace(event.newValue)
      if (!incoming) return
      const snapshot = JSON.stringify(incoming)
      setWorkspace(current => {
        if (JSON.stringify(current) === snapshot) return current
        lastRemoteSnapshot.current = snapshot
        return incoming
      })
    }
    window.addEventListener('storage', onRemoteWorkspace)
    return () => window.removeEventListener('storage', onRemoteWorkspace)
  }, [])

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
