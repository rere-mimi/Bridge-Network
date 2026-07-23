import {
  descriptionForElement,
  elementsForFamily,
  formatElementCode,
  formatElementId,
  groupLabel,
  isCulvertFamily,
  isTunnelFamily,
  isWallFamily,
  majorGroupFor,
  materialFromBridge,
  subgroupFor,
  type ElementGroup,
  type StructureFamily,
} from './elementSchedule'
import type { StructureGeometry } from './structureGeometry'
import { defaultGeometry, sizeForSchedule } from './structureGeometry'
import type { BridgeElement, ConditionBand, ElementSizeM } from '../types'

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
  /** 5-digit numeric bridge ID */
  bridgeId: string
  spans: number
  lengthM: number
  family: StructureFamily
  deckWidthM?: number
  conditionBase?: number
  riskBase?: number
  girderCountPerSpan?: number
  /** Bridge material string used to pick Appendix F material variant */
  material?: string
  /** Optional Appendix C element numbers to include (defaults to family set) */
  includeElementNos?: number[]
  /** Beam/pier types and element dimensions */
  geometry?: StructureGeometry
}

function resolveGeometry(options: BuildElementsOptions): StructureGeometry {
  const kind = isCulvertFamily(options.family) ? 'culvert' : 'bridge'
  const base = defaultGeometry({
    lengthM: options.lengthM,
    spans: options.spans,
    deckWidthM: options.deckWidthM ?? 12,
    kind,
    family: options.family,
    girderCountPerSpan: options.girderCountPerSpan,
  })
  if (!options.geometry) return base
  return {
    ...base,
    ...options.geometry,
    girderCountPerSpan:
      options.geometry.girderCountPerSpan ??
      options.girderCountPerSpan ??
      base.girderCountPerSpan,
    elementSizes: {
      ...base.elementSizes,
      ...options.geometry.elementSizes,
    },
  }
}

function applySize(
  scheduleNo: number,
  geometry: StructureGeometry,
  spanLength: number,
): ElementSizeM | undefined {
  const size = { ...sizeForSchedule(geometry, scheduleNo) }
  if (size.length == null && [200, 201, 202, 203, 204, 205].includes(scheduleNo)) {
    size.length = spanLength
  }
  return Object.keys(size).length ? size : undefined
}

/**
 * Build Appendix C inventory instances for a bridge or culvert.
 * Location groups follow Table C2:
 * - Approaches AP1, AP2
 * - Abutments A1, A2 (bridges)
 * - Piers P1..P(spans-1) (bridges)
 * - Spans S1..Sn
 */
