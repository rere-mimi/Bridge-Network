import type { BridgeAsset, ForecastScenario } from '../types'

type PlanningViewProps = {
  bridges: BridgeAsset[]
}

const SCENARIOS: ForecastScenario[] = [
  {
    id: 'steady',
    label: 'Steady maintenance',
    horizonYears: 10,
    conditionTrend: [80, 79, 78, 76, 75, 74, 72, 71, 70, 69],
    costEstimate: 12.4,
    deferredRisk: 'moderate',
    enabled: false,
  },
  {
    id: 'accelerated',
    label: 'Accelerated renewal',
    horizonYears: 10,
    conditionTrend: [80, 81, 83, 84, 86, 87, 88, 89, 90, 91],
    costEstimate: 28.7,
    deferredRisk: 'low',
    enabled: false,
  },
  {
    id: 'deferred',
    label: 'Deferred works',
    horizonYears: 10,
    conditionTrend: [80, 77, 73, 68, 62, 56, 50, 45, 40, 36],
    costEstimate: 4.1,
    deferredRisk: 'critical',
    enabled: false,
  },
]

export function PlanningView({ bridges }: PlanningViewProps) {
  const backlog = [...bridges]
    .filter((b) => b.riskLevel === 'high' || b.riskLevel === 'critical' || b.status !== 'operational')
    .sort((a, b) => b.riskScore - a.riskScore)

  return (
    <main className="module-layout planning-layout">
      <section className="panel module-detail full">
        <header className="panel-header">
          <div>
            <p className="detail-kicker dark">Longer-term capability</p>
            <h2>Lifecycle forecasting & maintenance planning</h2>
          </div>
          <span className="horizon-chip">Unlocks with sufficient data</span>
        </header>

        <p className="module-lead wide">
          With a growing BIS record of inventory, inspections, condition, and risk, the
          platform extends into lifecycle forecasting and maintenance planning inside one
          digital ecosystem for operational and strategic decisions.
        </p>

        <div className="planning-grid">
          {SCENARIOS.map((scenario) => (
            <article key={scenario.id} className="scenario-card">
              <div className="scenario-top">
                <h3>{scenario.label}</h3>
                <span className="locked">Data-gated</span>
              </div>
              <p>
                {scenario.horizonYears}-year outlook · est. ${scenario.costEstimate}M ·
                residual risk {scenario.deferredRisk}
              </p>
              <div className="sparkline" aria-hidden="true">
                {scenario.conditionTrend.map((value, index) => (
                  <span
                    key={index}
                    style={{ height: `${value}%` }}
                    title={`Year ${index + 1}: ${value}`}
                  />
                ))}
              </div>
              <button type="button" className="btn ghost" disabled>
                Forecasting preview
              </button>
            </article>
          ))}
        </div>

        <div className="subsection">
          <h3>Candidate maintenance programme</h3>
          <p className="module-lead">
            Seeded from current high-risk and non-operational assets — planning becomes
            authoritative as inspection history accumulates.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Bridge</th>
                  <th>Status</th>
                  <th>Risk</th>
                  <th>Next inspection</th>
                  <th>Planning state</th>
                </tr>
              </thead>
              <tbody>
                {backlog.map((b) => (
                  <tr key={b.id}>
                    <td>{b.name}</td>
                    <td>{b.status}</td>
                    <td>
                      {b.riskLevel} ({b.riskScore})
                    </td>
                    <td>{b.nextInspectionDue}</td>
                    <td>
                      <span className="locked">Awaiting richer history</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  )
}
