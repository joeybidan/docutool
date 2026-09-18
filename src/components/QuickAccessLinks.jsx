const QUICK_LINKS = [
  { label: 'SNOW (CTS)', url: 'https://ctsccprod.service-now.com/ss' },
  { label: 'Jira (SC)', url: 'https://arnoldmedia.jira.com/servicedesk/customer/portals?isEligibleForUserSurvey=true' },
  { label: 'Dorado', url: 'https://dorado-cts.grantthorntonsolutions.ph/1.0.8.2/Report/PayslipWeb' },
  { label: 'HCM', url: 'https://compass.talent.cognizant.com/psp/HCMPRD_1/EMPLOYEE/HRMS/h/?tab=DEFAULT' },
  { label: 'Five9', url: 'https://login.five9.com/' },
  { label: 'Speedtest', url: 'https://speed.cloudflare.com/' },
]

async function clearDocuToolCache() {
  try {
    if ('caches' in window) {
      const keys = await window.caches.keys()
      await Promise.all(keys.map((key) => window.caches.delete(key)))
    }
    window.alert('DocuTool cache storage cleared. The page will refresh now.')
    window.location.reload()
  } catch (error) {
    window.alert(`Could not clear DocuTool cache: ${error.message}`)
  }
}

function clearDocuToolCookies() {
  const cookies = document.cookie ? document.cookie.split(';') : []
  cookies.forEach((cookie) => {
    const name = cookie.split('=')[0]?.trim()
    if (!name) return
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`
  })
  window.alert(
    cookies.length
      ? 'DocuTool cookies accessible to this page were cleared.'
      : 'No DocuTool cookies accessible to this page were found.',
  )
}

export function QuickAccessLinks() {
  return (
    <nav className="quick-access-links" aria-label="Agent quick access links">
      {QUICK_LINKS.map((item) => (
        <a
          key={item.label}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          title={`Open ${item.label} in a new tab`}
        >
          {item.label}
        </a>
      ))}
      <button
        type="button"
        onClick={clearDocuToolCache}
        title="Clear cache storage for DocuTool only"
      >
        Clear Cache
      </button>
      <button
        type="button"
        onClick={clearDocuToolCookies}
        title="Clear cookies accessible to DocuTool only"
      >
        Clear Cookies
      </button>
    </nav>
  )
}
