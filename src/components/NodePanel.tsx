import type { BridgeNode, NodeStatus } from '../types'
import { statusLabel } from '../hooks/useLiveData'

type NodePanelProps = {
  nodes: BridgeNode[]
  selectedId: string | null
  statusFilter: NodeStatus | 'all'
  onFilter: (filter: NodeStatus | 'all') => void
  onSelect: (id: string) => void
}

const FILTERS: Array<NodeStatus | 'all'> = ['all', 'online', 'degraded', 'offline']

export function NodePanel({
  nodes,
  selectedId,
  statusFilter,
  onFilter,
  onSelect,
}: NodePanelProps) {
  const visible =
    statusFilter === 'all' ? nodes : nodes.filter((n) => n.status === statusFilter)

  const selected = nodes.find((n) => n.id === selectedId) ?? null

  return (
    <section className="panel node-panel" aria-label="Bridge nodes">
      <header className="panel-header">
        <h2>Bridge nodes</h2>
        <span className="count-chip">{visible.length}</span>
      </header>

      <div className="filter-row" role="tablist" aria-label="Filter by status">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            role="tab"
            aria-selected={statusFilter === filter}
            className={statusFilter === filter ? 'filter-btn active' : 'filter-btn'}
            onClick={() => onFilter(filter)}
          >
            {filter === 'all' ? 'All' : statusLabel(filter)}
          </button>
        ))}
      </div>

      <ul className="node-list">
        {visible.map((node) => (
          <li key={node.id}>
            <button
              type="button"
              className={
                selectedId === node.id ? 'node-row selected' : 'node-row'
              }
              onClick={() => onSelect(node.id)}
            >
              <span className={`status-pip status-${node.status}`} aria-hidden="true" />
              <span className="node-copy">
                <strong>{node.name}</strong>
                <em>
                  {node.city} · {node.region}
                </em>
              </span>
              <span className="node-stats">
                <b>{node.throughputMbps}</b>
                <small>Mbps</small>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {selected && (
        <aside className="selected-detail" aria-live="polite">
          <div className="detail-top">
            <div>
              <p className="detail-kicker">{selected.city}</p>
              <h3>{selected.name}</h3>
            </div>
            <span className={`status-badge status-${selected.status}`}>
              {statusLabel(selected.status)}
            </span>
          </div>
          <dl className="detail-grid">
            <div>
              <dt>Latency</dt>
              <dd>{selected.latencyMs} ms</dd>
            </div>
            <div>
              <dt>Throughput</dt>
              <dd>{selected.throughputMbps} Mbps</dd>
            </div>
            <div>
              <dt>Connections</dt>
              <dd>{selected.connections}</dd>
            </div>
            <div>
              <dt>Uptime</dt>
              <dd>{selected.uptimePct.toFixed(2)}%</dd>
            </div>
          </dl>
        </aside>
      )}
    </section>
  )
}
