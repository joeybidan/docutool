import { ArrowLeft, Maximize2 } from 'lucide-react'
import { sectionHref } from '../utils/sectionRoutes.js'

export function SectionFrame({ slug, title, onOpen, children }) {
  return (
    <div className={`section-frame section-frame--${slug}`}>
      {children}
      <button
        type="button"
        className="section-frame__maximize"
        title={`Maximize ${title} — open its own page`}
        aria-label={`Maximize ${title}`}
        onClick={() => onOpen(slug)}
      >
        <Maximize2 size={15} aria-hidden="true" />
      </button>
    </div>
  )
}

export function SectionPage({ slug, title, onBack, children }) {
  return (
    <>
      <header className="section-page-header">
        <a
          className="section-page-header__back"
          href="/"
          onClick={(event) => { event.preventDefault(); onBack() }}
        >
          <ArrowLeft size={18} aria-hidden="true" />
          All DocuTool
        </a>
        <div className="section-page-header__heading">
          <span>DocuTool · Focus view</span>
          <h1>{title}</h1>
        </div>
        <a className="section-page-header__permalink" href={sectionHref(slug)} title="This page has its own shareable URL">
          Direct page link
        </a>
      </header>
      <main id="workspace" className={`section-page-content section-page--${slug}`}>
        {children}
      </main>
    </>
  )
}
