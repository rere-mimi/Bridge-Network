import type { BridgeAsset, RiskLevel } from '../types'

type RiskViewProps = {
  bridges: BridgeAsset[]
  selectedId: string
  onSelect: (id: string) => void
}

const RISK_FACTORS: Array<{ key: string; label: string; weight: number }> = [
  { key: 'condition', label: 'Condition index', weight: 0.35 },
  { key: 'age', label: 'Age / remaining life', weight: 0.2 },
  { key: 'environment', label: 'Environment severity', weight: 0.15 },
  { key: 'traffic', label: 'Traffic exposure', weight: 0.15 },
  { key: 'scour', label: 'Scour / hazard', weight: 0.15 },
]

function factorScores(bridge: BridgeAsset): number[] {
  const age = new Date().getFullYear() - bridge.yearBuilt
  return [
    Math.max(0, 100 - bridge.conditionIndex),
    Math.min(100, age / 1.2),
    bridge.riskLevel === 'critical'
      ? 90
      : bridge.riskLevel === 'high'
        ? 70
        : bridge.riskLevel === 'moderate'
          ? 45
          : 20,
    Math.min(100, bridge.lengthM / 20),
    bridge.status === 'restricted' || bridge.status === 'closed' ? 85 : bridge.status === 'watch' ? 60 : 25,
  ]
}

function riskLabel(level: RiskLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1)
}

export function RiskView({ bridges, selectedId, onSelect }: RiskViewProps) {
  const bridge = bridges.find((b) => b.id === selectedId) ?? bridges[0]
  const scores = factorScores(bridge)
  const ranked = [...bridges].sort((a, b) => b.riskScore - a.riskScore)

  return (
    <main className="module-layout">
      <section className="panel module-list">
        <header className="panel-header">
          <h2>Risk models</h2>
        </header>
        <p className="module-lead">
          Short-term risk ranking from condition, exposure, and operational status.
        </p>
        <ul className="node-list">
          {ranked.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                className={selectedId === b.id ? 'node-row selected' : 'node-row'}
                onClick={() => onSelect(b.id)}
              >
                <span className={`status-pip risk-${b.riskLevel}`} aria-hidden="true" />
                <span className="node-copy">
                  <strong>{b.name}</strong>
                  <em>{riskLabel(b.riskLevel)}</em>
                </span>
                <span className="node-stats">
                  <b>{b.riskScore}</b>
                  <small>score</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel module-detail">
        <header className="panel-header">
          <div>
            <p className="detail-kicker dark">Composite risk model</p>
            <h2>{bridge.name}</h2>
          </div>
          <span className={`status-badge risk-badge risk-${bridge.riskLevel}`}>
            {riskLabel(bridge.riskLevel)} · {bridge.riskScore}
          </span>
        </header>

        <div className="risk-factors">
          {RISK_FACTORS.map((factor, index) => (
            <article key={factor.key} className="risk-factor">
              <div className="risk-factor-top">
                <strong>{factor.label}</strong>
                <span>Weight {(factor.weight * 100).toFixed(0)}%</span>
              </div>
              <div className="meter">
                <span style={{ width: `${scores[index]}%` }} />
              </div>
              <p>Contribution score {Math.round(scores[index])}</p>
            </article>
          ))}
        </div>

        <div className="bis-card">
          <h3>Model note</h3>
          <p>
            Risk combines inspection-derived condition with inventory attributes and
            live operational status to support both day-to-day operations and strategic
            prioritisation.
          </p>
        </div>
      </section>
    </main>
  )
}
