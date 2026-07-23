export type PlatformModule =
  | 'overview'
  | 'assets'
  | 'inspections'
  | 'condition'
  | 'risk'
  | 'maintenance'
  | 'costs'
  | 'reports'

export type SidebarId =
  | 'home'
  | 'assets'
  | 'analytics'
  | 'maps'
  | 'alerts'
  | 'settings'

export type OperationalStatus = 'operational' | 'watch' | 'restricted' | 'closed'
export type EnvironmentCategory = 'Low' | 'Moderate' | 'Severe'
export type ConditionState = 1 | 2 | 3 | 4
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical'
export type ElementUnit = 'm²' | 'm' | 'each' | 'm³'
export type ConditionBand = 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
export type ComponentGroupKind = 'abutment' | 'pier' | 'span' | 'approach'

export type BridgeElement = {
  /** Unique instance id, e.g. S1-D or P2-H */
  id: string
  /** Appendix B component code, e.g. D, G, H, B */
  code: string
  /** Appendix B schedule number */
  scheduleNo: number
  name: string
  category: string
  group: ComponentGroupKind
  /** Group designation: A1, P1, S1, AP1 */
  groupId: string
  significance: 1 | 2 | 3 | 4
  unit: ElementUnit
  totalQuantity: number
  conditionScore: number
  riskScore: number
  band: ConditionBand
}

export type DefectRecord = {
  id: string
  elementCode: string
  elementName: string
  title: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'monitoring' | 'planned' | 'closed'
  date: string
}

export type DrawnDefectKind = 'crack' | 'spall' | 'patch'

export type DrawnDefect = {
  id: string
  kind: DrawnDefectKind
  points: Array<{ x: number; y: number }> // normalized 0-1 canvas coords
  label: string
  lengthM?: number
  areaM2?: number
  createdAt: string
  elementId?: string | null
}


export type InspectionHistoryItem = {
  id: string
  date: string
  inspector: string
  summary: string
  score: number
}

export type BridgeAsset = {
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
  material: string
  structureType: string
  owner: string
  status: OperationalStatus
  lastInspection: string
  nextInspectionDue: string
  conditionIndex: number
  conditionBand: ConditionBand
  riskLevel: RiskLevel
  riskScore: number
  remainingLifeYears: number
  photoLabel: string
  elements: BridgeElement[]
  defects: DefectRecord[]
  inspections: InspectionHistoryItem[]
  documents: { drawings: number; reports: number; photos: number }
  riskBreakdown: {
    structural: number
    hydraulic: number
    seismic: number
    traffic: number
    other: number
  }
  maintenanceForecast: Array<{
    year: number
    routine: number
    rehab: number
    replace: number
  }>
  heatmap: Array<{
    element: string
    spans: ConditionBand[]
  }>
}

export type Filters = {
  region: string
  structureType: string
  condition: string
  risk: string
}
