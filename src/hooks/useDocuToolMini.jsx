import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { DocuToolMini } from '../components/DocuToolMini.jsx'

function prepareMiniDocument(targetWindow) {
  const targetDocument = targetWindow.document
  targetDocument.title = 'DocuTool Mini'
  targetDocument.head.innerHTML = ''
  targetDocument.body.innerHTML = ''
  targetDocument.documentElement.className = 'docutool-mini-document'
  targetDocument.body.className = 'docutool-mini-body'

  const viewport = targetDocument.createElement('meta')
  viewport.name = 'viewport'
  viewport.content = 'width=device-width, initial-scale=1'
  targetDocument.head.appendChild(viewport)

  document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
    targetDocument.head.appendChild(node.cloneNode(true))
  })
}

export function useDocuToolMini({
  templates,
  selectedIds,
  onToggle,
  onGenerateCopy,
  onUncheck,
  onNotify,
}) {
  const [targetWindow, setTargetWindow] = useState(null)
  const [mode, setMode] = useState(null)
  const targetRef = useRef(null)

  const closeMini = useCallback(() => {
    const current = targetRef.current
    targetRef.current = null
    setTargetWindow(null)
    setMode(null)
    try {
      if (current && !current.closed) current.close()
    } catch {
      // The window may already be closing.
    }
  }, [])

  const attachWindow = useCallback((child, nextMode) => {
    if (!child) return false

    prepareMiniDocument(child)
    targetRef.current = child
    setTargetWindow(child)
    setMode(nextMode)

    const handleClosed = () => {
      if (targetRef.current === child) {
        targetRef.current = null
        setTargetWindow(null)
        setMode(null)
      }
    }

    child.addEventListener('pagehide', handleClosed, { once: true })
    child.addEventListener('beforeunload', handleClosed, { once: true })
    return true
  }, [])

  const openMini = useCallback(async () => {
    const existing = targetRef.current
    if (existing && !existing.closed) {
      try { existing.focus() } catch {}
      return
    }

    if (window.documentPictureInPicture?.requestWindow) {
      try {
        const pipWindow = await window.documentPictureInPicture.requestWindow({
          width: 360,
          height: 620,
        })
        attachWindow(pipWindow, 'pip')
        return
      } catch (error) {
        console.warn('Document Picture-in-Picture is unavailable; trying a popup fallback.', error)
      }
    }

    const popup = window.open(
      '',
      'docutool-mini',
      'popup=yes,width=360,height=620,resizable=yes,scrollbars=yes',
    )

    if (!popup) {
      onNotify(
        'DocuTool Mini was blocked by the browser. Allow pop-ups for DocuTool, then try Open Mini again.',
        'error',
      )
      return
    }

    attachWindow(popup, 'popup')
    onNotify('Always-on-top mode is unavailable here, so DocuTool Mini opened as a compact window.')
  }, [attachWindow, onNotify])

  useEffect(() => () => {
    const current = targetRef.current
    if (current && !current.closed) {
      try { current.close() } catch {}
    }
  }, [])

  const miniPortal = targetWindow
    ? createPortal(
        <DocuToolMini
          templates={templates}
          selectedIds={selectedIds}
          onToggle={onToggle}
          onGenerateCopy={onGenerateCopy}
          onUncheck={onUncheck}
          onClose={closeMini}
          mode={mode}
        />,
        targetWindow.document.body,
      )
    : null

  return {
    openMini,
    closeMini,
    miniPortal,
    isMiniOpen: Boolean(targetWindow),
    miniMode: mode,
  }
}
