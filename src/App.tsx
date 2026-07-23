import { useState } from 'react'
import { ActivityFeed } from './components/ActivityFeed'
import { Header } from './components/Header'
import { MapView } from './components/MapView'
import { MetricsBar } from './components/MetricsBar'
import { NodePanel } from './components/NodePanel'
import { useLiveData } from './hooks/useLiveData'
import type { NodeStatus } from './types'
import './App.css'

export default function App() {
  const { nodes, events, metrics, clock } = useLiveData()
  const [selectedId, setSelectedId] = useState<string | null>('bn-nyc')
  const [statusFilter, setStatusFilter] = useState<NodeStatus | 'all'>('all')

  return (
    <div className="dashboard">
      <div className="atmosphere" aria-hidden="true" />
      <Header clock={clock} />
      <MetricsBar metrics={metrics} totalNodes={nodes.length} />

      <main className="dashboard-main">
        <div className="map-stage">
          <div className="map-frame">
            <MapView
              nodes={nodes}
              selectedId={selectedId}
              onSelect={setSelectedId}
              statusFilter={statusFilter}
            />
            <div className="map-legend" aria-hidden="true">
              <span>
                <i className="legend-dot online" /> Online
              </span>
              <span>
                <i className="legend-dot degraded" /> Degraded
              </span>
              <span>
                <i className="legend-dot offline" /> Offline
              </span>
            </div>
          </div>
        </div>

        <aside className="side-rail">
          <NodePanel
            nodes={nodes}
            selectedId={selectedId}
            statusFilter={statusFilter}
            onFilter={setStatusFilter}
            onSelect={setSelectedId}
          />
          <ActivityFeed events={events} onSelect={setSelectedId} />
        </aside>
      </main>
    </div>
  )
}
