/**
 * NZ bridge catalogue loaded into app memory from map network data.
 *
 * Source: OpenStreetMap Overpass (named bridge=* ways). Google Maps does not
 * expose a public bulk bridge inventory API; the Google basemap shows these
 * locations geographically when a Maps API key is provided.
 */

export type NzMapBridge = {
  /** OSM way id */
  id: number
  name: string
  lat: number
  lng: number
  road: string
  highway: string
  region: string
}

type CompactCatalogue = {
  src: string
  count: number
  at: string
  bridges: Array<{
    id: number
    n: string
    lat: number
    lng: number
    rd: string
    hw: string
    rg: string
  }>
}

const MEMORY_KEY = 'bridge-network-nz-map-catalogue-v1'

let memory: NzMapBridge[] | null = null
let loadPromise: Promise<NzMapBridge[]> | null = null

function expand(raw: CompactCatalogue['bridges']): NzMapBridge[] {
  return raw.map((b) => ({
    id: b.id,
    name: b.n,
    lat: b.lat,
    lng: b.lng,
    road: b.rd,
    highway: b.hw,
    region: b.rg,
  }))
}

function persist(bridges: NzMapBridge[]) {
  try {
    // Keep a compact mirror so reloads are instant after first fetch.
    const compact = bridges.map((b) => ({
      id: b.id,
      n: b.name,
      lat: b.lat,
      lng: b.lng,
      rd: b.road,
      hw: b.highway,
      rg: b.region,
    }))
    localStorage.setItem(
      MEMORY_KEY,
      JSON.stringify({ src: 'memory', count: compact.length, at: new Date().toISOString(), bridges: compact }),
    )
  } catch {
    // Quota exceeded — keep in-process memory only.
  }
}

function readPersisted(): NzMapBridge[] | null {
  try {
    const raw = localStorage.getItem(MEMORY_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CompactCatalogue
    if (!parsed?.bridges?.length) return null
    return expand(parsed.bridges)
  } catch {
    return null
  }
}

export function getNzBridgesInMemory(): NzMapBridge[] {
  return memory ?? []
}

export function isNzCatalogueLoaded(): boolean {
  return memory != null && memory.length > 0
}

/** Load NZ named bridges into memory (network once, then localStorage / RAM). */
export async function loadNzBridgeCatalogue(force = false): Promise<NzMapBridge[]> {
  if (!force && memory?.length) return memory
  if (!force) {
    const cached = readPersisted()
    if (cached?.length) {
      memory = cached
      return cached
    }
  }
  if (loadPromise && !force) return loadPromise

  loadPromise = (async () => {
    const url = `${import.meta.env.BASE_URL}nz-bridges-catalogue.json`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Catalogue HTTP ${res.status}`)
    const data = (await res.json()) as CompactCatalogue
    const bridges = expand(data.bridges ?? [])
    memory = bridges
    persist(bridges)
    return bridges
  })()

  try {
    return await loadPromise
  } finally {
    loadPromise = null
  }
}

export function searchNzBridges(
  bridges: NzMapBridge[],
  query: string,
  limit = 40,
): NzMapBridge[] {
  const q = query.trim().toLowerCase()
  if (!q) return bridges.slice(0, limit)
  const hits: NzMapBridge[] = []
  for (const b of bridges) {
    if (
      b.name.toLowerCase().includes(q) ||
      b.road.toLowerCase().includes(q) ||
      b.region.toLowerCase().includes(q)
    ) {
      hits.push(b)
      if (hits.length >= limit) break
    }
  }
  return hits
}

export function bridgesInBounds(
  bridges: NzMapBridge[],
  bounds: { south: number; west: number; north: number; east: number },
  opts?: { max?: number; minHighwayRank?: number },
): NzMapBridge[] {
  const max = opts?.max ?? 600
  const rank = (hw: string) => {
    switch (hw) {
      case 'motorway':
        return 5
      case 'trunk':
        return 4
      case 'primary':
        return 3
      case 'secondary':
        return 2
      case 'tertiary':
        return 1
      default:
        return 0
    }
  }
  const minRank = opts?.minHighwayRank ?? 0
  const out: NzMapBridge[] = []
  for (const b of bridges) {
    if (rank(b.highway) < minRank) continue
    if (b.lat < bounds.south || b.lat > bounds.north) continue
    if (b.lng < bounds.west || b.lng > bounds.east) continue
    out.push(b)
    if (out.length >= max) break
  }
  return out
}

export function googleMapsSearchUrl(bridge: NzMapBridge): string {
  const q = encodeURIComponent(`${bridge.name}, New Zealand`)
  return `https://www.google.com/maps/search/?api=1&query=${q}`
}

/** Deep-link pin on Google Maps at the bridge coordinates. */
export function googleMapsPinUrl(bridge: NzMapBridge): string {
  return `https://www.google.com/maps?q=${bridge.lat},${bridge.lng}(${encodeURIComponent(bridge.name)})`
}
