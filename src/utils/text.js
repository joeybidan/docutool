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

function formatCallbackDate(value) {
  if (!value) return 'date and time not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function formatCallbackBlock(callbacks) {
  return callbacks
    .map((callback) => {
      const when = formatCallbackDate(callback.scheduledAt)
      if (callback.status === 'success') return `• Success call back to "${callback.name}", ${when}`
      if (callback.status === 'missed') return `• Missed call back to "${callback.name}", ${when}`
      if (callback.status === 'will-call-again') return `• Will call again: "${callback.name}", ${when}`
      return `• Callback to "${callback.name}" scheduled for ${when}`
    })
    .join('\n')
}

export async function copyToClipboard(text, contextWindow = typeof window !== 'undefined' ? window : null) {
  if (!contextWindow) throw new Error('Clipboard access is unavailable in this browser.')

  const targetDocument = contextWindow.document
  let clipboardError = null

  try {
    if (targetDocument?.hasFocus && !targetDocument.hasFocus()) {
      contextWindow.focus?.()
    }

    if (contextWindow.navigator?.clipboard?.writeText) {
      await contextWindow.navigator.clipboard.writeText(text)
      return
    }
  } catch (error) {
    clipboardError = error
  }

  const helper = targetDocument.createElement('textarea')
  helper.value = text
  helper.setAttribute('readonly', '')
  helper.style.position = 'fixed'
  helper.style.opacity = '0'
  helper.style.pointerEvents = 'none'
  targetDocument.body.appendChild(helper)
  helper.focus()
  helper.select()
  const successful = targetDocument.execCommand?.('copy')
  helper.remove()

  if (!successful) {
    throw new Error(
      clipboardError?.name === 'NotAllowedError'
        ? 'Clipboard access was blocked. Click Copy again while DocuTool Mini is focused.'
        : clipboardError?.message || 'Clipboard access is unavailable in this browser.',
    )
  }
}
