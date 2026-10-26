import { useLayoutEffect, useRef } from 'react'
import { sanitizeHtml, textToHtml } from '../utils/richText.js'

export function NoteEditor({ activeIndex, value, html, onChange, editorRef }) {
  const localRef = useRef(null)
  const ref = editorRef || localRef
  useLayoutEffect(() => {
    const node = ref.current
    const clean = sanitizeHtml(html ?? textToHtml(value), node.ownerDocument)
    if (sanitizeHtml(node.innerHTML, node.ownerDocument) !== clean) node.innerHTML = clean
  }, [activeIndex, value, html, ref])
  function publish(node) { onChange(node.innerText, sanitizeHtml(node.innerHTML, node.ownerDocument)) }
  return <div className="note-editor-shell">
    <div ref={ref} className="note-editor rich-note-editor" role="textbox" aria-label="Note content"
      aria-multiline="true" contentEditable suppressContentEditableWarning spellCheck="true"
      onInput={event => publish(event.currentTarget)}
      onPaste={event => {
        event.preventDefault()
        const node = event.currentTarget
        const doc = node.ownerDocument
        const html = event.clipboardData.getData('text/html')
        doc.execCommand('insertHTML', false, html ? sanitizeHtml(html, doc) : textToHtml(event.clipboardData.getData('text/plain')))
        publish(node)
      }} />
  </div>
}

export function FormatControls({ editorRef, onChange }) {
  const rangeRef = useRef(null)
  function remember() {
    const node = editorRef.current
    const selection = node.ownerDocument.getSelection()
    if (selection?.rangeCount && node.contains(selection.anchorNode) && node.contains(selection.focusNode)) rangeRef.current = selection.getRangeAt(0).cloneRange()
    else rangeRef.current = null
  }
  function apply(command, color) {
    const node = editorRef.current
    const doc = node.ownerDocument
    const range = rangeRef.current
    if (!range || !node.contains(range.commonAncestorContainer)) return
    node.focus()
    const selection = doc.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
    doc.execCommand('styleWithCSS', false, true)
    doc.execCommand(command, false, color)
    onChange(node.innerText, sanitizeHtml(node.innerHTML, doc))
    rangeRef.current = selection.rangeCount ? selection.getRangeAt(0).cloneRange() : null
  }
  return <>
    <label className="note-color">Highlight <select aria-label="Highlight color" defaultValue="" onPointerDown={remember} onFocus={remember} onChange={e => { apply('hiliteColor', e.target.value); e.target.value = '' }}>
      <option value="" disabled>Color</option><option value="#fff176">Yellow</option><option value="#a5d6a7">Green</option><option value="#90caf9">Blue</option><option value="#f8bbd0">Pink</option><option value="transparent">None</option>
    </select></label>
    <label className="note-color">Font Color <select aria-label="Font color" defaultValue="" onPointerDown={remember} onFocus={remember} onChange={e => { apply('foreColor', e.target.value); e.target.value = '' }}>
      <option value="" disabled>Color</option><option value="#172033">Default</option><option value="#b91c1c">Red</option><option value="#166534">Green</option><option value="#1d4ed8">Blue</option><option value="#7e22ce">Purple</option>
    </select></label>
  </>
}
