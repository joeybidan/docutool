import { lazy, Suspense, useState } from 'react'
import { Gamepad2 } from 'lucide-react'

const CareMatch = lazy(() => import('../carematch/CareMatch.jsx'))

export function CareMatchLauncher() {
  const [open, setOpen] = useState(false)
  return (
    <section className="panel" aria-label="CareMatch arcade">
      <div className="panel-heading"><h2><Gamepad2 size={18} aria-hidden="true" /> CareMatch Arcade</h2></div>
      <div style={{ padding: '0 16px 16px' }}>
        <p style={{ margin: '8px 0 12px', fontSize: '0.85rem' }}>Swipe, match, arrange care. Can you reach the Top 5?</p>
        <button className="button button--primary" onClick={() => setOpen(true)}>Play CareMatch</button>
        <p style={{ margin: '10px 0 0', fontSize: '0.75rem', color: '#64748b' }}>60 moves · Global all-time Top 5 · Silent play</p>
      </div>
      {open && <Suspense fallback={<p role="status" style={{ padding: 16 }}>Loading arcade…</p>}><CareMatch onClose={() => setOpen(false)} /></Suspense>}
    </section>
  )
}
