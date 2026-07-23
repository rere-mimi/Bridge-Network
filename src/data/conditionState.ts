/**
 * Provisional condition state (1–4) from defect extent.
 * Placeholder until the official severity × extent algorithm is uploaded.
 */

import type { BridgeAsset, BridgeElement, ConditionBand, ConditionState, DrawnDefect } from '../types'
import { summarizeElementDefects, type ElementDefectSummary } from './defectMetrics'

export type ConditionStateResult = {
  conditionState: ConditionState
  conditionScore: number
  band: ConditionBand
  basis: string
  summary: ElementDefectSummary
  provisional: true
}

function bandFromScore(score: number): ConditionBand {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 65) return 'fair'
  if (score >= 50) return 'poor'
  return 'critical'
}

function scoreFromState(cs: ConditionState): number {
  switch (cs) {
    case 1:
      return 94
    case 2:
      return 78
    case 3:
      return 58
    case 4:
      return 38
  }
}

/**
 * Map percent area in defect + crack density → CS 1–4.
 * Conservative engineering heuristic for planning only.
 */
export function conditionStateFromExtent(summary: ElementDefectSummary): {
  conditionState: ConditionState
  basis: string
} {
  const pct = summary.percentAreaInDefect
  const dens = summary.crackDensityMPerM2

  if (summary.defectCount === 0) {
    return { conditionState: 1, basis: 'No pinned defects on element' }
  }

  let cs: ConditionState = 1
  if (pct >= 25 || dens >= 2.5) cs = 4
  else if (pct >= 10 || dens >= 1.2) cs = 3
  else if (pct >= 2 || dens >= 0.35) cs = 2
  else cs = 1

  // Presence of multiple defects nudges severity up one step (cap CS4)
  if (summary.defectCount >= 4 && cs < 4) {
    cs = (cs + 1) as ConditionState
  }

  return {
    conditionState: cs,
    basis: `${pct.toFixed(1)}% area in defect · crack density ${dens.toFixed(3)} m/m² · ${summary.defectCount} defect(s)`,
  }
}

export function evaluateElementConditionState(
  element: BridgeElement,
  defects: DrawnDefect[],
  sizeM?: { length: number; width: number; height: number } | null,
  bridge?: BridgeAsset | null,
): ConditionStateResult {
  const summary = summarizeElementDefects(element, defects, sizeM, bridge)
  const { conditionState, basis } = conditionStateFromExtent(summary)
  const conditionScore = scoreFromState(conditionState)
  return {
    conditionState,
    conditionScore,
    band: bandFromScore(conditionScore),
    basis,
    summary,
    provisional: true,
  }
}

/** Apply provisional CS to drawn defects missing conditionState. */
export function stampDefectConditionStates(
  defects: DrawnDefect[],
  element: BridgeElement,
  sizeM?: { length: number; width: number; height: number } | null,
): DrawnDefect[] {
  const evalResult = evaluateElementConditionState(element, defects, sizeM)
  return defects.map((d) => {
    if (d.elementId !== element.id) return d
    if (d.conditionState != null) return d
    return { ...d, conditionState: evalResult.conditionState }
  })
}
