import type { BridgeAsset, RiskLevel } from '../types'
import { lookupNshmHazard, lookupNshmHazardBatch, pgaToSeismicScore, type NshmSiteHazard } from './nshmHazard'

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

function renormalizeBreakdown(
  previous: BridgeAsset['riskBreakdown'],
  seismicPct: number,
): BridgeAsset['riskBreakdown'] {
  const seismic = Math.round(Math.min(42, Math.max(8, seismicPct)))
  const restKeys = ['structural', 'hydraulic', 'traffic', 'other'] as const
  const restTotal = restKeys.reduce((sum, key) => sum + previous[key], 0) || 1
  const remaining = 100 - seismic
  const next = {
    structural: 0,
    hydraulic: 0,
    seismic,
    traffic: 0,
    other: 0,
  }
  let used = 0
  restKeys.forEach((key, i) => {
    if (i === restKeys.length - 1) {
      next[key] = Math.max(4, remaining - used)
    } else {
      const value = Math.max(4, Math.round((previous[key] / restTotal) * remaining))
      next[key] = value
      used += value
    }
  })
  const sum = next.structural + next.hydraulic + next.seismic + next.traffic + next.other
  if (sum !== 100) next.other = Math.max(4, next.other + (100 - sum))
  return next
}

/** Fold an NSHM site hazard into structure risk score / level / breakdown. */
export function applySeismicHazard(bridge: BridgeAsset, hazard: NshmSiteHazard): BridgeAsset {
  const seismicScore = pgaToSeismicScore(hazard.pga)
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
        0.42 * conditionRisk + 0.4 * seismicScore + 0.18 * (statusPenalty(bridge.status) + defectBoost),
      ),
    ),
  )

  // Seismic share of the donut rises with hazard intensity
  const seismicPct = 10 + seismicScore * 0.32
  const riskBreakdown = renormalizeBreakdown(bridge.riskBreakdown, seismicPct)

  return {
    ...bridge,
    riskScore,
    riskLevel: riskLevelFromScore(riskScore),
    riskBreakdown,
    seismicHazard: hazard,
  }
}

export async function enrichStructureWithNshm(bridge: BridgeAsset): Promise<BridgeAsset> {
  const hazard = await lookupNshmHazard(bridge.lat, bridge.lng, {
    region: bridge.region,
    city: bridge.city,
  })
  return applySeismicHazard(bridge, hazard)
}

export async function enrichStructuresWithNshm(
  bridges: BridgeAsset[],
): Promise<BridgeAsset[]> {
  const hazards = await lookupNshmHazardBatch(
    bridges.map((b) => ({
      id: b.id,
      lat: b.lat,
      lng: b.lng,
      region: b.region,
      city: b.city,
    })),
  )
  return bridges.map((b) => {
    const hazard = hazards.get(b.id)
    return hazard ? applySeismicHazard(b, hazard) : b
  })
}

export function needsNshmEnrichment(bridge: BridgeAsset): boolean {
  const h = bridge.seismicHazard
  if (!h) return true
  return Math.abs(h.lat - bridge.lat) > 0.0005 || Math.abs(h.lng - bridge.lng) > 0.0005
}
