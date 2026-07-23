/**
 * NZ National Seismic Hazard Model (NSHM) lookup via the public Kororaa GraphQL API
 * used by https://nshm.gns.cri.nz/HazardMaps
 *
 * PGA is taken from the mean hazard curve at Vs30 = 400 m/s for a 10% probability
 * of exceedance in 50 years (standard site-hazard reference).
 */

export const NSHM_HAZARD_MAPS_URL = 'https://nshm.gns.cri.nz/HazardMaps'
export const NSHM_HAZARD_CURVES_URL = 'https://nshm.gns.cri.nz/HazardCurves'
export const NSHM_API_URL = 'https://nshm-api.gns.cri.nz/kororaa-app-api/graphql'
export const NSHM_MODEL_ID = 'NSHM_v1.0.4'

export const NSHM_DEFAULT_VS30 = 400
export const NSHM_POE = 0.1
export const NSHM_INVESTIGATION_YEARS = 50

/** Annual exceedance rate for 10% in 50 years: -ln(1 - POE) / years */
export const NSHM_ANNUAL_RATE =
  -Math.log(1 - NSHM_POE) / NSHM_INVESTIGATION_YEARS

export type NshmHazardSource = 'nshm-api' | 'regional-fallback'

export type NshmSiteHazard = {
  lat: number
  lng: number
  /** Peak ground acceleration (g) at 10% PoE in 50 years */
  pga: number
  vs30: number
  poe: number
  investigationYears: number
  model: string
  source: NshmHazardSource
  locationCode?: string
  locationName?: string
  fetchedAt: string
  mapUrl: string
  curvesUrl: string
}

type HazardCurve = {
  hazard_model?: string | null
  imt?: string | null
  loc?: string | null
  agg?: string | null
  vs30?: number | null
  curve?: {
    levels?: Array<number | null> | null
    values?: Array<number | null> | null
  } | null
}

type HazardCurvesResponse = {
  data?: {
    hazard_curves?: {
      ok?: boolean | null
      locations?: Array<{
        lat?: number | null
        lon?: number | null
        code?: string | null
        name?: string | null
        key?: string | null
      } | null> | null
      curves?: Array<HazardCurve | null> | null
    } | null
  }
  errors?: Array<{ message?: string }>
}

const HAZARD_CURVES_QUERY = `
  query SiteHazard(
    $hazard_model: String
    $vs30s: [Int]
    $imts: [String]
    $locs: [String]
    $aggs: [String]
    $resolution: Float
  ) {
    hazard_curves(
      hazard_model: $hazard_model
      vs30s: $vs30s
      imts: $imts
      locs: $locs
      aggs: $aggs
      resolution: $resolution
    ) {
      ok
      locations {
        lat
        lon
        code
        name
        key
      }
      curves {
        hazard_model
        imt
        loc
        agg
        vs30
        curve {
          levels
          values
        }
      }
    }
  }
`

const memoryCache = new Map<string, NshmSiteHazard>()
const CACHE_STORAGE_KEY = 'bridge-network-nshm-hazard-v1'

