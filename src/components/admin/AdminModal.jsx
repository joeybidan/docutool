import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Database, LockKeyhole, X } from 'lucide-react'
import { loadAdminContent } from '../../services/sharedContentService.js'
import { AdminContentManager } from './AdminContentManager.jsx'
import { RecognitionManager } from './RecognitionManager.jsx'
import { Button } from '../ui/Button.jsx'

const ADMIN_TABS = [
  { id: 'announcements', label: 'Announcements' },
  { id: 'links', label: 'Links' },
  { id: 'recognition', label: 'Recognition' },
]

export function AdminModal({ sharedContent, onRefresh, onNotify, onClose }) {
  const modalRef = useRef(null)
  const [password, setPassword] = useState('')
  const [accessEnabled, setAccessEnabled] = useState(false)
  const [activeTab, setActiveTab] = useState('announcements')
  const [passwordError, setPasswordError] = useState('')
  const [adminContent, setAdminContent] = useState(sharedContent)

  const refreshAdminContent = useCallback(async () => {
    const [secureContent] = await Promise.all([loadAdminContent(), onRefresh()])
    setAdminContent((current) => ({ ...current, ...secureContent }))
    return secureContent
  }, [onRefresh])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    modalRef.current?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const handleUnlock = (event) => {
    event.preventDefault()
    if (password !== '000') {
      setPasswordError('Incorrect prototype password.')
      return
    }
    setPasswordError('')
    setAccessEnabled(true)
    loadAdminContent()
      .then((secureContent) =>
        setAdminContent((current) => ({ ...current, ...secureContent, source: 'supabase' })),
      )
      .catch(() => {
        setAdminContent(sharedContent)
      })
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section
        ref={modalRef}
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        tabIndex="-1"
      >
        <header className="admin-modal__header">
          <div>
            <h2 id="admin-modal-title">Manage shared content</h2>
            <p>Announcements, links, and team recognition</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close admin modal">
            <X size={18} />
          </button>
        </header>

        <div className="admin-security-note">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>Prototype password is a UI convenience only. Secure writes require Supabase Auth.</span>
        </div>

        {!accessEnabled ? (
          <form className="admin-gate" onSubmit={handleUnlock}>
            <LockKeyhole size={23} aria-hidden="true" />
            <div>
              <label htmlFor="admin-password">Prototype admin password</label>
              <p>This only reveals the management interface. It does not bypass database policies.</p>
              <div className="admin-gate__controls">
                <input
                  id="admin-password"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  autoFocus
                />
                <Button variant="primary" type="submit">Continue</Button>
              </div>
              {passwordError && <span className="field-error" role="alert">{passwordError}</span>}
            </div>
          </form>
        ) : (
          <>
            <div className="admin-access-status">
              <span><CheckCircle2 size={15} /> Prototype access enabled</span>
              <span className={`source-status source-status--${sharedContent.source}`}>
                <Database size={14} />
                {sharedContent.source === 'supabase' ? 'Supabase connected' : 'Preview mode'}
              </span>
            </div>

            <div className="admin-tabs" role="tablist" aria-label="Shared content management type">
              {ADMIN_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={activeTab === tab.id ? 'is-active' : ''}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="admin-modal__content" role="tabpanel">
              {activeTab === 'announcements' && (
                <AdminContentManager
                  type="announcements"
                  items={adminContent.announcements}
                  onRefresh={refreshAdminContent}
                  onNotify={onNotify}
                />
              )}
              {activeTab === 'links' && (
                <AdminContentManager
                  type="links"
                  items={adminContent.links}
                  onRefresh={refreshAdminContent}
                  onNotify={onNotify}
                />
              )}
              {activeTab === 'recognition' && (
                <RecognitionManager
                  items={adminContent.recognition}
                  onRefresh={refreshAdminContent}
                  onNotify={onNotify}
                />
              )}
            </div>
          </>
        )}

        <footer className="admin-modal__footer">Global content <span>•</span> Supabase-backed</footer>
      </section>
    </div>
  )
}
