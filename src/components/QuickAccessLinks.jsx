const QUICK_LINKS = [
  { label: 'SNOW (CTS)', url: 'https://ctsccprod.service-now.com/ss' },
  { label: 'Jira (SC)', url: 'https://arnoldmedia.jira.com/servicedesk/customer/portals?isEligibleForUserSurvey=true' },
  { label: 'Dorado', url: 'https://dorado-cts.grantthorntonsolutions.ph/1.0.8.2/Report/PayslipWeb' },
  { label: 'HCM', url: 'https://compass.talent.cognizant.com/psp/HCMPRD_1/EMPLOYEE/HRMS/h/?tab=DEFAULT' },
  { label: 'Five9', url: 'https://login.five9.com/' },
]

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
    </nav>
  )
}