export function buildAppendixCElements(options: BuildElementsOptions): BridgeElement[] {
  const {
    bridgeId,
    spans,
    lengthM,
    family,
    deckWidthM = 12,
    conditionBase = 75,
    riskBase = 45,
    material = 'Concrete',
    includeElementNos,
  } = options

  const geometry = resolveGeometry(options)
  const girderCountPerSpan = Math.max(0, geometry.girderCountPerSpan)
  const columnsPerPier = Math.max(1, geometry.columnsPerPier)
  const columnsPerAbutment = Math.max(1, geometry.columnsPerAbutment)
  const beamIsOpen = geometry.beamType === 'open-ibeam' || geometry.beamType === 't-beam'
  const beamIsBox = geometry.beamType === 'box'
  const beamIsSlab = geometry.beamType === 'slab'
  const archSpandrel = geometry.archSpandrelType ?? 'closed'
  const spandrelColumnCount = Math.max(3, geometry.spandrelColumnCount ?? 6)

  const spanLength = lengthM / Math.max(spans, 1)
  const culvert = isCulvertFamily(family)
  const wall = isWallFamily(family)
  const tunnel = isTunnelFamily(family)
  const catalogue = elementsForFamily(family).filter((el) =>
    includeElementNos ? includeElementNos.includes(el.no) : true,
  )
  const preferredMaterial = materialFromBridge(material)
  const elements: BridgeElement[] = []

  const pushGroup = (group: ElementGroup, index: number) => {
    const groupId = groupLabel(group, index)
    for (const el of catalogue) {
      if (!el.groups.includes(group)) continue

      // Prefer one joint / bearing type per group
      if ([101, 102, 103, 104, 105, 106, 107, 108].includes(el.no)) continue
      if ([300, 301, 303, 304, 305].includes(el.no)) continue

      // Beam type drives which primary member is instantiated
      if (beamIsOpen && el.no === 202) continue
      if (beamIsBox && el.no === 201) continue
      if (beamIsSlab && (el.no === 201 || el.no === 202)) continue

      if (family === 'girder' && el.no === 202 && !beamIsBox) continue
      if (family === 'box' && el.no === 201 && !beamIsOpen) continue
      if (family !== 'arch' && (el.no === 204 || el.no === 205 || el.no === 206 || el.no === 207)) {
        continue
      }
      if (family === 'arch') {
        if (el.no === 201 || el.no === 202) continue
        // Closed: barrel 205 + walls 207 · Open: ribs 204 + columns 206
        if (archSpandrel === 'closed' && (el.no === 204 || el.no === 206)) continue
        if (archSpandrel === 'open' && (el.no === 205 || el.no === 207)) continue
      }

      // Pier type filters
      if (group === 'pier') {
        if (geometry.pierType === 'wall' && (el.no === 404 || el.no === 405 || el.no === 407)) continue
        if (geometry.pierType === 'multi-column' && (el.no === 403 || el.no === 405)) continue
        if (geometry.pierType === 'trestle' && (el.no === 403 || el.no === 404)) continue
        if (geometry.pierType === 'pile-bent' && el.no !== 407 && (el.no === 403 || el.no === 404 || el.no === 405)) {
          continue
        }
      }

      let quantity = defaultQuantity(el.unit, group, spanLength, deckWidthM)
      if (el.no === 201 || el.no === 202) quantity = Math.max(1, girderCountPerSpan)
      if (el.no === 302) quantity = Math.max(1, girderCountPerSpan || columnsPerPier)
      if (el.no === 2 || el.no === 3) quantity = Math.round(spanLength * 2)
      if (el.no === 404 || el.no === 405) {
        quantity = group === 'pier' ? columnsPerPier : columnsPerAbutment
      }
      if (el.no === 407) {
        quantity = group === 'pier' ? columnsPerPier : columnsPerAbutment
      }
      if (el.no === 403) quantity = 1
      if (el.no === 206) quantity = spandrelColumnCount
      if (el.no === 207) quantity = Math.round(spanLength * 2)
      if (el.no >= 600 && el.no <= 603) quantity = Math.round(lengthM)

      const desc = descriptionForElement(el.no, preferredMaterial)
      const majorGroup = majorGroupFor(el.no)
      const subgroup = subgroupFor(el.no)
      const code = formatElementCode(el.no)
      const sizeM = applySize(el.no, geometry, spanLength)

      // Open beams / box lines: one inventory row per beam line on the span
      if ((el.no === 201 || (el.no === 202 && beamIsBox)) && group === 'span' && girderCountPerSpan > 0) {
        const count =
          el.no === 202 && beamIsBox ? Math.max(1, Math.min(girderCountPerSpan, 3)) : girderCountPerSpan
        for (let g = 1; g <= count; g++) {
          const id = formatElementId(bridgeId, groupId, el.no, g)
          const conditionScore = hashScore(id, conditionBase - 4)
          const riskScore = hashScore(`${id}-r`, riskBase + 8)
          elements.push({
            id,
            bridgeId,
            code,
            scheduleNo: el.no,
            name: `${el.name} ${g}`,
            category: el.category,
            majorGroup,
            subgroup,
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
            sizeM,
          })
        }
        continue
      }

      // Open-spandrel columns: one inventory row per post on the span
      if (el.no === 206 && group === 'span') {
        for (let c = 1; c <= spandrelColumnCount; c++) {
          const id = formatElementId(bridgeId, groupId, el.no, c)
          const conditionScore = hashScore(id, conditionBase - 3)
          const riskScore = hashScore(`${id}-r`, riskBase + 5)
          elements.push({
            id,
            bridgeId,
            code,
            scheduleNo: el.no,
            name: `${el.name} ${c}`,
            category: el.category,
            majorGroup,
            subgroup,
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
            sizeM,
          })
        }
        continue
      }

      // Discrete columns / trestle legs / pile bents
      if (
        (el.no === 404 ||
          el.no === 405 ||
          (el.no === 407 && geometry.pierType === 'pile-bent')) &&
        (group === 'pier' || group === 'abutment')
      ) {
        const count = group === 'pier' ? columnsPerPier : columnsPerAbutment
        for (let c = 1; c <= count; c++) {
          const id = formatElementId(bridgeId, groupId, el.no, c)
          const conditionScore = hashScore(id, conditionBase - 2)
          const riskScore = hashScore(`${id}-r`, riskBase + 6)
          elements.push({
            id,
            bridgeId,
            code,
            scheduleNo: el.no,
            name: `${el.name} ${c}`,
            category: el.category,
            majorGroup,
            subgroup,
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
            sizeM,
          })
        }
        continue
      }

      const id = formatElementId(bridgeId, groupId, el.no)
      const conditionScore = hashScore(id, conditionBase)
      const riskScore = hashScore(`${id}-r`, riskBase)
      elements.push({
        id,
        bridgeId,
        code,
        scheduleNo: el.no,
        name: el.name,
        category: el.category,
        majorGroup,
        subgroup,
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
        sizeM,
      })
    }
  }

  pushGroup('approach', 1)
  pushGroup('approach', 2)

  if (wall) {
    // Retaining / noise walls live on approach groups only
    return elements
  }

  if (!culvert) {
    pushGroup('abutment', 1)
  }

  for (let s = 1; s <= spans; s++) {
    pushGroup('span', s)
    if (!culvert && !tunnel && s < spans) pushGroup('pier', s)
  }

  if (!culvert) {
    pushGroup('abutment', 2)
  }

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

export function elementsByMajorGroup(elements: BridgeElement[]) {
  const map = new Map<string, BridgeElement[]>()
  for (const el of elements) {
    const list = map.get(el.majorGroup) ?? []
    list.push(el)
    map.set(el.majorGroup, list)
  }
  return map
}
