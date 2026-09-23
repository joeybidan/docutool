import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { newGame, applyAction, assignmentPoints, replay } from './engine.mjs'
import './carematch.css'

const SAVE_KEY = 'docutool:carematch:v1'
const NAME_KEY = 'docutool:carematch:name'
const read = key => { try { return localStorage.getItem(key) } catch { return null } }
const write = (key, value) => { try { localStorage.setItem(key, value) } catch { /* Session still works without storage. */ } }
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
  try { data = await response.json() } catch { throw new Error('Global rankings are unavailable. You can play a practice round.') }
  if (!response.ok) throw new Error(data.error || 'Connection unavailable. Please retry.')
  return data
}

function Ranking({ title, rows }) {
  return <section className="cm-ranking" aria-label={title}>
    <h3>{title}</h3>
    <div className="cm-ranking-head"><span>RANK / PLAYER</span><span>SCORE</span></div>
    <ol>{Array.from({ length: 5 }, (_, i) => <li key={i} className={rows?.[i]?.isYou ? 'cm-you' : ''}>
      <span className="cm-rank">{String(i + 1).padStart(2, '0')}</span>
      <span className="cm-player">{rows?.[i]?.name || '—'}{rows?.[i]?.isYou && <small> YOU</small>}</span>
      <strong>{rows?.[i] ? format(rows[i].score) : '—'}</strong>
    </li>)}</ol>
  </section>
}

