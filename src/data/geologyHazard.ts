/**
 * Site geology / landslide context from GNS 1:250k Geological Map of NZ.
 *
 * - Geological unit at the bridge (soil / rock / fill)
 * - Nearby mapped landslide deposits (search envelope)
 *
 * Map viewers:
 *   https://maps.gns.cri.nz/
 *   Geology MapServer identify / query on geological_units + landslide_units
 */

export const GNS_GEOLOGY_MAP_URL = 'https://maps.gns.cri.nz/'
export const GNS_GEOLOGY_UNITS_QUERY =
  'https://gis.gns.cri.nz/server/rest/services/geology/NZL_GNS_250K_Geology_2020/MapServer/369/query'
export const GNS_LANDSLIDE_UNITS_QUERY =
  'https://gis.gns.cri.nz/server/rest/services/geology/NZL_GNS_250K_Geology_2020/MapServer/361/query'
/** Interactive GNS landslide / geology map deep-link helper */
export const GNS_LANDSLIDE_VIEWER_URL =
  'https://gis.gns.cri.nz/server/rest/services/NZL_GNS_250K_Geology_2023/NZL_GNS_250K_landslides_FeatureService_NZ/MapServer'

export type GeologyHazardSource = 'gns-api' | 'none' | 'error'

export type GeologyUnitSummary = {
  name: string
  mainRock?: string
  rockGroup?: string
  rockClass?: string
  lithology?: string
  description?: string
  unitType?: string
}

export type LandslideNearSite = {
  name: string
  mainRock?: string
  rockGroup?: string
  description?: string
}

export type GeologySiteHazard = {
  lat: number
  lng: number
  unit?: GeologyUnitSummary
  landslidesNearby: LandslideNearSite[]
  /** Soft / weak foundation indicator from rock group / class */
  softGround: boolean
  landslideProximity: 'none' | 'nearby' | 'on-deposit'
  source: GeologyHazardSource
  fetchedAt: string
  geologyMapUrl: string
  landslideMapUrl: string
  note?: string
}

const memoryCache = new Map<string, GeologySiteHazard>()
const CACHE_STORAGE_KEY = 'bridge-network-geology-hazard-v1'
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`
}

function readCache(key: string): GeologySiteHazard | null {
  const mem = memoryCache.get(key)
  if (mem) return mem
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, GeologySiteHazard>
    const hit = parsed[key]
    if (!hit) return null
    if (Date.now() - Date.parse(hit.fetchedAt) > CACHE_TTL_MS) return null
    memoryCache.set(key, hit)
    return hit
  } catch {
    return null
  }
}

function writeCache(key: string, value: GeologySiteHazard) {
  memoryCache.set(key, value)
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY)
    const parsed = (raw ? JSON.parse(raw) : {}) as Record<string, GeologySiteHazard>
    parsed[key] = value
    const keys = Object.keys(parsed)
    if (keys.length > 80) {
      keys
        .sort((a, b) => Date.parse(parsed[a].fetchedAt) - Date.parse(parsed[b].fetchedAt))
        .slice(0, keys.length - 80)
        .forEach((k) => delete parsed[k])
    }
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(parsed))
  } catch {
    /* quota */
  }
}

const SOFT_GROUPS = /fill|alluvium|sand|silt|gravel|loess|peat|colluvium|breccia|ash|tephra|soil/i
const SOFT_CLASS = /anthropic|unconsolidated|sedimentary/i

function isSoftGround(unit?: GeologyUnitSummary): boolean {
  if (!unit) return false
  const blob = `${unit.rockGroup ?? ''} ${unit.rockClass ?? ''} ${unit.mainRock ?? ''} ${unit.name}`
  return SOFT_GROUPS.test(blob) || SOFT_CLASS.test(blob)
}

function mapViewerUrl(lat: number, lng: number): string {
  // GNS web maps home — users inspect geology / landslides for the site
  return `${GNS_GEOLOGY_MAP_URL}?lat=${lat.toFixed(5)}&lon=${lng.toFixed(5)}`
}

function landslideViewerUrl(lat: number, lng: number): string {
  return `https://data.gns.cri.nz/mapserviceviewer/?service=NZL_GNS_250K_Geology&lat=${lat}&lon=${lng}`
}

type Attrs = Record<string, string | number | null | undefined>

function unitFromAttrs(a: Attrs): GeologyUnitSummary {
  return {
    name: String(a.mapname ?? a.NAME ?? 'Unknown unit'),
    mainRock: a.mainrock != null ? String(a.mainrock) : undefined,
    rockGroup: a.rockgroup != null ? String(a.rockgroup) : undefined,
    rockClass: a.rockclass != null ? String(a.rockclass) : undefined,
    lithology: a.lithology != null ? String(a.lithology) : undefined,
    description: a.descr != null ? String(a.descr) : undefined,
    unitType: a.typename != null ? String(a.typename) : undefined,
  }
}

async function queryJson(url: string, params: Record<string, string>) {
  const qs = new URLSearchParams({ f: 'json', ...params })
  const res = await fetch(`${url}?${qs.toString()}`)
  if (!res.ok) throw new Error(`GNS geology HTTP ${res.status}`)
  return res.json() as Promise<{
    features?: Array<{ attributes?: Attrs }>
    error?: { message?: string }
  }>
}

/**
 * Score 8–98 from soft ground + landslide proximity.
 */
