import { useCallback, useEffect, useState } from 'react'
import { loadLocalWorkspace, saveLocalWorkspace } from '../services/localStorageService.js'

export function useLocalWorkspace() {
  const [workspace, setWorkspace] = useState(loadLocalWorkspace)

  useEffect(() => {
    saveLocalWorkspace(workspace)
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

  const updateNote = useCallback((index, valueOrUpdater) => {
    setWorkspace((current) => ({
      ...current,
      notes: current.notes.map((note, noteIndex) =>
        noteIndex === index
          ? typeof valueOrUpdater === 'function'
            ? valueOrUpdater(note)
            : valueOrUpdater
          : note,
      ),
    }))
  }, [])

  const setActiveNoteIndex = useCallback((activeNoteIndex) => {
    setWorkspace((current) => ({ ...current, activeNoteIndex }))
  }, [])

  return {
    ...workspace,
    setTemplates,
    updateNote,
    setActiveNoteIndex,
  }
}
