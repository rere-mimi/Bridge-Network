import { useMemo, useRef, useState } from 'react'
import type {
  BridgeAsset,
  InspectionMandate,
  InspectionMandateStatus,
  InspectionSessionMode,
} from '../types'
import {
  addStructuresToMandate,
  createMandate,
  deleteMandate,
  loadMandates,
  markMandateItemVisited,
  removeStructureFromMandate,
  reorderMandateItem,
  saveMandate,
  setMandateStatus,
} from '../data/mandateStore'
import { parseStructureIdsFromCsv, resolveStructureIds } from '../data/parseStructureIds'
import {
  MandateFieldMap,
} from './MandateFieldMap'
import { googleMapsDirectionsUrl } from '../data/googleMaps'

type MandateTab = 'plan' | 'field'

type InspectionMandatePanelProps = {
  inventory: BridgeAsset[]
  selectedStructureId: string
  onSelectStructure: (id: string) => void
  onOpenTwin: (structureId?: string, options?: { inspectionMode?: InspectionSessionMode }) => void
}

const STATUS_OPTIONS: InspectionMandateStatus[] = [
  'draft',
  'active',
  'completed',
  'archived',
]

export function InspectionMandatePanel({
  inventory,
  selectedStructureId,
  onSelectStructure,
  onOpenTwin,
}: InspectionMandatePanelProps) {
  const [mandates, setMandates] = useState<InspectionMandate[]>(() => loadMandates())
  const [activeMandateId, setActiveMandateId] = useState<string | null>(
    () => loadMandates()[0]?.id ?? null,
  )
  const [tab, setTab] = useState<MandateTab>('plan')
  const [title, setTitle] = useState('Network inspection run')
  const [createdBy, setCreatedBy] = useState('Project manager')
  const [dueDate, setDueDate] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [selectQuery, setSelectQuery] = useState('')
  const [pickedIds, setPickedIds] = useState<string[]>([])
  const [feedback, setFeedback] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const active = mandates.find((m) => m.id === activeMandateId) ?? null

  const mandateBridges = useMemo(() => {
    if (!active) return [] as BridgeAsset[]
    const byId = new Map(inventory.map((b) => [b.id, b]))
    return active.items
      .map((item) => byId.get(item.structureId))
      .filter((b): b is BridgeAsset => Boolean(b))
  }, [active, inventory])

  const selectable = useMemo(() => {
    const q = selectQuery.trim().toLowerCase()
    const inMandate = new Set(active?.items.map((i) => i.structureId) ?? [])
    return inventory
      .filter((b) => !inMandate.has(b.id))
      .filter((b) => {
        if (!q) return true
        const hay = `${b.id} ${b.name} ${b.road} ${b.region} ${b.city}`.toLowerCase()
        return hay.includes(q)
      })
      .slice(0, 40)
  }, [inventory, active, selectQuery])

  function refresh(nextId?: string | null) {
    const next = loadMandates()
    setMandates(next)
    if (nextId !== undefined) {
      setActiveMandateId(nextId)
    } else if (activeMandateId && !next.some((m) => m.id === activeMandateId)) {
      setActiveMandateId(next[0]?.id ?? null)
    }
  }

  function handleCreate() {
    const mandate = createMandate({
      title,
      createdBy,
      dueDate: dueDate || undefined,
    })
    refresh(mandate.id)
    setFeedback(`Created mandate ${mandate.id}`)
    setTab('plan')
  }

  function applyResolvedIds(ids: string[], sourceLabel: string) {
    if (!active) {
      setFeedback('Create or select a mandate first.')
      return
    }
    const { matched, missing, parsed } = resolveStructureIds(ids.join('\n'), inventory)
    if (parsed.length === 0) {
      setFeedback(`No 5-digit structure IDs found in ${sourceLabel}.`)
      return
    }
    const before = new Set(active.items.map((i) => i.structureId))
    const toAdd = matched.filter((b) => !before.has(b.id))
    addStructuresToMandate(
      active.id,
      matched.map((b) => b.id),
    )
    refresh(active.id)
    const parts = [
      `${sourceLabel}: ${matched.length} in inventory`,
      toAdd.length ? `${toAdd.length} added` : 'none new (already on mandate)',
      missing.length
        ? `${missing.length} missing (${missing.slice(0, 6).join(', ')}${missing.length > 6 ? '…' : ''})`
        : null,
    ].filter(Boolean)
    setFeedback(parts.join(' · '))
    if (toAdd[0]) onSelectStructure(toAdd[0].id)
    else if (matched[0]) onSelectStructure(matched[0].id)
  }

  function handlePasteAdd() {
    applyResolvedIds(
      resolveStructureIds(pasteText, inventory).parsed,
      'Paste',
    )
  }

  function handleCsvFile(file: File | null) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      const ids = parseStructureIdsFromCsv(text)
      applyResolvedIds(ids, `CSV (${file.name})`)
    }
    reader.readAsText(file)
  }

  function handleSelectAdd() {
    if (pickedIds.length === 0) {
      setFeedback('Select one or more structures from the inventory list.')
      return
    }
    applyResolvedIds(pickedIds, 'Selection')
    setPickedIds([])
  }

  function togglePicked(id: string) {
    setPickedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function handleRemove(structureId: string) {
    if (!active) return
    removeStructureFromMandate(active.id, structureId)
    refresh(active.id)
  }

  function handleReorder(structureId: string, direction: 'up' | 'down') {
    if (!active) return
    reorderMandateItem(active.id, structureId, direction)
    refresh(active.id)
  }

  function handleVisited(structureId: string, visited: boolean) {
    if (!active) return
    markMandateItemVisited(active.id, structureId, visited)
    refresh(active.id)
  }

  function handleStatus(status: InspectionMandateStatus) {
    if (!active) return
    setMandateStatus(active.id, status)
    refresh(active.id)
  }

  function handleDeleteMandate() {
    if (!active) return
    if (!window.confirm(`Delete mandate “${active.title}”?`)) return
    deleteMandate(active.id)
    refresh(null)
    setFeedback('Mandate deleted.')
  }

  function handleSaveMeta(patch: Partial<Pick<InspectionMandate, 'title' | 'dueDate' | 'notes' | 'createdBy'>>) {
    if (!active) return
    saveMandate({ ...active, ...patch })
    refresh(active.id)
  }

  const fieldSelectedId =
    mandateBridges.some((b) => b.id === selectedStructureId)
      ? selectedStructureId
      : mandateBridges[0]?.id ?? null

  return (
    <div className="mandate-panel">
      <div className="mandate-toolbar">
        <div className="mandate-tabs" role="tablist" aria-label="Mandate views">
          <button
            type="button"
            role="tab"
            className={tab === 'plan' ? 'active' : ''}
            aria-selected={tab === 'plan'}
            onClick={() => setTab('plan')}
          >
            Plan mandate (PM)
          </button>
          <button
            type="button"
            role="tab"
            className={tab === 'field' ? 'active' : ''}
            aria-selected={tab === 'field'}
            onClick={() => setTab('field')}
          >
            Field map (inspector)
          </button>
        </div>

        <label className="db-field mandate-select">
          <span>Active mandate</span>
          <select
            value={activeMandateId ?? ''}
            onChange={(e) => setActiveMandateId(e.target.value || null)}
          >
            {mandates.length === 0 && <option value="">No mandates yet</option>}
            {mandates.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} · {m.items.length} structures · {m.status}
              </option>
            ))}
          </select>
        </label>
      </div>

      {feedback && <p className="mandate-feedback">{feedback}</p>}

      {tab === 'plan' && (
        <div className="mandate-plan">
          <section className="mandate-card">
            <header>
              <h2>New inspection mandate</h2>
              <p>PM creates a work package of structures that must be inspected.</p>
            </header>
            <div className="mandate-form-grid">
              <label className="db-field grow">
                <span>Title</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label className="db-field">
                <span>Created by</span>
                <input value={createdBy} onChange={(e) => setCreatedBy(e.target.value)} />
              </label>
              <label className="db-field">
                <span>Due date</span>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </label>
            </div>
            <div className="mandate-actions">
              <button type="button" className="page-btn primary" onClick={handleCreate}>
                Create mandate
              </button>
            </div>
          </section>

          {active && (
            <>
              <section className="mandate-card">
                <header>
                  <h2>{active.title}</h2>
                  <p>
                    <code>{active.id}</code> · {active.createdBy} · updated{' '}
                    {new Date(active.updatedAt).toLocaleString()}
                  </p>
                </header>
                <div className="mandate-form-grid">
                  <label className="db-field grow">
                    <span>Title</span>
                    <input
                      value={active.title}
                      onChange={(e) => handleSaveMeta({ title: e.target.value })}
                    />
                  </label>
                  <label className="db-field">
                    <span>Status</span>
                    <select
                      value={active.status}
                      onChange={(e) => handleStatus(e.target.value as InspectionMandateStatus)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="db-field">
                    <span>Due</span>
                    <input
                      type="date"
                      value={active.dueDate ?? ''}
                      onChange={(e) => handleSaveMeta({ dueDate: e.target.value || undefined })}
                    />
                  </label>
                </div>
                <div className="mandate-actions">
                  <button type="button" className="page-btn danger" onClick={handleDeleteMandate}>
                    Delete mandate
                  </button>
                  <button
                    type="button"
                    className="page-btn primary"
                    onClick={() => setTab('field')}
                    disabled={active.items.length === 0}
                  >
                    Open field map
                  </button>
                </div>
              </section>

              <section className="mandate-card">
                <header>
                  <h2>Add structures</h2>
                  <p>Paste IDs, upload a CSV, or multi-select from the inventory.</p>
                </header>

                <div className="mandate-add-grid">
                  <div>
                    <label className="db-field grow">
                      <span>Paste structure IDs</span>
                      <textarea
                        rows={5}
                        value={pasteText}
                        placeholder={'10001, 10002\n10003\n10005'}
                        onChange={(e) => setPasteText(e.target.value)}
                      />
                    </label>
                    <div className="mandate-actions">
                      <button type="button" className="page-btn primary" onClick={handlePasteAdd}>
                        Add from paste
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="db-field grow">
                      <span>CSV / TSV upload</span>
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
                        onChange={(e) => {
                          handleCsvFile(e.target.files?.[0] ?? null)
                          e.target.value = ''
                        }}
                      />
                    </label>
                    <p className="page-note subtle">
                      Looks for an <code>id</code> / <code>structureId</code> column, or any column of
                      5-digit IDs.
                    </p>
                    <div className="mandate-actions">
                      <button
                        type="button"
                        className="page-btn"
                        onClick={() => fileRef.current?.click()}
                      >
                        Choose CSV file
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mandate-select-block">
                  <label className="db-field grow">
                    <span>Select existing structures</span>
                    <input
                      type="search"
                      value={selectQuery}
                      placeholder="Filter by ID, name, road, region…"
                      onChange={(e) => setSelectQuery(e.target.value)}
                    />
                  </label>
                  <ul className="mandate-pick-list">
                    {selectable.map((b) => (
                      <li key={b.id}>
                        <label>
                          <input
                            type="checkbox"
                            checked={pickedIds.includes(b.id)}
                            onChange={() => togglePicked(b.id)}
                          />
                          <code>{b.id}</code>
                          <strong>{b.name}</strong>
                          <span>
                            {b.region} · {b.structureType}
                          </span>
                        </label>
                      </li>
                    ))}
                    {selectable.length === 0 && (
                      <li className="home-empty">No matching structures left to add.</li>
                    )}
                  </ul>
                  <div className="mandate-actions">
                    <button type="button" className="page-btn primary" onClick={handleSelectAdd}>
                      Add selected ({pickedIds.length})
                    </button>
                  </div>
                </div>
              </section>

              <section className="mandate-card">
                <header>
                  <h2>Mandate structures ({active.items.length})</h2>
                  <p>Order drives the inspector navigation sequence on the field map.</p>
                </header>
                <MandateStructureTable
                  mandate={active}
                  inventory={inventory}
                  selectedId={selectedStructureId}
                  onSelect={onSelectStructure}
                  onRemove={handleRemove}
                  onReorder={handleReorder}
                  onVisited={handleVisited}
                  onOpenTwin={onOpenTwin}
                />
              </section>
            </>
          )}

          {!active && (
            <p className="page-note">Create a mandate above to start adding structures.</p>
          )}
        </div>
      )}

      {tab === 'field' && (
        <div className="mandate-field">
          {!active || active.items.length === 0 ? (
            <p className="page-note">
              Select a mandate with structures, or switch to Plan mandate to add them.
            </p>
          ) : (
            <>
              <header className="mandate-field-head">
                <div>
                  <h2>{active.title}</h2>
                  <p>
                    {mandateBridges.length} locations · inspectors navigate structure-to-structure
                    on site
                  </p>
                </div>
                <div className="mandate-actions">
                  <button type="button" className="page-btn" onClick={() => setTab('plan')}>
                    Edit mandate
                  </button>
                  {fieldSelectedId && (
                    <>
                      <button
                        type="button"
                        className="page-btn"
                        onClick={() =>
                          onOpenTwin(fieldSelectedId, { inspectionMode: 'scratch' })
                        }
                      >
                        Inspect from scratch
                      </button>
                      <button
                        type="button"
                        className="page-btn primary"
                        onClick={() =>
                          onOpenTwin(fieldSelectedId, { inspectionMode: 'follow-up' })
                        }
                      >
                        Follow-up inspection
                      </button>
                    </>
                  )}
                </div>
              </header>

              <div className="mandate-field-layout">
                <MandateFieldMap
                  bridges={inventory}
                  items={active.items}
                  selectedId={fieldSelectedId}
                  onSelect={onSelectStructure}
                  onOpenTwin={onOpenTwin}
                />
                <ol className="mandate-route-list">
                  {active.items
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((item) => {
                      const bridge = inventory.find((b) => b.id === item.structureId)
                      if (!bridge) {
                        return (
                          <li key={item.structureId} className="missing">
                            <strong>#{item.order}</strong>
                            <span>
                              Missing ID <code>{item.structureId}</code>
                            </span>
                          </li>
                        )
                      }
                      const activeRow = bridge.id === fieldSelectedId
                      return (
                        <li key={bridge.id} className={activeRow ? 'active' : ''}>
                          <button
                            type="button"
                            className="mandate-route-main"
                            onClick={() => onSelectStructure(bridge.id)}
                          >
                            <em>#{item.order}</em>
                            <strong>
                              {bridge.id} · {bridge.name}
                            </strong>
                            <span>
                              {bridge.road} · {bridge.city}
                              {item.visitedAt ? ' · visited' : ''}
                            </span>
                          </button>
                          <div className="mandate-route-actions">
                            <a
                              className="page-btn"
                              href={googleMapsDirectionsUrl(bridge.lat, bridge.lng)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Navigate
                            </a>
                            <button
                              type="button"
                              className="page-btn"
                              onClick={() => handleVisited(bridge.id, !item.visitedAt)}
                            >
                              {item.visitedAt ? 'Clear visit' : 'Mark visited'}
                            </button>
                            <button
                              type="button"
                              className="page-btn"
                              onClick={() =>
                                onOpenTwin(bridge.id, { inspectionMode: 'scratch' })
                              }
                            >
                              Scratch
                            </button>
                            <button
                              type="button"
                              className="page-btn primary"
                              onClick={() =>
                                onOpenTwin(bridge.id, { inspectionMode: 'follow-up' })
                              }
                            >
                              Follow-up
                            </button>
                          </div>
                        </li>
                      )
                    })}
                </ol>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function MandateStructureTable({
  mandate,
  inventory,
  selectedId,
  onSelect,
  onRemove,
  onReorder,
  onVisited,
  onOpenTwin,
}: {
  mandate: InspectionMandate
  inventory: BridgeAsset[]
  selectedId: string
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onReorder: (id: string, direction: 'up' | 'down') => void
  onVisited: (id: string, visited: boolean) => void
  onOpenTwin: (id?: string, options?: { inspectionMode?: InspectionSessionMode }) => void
}) {
  const byId = new Map(inventory.map((b) => [b.id, b]))
  const rows = mandate.items.slice().sort((a, b) => a.order - b.order)

  if (rows.length === 0) {
    return <p className="page-note">No structures on this mandate yet.</p>
  }

  return (
    <div className="page-table-wrap">
      <table className="page-table">
        <thead>
          <tr>
            <th>#</th>
            <th>ID</th>
            <th>Name</th>
            <th>Location</th>
            <th>Due / status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, index) => {
            const bridge = byId.get(item.structureId)
            return (
              <tr
                key={item.structureId}
                className={item.structureId === selectedId ? 'selected' : ''}
              >
                <td>{item.order}</td>
                <td>
                  <code>{item.structureId}</code>
                </td>
                <td>{bridge?.name ?? '—'}</td>
                <td>
                  {bridge
                    ? `${bridge.city}, ${bridge.region}`
                    : 'Not in inventory'}
                </td>
                <td>
                  {bridge?.nextInspectionDue ?? '—'}
                  {item.visitedAt ? ' · visited' : ''}
                </td>
                <td>
                  <div className="mandate-row-actions">
                    <button
                      type="button"
                      className="page-btn"
                      disabled={index === 0}
                      onClick={() => onReorder(item.structureId, 'up')}
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      className="page-btn"
                      disabled={index === rows.length - 1}
                      onClick={() => onReorder(item.structureId, 'down')}
                    >
                      Down
                    </button>
                    {bridge && (
                      <>
                        <button
                          type="button"
                          className="page-btn"
                          onClick={() => onSelect(bridge.id)}
                        >
                          Select
                        </button>
                        <button
                          type="button"
                          className="page-btn"
                          onClick={() =>
                            onOpenTwin(bridge.id, { inspectionMode: 'scratch' })
                          }
                        >
                          Scratch
                        </button>
                        <button
                          type="button"
                          className="page-btn primary"
                          onClick={() =>
                            onOpenTwin(bridge.id, { inspectionMode: 'follow-up' })
                          }
                        >
                          Follow-up
                        </button>
                        <button
                          type="button"
                          className="page-btn"
                          onClick={() => onVisited(item.structureId, !item.visitedAt)}
                        >
                          {item.visitedAt ? 'Clear' : 'Visited'}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="page-btn danger"
                      onClick={() => onRemove(item.structureId)}
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
