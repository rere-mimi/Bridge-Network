import { useEffect } from 'react'
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet'
import type { BridgeAsset, RiskLevel } from '../types'
import 'leaflet/dist/leaflet.css'

const RISK_COLOR: Record<RiskLevel, string> = {
  low: '#1FA97A',
  moderate: '#D97706',
  high: '#C2410C',
  critical: '#9F1239',
}

type MapViewProps = {
  bridges: BridgeAsset[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function FlyToSelected({
  bridges,
  selectedId,
}: {
  bridges: BridgeAsset[]
  selectedId: string | null
}) {
  const map = useMap()

  useEffect(() => {
    if (!selectedId) return
    const bridge = bridges.find((b) => b.id === selectedId)
    if (!bridge) return
    map.flyTo([bridge.lat, bridge.lng], 8.5, { duration: 1.05 })
  }, [map, bridges, selectedId])

  return null
}

export function MapView({ bridges, selectedId, onSelect }: MapViewProps) {
  return (
    <MapContainer
      center={[-41.2, 174.8]}
      zoom={5.2}
      minZoom={4}
      maxZoom={14}
      className="map-canvas"
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; OSM &copy; CARTO'
      />
      <FlyToSelected bridges={bridges} selectedId={selectedId} />
      {bridges.map((bridge) => {
        const selected = bridge.id === selectedId
        const color = RISK_COLOR[bridge.riskLevel]
        return (
          <CircleMarker
            key={bridge.id}
            center={[bridge.lat, bridge.lng]}
            radius={selected ? 14 : 9}
            pathOptions={{
              color: selected ? '#0B3D4A' : color,
              weight: selected ? 3 : 2,
              fillColor: color,
              fillOpacity: bridge.status === 'closed' ? 0.35 : 0.85,
            }}
            eventHandlers={{
              click: () => onSelect(bridge.id),
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1}>
              <strong>{bridge.name}</strong>
              <br />
              {bridge.city} · CI {bridge.conditionIndex} · {bridge.riskLevel}
            </Tooltip>
            <Popup>
              <div className="map-popup">
                <strong>{bridge.name}</strong>
                <span>
                  {bridge.road} · {bridge.region}
                </span>
                <span>
                  Condition {bridge.conditionIndex} · Risk {bridge.riskScore}
                </span>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