export function geologyToScore(hazard: GeologySiteHazard): number {
  let score = 14
  if (hazard.softGround) score += 22
  if (hazard.landslideProximity === 'nearby') score += 28
  if (hazard.landslideProximity === 'on-deposit') score += 42
  const group = hazard.unit?.rockGroup?.toLowerCase() ?? ''
  if (group.includes('fill') || group.includes('alluv')) score += 10
  return Math.round(Math.min(98, Math.max(8, score)))
}

export async function lookupGeologyHazard(
  lat: number,
  lng: number,
  options?: { force?: boolean; landslidePadDeg?: number },
): Promise<GeologySiteHazard> {
  const key = cacheKey(lat, lng)
  if (!options?.force) {
    const cached = readCache(key)
    if (cached) return cached
  }

  const pad = options?.landslidePadDeg ?? 0.08 // ~8–9 km envelope

  try {
    const [unitRes, slideRes] = await Promise.all([
      queryJson(GNS_GEOLOGY_UNITS_QUERY, {
        geometry: `${lng},${lat}`,
        geometryType: 'esriGeometryPoint',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: 'mapname,mainrock,rockgroup,rockclass,descr,lithology,typename',
        returnGeometry: 'false',
        resultRecordCount: '3',
      }),
      queryJson(GNS_LANDSLIDE_UNITS_QUERY, {
        geometry: `${lng - pad},${lat - pad},${lng + pad},${lat + pad}`,
        geometryType: 'esriGeometryEnvelope',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: 'mapname,mainrock,descr,rockgroup',
        returnGeometry: 'false',
        resultRecordCount: '12',
      }),
    ])

    if (unitRes.error) throw new Error(unitRes.error.message ?? 'Geology query error')
    if (slideRes.error) throw new Error(slideRes.error.message ?? 'Landslide query error')

    const unitFeat = unitRes.features?.[0]?.attributes
    const unit = unitFeat ? unitFromAttrs(unitFeat) : undefined

    // Point-in-landslide check (tighter envelope)
    const onPad = 0.01
    const onDepositRes = await queryJson(GNS_LANDSLIDE_UNITS_QUERY, {
      geometry: `${lng},${lat}`,
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: 'mapname,mainrock,descr,rockgroup',
      returnGeometry: 'false',
      resultRecordCount: '3',
    })
    // If point query fails due to topology, fall back to tiny envelope
    let onDeposit = (onDepositRes.features?.length ?? 0) > 0
    if (!onDeposit) {
      const tiny = await queryJson(GNS_LANDSLIDE_UNITS_QUERY, {
        geometry: `${lng - onPad},${lat - onPad},${lng + onPad},${lat + onPad}`,
        geometryType: 'esriGeometryEnvelope',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: 'mapname,mainrock,descr,rockgroup',
        returnGeometry: 'false',
        resultRecordCount: '3',
      })
      onDeposit = (tiny.features?.length ?? 0) > 0
    }

    const landslidesNearby: LandslideNearSite[] = (slideRes.features ?? [])
      .map((f) => f.attributes ?? {})
      .map((a) => ({
        name: String(a.mapname ?? 'Landslide deposit'),
        mainRock: a.mainrock != null ? String(a.mainrock) : undefined,
        rockGroup: a.rockgroup != null ? String(a.rockgroup) : undefined,
        description: a.descr != null ? String(a.descr) : undefined,
      }))
      // de-dupe by name
      .filter((item, i, arr) => arr.findIndex((x) => x.name === item.name) === i)
      .slice(0, 6)

    const landslideProximity: GeologySiteHazard['landslideProximity'] = onDeposit
      ? 'on-deposit'
      : landslidesNearby.length > 0
        ? 'nearby'
        : 'none'

    const hazard: GeologySiteHazard = {
      lat,
      lng,
      unit,
      landslidesNearby,
      softGround: isSoftGround(unit),
      landslideProximity,
      source: unit || landslidesNearby.length ? 'gns-api' : 'none',
      fetchedAt: new Date().toISOString(),
      geologyMapUrl: mapViewerUrl(lat, lng),
      landslideMapUrl: landslideViewerUrl(lat, lng),
      note: unit
        ? `${unit.name}${unit.mainRock ? ` · ${unit.mainRock}` : ''}`
        : 'No geological unit returned at this point',
    }
    writeCache(key, hazard)
    return hazard
  } catch (err) {
    return {
      lat,
      lng,
      landslidesNearby: [],
      softGround: false,
      landslideProximity: 'none',
      source: 'error',
      fetchedAt: new Date().toISOString(),
      geologyMapUrl: mapViewerUrl(lat, lng),
      landslideMapUrl: landslideViewerUrl(lat, lng),
      note: err instanceof Error ? err.message : 'Geology lookup failed',
    }
  }
}

export async function lookupGeologyHazardBatch(
  sites: Array<{ id: string; lat: number; lng: number }>,
): Promise<Map<string, GeologySiteHazard>> {
  const out = new Map<string, GeologySiteHazard>()
  const concurrency = 2
  for (let i = 0; i < sites.length; i += concurrency) {
    const chunk = sites.slice(i, i + concurrency)
    const results = await Promise.all(
      chunk.map(async (s) => [s.id, await lookupGeologyHazard(s.lat, s.lng)] as const),
    )
    for (const [id, hazard] of results) out.set(id, hazard)
  }
  return out
}
