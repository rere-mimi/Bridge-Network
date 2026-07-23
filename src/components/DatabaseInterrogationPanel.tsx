import { useMemo, useState } from 'react'
import type {
  BridgeAsset,
  BridgeElement,
  ConditionBand,
  DefectRecord,
  InspectionHistoryItem,
  MaintenanceRecommendation,
  OperationalStatus,
  RiskLevel,
} from '../types'
import { STANDARD_ELEMENTS } from '../data/elementSchedule'

export type DatabaseDomain =
  | 'inventory'
  | 'elements'
  | 'inspections'
  | 'defects'
  | 'maintenance'

type DatabaseInterrogationPanelProps = {
  structures: BridgeAsset[]
  selectedId: string
  onSelectStructure: (id: string) => void
  onCommitStructure: (structure: BridgeAsset) => void
  onOpenOverview?: (id: string) => void
}

const DOMAINS: Array<{ id: DatabaseDomain; label: string; blurb: string }> = [
  { id: 'inventory', label: 'Inventory', blurb: 'Structure records — name, ID, spans, type' },
  { id: 'elements', label: 'Elements', blurb: 'Appendix C inventory — type, span, material' },
  { id: 'inspections', label: 'Inspections', blurb: 'Inspection history at source' },
  { id: 'defects', label: 'Defects', blurb: 'Recorded defect register' },
  { id: 'maintenance', label: 'Maintenance', blurb: 'Costed activities & status' },
]

const STATUS_OPTS: OperationalStatus[] = ['operational', 'watch', 'restricted', 'closed']
const RISK_OPTS: RiskLevel[] = ['low', 'moderate', 'high', 'critical']
const BAND_OPTS: ConditionBand[] = ['excellent', 'good', 'fair', 'poor', 'critical']
const SEVERITY_OPTS = ['low', 'medium', 'high', 'critical'] as const
const DEFECT_STATUS_OPTS = ['open', 'monitoring', 'planned', 'closed'] as const
const MAINT_STATUS_OPTS = ['proposed', 'approved', 'completed', 'deferred'] as const

function bandFromScore(score: number): ConditionBand {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 65) return 'fair'
  if (score >= 50) return 'poor'
  return 'critical'
}

function scheduleLabel(no: number): string {
  const hit = STANDARD_ELEMENTS.find((e) => e.no === no)
  return hit ? `${no} · ${hit.name}` : String(no)
}

function cascadeStructureId(structure: BridgeAsset, nextId: string): BridgeAsset {
  const prev = structure.id
  if (prev === nextId) return structure
  return {
    ...structure,
    id: nextId,
    elements: structure.elements.map((el) => ({
      ...el,
      bridgeId: nextId,
      id: el.id.startsWith(`${prev}-`) ? `${nextId}${el.id.slice(prev.length)}` : el.id,
    })),
    defects: structure.defects.map((d) => ({
      ...d,
      elementName: d.elementName.replace(prev, nextId),
    })),
    drawnDefects: (structure.drawnDefects ?? []).map((d) => ({
      ...d,
      elementId: d.elementId?.startsWith(`${prev}-`)
        ? `${nextId}${d.elementId.slice(prev.length)}`
        : d.elementId,
    })),
    recommendations: (structure.recommendations ?? []).map((r) => ({
      ...r,
      elementId: r.elementId.startsWith(`${prev}-`)
        ? `${nextId}${r.elementId.slice(prev.length)}`
        : r.elementId,
    })),
  }
}

