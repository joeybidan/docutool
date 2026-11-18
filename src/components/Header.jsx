import { Maximize2, Settings } from 'lucide-react'
import { HourlyQuote } from './HourlyQuote.jsx'
import { QuickAccessLinks } from './QuickAccessLinks.jsx'
import { Button } from './ui/Button.jsx'
import { TimezoneClocks } from './TimezoneClocks.jsx'
import { VisitorCounter } from './VisitorCounter.jsx'

export function Header({ onOpenAdmin, onOpenMini, onOpenTimezones, onOpenTimezoneConverter }) {
  return (
    <header className="app-header">
      <div className="brand-group">
        <a className="brand" href="#workspace" aria-label="DocuTool home">
          Docu<span>Tool</span>
        </a>
        <HourlyQuote />
        <VisitorCounter />
      </div>

      <QuickAccessLinks onOpenMini={onOpenMini} />

      <div className="header-utilities">
        <div className="header-timezone-wrapper">
          <TimezoneClocks onExpandConverter={onOpenTimezoneConverter} />
          {onOpenTimezones && (
            <button type="button" className="header-timezone-maximize" onClick={onOpenTimezones} aria-label="Maximize timezones and alarms" title="Maximize timezones and alarms">
              <Maximize2 size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <Button variant="ghost" size="small" onClick={onOpenAdmin}>
          <Settings size={15} aria-hidden="true" />
          Admin
        </Button>
      </div>
    </header>
  )
}
