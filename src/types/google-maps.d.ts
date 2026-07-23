/** Minimal Google Maps typings used by the NZ network map. */

declare namespace google {
  namespace maps {
    class Map {
      constructor(el: HTMLElement, opts?: MapOptions)
      fitBounds(bounds: LatLngBounds, padding?: number): void
      getBounds(): LatLngBounds | undefined
      getZoom(): number
      setCenter(latLng: LatLng | LatLngLiteral): void
      setZoom(zoom: number): void
      addListener(eventName: string, handler: () => void): MapsEventListener
    }

    class Marker {
      constructor(opts?: MarkerOptions)
      setMap(map: Map | null): void
      setPosition(pos: LatLng | LatLngLiteral): void
      addListener(eventName: string, handler: () => void): MapsEventListener
    }

    class LatLngBounds {
      constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral)
      extend(point: LatLng | LatLngLiteral): void
      getSouthWest(): LatLng
      getNorthEast(): LatLng
    }

    class LatLng {
      lat(): number
      lng(): number
    }

    interface LatLngLiteral {
      lat: number
      lng: number
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral
      zoom?: number
      mapTypeId?: string
      disableDefaultUI?: boolean
      zoomControl?: boolean
      mapTypeControl?: boolean
      streetViewControl?: boolean
      fullscreenControl?: boolean
      styles?: Array<Record<string, unknown>>
    }

    interface MarkerOptions {
      map?: Map | null
      position?: LatLng | LatLngLiteral
      title?: string
      icon?: string | Record<string, unknown>
      opacity?: number
      zIndex?: number
    }

    interface MapsEventListener {
      remove(): void
    }

    namespace event {
      function clearInstanceListeners(instance: object): void
    }
  }
}

interface Window {
  google: typeof google
}
