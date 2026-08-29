import { DEFAULT_TEMPLATES } from '../constants/defaults.js'

export const LOCAL_STORAGE_KEY = 'docutool:workspace:v1'
export const LOCAL_SCHEMA_VERSION = 1

const createDefaultState = () => ({
  templates: DEFAULT_TEMPLATES.map((template) => ({ ...template })),
  notes: ['', '', '', '', ''],
  activeNoteIndex: 0,
})

const normalizeTemplates = (templates) => {
  if (!Array.isArray(templates) || templates.length === 0) {
    return createDefaultState().templates
  }

  return templates
    .filter((template) => template && typeof template.text === 'string')
    .map((template, index) => ({
      id: typeof template.id === 'string' ? template.id : `custom-${index}-${Date.now()}`,
      text: template.text.trim(),
    }))
    .filter((template) => template.text)
}

const normalizeState = (data) => {
  const notes = Array.isArray(data?.notes)
    ? Array.from({ length: 5 }, (_, index) =>
        typeof data.notes[index] === 'string' ? data.notes[index] : '',
      )
    : createDefaultState().notes

  const activeNoteIndex = Number.isInteger(data?.activeNoteIndex)
    ? Math.min(4, Math.max(0, data.activeNoteIndex))
    : 0

  return {
    templates: normalizeTemplates(data?.templates),
    notes,
    activeNoteIndex,
  }
}

export function loadLocalWorkspace() {
  if (typeof window === 'undefined') return createDefaultState()

  try {
    const rawValue = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!rawValue) return createDefaultState()

    const parsed = JSON.parse(rawValue)
    if (parsed?.schemaVersion !== LOCAL_SCHEMA_VERSION) return createDefaultState()

    return normalizeState(parsed.data)
  } catch (error) {
    console.warn('DocuTool could not read local workspace data.', error)
    return createDefaultState()
  }
}

export function saveLocalWorkspace(data) {
  if (typeof window === 'undefined') return false

  try {
    window.localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: LOCAL_SCHEMA_VERSION,
        updatedAt: new Date().toISOString(),
        data: normalizeState(data),
      }),
    )
    return true
  } catch (error) {
    console.warn('DocuTool could not save local workspace data.', error)
    return false
  }
}

export function getDefaultTemplates() {
  return DEFAULT_TEMPLATES.map((template) => ({ ...template }))
}
