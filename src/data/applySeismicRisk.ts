/**
 * Multi-hazard site enrichment for NZ bridges:
 *   - Earthquake → NZ NSHM (existing)
 *   - Flood → NIWA Henderson & Collins flood frequency (streams)
 *   - Geology → GNS 1:250k units + landslide deposits
 */

import type { BridgeAsset, RiskLevel } from '../types'
import { lookupNshmHazard, lookupNshmHazardBatch, pgaToSeismicScore, type NshmSiteHazard } from './nshmHazard'
import { floodFlowsToScore, lookupFloodHazard, lookupFloodHazardBatch, type FloodSiteHazard } from './floodHazard'
import { geologyToScore, lookupGeologyHazard, lookupGeologyHazardBatch, type GeologySiteHazard } from './geologyHazard'

function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 80) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 40) return 'moderate'
  return 'low'
}

function statusPenalty(status: BridgeAsset['status']): number {
  switch (status) {
    case 'closed':
      return 28
    case 'restricted':
      return 18
    case 'watch':
      return 10
    default:
      return 0
  }
}

function pctFromScore(score: number, min: number, max: number): number {
  const t = (score - 8) / (98 - 8)
  return Math.round(min + t * (max - min))
}

/**
 * Rebuild breakdown so flood / seismic / geology shares reflect live site hazards.
 * Remaining mass is split across structural / traffic / other.
 */
export function buildHazardBreakdown(
  previous: BridgeAsset['riskBreakdown'],
  scores: { flood: number; seismic: number; geology: number },
): BridgeAsset['riskBreakdown'] {
  const hydraulic = pctFromScore(scores.flood, 8, 36)
  const seismic = pctFromScore(scores.seismic, 8, 34)
  const geology = pctFromScore(scores.geology, 6, 28)
  const allocated = hydraulic + seismic + geology
  const remaining = Math.max(18, 100 - allocated)
  const restKeys = ['structural', 'traffic', 'other'] as const
  const restTotal = restKeys.reduce((sum, key) => sum + (previous[key] ?? 10), 0) || 1
  const next: BridgeAsset['riskBreakdown'] = {
    structural: 0,
    hydraulic,
    seismic,
    geology,
    traffic: 0,
    other: 0,
  }
  let used = 0
  restKeys.forEach((key, i) => {
    if (i === restKeys.length - 1) {
      next[key] = Math.max(4, remaining - used)
    } else {
      const value = Math.max(4, Math.round(((previous[key] ?? 10) / restTotal) * remaining))
      next[key] = value
      used += value
    }
  })
  const sum =
    next.structural + next.hydraulic + next.seismic + next.geology + next.traffic + next.other
  if (sum !== 100) next.other = Math.max(4, next.other + (100 - sum))
  return next
}

export function applySiteHazards(
  bridge: BridgeAsset,
  hazards: {
    seismic: NshmSiteHazard
    flood: FloodSiteHazard
    geology: GeologySiteHazard
  },
): BridgeAsset {
  const seismicScore = pgaToSeismicScore(hazards.seismic.pga)
  const floodScore = floodFlowsToScore(hazards.flood)
  const geologyScore = geologyToScore(hazards.geology)
  const conditionRisk = Math.max(0, 100 - bridge.conditionIndex)
  const defectBoost = Math.min(
    18,
    bridge.defects.filter((d) => d.status !== 'closed').length * 3 +
      bridge.defects.filter((d) => d.severity === 'critical' || d.severity === 'high').length * 4,
  )

  const riskScore = Math.round(
    Math.min(
      98,
      Math.max(
        8,
        0.28 * conditionRisk +
          0.24 * seismicScore +
          0.22 * floodScore +
          0.16 * geologyScore +
          0.1 * (statusPenalty(bridge.status) + defectBoost),
      ),
    ),
  )

  const previous = {
    structural: bridge.riskBreakdown.structural,
    hydraulic: bridge.riskBreakdown.hydraulic,
    seismic: bridge.riskBreakdown.seismic,
    geology: bridge.riskBreakdown.geology ?? 10,
    traffic: bridge.riskBreakdown.traffic,
    other: bridge.riskBreakdown.other,
  }

  return {
    ...bridge,
    riskScore,
    riskLevel: riskLevelFromScore(riskScore),
    riskBreakdown: buildHazardBreakdown(previous, {
      flood: floodScore,
      seismic: seismicScore,
      geology: geologyScore,
    }),
    seismicHazard: hazards.seismic,
    floodHazard: hazards.flood,
    geologyHazard: hazards.geology,
  }
}

