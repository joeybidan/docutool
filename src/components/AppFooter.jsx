import { Mail } from 'lucide-react'

const SHIFT_REMINDER =
  'HCM Punch 30 mins before shift, prepare and login five9 at least 30 mins before shift, read all unread emails in Cognizant and Sharecare, read all MS Teams notification to see if there are anything important tagged to you or everyone.'

const OUTLOOK_COMPOSE_URL =
  'https://outlook.office.com/mail/deeplink/compose?to=joey.bidan%40sharecare.com'

export function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="shift-reminder" aria-label={`Shift reminder: ${SHIFT_REMINDER}`}>
        <div className="shift-reminder__track" aria-hidden="true">
          <span>{SHIFT_REMINDER}</span>
        </div>
      </div>

      <a
        className="feedback-link"
        href={OUTLOOK_COMPOSE_URL}
        target="_blank"
        rel="noreferrer"
      >
        <Mail size={14} aria-hidden="true" />
        Email me at: joey.bidan@sharecare.com
      </a>
    </footer>
  )
}

