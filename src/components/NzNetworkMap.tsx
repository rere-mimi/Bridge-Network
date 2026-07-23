import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import type { BridgeAsset, RiskLevel } from '../types'
import {
  bridgesInBounds,
  getNzBridgesInMemory,
  googleMapsPinUrl,
  isNzCatalogueLoaded,
  loadNzBridgeCatalogue,
  searchNzBridges,
  type NzMapBridge,
} from '../data/nzBridgeCatalogue'
import { getGoogleMapsApiKey, loadGoogleMaps, setGoogleMapsApiKey } from '../data/googleMaps'
import 'leaflet/dist/leaflet.css'

const RISK_COLOR: Record<RiskLevel, string> = {
  low: '#22c55e',
  moderate: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
}

type Bounds = { south: number; west: number; north: number; east: number }

function BoundsWatcher({ onBounds }: { onBounds: (b: Bounds, zoom: number) => void }) {
  const map = useMap()
  const emit = () => {
    const b = map.getBounds()
    onBounds(
      {
        south: b.getSouth(),
        west: b.getWest(),
        north: b.getNorth(),
        east: b.getEast(),
      },
      map.getZoom(),
    )
  }
  useMapEvents({ moveend: emit, zoomend: emit })
  useEffect(() => {
    emit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])
  return null
}

function FlyToAsset({ bridge }: { bridge: BridgeAsset | null }) {
  const map = useMap()
  useEffect(() => {
    if (!bridge) return
    map.flyTo([bridge.lat, bridge.lng], Math.max(map.getZoom(), 10), { duration: 0.8 })
  }, [bridge, map])
  return null
}

