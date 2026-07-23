/**
 * Structure geometry — beam/pier configuration and element dimensions
 * used when creating or updating a model (and by the 3D twin).
 */

import type { ArchSpandrelType } from './archBridgeComponents'

export type BeamSectionType = 'open-ibeam' | 't-beam' | 'box' | 'slab'
export type PierType = 'wall' | 'multi-column' | 'trestle' | 'pile-bent'
export type { ArchSpandrelType }

/** Real-world sizes for an Appendix C element type (metres). */
export type ElementSizeM = {
  /** Along primary span / member axis */
  length?: number
  width?: number
  height?: number
  /** Circular columns / pipes */
  diameter?: number
  /** Culvert clear opening height */
  openingHeight?: number
}

export type StructureGeometry = {
  beamType: BeamSectionType
  girderCountPerSpan: number
  pierType: PierType
  /** Columns (or piles) per pier support */
  columnsPerPier: number
  /** Columns / piles at each abutment (when applicable) */
  columnsPerAbutment: number
  /** Closed (walls/fill) vs open (columns) deck arch — arch family only */
  archSpandrelType?: ArchSpandrelType
  /** Open-spandrel posts per span (element 206) */
  spandrelColumnCount?: number
  /** Default sizes keyed by Appendix C schedule number */
  elementSizes: Record<number, ElementSizeM>
}

export const BEAM_TYPE_OPTIONS: Array<{
  id: BeamSectionType
  label: string
  hint: string
  scheduleHint: number
}> = [
  {
    id: 'open-ibeam',
    label: 'Open beam / I-girder',
    hint: 'Discrete beams under the deck (element 201)',
    scheduleHint: 201,
  },
  {
    id: 't-beam',
    label: 'T-beam',
    hint: 'Open beams with wide top flange',
    scheduleHint: 201,
  },
  {
    id: 'box',
    label: 'Box / closed web',
    hint: 'Closed cells or box girders (element 202)',
    scheduleHint: 202,
  },
  {
    id: 'slab',
    label: 'Slab deck',
    hint: 'Deck carries load; no separate beam lines',
    scheduleHint: 200,
  },
]

export const PIER_TYPE_OPTIONS: Array<{
  id: PierType
  label: string
  hint: string
}> = [
  {
    id: 'multi-column',
    label: 'Multi-column pier',
    hint: 'Pier cap on discrete columns',
  },
  {
    id: 'wall',
    label: 'Pier wall',
    hint: 'Solid wall pier (no separate columns)',
  },
  {
    id: 'trestle',
    label: 'Trestle / tower',
    hint: 'Built-up trestle columns',
  },
  {
    id: 'pile-bent',
    label: 'Pile bent',
    hint: 'Piles extending to the pier cap',
  },
]

