import { lazy, Suspense } from 'react'

const CareMatch = lazy(() => import('../carematch/CareMatch.jsx'))

export function CareMatchLauncher() {
  return <Suspense fallback={<section className="panel" aria-label="CareMatch arcade" style={{ padding: 16 }}>Loading CareMatch…</section>}><CareMatch /></Suspense>
}
