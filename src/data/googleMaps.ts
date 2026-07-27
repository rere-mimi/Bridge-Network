const STORAGE_KEY = 'bridge-network-google-maps-key'

export function getGoogleMapsApiKey(): string {
  try {
    const fromEnv = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
    if (fromEnv?.trim()) return fromEnv.trim()
    return localStorage.getItem(STORAGE_KEY)?.trim() ?? ''
  } catch {
    return ''
  }
}

export function setGoogleMapsApiKey(key: string) {
  const trimmed = key.trim()
  if (!trimmed) localStorage.removeItem(STORAGE_KEY)
  else localStorage.setItem(STORAGE_KEY, trimmed)
}

let mapsPromise: Promise<typeof google.maps> | null = null

/** Load Google Maps JS API. */
export function loadGoogleMaps(apiKey: string): Promise<typeof google.maps> {
  if (typeof window !== 'undefined' && window.google?.maps) {
    return Promise.resolve(window.google.maps)
  }
  if (mapsPromise) return mapsPromise

  mapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-bn-gmaps]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google.maps))
      existing.addEventListener('error', () => reject(new Error('Google Maps failed to load')))
      return
    }
    const script = document.createElement('script')
    script.dataset.bnGmaps = '1'
    script.async = true
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`
    script.onload = () => resolve(window.google.maps)
    script.onerror = () => {
      mapsPromise = null
      reject(new Error('Google Maps failed to load — check API key / billing'))
    }
    document.head.appendChild(script)
  })

  return mapsPromise
}

declare global {
  interface Window {
    google: typeof google
  }
}

/** Driving directions to a lat/lng pin (Google Maps). */
export function googleMapsDirectionsUrl(lat: number, lng: number): string {
  const destination = `${lat},${lng}`
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`
}

/** Deep-link pin on Google Maps at coordinates. */
export function googleMapsPinUrl(lat: number, lng: number, name: string): string {
  return `https://www.google.com/maps?q=${lat},${lng}(${encodeURIComponent(name)})`
}
