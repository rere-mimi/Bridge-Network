import type { BridgeAsset, ConditionBand, StructureKind } from '../types'
import { buildAppendixCElements } from './buildElements'
import {
  familyLabel,
  isCulvertFamily,
  type StructureFamily,
} from './elementSchedule'

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
    { keys: [404, 407, 610], label: 'Columns / piles' },
    { keys: [302, 300, 301], label: 'Bearings' },
    { keys: [402, 400, 606], label: 'Supports / headwall' },
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
  includeElementNos?: number[]
  notes?: string
}

export function kindFromFamily(family: StructureFamily): StructureKind {
  return isCulvertFamily(family) ? 'culvert' : 'bridge'
}

export function buildStructureFromDraft(draft: StructureDraft): BridgeAsset {
  const kind = kindFromFamily(draft.family)
  const elements = buildAppendixCElements({
    bridgeId: draft.id,
    spans: Math.max(1, draft.spans),
    lengthM: draft.lengthM,
    family: draft.family,
    deckWidthM: draft.deckWidthM,
    material: draft.material,
    girderCountPerSpan: draft.girderCountPerSpan,
    includeElementNos: draft.includeElementNos,
    conditionBase: 82,
    riskBase: 35,
  })
  const conditionIndex = avgCondition(elements)
  const today = new Date().toISOString().slice(0, 10)
  const next = new Date()
  next.setFullYear(next.getFullYear() + 1)

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
    material: draft.material,
    structureType: familyLabel(draft.family),
    kind,
    family: draft.family,
    source: 'user',
    createdAt: new Date().toISOString(),
    owner: draft.owner,
    status: 'operational',
    lastInspection: today,
    nextInspectionDue: next.toISOString().slice(0, 10),
    conditionIndex,
    conditionBand: bandFromScore(conditionIndex),
    riskLevel: 'low',
    riskScore: 28,
    remainingLifeYears: Math.max(20, 100 - (new Date().getFullYear() - draft.yearBuilt)),
    photoLabel: kind === 'culvert' ? 'Culvert model' : 'Bridge model',
    elements,
    defects: [],
    inspections: [
      {
        id: `i-${draft.id}-1`,
        date: today,
        inspector: 'Model builder',
        summary: draft.notes?.trim() || `Created from Appendix C ${familyLabel(draft.family)} template`,
        score: conditionIndex,
      },
    ],
    documents: { drawings: 0, reports: 0, photos: 0 },
    riskBreakdown: {
      structural: 20,
      hydraulic: kind === 'culvert' ? 35 : 18,
      seismic: 18,
      traffic: 16,
      other: 11,
    },
    maintenanceForecast: forecast(0.35),
    heatmap: heatFromElements(Math.max(1, draft.spans), elements),
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
