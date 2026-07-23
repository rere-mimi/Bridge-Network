import {
  descriptionForElement,
  elementsForFamily,
  groupLabel,
  materialFromBridge,
  type ElementGroup,
  type StructureFamily,
} from './elementSchedule'
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
  group: ElementGroup,
  spanLengthM: number,
  deckWidthM: number,
): number {
  if (unit === 'm²') {
    if (group === 'span') return Math.round(spanLengthM * deckWidthM)
    return Math.round(deckWidthM * 4)
  }
  if (unit === 'm') {
    if (group === 'span') return Math.round(spanLengthM * 2)
    return Math.round(deckWidthM)
  }
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
  girderCountPerSpan?: number
  /** Bridge material string used to pick Appendix F material variant */
  material?: string
}

/**
 * Build Appendix C inventory instances for a bridge.
 * Groups follow Table C2 designations:
 * - Approaches AP1, AP2
 * - Abutments A1, A2
 * - Piers P1..P(spans-1)
 * - Spans S1..Sn
 *
 * Element IDs use schedule numbers, e.g. S1-200, S2-201-4, P1-404.
 */
export function buildAppendixCElements(options: BuildElementsOptions): BridgeElement[] {
  const {
    spans,
    lengthM,
    family,
    deckWidthM = 12,
    conditionBase = 75,
    riskBase = 45,
    girderCountPerSpan = 4,
    material = 'Concrete',
  } = options

  const spanLength = lengthM / Math.max(spans, 1)
  const catalogue = elementsForFamily(family)
  const preferredMaterial = materialFromBridge(material)
  const elements: BridgeElement[] = []

  const pushGroup = (group: ElementGroup, index: number) => {
    const groupId = groupLabel(group, index)
    for (const el of catalogue) {
      if (!el.groups.includes(group)) continue

      // Prefer one joint / bearing type per group
      if ([101, 102, 103, 104, 105, 106, 107, 108].includes(el.no)) continue
      if ([300, 301, 303, 304, 305].includes(el.no)) continue
      if (family === 'girder' && el.no === 202) continue
      if (family === 'box' && el.no === 201) continue
      if (family !== 'arch' && (el.no === 204 || el.no === 205 || el.no === 207)) continue
      if (family === 'arch' && (el.no === 201 || el.no === 202)) continue

      let quantity = defaultQuantity(el.unit, group, spanLength, deckWidthM)
      if (el.no === 201 || el.no === 202) quantity = girderCountPerSpan
      if (el.no === 302) quantity = girderCountPerSpan
      if (el.no === 2 || el.no === 3) quantity = Math.round(spanLength * 2)
      if (el.no === 404 || el.no === 407) quantity = group === 'pier' ? 2 : 4

      const desc = descriptionForElement(el.no, preferredMaterial)

      // Open beams: one inventory row per beam line on the span
      if (el.no === 201 && group === 'span') {
        for (let g = 1; g <= girderCountPerSpan; g++) {
          const id = `${groupId}-${el.no}-${g}`
          const conditionScore = hashScore(id, conditionBase - 4)
          const riskScore = hashScore(`${id}-r`, riskBase + 8)
          elements.push({
            id,
            code: String(el.no),
            scheduleNo: el.no,
            name: `${el.name} ${g}`,
            category: el.category,
            group,
            groupId,
            significance: el.significance as 1 | 2 | 3 | 4,
            unit: el.unit,
            totalQuantity: 1,
            conditionScore,
            riskScore,
            band: bandFromScore(conditionScore),
            material: desc?.material ?? preferredMaterial,
            descriptionTitle: desc?.title,
            description: desc?.description,
          })
        }
        continue
      }

      const id = `${groupId}-${el.no}`
      const conditionScore = hashScore(id, conditionBase)
      const riskScore = hashScore(`${id}-r`, riskBase)
      elements.push({
        id,
        code: String(el.no),
        scheduleNo: el.no,
        name: el.name,
        category: el.category,
        group,
        groupId,
        significance: el.significance as 1 | 2 | 3 | 4,
        unit: el.unit,
        totalQuantity: quantity,
        conditionScore,
        riskScore,
        band: bandFromScore(conditionScore),
        material: desc?.material ?? preferredMaterial,
        descriptionTitle: desc?.title,
        description: desc?.description,
      })
    }
  }

  pushGroup('approach', 1)
  pushGroup('approach', 2)
  pushGroup('abutment', 1)

  for (let s = 1; s <= spans; s++) {
    pushGroup('span', s)
    if (s < spans) pushGroup('pier', s)
  }

  pushGroup('abutment', 2)
  return elements
}

/** @deprecated Prefer buildAppendixCElements — kept as alias for existing imports. */
export const buildAppendixBElements = buildAppendixCElements

export function elementsByGroup(elements: BridgeElement[]) {
  const map = new Map<string, BridgeElement[]>()
  for (const el of elements) {
    const list = map.get(el.groupId) ?? []
    list.push(el)
    map.set(el.groupId, list)
  }
  return map
}
