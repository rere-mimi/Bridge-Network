import type {
  BridgeAsset,
  BridgeElement,
  ElementInspection,
  EnvironmentCategory,
} from '../types'

export const ELEMENT_CATALOGUE: BridgeElement[] = [
  { code: 'DEC', name: 'Deck', unit: 'm²', totalQuantity: 0 },
  { code: 'SUP', name: 'Superstructure', unit: 'm', totalQuantity: 0 },
  { code: 'ABT', name: 'Abutment', unit: 'each', totalQuantity: 0 },
  { code: 'PIE', name: 'Pier', unit: 'each', totalQuantity: 0 },
  { code: 'BEA', name: 'Bearing', unit: 'each', totalQuantity: 0 },
  { code: 'EXP', name: 'Expansion joint', unit: 'm', totalQuantity: 0 },
  { code: 'RAI', name: 'Barrier / railing', unit: 'm', totalQuantity: 0 },
  { code: 'FOU', name: 'Foundation', unit: 'm³', totalQuantity: 0 },
]

const MAINTENANCE_LIBRARY: Array<{ activityNumber: string; description: string }> = [
  { activityNumber: 'M-101', description: 'Clean and reseal expansion joints' },
  { activityNumber: 'M-214', description: 'Patch spalled concrete and apply coating' },
  { activityNumber: 'M-320', description: 'Replace deteriorated bearings' },
  { activityNumber: 'M-405', description: 'Tighten / replace barrier fixings' },
  { activityNumber: 'M-512', description: 'Scour protection / riprap reinstatement' },
  { activityNumber: 'M-618', description: 'Repaint structural steel' },
]

function elementsFor(
  specs: Array<Pick<BridgeElement, 'code' | 'totalQuantity'>>,
): BridgeElement[] {
  return specs.map((spec) => {
    const base = ELEMENT_CATALOGUE.find((e) => e.code === spec.code)!
    return { ...base, totalQuantity: spec.totalQuantity }
  })
}

