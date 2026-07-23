import { useEffect } from 'react'
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet'
import type { BridgeNode, NodeStatus } from '../types'
import { statusLabel } from '../hooks/useLiveData'
import 'leaflet/dist/leaflet.css'

const STATUS_COLOR: Record<NodeStatus, string> = {
  online: '#1FA97A',
  degraded: '#D97706',
  offline: '#C2410C',
}

type MapViewProps = {
  nodes: BridgeNode[]
  selectedId: string | null
  onSelect: (id: string) => void
  statusFilter: NodeStatus | 'all'
}

function FlyToSelected({
  nodes,
  selectedId,
}: {
  nodes: BridgeNode[]
  selectedId: string | null
}) {
  const map = useMap()

  useEffect(() => {
    if (!selectedId) return
    const node = nodes.find((n) => n.id === selectedId)
    if (!node) return
    map.flyTo([node.lat, node.lng], 6.2, { duration: 1.1 })
  }, [map, nodes, selectedId])

  return null
}

export function MapView({ nodes, selectedId, onSelect, statusFilter }: MapViewProps) {
  const visible =
    statusFilter === 'all' ? nodes : nodes.filter((n) => n.status === statusFilter)

  return (
    <MapContainer
      center={[39.5, -98.35]}
      zoom={4.2}
      minZoom={3}
      maxZoom={12}
      className="map-canvas"
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
      />
      <FlyToSelected nodes={nodes} selectedId={selectedId} />
      {visible.map((node) => {
        const selected = node.id === selectedId
        const color = STATUS_COLOR[node.status]
        return (
          <CircleMarker
            key={node.id}
            center={[node.lat, node.lng]}
            radius={selected ? 14 : 9}
            pathOptions={{
              color: selected ? '#0B3D4A' : color,
              weight: selected ? 3 : 2,
              fillColor: color,
              fillOpacity: node.status === 'offline' ? 0.35 : 0.85,
            }}
            eventHandlers={{
              click: () => onSelect(node.id),
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1}>
              <strong>{node.name}</strong>
              <br />
              {node.city} · {statusLabel(node.status)}
            </Tooltip>
            <Popup>
              <div className="map-popup">
                <strong>{node.name}</strong>
                <span>
                  {node.city}, {node.region}
                </span>
                <span>
                  {node.throughputMbps} Mbps · {node.latencyMs} ms
                </span>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
