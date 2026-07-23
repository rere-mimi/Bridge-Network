import type { BridgeAsset, BridgeElement, DrawnDefect, DefectFace } from '../types'
import { elementInspectableAreaM2 } from './elementInspectableArea'

export type FaceMetres = {
  horizontalM: number
  verticalM: number
  areaM2: number
}

/** Nominal crack width used when converting crack length → equivalent area (m). */
export const CRACK_EQUIV_WIDTH_M = 0.025

export type NormPoint = { x: number; y: number }

export function faceMetres(
  sizeM: { length: number; width: number; height: number },
  face: DefectFace,
): FaceMetres {
  let horizontalM: number
  let verticalM: number
  switch (face) {
    case 'top':
      horizontalM = sizeM.length
      verticalM = sizeM.width
      break
    case 'front':
      horizontalM = sizeM.length
      verticalM = sizeM.height
      break
    case 'side':
      horizontalM = sizeM.width
      verticalM = sizeM.height
      break
    case 'end':
      horizontalM = sizeM.width
      verticalM = sizeM.height
      break
  }
  horizontalM = Math.max(horizontalM, 0.05)
  verticalM = Math.max(verticalM, 0.05)
  return {
    horizontalM,
    verticalM,
    areaM2: horizontalM * verticalM,
  }
}

/**
 * Element reference area for % defected.
 * Prefer inspectable-area formulas (I-girder / box / pier / deck) when bridge is known.
 */
export function elementReferenceAreaM2(
  element: BridgeElement,
  sizeM?: { length: number; width: number; height: number } | null,
  bridge?: BridgeAsset | null,
): number {
  if (bridge) {
    const fromFormula = elementInspectableAreaM2(element, bridge)
    if (fromFormula > 0) return fromFormula
  }
  if (element.unit === 'm²' && element.totalQuantity > 0) {
    return element.totalQuantity
  }
  if (sizeM) {
    // Dominant exposed faces: deck-like uses length×width; walls use length×height
    const plan = sizeM.length * sizeM.width
    const elev = sizeM.length * sizeM.height
    const side = sizeM.width * sizeM.height
    return Math.max(plan, elev, side, 0.1)
  }
  if (element.unit === 'm' && element.totalQuantity > 0) {
    // Assume ~1 m inspection band along linear elements
    return element.totalQuantity * 1
  }
  return 1
}

export function polylineLengthM(
  points: NormPoint[],
  horizontalM: number,
  verticalM: number,
): number {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    const dx = (points[i].x - points[i - 1].x) * horizontalM
    const dy = (points[i].y - points[i - 1].y) * verticalM
    total += Math.hypot(dx, dy)
  }
  return total
}

/** Shoelace polygon area in m² from normalised face coordinates. */
export function polygonAreaM2(
  points: NormPoint[],
  horizontalM: number,
  verticalM: number,
): number {
  if (points.length < 3) return 0
  let sum = 0
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    const xi = points[i].x * horizontalM
    const yi = points[i].y * verticalM
    const xj = points[j].x * horizontalM
    const yj = points[j].y * verticalM
    sum += xi * yj - xj * yi
  }
  return Math.abs(sum) / 2
}

export function roundMetric(value: number, digits = 3): number {
  const f = 10 ** digits
  return Math.round(value * f) / f
}

export function measureDrawnDefect(
  kind: DrawnDefect['kind'],
  points: NormPoint[],
  face: DefectFace,
  sizeM: { length: number; width: number; height: number },
): {
  lengthM?: number
  areaM2?: number
  lengthDensityMPerM2?: number
  faceAreaM2: number
  equivAreaM2: number
} {
  const faceM = faceMetres(sizeM, face)
  if (kind === 'crack') {
    const lengthM = roundMetric(polylineLengthM(points, faceM.horizontalM, faceM.verticalM), 3)
    const lengthDensityMPerM2 = roundMetric(lengthM / faceM.areaM2, 4)
    const equivAreaM2 = roundMetric(lengthM * CRACK_EQUIV_WIDTH_M, 4)
    return {
      lengthM,
      lengthDensityMPerM2,
      faceAreaM2: roundMetric(faceM.areaM2, 3),
      equivAreaM2,
    }
  }
  const areaM2 = roundMetric(polygonAreaM2(points, faceM.horizontalM, faceM.verticalM), 3)
  return {
    areaM2,
    faceAreaM2: roundMetric(faceM.areaM2, 3),
    equivAreaM2: areaM2,
  }
}

export type ElementDefectSummary = {
  elementId: string
  defectCount: number
  crackLengthM: number
  crackDensityMPerM2: number
  areaDefectM2: number
  equivAreaM2: number
  referenceAreaM2: number
  /** % of element reference area occupied by defects (polygons + crack equivalent). */
  percentAreaInDefect: number
}

export function summarizeElementDefects(
  element: BridgeElement,
  defects: DrawnDefect[],
  sizeM?: { length: number; width: number; height: number } | null,
  bridge?: BridgeAsset | null,
): ElementDefectSummary {
  const pinned = defects.filter((d) => d.elementId === element.id)
  const referenceAreaM2 = roundMetric(elementReferenceAreaM2(element, sizeM, bridge), 3)

  let crackLengthM = 0
  let areaDefectM2 = 0
  let equivAreaM2 = 0
  let densWeighted = 0
  let densWeight = 0

  for (const d of pinned) {
    if (d.kind === 'crack') {
      const len = d.lengthM ?? 0
      crackLengthM += len
      equivAreaM2 += d.equivAreaM2 ?? len * CRACK_EQUIV_WIDTH_M
      if (d.lengthDensityMPerM2 != null && d.faceAreaM2) {
        densWeighted += d.lengthDensityMPerM2 * d.faceAreaM2
        densWeight += d.faceAreaM2
      }
    } else {
      const area = d.areaM2 ?? 0
      areaDefectM2 += area
      equivAreaM2 += d.equivAreaM2 ?? area
    }
  }

  const percentAreaInDefect = roundMetric(
    Math.min(100, (equivAreaM2 / Math.max(referenceAreaM2, 0.001)) * 100),
    2,
  )

  return {
    elementId: element.id,
    defectCount: pinned.length,
    crackLengthM: roundMetric(crackLengthM, 3),
    crackDensityMPerM2: roundMetric(densWeight > 0 ? densWeighted / densWeight : crackLengthM / referenceAreaM2, 4),
    areaDefectM2: roundMetric(areaDefectM2, 3),
    equivAreaM2: roundMetric(equivAreaM2, 3),
    referenceAreaM2,
    percentAreaInDefect,
  }
}
