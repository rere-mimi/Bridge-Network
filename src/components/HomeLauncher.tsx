import { useMemo, useState } from 'react'
import { MiniMap } from './MiniMap'
import type { BridgeAsset, PlatformModule } from '../types'

export type HomeActionId =
  | 'inspection'
  | 'select-structure'
  | 'network-map'
  | 'model-ready'
  | 'reports'
  | 'condition'
  | 'maintenance'

type HomeLauncherProps = {
  structures: BridgeAsset[]
  selectedId: string
  onSelectStructure: (id: string) => void
  onOpenStructureOverview: (id: string) => void
  onOpenModule: (module: PlatformModule) => void
  onOpenMaps: () => void
  onOpenCreateModel: () => void
}

const ACTIONS: Array<{
  id: HomeActionId
  title: string
  blurb: string
  meta: string
}> = [
  {
    id: 'inspection',
    title: 'Open an inspection project',
    blurb: 'Continue defect recording, activities, and condition capture on a structure.',
    meta: 'Inspections',
  },
  {
    id: 'select-structure',
    title: 'Select a structure',
    blurb: 'Find by bridge ID or name, then open its digital twin overview.',
    meta: 'Search · ID',
  },
  {
    id: 'network-map',
    title: 'Network map overview',
    blurb: 'See every structure on the map and pick one from the network.',
    meta: 'Maps',
  },
  {
    id: 'model-ready',
    title: 'Model ready for inspection',
    blurb: 'Create or edit an Appendix C model so the twin is ready to inspect.',
    meta: 'Create model',
  },
  {
    id: 'reports',
    title: 'Make a report',
    blurb: 'Export summaries, condition narratives, and maintenance worklists.',
    meta: 'Reports',
  },
  {
    id: 'condition',
    title: 'Condition & risk',
    blurb: 'Review condition bands, defect heat maps, and seismic / operational risk.',
    meta: 'Condition · Risk',
  },
  {
    id: 'maintenance',
    title: 'Maintenance & costs',
    blurb: 'Plan activities, provisional condition states, and costed worklists.',
    meta: 'Maintenance · Costs',
  },
]

export function HomeLauncher({
  structures,
  selectedId,
  onSelectStructure,
  onOpenStructureOverview,
  onOpenModule,
  onOpenMaps,
  onOpenCreateModel,
}: HomeLauncherProps) {
  const [activeAction, setActiveAction] = useState<HomeActionId | null>('select-structure')
  const [query, setQuery] = useState('')

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return structures.slice(0, 12)
    const exactId = structures.find((b) => b.id.toLowerCase() === q)
    const filtered = structures.filter((b) => {
      const hay = `${b.id} ${b.name} ${b.road} ${b.region} ${b.city} ${b.structureType}`.toLowerCase()
      return hay.includes(q)
    })
    if (exactId) {
      return [exactId, ...filtered.filter((b) => b.id !== exactId.id)].slice(0, 20)
    }
    return filtered.slice(0, 20)
  }, [query, structures])

  const selected = structures.find((b) => b.id === selectedId) ?? structures[0]

  function runAction(id: HomeActionId) {
    setActiveAction(id)
    if (id === 'select-structure') return
    if (id === 'network-map') {
      onOpenMaps()
      return
    }
    if (id === 'model-ready') {
      onOpenCreateModel()
      return
    }
    if (id === 'inspection') {
      onOpenModule('inspections')
      return
    }
    if (id === 'reports') {
      onOpenModule('reports')
      return
    }
    if (id === 'condition') {
      onOpenModule('condition')
      return
    }
    if (id === 'maintenance') {
      onOpenModule('maintenance')
      return
    }
  }

  function openSelected() {
    if (!selected) return
    onOpenStructureOverview(selected.id)
  }

  return (
    <main className="home-launcher" aria-label="Home menu">
      <section className="home-hero">
        <p className="home-kicker">Bridge Network</p>
        <h1>Choose how you want to work</h1>
        <p className="home-lead">
          Open an inspection, pick a structure by ID or map, prepare a model, or jump straight to
          reports and maintenance.
        </p>
      </section>

      <div className="home-layout">
        <nav className="home-menu" aria-label="Work modes">
          {ACTIONS.map((action, index) => (
            <button
              key={action.id}
              type="button"
              className={`home-menu-item ${activeAction === action.id ? 'active' : ''}`}
              style={{ animationDelay: `${0.05 + index * 0.04}s` }}
              onClick={() => runAction(action.id)}
            >
              <span className="home-menu-meta">{action.meta}</span>
              <strong>{action.title}</strong>
              <span>{action.blurb}</span>
            </button>
          ))}
        </nav>

        <section className="home-panel" aria-label="Structure picker">
          <header className="home-panel-head">
            <div>
              <p className="home-kicker subtle">Structure</p>
              <h2>Find and open a twin</h2>
            </div>
            <button
              type="button"
              className="page-btn primary"
              disabled={!selected}
              onClick={openSelected}
            >
              Open overview
            </button>
          </header>

          <label className="home-search">
            <span>Search by ID, name, road, or region</span>
            <input
              type="search"
              value={query}
              placeholder="e.g. 10003 · Grafton · SH1"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && matches[0]) {
                  onSelectStructure(matches[0].id)
                  onOpenStructureOverview(matches[0].id)
                }
              }}
            />
          </label>

          <div className="home-panel-body">
            <ul className="home-structure-list">
              {matches.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={item.id === selected?.id ? 'active' : ''}
                    onClick={() => onSelectStructure(item.id)}
                    onDoubleClick={() => onOpenStructureOverview(item.id)}
                  >
                    <span className="home-structure-id">{item.id}</span>
                    <strong>{item.name}</strong>
                    <span>
                      {item.region} · {item.structureType} · CI {item.conditionIndex}
                    </span>
                  </button>
                </li>
              ))}
              {matches.length === 0 && (
                <li className="home-empty">No structures match that search.</li>
              )}
            </ul>

            <div className="home-map-pane">
              {selected ? (
                <>
                  <MiniMap
                    bridges={structures}
                    selectedId={selected.id}
                    onSelect={onSelectStructure}
                    compact={false}
                  />
                  <div className="home-map-meta">
                    <div>
                      <strong>{selected.name}</strong>
                      <span>
                        {selected.id} · {selected.road} · {selected.city}
                      </span>
                    </div>
                    <div className="home-map-actions">
                      <button
                        type="button"
                        className="page-btn"
                        onClick={onOpenMaps}
                      >
                        Full network map
                      </button>
                      <button
                        type="button"
                        className="page-btn primary"
                        onClick={() => onOpenStructureOverview(selected.id)}
                      >
                        Open overview
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <p className="home-empty">Load structures to use the map picker.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
