import { textToHtml } from '../utils/richText.js'
import { DEFAULT_TEMPLATES, TEMPLATE_GROUPS } from '../constants/defaults.js'

export const LOCAL_STORAGE_KEY = 'docutool:workspace:v3'
const LEGACY_KEY = 'docutool:workspace:v1'
export const LOCAL_SCHEMA_VERSION = 3

const GROUP_IDS = new Set(TEMPLATE_GROUPS.map((group) => group.id))

const createDefaultState = () => ({
  templates: DEFAULT_TEMPLATES.map((template) => ({ ...template })),
  notes: ['', '', '', '', ''],
  noteNames: ['Note 1', 'Note 2', 'Note 3', 'Note 4', 'Note 5'],
  noteHtml: ['', '', '', '', ''],
  activeNoteIndex: 0,
})

function inferTemplateGroup(text = '') {
  const value = text.toLowerCase()
  if (/timesheet|clock in|clock out/.test(value)) return 'timesheets'
  if (/shift|schedule/.test(value)) return 'shifts'
  if (/transfer|transferred|uhc|recruitment|payment operations|care advisor/.test(value)) return 'transfer'
  if (/escalat|supervisor|leader/.test(value)) return 'escalation'
  if (/follow.?up|call.?back|callback|pending/.test(value)) return 'follow-up'
  return 'general-questions'
}

const normalizeTemplates = (templates) => {
  if (!Array.isArray(templates) || templates.length === 0) {
    return createDefaultState().templates
  }

  return templates
    .filter((template) => template && typeof template.text === 'string')
    .map((template, index) => ({
      id: typeof template.id === 'string' ? template.id : `custom-${index}-${Date.now()}`,
      text: template.text.trim(),
      group: GROUP_IDS.has(template.group) ? template.group : inferTemplateGroup(template.text),
    }))
    .filter((template) => template.text)
}

const normalizeNotes = (data) =>
  Array.isArray(data?.notes)
    ? Array.from({ length: Math.max(1, data.notes.length) }, (_, index) =>
        typeof data.notes[index] === 'string' ? data.notes[index] : '',
      )
    : createDefaultState().notes

const normalizeState = (data) => {
  const activeNoteIndex = Number.isInteger(data?.activeNoteIndex)
    ? Math.min(normalizeNotes(data).length - 1, Math.max(0, data.activeNoteIndex))
    : 0

  return {
    templates: normalizeTemplates(data?.templates),
    notes: normalizeNotes(data),
    noteNames: normalizeNotes(data).map((_, i) => typeof data?.noteNames?.[i] === 'string' && data.noteNames[i].trim() ? data.noteNames[i] : `Note ${i + 1}`),
    noteHtml: normalizeNotes(data).map((text, i) => typeof data?.noteHtml?.[i] === 'string' ? data.noteHtml[i] : textToHtml(text)),
    activeNoteIndex,
  }
}

function migrateVersionOne(data) {
  const oldTemplates = Array.isArray(data?.templates) ? data.templates : []
  const looksLikeUntouchedLegacyDefaults =
    oldTemplates.length > 0 &&
    oldTemplates.length <= 11 &&
    oldTemplates.every((template) => typeof template?.id === 'string' && template.id.startsWith('default-'))

  return {
    templates: looksLikeUntouchedLegacyDefaults
      ? DEFAULT_TEMPLATES.map((template) => ({ ...template }))
      : normalizeTemplates(oldTemplates),
    notes: normalizeNotes(data),
    activeNoteIndex: Number.isInteger(data?.activeNoteIndex)
      ? Math.min(4, Math.max(0, data.activeNoteIndex))
      : 0,
  }
}

export function loadLocalWorkspace() {
  if (typeof window === 'undefined') return createDefaultState()

  try {
    const rawValue = window.localStorage.getItem(LOCAL_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_KEY)
    if (!rawValue) return createDefaultState()

    let parsed
    try { parsed = JSON.parse(rawValue) } catch (error) {
      window.localStorage.setItem(`docutool:recovery:${Date.now()}`, rawValue)
      throw error
    }

    if (parsed?.schemaVersion === 1) {
      return normalizeState(migrateVersionOne(parsed.data))
    }

    if (![2, LOCAL_SCHEMA_VERSION].includes(parsed?.schemaVersion)) {
      window.localStorage.setItem(`docutool:recovery:${Date.now()}`, rawValue)
      return createDefaultState()
    }

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
