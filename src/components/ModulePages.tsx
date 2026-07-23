import type { ReactNode } from 'react'
import type { BridgeAsset, PlatformModule, SidebarId } from '../types'
import { conditionLabel } from '../data/bridges'
import type { NzMapBridge } from '../data/nzBridgeCatalogue'
import { ModelBuilder } from './ModelBuilder'
import { NzNetworkMap } from './NzNetworkMap'
import { ResizablePanel } from './ResizablePanel'

type ModulePagesProps = {
  module: PlatformModule
  sidebar: SidebarId
  bridges: BridgeAsset[]
  allBridges: BridgeAsset[]
  selectedId: string
  editingId: string | null
  onSelectBridge: (id: string) => void
  onOpenOverview: () => void
  onOpenInspections: () => void
  onOpenCreateModel: () => void
  onEditStructure: (id: string) => void
  onSaved: (structure: BridgeAsset) => void
  onDeleteUserStructure: (id: string) => void
  onExportDatabase: () => void
  onImportMapBridge: (bridge: NzMapBridge) => void
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
  allBridges,
  selectedId,
  editingId,
  onSelectBridge,
  onOpenOverview,
  onOpenInspections,
  onOpenCreateModel,
  onEditStructure,
  onSaved,
  onDeleteUserStructure,
  onExportDatabase,
  onImportMapBridge,
}: ModulePagesProps) {
  const page = resolveActivePage(module, sidebar)
  const bridge = bridges.find((b) => b.id === selectedId) ?? bridges[0] ?? allBridges[0]
  const editingStructure = editingId
    ? allBridges.find((b) => b.id === editingId) ?? null
    : null
  const alerts = bridges.filter(
    (b) =>
      b.riskLevel === 'high' ||
      b.riskLevel === 'critical' ||
      b.status === 'watch' ||
      b.status === 'restricted' ||
      b.status === 'closed',
  )
  const userCount = allBridges.filter((b) => b.source === 'user').length

  if (page === 'overview' || page === 'home') {
    return null
  }

  if (page === 'create-model') {
    return (
      <main className="module-page">
        <ModelBuilder
          key={editingStructure?.id ?? 'new'}
          existingIds={allBridges.map((b) => b.id)}
          initialStructure={editingStructure}
          onSaved={onSaved}
          onCancel={onOpenOverview}
        />
      </main>
    )
  }

  if (!bridge) {
    return (
      <main className="module-page">
        <p>No structures available.</p>
        <button type="button" className="page-btn primary" onClick={onOpenCreateModel}>
          Create model
        </button>
      </main>
    )
  }

  return (
    <main className="module-page">
      {page === 'assets' && (
        <PageShell
          title="Assets"
          subtitle="Structure database — seed network plus models you create from Appendix C."
        >
          <div className="page-toolbar">
            <button type="button" className="page-btn primary" onClick={onOpenCreateModel}>
              Create model
            </button>
            <button type="button" className="page-btn" onClick={onExportDatabase}>
              Export database
            </button>
            <span className="page-toolbar-meta">
              {allBridges.length} structures · {userCount} user-built
            </span>
          </div>
          <div className="page-table-wrap">
            <table className="page-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Kind</th>
                  <th>Source</th>
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
                    <td>
                      <code>{item.id}</code>
                    </td>
                    <td>{item.name}</td>
                    <td>{item.kind ?? 'bridge'}</td>
                    <td>{item.source ?? 'seed'}</td>
                    <td>{item.road}</td>
                    <td>{item.region}</td>
                    <td>{item.structureType}</td>
                    <td>
                      {item.conditionIndex} · {conditionLabel(item.conditionBand)}
                    </td>
                    <td>
                      {item.riskLevel} ({item.riskScore})
                    </td>
                    <td className="page-actions">
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
                      <button
                        type="button"
                        className="page-btn"
                        onClick={() => onEditStructure(item.id)}
                      >
                        Edit
                      </button>
                      {item.source === 'user' && (
                        <button
                          type="button"
                          className="page-btn danger"
                          onClick={() => onDeleteUserStructure(item.id)}
                        >
                          Delete
                        </button>
                      )}
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
          subtitle="Appendix C coded elements by Superstructure / Substructure group."
        >
          <div className="page-kpi-row">
            {bridges.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`page-kpi ${item.id === selectedId ? 'active' : ''}`}
                onClick={() => onSelectBridge(item.id)}
              >
                <span>
                  <code>{item.id}</code> {item.name}
                </span>
                <strong>{item.conditionIndex}</strong>
                <em className={`pill band-${item.conditionBand}`}>
                  {conditionLabel(item.conditionBand)}
                </em>
              </button>
            ))}
          </div>
          <ResizablePanel title={`${bridge.id} · ${bridge.name} elements`} storageKey="cond-el" defaultHeight={420}>
            <div className="page-table-wrap">
              <table className="page-table">
                <thead>
                  <tr>
                    <th>Element ID</th>
                    <th>Group</th>
                    <th>Subgroup</th>
                    <th>Code</th>
                    <th>Element</th>
                    <th>Location</th>
                    <th>Qty</th>
                    <th>Condition</th>
                    <th>Sig</th>
                  </tr>
                </thead>
                <tbody>
                  {[...bridge.elements]
                    .sort((a, b) =>
                      a.majorGroup === b.majorGroup
                        ? a.scheduleNo - b.scheduleNo || a.groupId.localeCompare(b.groupId)
                        : a.majorGroup.localeCompare(b.majorGroup),
                    )
                    .map((el) => (
                      <tr key={el.id}>
                        <td>
                          <code>{el.id}</code>
                        </td>
                        <td>{el.majorGroup}</td>
                        <td>{el.subgroup}</td>
                        <td>{el.code}</td>
                        <td>{el.name}</td>
                        <td>{el.groupId}</td>
                        <td>
                          {el.totalQuantity} {el.unit}
                        </td>
                        <td>{el.conditionScore}</td>
                        <td>{el.significance}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </ResizablePanel>
        </PageShell>
      )}

      {page === 'risk' && (
        <PageShell
          title="Risk"
          subtitle="Risk ranking with NZ NSHM seismic hazard for each structure."
        >
          <div className="page-grid-2">
            <ResizablePanel title="Risk ranking" storageKey="risk-rank" defaultHeight={360}>
              <ul className="page-list">
                {[...bridges]
                  .sort((a, b) => b.riskScore - a.riskScore)
                  .map((item) => (
                    <li key={item.id}>
                      <button type="button" onClick={() => onSelectBridge(item.id)}>
                        <strong>{item.name}</strong>
                        <span>
                          {item.riskLevel} · {item.riskScore}/100
                          {item.seismicHazard
                            ? ` · PGA ${item.seismicHazard.pga.toFixed(2)}g`
                            : ''}
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            </ResizablePanel>
            <ResizablePanel title={`${bridge.name} breakdown`} storageKey="risk-break" defaultHeight={360}>
              <ul className="page-stats">
                <li>Structural {bridge.riskBreakdown.structural}%</li>
                <li>Hydraulic {bridge.riskBreakdown.hydraulic}%</li>
                <li>Seismic {bridge.riskBreakdown.seismic}%</li>
                <li>Traffic {bridge.riskBreakdown.traffic}%</li>
                <li>Other {bridge.riskBreakdown.other}%</li>
              </ul>
              {bridge.seismicHazard ? (
                <div className="nshm-hazard-card compact">
                  <p className="nshm-hazard-label">NZ NSHM (Hazard Maps)</p>
                  <strong>
                    PGA {bridge.seismicHazard.pga.toFixed(2)} g
                    <em>
                      {' '}
                      · 10% in {bridge.seismicHazard.investigationYears} yr · Vs30{' '}
                      {bridge.seismicHazard.vs30} m/s
                    </em>
                  </strong>
                  <p>
                    Site {bridge.lat.toFixed(3)}, {bridge.lng.toFixed(3)}
                    {bridge.seismicHazard.locationName
                      ? ` · ${bridge.seismicHazard.locationName}`
                      : ''}
                    {' · '}
                    {bridge.seismicHazard.source === 'nshm-api'
                      ? bridge.seismicHazard.model
                      : 'regional estimate'}
                  </p>
                  <div className="nshm-hazard-actions">
                    <a
                      className="page-btn primary"
                      href={bridge.seismicHazard.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open Hazard Maps
                    </a>
                    <a
                      className="page-btn"
                      href={bridge.seismicHazard.curvesUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Site curves
                    </a>
                    <button type="button" className="page-btn" onClick={onOpenOverview}>
                      View in twin
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="nshm-hazard-pending">Assessing NSHM seismic hazard…</p>
                  <button type="button" className="page-btn primary" onClick={onOpenOverview}>
                    View in twin
                  </button>
                </>
              )}
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
        <PageShell
          title="Maps"
          subtitle="NZ bridge network in memory · Google Maps basemap · feed into BIS."
        >
          <NzNetworkMap
            inventory={allBridges}
            selectedId={selectedId}
            onSelectInventory={onSelectBridge}
            onImportMapBridge={onImportMapBridge}
            focusBridge={bridge}
          />
          <div className="nshm-hazard-actions" style={{ marginTop: '0.75rem' }}>
            <button type="button" className="page-btn primary" onClick={onOpenOverview}>
              Open selected in twin
            </button>
            {bridge.seismicHazard ? (
              <a
                className="page-btn"
                href={bridge.seismicHazard.mapUrl}
                target="_blank"
                rel="noreferrer"
              >
                NSHM Hazard Maps · PGA {bridge.seismicHazard.pga.toFixed(2)}g
              </a>
            ) : (
              <a
                className="page-btn"
                href="https://nshm.gns.cri.nz/HazardMaps"
                target="_blank"
                rel="noreferrer"
              >
                Open NZ NSHM Hazard Maps
              </a>
            )}
          </div>
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
              <strong>Structure database</strong>
              <span>
                {allBridges.length} total · {userCount} user models stored in this browser
              </span>
            </li>
            <li>
              <strong>NZ map catalogue</strong>
              <span>Named bridges loaded into memory on Maps · Google basemap optional</span>
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
          <div className="page-toolbar">
            <button type="button" className="page-btn primary" onClick={onOpenCreateModel}>
              Create model
            </button>
            <button type="button" className="page-btn" onClick={onExportDatabase}>
              Export database
            </button>
            <button type="button" className="page-btn" onClick={onOpenOverview}>
              Return to overview
            </button>
          </div>
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