export function DatabaseInterrogationPanel({
  structures,
  selectedId,
  onSelectStructure,
  onCommitStructure,
  onOpenOverview,
}: DatabaseInterrogationPanelProps) {
  const [domain, setDomain] = useState<DatabaseDomain>('inventory')
  const [filter, setFilter] = useState('')
  const [structureFilter, setStructureFilter] = useState(selectedId || 'all')
  const [flash, setFlash] = useState<string | null>(null)

  const scopeStructures = useMemo(() => {
    if (structureFilter === 'all') return structures
    return structures.filter((s) => s.id === structureFilter)
  }, [structureFilter, structures])

  function commit(next: BridgeAsset, note?: string) {
    onCommitStructure({ ...next, source: 'user' })
    onSelectStructure(next.id)
    setFlash(note ?? `Saved ${next.id} to local database`)
    window.setTimeout(() => setFlash(null), 2200)
  }

  function patchStructure(id: string, patch: Partial<BridgeAsset>) {
    const current = structures.find((s) => s.id === id)
    if (!current) return
    let next: BridgeAsset = { ...current, ...patch }
    if (patch.id && patch.id !== current.id) {
      const taken = structures.some((s) => s.id === patch.id && s.id !== current.id)
      if (taken) {
        setFlash(`ID ${patch.id} already exists`)
        window.setTimeout(() => setFlash(null), 2200)
        return
      }
      next = cascadeStructureId({ ...current, ...patch, id: current.id }, patch.id)
      if (structureFilter === current.id) setStructureFilter(patch.id)
    }
    if (typeof patch.conditionIndex === 'number') {
      next.conditionBand = bandFromScore(patch.conditionIndex)
    }
    commit(next)
  }

  function patchElement(bridgeId: string, elementId: string, patch: Partial<BridgeElement>) {
    const current = structures.find((s) => s.id === bridgeId)
    if (!current) return
    const elements = current.elements.map((el) => {
      if (el.id !== elementId) return el
      const merged = { ...el, ...patch }
      if (typeof patch.conditionScore === 'number') {
        merged.band = bandFromScore(patch.conditionScore)
      }
      if (typeof patch.scheduleNo === 'number') {
        const std = STANDARD_ELEMENTS.find((e) => e.no === patch.scheduleNo)
        if (std) {
          merged.code = String(std.no).padStart(3, '0')
          merged.category = std.category
          if (!patch.name) merged.name = std.name
        }
      }
      return merged
    })
    commit({ ...current, elements }, `Element ${elementId} updated`)
  }

  function patchInspection(
    bridgeId: string,
    inspectionId: string,
    patch: Partial<InspectionHistoryItem>,
  ) {
    const current = structures.find((s) => s.id === bridgeId)
    if (!current) return
    const inspections = current.inspections.map((item) =>
      item.id === inspectionId ? { ...item, ...patch } : item,
    )
    commit({ ...current, inspections }, `Inspection ${inspectionId} updated`)
  }

  function patchDefect(bridgeId: string, defectId: string, patch: Partial<DefectRecord>) {
    const current = structures.find((s) => s.id === bridgeId)
    if (!current) return
    const defects = current.defects.map((item) =>
      item.id === defectId ? { ...item, ...patch } : item,
    )
    commit({ ...current, defects }, `Defect ${defectId} updated`)
  }

  function patchMaintenance(
    bridgeId: string,
    recId: string,
    patch: Partial<MaintenanceRecommendation>,
  ) {
    const current = structures.find((s) => s.id === bridgeId)
    if (!current) return
    const recommendations = (current.recommendations ?? []).map((item) => {
      if (item.id !== recId) return item
      const merged = { ...item, ...patch }
      if (patch.quantity != null || patch.unitPrice != null) {
        merged.totalCost = Number((merged.quantity * merged.unitPrice).toFixed(2))
      }
      return merged
    })
    commit({ ...current, recommendations }, `Maintenance ${recId} updated`)
  }

  const inventoryRows = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return scopeStructures.filter((s) => {
      if (!q) return true
      return `${s.id} ${s.name} ${s.road} ${s.region} ${s.structureType}`.toLowerCase().includes(q)
    })
  }, [filter, scopeStructures])

  const elementRows = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return scopeStructures.flatMap((s) =>
      s.elements
        .filter((el) => {
          if (!q) return true
          return `${el.id} ${el.name} ${el.scheduleNo} ${el.groupId} ${el.material ?? ''} ${el.category}`
            .toLowerCase()
            .includes(q)
        })
        .map((el) => ({ bridge: s, el })),
    )
  }, [filter, scopeStructures])

  const inspectionRows = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return scopeStructures.flatMap((s) =>
      s.inspections
        .filter((item) => {
          if (!q) return true
          return `${item.id} ${item.inspector} ${item.summary} ${item.date}`
            .toLowerCase()
            .includes(q)
        })
        .map((item) => ({ bridge: s, item })),
    )
  }, [filter, scopeStructures])

  const defectRows = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return scopeStructures.flatMap((s) =>
      s.defects
        .filter((item) => {
          if (!q) return true
          return `${item.id} ${item.title} ${item.elementName} ${item.defectCode ?? ''} ${item.severity}`
            .toLowerCase()
            .includes(q)
        })
        .map((item) => ({ bridge: s, item })),
    )
  }, [filter, scopeStructures])

  const maintenanceRows = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return scopeStructures.flatMap((s) =>
      (s.recommendations ?? [])
        .filter((item) => {
          if (!q) return true
          return `${item.id} ${item.activityCode} ${item.activityDescription} ${item.elementName} ${item.status}`
            .toLowerCase()
            .includes(q)
        })
        .map((item) => ({ bridge: s, item })),
    )
  }, [filter, scopeStructures])

  return (
    <section className="db-panel">
      <header className="db-panel-header">
        <div>
          <p className="eyebrow">Source database</p>
          <h1>Interrogate & edit</h1>
          <p>
            Browse inventory, elements, inspections, defects, and maintenance — edit fields
            directly; changes write to the local structure database (user override at source).
          </p>
        </div>
        {flash && <p className="db-flash">{flash}</p>}
      </header>

      <div className="db-toolbar">
        <div className="db-domain-tabs" role="tablist" aria-label="Database domains">
          {DOMAINS.map((d) => (
            <button
              key={d.id}
              type="button"
              role="tab"
              aria-selected={domain === d.id}
              className={domain === d.id ? 'active' : ''}
              title={d.blurb}
              onClick={() => setDomain(d.id)}
            >
              {d.label}
            </button>
          ))}
        </div>

        <label className="db-field">
          Structure
          <select
            value={structureFilter}
            onChange={(e) => {
              setStructureFilter(e.target.value)
              if (e.target.value !== 'all') onSelectStructure(e.target.value)
            }}
          >
            <option value="all">All structures</option>
            {structures.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} · {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="db-field grow">
          Filter rows
          <input
            type="search"
            value={filter}
            placeholder="Name, ID, span, element type…"
            onChange={(e) => setFilter(e.target.value)}
          />
        </label>

        {structureFilter !== 'all' && onOpenOverview && (
          <button
            type="button"
            className="page-btn"
            onClick={() => onOpenOverview(structureFilter)}
          >
            Open twin
          </button>
        )}
      </div>

      <p className="db-domain-note">{DOMAINS.find((d) => d.id === domain)?.blurb}</p>

      <div className="db-table-wrap">
        {domain === 'inventory' && (
          <table className="db-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Road</th>
                <th>Region</th>
                <th>Spans</th>
                <th>Length (m)</th>
                <th>Width (m)</th>
                <th>Type</th>
                <th>Material</th>
                <th>Status</th>
                <th>CI</th>
                <th>Risk</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {inventoryRows.map((s) => (
                <tr key={s.id} className={s.id === selectedId ? 'selected' : ''}>
                  <td>
                    <input
                      className="db-cell mono"
                      defaultValue={s.id}
                      key={`${s.id}-id`}
                      onBlur={(e) => {
                        const v = e.target.value.trim()
                        if (v && v !== s.id) patchStructure(s.id, { id: v })
                      }}
                    />
                  </td>
                  <td>
                    <input
                      className="db-cell"
                      defaultValue={s.name}
                      key={`${s.id}-name`}
                      onBlur={(e) => {
                        const v = e.target.value.trim()
                        if (v && v !== s.name) patchStructure(s.id, { name: v })
                      }}
                    />
                  </td>
                  <td>
                    <input
                      className="db-cell"
                      defaultValue={s.road}
                      key={`${s.id}-road`}
                      onBlur={(e) => {
                        if (e.target.value !== s.road) patchStructure(s.id, { road: e.target.value })
                      }}
                    />
                  </td>
                  <td>
                    <input
                      className="db-cell"
                      defaultValue={s.region}
                      key={`${s.id}-region`}
                      onBlur={(e) => {
                        if (e.target.value !== s.region)
                          patchStructure(s.id, { region: e.target.value })
                      }}
                    />
                  </td>
                  <td>
                    <input
                      className="db-cell num"
                      type="number"
                      min={1}
                      defaultValue={s.spans}
                      key={`${s.id}-spans`}
                      onBlur={(e) => {
                        const v = Math.max(1, Number(e.target.value) || 1)
                        if (v !== s.spans) patchStructure(s.id, { spans: v })
                      }}
                    />
                  </td>
                  <td>
                    <input
                      className="db-cell num"
                      type="number"
                      step="0.1"
                      defaultValue={s.lengthM}
                      key={`${s.id}-len`}
                      onBlur={(e) => {
                        const v = Number(e.target.value) || s.lengthM
                        if (v !== s.lengthM) patchStructure(s.id, { lengthM: v })
                      }}
                    />
                  </td>
                  <td>
                    <input
                      className="db-cell num"
                      type="number"
                      step="0.1"
                      defaultValue={s.deckWidthM ?? 12}
                      key={`${s.id}-w`}
                      onBlur={(e) => {
                        const v = Number(e.target.value) || 12
                        if (v !== (s.deckWidthM ?? 12)) patchStructure(s.id, { deckWidthM: v })
                      }}
                    />
                  </td>
                  <td>
                    <input
                      className="db-cell"
                      defaultValue={s.structureType}
                      key={`${s.id}-type`}
                      onBlur={(e) => {
                        if (e.target.value !== s.structureType)
                          patchStructure(s.id, { structureType: e.target.value })
                      }}
                    />
                  </td>
                  <td>
                    <input
                      className="db-cell"
                      defaultValue={s.material}
                      key={`${s.id}-mat`}
                      onBlur={(e) => {
                        if (e.target.value !== s.material)
                          patchStructure(s.id, { material: e.target.value })
                      }}
                    />
                  </td>
                  <td>
                    <select
                      className="db-cell"
                      value={s.status}
                      onChange={(e) =>
                        patchStructure(s.id, { status: e.target.value as OperationalStatus })
                      }
                    >
                      {STATUS_OPTS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="db-cell num"
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={s.conditionIndex}
                      key={`${s.id}-ci`}
                      onBlur={(e) => {
                        const v = Math.max(0, Math.min(100, Number(e.target.value) || 0))
                        if (v !== s.conditionIndex) patchStructure(s.id, { conditionIndex: v })
                      }}
                    />
                  </td>
                  <td>
                    <select
                      className="db-cell"
                      value={s.riskLevel}
                      onChange={(e) =>
                        patchStructure(s.id, { riskLevel: e.target.value as RiskLevel })
                      }
                    >
                      {RISK_OPTS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="mono muted">{s.source ?? 'seed'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {domain === 'elements' && (
          <table className="db-table">
            <thead>
              <tr>
                <th>Structure</th>
                <th>Element ID</th>
                <th>Name</th>
                <th>Type (sched.)</th>
                <th>Span / group</th>
                <th>Location</th>
                <th>Material</th>
                <th>Qty</th>
                <th>CI</th>
                <th>Band</th>
              </tr>
            </thead>
            <tbody>
              {elementRows.map(({ bridge, el }) => (
                <tr key={el.id}>
                  <td className="mono">{bridge.id}</td>
                  <td className="mono muted">{el.id}</td>
                  <td>
                    <input
                      className="db-cell"
                      defaultValue={el.name}
                      key={`${el.id}-name`}
                      onBlur={(e) => {
                        if (e.target.value !== el.name)
                          patchElement(bridge.id, el.id, { name: e.target.value })
                      }}
                    />
                  </td>
                  <td>
                    <select
                      className="db-cell"
                      value={el.scheduleNo}
                      title={scheduleLabel(el.scheduleNo)}
                      onChange={(e) =>
                        patchElement(bridge.id, el.id, {
                          scheduleNo: Number(e.target.value),
                        })
                      }
                    >
                      {STANDARD_ELEMENTS.map((std) => (
                        <option key={std.no} value={std.no}>
                          {std.no} · {std.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="db-cell mono"
                      defaultValue={el.groupId}
                      key={`${el.id}-gid`}
                      onBlur={(e) => {
                        if (e.target.value !== el.groupId)
                          patchElement(bridge.id, el.id, { groupId: e.target.value })
                      }}
                    />
                  </td>
                  <td>
                    <select
                      className="db-cell"
                      value={el.group}
                      onChange={(e) =>
                        patchElement(bridge.id, el.id, {
                          group: e.target.value as BridgeElement['group'],
                        })
                      }
                    >
                      {(['span', 'pier', 'abutment', 'approach'] as const).map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="db-cell"
                      value={el.material ?? 'C'}
                      onChange={(e) =>
                        patchElement(bridge.id, el.id, {
                          material: e.target.value as BridgeElement['material'],
                        })
                      }
                    >
                      {(['C', 'S', 'P', 'T', 'M', 'O'] as const).map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="db-cell num"
                      type="number"
                      step="0.1"
                      defaultValue={el.totalQuantity}
                      key={`${el.id}-qty`}
                      onBlur={(e) => {
                        const v = Number(e.target.value) || 0
                        if (v !== el.totalQuantity)
                          patchElement(bridge.id, el.id, { totalQuantity: v })
                      }}
                    />
                  </td>
                  <td>
                    <input
                      className="db-cell num"
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={el.conditionScore}
                      key={`${el.id}-ci`}
                      onBlur={(e) => {
                        const v = Math.max(0, Math.min(100, Number(e.target.value) || 0))
                        if (v !== el.conditionScore)
                          patchElement(bridge.id, el.id, { conditionScore: v })
                      }}
                    />
                  </td>
                  <td>
                    <select
                      className="db-cell"
                      value={el.band}
                      onChange={(e) =>
                        patchElement(bridge.id, el.id, {
                          band: e.target.value as ConditionBand,
                        })
                      }
                    >
                      {BAND_OPTS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {domain === 'inspections' && (
          <table className="db-table">
            <thead>
              <tr>
                <th>Structure</th>
                <th>Inspection ID</th>
                <th>Date</th>
                <th>Inspector</th>
                <th>Summary</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {inspectionRows.map(({ bridge, item }) => (
                <tr key={`${bridge.id}-${item.id}`}>
                  <td className="mono">{bridge.id}</td>
                  <td className="mono muted">{item.id}</td>
                  <td>
                    <input
                      className="db-cell"
                      type="date"
                      defaultValue={item.date.slice(0, 10)}
                      key={`${item.id}-date`}
                      onBlur={(e) => {
                        if (e.target.value !== item.date.slice(0, 10))
                          patchInspection(bridge.id, item.id, { date: e.target.value })
                      }}
                    />
                  </td>
                  <td>
                    <input
                      className="db-cell"
                      defaultValue={item.inspector}
                      key={`${item.id}-insp`}
                      onBlur={(e) => {
                        if (e.target.value !== item.inspector)
                          patchInspection(bridge.id, item.id, { inspector: e.target.value })
                      }}
                    />
                  </td>
                  <td>
                    <input
                      className="db-cell wide"
                      defaultValue={item.summary}
                      key={`${item.id}-sum`}
                      onBlur={(e) => {
                        if (e.target.value !== item.summary)
                          patchInspection(bridge.id, item.id, { summary: e.target.value })
                      }}
                    />
                  </td>
                  <td>
                    <input
                      className="db-cell num"
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={item.score}
                      key={`${item.id}-score`}
                      onBlur={(e) => {
                        const v = Math.max(0, Math.min(100, Number(e.target.value) || 0))
                        if (v !== item.score) patchInspection(bridge.id, item.id, { score: v })
                      }}
                    />
                  </td>
                </tr>
              ))}
              {inspectionRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">
                    No inspection rows in scope.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {domain === 'defects' && (
          <table className="db-table">
            <thead>
              <tr>
                <th>Structure</th>
                <th>Defect ID</th>
                <th>Title</th>
                <th>Element</th>
                <th>Code</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {defectRows.map(({ bridge, item }) => (
                <tr key={`${bridge.id}-${item.id}`}>
                  <td className="mono">{bridge.id}</td>
                  <td className="mono muted">{item.id}</td>
                  <td>
                    <input
                      className="db-cell wide"
                      defaultValue={item.title}
                      key={`${item.id}-title`}
                      onBlur={(e) => {
                        if (e.target.value !== item.title)
                          patchDefect(bridge.id, item.id, { title: e.target.value })
                      }}
                    />
                  </td>
                  <td>
                    <input
                      className="db-cell"
                      defaultValue={item.elementName}
                      key={`${item.id}-el`}
                      onBlur={(e) => {
                        if (e.target.value !== item.elementName)
                          patchDefect(bridge.id, item.id, { elementName: e.target.value })
                      }}
                    />
                  </td>
                  <td>
                    <input
                      className="db-cell mono"
                      defaultValue={item.defectCode ?? ''}
                      key={`${item.id}-code`}
                      onBlur={(e) => {
                        const v = e.target.value.trim() || undefined
                        if (v !== item.defectCode)
                          patchDefect(bridge.id, item.id, { defectCode: v })
                      }}
                    />
                  </td>
                  <td>
                    <select
                      className="db-cell"
                      value={item.severity}
                      onChange={(e) =>
                        patchDefect(bridge.id, item.id, {
                          severity: e.target.value as DefectRecord['severity'],
                        })
                      }
                    >
                      {SEVERITY_OPTS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="db-cell"
                      value={item.status}
                      onChange={(e) =>
                        patchDefect(bridge.id, item.id, {
                          status: e.target.value as DefectRecord['status'],
                        })
                      }
                    >
                      {DEFECT_STATUS_OPTS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="db-cell"
                      type="date"
                      defaultValue={item.date.slice(0, 10)}
                      key={`${item.id}-date`}
                      onBlur={(e) => {
                        if (e.target.value !== item.date.slice(0, 10))
                          patchDefect(bridge.id, item.id, { date: e.target.value })
                      }}
                    />
                  </td>
                </tr>
              ))}
              {defectRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="muted">
                    No defect rows in scope.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {domain === 'maintenance' && (
          <table className="db-table">
            <thead>
              <tr>
                <th>Structure</th>
                <th>Activity</th>
                <th>Description</th>
                <th>Element</th>
                <th>Span</th>
                <th>Qty</th>
                <th>Unit $</th>
                <th>Total $</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {maintenanceRows.map(({ bridge, item }) => (
                <tr key={`${bridge.id}-${item.id}`}>
                  <td className="mono">{bridge.id}</td>
                  <td className="mono">{item.activityCode}</td>
                  <td>
                    <input
                      className="db-cell wide"
                      defaultValue={item.activityDescription}
                      key={`${item.id}-desc`}
                      onBlur={(e) => {
                        if (e.target.value !== item.activityDescription)
                          patchMaintenance(bridge.id, item.id, {
                            activityDescription: e.target.value,
                          })
                      }}
                    />
                  </td>
                  <td>
                    <input
                      className="db-cell"
                      defaultValue={item.elementName}
                      key={`${item.id}-el`}
                      onBlur={(e) => {
                        if (e.target.value !== item.elementName)
                          patchMaintenance(bridge.id, item.id, { elementName: e.target.value })
                      }}
                    />
                  </td>
                  <td>
                    <input
                      className="db-cell mono"
                      defaultValue={item.groupId}
                      key={`${item.id}-gid`}
                      onBlur={(e) => {
                        if (e.target.value !== item.groupId)
                          patchMaintenance(bridge.id, item.id, { groupId: e.target.value })
                      }}
                    />
                  </td>
                  <td>
                    <input
                      className="db-cell num"
                      type="number"
                      step="0.01"
                      defaultValue={item.quantity}
                      key={`${item.id}-qty`}
                      onBlur={(e) => {
                        const v = Number(e.target.value) || 0
                        if (v !== item.quantity)
                          patchMaintenance(bridge.id, item.id, { quantity: v })
                      }}
                    />
                  </td>
                  <td>
                    <input
                      className="db-cell num"
                      type="number"
                      step="0.01"
                      defaultValue={item.unitPrice}
                      key={`${item.id}-up`}
                      onBlur={(e) => {
                        const v = Number(e.target.value) || 0
                        if (v !== item.unitPrice)
                          patchMaintenance(bridge.id, item.id, { unitPrice: v })
                      }}
                    />
                  </td>
                  <td className="mono">{item.totalCost.toFixed(2)}</td>
                  <td>
                    <select
                      className="db-cell"
                      value={item.status}
                      onChange={(e) =>
                        patchMaintenance(bridge.id, item.id, {
                          status: e.target.value as MaintenanceRecommendation['status'],
                        })
                      }
                    >
                      {MAINT_STATUS_OPTS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {maintenanceRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="muted">
                    No maintenance rows in scope — save an inspection with activities first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <p className="db-footnote">
        Edits blur-save to the browser database. Seed structures become user overrides when
        changed. Changing a structure ID cascades to linked element IDs.
      </p>
    </section>
  )
}