export default function CareMatch({ onClose }) {
  const dialog = useRef(null), gameRef = useRef(null), touch = useRef(null), skipClick = useRef(false)
  const [round, setRound] = useState(restore)
  const [name, setName] = useState(() => read(NAME_KEY) || '')
  const [selectedMember, setSelectedMember] = useState(null)
  const [selectedTile, setSelectedTile] = useState(null)
  const [paused, setPaused] = useState(false), [help, setHelp] = useState(false)
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('')
  const [boards, setBoards] = useState(null), [boardError, setBoardError] = useState('')
  const state = round?.state || newGame(1024)
  const request = selectedMember !== null ? state.requests[selectedMember] : null
  const reward = selectedTile !== null && selectedMember !== null ? assignmentPoints(state, selectedMember, selectedTile) : null
  const active = Boolean(round && !paused && !busy && !state.ended && !help)

  async function refresh() {
    try { setBoards(await api()); setBoardError('') }
    catch { setBoardError('Global rankings unavailable. Retry when connected.') }
  }
  useEffect(() => {
    dialog.current.showModal()
    const before = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    refresh()
    return () => { document.body.style.overflow = before }
  }, [])
  useEffect(() => {
    if (round) { const { state: ignored, ...save } = round; write(SAVE_KEY, JSON.stringify(save)) }
  }, [round])
  useEffect(() => {
    const pause = () => { if (document.hidden) setPaused(true) }
    document.addEventListener('visibilitychange', pause)
    return () => document.removeEventListener('visibilitychange', pause)
  }, [])

  function act(action) {
    if (!round || busy || paused || help || round.submitted) return
    const next = applyAction(round.state, action)
    if (next === round.state) return
    setRound({ ...round, state: next, actions: [...round.actions, action] })
    setSelectedMember(null); setSelectedTile(null); setNotice(''); setError('')
  }

  async function start(practice = false) {
    if (!/^[\p{L}\p{N} _.-]{1,12}$/u.test(name.trim())) { setError('Enter a short alias of up to 12 characters.'); return }
    if (round && !round.state.ended && !window.confirm('Start a new shift? Your current round will be replaced.')) return
    setBusy(true); setError(''); setNotice('')
    try {
      const issued = practice ? { seed: crypto.getRandomValues(new Uint32Array(1))[0] } : await api({ op: 'start', name })
      setRound({ ...issued, name: name.toUpperCase(), mode: practice ? 'practice' : 'ranked', actions: [], state: newGame(issued.seed), submitted: false })
      write(NAME_KEY, name.toUpperCase())
      setSelectedMember(null); setSelectedTile(null); setPaused(false); setHelp(false)
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

  return createPortal(<dialog className="cm-dialog" ref={dialog} aria-labelledby="cm-title" onCancel={event => { event.preventDefault(); onClose() }} onKeyDown={keyDown}>
    <div className="cm-shell">
      <header className="cm-header"><div><span className="cm-eyebrow">DOCUTOOL / POCKET ARCADE</span><h2 id="cm-title"><span aria-hidden="true">♥</span> CARE<span>MATCH</span></h2></div>
        <button className="cm-icon" onClick={onClose} aria-label="Close CareMatch and save round">✕</button></header>
      <div className="cm-layout">
        <main className="cm-game" ref={gameRef} tabIndex={-1}>
          <div className="cm-scorebar"><div><span className="cm-label">{round?.mode === 'practice' ? 'PRACTICE SCORE' : 'SCORE'}</span><strong>{format(state.score).padStart(5, '0')}</strong></div>
            <span className="cm-shift">SWIPE. MATCH.<br /><em>CARE.</em></span></div>
          <div className="cm-stats"><span><b>{60 - state.moves}</b> MOVES</span><span><b>{state.supported}</b> SUPPORTED</span><span><b className={state.missed ? 'cm-warning' : ''}>{state.missed}/3</b> MISSED</span></div>
          <div className="cm-section-label">MEMBERS WAITING <span>{state.moves >= 60 ? 'FINAL ASSIGNMENTS' : 'TAP TO SELECT'}</span></div>
          <div className="cm-members">{state.requests.map((member, index) => <button key={index} disabled={!member || !active} onClick={() => { setSelectedMember(index); setSelectedTile(null) }}
            aria-pressed={selectedMember === index} className={`cm-member ${selectedMember === index ? 'is-selected' : ''} ${member?.left <= 3 ? 'is-urgent' : ''}`}>
            {member ? <><span className="cm-avatar" aria-hidden="true">{member.name.slice(0, 1)}</span><strong>{member.name}</strong><b>{member.hours}h needed</b><small>{member.left} moves left</small></> : <><strong>ALL SET</strong><small>Care arranged</small></>}
          </button>)}</div>
          <div className="cm-board-wrap">
            <div className="cm-board" role="group" aria-label="Caregiver coverage board, four rows and four columns"
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
                {hours > 0 && <><strong>{hours}</strong><small>HOURS</small>{selectedTile === i && <span className="cm-fit-label">{reward?.exact ? 'PERFECT FIT' : 'EXTRA HOURS'}</span>}</>}
              </button>)}
            </div>
            {(!round || paused || help) && <div className="cm-overlay">{help ? <>
              <h3>HOW TO PLAY</h3><p>Swipe or use arrow keys. Equal tiles merge: 2 → 4 → 8 → 16.</p><p>Select a member, then a sufficient tile. Exact matches earn +100; early matches earn +50. Every third placement adds a streak bonus.</p><p>Only valid swipes use a move. Three missed requests end your shift. After 60 moves, make your final assignments.</p><button className="cm-primary" onClick={() => setHelp(false)}>GOT IT</button>
            </> : paused ? <><h3>SHIFT PAUSED</h3><p>Your board is saved.</p><button className="cm-primary" onClick={() => setPaused(false)}>RESUME</button></> : <>
              <span className="cm-large-heart" aria-hidden="true">♥</span><h3>SMALL MOVES.<br />BIG CARE.</h3><p>Merge coverage. Support members.<br />Make the Top 5.</p>
              <label className="cm-name-label" htmlFor="cm-name">YOUR ARCADE NAME</label><input id="cm-name" value={name} maxLength={12} autoComplete="off" spellCheck="false" placeholder="E.G. JOEY" onChange={e => setName(e.target.value.toUpperCase().replace(/[^\p{L}\p{N} _.-]/gu, ''))} />
              <button className="cm-primary" disabled={busy} onClick={() => start()}>{busy ? 'CONNECTING…' : 'START RANKED SHIFT'}</button>
              <button className="cm-text" disabled={busy} onClick={() => start(true)}>PRACTICE OFFLINE</button>
            </>}</div>}
          </div>
          <div className="cm-feedback" role="status" aria-live="polite">{round ? state.message : '60 moves. One great shift.'}</div>
          {reward && active ? <div className="cm-assignment"><p>{reward.exact ? 'Perfect match' : `Uses ${state.board[selectedTile]}h for ${request.hours}h`} +{reward.base}{reward.streak > 0 ? ` · Streak +${reward.streak}` : ''}</p>
            <button className="cm-primary" onClick={() => act({ type: 'assign', member: selectedMember, tile: selectedTile })}>ASSIGN TO {request.name.toUpperCase()} · +{reward.total}</button></div>
            : <div className="cm-streak"><span aria-hidden="true">{[0, 1, 2].map(i => <i key={i} className={i < state.streak % 3 ? 'filled' : ''} />)}</span><span>{3 - state.streak % 3} more for <b>+{(Math.floor(state.streak / 3) + 1) * 150}</b></span></div>}
          {state.ended && round && <section className="cm-results" aria-label="Shift results"><h3>{state.supported} MEMBERS SUPPORTED!</h3><p>{state.reason} · {state.exact} exact matches</p>
            {round.mode === 'ranked' && !round.submitted && <button className="cm-primary" disabled={busy} onClick={submit}>{busy ? 'VERIFYING…' : 'SUBMIT HIGH SCORE'}</button>}
            {round.mode === 'practice' && <p>Practice round · not entered in global rankings.</p>}
            <button className="cm-secondary" disabled={busy} onClick={() => start(round.mode === 'practice')}>PLAY AGAIN</button>
          </section>}
          {notice && <p className="cm-success" role="status">{notice}</p>}{error && <p className="cm-error" role="alert">{error}</p>}
          <div className="cm-controls"><button disabled={!round || round.state.undoUsed || !round.state.previous || busy || paused || round.submitted} onClick={() => act({ type: 'undo' })}>↶ UNDO {state.undoUsed ? '0' : '1'}</button>
            <button disabled={!round || state.ended} onClick={() => setPaused(!paused)}>{paused ? 'RESUME' : 'PAUSE'}</button><button onClick={() => setHelp(!help)}>HELP</button></div>
          {active && <div className="cm-directions" aria-label="Move controls">{[['left', '←'], ['up', '↑'], ['down', '↓'], ['right', '→']].map(([direction, glyph]) => <button key={direction} aria-label={`Move ${direction}`} onClick={() => act({ type: 'move', direction })}>{glyph}</button>)}</div>}
          {round && !state.ended && state.moves >= 60 && <button className="cm-secondary" onClick={() => act({ type: 'finish' })}>FINISH SHIFT</button>}
        </main>
        <aside className="cm-leaderboards"><span className="cm-eyebrow">THE HALL OF CARE</span><h2>HIGH SCORES</h2><p className="cm-ranking-intro">Five spots. Make yours count.</p>
          <Ranking title="ALL-TIME TOP 5" rows={boards?.allTime} />
          <p className="cm-ranking-note">Top 5 scorers are visible to everyone.<br />Only your best qualifying score appears.<br />Ties favor the earlier-started round.</p>
          {boardError && <p className="cm-error" role="status">{boardError}</p>}
          <button className="cm-text" onClick={refresh}>↻ REFRESH RANKINGS</button>
          <div className="cm-arcade-note"><span aria-hidden="true">✦</span><p>EVERY MATCH<br /><b>MAKES ROOM FOR CARE.</b></p></div>
        </aside>
      </div>
      <footer className="cm-footer">NO COINS NEEDED <span>♥</span> JUST GOOD MATCHES</footer>
    </div>
  </dialog>, document.body)
}
