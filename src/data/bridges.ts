import type { BridgeAsset, ConditionBand } from '../types'
import { buildAppendixBElements } from './buildElements'

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
    { key: 'D', label: 'Deck' },
    { key: 'G', label: 'Girders' },
    { key: 'C', label: 'Columns/Piles' },
    { key: 'B', label: 'Bearings' },
    { key: 'H', label: 'Headstocks' },
  ]
  return rows.map((row) => ({
    element: row.label,
    spans: Array.from({ length: spans }, (_, i) => {
      const groupId = `S${i + 1}`
      const match =
        elements.find((e) => e.groupId === groupId && e.code === row.key) ??
        elements.find((e) => e.groupId === `P${i + 1}` && e.code === row.key) ??
        elements.find((e) => e.code === row.key)
      return match?.band ?? ('fair' as ConditionBand)
    }),
  }))
}

function makeBridge(
  partial: Omit<BridgeAsset, 'elements' | 'conditionIndex' | 'conditionBand' | 'heatmap'> & {
    family: 'girder' | 'box' | 'arch' | 'slab'
    conditionBase?: number
    riskBase?: number
  },
): BridgeAsset {
  const elements = buildAppendixBElements({
    spans: partial.spans,
    lengthM: partial.lengthM,
    family: partial.family,
    conditionBase: partial.conditionBase ?? 75,
    riskBase: partial.riskBase ?? 45,
  })
  const conditionIndex = avgCondition(elements)
  const { family: _f, conditionBase: _c, riskBase: _r, ...rest } = partial
  return {
    ...rest,
    elements,
    conditionIndex,
    conditionBand: bandFromScore(conditionIndex),
    heatmap: heatFromElements(partial.spans, elements),
  }
}

