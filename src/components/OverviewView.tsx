import type { ActivityEvent, BridgeAsset } from '../types'
import { statusLabel } from '../lib/labels'
import { MapView } from './MapView'

type OverviewViewProps = {
  bridges: BridgeAsset[]
  selectedId: string
  selectedBridge: BridgeAsset
  events: ActivityEvent[]
  onSelect: (id: string) => void
  onInspect: (id: string) => void
  onOpenInventory: () => void
}

export function OverviewView({
  bridges,
  selectedId,
  selectedBridge,
  events,
  onSelect,
  onInspect,
  onOpenInventory,
}: OverviewViewProps) {
  return (
    <main className="dashboard-main">
      <div className="map-stage">
        <div className="map-frame">
          <div className="map-overlay-title">
            <strong>NZ bridge network</strong>
            <span>Click a bridge · then open Inspection for the 7-step BIS workflow</span>
          </div>
          <MapView bridges={bridges} selectedId={selectedId} onSelect={onSelect} />
          <div className="map-legend" aria-hidden="true">
            <span>
              <i className="legend-dot online" /> Low risk
            </span>
            <span>
              <i className="legend-dot degraded" /> Moderate
            </span>
            <span>
              <i className="legend-dot offline" /> High / critical
            </span>
          </div>
        </div>
      </div>

      <aside className="side-rail">
        <section className="panel node-panel">
          <header className="panel-header">
            <h2>Selected bridge</h2>
            <span className={`status-badge status-${selectedBridge.status}`}>
              {statusLabel(selectedBridge.status)}
            </span>
          </header>
          <div className="selected-bridge-card">
            <p className="detail-kicker">
              {selectedBridge.road} · {selectedBridge.region}
            </p>
            <h3>{selectedBridge.name}</h3>
            <dl className="detail-grid light">
              <div>
                <dt>Condition index</dt>
                <dd>{selectedBridge.conditionIndex}</dd>
              </div>
              <div>
                <dt>Risk score</dt>
                <dd>{selectedBridge.riskScore}</dd>
              </div>
              <div>
                <dt>Last inspection</dt>
                <dd>{selectedBridge.lastInspection}</dd>
              </div>
              <div>
                <dt>Next due</dt>
                <dd>{selectedBridge.nextInspectionDue}</dd>
              </div>
            </dl>
            <div className="action-row">
              <button type="button" className="btn primary" onClick={() => onInspect(selectedBridge.id)}>
                Start inspection
              </button>
              <button type="button" className="btn ghost" onClick={onOpenInventory}>
                Open inventory
              </button>
            </div>
          </div>

          <ul className="node-list compact">
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
                      {bridge.city} · CI {bridge.conditionIndex}
                    </em>
                  </span>
                  <span className="node-stats">
                    <b>{bridge.riskScore}</b>
                    <small>risk</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel activity-panel" aria-label="Live activity feed">
          <header className="panel-header">
            <h2>Live activity</h2>
            <span className="live-chip">
              <span className="live-dot" aria-hidden="true" />
              Streaming
            </span>
          </header>
          <ul className="activity-list">
            {events.map((event) => (
              <li key={event.id} className={`activity-item kind-${event.kind}`}>
                <button type="button" onClick={() => onSelect(event.bridgeId)}>
                  <span className="activity-time">{event.time}</span>
                  <span className="activity-msg">{event.message}</span>
                  <span className="activity-node">{event.bridgeName}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </main>
  )
}
