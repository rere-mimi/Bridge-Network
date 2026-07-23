import type { BridgeAsset, ConditionBand, StructureGeometry, StructureKind } from '../types'
import { buildAppendixCElements } from './buildElements'
import {
  elementsForFamily,
  familyLabel,
  isCulvertFamily,
  type StructureFamily,
} from './elementSchedule'
import { defaultGeometry } from './structureGeometry'

function bandFromScore(score: number): ConditionBand {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 65) return 'fair'
  if (score >= 50) return 'poor'
  return 'critical'
}

function avgCondition(elements: BridgeAsset['elements']): number {
  if (!elements.length) return 70
  return Math.round(elements.reduce((s, e) => s + e.conditionScore, 0) / elements.length)
}

function forecast(base = 0.4) {
  return [2026, 2030, 2035, 2040, 2045, 2050].map((year, i) => ({
    year,
    routine: Number((base + i * 0.05).toFixed(2)),
    rehab: Number((base * 0.8 + i * 0.18).toFixed(2)),
    replace: Number((i > 3 ? base * 2 + i * 0.4 : 0.1 + i * 0.05).toFixed(2)),
  }))
}

function heatFromElements(spans: number, elements: BridgeAsset['elements']) {
  const rows = [
    { keys: [200, 600, 601, 602, 603], label: 'Primary member' },
    { keys: [201, 202, 205], label: 'Beams / arch' },
    { keys: [404, 405, 407, 610], label: 'Columns / piles' },
    { keys: [302, 300, 301], label: 'Bearings' },
    { keys: [402, 400, 403, 606], label: 'Supports / headwall' },
  ]
  return rows.map((row) => ({
    element: row.label,
    spans: Array.from({ length: spans }, (_, i) => {
      const groupId = `S${i + 1}`
      const pierId = `P${i + 1}`
      const match =
        elements.find((e) => e.groupId === groupId && row.keys.includes(e.scheduleNo)) ??
        elements.find((e) => e.groupId === pierId && row.keys.includes(e.scheduleNo)) ??
        elements.find((e) => row.keys.includes(e.scheduleNo))
      return match?.band ?? ('fair' as ConditionBand)
    }),
  }))
}

export type StructureDraft = {
  id: string
  name: string
  road: string
  region: string
  city: string
  lat: number
  lng: number
  yearBuilt: number
  lengthM: number
  spans: number
  deckWidthM: number
  material: string
  owner: string
  family: StructureFamily
  girderCountPerSpan: number
  geometry: StructureGeometry
  includeElementNos?: number[]
  notes?: string
}

export function kindFromFamily(family: StructureFamily): StructureKind {
  return isCulvertFamily(family) ? 'culvert' : 'bridge'
}

export function buildStructureFromDraft(
  draft: StructureDraft,
  previous?: BridgeAsset,
): BridgeAsset {
  const kind = kindFromFamily(draft.family)
  const geometry: StructureGeometry = {
    ...draft.geometry,
    girderCountPerSpan: draft.girderCountPerSpan,
  }
  const elements = buildAppendixCElements({
    bridgeId: draft.id,
    spans: Math.max(1, draft.spans),
    lengthM: draft.lengthM,
    family: draft.family,
    deckWidthM: draft.deckWidthM,
    material: draft.material,
    girderCountPerSpan: draft.girderCountPerSpan,
    includeElementNos: draft.includeElementNos,
    geometry,
    conditionBase: previous ? Math.round(previous.conditionIndex * 0.9 + 8) : 82,
    riskBase: previous ? Math.round(previous.riskScore * 0.7) : 35,
  })
  const conditionIndex = avgCondition(elements)
  const today = new Date().toISOString().slice(0, 10)
  const next = new Date()
  next.setFullYear(next.getFullYear() + 1)
  const updateNote =
    draft.notes?.trim() ||
    (previous
      ? `Updated model · ${familyLabel(draft.family)}`
      : `Created from Appendix C ${familyLabel(draft.family)} template`)

  const inspection = {
    id: `i-${draft.id}-${Date.now()}`,
    date: today,
    inspector: 'Model builder',
    summary: updateNote,
    score: conditionIndex,
  }

  return {
    id: draft.id,
    name: draft.name,
    road: draft.road,
    region: draft.region,
    city: draft.city,
    lat: draft.lat,
    lng: draft.lng,
    yearBuilt: draft.yearBuilt,
    lengthM: draft.lengthM,
    spans: Math.max(1, draft.spans),
    deckWidthM: draft.deckWidthM,
    geometry,
    material: draft.material,
    structureType: familyLabel(draft.family),
    kind,
    family: draft.family,
    source: 'user',
    createdAt: previous?.createdAt ?? new Date().toISOString(),
    owner: draft.owner,
    status: previous?.status ?? 'operational',
    lastInspection: today,
    nextInspectionDue: previous?.nextInspectionDue ?? next.toISOString().slice(0, 10),
    conditionIndex,
    conditionBand: bandFromScore(conditionIndex),
    riskLevel: previous?.riskLevel ?? 'low',
    riskScore: previous?.riskScore ?? 28,
    remainingLifeYears: Math.max(20, 100 - (new Date().getFullYear() - draft.yearBuilt)),
    photoLabel:
      previous?.photoLabel ?? (kind === 'culvert' ? 'Culvert model' : 'Bridge model'),
    elements,
    defects: previous?.defects ?? [],
    inspections: [inspection, ...(previous?.inspections ?? [])].slice(0, 12),
    documents: previous?.documents ?? { drawings: 0, reports: 0, photos: 0 },
    riskBreakdown: previous?.riskBreakdown ?? {
      structural: 20,
      hydraulic: kind === 'culvert' ? 35 : 18,
      seismic: 18,
      traffic: 16,
      other: 11,
    },
    // Drop stale NSHM result when coordinates change; enrichment re-queries HazardMaps API.
    seismicHazard:
      previous?.seismicHazard &&
      Math.abs(previous.seismicHazard.lat - draft.lat) < 0.0005 &&
      Math.abs(previous.seismicHazard.lng - draft.lng) < 0.0005
        ? previous.seismicHazard
        : undefined,
    maintenanceForecast: previous?.maintenanceForecast ?? forecast(0.35),
    heatmap: heatFromElements(Math.max(1, draft.spans), elements),
  }
}

