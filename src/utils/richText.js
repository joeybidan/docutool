export const escapeText = (text = '') => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
export const textToHtml = (text = '') => escapeText(text).replace(/\n/g, '<br>')

// Only text structure and the two supported color styles enter saved notes.
export function sanitizeHtml(html, doc = document) {
  const template = doc.createElement('template')
  template.innerHTML = html || ''
  const clean = (node) => {
    if (node.nodeType === 3) return escapeText(node.textContent)
    if (node.nodeType !== 1) return ''
    if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'SVG', 'MATH'].includes(node.tagName)) return ''
    const children = [...node.childNodes].map(clean).join('')
    if (node.tagName === 'BR') return '<br>'
    const tag = ['DIV', 'P', 'B', 'STRONG', 'I', 'EM', 'U', 'UL', 'OL', 'LI'].includes(node.tagName) ? node.tagName.toLowerCase() : 'span'
    const style = ['color', 'background-color'].map((key) => {
      const value = node.style.getPropertyValue(key)
      return /^(#[0-9a-f]{3,8}|rgba?\([\d.,%\s]+\)|[a-z]+)$/i.test(value) ? `${key}:${value}` : ''
    }).filter(Boolean).join(';')
    return `<${tag}${style ? ` style="${style}"` : ''}>${children}</${tag}>`
  }
  return [...template.content.childNodes].map(clean).join('')
}
