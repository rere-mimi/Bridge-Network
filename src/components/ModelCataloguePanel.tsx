import { useMemo, useState } from 'react'
import {
  MATERIALS,
  INVENTORY_MATERIALS,
  COMPONENTS,
  ELEMENTS,
  STRUCTURE_TYPES,
  COMPONENT_CATEGORIES,
  ELEMENT_CATEGORIES,
  catalogueSummary,
  type StructureKind,
} from '../data/modelCatalogue'
import {
  ARCH_DIAGRAM_PARTS,
  ARCH_SPANDREL_OPTIONS,
  validateArchComponents,
  type ArchSpandrelType,
} from '../data/archBridgeComponents'

type Tab = 'types' | 'components' | 'elements' | 'materials' | 'arch'

const KIND_LABEL: Record<StructureKind, string> = {
  bridge: 'Bridge',
  culvert: 'Culvert',
  'retaining-wall': 'Retaining wall',
  'sign-gantry': 'Sign / gantry',
  tunnel: 'Tunnel',
  other: 'Other',
}

export function ModelCataloguePanel() {
  const summary = catalogueSummary()
  const [tab, setTab] = useState<Tab>('types')
  const [kindFilter, setKindFilter] = useState<'all' | StructureKind>('all')
  const [structOnly, setStructOnly] = useState(true)
  const [archType, setArchType] = useState<ArchSpandrelType>('closed')

  const types = useMemo(
    () =>
      STRUCTURE_TYPES.filter((t) => kindFilter === 'all' || t.kind === kindFilter),
    [kindFilter],
  )

  const components = useMemo(
    () => (structOnly ? COMPONENTS.filter((c) => c.structural3d) : COMPONENTS),
    [structOnly],
  )

  const elements = useMemo(
    () => (structOnly ? ELEMENTS.filter((e) => e.structural3d) : ELEMENTS),
    [structOnly],
  )

  const archSeedNos = useMemo(() => {
    const opt = ARCH_SPANDREL_OPTIONS.find((o) => o.id === archType)!
    return [200, opt.archSchedule, opt.spandrelSchedule, 400, 401]
  }, [archType])

  const archChecks = useMemo(
    () => validateArchComponents(archSeedNos, archType),
    [archSeedNos, archType],
  )

  return (
    <div className="model-catalogue">
      <header className="model-catalogue-header">
        <div>
          <h2>Model catalogue</h2>
          <p>
            Source of truth for 3D models — Appendix B/C (TMR) + inv-struc Ch.5 (MTQ).
            The twin shows structural members only.
          </p>
        </div>
        <dl className="model-catalogue-stats">
          <div>
            <dt>Structure types</dt>
            <dd>{summary.structureTypes}</dd>
          </div>
          <div>
            <dt>Components</dt>
            <dd>
              {summary.structural3dComponents}
              <span> / {summary.components} 3D</span>
            </dd>
          </div>
          <div>
            <dt>Elements</dt>
            <dd>
              {summary.structural3dElements}
              <span> / {summary.elements} 3D</span>
            </dd>
          </div>
          <div>
            <dt>Materials</dt>
            <dd>{summary.materials}</dd>
          </div>
        </dl>
      </header>

      <div className="model-catalogue-tabs" role="tablist">
        {(
          [
            ['types', 'Structure types'],
            ['components', 'Components'],
            ['elements', 'Elements'],
            ['arch', 'Arch diagram'],
            ['materials', 'Materials'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? 'active' : undefined}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'types' && (
        <section className="model-catalogue-section">
          <div className="model-catalogue-filters">
            <label>
              Kind
              <select
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value as 'all' | StructureKind)}
              >
                <option value="all">All</option>
                {(Object.keys(KIND_LABEL) as StructureKind[]).map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="model-catalogue-table-wrap">
            <table className="model-catalogue-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Kind</th>
                  <th>Source</th>
                  <th>Code</th>
                  <th>Materials</th>
                </tr>
              </thead>
              <tbody>
                {types.map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>{KIND_LABEL[t.kind]}</td>
                    <td>{t.source === 'tmr-appendix-c' ? 'TMR App. C' : 'MTQ inv-struc'}</td>
                    <td>{t.code ?? '—'}</td>
                    <td>{t.materials.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'components' && (
        <section className="model-catalogue-section">
          <div className="model-catalogue-filters">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={structOnly}
                onChange={(e) => setStructOnly(e.target.checked)}
              />
              Structural 3D only
            </label>
            <span className="muted">{COMPONENT_CATEGORIES.length} categories</span>
          </div>
          <div className="model-catalogue-table-wrap">
            <table className="model-catalogue-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Code</th>
                  <th>SR</th>
                  <th>Materials</th>
                  <th>3D</th>
                </tr>
              </thead>
              <tbody>
                {components.map((c) => (
                  <tr key={c.no}>
                    <td>{c.no}</td>
                    <td>{c.name}</td>
                    <td>{c.category}</td>
                    <td>{c.code}</td>
                    <td>{c.significance}</td>
                    <td>
                      {(Object.keys(c.materials) as Array<keyof typeof c.materials>)
                        .filter((k) => c.materials[k])
                        .join(', ')}
                    </td>
                    <td>{c.structural3d ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'elements' && (
        <section className="model-catalogue-section">
          <div className="model-catalogue-filters">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={structOnly}
                onChange={(e) => setStructOnly(e.target.checked)}
              />
              Structural 3D only
            </label>
            <span className="muted">{ELEMENT_CATEGORIES.length} categories</span>
          </div>
          <div className="model-catalogue-table-wrap">
            <table className="model-catalogue-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>3D</th>
                </tr>
              </thead>
              <tbody>
                {elements.map((e) => (
                  <tr key={e.no}>
                    <td>{e.no}</td>
                    <td>{e.name}</td>
                    <td>{e.category}</td>
                    <td>{e.structural3d ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'arch' && (
        <section className="model-catalogue-section">
          <p className="model-help">
            Example diagram parts for an arch bridge (deck, crown, spandrel, arch rib/barrel,
            springings, extrados, intrados, skewback/abutment, rise, span) mapped to Appendix B/C.
          </p>
          <div className="model-catalogue-filters">
            <label>
              Spandrel type
              <select
                value={archType}
                onChange={(e) => setArchType(e.target.value as ArchSpandrelType)}
              >
                {ARCH_SPANDREL_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <span className={archChecks.every((c) => c.ok) ? 'arch-badge ok' : 'arch-badge fail'}>
              {archChecks.every((c) => c.ok) ? 'Components valid' : 'Gaps found'}
            </span>
          </div>
          <div className="model-catalogue-table-wrap">
            <table className="model-catalogue-table">
              <thead>
                <tr>
                  <th>Diagram part</th>
                  <th>Role</th>
                  <th>App. C</th>
                  <th>App. B</th>
                  <th>Validation</th>
                </tr>
              </thead>
              <tbody>
                {ARCH_DIAGRAM_PARTS.map((part) => {
                  const check = archChecks.find((c) => c.diagram === part.diagram)
                  return (
                    <tr key={part.diagram}>
                      <td>{part.diagram}</td>
                      <td>{part.role}</td>
                      <td>{part.scheduleNos.length ? part.scheduleNos.join(', ') : '—'}</td>
                      <td>{part.componentNos.length ? part.componentNos.join(', ') : '—'}</td>
                      <td className={check?.ok ? 'ok' : 'fail'}>{check?.detail ?? part.note}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'materials' && (
        <section className="model-catalogue-section">
          <h3>Appendix B material codes</h3>
          <div className="model-catalogue-table-wrap">
            <table className="model-catalogue-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Label</th>
                  <th>inv-struc §5.27</th>
                </tr>
              </thead>
              <tbody>
                {MATERIALS.map((m) => (
                  <tr key={m.code}>
                    <td>{m.code}</td>
                    <td>{m.label}</td>
                    <td>{m.inventoryCodes?.join(', ') ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3>Inventory materials (MTQ §5.27)</h3>
          <div className="model-catalogue-table-wrap">
            <table className="model-catalogue-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                </tr>
              </thead>
              <tbody>
                {INVENTORY_MATERIALS.map((m) => (
                  <tr key={m.code}>
                    <td>{m.code}</td>
                    <td>{m.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
