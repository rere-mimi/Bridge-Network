/**
 * NZ river flood statistics (Henderson & Collins 2018) via NIWA’s public ArcGIS
 * FeatureServer — the same dataset behind:
 * https://niwa.maps.arcgis.com/apps/instant/lookup/index.html?appid=dbcaedb2073b41b6993bd0155e5d8c53
 *
 * Peak flows (m³/s) for MAF and return periods 5 / 10 / 20 / 50 / 100 / 1000 years.
 */

export const NIWA_FLOOD_LOOKUP_URL =
  'https://niwa.maps.arcgis.com/apps/instant/lookup/index.html?appid=dbcaedb2073b41b6993bd0155e5d8c53'

export const NIWA_FLOOD_FEATURE_URL =
  'https://services3.arcgis.com/fp1tibNcN9mbExhG/arcgis/rest/services/NZ_Flood_Statistics_Henderson_Collins_V2_REC1_Layer_WFL1/FeatureServer/0/query'

export type FloodReturnPeriodYr = 2 | 5 | 10 | 20 | 50 | 100 | 1000

/** Mean annual flood is treated as ~2.33 yr; we label it MAF / ~2 yr. */
export type FloodFlowEstimate = {
  returnPeriodYr: FloodReturnPeriodYr | 'MAF'
  label: string
  /** Peak flow m³/s */
  flowM3s: number
  /** Standard error m³/s when available */
  seM3s?: number
  /** Approximate AEP (1 / return period) */
  aep: number
}

export type FloodHazardSource = 'niwa-api' | 'none' | 'error'

export type FloodSiteHazard = {
  lat: number
  lng: number
  /** True when a REC reach was found near the structure (bridge over / beside a stream) */
  overStream: boolean
  riverName?: string
  nzReach?: number
  catchmentKm2?: number
  streamOrder?: number
  /** Search radius used (m) */
  searchRadiusM: number
  flows: FloodFlowEstimate[]
  source: FloodHazardSource
  fetchedAt: string
  mapUrl: string
  note?: string
}

type NiwaAttrs = {
  NZREACH?: number
  Rivername?: string
  Areakm2?: number
  Strm_Order?: number
  H_C18_MAF?: number
  H_C18_5_yr?: number
  H_C18_10y?: number
  H_C18_20y?: number
  H_C18_50y?: number
  H_C18_100y?: number
  H_C18_1000?: number
  HCse_MAF?: number
  HCse_5y?: number
  HCse_10y?: number
  HCse_20y?: number
  HCse_50y?: number
  HCse_100y?: number
  HCse_1000y?: number
}

