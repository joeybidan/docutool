import { useState } from 'react'
import { Award } from 'lucide-react'

function RecognitionImage({ item }) {
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
    <img
      src={item.imageUrl}
      alt={`${item.employeeName}, ${item.category}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

export function RecognitionStrip({ recognition }) {
  const count = recognition.length

  return (
    <section className="recognition-section" aria-labelledby="recognition-heading">
      <div className="recognition-heading">
        <div>
          <h2 id="recognition-heading">Team Recognition</h2>
          <p>Celebrating thoughtful work and excellent service.</p>
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
                <RecognitionImage item={item} />
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
    </section>
  )
}
