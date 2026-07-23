import type { BridgeAsset } from '../types'

type DigitalTwinViewProps = {
  bridge: BridgeAsset
  bridges: BridgeAsset[]
  onSelect: (id: string) => void
}

export function DigitalTwinView({ bridge, bridges, onSelect }: DigitalTwinViewProps) {
  const maxQty = Math.max(...bridge.elements.map((e) => e.totalQuantity))

  return (
    <main className="module-layout twin-layout">
      <section className="panel module-list">
        <header className="panel-header">
          <h2>Digital twin</h2>
        </header>
        <p className="module-lead">
          Visualise structure composition, coded elements, and live condition context.
        </p>
        <ul className="node-list">
          {bridges.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                className={bridge.id === b.id ? 'node-row selected' : 'node-row'}
                onClick={() => onSelect(b.id)}
              >
                <span className={`status-pip risk-${b.riskLevel}`} aria-hidden="true" />
                <span className="node-copy">
                  <strong>{b.name}</strong>
                  <em>
                    {b.spans} spans · {b.material}
                  </em>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel module-detail twin-stage">
        <header className="panel-header">
          <div>
            <p className="detail-kicker dark">Structure twin</p>
            <h2>{bridge.name}</h2>
          </div>
          <span className="count-chip">{bridge.lengthM} m</span>
        </header>

        <div className="twin-viewport" aria-hidden="true">
          <div className="twin-sky" />
          <div className="twin-water" />
          <div className="twin-deck">
            {bridge.elements
              .filter((e) => ['ABT', 'PIE', 'SUP', 'DEC', 'RAI'].includes(e.code))
              .map((el, index) => (
                <div
                  key={el.code}
                  className={`twin-part part-${el.code.toLowerCase()}`}
                  style={{
                    animationDelay: `${index * 0.12}s`,
                    opacity: 0.55 + (el.totalQuantity / maxQty) * 0.45,
                  }}
                  title={`${el.code} · ${el.name}`}
                />
              ))}
          </div>
          <div className="twin-label left">{bridge.city}</div>
          <div className="twin-label right">{bridge.road}</div>
        </div>

        <div className="twin-metrics">
          <article>
            <span>Condition index</span>
            <strong>{bridge.conditionIndex}</strong>
          </article>
          <article>
            <span>Risk score</span>
            <strong>{bridge.riskScore}</strong>
          </article>
          <article>
            <span>Elements</span>
            <strong>{bridge.elements.length}</strong>
          </article>
          <article>
            <span>Year built</span>
            <strong>{bridge.yearBuilt}</strong>
          </article>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Twin layer</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {bridge.elements.map((el) => (
                <tr key={el.code}>
                  <td>
                    <code>{el.code}</code>
                  </td>
                  <td>{el.name}</td>
                  <td>
                    {el.totalQuantity.toLocaleString()} {el.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
