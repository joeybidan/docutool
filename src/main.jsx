import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
import './features.css'
import './regression-fixes.css'

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, details) {
    console.error('DocuTool encountered a rendering error.', error, details)
  }
  render() {
    if (this.state.error) {
      return (
        <main style={{ maxWidth: 600, margin: '8vh auto', padding: 24, border: '1px solid #cddbed',
          background: '#fff', borderRadius: 12, color: '#15335b', fontFamily: 'system-ui,sans-serif' }}
          role="alert">
          <h1 style={{ fontSize: 22 }}>DocuTool couldn't open this view</h1>
          <p>Your notes are stored locally in your browser. Please don't clear your browser data.</p>
          <p style={{ fontSize: 13 }}>Error: {String(this.state.error?.message || 'Unexpected page error')}</p>
          <button type="button" onClick={() => window.location.reload()}
            style={{ padding: '10px 15px', border: 0, borderRadius: 8, background: '#215bb7', color: '#fff',
              cursor: 'pointer' }}>
            Reload DocuTool
          </button>
        </main>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)

import './note-workspace.css'
