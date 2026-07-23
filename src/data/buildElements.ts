import {
  componentsForFamily,
  groupLabel,
  type ComponentGroup,
  type StructureFamily,
} from './componentCatalogue'
import type { BridgeElement, ConditionBand } from '../types'

function bandFromScore(score: number): ConditionBand {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 65) return 'fair'
  if (score >= 50) return 'poor'
  return 'critical'
}

function hashScore(seed: string, base: number, spread = 18): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const delta = (h % (spread * 2 + 1)) - spread
  return Math.max(45, Math.min(98, base + delta))
}

function defaultQuantity(
  unit: BridgeElement['unit'],
  group: ComponentGroup,
  spanLengthM: number,
  deckWidthM: number,
): number {
  if (unit === 'm²') {
    if (group === 'span') return Math.round(spanLengthM * deckWidthM)
    return Math.round(deckWidthM * 4)
  }
  if (unit === 'm') {
    if (group === 'span') return Math.round(spanLengthM * (unit === 'm' ? 2 : 1))
    return Math.round(deckWidthM)
  }
  // each
  if (group === 'span') return 4
  if (group === 'pier') return 2
  return 1
}

export type BuildElementsOptions = {
  spans: number
  lengthM: number
  family: StructureFamily
  deckWidthM?: number
  conditionBase?: number
  riskBase?: number
  /** Prefer open girders vs box vs arch component set */
  girderCountPerSpan?: number
}

/**
 * Build Appendix B inventory instances for a bridge.
 * Groups follow Table B2 designations:
 * - Abutments A1, A2
 * - Piers P1..P(spans-1)
 * - Spans S1..Sn  (incremented per span)
 * - Approaches AP1, AP2
 */
export function buildAppendixBElements(options: BuildElementsOptions): BridgeElement[] {
  const {
    spans,
    lengthM,
    family,
    deckWidthM = 12,
    conditionBase = 75,
    riskBase = 45,
    girderCountPerSpan = 4,
  } = options

  const spanLength = lengthM / Math.max(spans, 1)
  const catalogue = componentsForFamily(family)
  const elements: BridgeElement[] = []

  const pushGroup = (group: ComponentGroup, index: number) => {
    const groupId = groupLabel(group, index)
    for (const comp of catalogue) {
      if (!comp.groups.includes(group)) continue

      // Prefer one joint type / one bearing type / one girder type per group
      if (comp.no === 11 || comp.no === 15) continue
      if (comp.no === 40 || comp.no === 41) continue
      if (family === 'girder' && comp.no === 21) continue
      if (family === 'box' && comp.no === 22) continue
      if (family !== 'arch' && comp.no === 25) continue
      if (family === 'arch' && (comp.no === 21 || comp.no === 22)) continue
      if (comp.no === 55 && group !== 'pier') continue
      if (comp.no === 54 && group === 'pier') continue // use integral headstock on piers

      let quantity = defaultQuantity(comp.unit, group, spanLength, deckWidthM)
      if (comp.no === 22) quantity = girderCountPerSpan
      if (comp.no === 42) quantity = girderCountPerSpan
      if (comp.no === 2 || comp.no === 3) quantity = Math.round(spanLength * 2)

      // For open girders, create one inventory row per girder line on the span
      if (comp.no === 22 && group === 'span') {
        for (let g = 1; g <= girderCountPerSpan; g++) {
          const id = `${groupId}-${comp.code}${g}`
          const conditionScore = hashScore(id, conditionBase - 4)
          const riskScore = hashScore(`${id}-r`, riskBase + 8)
          elements.push({
            id,
            code: comp.code,
            scheduleNo: comp.no,
            name: `${comp.name} ${g}`,
            category: comp.category,
            group,
            groupId,
            significance: comp.significance,
            unit: comp.unit,
            totalQuantity: 1,
            conditionScore,
            riskScore,
            band: bandFromScore(conditionScore),
          })
        }
        continue
      }

      const id = `${groupId}-${comp.code}`
      const conditionScore = hashScore(id, conditionBase)
      const riskScore = hashScore(`${id}-r`, riskBase)
      elements.push({
        id,
        code: comp.code,
        scheduleNo: comp.no,
        name: comp.name,
        category: comp.category,
        group,
        groupId,
        significance: comp.significance,
        unit: comp.unit,
        totalQuantity: quantity,
        conditionScore,
        riskScore,
        band: bandFromScore(conditionScore),
      })
    }
  }

  // Approaches
  pushGroup('approach', 1)
  pushGroup('approach', 2)

  // Abutments
  pushGroup('abutment', 1)

  // Spans incremented S1..Sn, with piers between them
  for (let s = 1; s <= spans; s++) {
    pushGroup('span', s)
    if (s < spans) pushGroup('pier', s)
  }

  // Far abutment
  pushGroup('abutment', 2)

  return elements
}

export function elementsByGroup(elements: BridgeElement[]) {
  const map = new Map<string, BridgeElement[]>()
  for (const el of elements) {
    const list = map.get(el.groupId) ?? []
    list.push(el)
    map.set(el.groupId, list)
  }
  return map
}
