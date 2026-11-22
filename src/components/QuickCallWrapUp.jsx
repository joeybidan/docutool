import { useId, useState } from 'react'
import { ChevronDown, ChevronRight, Zap } from 'lucide-react'
import {
  CALLER_OPTIONS, ISSUE_OPTIONS, ACTION_OPTIONS, OUTCOME_OPTIONS,
  EMPTY_WRAP_UP, validateCallWrapUp,
} from '../utils/callWrapUp.js'

// Compact by default. Form drafts are temporary, per note tab and per open view.
export function QuickCallWrapUp({ activeIndex, onAdd, noteName }) {
  const id = useId()
  const [expanded, setExpanded] = useState(false)
  const [byNote, setByNote] = useState({})
  const [feedback, setFeedback] = useState('')
  const draft = byNote[activeIndex] || EMPTY_WRAP_UP
  const errors = validateCallWrapUp(draft)
  const ready = errors.length === 0

  function setField(key, value) {
    setByNote(current => ({
      ...current,
      [activeIndex]: { ...(current[activeIndex] || EMPTY_WRAP_UP), [key]: value },
    }))
    setFeedback('')
  }

  function addToNote(event) {
    event.preventDefault()
    if (!ready) { setFeedback(errors[0]); return }
    try {
      onAdd(draft)
      setByNote(current => ({ ...current, [activeIndex]: { ...EMPTY_WRAP_UP } }))
      setFeedback('Wrap-up added to ' + noteName + '.')
      setExpanded(false)
    } catch (error) {
      setFeedback(error?.message || 'Unable to add wrap-up. Your draft remains available.')
    }
  }

  return (
    <div className={'quick-wrapup' + (expanded ? ' quick-wrapup--open' : '')}>
      <button type="button" className="quick-wrapup__toggle" onClick={() => { setExpanded(!expanded); setFeedback('') }}
        aria-expanded={expanded} aria-controls={id + '-form'}>
        <span className="quick-wrapup__title">
          <Zap size={15} aria-hidden="true" />
          <strong>Quick Call Wrap-Up</strong>
          <small>Choose • Add to note</small>
        </span>
        {expanded ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
      </button>

      {expanded && (
        <form id={id + '-form'} className="quick-wrapup__form" onSubmit={addToNote}>
          <fieldset className="quick-wrapup__callers">
            <legend>Who called?</legend>
            <div className="quick-wrapup__choice-row">
              {CALLER_OPTIONS.map(option => (
                <label key={option.value} className={draft.caller === option.value ? 'is-selected' : ''}>
                  <input type="radio" name={id + '-caller'} value={option.value}
                    checked={draft.caller === option.value} onChange={() => setField('caller', option.value)} />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="quick-wrapup__fields">
            <label className="quick-wrapup__field">
              <span>Client / member full name <b aria-hidden="true">*</b></span>
              <input type="text" autoComplete="off" value={draft.fullName}
                onChange={e => setField('fullName', e.target.value)}
                placeholder="Name as provided" maxLength={120} required />
            </label>
            <label className="quick-wrapup__field">
              <span>Issue <b aria-hidden="true">*</b></span>
              <select value={draft.issue} onChange={e => setField('issue', e.target.value)} required>
                <option value="">Choose issue</option>
                {ISSUE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="quick-wrapup__field">
              <span>Action taken <b aria-hidden="true">*</b></span>
              <select value={draft.action} onChange={e => setField('action', e.target.value)} required>
                <option value="">Choose action</option>
                {ACTION_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>

          {(draft.issue === 'other' || draft.action === 'other') && (
            <div className="quick-wrapup__fields quick-wrapup__fields--other">
              {draft.issue === 'other' && (
                <label className="quick-wrapup__field">
                  <span>Describe issue <b aria-hidden="true">*</b></span>
                  <input type="text" maxLength={250} required value={draft.customIssue}
                    onChange={e => setField('customIssue', e.target.value)}
                    placeholder="What did the caller need?" />
                </label>
              )}
              {draft.action === 'other' && (
                <label className="quick-wrapup__field">
                  <span>Describe action <b aria-hidden="true">*</b></span>
                  <input type="text" maxLength={250} required value={draft.customAction}
                    onChange={e => setField('customAction', e.target.value)}
                    placeholder="What did you actually do?" />
                </label>
              )}
            </div>
          )}

          <fieldset className="quick-wrapup__outcomes">
            <legend>Outcome <b aria-hidden="true">*</b></legend>
            <div className="quick-wrapup__choice-row">
              {OUTCOME_OPTIONS.map(option => (
                <label key={option.value} className={draft.outcome === option.value ? 'is-selected' : ''}>
                  <input type="radio" name={id + '-outcome'} value={option.value}
                    checked={draft.outcome === option.value} onChange={() => setField('outcome', option.value)} />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="quick-wrapup__field quick-wrapup__details">
            <span>Additional details / next steps {draft.outcome === 'pending' ? '(required for pending)' : '(optional)'}</span>
            <textarea rows={2} value={draft.nextSteps} maxLength={900}
              required={draft.outcome === 'pending'}
              onChange={e => setField('nextSteps', e.target.value)}
              placeholder="Only factual details; include follow-up ownership or timing if known." />
          </label>

          <div className="quick-wrapup__bottom">
            <span>Appends text to {noteName}; existing notes are preserved.</span>
            <button type="button" className="quick-wrapup__cancel" onClick={() => setExpanded(false)}>
              Close
            </button>
            <button type="submit" className="quick-wrapup__add" disabled={!ready}>
              <Zap size={14} aria-hidden="true" /> Add to Note
            </button>
          </div>
        </form>
      )}
      {feedback && <p className="quick-wrapup__feedback" role="status">{feedback}</p>}
    </div>
  )
}
