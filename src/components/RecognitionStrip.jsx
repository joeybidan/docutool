import { useEffect, useState } from 'react'
import { Award, Images, X } from 'lucide-react'

function ImageViewer({ src, alt, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="image-viewer-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <button
        type="button"
        className="image-viewer-close"
        onClick={onClose}
        aria-label="Close image viewer"
      >
        <X size={22} />
      </button>
      <img src={src} alt={alt} />
    </div>
  )
}

function RecognitionImage({ item, onOpen, isClone = false }) {
  const [failed, setFailed] = useState(false)
  const initials = item.employeeName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)

  if (failed || !item.imageUrl) {
    return <span className="recognition-placeholder" aria-hidden="true">{initials}</span>
  }

  return (
    <button
      type="button"
      className="recognition-image-button"
      onClick={onOpen}
      title={`Click to enlarge ${item.employeeName}'s recognition photo`}
      aria-label={`Open larger recognition photo for ${item.employeeName}`}
      tabIndex={isClone ? -1 : 0}
    >
      <img
        src={item.imageUrl}
        alt={isClone ? '' : `${item.employeeName}, ${item.category}`}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </button>
  )
}

function GalleryImage({ item, onOpen, isClone = false }) {
  const [failed, setFailed] = useState(false)
  if (failed || !item.imageUrl) return <span className="recognition-placeholder" aria-hidden="true">IMG</span>

  const label = item.title || item.caption || 'Shared photo'
  return (
    <button
      type="button"
      className="recognition-image-button"
      onClick={onOpen}
      title={`Click to enlarge ${label}`}
      aria-label={`Open larger photo: ${label}`}
      tabIndex={isClone ? -1 : 0}
    >
      <img
        src={item.imageUrl}
        alt={isClone ? '' : label}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </button>
  )
}

function RouletteTrack({ items, direction, renderCard }) {
  const shouldAnimate = items.length > 1
  const repeatedItems = shouldAnimate
    ? [
        ...items.map((item) => ({ item, isClone: false, key: `primary-${item.id}` })),
        ...items.map((item) => ({ item, isClone: true, key: `clone-${item.id}` })),
      ]
    : items.map((item) => ({ item, isClone: false, key: `primary-${item.id}` }))

  return (
    <div
      className="photo-roulette-viewport"
      data-direction={direction}
      data-animated={shouldAnimate ? 'true' : 'false'}
    >
      <div className="recognition-gallery photo-roulette-track" data-layout="scroll">
        {repeatedItems.map(({ item, isClone, key }) => renderCard(item, isClone, key))}
      </div>
    </div>
  )
}

export function RecognitionStrip({ recognition }) {
  const count = recognition.length
  const [viewerItem, setViewerItem] = useState(null)

  return (
    <section className="recognition-section" aria-labelledby="recognition-heading">
      <div className="recognition-heading">
        <div>
          <h2 id="recognition-heading">Team Recognition</h2>
          <p>Celebrating thoughtful work and excellent service. Hover to pause and magnify; click for a closer look.</p>
        </div>
        <Award size={20} aria-hidden="true" />
      </div>

      {count ? (
        <RouletteTrack
          items={recognition}
          direction="left-to-right"
          renderCard={(item, isClone, key) => (
            <article className="recognition-card" key={key} aria-hidden={isClone || undefined}>
              <div className="recognition-card__portrait">
                <RecognitionImage
                  item={item}
                  isClone={isClone}
                  onOpen={() => item.imageUrl && setViewerItem(item)}
                />
              </div>
              <div className="recognition-card__copy">
                <span>{item.category}</span>
                <h3>{item.employeeName}</h3>
                {item.caption && <p>{item.caption}</p>}
              </div>
            </article>
          )}
        />
      ) : (
        <p className="empty-message">Recognition updates will appear here.</p>
      )}

      {viewerItem?.imageUrl && (
        <ImageViewer
          src={viewerItem.imageUrl}
          alt={`${viewerItem.employeeName}, ${viewerItem.category}`}
          onClose={() => setViewerItem(null)}
        />
      )}
    </section>
  )
}

export function PhotoGalleryStrip({ title, subtitle, items, sectionId, direction = 'right-to-left' }) {
  const count = items.length
  const [viewerItem, setViewerItem] = useState(null)
  const headingId = `${sectionId}-heading`

  return (
    <section className="recognition-section" aria-labelledby={headingId}>
      <div className="recognition-heading">
        <div>
          <h2 id={headingId}>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <Images size={20} aria-hidden="true" />
      </div>

      {count ? (
        <RouletteTrack
          items={items}
          direction={direction}
          renderCard={(item, isClone, key) => {
            const index = items.findIndex((candidate) => candidate.id === item.id)
            const displayTitle = item.title || `${title} photo ${index + 1}`
            return (
              <article className="recognition-card" key={key} aria-hidden={isClone || undefined}>
                <div className="recognition-card__portrait">
                  <GalleryImage
                    item={item}
                    isClone={isClone}
                    onOpen={() => item.imageUrl && setViewerItem(item)}
                  />
                </div>
                <div className="recognition-card__copy">
                  <span>{title}</span>
                  <h3>{displayTitle}</h3>
                  {item.caption && <p>{item.caption}</p>}
                </div>
              </article>
            )
          }}
        />
      ) : (
        <p className="empty-message">Photos uploaded by the admin will appear here.</p>
      )}

      {viewerItem?.imageUrl && (
        <ImageViewer
          src={viewerItem.imageUrl}
          alt={viewerItem.title || viewerItem.caption || title}
          onClose={() => setViewerItem(null)}
        />
      )}
    </section>
  )
}
