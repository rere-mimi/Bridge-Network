export type PlatformView =
  | 'overview'
  | 'inventory'
  | 'inspection'
  | 'condition'
  | 'risk'
  | 'twin'
  | 'planning'

export type OperationalStatus = 'operational' | 'watch' | 'restricted' | 'closed'

export type EnvironmentCategory = 'Low' | 'Moderate' | 'Severe'

export type ConditionState = 1 | 2 | 3 | 4

export type InspectionPhase =
  | 'elements'
  | 'quantities'
  | 'bis-entry'
  | 'inspect'
  | 'bmp-review'
  | 'bis-data'
  | 'reports'

export type InspectionStatus =
  | 'draft'
  | 'in-progress'
  | 'submitted'
  | 'bmp-reviewed'
  | 'entered'
  | 'reported'

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical'

export type ElementUnit = 'm²' | 'm' | 'each' | 'm³'

export type BridgeElement = {
  code: string
  name: string
  unit: ElementUnit
  totalQuantity: number
}

export type ConditionQuantities = {
  cs1: number
  cs2: number
  cs3: number
  cs4: number
}

export type MaintenanceAction = {
  activityNumber: string
  description: string
}

export type ElementInspection = {
  elementCode: string
  environment: EnvironmentCategory
  quantities: ConditionQuantities
  usePercent: boolean
  maintenanceActions: MaintenanceAction[]
  comments: string
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
  owner: string
  status: OperationalStatus
  lastInspection: string
  nextInspectionDue: string
  conditionIndex: number
  riskLevel: RiskLevel
  riskScore: number
  elements: BridgeElement[]
}

export type InspectionReport = {
  id: string
  bridgeId: string
  bridgeName: string
  inspector: string
  startedAt: string
  updatedAt: string
  status: InspectionStatus
  phase: InspectionPhase
  elements: ElementInspection[]
  bmpComments: string
  submittedAt?: string
  reviewedAt?: string
  enteredAt?: string
}

export type ActivityEvent = {
  id: string
  time: string
  bridgeId: string
  bridgeName: string
  message: string
  kind: 'info' | 'warn' | 'critical' | 'ok'
}

export type LiveMetrics = {
  totalBridges: number
  operational: number
  watchCount: number
  avgCondition: number
  openInspections: number
  highRisk: number
}

export type ForecastScenario = {
  id: string
  label: string
  horizonYears: number
  conditionTrend: number[]
  costEstimate: number
  deferredRisk: RiskLevel
  enabled: boolean
}

export const INSPECTION_STEPS: Array<{
  id: InspectionPhase
  step: number
  title: string
  summary: string
}> = [
  {
    id: 'elements',
    step: 1,
    title: 'Divide into coded elements',
    summary: 'Break the bridge into standard coded structural elements.',
  },
  {
    id: 'quantities',
    step: 2,
    title: 'Calculate element quantities',
    summary: 'Confirm the total quantity of each coded element.',
  },
  {
    id: 'bis-entry',
    step: 3,
    title: 'Enter element data into BIS',
    summary: 'Load element codes and quantities into the Bridge Information System.',
  },
  {
    id: 'inspect',
    step: 4,
    title: 'Inspect & complete report',
    summary:
      'Assign environment, condition states, maintenance actions, and inspector comments.',
  },
  {
    id: 'bmp-review',
    step: 5,
    title: 'Submit to BMP',
    summary: 'Send the inspection report to the Bridge Maintenance Planner for review.',
  },
  {
    id: 'bis-data',
    step: 6,
    title: 'Enter inspection data into BIS',
    summary: 'Post reviewed inspection results into the official BIS record.',
  },
  {
    id: 'reports',
    step: 7,
    title: 'Generate inspection reports',
    summary: 'Produce required bridge inspection reports from BIS.',
  },
]
