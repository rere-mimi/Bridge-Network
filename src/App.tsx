import { useEffect, useMemo, useState } from 'react'
import { enrichStructuresWithNshm, enrichStructureWithNshm, needsNshmEnrichment } from './data/applySeismicRisk'
import { conditionLabel } from './data/bridges'
import { FACE_LABEL, MATERIAL_LABEL, normalizeMaterial } from './data/defectTypes'
import { summarizeElementDefects } from './data/defectMetrics'
import { structureFromMapBridge } from './data/mapBridgeImport'
import type { NzMapBridge } from './data/nzBridgeCatalogue'
import {
  deleteUserStructure,
  exportDatabaseJson,
  loadStructureDatabase,
  saveUserStructure,
} from './data/structureStore'
import { findSceneNode, buildSceneNodes, type SceneColorMode } from './data/sceneLayout'
import { MiniMap } from './components/MiniMap'
import { ModulePages, resolveActivePage } from './components/ModulePages'
import { HomeLauncher } from './components/HomeLauncher'
import { InspectionActivityPicker } from './components/InspectionActivityPicker'
import { ResizablePanel } from './components/ResizablePanel'
import { TwinViewer } from './components/TwinViewer'
import { WidthResizableAside } from './components/WidthResizableAside'
import { applyRecommendationsToStructure } from './data/recommendations'
import { stampDefectConditionStates } from './data/conditionState'
import { formatMoney } from './data/activityPricing'
import type {
  BridgeAsset,
  BridgeElement,
  DrawnDefect,
  Filters,
  MaintenanceRecommendation,
  PlatformModule,
  SidebarId,
} from './types'
import './App.css'
import { openCrossSectionWindow } from './components/CrossSectionApp'
import { SiteHazardCards, riskDonutStyle } from './components/SiteHazardCards'
import { ModelExchangePanel } from './components/ModelExchangePanel'
const TOP_NAV: Array<{ id: PlatformModule; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'assets', label: 'Assets' },
  { id: 'database', label: 'Database' },
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
  const [showHome, setShowHome] = useState(true)
  const [twinColorMode, setTwinColorMode] = useState<SceneColorMode>('material')
  const [workContext, setWorkContext] = useState<'general' | 'risk' | 'maintenance'>('general')
  const [structures, setStructures] = useState<BridgeAsset[]>(() => loadStructureDatabase())
  const [selectedId, setSelectedId] = useState(() => loadStructureDatabase()[0]?.id ?? '10001')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [viewMode, setViewMode] = useState<'3d' | 'section' | 'map' | 'drawings'>('3d')
  const [selectedPanel, setSelectedPanel] = useState<string | null>('viewer')
  const [drawnDefects, setDrawnDefects] = useState<DrawnDefect[]>([])
  const [draftRecommendations, setDraftRecommendations] = useState<MaintenanceRecommendation[]>(
    [],
  )
  const [isolate, setIsolate] = useState(false)
  const [viewerFullscreen, setViewerFullscreen] = useState(false)
  const [detailsCollapsed, setDetailsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('twin-details-collapsed') === '1'
  })
  const [leftCollapsed, setLeftCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('twin-left-collapsed') === '1'
  })
  const [viewerHeight, setViewerHeight] = useState(() => {
    if (typeof window === 'undefined') return 560
    const saved = window.localStorage.getItem('twin-panel-h:viewer-stage')
    return saved ? Number(saved) || 560 : 560
  })
  const [selectedElement, setSelectedElement] = useState<{
    id: string
    label: string
    element: BridgeElement
  } | null>(null)

  useEffect(() => {
    window.localStorage.setItem('twin-details-collapsed', detailsCollapsed ? '1' : '0')
  }, [detailsCollapsed])

  useEffect(() => {
    window.localStorage.setItem('twin-left-collapsed', leftCollapsed ? '1' : '0')
  }, [leftCollapsed])

  useEffect(() => {
    if (!viewerFullscreen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setViewerFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [viewerFullscreen])

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
    setDrawnDefects(bridge?.drawnDefects ?? [])
    setDraftRecommendations(bridge?.recommendations ?? [])
    setSelectedElement(null)
    setIsolate(false)
  }, [bridge?.id])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const needsLookup = structures.some(needsNshmEnrichment)
      if (!needsLookup) return
      const enriched = await enrichStructuresWithNshm(structures)
      if (!cancelled) setStructures(enriched)
    })()
    return () => {
      cancelled = true
    }
  }, [
    structures
      .map((s) => `${s.id}:${s.lat.toFixed(4)},${s.lng.toFixed(4)}:${needsNshmEnrichment(s) ? '0' : '1'}`)
      .join('|'),
  ])

  const activePage = resolveActivePage(module, sidebar)
  const showOverview = !showHome && activePage === 'overview'

  function goHome() {
    setShowHome(true)
    setSidebar('home')
    setModule('overview')
    setEditingId(null)
    setViewerFullscreen(false)
    setWorkContext('general')
    setTwinColorMode('material')
  }

  function goOverview(structureId?: string) {
    if (structureId) setSelectedId(structureId)
    setShowHome(false)
    setModule('overview')
    setSidebar('home')
    setEditingId(null)
    if (workContext === 'general') setTwinColorMode('material')
  }

  function goModule(id: PlatformModule) {
    setShowHome(false)
    setModule(id)
    setSidebar('home')
    if (id !== 'create-model') setEditingId(null)
    if (id === 'risk') {
      setWorkContext('risk')
      setTwinColorMode('severity')
    } else if (id === 'maintenance' || id === 'costs') {
      setWorkContext('maintenance')
      setTwinColorMode('severity')
    } else if (id === 'inspections' || id === 'overview' || id === 'create-model') {
      setWorkContext('general')
      setTwinColorMode('material')
    }
  }

  function goSidebar(id: SidebarId) {
    if (id === 'home') {
      goHome()
      return
    }
    setShowHome(false)
    setSidebar(id)
    if (id === 'assets') setModule('assets')
    setEditingId(null)
  }

  async function handleSaved(structure: BridgeAsset) {
    const withHazard = await enrichStructureWithNshm(structure)
    const next = saveUserStructure(withHazard)
    const enriched = await enrichStructuresWithNshm(next)
    setStructures(enriched)
    setSelectedId(withHazard.id)
    setEditingId(null)
    goOverview(withHazard.id)
  }

  function handleEdit(id: string) {
    setSelectedId(id)
    setEditingId(id)
    setShowHome(false)
    setModule('create-model')
    setSidebar('home')
  }

  function handleIfcBridgeUpdated(updated: BridgeAsset) {
    const next = saveUserStructure({ ...updated, source: 'user' })
    setStructures(next)
    setSelectedId(updated.id)
  }

  function handleIfcStructureCreated(created: BridgeAsset) {
    const next = saveUserStructure(created)
    setStructures(next)
    setSelectedId(created.id)
    goOverview(created.id)
  }

  function handleUpdateRecommendations(
    bridgeId: string,
    recommendations: MaintenanceRecommendation[],
  ) {
    const target = structures.find((s) => s.id === bridgeId)
    if (!target) return
    const updated = { ...target, recommendations, source: 'user' as const }
    const next = saveUserStructure(updated)
    setStructures(next)
    if (bridgeId === bridge?.id) setDraftRecommendations(recommendations)
  }

  async function handleSaveInspection() {
    if (!bridge) return
    let defects = drawnDefects
    const touchedIds = new Set(defects.map((d) => d.elementId).filter(Boolean) as string[])
    for (const el of bridge.elements) {
      if (!touchedIds.has(el.id)) continue
      const node = findSceneNode(buildSceneNodes(bridge), el.id)
      defects = stampDefectConditionStates(defects, el, node?.sizeM)
    }
    const updated = applyRecommendationsToStructure(bridge, draftRecommendations, defects, {
      inspectionSummary: `Inspection saved · ${draftRecommendations.filter((r) => r.status === 'proposed').length} proposed · est. ${formatMoney(
        draftRecommendations
          .filter((r) => r.status === 'proposed' || r.status === 'approved')
          .reduce((s, r) => s + r.totalCost, 0),
      )}`,
    })
    const withHazard = await enrichStructureWithNshm(updated)
    const next = saveUserStructure(withHazard)
    const enriched = await enrichStructuresWithNshm(next)
    setStructures(enriched)
    setDrawnDefects(withHazard.drawnDefects ?? [])
    setDraftRecommendations(withHazard.recommendations ?? [])
  }

  function handleDatabaseCommit(structure: BridgeAsset) {
    const next = saveUserStructure(structure)
    setStructures(next)
    setSelectedId(structure.id)
  }

  function handleOpenCreateModel() {
    setEditingId(null)
    setShowHome(false)
    setModule('create-model')
    setSidebar('home')
  }

  function handleDelete(id: string) {
    const next = deleteUserStructure(id)
    setStructures(next)
    if (selectedId === id) setSelectedId(next[0]?.id ?? '10001')
  }

  function handleImportMapBridge(mapBridge: NzMapBridge) {
    const existing = structures.map((s) => s.id)
    const created = structureFromMapBridge(mapBridge, existing)
    const next = saveUserStructure(created)
    setStructures(next)
    setSelectedId(created.id)
    goOverview(created.id)
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

  const sceneNodes = useMemo(() => buildSceneNodes(bridge), [bridge])
  const pinnedDrawn = useMemo(
    () =>
      activeElement
        ? drawnDefects.filter((d) => d.elementId === activeElement.element.id)
        : [],
    [activeElement, drawnDefects],
  )
  const defectSummary = useMemo(() => {
    if (!activeElement) return null
    const node = findSceneNode(sceneNodes, activeElement.element.id)
    return summarizeElementDefects(activeElement.element, drawnDefects, node?.sizeM)
  }, [activeElement, drawnDefects, sceneNodes])
  const materialLabel = activeElement?.element.material
    ? MATERIAL_LABEL[normalizeMaterial(activeElement.element.material)]
    : null

  return (
    <div className="twin-app">
      <header className="topbar">
        <button type="button" className="brand" onClick={goHome} title="Home menu">
          <div className="brand-mark" aria-hidden="true">
            ⌁
          </div>
          <div>
            <p className="brand-title">Bridge Network</p>
            <p className="brand-sub">Live BIS · inventory · inspection · risk</p>
          </div>
        </button>

        <nav className="top-nav" aria-label="Primary">
          {TOP_NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                !showHome &&
                ((sidebar === 'home' && module === item.id) ||
                  (sidebar === 'assets' && item.id === 'assets'))
                  ? 'active'
                  : ''
              }
              onClick={() =>
                item.id === 'create-model'
                  ? handleOpenCreateModel()
                  : item.id === 'overview'
                    ? goOverview()
                    : goModule(item.id)
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
              className={
                item.id === 'home'
                  ? showHome
                    ? 'active'
                    : ''
                  : !showHome && sidebar === item.id
                    ? 'active'
                    : ''
              }
              title={item.label}
              onClick={() => goSidebar(item.id)}
            >
              <span>{item.icon}</span>
            </button>
          ))}
        </aside>

        {showHome ? (
          <HomeLauncher
            structures={structures}
            selectedId={bridge.id}
            onSelectStructure={setSelectedId}
            onOpenStructureOverview={(id) => goOverview(id)}
            onOpenModule={goModule}
            onOpenMaps={() => goSidebar('maps')}
            onOpenCreateModel={handleOpenCreateModel}
          />
        ) : !showOverview ? (
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
            onCommitStructure={handleDatabaseCommit}
            onDeleteUserStructure={handleDelete}
            onExportDatabase={handleExport}
            onImportMapBridge={handleImportMapBridge}
            onUpdateRecommendations={handleUpdateRecommendations}
          />
        ) : (
          <>
        <aside className={`left-panel ${leftCollapsed ? 'is-collapsed' : ''}`}>
          {leftCollapsed ? (
            <button
              type="button"
              className="left-panel-expand"
              title="Show network panel"
              onClick={() => setLeftCollapsed(false)}
            >
              »
            </button>
          ) : (
            <>
              <div className="left-panel-toolbar">
                <span>Network</span>
                <button
                  type="button"
                  className="page-btn ghost"
                  title="Collapse network panel for a wider model"
                  onClick={() => setLeftCollapsed(true)}
                >
                  Collapse
                </button>
              </div>
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
            </>
          )}
        </aside>

        <main className={`main-stage ${leftCollapsed ? 'left-is-collapsed' : ''}`}>
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
                  <button
                    type="button"
                    className="page-btn"
                    onClick={() => {
                      setViewMode('3d')
                      setViewerFullscreen(true)
                    }}
                  >
                    Fullscreen 3D
                  </button>
                  <span className={`status status-${bridge.status}`}>{bridge.status}</span>
                </div>
              </div>

              <ModelExchangePanel
                bridge={bridge}
                onBridgeUpdated={handleIfcBridgeUpdated}
                onStructureCreated={handleIfcStructureCreated}
              />

              <ResizablePanel
                className="viewer-panel"
                storageKey="viewer-stage"
                defaultHeight={680}
                minHeight={400}
                maxHeight={typeof window !== 'undefined' ? Math.max(800, window.innerHeight - 80) : 960}
                selected={selectedPanel === 'viewer'}
                onSelect={() => setSelectedPanel('viewer')}
                onHeightChange={setViewerHeight}
              >
                {viewerFullscreen ? (
                  <div className="viewer-fullscreen-placeholder">
                    <p>3D model is open fullscreen</p>
                    <button
                      type="button"
                      className="page-btn primary"
                      onClick={() => setViewerFullscreen(false)}
                    >
                      Exit fullscreen
                    </button>
                  </div>
                ) : (
                  <TwinViewer
                    bridge={bridge}
                    selectedElementId={selectedElement?.id ?? null}
                    onSelectElement={(payload) => {
                      setSelectedElement(payload)
                      setSelectedPanel('element-details')
                      setIsolate(false)
                      if (detailsCollapsed) setDetailsCollapsed(false)
                    }}
                    viewMode={viewMode}
                    onViewMode={setViewMode}
                    height={Math.max(320, viewerHeight - 96)}
                    drawnDefects={drawnDefects}
                    onDrawnDefectsChange={setDrawnDefects}
                    isolate={isolate}
                    onIsolateChange={setIsolate}
                    fullscreen={false}
                    onFullscreenChange={(value) => {
                      if (value) setViewMode('3d')
                      setViewerFullscreen(value)
                    }}
                    colorMode={twinColorMode}
                    onColorModeChange={setTwinColorMode}
                    allowSeverityColor={workContext === 'risk' || workContext === 'maintenance'}
                  />
                )}
              </ResizablePanel>
            </div>

            <WidthResizableAside
              className="right-panel"
              storageKey="details-aside"
              defaultWidth={360}
              minWidth={260}
              maxWidth={640}
              collapsed={detailsCollapsed}
              onCollapsedChange={setDetailsCollapsed}
            >
              <ResizablePanel
                title="Latest inspection photo"
                storageKey="photo"
                defaultHeight={200}
                minHeight={140}
                maxHeight={360}
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
                defaultHeight={420}
                minHeight={240}
                maxHeight={720}
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
                      {bridge.defects.length === 0 && pinnedDrawn.length === 0 && (
                        <li className="empty">No open defects</li>
                      )}
                    </ul>
                    {defectSummary && defectSummary.defectCount > 0 && (
                      <div className="defect-extent-card">
                        <p className="section-label">Defect extent on element</p>
                        <ul className="page-stats compact">
                          <li>
                            Area in defect{' '}
                            <strong>{defectSummary.percentAreaInDefect.toFixed(2)}%</strong>
                          </li>
                          <li>
                            Defect area {defectSummary.equivAreaM2.toFixed(3)} m² /{' '}
                            {defectSummary.referenceAreaM2.toFixed(2)} m²
                          </li>
                          {defectSummary.crackLengthM > 0 && (
                            <li>
                              Cracks {defectSummary.crackLengthM.toFixed(3)} m ·{' '}
                              {defectSummary.crackDensityMPerM2.toFixed(4)} m/m²
                            </li>
                          )}
                          {materialLabel && <li>Material catalogue · {materialLabel}</li>}
                        </ul>
                        <p className="page-note subtle">
                          Provisional condition state (CS 1–4) is estimated from extent until the
                          official severity × extent algorithm is uploaded.
                        </p>
                      </div>
                    )}
                    <InspectionActivityPicker
                      bridge={{ ...bridge, drawnDefects, recommendations: draftRecommendations }}
                      element={activeElement?.element ?? null}
                      recommendations={draftRecommendations}
                      drawnDefectCount={pinnedDrawn.length}
                      sizeM={
                        activeElement
                          ? findSceneNode(sceneNodes, activeElement.element.id)?.sizeM
                          : null
                      }
                      onChange={setDraftRecommendations}
                    />
                    <div className="insp-save-row">
                      <button
                        type="button"
                        className="page-btn primary"
                        onClick={() => void handleSaveInspection()}
                      >
                        Save inspection
                      </button>
                      <span className="muted">
                        {draftRecommendations.length} activities ·{' '}
                        {formatMoney(
                          draftRecommendations
                            .filter((r) => r.status === 'proposed' || r.status === 'approved')
                            .reduce((s, r) => s + r.totalCost, 0),
                        )}
                      </span>
                    </div>
                    {pinnedDrawn.length > 0 && (
                      <>
                        <p className="section-label">Pinned drawn defects</p>
                        <ul className="defect-list">
                          {pinnedDrawn.map((defect) => (
                            <li key={defect.id}>
                              <span
                                className={`sev ${defect.kind === 'crack' ? 'sev-critical' : defect.kind === 'spall' ? 'sev-high' : 'sev-medium'}`}
                              />
                              <div>
                                <strong>{defect.label}</strong>
                                <em>
                                  E{defect.defectCode}
                                  {defect.face ? ` · ${FACE_LABEL[defect.face]}` : ''}
                                  {' · '}
                                  {defect.kind === 'crack'
                                    ? `${(defect.lengthM ?? 0).toFixed(3)} m${
                                        defect.lengthDensityMPerM2 != null
                                          ? ` · ${defect.lengthDensityMPerM2.toFixed(4)} m/m²`
                                          : ''
                                      }`
                                    : `${(defect.areaM2 ?? 0).toFixed(3)} m²`}
                                </em>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                    {drawnDefects.length > pinnedDrawn.length && (
                      <p className="page-note subtle">
                        {drawnDefects.length - pinnedDrawn.length} drawn defect(s) on other
                        elements
                      </p>
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
            </WidthResizableAside>
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
              defaultHeight={420}
              minHeight={220}
              maxHeight={720}
              selected={selectedPanel === 'risk'}
              onSelect={() => setSelectedPanel('risk')}
            >
              <div className="risk-donut-wrap">
                <div
                  className="risk-donut"
                  style={{
                    background: riskDonutStyle(bridge.riskBreakdown),
                  }}
                >
                  <div>
                    <strong>{bridge.riskScore}</strong>
                    <span>risk</span>
                  </div>
                </div>
                <ul>
                  <li>Structural {bridge.riskBreakdown.structural}%</li>
                  <li>Flood {bridge.riskBreakdown.hydraulic}%</li>
                  <li>Earthquake {bridge.riskBreakdown.seismic}%</li>
                  <li>Geology {bridge.riskBreakdown.geology ?? 0}%</li>
                  <li>Traffic {bridge.riskBreakdown.traffic}%</li>
                </ul>
              </div>
              <SiteHazardCards bridge={bridge} />
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

      {viewerFullscreen && showOverview && (
        <div className="viewer-fullscreen-overlay" role="dialog" aria-modal="true" aria-label="Fullscreen 3D model">
          <div className="viewer-fullscreen-bar">
            <div>
              <strong>{bridge.name}</strong>
              <span>
                {bridge.road} · {bridge.region}
              </span>
            </div>
            <button
              type="button"
              className="page-btn primary"
              onClick={() => setViewerFullscreen(false)}
            >
              Exit fullscreen
            </button>
          </div>
          <div className="viewer-fullscreen-stage">
            <TwinViewer
              bridge={bridge}
              selectedElementId={selectedElement?.id ?? null}
              onSelectElement={(payload) => {
                setSelectedElement(payload)
                setIsolate(false)
              }}
              viewMode="3d"
              onViewMode={(mode) => {
                setViewMode(mode)
                if (mode !== '3d') setViewerFullscreen(false)
              }}
              height={typeof window !== 'undefined' ? window.innerHeight - 100 : 800}
              drawnDefects={drawnDefects}
              onDrawnDefectsChange={setDrawnDefects}
              isolate={isolate}
              onIsolateChange={setIsolate}
              fullscreen
              onFullscreenChange={setViewerFullscreen}
              colorMode={twinColorMode}
              onColorModeChange={setTwinColorMode}
              allowSeverityColor={workContext === 'risk' || workContext === 'maintenance'}
            />
          </div>
        </div>
      )}
    </div>
  )
}
