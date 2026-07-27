import { useEffect, useMemo } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { googleMapsDirectionsUrl, googleMapsPinUrl } from '../data/googleMaps'
import type { BridgeAsset, InspectionMandateItem, RiskLevel } from '../types'
import 'leaflet/dist/leaflet.css'

const RISK_COLOR: Record<RiskLevel, string> = {
  low: '#22c55e',
  moderate: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
}

function FitMandateBounds({ bridges }: { bridges: BridgeAsset[] }) {
  const map = useMap()
  useEffect(() => {
    if (bridges.length === 0) return
    if (bridges.length === 1) {
      map.setView([bridges[0].lat, bridges[0].lng], 11, { animate: true })
      return
    }
    const bounds = bridges.map((b) => [b.lat, b.lng] as [number, number])
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 12, animate: true })
  }, [bridges, map])
  return null
}

function FlyToSelected({ bridge }: { bridge: BridgeAsset | null }) {
  const map = useMap()
  useEffect(() => {
    if (!bridge) return
    map.flyTo([bridge.lat, bridge.lng], Math.max(map.getZoom(), 10), { duration: 0.7 })
  }, [bridge, map])
  return null
}

type MandateFieldMapProps = {
  bridges: BridgeAsset[]
  items: InspectionMandateItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  onOpenTwin?: (id: string, options?: { inspectionMode?: 'scratch' | 'follow-up' }) => void
  className?: string
}

export function MandateFieldMap({
  bridges,
  items,
  selectedId,
  onSelect,
  onOpenTwin,
  className,
}: MandateFieldMapProps) {
  const ordered = useMemo(() => {
    const byId = new Map(bridges.map((b) => [b.id, b]))
    return items
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((item) => ({ item, bridge: byId.get(item.structureId) }))
      .filter((row): row is { item: InspectionMandateItem; bridge: BridgeAsset } => Boolean(row.bridge))
  }, [bridges, items])

  const selected =
    ordered.find((row) => row.bridge.id === selectedId)?.bridge ?? ordered[0]?.bridge ?? null

  const center: [number, number] = selected
    ? [selected.lat, selected.lng]
    : [-41.2, 174.8]

  return (
    <div className={className ?? 'mandate-field-map'}>
      <MapContainer
        center={center}
        zoom={6}
        className="mandate-field-map-canvas"
        scrollWheelZoom
        zoomControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · CARTO'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FitMandateBounds bridges={ordered.map((row) => row.bridge)} />
        {selected && <FlyToSelected bridge={selected} />}
        {ordered.map(({ item, bridge }) => {
          const isSelected = bridge.id === selectedId
          const visited = Boolean(item.visitedAt)
          return (
            <CircleMarker
              key={bridge.id}
              center={[bridge.lat, bridge.lng]}
              radius={isSelected ? 11 : 8}
              pathOptions={{
                color: isSelected ? '#38bdf8' : visited ? '#94a3b8' : RISK_COLOR[bridge.riskLevel],
                weight: isSelected ? 3 : 2,
                fillColor: visited ? '#64748b' : RISK_COLOR[bridge.riskLevel],
                fillOpacity: 0.92,
              }}
              eventHandlers={{ click: () => onSelect(bridge.id) }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                <strong>
                  #{item.order} · {bridge.id}
                </strong>
                <br />
                {bridge.name}
              </Tooltip>
              <Popup>
                <div className="mandate-map-popup">
                  <strong>
                    #{item.order} · {bridge.name}
                  </strong>
                  <span>
                    {bridge.id} · {bridge.road} · {bridge.city}
                  </span>
                  <span>
                    {bridge.region} · CI {bridge.conditionIndex} · {bridge.riskLevel} risk
                  </span>
                  <div className="mandate-map-popup-actions">
                    <a
                      className="page-btn"
                      href={googleMapsDirectionsUrl(bridge.lat, bridge.lng)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Navigate
                    </a>
                    <a
                      className="page-btn"
                      href={googleMapsPinUrl(bridge.lat, bridge.lng, bridge.name)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Pin
                    </a>
                    {onOpenTwin && (
                      <>
                        <button
                          type="button"
                          className="page-btn"
                          onClick={() => onOpenTwin(bridge.id, { inspectionMode: 'scratch' })}
                        >
                          Scratch
                        </button>
                        <button
                          type="button"
                          className="page-btn primary"
                          onClick={() => onOpenTwin(bridge.id, { inspectionMode: 'follow-up' })}
                        >
                          Follow-up
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
      {ordered.length === 0 && (
        <p className="mandate-field-map-empty">Add structures to this mandate to build the field map.</p>
      )}
    </div>
  )
}
