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

function RecognitionImage({ item, onOpen }) {
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
    >
      <img
        src={item.imageUrl}
        alt={`${item.employeeName}, ${item.category}`}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </button>
  )
}

function GalleryImage({ item, onOpen }) {
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
    >
      <img
        src={item.imageUrl}
        alt={label}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </button>
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
          <p>Celebrating thoughtful work and excellent service. Hover a photo to magnify; click for a closer look.</p>
        </div>
        <Award size={20} aria-hidden="true" />
      </div>

      {count ? (
        <div
          className="recognition-gallery"
          data-layout={count <= 3 ? 'few' : count <= 6 ? 'compact' : 'scroll'}
        >
          {recognition.map((item) => (
            <article className="recognition-card" key={item.id}>
              <div className="recognition-card__portrait">
                <RecognitionImage item={item} onOpen={() => item.imageUrl && setViewerItem(item)} />
              </div>
              <div className="recognition-card__copy">
                <span>{item.category}</span>
                <h3>{item.employeeName}</h3>
                {item.caption && <p>{item.caption}</p>}
              </div>
            </article>
          ))}
        </div>
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

export function PhotoGalleryStrip({ title, subtitle, items, sectionId }) {
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
        <div
          className="recognition-gallery"
          data-layout={count <= 3 ? 'few' : count <= 6 ? 'compact' : 'scroll'}
        >
          {items.map((item, index) => {
            const displayTitle = item.title || `${title} photo ${index + 1}`
            return (
              <article className="recognition-card" key={item.id}>
                <div className="recognition-card__portrait">
                  <GalleryImage item={item} onOpen={() => item.imageUrl && setViewerItem(item)} />
                </div>
                <div className="recognition-card__copy">
                  <span>{title}</span>
                  <h3>{displayTitle}</h3>
                  {item.caption && <p>{item.caption}</p>}
                </div>
              </article>
            )
          })}
        </div>
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
