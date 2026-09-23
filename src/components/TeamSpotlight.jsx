import { Lightbulb, UserRound } from 'lucide-react'
import './team-spotlight.css'

export function TeamSpotlight({ item, preview = false }) {
  const visible = preview || item?.isPublished
  const questions = (item?.qa || []).filter(({ question, answer }) => question?.trim() && answer?.trim())

  return (
    <section className="panel team-spotlight" aria-labelledby={preview ? 'spotlight-preview-title' : 'spotlight-title'}>
      <div className="panel-heading team-spotlight__heading">
        <div>
          <h2 id={preview ? 'spotlight-preview-title' : 'spotlight-title'}>Team Spotlight</h2>
          <p className="panel-subtitle">Get to know a teammate each week.</p>
        </div>
        {visible && item?.weekLabel && <span className="team-spotlight__week">{item.weekLabel}</span>}
      </div>

      {visible && item?.employeeName ? (
        <>
          <div className="team-spotlight__intro">
            {item.imageUrl ? (
              <img className="team-spotlight__portrait" src={item.imageUrl} alt={`Portrait of ${item.employeeName}`} />
            ) : (
              <div className="team-spotlight__portrait team-spotlight__portrait--empty" aria-hidden="true"><UserRound size={42} /></div>
            )}
            <div className="team-spotlight__copy">
              <h3>Meet {item.employeeName}</h3>
              {item.team && <p className="team-spotlight__role">{item.team}</p>}
              {item.hook && <p className="team-spotlight__hook">{item.hook}</p>}
              {item.intro && <p className="team-spotlight__summary">{item.intro}</p>}
            </div>
          </div>
          {item.funFact && (
            <div className="team-spotlight__fact">
              <Lightbulb size={19} aria-hidden="true" />
              <p><strong>Fun fact</strong><span>{item.funFact}</span></p>
            </div>
          )}
          {questions.length > 0 && (
            <div className="team-spotlight__qa">
              <h3>A quick Q&amp;A with {item.employeeName.split(/\s+/)[0]}</h3>
              <ol>
                {questions.map(({ question, answer }, index) => (
                  <li key={index}>
                    <span className="team-spotlight__number">{String(index + 1).padStart(2, '0')}</span>
                    <div><strong>{question}</strong><p>{answer}</p></div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      ) : (
        <p className="team-spotlight__empty">Our next teammate spotlight is coming soon.</p>
      )}
    </section>
  )
}
