/**
 * Build a pinned DrawnDefect without freehand geometry.
 * Extent uses inspectable element area (see elementInspectableArea.ts).
 */

import type { BridgeAsset, BridgeElement, ConditionState, DrawnDefect, DrawnDefectKind } from '../types'
import {
  DEFECT_TYPE_BY_CODE,
  labelForDrawnDefect,
  normalizeMaterial,
  type DefectType,
} from './defectTypes'
import { CRACK_EQUIV_WIDTH_M, roundMetric } from './defectMetrics'
import {
  areaDefectExtentPercent,
  linearDefectDensityMPerM2,
  resolveInspectableAreaM2,
} from './elementInspectableArea'

export function kindFromDefectType(type: DefectType): DrawnDefectKind {
  if (type.geometry === 'line') return 'crack'
  if (type.geometry === 'point') return 'patch'
  // area defects: spall-like vs patched
  const name = type.name.toLowerCase()
  if (name.includes('patch') || name.includes('repair')) return 'patch'
  return 'spall'
}

/**
 * Typical measured quantity used when the inspector picks CS but no measured
 * length/area yet — scaled from inspectable area so extent matches CS bands.
 */
export function defaultMeasureForConditionState(
  geometry: DefectType['geometry'],
  cs: ConditionState,
  areaM2: number,
): { lengthM?: number; areaM2?: number } {
  // Heuristic % of element area → CS bands used in conditionState.ts
  const pct =
    cs === 1 ? 0.5 : cs === 2 ? 5 : cs === 3 ? 15 : 30
  if (geometry === 'line') {
    // density targets ~0.1 / 0.5 / 1.5 / 3.0 m/m²
    const density = cs === 1 ? 0.1 : cs === 2 ? 0.5 : cs === 3 ? 1.5 : 3
    return { lengthM: roundMetric(density * areaM2, 3) }
  }
  if (geometry === 'point') {
    return { areaM2: roundMetric(Math.max(0.01, areaM2 * (pct / 100) * 0.05), 3) }
  }
  return { areaM2: roundMetric(areaM2 * (pct / 100), 3) }
}

export type QuickAddDefectInput = {
  element: BridgeElement
  bridge: BridgeAsset
  defectCode: string
  conditionState: ConditionState
  /** Measured crack / linear length (m). If omitted, derived from CS. */
  lengthM?: number
  /** Measured area defect (m²). If omitted, derived from CS. */
  areaM2?: number
  face?: DrawnDefect['face']
}

export function buildQuickAddDefect(input: QuickAddDefectInput): DrawnDefect {
  const type = DEFECT_TYPE_BY_CODE[input.defectCode]
  const material = normalizeMaterial(input.element.material)
  const kind = type ? kindFromDefectType(type) : 'spall'
  const inspectable = resolveInspectableAreaM2(input.element, input.bridge)
  const areaRef = Math.max(inspectable.areaM2, 0.001)

  const defaults = type
    ? defaultMeasureForConditionState(type.geometry, input.conditionState, areaRef)
    : defaultMeasureForConditionState('area', input.conditionState, areaRef)

  const lengthM =
    type?.geometry === 'line'
      ? roundMetric(input.lengthM ?? defaults.lengthM ?? 0, 3)
      : undefined
  const areaM2 =
    type?.geometry !== 'line'
      ? roundMetric(input.areaM2 ?? defaults.areaM2 ?? 0, 3)
      : undefined

  const lengthDensityMPerM2 =
    lengthM != null
      ? roundMetric(linearDefectDensityMPerM2(lengthM, areaRef), 4)
      : undefined

  const equivAreaM2 =
    lengthM != null
      ? roundMetric(lengthM * CRACK_EQUIV_WIDTH_M, 4)
      : roundMetric(areaM2 ?? 0, 3)

  return {
    id: `quick-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind,
    defectCode: input.defectCode,
    points: [],
    label: labelForDrawnDefect(kind, input.defectCode, material),
    createdAt: new Date().toISOString(),
    elementId: input.element.id,
    face: input.face ?? 'front',
    material,
    conditionState: input.conditionState,
    lengthM,
    areaM2,
    lengthDensityMPerM2,
    faceAreaM2: roundMetric(areaRef, 3),
    equivAreaM2,
  }
}

export function describeQuickAddExtent(defect: DrawnDefect, areaM2: number): string {
  if (defect.lengthM != null) {
    const dens =
      defect.lengthDensityMPerM2 ??
      linearDefectDensityMPerM2(defect.lengthM, areaM2)
    return `${defect.lengthM.toFixed(3)} m · ${dens.toFixed(4)} m/m²`
  }
  if (defect.areaM2 != null) {
    const pct = areaDefectExtentPercent(defect.areaM2, areaM2)
    return `${defect.areaM2.toFixed(3)} m² · ${pct.toFixed(2)}% of element`
  }
  return '—'
}
