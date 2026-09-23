import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Database, LockKeyhole, LogOut, X } from 'lucide-react'
import {
  getSignedInAdmin,
  signInAdmin,
  signOutAdmin,
} from '../../services/adminAuthService.js'
import { loadAdminContent } from '../../services/sharedContentService.js'
import { AdminContentManager } from './AdminContentManager.jsx'
import { DashboardMediaManager } from './DashboardMediaManager.jsx'
import { PhotoGalleryManager } from './PhotoGalleryManager.jsx'
import { RecognitionManager } from './RecognitionManager.jsx'
import { SuggestionsManager } from './SuggestionsManager.jsx'
import { TeamSpotlightManager } from './TeamSpotlightManager.jsx'
import { Button } from '../ui/Button.jsx'

const ADMIN_TABS = [
  { id: 'announcements', label: 'Announcements' },
  { id: 'links', label: 'SOP & Trainings' },
  { id: 'recognition', label: 'Recognition' },
  { id: 'kudos', label: 'Kudos' },
  { id: 'family-moments', label: 'Family Moments' },
  { id: 'suggestions', label: 'Suggestions' },
  { id: 'dashboard-media', label: 'Dashboard Media' },
  { id: 'team-spotlight', label: 'Team Spotlight' },
]

export function AdminModal({ sharedContent, onRefresh, onNotify, onClose }) {
  const modalRef = useRef(null)
  const [password, setPassword] = useState('')
  const [accessEnabled, setAccessEnabled] = useState(false)
  const [email, setEmail] = useState('')
  const [accountPassword, setAccountPassword] = useState('')
  const [adminUser, setAdminUser] = useState(null)
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('announcements')
  const [passwordError, setPasswordError] = useState('')
  const [adminContent, setAdminContent] = useState(sharedContent)

  useEffect(() => {
    const url = adminContent.teamSpotlight?.imageUrl
    return () => { if (url?.startsWith('blob:')) URL.revokeObjectURL(url) }
  }, [adminContent.teamSpotlight?.imageUrl])

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

  const openAdminWorkspace = async (user) => {
    const secureContent = await loadAdminContent()
    setAdminContent((current) => ({ ...current, ...secureContent, source: 'supabase' }))
    setAdminUser(user)
  }

  const handleUnlock = async (event) => {
    event.preventDefault()
    if (password !== '000') {
      setPasswordError('Incorrect prototype password.')
      return
    }
    setPasswordError('')
    setAccessEnabled(true)
    setAuthLoading(true)

    try {
      const existingAdmin = await getSignedInAdmin()
      if (existingAdmin) await openAdminWorkspace(existingAdmin)
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignIn = async (event) => {
    event.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    try {
      const user = await signInAdmin(email, accountPassword)
      await openAdminWorkspace(user)
      setAccountPassword('')
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignOut = async () => {
    setAuthError('')
    setAuthLoading(true)

    try {
      await signOutAdmin()
      setAdminUser(null)
      setAdminContent(sharedContent)
      setAccountPassword('')
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setAuthLoading(false)
    }
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
            <p>Announcements, SOP & Trainings, recognition, Team Spotlight, suggestions, photo roulettes, and dashboard images</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close admin modal">
            <X size={18} />
          </button>
        </header>

        <div className="admin-security-note">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>Enter 000 first, then sign in with your authorized Supabase admin account to save changes.</span>
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
        ) : !adminUser ? (
          <form className="admin-gate admin-sign-in" onSubmit={handleSignIn}>
            <LockKeyhole size={23} aria-hidden="true" />
            <div>
              <label htmlFor="admin-email">Supabase admin sign-in</label>
              <p>Use the email and password for the Supabase user marked as a DocuTool admin.</p>
              <div className="admin-sign-in__fields">
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Admin email"
                  required
                  autoFocus
                />
                <input
                  id="admin-account-password"
                  type="password"
                  aria-label="Admin password"
                  autoComplete="current-password"
                  value={accountPassword}
                  onChange={(event) => setAccountPassword(event.target.value)}
                  placeholder="Admin password"
                  required
                />
                <Button variant="primary" type="submit" disabled={authLoading}>
                  {authLoading ? 'Checking…' : 'Sign in'}
                </Button>
              </div>
              {authError && <span className="field-error" role="alert">{authError}</span>}
            </div>
          </form>
        ) : (
          <>
            <div className="admin-access-status">
              <div>
                <span><CheckCircle2 size={15} /> Signed in as {adminUser.email}</span>
                <span className="source-status source-status--supabase">
                  <Database size={14} />
                  Supabase connected
                </span>
              </div>
              <Button size="small" type="button" onClick={handleSignOut} disabled={authLoading}>
                <LogOut size={13} />
                Sign out
              </Button>
            </div>

            {authError && <div className="field-error admin-auth-error" role="alert">{authError}</div>}

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
              {activeTab === 'kudos' && (
                <PhotoGalleryManager
                  gallery="kudos"
                  label="Kudos"
                  items={adminContent.kudos || []}
                  onRefresh={refreshAdminContent}
                  onNotify={onNotify}
                />
              )}
              {activeTab === 'family-moments' && (
                <PhotoGalleryManager
                  gallery="sharecare_family_moments"
                  label="Sharecare Family Moments"
                  items={adminContent.familyMoments || []}
                  onRefresh={refreshAdminContent}
                  onNotify={onNotify}
                />
              )}
              {activeTab === 'suggestions' && (
                <SuggestionsManager onNotify={onNotify} />
              )}
              {activeTab === 'dashboard-media' && (
                <DashboardMediaManager
                  items={adminContent.dashboardMedia}
                  onRefresh={refreshAdminContent}
                  onNotify={onNotify}
                />
              )}
              {activeTab === 'team-spotlight' && (
                <TeamSpotlightManager
                  item={adminContent.teamSpotlight}
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
