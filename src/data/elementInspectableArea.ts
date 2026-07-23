/**
 * Inspectable element area (m²) for defect extent calculations.
 *
 * Formulas (verify here):
 *   I-girder / open beam:
 *     area = (2 × depth + 3 × flangeWidth) × span × girderCount
 *
 *   Box girder:
 *     area = (2 × depth + width) × span × girderCount
 *     (parsed as the I-girder-style developed surface; not (2×depth)+(width×span×n))
 *
 *   Pier (circular):
 *     area = height × circumference = height × π × diameter
 *
 *   Pier (rectangular):
 *     area = height × perimeter = height × 2 × (length + width)
 *
 *   Deck:
 *     area = width × span × spanCount
 *
 * Linear defect density (m/m²):
 *     density = lengthM / areaM2
 */

import type { BridgeAsset, BridgeElement, ElementSizeM } from '../types'
import { sizeForSchedule } from './structureGeometry'

function roundMetric(value: number, digits = 3): number {
  const f = 10 ** digits
  return Math.round(value * f) / f
}

export type InspectableAreaKind =
  | 'i-girder'
  | 'box-girder'
  | 'pier-circular'
  | 'pier-rectangular'
  | 'deck'
  | 'fallback'

export type InspectableAreaResult = {
  areaM2: number
  kind: InspectableAreaKind
  /** Human-readable formula with substituted numbers */
  formula: string
  inputs: Record<string, number>
}

/** I-girder / open beam developed surface (m²). */
export function iGirderInspectableAreaM2(
  depthM: number,
  flangeWidthM: number,
  spanM: number,
  girderCount: number,
): number {
  const depth = Math.max(0, depthM)
  const flange = Math.max(0, flangeWidthM)
  const span = Math.max(0, spanM)
  const n = Math.max(0, girderCount)
  return (2 * depth + 3 * flange) * span * n
}

/**
 * Box girder developed surface (m²).
 * area = (2 × depth + width) × span × girderCount
 */
export function boxGirderInspectableAreaM2(
  depthM: number,
  widthM: number,
  spanM: number,
  girderCount: number,
): number {
  const depth = Math.max(0, depthM)
  const width = Math.max(0, widthM)
  const span = Math.max(0, spanM)
  const n = Math.max(0, girderCount)
  return (2 * depth + width) * span * n
}

/** Circular pier / column: height × circumference (m²). */
export function pierCircularInspectableAreaM2(heightM: number, diameterM: number): number {
  const height = Math.max(0, heightM)
  const diameter = Math.max(0, diameterM)
  return height * Math.PI * diameter
}

/** Rectangular pier / wall: height × perimeter (m²). */
export function pierRectangularInspectableAreaM2(
  heightM: number,
  lengthM: number,
  widthM: number,
): number {
  const height = Math.max(0, heightM)
  const length = Math.max(0, lengthM)
  const width = Math.max(0, widthM)
  const perimeter = 2 * (length + width)
  return height * perimeter
}

/** Deck / carriageway: width × span × number of spans (m²). */
export function deckInspectableAreaM2(
  widthM: number,
  spanM: number,
  spanCount: number,
): number {
  const width = Math.max(0, widthM)
  const span = Math.max(0, spanM)
  const n = Math.max(0, spanCount)
  return width * span * n
}

/**
 * Linear defect intensity: metres of defect per m² of inspectable area.
 * density = lengthM / areaM2
 */
export function linearDefectDensityMPerM2(lengthM: number, areaM2: number): number {
  const area = Math.max(areaM2, 1e-6)
  return Math.max(0, lengthM) / area
}

/** Area defect extent as a fraction of inspectable area (0–1). */
export function areaDefectExtentFraction(defectAreaM2: number, elementAreaM2: number): number {
  const area = Math.max(elementAreaM2, 1e-6)
  return Math.min(1, Math.max(0, defectAreaM2) / area)
}

/** Area defect extent as percent of inspectable area (0–100). */
export function areaDefectExtentPercent(defectAreaM2: number, elementAreaM2: number): number {
  return areaDefectExtentFraction(defectAreaM2, elementAreaM2) * 100
}

function mergeSize(
  element: BridgeElement,
  bridge: BridgeAsset,
): ElementSizeM {
  const fromGeom = sizeForSchedule(bridge.geometry, element.scheduleNo)
  return { ...fromGeom, ...element.sizeM }
}

function spanLengthM(bridge: BridgeAsset): number {
  return bridge.lengthM / Math.max(bridge.spans, 1)
}

/**
 * Resolve inspectable area for a selected element instance.
 *
 * Per-line girders / columns use count = 1 (this instance).
 * Deck on one span group uses spanCount = 1 for that span;
 * pass `aggregate: true` to use full girderCount / all spans.
 */
