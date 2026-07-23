import { conditionWeightedScore, createDefaultElementInspections, quantitySum } from '../data/bridges'
import type { BridgeAsset, InspectionReport } from '../types'

type ConditionViewProps = {
  bridges: BridgeAsset[]
  inspections: InspectionReport[]
  selectedId: string
  onSelect: (id: string) => void
}

export function ConditionView({
  bridges,
  inspections,
  selectedId,
  onSelect,
}: ConditionViewProps) {
  const bridge = bridges.find((b) => b.id === selectedId) ?? bridges[0]
  const matched = inspections.find((i) => i.bridgeId === bridge.id)
  const elements = matched?.elements ?? createDefaultElementInspections(bridge.elements)

  const rows = elements.map((el) => {
    const catalog = bridge.elements.find((e) => e.code === el.elementCode)
    const total = quantitySum(el.quantities)
    return {
      code: el.elementCode,
      name: catalog?.name ?? el.elementCode,
      environment: el.environment,
      ...el.quantities,
      total,
      score: conditionWeightedScore(el.quantities),
      pct: {
        cs1: total ? Math.round((el.quantities.cs1 / total) * 100) : 0,
        cs2: total ? Math.round((el.quantities.cs2 / total) * 100) : 0,
        cs3: total ? Math.round((el.quantities.cs3 / total) * 100) : 0,
        cs4: total ? Math.round((el.quantities.cs4 / total) * 100) : 0,
      },
    }
  })

  return (
    <main className="module-layout">
      <section className="panel module-list">
        <header className="panel-header">
          <h2>Condition data</h2>
        </header>
        <p className="module-lead">
          Element condition states from inspection records, linked to inventory.
        </p>
        <ul className="node-list">
          {bridges.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                className={selectedId === b.id ? 'node-row selected' : 'node-row'}
                onClick={() => onSelect(b.id)}
              >
                <span className={`status-pip risk-${b.riskLevel}`} aria-hidden="true" />
                <span className="node-copy">
                  <strong>{b.name}</strong>
                  <em>CI {b.conditionIndex}</em>
                </span>
                <span className="node-stats">
                  <b>{b.conditionIndex}</b>
                  <small>index</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel module-detail">
        <header className="panel-header">
          <div>
            <p className="detail-kicker dark">Condition states 1–4</p>
            <h2>{bridge.name}</h2>
          </div>
          <span className="count-chip">CI {bridge.conditionIndex}</span>
        </header>

        <div className="condition-stack">
          {rows.map((row) => (
            <article key={row.code} className="condition-row">
              <div className="condition-head">
                <div>
                  <code>{row.code}</code>
                  <strong>{row.name}</strong>
                </div>
                <span>{row.environment} environment · score {row.score}</span>
              </div>
              <div className="cs-bar" aria-hidden="true">
                <i style={{ width: `${row.pct.cs1}%` }} className="cs1" />
                <i style={{ width: `${row.pct.cs2}%` }} className="cs2" />
                <i style={{ width: `${row.pct.cs3}%` }} className="cs3" />
                <i style={{ width: `${row.pct.cs4}%` }} className="cs4" />
              </div>
              <div className="cs-legend">
                <span>CS1 {row.pct.cs1}%</span>
                <span>CS2 {row.pct.cs2}%</span>
                <span>CS3 {row.pct.cs3}%</span>
                <span>CS4 {row.pct.cs4}%</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