/** @deprecated prefer applySiteHazards — kept for call-site compatibility */
export function applySeismicHazard(bridge: BridgeAsset, hazard: NshmSiteHazard): BridgeAsset {
  const flood: FloodSiteHazard = bridge.floodHazard
    ? {
        ...bridge.floodHazard,
        flows: bridge.floodHazard.flows.map((f) => ({
          ...f,
          returnPeriodYr: f.returnPeriodYr as FloodSiteHazard['flows'][number]['returnPeriodYr'],
        })),
      }
    : {
        lat: bridge.lat,
        lng: bridge.lng,
        overStream: false,
        searchRadiusM: 2000,
        flows: [],
        source: 'none',
        fetchedAt: new Date().toISOString(),
        mapUrl: '',
      }
  const geology: GeologySiteHazard = bridge.geologyHazard ?? {
    lat: bridge.lat,
    lng: bridge.lng,
    landslidesNearby: [],
    softGround: false,
    landslideProximity: 'none',
    source: 'none',
    fetchedAt: new Date().toISOString(),
    geologyMapUrl: '',
    landslideMapUrl: '',
  }
  return applySiteHazards(bridge, { seismic: hazard, flood, geology })
}

export async function enrichStructureWithNshm(bridge: BridgeAsset): Promise<BridgeAsset> {
  return enrichStructureWithSiteHazards(bridge)
}

export async function enrichStructureWithSiteHazards(bridge: BridgeAsset): Promise<BridgeAsset> {
  const [seismic, flood, geology] = await Promise.all([
    lookupNshmHazard(bridge.lat, bridge.lng, {
      region: bridge.region,
      city: bridge.city,
    }),
    lookupFloodHazard(bridge.lat, bridge.lng),
    lookupGeologyHazard(bridge.lat, bridge.lng),
  ])
  return applySiteHazards(bridge, { seismic, flood, geology })
}

export async function enrichStructuresWithNshm(
  bridges: BridgeAsset[],
): Promise<BridgeAsset[]> {
  return enrichStructuresWithSiteHazards(bridges)
}

export async function enrichStructuresWithSiteHazards(
  bridges: BridgeAsset[],
): Promise<BridgeAsset[]> {
  const sites = bridges.map((b) => ({ id: b.id, lat: b.lat, lng: b.lng }))
  const [seismicMap, floodMap, geologyMap] = await Promise.all([
    lookupNshmHazardBatch(
      bridges.map((b) => ({
        id: b.id,
        lat: b.lat,
        lng: b.lng,
        region: b.region,
        city: b.city,
      })),
    ),
    lookupFloodHazardBatch(sites),
    lookupGeologyHazardBatch(sites),
  ])

  return bridges.map((bridge) => {
    const seismic = seismicMap.get(bridge.id)
    const flood = floodMap.get(bridge.id)
    const geology = geologyMap.get(bridge.id)
    if (!seismic || !flood || !geology) return bridge
    return applySiteHazards(bridge, { seismic, flood, geology })
  })
}

export function needsNshmEnrichment(bridge: BridgeAsset): boolean {
  return needsSiteHazardEnrichment(bridge)
}

export function needsSiteHazardEnrichment(bridge: BridgeAsset): boolean {
  const stale = (iso?: string) => {
    if (!iso) return true
    const age = Date.now() - Date.parse(iso)
    return !Number.isFinite(age) || age > 14 * 24 * 60 * 60 * 1000
  }
  if (!bridge.seismicHazard || stale(bridge.seismicHazard.fetchedAt)) return true
  if (!bridge.floodHazard || stale(bridge.floodHazard.fetchedAt)) return true
  if (!bridge.geologyHazard || stale(bridge.geologyHazard.fetchedAt)) return true
  const moved =
    Math.abs(bridge.seismicHazard.lat - bridge.lat) > 0.0008 ||
    Math.abs(bridge.seismicHazard.lng - bridge.lng) > 0.0008
  return moved
}