export function draftFromStructure(structure: BridgeAsset): StructureDraft {
  const family =
    structure.family ??
    (structure.kind === 'culvert' ? 'box-culvert' : 'girder')
  const kind = kindFromFamily(family)
  const scheduleNos = [...new Set(structure.elements.map((e) => e.scheduleNo))].sort(
    (a, b) => a - b,
  )
  const girderCount = Math.max(
    1,
    structure.geometry?.girderCountPerSpan ??
      (structure.elements.filter((e) => e.scheduleNo === 201 || e.scheduleNo === 202).length /
        Math.max(structure.spans, 1) ||
        4),
  )
  const columnsPerPier = Math.max(
    1,
    structure.geometry?.columnsPerPier ??
      (structure.elements.filter(
        (e) => e.group === 'pier' && [404, 405, 407].includes(e.scheduleNo),
      ).length ||
        2),
  )

  const baseGeometry = defaultGeometry({
    lengthM: structure.lengthM,
    spans: structure.spans,
    deckWidthM: structure.deckWidthM ?? 12,
    kind,
    family,
    girderCountPerSpan: girderCount,
  })

  const elementSizes = { ...baseGeometry.elementSizes }
  for (const el of structure.elements) {
    if (el.sizeM) {
      elementSizes[el.scheduleNo] = {
        ...elementSizes[el.scheduleNo],
        ...el.sizeM,
      }
    }
  }

  const geometry: StructureGeometry = {
    ...baseGeometry,
    ...structure.geometry,
    girderCountPerSpan: girderCount,
    columnsPerPier,
    columnsPerAbutment: structure.geometry?.columnsPerAbutment ?? baseGeometry.columnsPerAbutment,
    elementSizes: {
      ...baseGeometry.elementSizes,
      ...structure.geometry?.elementSizes,
      ...elementSizes,
    },
  }

  return {
    id: structure.id,
    name: structure.name,
    road: structure.road,
    region: structure.region,
    city: structure.city,
    lat: structure.lat,
    lng: structure.lng,
    yearBuilt: structure.yearBuilt,
    lengthM: structure.lengthM,
    spans: structure.spans,
    deckWidthM: structure.deckWidthM ?? 12,
    material: structure.material,
    owner: structure.owner,
    family,
    girderCountPerSpan: girderCount,
    geometry,
    includeElementNos: scheduleNos.length
      ? scheduleNos
      : elementsForFamily(family).map((e) => e.no),
    notes: '',
  }
}

export function nextStructureId(existingIds: string[]): string {
  const nums = existingIds
    .map((id) => Number(id))
    .filter((n) => Number.isFinite(n) && n >= 10000 && n <= 99999)
  const start = 20001
  let candidate = Math.max(start, ...(nums.length ? nums.map((n) => n + 1) : [start]))
  const used = new Set(existingIds)
  while (used.has(String(candidate).padStart(5, '0')) || used.has(String(candidate))) {
    candidate += 1
  }
  return String(candidate).padStart(5, '0')
}