export const BRIDGES: BridgeAsset[] = [
  makeBridge({
    id: 'br-ash',
    name: 'Ashburton River Bridge',
    road: 'SH1',
    region: 'Canterbury',
    city: 'Ashburton',
    lat: -43.905,
    lng: 171.748,
    yearBuilt: 1998,
    lengthM: 186,
    spans: 5,
    material: 'Concrete',
    structureType: 'Concrete Multi-span',
    owner: 'NZ Transport Agency',
    status: 'watch',
    lastInspection: '2026-02-12',
    nextInspectionDue: '2027-02-12',
    riskLevel: 'moderate',
    riskScore: 68,
    remainingLifeYears: 38,
    photoLabel: 'Pier / soffit inspection',
    family: 'girder',
    conditionBase: 72,
    riskBase: 55,
    defects: [
      {
        id: 'd1',
        elementCode: 'G',
        elementName: 'S2-G4',
        title: 'Spalling',
        severity: 'high',
        status: 'open',
        date: '2026-02-12',
      },
      {
        id: 'd2',
        elementCode: 'G',
        elementName: 'S2-G4',
        title: 'Rust staining',
        severity: 'medium',
        status: 'monitoring',
        date: '2026-02-12',
      },
      {
        id: 'd3',
        elementCode: 'G',
        elementName: 'S2-G4',
        title: 'Longitudinal crack',
        severity: 'medium',
        status: 'open',
        date: '2026-02-12',
      },
      {
        id: 'd4',
        elementCode: 'C',
        elementName: 'P2-C',
        title: 'Surface deterioration',
        severity: 'high',
        status: 'planned',
        date: '2026-02-12',
      },
    ],
    inspections: [
      {
        id: 'i1',
        date: '2026-02-12',
        inspector: 'A. Ngata',
        summary: 'P2 columns and S2-G4 flagged for works',
        score: 72,
      },
      {
        id: 'i2',
        date: '2025-02-08',
        inspector: 'R. Lawson',
        summary: 'Routine inspection — joints resealed',
        score: 76,
      },
      {
        id: 'i3',
        date: '2024-01-30',
        inspector: 'S. Patel',
        summary: 'No critical defects recorded',
        score: 79,
      },
    ],
    documents: { drawings: 14, reports: 9, photos: 46 },
    riskBreakdown: {
      structural: 34,
      hydraulic: 22,
      seismic: 18,
      traffic: 16,
      other: 10,
    },
    maintenanceForecast: forecast(0.55),
  }),
  makeBridge({
    id: 'br-ahb',
    name: 'Auckland Harbour Bridge',
    road: 'SH1',
    region: 'Auckland',
    city: 'Auckland',
    lat: -36.8304,
    lng: 174.748,
    yearBuilt: 1959,
    lengthM: 1020,
    spans: 8,
    material: 'Steel',
    structureType: 'Steel Box Girder',
    owner: 'NZ Transport Agency',
    status: 'operational',
    lastInspection: '2026-03-12',
    nextInspectionDue: '2026-09-12',
    riskLevel: 'moderate',
    riskScore: 48,
    remainingLifeYears: 45,
    photoLabel: 'Clip-on span overview',
    family: 'box',
    conditionBase: 82,
    riskBase: 40,
    defects: [
      {
        id: 'd5',
        elementCode: 'B',
        elementName: 'P3-B',
        title: 'Movement restriction',
        severity: 'medium',
        status: 'monitoring',
        date: '2026-03-12',
      },
    ],
    inspections: [
      {
        id: 'i4',
        date: '2026-03-12',
        inspector: 'K. Rangi',
        summary: 'Network critical asset — routine clear',
        score: 82,
      },
    ],
    documents: { drawings: 38, reports: 22, photos: 120 },
    riskBreakdown: {
      structural: 28,
      hydraulic: 12,
      seismic: 30,
      traffic: 22,
      other: 8,
    },
    maintenanceForecast: forecast(1.2),
  }),
  makeBridge({
    id: 'br-gra',
    name: 'Grafton Bridge',
    road: 'Grafton Rd',
    region: 'Auckland',
    city: 'Auckland',
    lat: -36.8605,
    lng: 174.7645,
    yearBuilt: 1910,
    lengthM: 97.6,
    spans: 1,
    material: 'Concrete',
    structureType: 'Concrete Arch',
    owner: 'Auckland Transport',
    status: 'watch',
    lastInspection: '2026-01-20',
    nextInspectionDue: '2026-07-20',
    riskLevel: 'high',
    riskScore: 67,
    remainingLifeYears: 28,
    photoLabel: 'Arch soffit close-up',
    family: 'arch',
    conditionBase: 71,
    riskBase: 60,
    defects: [
      {
        id: 'd6',
        elementCode: 'ARH',
        elementName: 'S1-ARH',
        title: 'Moisture ingress',
        severity: 'high',
        status: 'open',
        date: '2026-01-20',
      },
    ],
    inspections: [
      {
        id: 'i5',
        date: '2026-01-20',
        inspector: 'S. Patel',
        summary: 'Heritage constraints on repair methods',
        score: 71,
      },
    ],
    documents: { drawings: 11, reports: 7, photos: 33 },
    riskBreakdown: {
      structural: 40,
      hydraulic: 8,
      seismic: 26,
      traffic: 18,
      other: 8,
    },
    maintenanceForecast: forecast(0.35),
  }),
  makeBridge({
    id: 'br-tau',
    name: 'Tauranga Harbour Bridge',
    road: 'SH2',
    region: 'Bay of Plenty',
    city: 'Tauranga',
    lat: -37.672,
    lng: 176.174,
    yearBuilt: 1988,
    lengthM: 465,
    spans: 11,
    material: 'Concrete',
    structureType: 'Prestressed Concrete',
    owner: 'NZ Transport Agency',
    status: 'operational',
    lastInspection: '2026-02-04',
    nextInspectionDue: '2026-08-04',
    riskLevel: 'low',
    riskScore: 28,
    remainingLifeYears: 52,
    photoLabel: 'Marine span overview',
    family: 'girder',
    conditionBase: 88,
    riskBase: 28,
    defects: [],
    inspections: [
      {
        id: 'i6',
        date: '2026-02-04',
        inspector: 'M. Chen',
        summary: 'Asset performing within envelope',
        score: 88,
      },
    ],
    documents: { drawings: 20, reports: 12, photos: 58 },
    riskBreakdown: {
      structural: 18,
      hydraulic: 30,
      seismic: 20,
      traffic: 22,
      other: 10,
    },
    maintenanceForecast: forecast(0.7),
  }),
  makeBridge({
    id: 'br-nga',
    name: 'Ngauranga Gorge Bridge',
    road: 'SH1',
    region: 'Wellington',
    city: 'Wellington',
    lat: -41.244,
    lng: 174.811,
    yearBuilt: 1969,
    lengthM: 210,
    spans: 4,
    material: 'Steel / Concrete',
    structureType: 'Composite Girder',
    owner: 'NZ Transport Agency',
    status: 'watch',
    lastInspection: '2026-04-02',
    nextInspectionDue: '2026-10-02',
    riskLevel: 'high',
    riskScore: 71,
    remainingLifeYears: 31,
    photoLabel: 'Gorge approach view',
    family: 'girder',
    conditionBase: 69,
    riskBase: 62,
    defects: [
      {
        id: 'd7',
        elementCode: 'B',
        elementName: 'A1-B',
        title: 'Corrosion',
        severity: 'high',
        status: 'planned',
        date: '2026-04-02',
      },
    ],
    inspections: [
      {
        id: 'i7',
        date: '2026-04-02',
        inspector: 'A. Ngata',
        summary: 'Bearing replacement candidate',
        score: 69,
      },
    ],
    documents: { drawings: 16, reports: 10, photos: 41 },
    riskBreakdown: {
      structural: 36,
      hydraulic: 10,
      seismic: 32,
      traffic: 14,
      other: 8,
    },
    maintenanceForecast: forecast(0.6),
  }),
  makeBridge({
    id: 'br-bal',
    name: 'Balclutha Bridge',
    road: 'SH1',
    region: 'Otago',
    city: 'Balclutha',
    lat: -46.233,
    lng: 169.744,
    yearBuilt: 1935,
    lengthM: 244,
    spans: 6,
    material: 'Concrete',
    structureType: 'Concrete Arch',
    owner: 'NZ Transport Agency',
    status: 'restricted',
    lastInspection: '2026-02-28',
    nextInspectionDue: '2026-05-28',
    riskLevel: 'critical',
    riskScore: 86,
    remainingLifeYears: 16,
    photoLabel: 'Arch elevation',
    family: 'arch',
    conditionBase: 58,
    riskBase: 78,
    defects: [
      {
        id: 'd8',
        elementCode: 'ARH',
        elementName: 'S3-ARH',
        title: 'Section loss',
        severity: 'critical',
        status: 'open',
        date: '2026-02-28',
      },
    ],
    inspections: [
      {
        id: 'i8',
        date: '2026-02-28',
        inspector: 'R. Lawson',
        summary: 'Load restriction retained',
        score: 58,
      },
    ],
    documents: { drawings: 9, reports: 15, photos: 67 },
    riskBreakdown: {
      structural: 48,
      hydraulic: 20,
      seismic: 14,
      traffic: 10,
      other: 8,
    },
    maintenanceForecast: forecast(0.9),
  }),
]

export function conditionLabel(band: ConditionBand): string {
  return band.charAt(0).toUpperCase() + band.slice(1)
}
