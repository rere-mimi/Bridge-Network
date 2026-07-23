import type { ActivityEvent } from '../types'

type ActivityFeedProps = {
  events: ActivityEvent[]
  onSelect: (nodeId: string) => void
}

export function ActivityFeed({ events, onSelect }: ActivityFeedProps) {
  return (
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
            <button type="button" onClick={() => onSelect(event.nodeId)}>
              <span className="activity-time">{event.time}</span>
              <span className="activity-msg">{event.message}</span>
              <span className="activity-node">{event.nodeName}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
