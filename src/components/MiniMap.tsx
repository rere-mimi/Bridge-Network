import { useEffect } from 'react'
import { CircleMarker, MapContainer, TileLayer, useMap } from 'react-leaflet'
import type { BridgeAsset, RiskLevel } from '../types'
import 'leaflet/dist/leaflet.css'

const RISK_COLOR: Record<RiskLevel, string> = {
  low: '#22c55e',
  moderate: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
}

function FlyTo({ bridge }: { bridge: BridgeAsset }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([bridge.lat, bridge.lng], 6.5, { duration: 0.9 })
  }, [bridge, map])
  return null
}

type MiniMapProps = {
  bridges: BridgeAsset[]
  selectedId: string
  onSelect: (id: string) => void
  compact?: boolean
}

export function MiniMap({ bridges, selectedId, onSelect, compact = true }: MiniMapProps) {
  const selected = bridges.find((b) => b.id === selectedId) ?? bridges[0]

  return (
    <div className={compact ? 'mini-map' : 'context-map'}>
      <MapContainer
        center={[-41.2, 174.8]}
        zoom={compact ? 4.6 : 11}
        zoomControl={false}
        attributionControl={false}
        className="mini-map-canvas"
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <FlyTo bridge={selected} />
        {bridges.map((bridge) => (
          <CircleMarker
            key={bridge.id}
            center={[bridge.lat, bridge.lng]}
            radius={bridge.id === selectedId ? 8 : 5}
            pathOptions={{
              color: bridge.id === selectedId ? '#38bdf8' : RISK_COLOR[bridge.riskLevel],
              weight: 2,
              fillColor: RISK_COLOR[bridge.riskLevel],
              fillOpacity: 0.9,
            }}
            eventHandlers={{ click: () => onSelect(bridge.id) }}
          />
        ))}
      </MapContainer>
    </div>
  )
}