const memoryCache = new Map<string, FloodSiteHazard>()
const CACHE_STORAGE_KEY = 'bridge-network-flood-hazard-v1'
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`
}

function readCache(key: string): FloodSiteHazard | null {
  const mem = memoryCache.get(key)
  if (mem) return mem
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, FloodSiteHazard>
    const hit = parsed[key]
    if (!hit) return null
    if (Date.now() - Date.parse(hit.fetchedAt) > CACHE_TTL_MS) return null
    memoryCache.set(key, hit)
    return hit
  } catch {
    return null
  }
}

function writeCache(key: string, value: FloodSiteHazard) {
  memoryCache.set(key, value)
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY)
    const parsed = (raw ? JSON.parse(raw) : {}) as Record<string, FloodSiteHazard>
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

function num(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

function buildFlows(attrs: NiwaAttrs): FloodFlowEstimate[] {
  const rows: Array<{
    returnPeriodYr: FloodReturnPeriodYr | 'MAF'
    label: string
    flow?: number
    se?: number
    aep: number
  }> = [
    { returnPeriodYr: 'MAF', label: 'MAF (~2.3 yr)', flow: num(attrs.H_C18_MAF), se: num(attrs.HCse_MAF), aep: 0.43 },
    { returnPeriodYr: 5, label: '5 yr (20% AEP)', flow: num(attrs.H_C18_5_yr), se: num(attrs.HCse_5y), aep: 0.2 },
    { returnPeriodYr: 10, label: '10 yr (10% AEP)', flow: num(attrs.H_C18_10y), se: num(attrs.HCse_10y), aep: 0.1 },
    { returnPeriodYr: 20, label: '20 yr (5% AEP)', flow: num(attrs.H_C18_20y), se: num(attrs.HCse_20y), aep: 0.05 },
    { returnPeriodYr: 50, label: '50 yr (2% AEP)', flow: num(attrs.H_C18_50y), se: num(attrs.HCse_50y), aep: 0.02 },
    { returnPeriodYr: 100, label: '100 yr (1% AEP)', flow: num(attrs.H_C18_100y), se: num(attrs.HCse_100y), aep: 0.01 },
    { returnPeriodYr: 1000, label: '1000 yr (0.1% AEP)', flow: num(attrs.H_C18_1000), se: num(attrs.HCse_1000y), aep: 0.001 },
  ]
  return rows
    .filter((r) => r.flow != null)
    .map((r) => ({
      returnPeriodYr: r.returnPeriodYr,
      label: r.label,
      flowM3s: Number(r.flow!.toFixed(2)),
      seM3s: r.se != null ? Number(r.se.toFixed(2)) : undefined,
      aep: r.aep,
    }))
}

/**
 * Score 8–98 from flood intensity: growth of Q100 vs MAF and absolute Q100 scale.
 * Higher growth curves / larger peak flows → higher hydraulic risk share.
 */
export function floodFlowsToScore(hazard: FloodSiteHazard): number {
  if (!hazard.overStream || hazard.flows.length === 0) return 12
  const maf = hazard.flows.find((f) => f.returnPeriodYr === 'MAF')?.flowM3s ?? 0
  const q100 = hazard.flows.find((f) => f.returnPeriodYr === 100)?.flowM3s ?? 0
  const growth = maf > 0 ? q100 / maf : 1
  const size = Math.log10(Math.max(q100, 1) + 1) // ~0–3+
  const raw = 18 + (growth - 1.5) * 22 + size * 14
  return Math.round(Math.min(98, Math.max(8, raw)))
}

function emptyHazard(
  lat: number,
  lng: number,
  source: FloodHazardSource,
  note: string,
  searchRadiusM: number,
): FloodSiteHazard {
  return {
    lat,
    lng,
    overStream: false,
    searchRadiusM,
    flows: [],
    source,
    fetchedAt: new Date().toISOString(),
    mapUrl: `${NIWA_FLOOD_LOOKUP_URL}&center=${lng}%2C${lat}&level=12`,
    note,
  }
}

/**
 * Look up NIWA flood frequency estimates for the nearest REC stream reach.
 * Uses a spatial buffer (default 2 km) — suitable for bridges over / beside a stream.
 */
export async function lookupFloodHazard(
  lat: number,
  lng: number,
  options?: { searchRadiusM?: number; force?: boolean },
): Promise<FloodSiteHazard> {
  const searchRadiusM = options?.searchRadiusM ?? 2000
  const key = cacheKey(lat, lng)
  if (!options?.force) {
    const cached = readCache(key)
    if (cached) return cached
  }

  const params = new URLSearchParams({
    f: 'json',
    geometry: `${lng},${lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    distance: String(searchRadiusM),
    units: 'esriSRUnit_Meter',
    outFields: [
      'NZREACH',
      'Rivername',
      'Areakm2',
      'Strm_Order',
      'H_C18_MAF',
      'H_C18_5_yr',
      'H_C18_10y',
      'H_C18_20y',
      'H_C18_50y',
      'H_C18_100y',
      'H_C18_1000',
      'HCse_MAF',
      'HCse_5y',
      'HCse_10y',
      'HCse_20y',
      'HCse_50y',
      'HCse_100y',
      'HCse_1000y',
    ].join(','),
    returnGeometry: 'false',
    resultRecordCount: '25',
  })

  try {
    const res = await fetch(`${NIWA_FLOOD_FEATURE_URL}?${params.toString()}`)
    if (!res.ok) throw new Error(`NIWA flood HTTP ${res.status}`)
    const data = (await res.json()) as {
      features?: Array<{ attributes?: NiwaAttrs }>
      error?: { message?: string }
    }
    if (data.error) throw new Error(data.error.message ?? 'NIWA query error')

    const features = data.features ?? []
    if (!features.length) {
      const none = emptyHazard(
        lat,
        lng,
        'none',
        `No REC stream reach within ${searchRadiusM} m — open NIWA lookup to check nearby waterways.`,
        searchRadiusM,
      )
      writeCache(key, none)
      return none
    }

    // Prefer the largest catchment (main channel) near the structure
    const best = [...features]
      .map((f) => f.attributes ?? {})
      .sort((a, b) => (num(b.Areakm2) ?? 0) - (num(a.Areakm2) ?? 0))[0]

    const flows = buildFlows(best)
    const riverName = (best.Rivername ?? '').trim() || undefined
    const hazard: FloodSiteHazard = {
      lat,
      lng,
      overStream: flows.length > 0,
      riverName,
      nzReach: best.NZREACH,
      catchmentKm2: num(best.Areakm2)
        ? Number(num(best.Areakm2)!.toFixed(2))
        : undefined,
      streamOrder: best.Strm_Order,
      searchRadiusM,
      flows,
      source: 'niwa-api',
      fetchedAt: new Date().toISOString(),
      mapUrl: `${NIWA_FLOOD_LOOKUP_URL}&center=${lng}%2C${lat}&level=13`,
      note: riverName
        ? `Nearest reach: ${riverName}`
        : `Nearest REC reach ${best.NZREACH ?? ''}`.trim(),
    }
    writeCache(key, hazard)
    return hazard
  } catch (err) {
    const failed = emptyHazard(
      lat,
      lng,
      'error',
      err instanceof Error ? err.message : 'NIWA flood lookup failed',
      searchRadiusM,
    )
    return failed
  }
}

export async function lookupFloodHazardBatch(
  sites: Array<{ id: string; lat: number; lng: number }>,
): Promise<Map<string, FloodSiteHazard>> {
  const out = new Map<string, FloodSiteHazard>()
  const concurrency = 2
  for (let i = 0; i < sites.length; i += concurrency) {
    const chunk = sites.slice(i, i + concurrency)
    const results = await Promise.all(
      chunk.map(async (s) => [s.id, await lookupFloodHazard(s.lat, s.lng)] as const),
    )
    for (const [id, hazard] of results) out.set(id, hazard)
  }
  return out
}
