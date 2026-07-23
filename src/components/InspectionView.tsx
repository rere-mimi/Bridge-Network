import { quantitySum } from '../data/bridges'
import type {
  BridgeAsset,
  ElementInspection,
  EnvironmentCategory,
  InspectionPhase,
  InspectionReport,
} from '../types'
import { INSPECTION_STEPS } from '../types'

type InspectionViewProps = {
  bridges: BridgeAsset[]
  inspections: InspectionReport[]
  activeInspection: InspectionReport
  onSelectInspection: (id: string) => void
  onPhaseChange: (phase: InspectionPhase) => void
  onUpdateElement: (elementCode: string, patch: Partial<ElementInspection>) => void
  onBmpComments: (comments: string) => void
  onComplete: () => void
  onStart: (bridgeId: string) => void
}

const ENVIRONMENTS: EnvironmentCategory[] = ['Low', 'Moderate', 'Severe']

export function InspectionView({
  bridges,
  inspections,
  activeInspection,
  onSelectInspection,
  onPhaseChange,
  onUpdateElement,
  onBmpComments,
  onComplete,
  onStart,
}: InspectionViewProps) {
  const bridge =
    bridges.find((b) => b.id === activeInspection.bridgeId) ?? bridges[0]
  const stepIndex = INSPECTION_STEPS.findIndex((s) => s.id === activeInspection.phase)
  const current = INSPECTION_STEPS[stepIndex] ?? INSPECTION_STEPS[0]

  function goNext() {
    if (stepIndex >= INSPECTION_STEPS.length - 1) {
      onComplete()
      return
    }
    onPhaseChange(INSPECTION_STEPS[stepIndex + 1].id)
  }

  function goBack() {
    if (stepIndex <= 0) return
    onPhaseChange(INSPECTION_STEPS[stepIndex - 1].id)
  }

  return (
    <main className="module-layout inspection-layout">
      <section className="panel module-list">
        <header className="panel-header">
          <h2>Inspection records</h2>
          <span className="count-chip">{inspections.length}</span>
        </header>
        <ul className="node-list">
          {inspections.map((ins) => (
            <li key={ins.id}>
              <button
                type="button"
                className={
                  activeInspection.id === ins.id ? 'node-row selected' : 'node-row'
                }
                onClick={() => onSelectInspection(ins.id)}
              >
                <span className={`status-pip phase-${ins.status}`} aria-hidden="true" />
                <span className="node-copy">
                  <strong>{ins.bridgeName}</strong>
                  <em>
                    {ins.inspector} · {ins.status}
                  </em>
                </span>
                <span className="node-stats">
                  <b>{INSPECTION_STEPS.find((s) => s.id === ins.phase)?.step ?? 1}</b>
                  <small>/ 7</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="action-row padded">
          <label className="field-label" htmlFor="start-bridge">
            Start new inspection
          </label>
          <select
            id="start-bridge"
            className="select"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) onStart(e.target.value)
              e.target.value = ''
            }}
          >
            <option value="" disabled>
              Choose bridge…
            </option>
            {bridges.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="panel module-detail inspection-workspace">
        <header className="panel-header">
          <div>
            <p className="detail-kicker dark">
              {bridge.road} · {bridge.city}
            </p>
            <h2>{activeInspection.bridgeName}</h2>
          </div>
          <span className="count-chip">Step {current.step} / 7</span>
        </header>

        <ol className="stepper" aria-label="Seven inspection steps">
          {INSPECTION_STEPS.map((step, index) => (
            <li key={step.id}>
              <button
                type="button"
                className={
                  index === stepIndex
                    ? 'step active'
                    : index < stepIndex
                      ? 'step done'
                      : 'step'
                }
                onClick={() => onPhaseChange(step.id)}
              >
                <span>{step.step}</span>
                <strong>{step.title}</strong>
              </button>
            </li>
          ))}
        </ol>

        <div className="step-panel">
          <h3>{current.title}</h3>
          <p className="module-lead">{current.summary}</p>

          {activeInspection.phase === 'elements' && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Element</th>
                    <th>Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {bridge.elements.map((el) => (
                    <tr key={el.code}>
                      <td>
                        <code>{el.code}</code>
                      </td>
                      <td>{el.name}</td>
                      <td>{el.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeInspection.phase === 'quantities' && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Element</th>
                    <th>Total quantity</th>
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
          )}

          {activeInspection.phase === 'bis-entry' && (
            <div className="bis-card">
              <p>
                Element codes and quantities are staged for the Bridge Information
                System record <strong>{bridge.id.toUpperCase()}</strong>.
              </p>
              <ul className="check-list">
                <li>Inventory linkage verified</li>
                <li>{bridge.elements.length} coded elements queued</li>
                <li>Ready for field condition capture</li>
              </ul>
            </div>
          )}

          {activeInspection.phase === 'inspect' && (
            <div className="inspect-stack">
              <p className="module-lead">
                4A Environment · 4B Condition states 1–4 · 4C Quantity check · 4D
                Maintenance · 4E Comments
              </p>
              {activeInspection.elements.map((el) => {
                const catalog = bridge.elements.find((e) => e.code === el.elementCode)!
                const sum = quantitySum(el.quantities)
                const target = catalog.totalQuantity
                const balanced = Math.abs(sum - target) < 0.01
                return (
                  <article key={el.elementCode} className="element-card">
                    <header>
                      <div>
                        <code>{el.elementCode}</code>
                        <h4>{catalog.name}</h4>
                      </div>
                      <span className={balanced ? 'balance ok' : 'balance bad'}>
                        {balanced ? 'Quantities balance' : `Sum ${sum} ≠ ${target}`}
                      </span>
                    </header>

                    <label className="field-label">
                      Environment category
                      <select
                        className="select"
                        value={el.environment}
                        onChange={(e) =>
                          onUpdateElement(el.elementCode, {
                            environment: e.target.value as EnvironmentCategory,
                          })
                        }
                      >
                        {ENVIRONMENTS.map((env) => (
                          <option key={env} value={env}>
                            {env}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="cs-grid">
                      {([1, 2, 3, 4] as const).map((cs) => {
                        const key = `cs${cs}` as keyof typeof el.quantities
                        return (
                          <label key={cs} className="field-label">
                            CS{cs}
                            <input
                              className="input"
                              type="number"
                              min={0}
                              value={el.quantities[key]}
                              onChange={(e) =>
                                onUpdateElement(el.elementCode, {
                                  quantities: {
                                    ...el.quantities,
                                    [key]: Number(e.target.value),
                                  },
                                })
                              }
                            />
                          </label>
                        )
                      })}
                    </div>

                    <div className="maint-list">
                      <p className="field-label">Required maintenance actions</p>
                      {el.maintenanceActions.length === 0 ? (
                        <p className="muted">No maintenance required</p>
                      ) : (
                        el.maintenanceActions.map((action) => (
                          <div key={action.activityNumber} className="maint-row">
                            <code>{action.activityNumber}</code>
                            <span>{action.description}</span>
                          </div>
                        ))
                      )}
                    </div>

                    <label className="field-label">
                      Inspector comments
                      <textarea
                        className="textarea"
                        rows={2}
                        value={el.comments}
                        placeholder="Record additional observations…"
                        onChange={(e) =>
                          onUpdateElement(el.elementCode, { comments: e.target.value })
                        }
                      />
                    </label>
                  </article>
                )
              })}
            </div>
          )}

          {activeInspection.phase === 'bmp-review' && (
            <div className="bis-card">
              <p>
                Report submitted to the Bridge Maintenance Planner for review and
                comment.
              </p>
              <label className="field-label">
                BMP comments
                <textarea
                  className="textarea"
                  rows={4}
                  value={activeInspection.bmpComments}
                  placeholder="Planner review notes…"
                  onChange={(e) => onBmpComments(e.target.value)}
                />
              </label>
            </div>
          )}

          {activeInspection.phase === 'bis-data' && (
            <div className="bis-card">
              <p>Reviewed inspection data is ready to post into BIS.</p>
              <ul className="check-list">
                <li>Inspector: {activeInspection.inspector}</li>
                <li>
                  Submitted:{' '}
                  {activeInspection.submittedAt
                    ? new Date(activeInspection.submittedAt).toLocaleString()
                    : '—'}
                </li>
                <li>BMP notes captured: {activeInspection.bmpComments ? 'Yes' : 'Pending'}</li>
              </ul>
            </div>
          )}

          {activeInspection.phase === 'reports' && (
            <div className="bis-card">
              <p>Generate required bridge inspection reports from BIS.</p>
              <div className="report-cards">
                <article>
                  <h4>Element condition summary</h4>
                  <p>CS1–CS4 distribution by coded element</p>
                </article>
                <article>
                  <h4>Maintenance action list</h4>
                  <p>Activity numbers and descriptions for programme input</p>
                </article>
                <article>
                  <h4>BMP decision record</h4>
                  <p>Review comments and acceptance trail</p>
                </article>
              </div>
              {activeInspection.status === 'reported' && (
                <p className="success-note">Inspection workflow complete — reports available.</p>
              )}
            </div>
          )}
        </div>

        <div className="action-row step-actions">
          <button type="button" className="btn ghost" onClick={goBack} disabled={stepIndex === 0}>
            Back
          </button>
          <button type="button" className="btn primary" onClick={goNext}>
            {stepIndex >= INSPECTION_STEPS.length - 1 ? 'Complete & generate' : 'Continue'}
          </button>
        </div>
      </section>
    </main>
  )
}
