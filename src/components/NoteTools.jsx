import { useEffect, useRef, useState } from 'react'
import { sanitizeHtml } from '../utils/richText.js'

function download(blob, name, doc) {
  const url = URL.createObjectURL(blob)
  const link = doc.createElement('a')
  link.href = url; link.download = name
  doc.body.appendChild(link); link.click(); link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

export function NoteTools({ note, html, name }) {
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [recording, setRecording] = useState(false)
  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => {
    mounted.current = false
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    streamRef.current?.getTracks().forEach(track => track.stop())
  } }, [])
  async function capture(event, videoMode) {
    const doc = event.currentTarget.ownerDocument
    const win = doc.defaultView
    if (!win.navigator.mediaDevices?.getDisplayMedia) {
      setStatus('Screen capture is unavailable here. Try the full DocuTool in Chrome or Edge.'); return
    }
    if (videoMode && !win.MediaRecorder) { setStatus('Video recording is unavailable in this browser.'); return }
    setBusy(true); setStatus('Choose a screen, window, or tab in the browser prompt.')
    let stream
    try {
      stream = await win.navigator.mediaDevices.getDisplayMedia({ video: true, audio: videoMode })
      if (!mounted.current) { stream.getTracks().forEach(track => track.stop()); return }
      streamRef.current = stream
      if (videoMode) {
        const chunks = []
        const recorder = new win.MediaRecorder(stream)
        recorderRef.current = recorder
        recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
        recorder.onstop = () => {
          if (chunks.length) download(new Blob(chunks, { type: recorder.mimeType }), `DocuTool-${Date.now()}.${recorder.mimeType.includes('mp4') ? 'mp4' : 'webm'}`, doc)
          stream.getTracks().forEach(track => track.stop())
          streamRef.current = null; recorderRef.current = null
          setRecording(false); setBusy(false); setStatus('Recording finished. Check your downloads.')
        }
        recorder.onerror = () => { setStatus('Recording failed. Try again from the full DocuTool.'); if (recorder.state !== 'inactive') recorder.stop(); stream.getTracks().forEach(track => track.stop()); setBusy(false); setRecording(false) }
        stream.getVideoTracks()[0].addEventListener('ended', () => { if (recorder.state !== 'inactive') recorder.stop() }, { once: true })
        recorder.start(1000); setRecording(true); setStatus('Recording — press Stop recording to save.')
      } else {
        const video = doc.createElement('video')
        video.muted = true; video.srcObject = stream
        await video.play()
        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('Could not read the selected screen.')), 10000)
          if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(() => { clearTimeout(timer); resolve() })
          else setTimeout(() => { clearTimeout(timer); resolve() }, 250)
        })
        const canvas = doc.createElement('canvas')
        canvas.width = video.videoWidth; canvas.height = video.videoHeight
        canvas.getContext('2d').drawImage(video, 0, 0)
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
        if (!blob) throw new Error('Could not create a screenshot.')
        download(blob, `DocuTool-${Date.now()}.png`, doc)
        video.srcObject = null
        setStatus('Screenshot saved. Check your downloads.')
      }
    } catch (error) {
      setStatus(error.name === 'NotAllowedError' ? 'Capture cancelled or blocked by browser policy.' : `${error.message} Try capture from the full DocuTool if Mini is restricted.`)
    } finally {
      if (!recorderRef.current || recorderRef.current.state === 'inactive') {
        stream?.getTracks().forEach(track => track.stop()); streamRef.current = null; setBusy(false)
      }
    }
  }
  return <div className="note-tools">
    <div className="note-tools-row">
      {[['SNOW (CTS)', 'https://ctsccprod.service-now.com/ss'], ['Jira (SC)', 'https://arnoldmedia.jira.com/servicedesk/customer/portals?isEligibleForUserSurvey=true']].map(([label, url]) =>
        <a key={label} href={url} target="_blank" rel="noopener noreferrer" onClick={event => {
          event.preventDefault()
          event.currentTarget.ownerDocument.defaultView.open(url, '_blank', 'popup=yes,width=1100,height=800,noopener,noreferrer')
        }}>{label}</a>)}
      <button type="button" disabled={busy} onClick={e => capture(e, false)}>📷 Screenshot</button>
      <button type="button" disabled={busy && !recording} onClick={e => recording ? recorderRef.current?.stop() : capture(e, true)}>{recording ? '■ Stop recording' : 'Record screen'}</button>
      <button type="button" onClick={e => download(new Blob([note], { type: 'text/plain;charset=utf-8' }), `${name.replace(/[<>:"/\\|?*]/g, '_')}.txt`, e.currentTarget.ownerDocument)}>Save .txt</button>
      <button type="button" onClick={e => download(new Blob([`<!doctype html><meta charset="utf-8"><div style="white-space:pre-wrap">${sanitizeHtml(html, e.currentTarget.ownerDocument)}</div>`], { type: 'text/html;charset=utf-8' }), `${name.replace(/[<>:"/\\|?*]/g, '_')}.html`, e.currentTarget.ownerDocument)}>Save formatted</button>
    </div>
    {status && <p role="status">{status}</p>}
  </div>
}
