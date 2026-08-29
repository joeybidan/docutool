export function appendTextBlock(currentText, blockText) {
  const current = currentText ?? ''
  const block = (blockText ?? '').trim()

  if (!block) return current
  if (!current.trim()) return block

  return `${current.replace(/\s+$/, '')}\n\n${block}`
}

export function formatTemplateBlock(templates) {
  return templates.map((template) => `• ${template.text}`).join('\n')
}

export async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const helper = document.createElement('textarea')
  helper.value = text
  helper.setAttribute('readonly', '')
  helper.style.position = 'fixed'
  helper.style.opacity = '0'
  document.body.appendChild(helper)
  helper.select()
  const successful = document.execCommand('copy')
  helper.remove()

  if (!successful) throw new Error('Clipboard access is unavailable in this browser.')
}
