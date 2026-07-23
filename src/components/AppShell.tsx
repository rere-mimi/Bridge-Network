import type { ReactNode } from 'react'
import type { LiveMetrics, PlatformView } from '../types'

const NAV_ITEMS: Array<{ id: PlatformView; label: string; horizon: 'now' | 'later' }> = [
  { id: 'overview', label: 'Live map', horizon: 'now' },
  { id: 'inventory', label: 'Inventory', horizon: 'now' },
  { id: 'inspection', label: 'Inspection', horizon: 'now' },
  { id: 'condition', label: 'Condition', horizon: 'now' },
  { id: 'risk', label: 'Risk models', horizon: 'now' },
  { id: 'twin', label: 'Digital twin', horizon: 'now' },
  { id: 'planning', label: 'Lifecycle & planning', horizon: 'later' },
]

type ShellProps = {
  view: PlatformView
  onViewChange: (view: PlatformView) => void
  clock: Date
  metrics: LiveMetrics
  children: ReactNode
}

export function AppShell({ view, onViewChange, clock, metrics, children }: ShellProps) {
  const stamp = clock.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <div className="dashboard">
      <div className="atmosphere" aria-hidden="true" />

      <header className="app-header">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="currentColor" />
              <path
                d="M8 23h7l2.5-7 4.5 14 2.5-7H32"
                stroke="#E8F6F2"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="20" cy="12" r="2.4" fill="#F0A202" />
            </svg>
          </div>
          <div className="brand-text">
            <p className="brand-name">Bridge Network</p>
            <p className="brand-tag">Live Bridge Information System</p>
          </div>
        </div>

        <div className="header-meta">
          <span className="live-chip large">
            <span className="live-dot" aria-hidden="true" />
            Live
          </span>
          <time dateTime={clock.toISOString()}>{stamp}</time>
        </div>
      </header>

      <nav className="platform-nav" aria-label="Platform modules">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={view === item.id ? 'nav-item active' : 'nav-item'}
            onClick={() => onViewChange(item.id)}
          >
            <span>{item.label}</span>
            {item.horizon === 'later' && <em>Longer term</em>}
          </button>
        ))}
      </nav>

      <section className="mission-banner" aria-label="Platform objective">
        <div>
          <p className="mission-kicker">Live BIS platform</p>
          <h1>
            Bridge inventory, inspection, condition, risk & digital twin — in one place
          </h1>
          <p>
            Short term: operational BIS data. Longer term: lifecycle forecasting and
            maintenance planning as inspection history grows.
          </p>
        </div>
        <div className="mission-steps" aria-hidden="true">
          <span>1 Elements</span>
          <span>2 Quantities</span>
          <span>3 BIS entry</span>
          <span>4 Inspect</span>
          <span>5 BMP</span>
          <span>6 BIS data</span>
          <span>7 Reports</span>
        </div>
      </section>

      <section className="metrics-bar" aria-label="Network metrics">
        <article className="metric-tile">
          <p className="metric-label">Inventory</p>
          <p className="metric-value">{metrics.totalBridges}</p>
          <p className="metric-hint">bridges tracked</p>
        </article>
        <article className="metric-tile">
          <p className="metric-label">Operational</p>
          <p className="metric-value">{metrics.operational}</p>
          <p className="metric-hint">open to traffic</p>
        </article>
        <article className="metric-tile">
          <p className="metric-label">Avg condition</p>
          <p className="metric-value">{metrics.avgCondition}</p>
          <p className="metric-hint">network CI</p>
        </article>
        <article className="metric-tile">
          <p className="metric-label">Open inspections</p>
          <p className="metric-value">{metrics.openInspections}</p>
          <p className="metric-hint">active BIS workflows</p>
        </article>
        <article className="metric-tile">
          <p className="metric-label">Elevated risk</p>
          <p className="metric-value">{metrics.highRisk}</p>
          <p className="metric-hint">high / critical</p>
        </article>
      </section>

      <div className="platform-body">{children}</div>
    </div>
  )
}
