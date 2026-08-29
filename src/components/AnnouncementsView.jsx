import { useEffect, useRef, useState } from 'react'

function formatAnnouncementDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(value),
  )
}

export function AnnouncementsView({ announcements }) {
  const scrollerRef = useRef(null)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const element = scrollerRef.current
    if (!element || isPaused || announcements.length < 2) return undefined

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion || element.scrollHeight <= element.clientHeight + 4) return undefined

    let frameId
    let previousTime = performance.now()
    let pauseUntil = 0

    const animate = (time) => {
      if (time >= pauseUntil) {
        const elapsedSeconds = Math.min((time - previousTime) / 1000, 0.1)
        element.scrollTop += 13 * elapsedSeconds

        if (element.scrollTop + element.clientHeight >= element.scrollHeight - 2) {
          pauseUntil = time + 1800
          element.scrollTop = 0
        }
      }
      previousTime = time
      frameId = requestAnimationFrame(animate)
    }

    frameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameId)
  }, [announcements, isPaused])

  return (
    <div
      ref={scrollerRef}
      className="announcement-scroller"
      onPointerEnter={() => setIsPaused(true)}
      onPointerLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false)
      }}
      tabIndex="0"
      aria-label="Manager announcements. Automatic scrolling pauses while this panel is focused."
    >
      {announcements.length ? (
        <div className="announcement-list">
          {announcements.map((announcement) => (
            <article className="announcement-item" key={announcement.id}>
              <div className="announcement-item__heading">
                <h3>{announcement.title}</h3>
                <time dateTime={announcement.publishedAt}>
                  {formatAnnouncementDate(announcement.publishedAt)}
                </time>
              </div>
              <p>{announcement.message}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-message">No announcements are published right now.</p>
      )}
    </div>
  )
}
