function formatAnnouncementDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(value),
  )
}

export function AnnouncementsView({ announcements }) {
  const scrollDuration = `${Math.max(80, announcements.length * 24)}s`

  return (
    <div
      className="announcement-scroller"
      tabIndex="0"
      aria-label="Manager announcements. Automatic scrolling pauses while this panel is focused."
    >
      {announcements.length ? (
        <div className="announcement-list" style={{ '--announcement-scroll-duration': scrollDuration }}>
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

