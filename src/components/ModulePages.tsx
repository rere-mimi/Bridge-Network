import type { ReactNode } from 'react'
import type { BridgeAsset, PlatformModule, SidebarId } from '../types'
import { conditionLabel } from '../data/bridges'
import { MiniMap } from './MiniMap'
import { ResizablePanel } from './ResizablePanel'

type ModulePagesProps = {
  module: PlatformModule
  sidebar: SidebarId
  bridges: BridgeAsset[]
  selectedId: string
  onSelectBridge: (id: string) => void
  onOpenOverview: () => void
  onOpenInspections: () => void
}

export function resolveActivePage(
  module: PlatformModule,
  sidebar: SidebarId,
): PlatformModule | SidebarId {
  // Sidebar shortcuts can override to their own pages except home → overview
  if (sidebar === 'home') return module
  if (sidebar === 'assets') return 'assets'
  if (sidebar === 'analytics') return 'analytics'
  if (sidebar === 'maps') return 'maps'
  if (sidebar === 'alerts') return 'alerts'
  if (sidebar === 'settings') return 'settings'
  return module
}

export function ModulePages({
  module,
  sidebar,
  bridges,
  selectedId,
  onSelectBridge,
  onOpenOverview,
  onOpenInspections,
}: ModulePagesProps) {
  const page = resolveActivePage(module, sidebar)
  const bridge = bridges.find((b) => b.id === selectedId) ?? bridges[0]
  const alerts = bridges.filter(
    (b) =>
      b.riskLevel === 'high' ||
      b.riskLevel === 'critical' ||
      b.status === 'watch' ||
      b.status === 'restricted' ||
      b.status === 'closed',
  )

  if (page === 'overview' || page === 'home') {
    return null
  }

  return (
    <main className="module-page">
      {page === 'assets' && (
        <PageShell
          title="Assets"
          subtitle="Bridge inventory register — select a structure to open the digital twin."
        >
          <div className="page-table-wrap">
            <table className="page-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Road</th>
                  <th>Region</th>
                  <th>Type</th>
                  <th>Condition</th>
                  <th>Risk</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {bridges.map((item) => (
                  <tr key={item.id} className={item.id === selectedId ? 'selected' : ''}>
                    <td>{item.name}</td>
                    <td>{item.road}</td>
                    <td>{item.region}</td>
                    <td>{item.structureType}</td>
                    <td>
                      {item.conditionIndex} · {conditionLabel(item.conditionBand)}
                    </td>
                    <td>
                      {item.riskLevel} ({item.riskScore})
                    </td>
                    <td>
                      <button
                        type="button"
                        className="page-btn"
                        onClick={() => {
                          onSelectBridge(item.id)
                          onOpenOverview()
                        }}
                      >
                        Open twin
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PageShell>
      )}

      {page === 'inspections' && (
        <PageShell
          title="Inspections"
          subtitle="Inspection history and due dates across the network."
        >
          <div className="page-grid-2">
            <ResizablePanel title="Due schedule" storageKey="insp-due" defaultHeight={280}>
              <ul className="page-list">
                {bridges.map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => onSelectBridge(item.id)}>
                      <strong>{item.name}</strong>
                      <span>Next due {item.nextInspectionDue}</span>
                      <em>Last {item.lastInspection}</em>
                    </button>
                  </li>
                ))}
              </ul>
            </ResizablePanel>
            <ResizablePanel title={`${bridge.name} history`} storageKey="insp-hist" defaultHeight={280}>
              <ul className="page-list">
                {bridge.inspections.map((ins) => (
                  <li key={ins.id}>
                    <strong>{ins.date}</strong>
                    <span>
                      {ins.inspector} · score {ins.score}
                    </span>
                    <em>{ins.summary}</em>
                  </li>
                ))}
              </ul>
              <button type="button" className="page-btn primary" onClick={onOpenInspections}>
                Continue in twin workspace
              </button>
            </ResizablePanel>
          </div>
        </PageShell>
      )}

      {page === 'condition' && (
        <PageShell
          title="Condition"
          subtitle="Element condition bands and network condition index."
        >
          <div className="page-kpi-row">
            {bridges.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`page-kpi ${item.id === selectedId ? 'active' : ''}`}
                onClick={() => onSelectBridge(item.id)}
              >
                <span>{item.name}</span>
                <strong>{item.conditionIndex}</strong>
                <em className={`pill band-${item.conditionBand}`}>
                  {conditionLabel(item.conditionBand)}
                </em>
              </button>
            ))}
          </div>
          <ResizablePanel title={`${bridge.name} elements`} storageKey="cond-el" defaultHeight={320}>
            <div className="page-table-wrap">
              <table className="page-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Element</th>
                    <th>Condition</th>
                    <th>Band</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {bridge.elements.map((el) => (
                    <tr key={el.code}>
                      <td>
                        <code>{el.code}</code>
                      </td>
                      <td>{el.name}</td>
                      <td>{el.conditionScore}</td>
                      <td>{conditionLabel(el.band)}</td>
                      <td>{el.riskScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ResizablePanel>
        </PageShell>
      )}

      {page === 'risk' && (
        <PageShell title="Risk" subtitle="Risk ranking and category breakdown.">
          <div className="page-grid-2">
            <ResizablePanel title="Risk ranking" storageKey="risk-rank" defaultHeight={320}>
              <ul className="page-list">
                {[...bridges]
                  .sort((a, b) => b.riskScore - a.riskScore)
                  .map((item) => (
                    <li key={item.id}>
                      <button type="button" onClick={() => onSelectBridge(item.id)}>
                        <strong>{item.name}</strong>
                        <span>
                          {item.riskLevel} · {item.riskScore}/100
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            </ResizablePanel>
            <ResizablePanel title={`${bridge.name} breakdown`} storageKey="risk-break" defaultHeight={320}>
              <ul className="page-stats">
                <li>Structural {bridge.riskBreakdown.structural}%</li>
                <li>Hydraulic {bridge.riskBreakdown.hydraulic}%</li>
                <li>Seismic {bridge.riskBreakdown.seismic}%</li>
                <li>Traffic {bridge.riskBreakdown.traffic}%</li>
                <li>Other {bridge.riskBreakdown.other}%</li>
              </ul>
              <button type="button" className="page-btn primary" onClick={onOpenOverview}>
                View in twin
              </button>
            </ResizablePanel>
          </div>
        </PageShell>
      )}

      {page === 'maintenance' && (
        <PageShell
          title="Maintenance"
          subtitle="Programme candidates and forecast envelope."
        >
          <div className="page-grid-2">
            <ResizablePanel title="Candidates" storageKey="maint-cand" defaultHeight={300}>
              <ul className="page-list">
                {alerts.map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => onSelectBridge(item.id)}>
                      <strong>{item.name}</strong>
                      <span>
                        {item.status} · risk {item.riskScore}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </ResizablePanel>
            <ResizablePanel title="Forecast ($M)" storageKey="maint-fc" defaultHeight={300}>
              <div className="page-table-wrap">
                <table className="page-table">
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Routine</th>
                      <th>Rehab</th>
                      <th>Replace</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bridge.maintenanceForecast.map((row) => (
                      <tr key={row.year}>
                        <td>{row.year}</td>
                        <td>{row.routine}</td>
                        <td>{row.rehab}</td>
                        <td>{row.replace}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ResizablePanel>
          </div>
        </PageShell>
      )}

      {page === 'costs' && (
        <PageShell title="Costs" subtitle="Indicative whole-of-life cost view.">
          <div className="page-kpi-row">
            <article className="page-kpi static">
              <span>10-yr routine</span>
              <strong>
                $
                {bridge.maintenanceForecast
                  .reduce((s, r) => s + r.routine, 0)
                  .toFixed(1)}
                M
              </strong>
            </article>
            <article className="page-kpi static">
              <span>10-yr rehab</span>
              <strong>
                $
                {bridge.maintenanceForecast.reduce((s, r) => s + r.rehab, 0).toFixed(1)}M
              </strong>
            </article>
            <article className="page-kpi static">
              <span>Replacement envelope</span>
              <strong>
                $
                {bridge.maintenanceForecast
                  .reduce((s, r) => s + r.replace, 0)
                  .toFixed(1)}
                M
              </strong>
            </article>
          </div>
          <p className="page-note">
            Cost module for {bridge.name}. Open Overview to inspect defects driving spend.
          </p>
          <button type="button" className="page-btn primary" onClick={onOpenOverview}>
            Back to twin overview
          </button>
        </PageShell>
      )}

      {page === 'reports' && (
        <PageShell title="Reports" subtitle="Generate and review BIS outputs.">
          <div className="report-actions">
            {[
              'Element condition summary',
              'Maintenance action list',
              'BMP decision record',
              'Network risk snapshot',
            ].map((label) => (
              <button key={label} type="button" className="report-card-btn">
                <strong>{label}</strong>
                <span>PDF / CSV export ready</span>
              </button>
            ))}
          </div>
        </PageShell>
      )}

      {page === 'analytics' && (
        <PageShell
          title="Analytics"
          subtitle="Network performance snapshot across condition and risk."
        >
          <div className="page-kpi-row">
            <article className="page-kpi static">
              <span>Avg condition</span>
              <strong>
                {Math.round(
                  bridges.reduce((s, b) => s + b.conditionIndex, 0) / bridges.length,
                )}
              </strong>
            </article>
            <article className="page-kpi static">
              <span>Elevated risk</span>
              <strong>{alerts.length}</strong>
            </article>
            <article className="page-kpi static">
              <span>Open defects</span>
              <strong>{bridges.reduce((s, b) => s + b.defects.length, 0)}</strong>
            </article>
          </div>
          <button type="button" className="page-btn primary" onClick={onOpenOverview}>
            Open live twin
          </button>
        </PageShell>
      )}

      {page === 'maps' && (
        <PageShell title="Maps" subtitle="Network map navigation.">
          <div className="maps-page-frame">
            <MiniMap
              bridges={bridges}
              selectedId={selectedId}
              onSelect={onSelectBridge}
              compact={false}
            />
          </div>
          <button type="button" className="page-btn primary" onClick={onOpenOverview}>
            Open selected in twin
          </button>
        </PageShell>
      )}

      {page === 'alerts' && (
        <PageShell title="Alerts" subtitle="Watchlist and restricted assets.">
          <ul className="page-list">
            {alerts.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectBridge(item.id)
                    onOpenOverview()
                  }}
                >
                  <strong>{item.name}</strong>
                  <span>
                    {item.status} · {item.riskLevel} risk · CI {item.conditionIndex}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </PageShell>
      )}

      {page === 'settings' && (
        <PageShell title="Settings" subtitle="Workspace preferences.">
          <ul className="settings-list">
            <li>
              <strong>Units</strong>
              <span>Metres / m²</span>
            </li>
            <li>
              <strong>Default viewer</strong>
              <span>3D Model</span>
            </li>
            <li>
              <strong>Defect tools</strong>
              <span>Crack, spall, patch enabled</span>
            </li>
            <li>
              <strong>Panel sizes</strong>
              <span>Saved in this browser</span>
            </li>
          </ul>
          <button type="button" className="page-btn primary" onClick={onOpenOverview}>
            Return to overview
          </button>
        </PageShell>
      )}
    </main>
  )
}

function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <section className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Module</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </header>
      {children}
    </section>
  )
}
