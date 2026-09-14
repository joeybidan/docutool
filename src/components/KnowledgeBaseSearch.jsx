import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

const COMMON_TERMS = [
  'hire',
  'caregiver',
  'timesheet',
  'clock in',
  'clock out',
  'payment',
  'interview',
  'schedule',
  'shift',
  'profile',
  'rates',
  'subscription',
  'background check',
  'payroll',
  'recruitment',
  'cancellation',
  'application',
  'onboarding',
  'UHC',
  'care advisor',
]

const SEARCHES = [
  {
    id: 'staffhelp',
    placeholder: 'Staffhelp for agents only',
    baseUrl: 'https://staffhelp.carelinx.com/en/?q=',
  },
  {
    id: 'advice',
    placeholder: 'Advice for Clients only',
    baseUrl: 'https://advice.carelinx.com/en/?q=',
  },
  {
    id: 'help',
    placeholder: 'Help for Caregivers only',
    baseUrl: 'https://help.carelinx.com/en/?q=',
  },
]

function SearchRow({ config }) {
  const [value, setValue] = useState('')
  const listId = `kb-suggestions-${config.id}`
  const suggestions = useMemo(() => {
    const query = value.trim().toLowerCase()
    if (!query) return COMMON_TERMS.slice(0, 10)
    return COMMON_TERMS.filter((term) => term.toLowerCase().includes(query)).slice(0, 10)
  }, [value])

  const submit = (event) => {
    event.preventDefault()
    const query = value.trim()
    if (!query) return
    window.open(`${config.baseUrl}${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <form className="knowledge-search-row" onSubmit={submit}>
      <input
        type="search"
        list={listId}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={config.placeholder}
        aria-label={config.placeholder}
        autoComplete="off"
      />
      <datalist id={listId}>
        {suggestions.map((term) => <option value={term} key={term} />)}
      </datalist>
      <button type="submit" aria-label={`Search ${config.placeholder}`} title="Search in a new browser tab">
        <Search size={17} />
      </button>
    </form>
  )
}

export function KnowledgeBaseSearch() {
  return (
    <section className="panel knowledge-base-panel" aria-labelledby="knowledge-base-title">
      <div className="panel-heading">
        <div>
          <h2 id="knowledge-base-title">Knowledge Base Search</h2>
          <p className="panel-subtitle">Search the correct CareLinx knowledge base without leaving your notes.</p>
        </div>
      </div>
      <div className="knowledge-search-list">
        {SEARCHES.map((config) => <SearchRow key={config.id} config={config} />)}
      </div>
    </section>
  )
}
