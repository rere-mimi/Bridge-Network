import { useEffect } from 'react'
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

function ClickCapture({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(Number(event.latlng.lat.toFixed(5)), Number(event.latlng.lng.toFixed(5)))
    },
  })
  return null
}

function SyncView({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
    map.setView([lat, lng], Math.max(map.getZoom(), 8), { animate: true })
  }, [lat, lng, map])
  return null
}

type LocationPickerMapProps = {
  lat: number
  lng: number
  onPick: (lat: number, lng: number) => void
}

export function LocationPickerMap({ lat, lng, onPick }: LocationPickerMapProps) {
  return (
    <div className="location-picker-map">
      <MapContainer
        center={[lat || -41.2, lng || 174.8]}
        zoom={7}
        className="location-picker-canvas"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <ClickCapture onPick={onPick} />
        <SyncView lat={lat} lng={lng} />
        {Number.isFinite(lat) && Number.isFinite(lng) && (
          <CircleMarker
            center={[lat, lng]}
            radius={9}
            pathOptions={{
              color: '#38bdf8',
              weight: 2,
              fillColor: '#0ea5e9',
              fillOpacity: 0.9,
            }}
          />
        )}
      </MapContainer>
      <p className="location-picker-hint">Click the map to set the structure location</p>
    </div>
  )
}