export function resolveInspectableAreaM2(
  element: BridgeElement,
  bridge: BridgeAsset,
  options?: { aggregate?: boolean },
): InspectableAreaResult {
  const aggregate = options?.aggregate === true
  const size = mergeSize(element, bridge)
  const spanM = size.length ?? spanLengthM(bridge)
  const schedule = element.scheduleNo
  const girderCountGeom = Math.max(1, bridge.geometry?.girderCountPerSpan ?? 1)

  // Deck / carriageway (200) and slab-like primary decks
  if (schedule === 200 || (schedule === 100 && element.subgroup?.toLowerCase().includes('deck'))) {
    const width = size.width ?? bridge.deckWidthM ?? 12
    const spanCount = aggregate ? Math.max(1, bridge.spans) : 1
    const areaM2 = deckInspectableAreaM2(width, spanM, spanCount)
    return {
      areaM2: roundMetric(areaM2, 3),
      kind: 'deck',
      formula: `(${width} × ${roundMetric(spanM, 3)} × ${spanCount})`,
      inputs: { widthM: width, spanM, spanCount },
    }
  }

  // Open I-girder / T-beam (201)
  if (schedule === 201) {
    const depth = size.height ?? 1.2
    const flangeWidth = size.width ?? 0.45
    const girderCount = aggregate ? girderCountGeom : 1
    const areaM2 = iGirderInspectableAreaM2(depth, flangeWidth, spanM, girderCount)
    return {
      areaM2: roundMetric(areaM2, 3),
      kind: 'i-girder',
      formula: `(2 × ${depth} + 3 × ${flangeWidth}) × ${roundMetric(spanM, 3)} × ${girderCount}`,
      inputs: { depthM: depth, flangeWidthM: flangeWidth, spanM, girderCount },
    }
  }

  // Box girder (202)
  if (schedule === 202) {
    const depth = size.height ?? 1.6
    const width = size.width ?? (bridge.deckWidthM ?? 12) * 0.55
    const girderCount = aggregate ? girderCountGeom : 1
    const areaM2 = boxGirderInspectableAreaM2(depth, width, spanM, girderCount)
    return {
      areaM2: roundMetric(areaM2, 3),
      kind: 'box-girder',
      formula: `(2 × ${depth} + ${width}) × ${roundMetric(spanM, 3)} × ${girderCount}`,
      inputs: { depthM: depth, widthM: width, spanM, girderCount },
    }
  }

  // Circular pier / column / pile (404, 407, and diameter-sized 405)
  if (schedule === 404 || schedule === 407 || (schedule === 405 && size.diameter != null && size.diameter > 0)) {
    const height = size.height ?? 4.5
    const diameter = size.diameter ?? size.width ?? 0.9
    const areaM2 = pierCircularInspectableAreaM2(height, diameter)
    return {
      areaM2: roundMetric(areaM2, 3),
      kind: 'pier-circular',
      formula: `${height} × π × ${diameter}`,
      inputs: { heightM: height, diameterM: diameter, circumferenceM: Math.PI * diameter },
    }
  }

  // Rectangular pier wall / trestle (403, 405 without diameter)
  if (schedule === 403 || schedule === 405 || schedule === 400) {
    const height = size.height ?? 4
    const length = size.length ?? 0.8
    const width = size.width ?? (bridge.deckWidthM ?? 12) * 0.7
    const areaM2 = pierRectangularInspectableAreaM2(height, length, width)
    return {
      areaM2: roundMetric(areaM2, 3),
      kind: 'pier-rectangular',
      formula: `${height} × 2 × (${length} + ${width})`,
      inputs: {
        heightM: height,
        lengthM: length,
        widthM: width,
        perimeterM: 2 * (length + width),
      },
    }
  }

  // Generic fallback from element dimensions / schedule quantity
  const length = size.length ?? spanM
  const width = size.width ?? bridge.deckWidthM ?? 1
  const height = size.height ?? size.diameter ?? 1
  const plan = length * width
  const elev = length * height
  const side = width * height
  const fromQty =
    element.unit === 'm²' && element.totalQuantity > 0 ? element.totalQuantity : 0
  const areaM2 = Math.max(plan, elev, side, fromQty, 0.1)
  return {
    areaM2: roundMetric(areaM2, 3),
    kind: 'fallback',
    formula: `max(L×W, L×H, W×H${fromQty ? ', qty' : ''})`,
    inputs: { lengthM: length, widthM: width, heightM: height, fromQty },
  }
}

/** Convenience: area only. */
export function elementInspectableAreaM2(
  element: BridgeElement,
  bridge: BridgeAsset,
  options?: { aggregate?: boolean },
): number {
  return resolveInspectableAreaM2(element, bridge, options).areaM2
}
