import { useEffect, useRef, useState } from 'react'
import { newGame, applyAction, assignmentPoints, replay } from './engine.mjs'
import './carematch.css'

const SAVE_KEY = 'docutool:carematch:v1'
const NAME_KEY = 'docutool:carematch:name'
const read = key => { try { return localStorage.getItem(key) } catch { return null } }
const write = (key, value) => { try { localStorage.setItem(key, value) } catch { /* Storage is optional. */ } }
const format = value => value.toLocaleString('en-US')

function restore() {
  try {
    const saved = JSON.parse(read(SAVE_KEY))
    if (!saved || typeof saved.seed !== 'number') return null
    return { ...saved, state: replay(saved.seed, saved.actions) }
  } catch { return null }
}

async function api(body) {
  const response = await fetch('/api/carematch', { method: body ? 'POST' : 'GET', credentials: 'same-origin',
    cache: 'no-store', headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(12000) })
  let data
  try { data = await response.json() } catch { throw new Error('Rankings unavailable. You can play a practice round.') }
  if (!response.ok) throw new Error(data.error || 'Connection unavailable. Please retry.')
  return data
}

function Ranking({ rows }) {
  return <ol className="cm-ranking" aria-label="All-time Top 5">
    {Array.from({ length: 5 }, (_, i) => <li key={i} className={rows?.[i]?.isYou ? 'cm-you' : ''}>
      <span className="cm-rank">{String(i + 1).padStart(2, '0')}</span>
      <span className="cm-player">{rows?.[i]?.name || '—'}{rows?.[i]?.isYou && <small> YOU</small>}</span>
      <strong>{rows?.[i] ? format(rows[i].score) : '—'}</strong>
    </li>)}
  </ol>
}