export function defaultElementSizes(input: {
  lengthM: number
  spans: number
  deckWidthM: number
  kind: 'bridge' | 'culvert'
}): Record<number, ElementSizeM> {
  const spanLen = input.lengthM / Math.max(input.spans, 1)
  const w = input.deckWidthM

  if (input.kind === 'culvert') {
    return {
      600: { length: w + 2, width: Math.min(3, w * 0.7), height: 1.2, openingHeight: 1.05 },
      601: { length: w + 2, diameter: 1.2, openingHeight: 1.05 },
      602: { length: w + 2, diameter: 1.4, openingHeight: 1.1 },
      603: { length: w + 2, width: Math.min(3.2, w * 0.8), height: 1.4, openingHeight: 1.2 },
      604: { length: w + 2, width: Math.min(3, w * 0.7), height: 0.2 },
      605: { length: 1.8, width: 0.35, height: 1.4 },
      606: { length: 0.4, width: Math.min(3, w * 0.7) + 0.6, height: 1.4 },
      607: { length: w + 1, width: Math.min(3, w * 0.7) + 0.8, height: 0.4 },
      609: { length: 0.5, width: Math.min(3, w * 0.7) + 0.4, height: 1.5 },
      610: { diameter: 0.45, height: 3 },
    }
  }

  const archRise = Math.max(2.2, Math.min(8, spanLen * 0.28))
  return {
    100: { length: 0.05, width: w, height: 0.2 },
    200: { length: spanLen, width: w, height: 0.25 },
    201: { length: spanLen, width: 0.45, height: 1.2 },
    202: { length: spanLen, width: w * 0.55, height: 1.6 },
    203: { length: spanLen, width: w * 0.4, height: 2.2 },
    204: { length: spanLen * 0.95, width: 0.55, height: archRise, openingHeight: archRise * 0.85 },
    205: { length: spanLen * 0.95, width: w * 0.75, height: archRise, openingHeight: archRise * 0.85 },
    206: { length: 0.45, width: 0.45, height: archRise * 0.55 },
    207: { length: spanLen * 0.9, width: 0.35, height: archRise * 0.7 },
    213: { length: 0.35, width: w * 0.85, height: 0.9 },
    214: { length: 0.45, width: w * 0.9, height: 1.1 },
    300: { length: 0.5, width: 0.4, height: 0.2 },
    301: { length: 0.5, width: 0.4, height: 0.2 },
    302: { length: 0.5, width: 0.4, height: 0.2 },
    306: { length: 0.6, width: 0.5, height: 0.25 },
    400: { length: 1.2, width: w, height: 4.5 },
    401: { length: 3.5, width: 0.4, height: 3.2 },
    402: { length: 1.0, width: w * 0.85, height: 0.9 },
    403: { length: 0.8, width: w * 0.7, height: 4.0 },
    404: { diameter: 0.9, height: 4.5 },
    405: { length: 1.2, width: 1.2, height: 5.0 },
    406: { length: 2.5, width: w * 0.9, height: 1.0 },
    407: { diameter: 0.6, height: 8 },
  }
}

export function defaultGeometry(input: {
  lengthM: number
  spans: number
  deckWidthM: number
  kind: 'bridge' | 'culvert'
  family?: string
  girderCountPerSpan?: number
}): StructureGeometry {
  const beamType: BeamSectionType =
    input.family === 'box'
      ? 'box'
      : input.family === 'slab'
        ? 'slab'
        : input.family === 'arch'
          ? 'slab'
          : 'open-ibeam'

  return {
    beamType,
    girderCountPerSpan: Math.max(1, input.girderCountPerSpan ?? (beamType === 'slab' ? 0 : 4)),
    pierType: 'multi-column',
    columnsPerPier: 2,
    columnsPerAbutment: 4,
    archSpandrelType: input.family === 'arch' ? 'closed' : undefined,
    spandrelColumnCount: input.family === 'arch' ? 6 : undefined,
    elementSizes: defaultElementSizes(input),
  }
}

export function mergeElementSize(
  base: ElementSizeM | undefined,
  patch: ElementSizeM,
): ElementSizeM {
  return { ...base, ...patch }
}

export function sizeForSchedule(
  geometry: StructureGeometry | undefined,
  scheduleNo: number,
): ElementSizeM {
  return geometry?.elementSizes?.[scheduleNo] ?? {}
}

/** Scene metres from real metres using overall structure length as scale reference. */
export function sceneScaleFromLength(lengthM: number): number {
  const SCENE_LENGTH = 10
  return SCENE_LENGTH / Math.max(lengthM, 1)
}

export function beamTypeLabel(type: BeamSectionType): string {
  return BEAM_TYPE_OPTIONS.find((o) => o.id === type)?.label ?? type
}

export function pierTypeLabel(type: PierType): string {
  return PIER_TYPE_OPTIONS.find((o) => o.id === type)?.label ?? type
}

/** Structural schedule numbers typically editable for dimensions. */
export function editableDimensionSchedules(
  kind: 'bridge' | 'culvert',
  selectedNos: number[],
): number[] {
  const bridgeNos = [
    200, 201, 202, 203, 204, 205, 206, 207, 213, 214, 302, 400, 401, 402, 403, 404, 405, 406,
    407,
  ]
  const culvertNos = [600, 601, 602, 603, 604, 605, 606, 607, 609, 610]
  const allowed = new Set(kind === 'culvert' ? culvertNos : bridgeNos)
  return selectedNos.filter((n) => allowed.has(n)).sort((a, b) => a - b)
}
