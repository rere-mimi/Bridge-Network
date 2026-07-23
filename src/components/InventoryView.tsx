import type { BridgeAsset } from '../types'
import { statusLabel } from '../lib/labels'

type InventoryViewProps = {
  bridges: BridgeAsset[]
  selectedId: string
  onSelect: (id: string) => void
  onInspect: (id: string) => void
}

export function InventoryView({
  bridges,
  selectedId,
  onSelect,
  onInspect,
}: InventoryViewProps) {
  const selected = bridges.find((b) => b.id === selectedId) ?? bridges[0]

  return (
    <main className="module-layout">
      <section className="panel module-list">
        <header className="panel-header">
          <h2>Bridge inventory</h2>
          <span className="count-chip">{bridges.length}</span>
        </header>
        <p className="module-lead">
          Short-term BIS inventory of structures, ownership, geometry, and coded elements.
        </p>
        <ul className="node-list">
          {bridges.map((bridge) => (
            <li key={bridge.id}>
              <button
                type="button"
                className={selectedId === bridge.id ? 'node-row selected' : 'node-row'}
                onClick={() => onSelect(bridge.id)}
              >
                <span className={`status-pip risk-${bridge.riskLevel}`} aria-hidden="true" />
                <span className="node-copy">
                  <strong>{bridge.name}</strong>
                  <em>
                    {bridge.road} · {bridge.region} · {bridge.yearBuilt}
                  </em>
                </span>
                <span className="node-stats">
                  <b>{bridge.lengthM}</b>
                  <small>m</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel module-detail">
        <header className="panel-header">
          <div>
            <p className="detail-kicker dark">{selected.owner}</p>
            <h2>{selected.name}</h2>
          </div>
          <span className={`status-badge status-${selected.status}`}>
            {statusLabel(selected.status)}
          </span>
        </header>

        <div className="info-grid">
          <div>
            <span>Road</span>
            <strong>{selected.road}</strong>
          </div>
          <div>
            <span>Region</span>
            <strong>{selected.region}</strong>
          </div>
          <div>
            <span>Material</span>
            <strong>{selected.material}</strong>
          </div>
          <div>
            <span>Spans</span>
            <strong>{selected.spans}</strong>
          </div>
          <div>
            <span>Length</span>
            <strong>{selected.lengthM} m</strong>
          </div>
          <div>
            <span>Built</span>
            <strong>{selected.yearBuilt}</strong>
          </div>
        </div>

        <div className="subsection">
          <h3>Coded elements</h3>
          <p className="module-lead">
            Step 1–2 ready: element codes and total quantities for BIS entry.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Element</th>
                  <th>Unit</th>
                  <th>Total qty</th>
                </tr>
              </thead>
              <tbody>
                {selected.elements.map((el) => (
                  <tr key={el.code}>
                    <td>
                      <code>{el.code}</code>
                    </td>
                    <td>{el.name}</td>
                    <td>{el.unit}</td>
                    <td>{el.totalQuantity.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="action-row">
          <button type="button" className="btn primary" onClick={() => onInspect(selected.id)}>
            Begin 7-step inspection
          </button>
        </div>
      </section>
    </main>
  )
}
