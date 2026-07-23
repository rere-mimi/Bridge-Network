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
  /** Unique instance id, e.g. S1-200 or P2-404-1 */
  id: string
  /** Appendix C element code (schedule number as string), e.g. "200", "404" */
  code: string
  /** Appendix C schedule number */
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
  /** Appendix F material variant used for description */
  material?: 'S' | 'P' | 'C' | 'T' | 'M' | 'O'
  /** Appendix F element title */
  descriptionTitle?: string
  /** Appendix F detailed description (summary) */
  description?: string
}

export type DefectRecord = {
  id: string
  elementCode: string
  elementName: string
  title: string
  /** Appendix E defect type code when known */
  defectCode?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'monitoring' | 'planned' | 'closed'
  date: string
}

export type DrawnDefectKind = 'crack' | 'spall' | 'patch'

export type DrawnDefect = {
  id: string
  kind: DrawnDefectKind
  /** Appendix E defect type code */
  defectCode: string
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