function GoogleMapView({
  inventory,
  selectedId,
  visibleMapBridges,
  selectedMap,
  onSelectInventory,
  onSelectMapBridge,
  center,
}: {
  inventory: BridgeAsset[]
  selectedId: string
  visibleMapBridges: NzMapBridge[]
  selectedMap: NzMapBridge | null
  onSelectInventory: (id: string) => void
  onSelectMapBridge: (id: number) => void
  center: { lat: number; lng: number }
}) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const key = getGoogleMapsApiKey()
    if (!key || !hostRef.current) return
    let cancelled = false

    ;(async () => {
      try {
        const maps = await loadGoogleMaps(key)
        if (cancelled || !hostRef.current) return
        if (!mapRef.current) {
          mapRef.current = new maps.Map(hostRef.current, {
            center,
            zoom: 6,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
          })
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Google Maps error')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [center])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.google?.maps) return

    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []

    for (const b of visibleMapBridges) {
      const marker = new google.maps.Marker({
        map,
        position: { lat: b.lat, lng: b.lng },
        title: b.name,
        opacity: selectedMap?.id === b.id ? 1 : 0.7,
        zIndex: selectedMap?.id === b.id ? 40 : 10,
      })
      marker.addListener('click', () => onSelectMapBridge(b.id))
      markersRef.current.push(marker)
    }

    for (const bridge of inventory) {
      const marker = new google.maps.Marker({
        map,
        position: { lat: bridge.lat, lng: bridge.lng },
        title: `${bridge.name} (BIS)`,
        zIndex: bridge.id === selectedId ? 60 : 30,
      })
      marker.addListener('click', () => onSelectInventory(bridge.id))
      markersRef.current.push(marker)
    }

    if (selectedMap) {
      map.setCenter({ lat: selectedMap.lat, lng: selectedMap.lng })
      if ((map.getZoom() ?? 6) < 10) map.setZoom(11)
    }

    return () => {
      markersRef.current.forEach((m) => m.setMap(null))
      markersRef.current = []
    }
  }, [
    inventory,
    selectedId,
    visibleMapBridges,
    selectedMap,
    onSelectInventory,
    onSelectMapBridge,
  ])

  return (
    <div className="nz-google-host-wrap">
      <div ref={hostRef} className="nz-google-host" />
      {error && <p className="page-note subtle">{error}</p>}
    </div>
  )
}

type NzNetworkMapProps = {
  inventory: BridgeAsset[]
  selectedId: string
  onSelectInventory: (id: string) => void
  onImportMapBridge: (bridge: NzMapBridge) => void
  focusBridge?: BridgeAsset | null
}

export function NzNetworkMap({
  inventory,
  selectedId,
  onSelectInventory,
  onImportMapBridge,
  focusBridge = null,
}: NzNetworkMapProps) {
  const [catalogue, setCatalogue] = useState<NzMapBridge[]>(() => getNzBridgesInMemory())
  const [status, setStatus] = useState(
    isNzCatalogueLoaded()
      ? `${getNzBridgesInMemory().length.toLocaleString()} NZ bridges in memory`
      : 'NZ bridge catalogue not loaded',
  )
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [bounds, setBounds] = useState<Bounds | null>(null)
  const [zoom, setZoom] = useState(6)
  const [apiKeyDraft, setApiKeyDraft] = useState(() => getGoogleMapsApiKey())
  const [useGoogle, setUseGoogle] = useState(() => Boolean(getGoogleMapsApiKey()))
  const [selectedMapId, setSelectedMapId] = useState<number | null>(null)

  async function ensureCatalogue() {
    setLoading(true)
    setStatus('Loading NZ bridges into memory…')
    try {
      const bridges = await loadNzBridgeCatalogue(true)
      setCatalogue(bridges)
      setStatus(`${bridges.length.toLocaleString()} NZ named bridges in memory`)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to load catalogue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!catalogue.length) void ensureCatalogue()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const visibleMapBridges = useMemo(() => {
    if (!catalogue.length) return []
    if (query.trim()) return searchNzBridges(catalogue, query, 80)
    if (!bounds) {
      return catalogue
        .filter((b) => ['motorway', 'trunk', 'primary'].includes(b.highway))
        .slice(0, 400)
    }
    const minRank = zoom < 7 ? 3 : zoom < 9 ? 2 : zoom < 11 ? 1 : 0
    return bridgesInBounds(catalogue, bounds, {
      max: zoom < 10 ? 350 : 700,
      minHighwayRank: minRank,
    })
  }, [catalogue, bounds, zoom, query])

  const selectedMap = catalogue.find((b) => b.id === selectedMapId) ?? null
  const selectedInventory =
    inventory.find((b) => b.id === selectedId) ?? inventory[0] ?? null

  function applyGoogleKey() {
    setGoogleMapsApiKey(apiKeyDraft)
    setUseGoogle(Boolean(apiKeyDraft.trim()))
  }

  return (
    <div className="nz-network-map">
      <div className="nz-map-toolbar">
        <button
          type="button"
          className="page-btn primary"
          disabled={loading}
          onClick={() => void ensureCatalogue()}
        >
          {catalogue.length ? 'Reload NZ bridges into memory' : 'Load NZ bridges into memory'}
        </button>
        <input
          className="nz-map-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search NZ bridges by name / road / region"
        />
        <label className="nz-map-google-toggle">
          <input
            type="checkbox"
            checked={useGoogle}
            onChange={(e) => setUseGoogle(e.target.checked && Boolean(getGoogleMapsApiKey()))}
            disabled={!getGoogleMapsApiKey()}
          />
          Google Maps basemap
        </label>
      </div>

      <div className="nz-map-key-row">
        <input
          className="nz-map-search"
          value={apiKeyDraft}
          onChange={(e) => setApiKeyDraft(e.target.value)}
          placeholder="Google Maps API key (feeds basemap)"
          autoComplete="off"
        />
        <button type="button" className="page-btn" onClick={applyGoogleKey}>
          Save key
        </button>
      </div>

      <div className="nz-map-stage">
        {useGoogle && getGoogleMapsApiKey() ? (
          <GoogleMapView
            inventory={inventory}
            selectedId={selectedId}
            visibleMapBridges={visibleMapBridges}
            selectedMap={selectedMap}
            onSelectInventory={onSelectInventory}
            onSelectMapBridge={setSelectedMapId}
            center={{
              lat: selectedInventory?.lat ?? -41.2,
              lng: selectedInventory?.lng ?? 174.8,
            }}
          />
        ) : (
          <MapContainer
            center={[-41.2, 174.8]}
            zoom={6}
            className="nz-leaflet-host"
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <BoundsWatcher
              onBounds={(b, z) => {
                setBounds(b)
                setZoom(z)
              }}
            />
            <FlyToAsset bridge={focusBridge ?? selectedInventory} />
            {visibleMapBridges.map((b) => (
              <CircleMarker
                key={`m-${b.id}`}
                center={[b.lat, b.lng]}
                radius={selectedMapId === b.id ? 7 : 4}
                pathOptions={{
                  color: selectedMapId === b.id ? '#38bdf8' : '#64748b',
                  weight: 1,
                  fillColor: selectedMapId === b.id ? '#0ea5e9' : '#94a3b8',
                  fillOpacity: 0.75,
                }}
                eventHandlers={{ click: () => setSelectedMapId(b.id) }}
              />
            ))}
            {inventory.map((bridge) => (
              <CircleMarker
                key={`i-${bridge.id}`}
                center={[bridge.lat, bridge.lng]}
                radius={bridge.id === selectedId ? 9 : 6}
                pathOptions={{
                  color: bridge.id === selectedId ? '#38bdf8' : RISK_COLOR[bridge.riskLevel],
                  weight: 2,
                  fillColor: RISK_COLOR[bridge.riskLevel],
                  fillOpacity: 0.95,
                }}
                eventHandlers={{ click: () => onSelectInventory(bridge.id) }}
              />
            ))}
          </MapContainer>
        )}
      </div>

      <div className="nz-map-footer">
        <p>
          {status} · showing {visibleMapBridges.length.toLocaleString()} map bridges
          {useGoogle ? ' · Google basemap' : ''}
        </p>
        {selectedMap && (
          <div className="nz-map-selected">
            <div>
              <strong>{selectedMap.name}</strong>
              <span>
                {selectedMap.road || selectedMap.highway} · {selectedMap.region} ·{' '}
                {selectedMap.lat.toFixed(4)}, {selectedMap.lng.toFixed(4)}
              </span>
            </div>
            <div className="nshm-hazard-actions">
              <button
                type="button"
                className="page-btn primary"
                onClick={() => onImportMapBridge(selectedMap)}
              >
                Add to BIS inventory
              </button>
              <a
                className="page-btn"
                href={googleMapsPinUrl(selectedMap)}
                target="_blank"
                rel="noreferrer"
              >
                Open in Google Maps
              </a>
            </div>
          </div>
        )}
        {query.trim() && (
          <ul className="page-list nz-map-hits">
            {searchNzBridges(catalogue, query, 12).map((b) => (
              <li key={b.id}>
                <button type="button" onClick={() => setSelectedMapId(b.id)}>
                  <strong>{b.name}</strong>
                  <span>
                    {b.road || b.highway} · {b.region}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
