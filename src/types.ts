export type PlatformModule =
  | 'overview'
  | 'assets'
  | 'create-model'
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
export type ElementMajorGroup =
  | 'Superstructure'
  | 'Substructure'
  | 'Ancillary'
  | 'Culvert'
  | 'Tunnel'
  | 'Retaining wall'
  | 'Sign / gantry'
  | 'Geotech'

/** Real-world element dimensions (metres) for inventory + 3D. */
export type ElementSizeM = {
  length?: number
  width?: number
  height?: number
  diameter?: number
  openingHeight?: number
}

export type BeamSectionType = 'open-ibeam' | 't-beam' | 'box' | 'slab'
export type PierType = 'wall' | 'multi-column' | 'trestle' | 'pile-bent'
export type ArchSpandrelType = 'closed' | 'open'

/** Editable geometry when creating / updating a model. */
export type StructureGeometry = {
  beamType: BeamSectionType
  girderCountPerSpan: number
  pierType: PierType
  columnsPerPier: number
  columnsPerAbutment: number
  /** Closed (walls/fill) vs open (columns) deck arch — arch family only */
  archSpandrelType?: ArchSpandrelType
  /** Open-spandrel posts per span (element 206) */
  spandrelColumnCount?: number
  elementSizes: Record<number, ElementSizeM>
}

export type BridgeElement = {
  /** Unique instance id, e.g. 10001-S1-200 or 10001-S2-201-4 */
  id: string
  /** Owning bridge 5-digit id */
  bridgeId: string
  /** Appendix C element code (3-digit padded), e.g. "200", "404" */
  code: string
  /** Appendix C schedule number */
  scheduleNo: number
  name: string
  /** Appendix C schedule category (Carriageway level, Superstructure, Bearings, …) */
  category: string
  /** Major group: Superstructure / Substructure / Ancillary / … */
  majorGroup: ElementMajorGroup
  /** Friendly subgroup: Deck, Beams, Bearings, Roadway, Pier, Abutment, … */
  subgroup: string
  /** Location kind on the structure */
  group: ComponentGroupKind
  /** Location designation: A1, P1, S1, AP1 */
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
  /** Real-world size for this instance (m) */
  sizeM?: ElementSizeM
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
export type DefectFace = 'top' | 'front' | 'side' | 'end'

export type DrawnDefect = {
  id: string
  kind: DrawnDefectKind
  /** Appendix E defect type code */
  defectCode: string
  /** Normalised 0–1 coordinates on the pinned face */
  points: Array<{ x: number; y: number }>
  label: string
  /** Crack length on the face (m) */
  lengthM?: number
  /** Polygon area on the face (m²) */
  areaM2?: number
  /** Crack intensity: m of crack per m² of face */
  lengthDensityMPerM2?: number
  /** Face area used for the measurement (m²) */
  faceAreaM2?: number
  /** Equivalent defect area (polygons as-is; cracks use nominal width) */
  equivAreaM2?: number
  createdAt: string
  /** Element the defect is pinned to (required when attributed) */
  elementId?: string | null
  /** Exact inspection face on the element */
  face?: DefectFace
  /** Material code of the host element at draw time */
  material?: 'S' | 'P' | 'C' | 'T' | 'M' | 'O'
  /**
   * Condition state 1–4 (Appendix). Optional until severity×extent algorithm is uploaded.
   */
  conditionState?: ConditionState
}


export type InspectionHistoryItem = {
  id: string
  date: string
  inspector: string
  summary: string
  score: number
}

export type MaintenanceRecommendationStatus =
  | 'proposed'
  | 'approved'
  | 'completed'
  | 'deferred'

/** Activity selected during inspection for an element (costed work item). */
export type MaintenanceRecommendation = {
  id: string
  activityCode: number
  activityDescription: string
  unit: 'm²' | 'm' | 'each' | 'hour' | '—'
  category: 'preventive' | 'routine' | 'repair' | 'major'
  quantity: number
  /** Unit price in NZD */
  unitPrice: number
  /** quantity × unitPrice */
  totalCost: number
  elementId: string
  elementName: string
  scheduleNo: number
  groupId: string
  status: MaintenanceRecommendationStatus
  inspectionId?: string
  notes?: string
  createdAt: string
  conditionState?: ConditionState
}

export type StructureKind = 'bridge' | 'culvert'
export type StructureSource = 'seed' | 'user'

export type BridgeAsset = {
  /** Unique 5-digit numeric bridge ID */
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
  /** Carriageway / barrel width */
  deckWidthM?: number
  /** Beam / pier configuration and per-element dimensions */
  geometry?: StructureGeometry
  material: string
  structureType: string
  /** Bridge vs culvert */
  kind?: StructureKind
  /** Appendix C family used to seed elements */
  family?:
    | 'girder'
    | 'box'
    | 'arch'
    | 'slab'
    | 'box-culvert'
    | 'pipe-culvert'
    | 'pipe-arch-culvert'
    | 'arch-culvert'
  /** Seed demo data vs user-created database record */
  source?: StructureSource
  createdAt?: string
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
  /** Drawn inspection defects persisted with the structure */
  drawnDefects?: DrawnDefect[]
  /** Costed maintenance activities selected at inspection */
  recommendations?: MaintenanceRecommendation[]
  inspections: InspectionHistoryItem[]
  documents: { drawings: number; reports: number; photos: number }
  riskBreakdown: {
    structural: number
    hydraulic: number
    seismic: number
    traffic: number
    other: number
  }
  /** NZ NSHM site hazard used for seismic risk (HazardMaps / Kororaa API). */
  seismicHazard?: {
    lat: number
    lng: number
    /** PGA (g) at 10% PoE in 50 years, Vs30 ≈ 400 m/s */
    pga: number
    vs30: number
    poe: number
    investigationYears: number
    model: string
    source: 'nshm-api' | 'regional-fallback'
    locationCode?: string
    locationName?: string
    fetchedAt: string
    mapUrl: string
    curvesUrl: string
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
