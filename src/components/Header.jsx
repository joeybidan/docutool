import { Settings } from 'lucide-react'
import { HourlyQuote } from './HourlyQuote.jsx'
import { QuickAccessLinks } from './QuickAccessLinks.jsx'
import { Button } from './ui/Button.jsx'
import { TimezoneClocks } from './TimezoneClocks.jsx'
import { VisitorCounter } from './VisitorCounter.jsx'

export function Header({ onOpenAdmin }) {
  return (
    <header className="app-header">
      <div className="brand-group">
        <a className="brand" href="#workspace" aria-label="DocuTool home">
          Docu<span>Tool</span>
        </a>
        <HourlyQuote />
        <VisitorCounter />
      </div>

      <QuickAccessLinks />

      <div className="header-utilities">
        <TimezoneClocks />
        <Button variant="ghost" size="small" onClick={onOpenAdmin}>
          <Settings size={15} aria-hidden="true" />
          Admin
        </Button>
      </div>
    </header>
  )
}