export default function CareMatch() {
  const gameRef = useRef(null), touch = useRef(null), skipClick = useRef(false)
  const [round, setRound] = useState(restore)
  const [name, setName] = useState(() => read(NAME_KEY) || '')
  const [selectedMember, setSelectedMember] = useState(null)
  const [selectedTile, setSelectedTile] = useState(null)
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('')
  const [boards, setBoards] = useState(null), [boardError, setBoardError] = useState('')
  const state = round?.state || newGame(1024)
  const request = selectedMember !== null ? state.requests[selectedMember] : null
  const reward = selectedTile !== null && selectedMember !== null ? assignmentPoints(state, selectedMember, selectedTile) : null
  const active = Boolean(round && !busy && !state.ended && !round.submitted)

  async function refresh() {
    try { setBoards(await api()); setBoardError('') }
    catch { setBoardError('Rankings unavailable. Retry when connected.') }
  }
  useEffect(() => { refresh() }, [])
  useEffect(() => {
    if (round) { const { state: ignored, ...save } = round; write(SAVE_KEY, JSON.stringify(save)) }
  }, [round])

  function act(action) {
    if (!active) return
    const next = applyAction(round.state, action)
    if (next === round.state) return
    setRound({ ...round, state: next, actions: [...round.actions, action] })
    setSelectedMember(null); setSelectedTile(null); setNotice(''); setError('')
  }

  async function start(practice = false) {
    if (!/^[\p{L}\p{N} _.-]{1,12}$/u.test(name.trim())) { setError('Enter an alias of up to 12 characters.'); return }
    setBusy(true); setError(''); setNotice('')
    try {
      const issued = practice ? { seed: crypto.getRandomValues(new Uint32Array(1))[0] } : await api({ op: 'start', name })
      setRound({ ...issued, name: name.toUpperCase(), mode: practice ? 'practice' : 'ranked', actions: [], state: newGame(issued.seed), submitted: false })
      write(NAME_KEY, name.toUpperCase())
      setSelectedMember(null); setSelectedTile(null)
      setTimeout(() => gameRef.current?.focus(), 0)
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  async function submit() {
    setBusy(true); setError('')
    try {
      const result = await api({ op: 'submit', round: round.round, actions: round.actions })
      setBoards(result); setBoardError(''); setRound({ ...round, submitted: true })
      setNotice(result.placed ? 'HIGH SCORE! You made the Top 5.' : 'Score verified. This round did not enter the Top 5.')
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  function keyDown(event) {
    if (event.target.closest('input, textarea, select') || !active) return
    const direction = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[event.key]
    if (direction) { event.preventDefault(); act({ type: 'move', direction }) }
  }

  return <section className="panel cm-card" aria-label="CareMatch arcade" onKeyDown={keyDown} ref={gameRef} tabIndex={-1}>
    <header className="cm-header"><h2><span aria-hidden="true">♥</span> CARE<span>MATCH</span></h2>
      <div className="cm-score"><small>{round?.mode === 'practice' ? 'PRACTICE' : 'SCORE'}</small><strong>{format(state.score)}</strong></div></header>
    <div className="cm-body">
      <div className="cm-stats"><span><b>{60 - state.moves}</b> moves</span><span><b>{state.supported}</b> helped</span><span><b>{state.missed}/3</b> missed</span></div>
      {!round && <div className="cm-start"><p>Merge caregiver hours. Match members. Reach the Top 5.</p>
        <label htmlFor="cm-name">Arcade alias</label><div className="cm-start-row"><input id="cm-name" value={name} maxLength={12} autoComplete="off" spellCheck="false" placeholder="YOUR NAME" onChange={e => setName(e.target.value.toUpperCase().replace(/[^\p{L}\p{N} _.-]/gu, ''))} />
          <button className="cm-primary" disabled={busy} onClick={() => start()}>{busy ? 'WAIT…' : 'PLAY'}</button></div>
        <button className="cm-link" disabled={busy} onClick={() => start(true)}>Practice offline</button></div>}
      <h3 className="cm-caption">MEMBERS WAITING <span>SELECT A MEMBER, THEN HOURS</span></h3>
      <div className="cm-members">{state.requests.map((member, index) => <button key={index} disabled={!member || !active} onClick={() => { setSelectedMember(index); setSelectedTile(null) }}
        aria-pressed={selectedMember === index} className={`cm-member ${selectedMember === index ? 'is-selected' : ''} ${member?.left <= 3 ? 'is-urgent' : ''}`}>
        {member ? <><strong>{member.name}</strong><b>{member.hours}h</b><small>{member.left} moves</small></> : <><strong>✓</strong><small>All set</small></>}
      </button>)}</div>
      <div className="cm-board" role="group" aria-label="Caregiver hours board, four rows and four columns"
        onPointerDown={e => { skipClick.current = false; touch.current = { x: e.clientX, y: e.clientY } }}
        onPointerCancel={() => { touch.current = null }}
        onPointerUp={e => {
          if (!touch.current || !active) return
          const dx = e.clientX - touch.current.x, dy = e.clientY - touch.current.y; touch.current = null
          if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return
          skipClick.current = true
          act({ type: 'move', direction: Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up' })
        }}>
        {state.board.map((hours, i) => <button key={i} disabled={!active} onClick={() => {
          if (skipClick.current) { skipClick.current = false; return }
          if (request && hours >= request.hours) setSelectedTile(i)
        }} className={`cm-tile cm-tile-${hours} ${request && hours >= request.hours ? hours === request.hours ? 'is-fit' : 'is-oversize' : ''} ${selectedTile === i ? 'is-selected' : ''}`}
          aria-label={`Row ${Math.floor(i / 4) + 1}, column ${i % 4 + 1}: ${hours ? hours + ' hours' : 'empty'}${request && hours >= request.hours ? hours === request.hours ? ', perfect fit' : ', oversized coverage' : ''}`}>
          {hours || ''}</button>)}
      </div>
      {reward && active ? <button className="cm-primary cm-assign" onClick={() => act({ type: 'assign', member: selectedMember, tile: selectedTile })}>
        ASSIGN {request.name.toUpperCase()} · +{reward.total}{reward.exact ? ' PERFECT' : ''}</button>
        : <p className="cm-feedback" role="status" aria-live="polite">{round ? state.message : 'Swipe or tap arrows to merge equal hours.'}</p>}
      {active && <div className="cm-actions"><button className="cm-undo" disabled={state.undoUsed || !state.previous} onClick={() => act({ type: 'undo' })}>↶ Undo</button>
        <div className="cm-directions" aria-label="Move controls">{[['left', '←'], ['up', '↑'], ['down', '↓'], ['right', '→']].map(([direction, glyph]) => <button key={direction} aria-label={`Move ${direction}`} onClick={() => act({ type: 'move', direction })}>{glyph}</button>)}</div></div>}
      {active && state.moves >= 60 && <button className="cm-link" onClick={() => act({ type: 'finish' })}>Finish shift</button>}
      {state.ended && round && <div className="cm-results"><strong>SHIFT COMPLETE · {state.supported} HELPED</strong><small>{state.reason} · {state.exact} exact matches</small>
        {round.mode === 'ranked' && !round.submitted && <button className="cm-primary" disabled={busy} onClick={submit}>{busy ? 'VERIFYING…' : 'SUBMIT SCORE'}</button>}
        <button className="cm-link" disabled={busy} onClick={() => start(round.mode === 'practice')}>Play again</button>
      </div>}
      {notice && <p className="cm-success" role="status">{notice}</p>}{error && <p className="cm-error" role="alert">{error}</p>}
      <details className="cm-help"><summary>How to play</summary><p>Swipe or use arrows to merge equal hours. Select a member, tap enough hours, then assign. Exact and early matches earn extra points. Three missed requests end the shift; you get 60 moves.</p></details>
      <div className="cm-ranking-heading"><h3>ALL-TIME TOP 5</h3><button className="cm-link" onClick={refresh}>↻ Refresh</button></div>
      <Ranking rows={boards?.allTime} />
      {boardError && <p className="cm-error" role="status">{boardError}</p>}
    </div>
  </section>
}
