import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, Clock3, ExternalLink, FilePlus2, MapPin, Route } from 'lucide-react'
import { calculateZipDistance, formatDistanceEstimateForNote, googleMapsDirectionsUrl } from '../utils/distanceCheck.js'

// Designed to take a single compact line when collapsed in floating Mini.
// ZIP-only lookup: never upload or persist entered street-address text. Only the ZIP is queried.
export function QuickDistanceCheck({ compact = false, onAddToNote, noteName }) {
  const [expanded, setExpanded] = useState(!compact)
  const [caregiverArea, setCaregiverArea] = useState('')
  const [clientArea, setClientArea] = useState('')
  const [distance, setDistance] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [includeDistance, setIncludeDistance] = useState(false)
  const [includeEta, setIncludeEta] = useState(false)
  const [noteStatus, setNoteStatus] = useState('')
  const abortRef = useRef(null)

  useEffect(() => () => { abortRef.current?.abort() }, [])

  function updateArea(setter, value) {
    abortRef.current?.abort()
    setLoading(false)
    setError('')
    setDistance(null)
    setIncludeDistance(false)
    setIncludeEta(false)
    setNoteStatus('')
    setter(value)
  }

  async function check(event) {
    event.preventDefault()
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError('')
    setDistance(null)
    setIncludeDistance(false)
    setIncludeEta(false)
    setNoteStatus('')
    try {
      const result = await calculateZipDistance(caregiverArea, clientArea, {
        signal: controller.signal,
      })
      if (!controller.signal.aborted) setDistance(result)
    } catch (reason) {
      if (!controller.signal.aborted) {
        setError(reason?.message || 'Could not check these areas right now.')
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }

  const mapsUrl = distance
    ? googleMapsDirectionsUrl(distance.caregiver.zip, distance.client.zip)
    : ''
  const canIncludeTime = Boolean(distance?.moderateTrafficPlanning)
  const hasSelectedDetail = includeDistance || (includeEta && canIncludeTime)

  function addSelectedToNote() {
    if (!hasSelectedDetail || !onAddToNote || !distance) return
    const block = formatDistanceEstimateForNote(distance, includeDistance, includeEta && canIncludeTime)
    if (!block) return
    onAddToNote(block)
    setIncludeDistance(false)
    setIncludeEta(false)
    setNoteStatus('Selected distance details added to ' + (noteName || 'the active note') + '.')
  }

  return (
    <section className="distance-check" aria-label="Quick caregiver and client distance check">
      <button type="button" className="distance-check__toggle"
        aria-expanded={expanded} onClick={() => setExpanded(open => !open)}>
        <span className="distance-check__identity">
          <Route size={16} aria-hidden="true" />
          <strong>Quick Distance Check</strong>
          <small>Caregiver ↔ client ZIP areas</small>
        </span>
        <span className="distance-check__expand">
          {expanded ? 'Hide' : 'Expand'}
          {expanded ? <ChevronDown size={15} aria-hidden="true" /> :
            <ChevronRight size={15} aria-hidden="true" />}
        </span>
      </button>
      {expanded && (
        <div className="distance-check__content">
          <form className="distance-check__form" onSubmit={check}>
            <label>
              <span>Caregiver area</span>
              <input value={caregiverArea} onChange={event => updateArea(setCaregiverArea, event.target.value)}
                placeholder="City, ST 12345 or ZIP" aria-label="Caregiver city state and ZIP (ZIP only used)"
                maxLength={70} autoComplete="off" spellCheck="false" />
            </label>
            <label>
              <span>Client area</span>
              <input value={clientArea} onChange={event => updateArea(setClientArea, event.target.value)}
                placeholder="City, ST 12345 or ZIP" aria-label="Client city state and ZIP (ZIP only used)"
                maxLength={70} autoComplete="off" spellCheck="false" />
            </label>
            <button type="submit" className="distance-check__submit" disabled={loading}>
              <MapPin size={14} aria-hidden="true" />
              {loading ? 'Checking…' : 'Check distance'}
            </button>
          </form>

          {error && <p className="distance-check__error" role="alert">{error}</p>}
          {distance && (
            <div className="distance-check__result" role="status">
              <div>
                <strong>{distance.miles.toLocaleString('en-US')} miles</strong>
                <span>≈ {distance.kilometers.toLocaleString('en-US')} km · straight line between ZIP centers</span>
                <small>{distance.caregiver.city}, {distance.caregiver.state} {distance.caregiver.zip}
                  {' → '}{distance.client.city}, {distance.client.state} {distance.client.zip}</small>
                {distance.moderateTrafficPlanning ? (
                  <div className="distance-check__eta">
                    <Clock3 size={16} aria-hidden="true" />
                    <span className="distance-check__eta-copy">
                      <b>~{distance.moderateTrafficPlanning.minMinutes}–{distance.moderateTrafficPlanning.maxMinutes} min</b>
                      <small>Rough planning range · assumed moderate traffic, NOT live traffic</small>
                    </span>
                  </div>
                ) : (
                  <small>Drive-time range unavailable for nearby ZIP centers. Open Maps for a real route.</small>
                )}
              </div>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                aria-label="Open driving directions in Google Maps, new tab">
                Driving route <ExternalLink size={14} aria-hidden="true" />
              </a>
            </div>
          )}
          {distance && onAddToNote && (
            <div className="distance-check__note-inclusion">
              <fieldset className="distance-check__note-fields">
                <legend>Include in {noteName || 'current note'} (optional)</legend>
                <label>
                  <input type="checkbox" checked={includeDistance}
                    onChange={event => { setIncludeDistance(event.target.checked); setNoteStatus('') }} />
                  <span>Distance</span>
                </label>
                {canIncludeTime && (
                  <label>
                    <input type="checkbox" checked={includeEta}
                      onChange={event => { setIncludeEta(event.target.checked); setNoteStatus('') }} />
                    <span>Estimated time</span>
                  </label>
                )}
              </fieldset>
              <button type="button" className="distance-check__add-note"
                onClick={addSelectedToNote} disabled={!hasSelectedDetail}>
                <FilePlus2 size={14} aria-hidden="true" />
                Add checked to note
              </button>
              {noteStatus && <p className="distance-check__note-status" role="status">{noteStatus}</p>}
            </div>
          )}
          <p className="distance-check__hint">
            The mileage is ZIP-center straight-line distance, not a driving route.
            Any minutes shown are a broad, assumption-based planning range (not road-based or live traffic).
            Only ZIPs are used — street addresses are ignored. No location history is saved.
            Use Google Maps for accurate road distance and drive time.
          </p>
        </div>
      )}
    </section>
  )
}