export const BRIDGES: BridgeAsset[] = [
  {
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
    material: 'Steel box girder',
    owner: 'NZ Transport Agency',
    status: 'operational',
    lastInspection: '2026-03-12',
    nextInspectionDue: '2026-09-12',
    conditionIndex: 82,
    riskLevel: 'moderate',
    riskScore: 48,
    elements: elementsFor([
      { code: 'DEC', totalQuantity: 18400 },
      { code: 'SUP', totalQuantity: 1020 },
      { code: 'ABT', totalQuantity: 2 },
      { code: 'PIE', totalQuantity: 7 },
      { code: 'BEA', totalQuantity: 64 },
      { code: 'EXP', totalQuantity: 96 },
      { code: 'RAI', totalQuantity: 2040 },
      { code: 'FOU', totalQuantity: 3200 },
    ]),
  },
  {
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
    material: 'Reinforced concrete arch',
    owner: 'Auckland Transport',
    status: 'watch',
    lastInspection: '2026-01-20',
    nextInspectionDue: '2026-07-20',
    conditionIndex: 71,
    riskLevel: 'high',
    riskScore: 67,
    elements: elementsFor([
      { code: 'DEC', totalQuantity: 980 },
      { code: 'SUP', totalQuantity: 98 },
      { code: 'ABT', totalQuantity: 2 },
      { code: 'BEA', totalQuantity: 8 },
      { code: 'EXP', totalQuantity: 12 },
      { code: 'RAI', totalQuantity: 210 },
      { code: 'FOU', totalQuantity: 420 },
    ]),
  },
  {
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
    material: 'Prestressed concrete',
    owner: 'NZ Transport Agency',
    status: 'operational',
    lastInspection: '2026-02-04',
    nextInspectionDue: '2026-08-04',
    conditionIndex: 88,
    riskLevel: 'low',
    riskScore: 28,
    elements: elementsFor([
      { code: 'DEC', totalQuantity: 6200 },
      { code: 'SUP', totalQuantity: 465 },
      { code: 'ABT', totalQuantity: 2 },
      { code: 'PIE', totalQuantity: 10 },
      { code: 'BEA', totalQuantity: 44 },
      { code: 'EXP', totalQuantity: 48 },
      { code: 'RAI', totalQuantity: 930 },
      { code: 'FOU', totalQuantity: 1800 },
    ]),
  },
  {
    id: 'br-fai',
    name: 'Fairfield Bridge',
    road: 'Victoria St',
    region: 'Waikato',
    city: 'Hamilton',
    lat: -37.781,
    lng: 175.27,
    yearBuilt: 1937,
    lengthM: 139,
    spans: 5,
    material: 'Concrete arch',
    owner: 'Hamilton City Council',
    status: 'operational',
    lastInspection: '2025-11-18',
    nextInspectionDue: '2026-05-18',
    conditionIndex: 76,
    riskLevel: 'moderate',
    riskScore: 52,
    elements: elementsFor([
      { code: 'DEC', totalQuantity: 1680 },
      { code: 'SUP', totalQuantity: 139 },
      { code: 'ABT', totalQuantity: 2 },
      { code: 'PIE', totalQuantity: 4 },
      { code: 'BEA', totalQuantity: 20 },
      { code: 'EXP', totalQuantity: 18 },
      { code: 'RAI', totalQuantity: 280 },
      { code: 'FOU', totalQuantity: 640 },
    ]),
  },
  {
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
    material: 'Steel / concrete composite',
    owner: 'NZ Transport Agency',
    status: 'watch',
    lastInspection: '2026-04-02',
    nextInspectionDue: '2026-10-02',
    conditionIndex: 69,
    riskLevel: 'high',
    riskScore: 71,
    elements: elementsFor([
      { code: 'DEC', totalQuantity: 3400 },
      { code: 'SUP', totalQuantity: 210 },
      { code: 'ABT', totalQuantity: 2 },
      { code: 'PIE', totalQuantity: 3 },
      { code: 'BEA', totalQuantity: 24 },
      { code: 'EXP', totalQuantity: 28 },
      { code: 'RAI', totalQuantity: 420 },
      { code: 'FOU', totalQuantity: 900 },
    ]),
  },
  {
    id: 'br-rak',
    name: 'Rakaia Bridge',
    road: 'SH1',
    region: 'Canterbury',
    city: 'Rakaia',
    lat: -43.748,
    lng: 172.023,
    yearBuilt: 1939,
    lengthM: 1757,
    spans: 38,
    material: 'Steel truss / concrete',
    owner: 'NZ Transport Agency',
    status: 'operational',
    lastInspection: '2025-12-09',
    nextInspectionDue: '2026-06-09',
    conditionIndex: 79,
    riskLevel: 'moderate',
    riskScore: 55,
    elements: elementsFor([
      { code: 'DEC', totalQuantity: 15800 },
      { code: 'SUP', totalQuantity: 1757 },
      { code: 'ABT', totalQuantity: 2 },
      { code: 'PIE', totalQuantity: 37 },
      { code: 'BEA', totalQuantity: 152 },
      { code: 'EXP', totalQuantity: 120 },
      { code: 'RAI', totalQuantity: 3514 },
      { code: 'FOU', totalQuantity: 4100 },
    ]),
  },
  {
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
    material: 'Concrete arch',
    owner: 'NZ Transport Agency',
    status: 'restricted',
    lastInspection: '2026-02-28',
    nextInspectionDue: '2026-05-28',
    conditionIndex: 58,
    riskLevel: 'critical',
    riskScore: 86,
    elements: elementsFor([
      { code: 'DEC', totalQuantity: 2200 },
      { code: 'SUP', totalQuantity: 244 },
      { code: 'ABT', totalQuantity: 2 },
      { code: 'PIE', totalQuantity: 5 },
      { code: 'BEA', totalQuantity: 24 },
      { code: 'EXP', totalQuantity: 30 },
      { code: 'RAI', totalQuantity: 488 },
      { code: 'FOU', totalQuantity: 1100 },
    ]),
  },
  {
    id: 'br-awa',
    name: 'Awanui Stream Bridge',
    road: 'SH10',
    region: 'Northland',
    city: 'Kaitaia',
    lat: -35.112,
    lng: 173.263,
    yearBuilt: 1978,
    lengthM: 42,
    spans: 2,
    material: 'Reinforced concrete',
    owner: 'Far North District Council',
    status: 'operational',
    lastInspection: '2026-03-30',
    nextInspectionDue: '2026-09-30',
    conditionIndex: 91,
    riskLevel: 'low',
    riskScore: 18,
    elements: elementsFor([
      { code: 'DEC', totalQuantity: 340 },
      { code: 'SUP', totalQuantity: 42 },
      { code: 'ABT', totalQuantity: 2 },
      { code: 'PIE', totalQuantity: 1 },
      { code: 'BEA', totalQuantity: 8 },
      { code: 'EXP', totalQuantity: 6 },
      { code: 'RAI', totalQuantity: 84 },
      { code: 'FOU', totalQuantity: 180 },
    ]),
  },
]

export function createDefaultElementInspections(
  elements: BridgeElement[],
): ElementInspection[] {
  return elements.map((el, index) => {
    const environment: EnvironmentCategory =
      index % 3 === 0 ? 'Severe' : index % 2 === 0 ? 'Moderate' : 'Low'
    const cs3 = Math.round(el.totalQuantity * 0.08)
    const cs4 = Math.round(el.totalQuantity * 0.02)
    const cs2 = Math.round(el.totalQuantity * 0.18)
    const cs1 = Math.max(0, el.totalQuantity - cs2 - cs3 - cs4)
    return {
      elementCode: el.code,
      environment,
      quantities: { cs1, cs2, cs3, cs4 },
      usePercent: false,
      maintenanceActions:
        cs3 + cs4 > 0
          ? [MAINTENANCE_LIBRARY[index % MAINTENANCE_LIBRARY.length]]
          : [],
      comments: '',
    }
  })
}

export function quantitySum(q: {
  cs1: number
  cs2: number
  cs3: number
  cs4: number
}): number {
  return q.cs1 + q.cs2 + q.cs3 + q.cs4
}

export function conditionWeightedScore(q: {
  cs1: number
  cs2: number
  cs3: number
  cs4: number
}): number {
  const total = quantitySum(q)
  if (total <= 0) return 0
  const weighted = (q.cs1 * 100 + q.cs2 * 75 + q.cs3 * 40 + q.cs4 * 10) / total
  return Math.round(weighted)
}
