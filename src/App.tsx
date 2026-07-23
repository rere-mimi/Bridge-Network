import { useEffect, useMemo, useState } from 'react'
import { conditionLabel } from './data/bridges'
import {
  deleteUserStructure,
  exportDatabaseJson,
  loadStructureDatabase,
  saveUserStructure,
} from './data/structureStore'
import { MiniMap } from './components/MiniMap'
import { ModulePages, resolveActivePage } from './components/ModulePages'
import { ResizablePanel } from './components/ResizablePanel'
import { TwinViewer } from './components/TwinViewer'
import type { BridgeAsset, BridgeElement, DrawnDefect, Filters, PlatformModule, SidebarId } from './types'
import './App.css'
import { openCrossSectionWindow } from './components/CrossSectionApp'

const TOP_NAV: Array<{ id: PlatformModule; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'assets', label: 'Assets' },
  { id: 'create-model', label: 'Create model' },
  { id: 'inspections', label: 'Inspections' },
  { id: 'condition', label: 'Condition' },
  { id: 'risk', label: 'Risk' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'costs', label: 'Costs' },
  { id: 'reports', label: 'Reports' },
]

const SIDEBAR: Array<{ id: SidebarId; label: string; icon: string }> = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'assets', label: 'Assets', icon: '▦' },
  { id: 'analytics', label: 'Analytics', icon: '◔' },
  { id: 'maps', label: 'Maps', icon: '◎' },
  { id: 'alerts', label: 'Alerts', icon: '⚠' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

const EMPTY_FILTERS: Filters = {
  region: 'all',
  structureType: 'all',
  condition: 'all',
  risk: 'all',
}

export default function App() {
  const [module, setModule] = useState<PlatformModule>('overview')
  const [sidebar, setSidebar] = useState<SidebarId>('home')
  const [structures, setStructures] = useState<BridgeAsset[]>(() => loadStructureDatabase())
  const [selectedId, setSelectedId] = useState(() => loadStructureDatabase()[0]?.id ?? '10001')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [viewMode, setViewMode] = useState<'3d' | 'section' | 'map' | 'drawings'>('3d')
  const [selectedPanel, setSelectedPanel] = useState<string | null>('viewer')
  const [drawnDefects, setDrawnDefects] = useState<DrawnDefect[]>([])
  const [isolate, setIsolate] = useState(false)
  const [viewerHeight, setViewerHeight] = useState(() => {
    if (typeof window === 'undefined') return 420
    const saved = window.localStorage.getItem('twin-panel-h:viewer-stage')
    return saved ? Number(saved) || 420 : 420
  })
  const [selectedElement, setSelectedElement] = useState<{
    id: string
    label: string
    element: BridgeElement
  } | null>(null)

  const filtered = useMemo(() => {
    return structures.filter((b) => {
      if (filters.region !== 'all' && b.region !== filters.region) return false
      if (filters.structureType !== 'all' && b.structureType !== filters.structureType)
        return false
      if (filters.condition !== 'all' && b.conditionBand !== filters.condition) return false
      if (filters.risk !== 'all' && b.riskLevel !== filters.risk) return false
      return true
    })
  }, [filters, structures])

  const bridge = filtered.find((b) => b.id === selectedId) ?? filtered[0] ?? structures[0]

  useEffect(() => {
    setDrawnDefects([])
    setSelectedElement(null)
    setIsolate(false)
  }, [bridge?.id])

  const activePage = resolveActivePage(module, sidebar)
  const showOverview = activePage === 'overview' || activePage === 'home'

  function goOverview() {
    setModule('overview')
    setSidebar('home')
    setEditingId(null)
  }

  function goModule(id: PlatformModule) {
    setModule(id)
    setSidebar('home')
    if (id !== 'create-model') setEditingId(null)
  }

  function goSidebar(id: SidebarId) {
    setSidebar(id)
    if (id === 'home') setModule('overview')
    if (id === 'assets') setModule('assets')
    setEditingId(null)
  }

  function handleSaved(structure: BridgeAsset) {
    const next = saveUserStructure(structure)
    setStructures(next)
    setSelectedId(structure.id)
    setEditingId(null)
    setModule('overview')
    setSidebar('home')
  }

  function handleEdit(id: string) {
    setSelectedId(id)
    setEditingId(id)
    setModule('create-model')
    setSidebar('home')
  }

  function handleOpenCreateModel() {
    setEditingId(null)
    setModule('create-model')
    setSidebar('home')
  }

  function handleDelete(id: string) {
    const next = deleteUserStructure(id)
    setStructures(next)
    if (selectedId === id) setSelectedId(next[0]?.id ?? '10001')
  }

  function handleExport() {
    const blob = new Blob([exportDatabaseJson(structures)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bridge-network-database-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!bridge) {
    return (
      <div className="twin-app">
        <main className="module-page">
          <p>No structures in the database yet.</p>
          <button type="button" className="page-btn primary" onClick={handleOpenCreateModel}>
            Create model
          </button>
        </main>
      </div>
    )
  }

  const regions = [...new Set(structures.map((b) => b.region))]
  const types = [...new Set(structures.map((b) => b.structureType))]

  const preferred =
    bridge.elements.find((e) => e.scheduleNo === 201 && e.id.endsWith('-4')) ??
    bridge.elements.find((e) => e.scheduleNo === 200 || e.scheduleNo === 600 || e.scheduleNo === 601) ??
    bridge.elements.find((e) => e.majorGroup === 'Superstructure' || e.majorGroup === 'Culvert') ??
    bridge.elements[0]

  const activeElement =
    selectedElement ??
    (preferred
      ? {
          id: preferred.id,
          label: preferred.id,
          element: preferred,
        }
      : null)

  const elementDefects = bridge.defects.filter(
    (d) =>
      !activeElement ||
      d.elementCode === activeElement.element.code ||
      d.elementName === activeElement.element.id ||
      d.elementName.includes(activeElement.element.groupId),
  )

  return (
    <div className="twin-app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            ⌁
          </div>
          <div>
            <p className="brand-title">Bridge Asset Digital Twin</p>
            <p className="brand-sub">Live BIS · inventory · inspection · risk</p>
          </div>
        </div>

        <nav className="top-nav" aria-label="Primary">
          {TOP_NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                (sidebar === 'home' && module === item.id) ||
                (sidebar === 'assets' && item.id === 'assets')
                  ? 'active'
                  : ''
              }
              onClick={() =>
                item.id === 'create-model' ? handleOpenCreateModel() : goModule(item.id)
              }
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="top-utils" aria-label="Utilities">
          <button type="button" title="Notifications" onClick={() => goSidebar('alerts')}>
            🔔
          </button>
          <button type="button" title="Help" onClick={() => goSidebar('settings')}>
            ?
          </button>
          <button type="button" title="Settings" onClick={() => goSidebar('settings')}>
            ⚙
          </button>
          <div className="avatar">BN</div>
        </div>
      </header>

      <div className="shell">
        <aside className="icon-rail" aria-label="Shortcut sidebar">
          {SIDEBAR.map((item) => (
            <button
              key={item.id}
              type="button"
              className={sidebar === item.id ? 'active' : ''}
              title={item.label}
              onClick={() => goSidebar(item.id)}
            >
              <span>{item.icon}</span>
            </button>
          ))}
        </aside>

        {!showOverview ? (
          <ModulePages
            module={module}
            sidebar={sidebar}
            bridges={filtered}
            allBridges={structures}
            selectedId={bridge.id}
            editingId={editingId}
            onSelectBridge={setSelectedId}
            onOpenOverview={goOverview}
            onOpenInspections={() => goModule('inspections')}
            onOpenCreateModel={handleOpenCreateModel}
            onEditStructure={handleEdit}
            onSaved={handleSaved}
            onDeleteUserStructure={handleDelete}
            onExportDatabase={handleExport}
          />
        ) : (
          <>
        <aside className="left-panel">
          <ResizablePanel
            title="Network map"
            badge={`${filtered.length} assets`}
            storageKey="network-map"
            defaultHeight={210}
            minHeight={160}
            maxHeight={420}
            selected={selectedPanel === 'network-map'}
            onSelect={() => setSelectedPanel('network-map')}
          >
            <MiniMap
              bridges={filtered}
              selectedId={bridge.id}
              onSelect={(id) => {
                setSelectedId(id)
                setSelectedElement(null)
              }}
            />
          </ResizablePanel>

          <ResizablePanel
            title="Asset filters"
            className="filters"
            storageKey="filters"
            defaultHeight={320}
            minHeight={220}
            maxHeight={520}
            selected={selectedPanel === 'filters'}
            onSelect={() => setSelectedPanel('filters')}
          >
            <label>
              Region
              <select
                value={filters.region}
                onChange={(e) => setFilters((f) => ({ ...f, region: e.target.value }))}
              >
                <option value="all">All regions</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Structure type
              <select
                value={filters.structureType}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, structureType: e.target.value }))
                }
              >
                <option value="all">All types</option>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Condition
              <select
                value={filters.condition}
                onChange={(e) => setFilters((f) => ({ ...f, condition: e.target.value }))}
              >
                <option value="all">All</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
                <option value="critical">Critical</option>
              </select>
            </label>

            <label>
              Risk
              <select
                value={filters.risk}
                onChange={(e) => setFilters((f) => ({ ...f, risk: e.target.value }))}
              >
                <option value="all">All</option>
                <option value="low">Low</option>
                <option value="moderate">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </label>

            <button
              type="button"
              className="reset-btn"
              onClick={() => setFilters(EMPTY_FILTERS)}
            >
              Reset filters
            </button>
          </ResizablePanel>

          <ResizablePanel
            title="Structures"
            className="asset-list"
            storageKey="structures"
            defaultHeight={240}
            minHeight={140}
            maxHeight={480}
            selected={selectedPanel === 'structures'}
            onSelect={() => setSelectedPanel('structures')}
          >
            <ul>
              {filtered.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={item.id === bridge.id ? 'active' : ''}
                    onClick={() => {
                      setSelectedId(item.id)
                      setSelectedElement(null)
                    }}
                  >
                    <strong>
                      {item.name}
                    </strong>
                    <span>
                      {item.region} · {item.kind ?? 'bridge'} · CI {item.conditionIndex}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </ResizablePanel>
        </aside>

        <main className="main-stage">
          <section className="kpi-row">
            <article className="kpi wide">
              <p>Overall condition</p>
              <div className="kpi-main">
                <strong>
                  {bridge.conditionIndex}
                  <em>/100</em>
                </strong>
                <span className={`pill band-${bridge.conditionBand}`}>
                  {conditionLabel(bridge.conditionBand)}
                </span>
              </div>
              <div className="spark">
                {bridge.inspections
                  .slice()
                  .reverse()
                  .map((ins) => (
                    <i key={ins.id} style={{ height: `${ins.score}%` }} />
                  ))}
              </div>
            </article>

            <article className="kpi">
              <p>Risk level</p>
              <strong>
                {bridge.riskLevel === 'moderate' ? 'MEDIUM' : bridge.riskLevel.toUpperCase()}{' '}
                <em>{bridge.riskScore}/100</em>
              </strong>
            </article>

            <article className="kpi">
              <p>Next inspection</p>
              <strong>
                {new Date(bridge.nextInspectionDue).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </strong>
            </article>

            <article className="kpi">
              <p>Remaining service life</p>
              <strong>
                {bridge.remainingLifeYears} <em>Years</em>
              </strong>
            </article>

            <article className="kpi">
              <p>Structure</p>
              <strong className="small">
                {bridge.structureType}
                <em>Built {bridge.yearBuilt}</em>
              </strong>
            </article>
          </section>

          <div className="center-grid">
            <div className="center-primary">
              <div className="selected-heading">
                <div>
                  <p className="eyebrow">
                    {bridge.road} · {bridge.region}
                    {bridge.kind ? ` · ${bridge.kind}` : ''}
                  </p>
                  <h1>{bridge.name}</h1>
                </div>
                <div className="selected-heading-actions">
                  <button type="button" className="page-btn" onClick={() => handleEdit(bridge.id)}>
                    Edit model
                  </button>
                  <span className={`status status-${bridge.status}`}>{bridge.status}</span>
                </div>
              </div>

              <ResizablePanel
                className="viewer-panel"
                storageKey="viewer-stage"
                defaultHeight={460}
                minHeight={280}
                maxHeight={760}
                selected={selectedPanel === 'viewer'}
                onSelect={() => setSelectedPanel('viewer')}
                onHeightChange={setViewerHeight}
              >
                <TwinViewer
                  bridge={bridge}
                  selectedElementId={selectedElement?.id ?? null}
                  onSelectElement={(payload) => {
                    setSelectedElement(payload)
                    setSelectedPanel('element-details')
                    setIsolate(false)
                  }}
                  viewMode={viewMode}
                  onViewMode={setViewMode}
                  height={Math.max(220, viewerHeight - 96)}
                  drawnDefects={drawnDefects}
                  onDrawnDefectsChange={setDrawnDefects}
                  isolate={isolate}
                  onIsolateChange={setIsolate}
                />
              </ResizablePanel>
            </div>

            <aside className="right-panel">
              <ResizablePanel
                title="Latest inspection photo"
                storageKey="photo"
                defaultHeight={220}
                minHeight={160}
                maxHeight={420}
                selected={selectedPanel === 'photo'}
                onSelect={() => setSelectedPanel('photo')}
              >
                <div className="photo-card">
                  <div className="photo-art" aria-hidden="true" />
                  <p>{bridge.photoLabel}</p>
                  <span>{bridge.lastInspection}</span>
                </div>
              </ResizablePanel>

              <ResizablePanel
                title="Element details"
                storageKey="element-details"
                defaultHeight={360}
                minHeight={220}
                maxHeight={640}
                selected={selectedPanel === 'element-details'}
                onSelect={() => setSelectedPanel('element-details')}
              >
                {activeElement && (
                  <div className="element-detail">
                    <h3>{activeElement.element.name}</h3>
                    <p className="element-meta">
                      {activeElement.element.majorGroup} · {activeElement.element.subgroup}
                      {activeElement.element.material ? ` · (${activeElement.element.material})` : ''}
                      {' · '}
                      {activeElement.element.groupId}
                    </p>
                    <p className="element-meta">
                      Appendix C {activeElement.element.code} · {activeElement.element.category}
                    </p>
                    {activeElement.element.description && (
                      <>
                        <p className="section-label">Appendix F description</p>
                        <p className="element-description">
                          {activeElement.element.descriptionTitle
                            ? `${activeElement.element.descriptionTitle}. `
                            : ''}
                          {activeElement.element.description}
                        </p>
                      </>
                    )}
                    <div className="element-actions">
                      <button
                        type="button"
                        className={isolate ? 'page-btn primary' : 'page-btn'}
                        onClick={() => setIsolate((v) => !v)}
                      >
                        {isolate ? 'Isolated' : 'Isolate'}
                      </button>
                      <button
                        type="button"
                        className="page-btn primary"
                        onClick={() => {
                          setIsolate(true)
                          openCrossSectionWindow(bridge.id, activeElement.element.id)
                        }}
                      >
                        2D cross section
                      </button>
                    </div>
                    <div className="mini-kpis">
                      <div>
                        <span>Condition</span>
                        <strong>{activeElement.element.conditionScore}</strong>
                      </div>
                      <div>
                        <span>Risk</span>
                        <strong>{activeElement.element.riskScore}</strong>
                      </div>
                    </div>
                    <p className="section-label">Defects</p>
                    <ul className="defect-list">
                      {(elementDefects.length
                        ? elementDefects
                        : bridge.defects.slice(0, 3)
                      ).map((defect) => (
                        <li key={defect.id}>
                          <span className={`sev sev-${defect.severity}`} />
                          <div>
                            <strong>{defect.title}</strong>
                            <em>
                              {defect.defectCode ? `E${defect.defectCode} · ` : ''}
                              {defect.elementName} · {defect.severity}
                            </em>
                          </div>
                        </li>
                      ))}
                      {bridge.defects.length === 0 && drawnDefects.length === 0 && (
                        <li className="empty">No open defects</li>
                      )}
                    </ul>
                    {drawnDefects.length > 0 && (
                      <>
                        <p className="section-label">Drawn defects</p>
                        <ul className="defect-list">
                          {drawnDefects.map((defect) => (
                            <li key={defect.id}>
                              <span
                                className={`sev ${defect.kind === 'crack' ? 'sev-critical' : defect.kind === 'spall' ? 'sev-high' : 'sev-medium'}`}
                              />
                              <div>
                                <strong>{defect.label}</strong>
                                <em>
                                  E{defect.defectCode}
                                  {' · '}
                                  {defect.kind === 'crack'
                                    ? `${defect.lengthM ?? 0} m`
                                    : `${defect.areaM2 ?? 0} m²`}
                                  {' · '}
                                  {new Date(defect.createdAt).toLocaleTimeString()}
                                </em>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                    <p className="section-label">Documents & records</p>
                    <div className="doc-row">
                      <span>{bridge.documents.drawings} drawings</span>
                      <span>{bridge.documents.reports} reports</span>
                      <span>{bridge.documents.photos} photos</span>
                    </div>
                  </div>
                )}
              </ResizablePanel>
            </aside>
          </div>

          <section className="bottom-grid">
            <ResizablePanel
              title="Condition heat map"
              storageKey="heatmap"
              defaultHeight={200}
              minHeight={140}
              maxHeight={420}
              selected={selectedPanel === 'heatmap'}
              onSelect={() => setSelectedPanel('heatmap')}
            >
              <div className="heat-table">
                {bridge.heatmap.map((row) => (
                  <div key={row.element} className="heat-row">
                    <span>{row.element}</span>
                    <div>
                      {row.spans.map((band, idx) => (
                        <i key={`${row.element}-${idx}`} className={`heat band-${band}`} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ResizablePanel>

            <ResizablePanel
              title="Risk dashboard"
              storageKey="risk"
              defaultHeight={220}
              minHeight={160}
              maxHeight={420}
              selected={selectedPanel === 'risk'}
              onSelect={() => setSelectedPanel('risk')}
            >
              <div className="risk-donut-wrap">
                <div
                  className="risk-donut"
                  style={{
                    background: `conic-gradient(
                      #38bdf8 0 ${bridge.riskBreakdown.structural}%,
                      #22d3ee ${bridge.riskBreakdown.structural}% ${bridge.riskBreakdown.structural + bridge.riskBreakdown.hydraulic}%,
                      #a78bfa ${bridge.riskBreakdown.structural + bridge.riskBreakdown.hydraulic}% ${bridge.riskBreakdown.structural + bridge.riskBreakdown.hydraulic + bridge.riskBreakdown.seismic}%,
                      #f59e0b ${bridge.riskBreakdown.structural + bridge.riskBreakdown.hydraulic + bridge.riskBreakdown.seismic}% ${bridge.riskBreakdown.structural + bridge.riskBreakdown.hydraulic + bridge.riskBreakdown.seismic + bridge.riskBreakdown.traffic}%,
                      #94a3b8 0
                    )`,
                  }}
                >
                  <div>
                    <strong>{bridge.riskScore}</strong>
                    <span>risk</span>
                  </div>
                </div>
                <ul>
                  <li>Structural {bridge.riskBreakdown.structural}%</li>
                  <li>Hydraulic {bridge.riskBreakdown.hydraulic}%</li>
                  <li>Seismic {bridge.riskBreakdown.seismic}%</li>
                  <li>Traffic {bridge.riskBreakdown.traffic}%</li>
                </ul>
              </div>
            </ResizablePanel>

            <ResizablePanel
              title="Maintenance forecast"
              storageKey="forecast"
              defaultHeight={230}
              minHeight={170}
              maxHeight={420}
              selected={selectedPanel === 'forecast'}
              onSelect={() => setSelectedPanel('forecast')}
            >
              <div className="forecast-chart">
                {bridge.maintenanceForecast.map((row) => {
                  const max = Math.max(row.routine, row.rehab, row.replace, 0.1)
                  return (
                    <div key={row.year} className="forecast-col">
                      <div className="bars">
                        <i
                          style={{ height: `${(row.routine / max) * 100}%` }}
                          className="routine"
                        />
                        <i
                          style={{ height: `${(row.rehab / max) * 100}%` }}
                          className="rehab"
                        />
                        <i
                          style={{ height: `${(row.replace / max) * 100}%` }}
                          className="replace"
                        />
                      </div>
                      <span>{row.year}</span>
                    </div>
                  )
                })}
              </div>
              <div className="chart-legend">
                <span>Routine</span>
                <span>Rehab</span>
                <span>Replace</span>
              </div>
            </ResizablePanel>

            <ResizablePanel
              title="Inspection history"
              storageKey="history"
              defaultHeight={220}
              minHeight={150}
              maxHeight={420}
              selected={selectedPanel === 'history'}
              onSelect={() => setSelectedPanel('history')}
            >
              <ul className="history-list">
                {bridge.inspections.map((item) => (
                  <li key={item.id}>
                    <strong>{item.date}</strong>
                    <span>{item.inspector}</span>
                    <em>{item.summary}</em>
                  </li>
                ))}
              </ul>
            </ResizablePanel>

            <ResizablePanel
              title="Recent defects"
              storageKey="defects"
              defaultHeight={220}
              minHeight={150}
              maxHeight={420}
              selected={selectedPanel === 'defects'}
              onSelect={() => setSelectedPanel('defects')}
            >
              <ul className="history-list">
                {bridge.defects.length === 0 && (
                  <li className="empty">No recent defects</li>
                )}
                {bridge.defects.map((defect) => (
                  <li key={defect.id}>
                    <strong>{defect.title}</strong>
                    <span>{defect.status}</span>
                    <em>
                      {defect.elementName} · {defect.date}
                    </em>
                  </li>
                ))}
              </ul>
            </ResizablePanel>

            <ResizablePanel
              title="Location & context"
              storageKey="location"
              defaultHeight={240}
              minHeight={180}
              maxHeight={460}
              selected={selectedPanel === 'location'}
              onSelect={() => setSelectedPanel('location')}
            >
              <MiniMap
                bridges={[bridge]}
                selectedId={bridge.id}
                onSelect={setSelectedId}
                compact={false}
              />
              <div className="location-meta">
                <span>
                  {bridge.lat.toFixed(5)}, {bridge.lng.toFixed(5)}
                </span>
                <span>
                  {bridge.road} · {bridge.city}
                </span>
              </div>
            </ResizablePanel>
          </section>
        </main>
          </>
        )}
      </div>
    </div>
  )
}