/** Approximate PGA (g, 10%/50yr, soft soil) by NZ region — used when the API is unreachable. */
const REGIONAL_PGA: Array<{ match: RegExp; pga: number; label: string }> = [
  { match: /wellington|wairarapa|kapiti/i, pga: 0.72, label: 'Wellington region' },
  { match: /nelson|marlborough|blenheim/i, pga: 0.55, label: 'Upper South Island' },
  { match: /hawke|napier|gisborne|east coast/i, pga: 0.48, label: 'East Coast' },
  { match: /canterbury|christchurch|ashburton|timaru/i, pga: 0.38, label: 'Canterbury' },
  { match: /west coast|greymouth|hokitika/i, pga: 0.42, label: 'West Coast' },
  { match: /manawat|palmerston|whanganui|taranaki/i, pga: 0.36, label: 'Lower North Island' },
  { match: /bay of plenty|rotorua|taupo|waikato|hamilton/i, pga: 0.28, label: 'Central North Island' },
  { match: /auckland|northland|whangarei/i, pga: 0.14, label: 'Auckland / Northland' },
  { match: /otago|dunedin|southland|invercargill|queenstown/i, pga: 0.22, label: 'Southern South Island' },
]

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`
}

function locString(lat: number, lng: number): string {
  return `${lat}~${lng}`
}

export function nshmMapUrl(lat: number, lng: number): string {
  const q = new URLSearchParams({
    lat: lat.toFixed(4),
    lon: lng.toFixed(4),
    vs30: String(NSHM_DEFAULT_VS30),
    imt: 'PGA',
    poe: String(NSHM_POE),
  })
  return `${NSHM_HAZARD_MAPS_URL}?${q.toString()}`
}

export function nshmCurvesUrl(lat: number, lng: number): string {
  const q = new URLSearchParams({
    lat: lat.toFixed(4),
    lon: lng.toFixed(4),
    vs30: String(NSHM_DEFAULT_VS30),
  })
  return `${NSHM_HAZARD_CURVES_URL}?${q.toString()}`
}

function readPersistedCache(): Record<string, NshmSiteHazard> {
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, NshmSiteHazard>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writePersistedCache(entry: NshmSiteHazard) {
  try {
    const all = readPersistedCache()
    all[cacheKey(entry.lat, entry.lng)] = entry
    const keys = Object.keys(all)
    if (keys.length > 80) {
      for (const key of keys.slice(0, keys.length - 80)) delete all[key]
    }
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(all))
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Interpolate PGA (g) at a target annual exceedance rate from a hazard curve.
 * Curve: levels = PGA (g), values = annual rates (or equivalent).
 */
export function pgaAtAnnualRate(
  levels: number[],
  values: number[],
  targetRate = NSHM_ANNUAL_RATE,
): number | null {
  if (levels.length < 2 || levels.length !== values.length) return null

  const pairs = levels
    .map((level, i) => ({ level, value: values[i] }))
    .filter((p) => Number.isFinite(p.level) && Number.isFinite(p.value) && p.value > 0)
    .sort((a, b) => b.value - a.value)

  if (!pairs.length) return null
  if (targetRate >= pairs[0].value) return pairs[0].level
  if (targetRate <= pairs[pairs.length - 1].value) return pairs[pairs.length - 1].level

  for (let i = 0; i < pairs.length - 1; i++) {
    const a = pairs[i]
    const b = pairs[i + 1]
    if (targetRate <= a.value && targetRate >= b.value) {
      const logA = Math.log(a.value)
      const logB = Math.log(b.value)
      const logT = Math.log(targetRate)
      const t = (logA - logT) / (logA - logB || 1e-12)
      const logLevel = Math.log(Math.max(a.level, 1e-12)) + t * (Math.log(Math.max(b.level, 1e-12)) - Math.log(Math.max(a.level, 1e-12)))
      return Math.exp(logLevel)
    }
  }
  return pairs[Math.floor(pairs.length / 2)].level
}

/** Map PGA (g) to a 0–100 seismic intensity score for risk blending. */
export function pgaToSeismicScore(pga: number): number {
  // Soft soil NZ sites: ~0.1g low, ~0.35g moderate, ~0.55g high, ≥0.75g critical
  const score = 12 + 95 * (1 - Math.exp(-2.4 * Math.max(0, pga)))
  return Math.round(Math.min(98, Math.max(8, score)))
}

export function estimateRegionalPga(
  lat: number,
  lng: number,
  region?: string,
  city?: string,
): { pga: number; label: string } {
  const haystack = `${region ?? ''} ${city ?? ''}`
  for (const row of REGIONAL_PGA) {
    if (row.match.test(haystack)) return { pga: row.pga, label: row.label }
  }

  // Latitude bands across NZ when region text is unknown
  if (lat > -37.5) return { pga: 0.16, label: 'Upper North Island (approx.)' }
  if (lat > -39.5) return { pga: 0.3, label: 'Central North Island (approx.)' }
  if (lat > -41.8) return { pga: lng > 174 ? 0.65 : 0.4, label: 'Lower North Island (approx.)' }
  if (lat > -43.2) return { pga: 0.45, label: 'Upper South Island (approx.)' }
  if (lat > -44.5) return { pga: 0.36, label: 'Canterbury (approx.)' }
  return { pga: 0.22, label: 'Southern South Island (approx.)' }
}

function fallbackHazard(
  lat: number,
  lng: number,
  region?: string,
  city?: string,
): NshmSiteHazard {
  const est = estimateRegionalPga(lat, lng, region, city)
  return {
    lat,
    lng,
    pga: est.pga,
    vs30: NSHM_DEFAULT_VS30,
    poe: NSHM_POE,
    investigationYears: NSHM_INVESTIGATION_YEARS,
    model: NSHM_MODEL_ID,
    source: 'regional-fallback',
    locationName: est.label,
    fetchedAt: new Date().toISOString(),
    mapUrl: nshmMapUrl(lat, lng),
    curvesUrl: nshmCurvesUrl(lat, lng),
  }
}

async function fetchHazardFromApi(lat: number, lng: number): Promise<NshmSiteHazard | null> {
  const response = await fetch(NSHM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      query: HAZARD_CURVES_QUERY,
      variables: {
        hazard_model: NSHM_MODEL_ID,
        vs30s: [NSHM_DEFAULT_VS30],
        imts: ['PGA'],
        locs: [locString(lat, lng)],
        aggs: ['mean'],
        resolution: 0.1,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`NSHM API HTTP ${response.status}`)
  }

  const json = (await response.json()) as HazardCurvesResponse
  if (json.errors?.length) {
    throw new Error(json.errors[0]?.message ?? 'NSHM GraphQL error')
  }

  const result = json.data?.hazard_curves
  const mean = result?.curves?.find(
    (c) => c && c.imt === 'PGA' && (c.agg === 'mean' || c.agg === 'Mean'),
  )
  const levels = (mean?.curve?.levels ?? []).filter((n): n is number => typeof n === 'number')
  const values = (mean?.curve?.values ?? []).filter((n): n is number => typeof n === 'number')
  const pga = pgaAtAnnualRate(levels, values)
  if (pga == null) return null

  const loc = result?.locations?.[0]
  return {
    lat,
    lng,
    pga: Number(pga.toFixed(3)),
    vs30: NSHM_DEFAULT_VS30,
    poe: NSHM_POE,
    investigationYears: NSHM_INVESTIGATION_YEARS,
    model: mean?.hazard_model ?? NSHM_MODEL_ID,
    source: 'nshm-api',
    locationCode: loc?.code ?? undefined,
    locationName: loc?.name ?? loc?.key ?? undefined,
    fetchedAt: new Date().toISOString(),
    mapUrl: nshmMapUrl(lat, lng),
    curvesUrl: nshmCurvesUrl(lat, lng),
  }
}

export async function lookupNshmHazard(
  lat: number,
  lng: number,
  opts?: { region?: string; city?: string; force?: boolean },
): Promise<NshmSiteHazard> {
  const key = cacheKey(lat, lng)
  if (!opts?.force) {
    const mem = memoryCache.get(key)
    if (mem) return mem
    const persisted = readPersistedCache()[key]
    if (persisted && Date.now() - Date.parse(persisted.fetchedAt) < 1000 * 60 * 60 * 24 * 14) {
      memoryCache.set(key, persisted)
      return persisted
    }
  }

  try {
    const live = await fetchHazardFromApi(lat, lng)
    if (live) {
      memoryCache.set(key, live)
      writePersistedCache(live)
      return live
    }
  } catch {
    // fall through to regional estimate
  }

  const fb = fallbackHazard(lat, lng, opts?.region, opts?.city)
  memoryCache.set(key, fb)
  writePersistedCache(fb)
  return fb
}

export async function lookupNshmHazardBatch(
  sites: Array<{ id: string; lat: number; lng: number; region?: string; city?: string }>,
  concurrency = 2,
): Promise<Map<string, NshmSiteHazard>> {
  const out = new Map<string, NshmSiteHazard>()
  let index = 0

  async function worker() {
    while (index < sites.length) {
      const current = sites[index++]
      const hazard = await lookupNshmHazard(current.lat, current.lng, {
        region: current.region,
        city: current.city,
      })
      out.set(current.id, hazard)
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, sites.length) }, () => worker())
  await Promise.all(workers)
  return out
}
