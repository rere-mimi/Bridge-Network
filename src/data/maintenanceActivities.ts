/**
 * Maintenance activities — MTQ Structure Inspection Manual §15.8
 * Table 15.8-1 Activities available by element (English labels).
 *
 * Categories: preventive (1000), routine (2000), repair (3000).
 * Major rehab (5000) is excluded from general inspection recommendations.
 * `unitPrice` is reserved for future inspection selection costing.
 */

export type MaintenanceUnit = 'm²' | 'm' | 'each' | 'hour' | '—'
export type MaintenanceCategory = 'preventive' | 'routine' | 'repair' | 'major'

export type MaintenanceActivity = {
  code: number
  description: string
  unit: MaintenanceUnit
  category: MaintenanceCategory
  /** Future: default unit price when selected at inspection */
  unitPrice?: number | null
}

export type ElementActivitySet = {
  id: string
  group: string
  element: string
  /** Appendix C schedule numbers this set applies to */
  scheduleNos: number[]
  activityCodes: number[]
}

export const MAINTENANCE_CATEGORY_LABEL: Record<MaintenanceCategory, string> = {
  preventive: 'Preventive maintenance (1000)',
  routine: 'Routine maintenance (2000)',
  repair: 'Repair (3000)',
  major: 'Major rehabilitation (5000)',
}

export const MAINTENANCE_ACTIVITIES: MaintenanceActivity[] = [
  { code: 1011, description: "Cleaning under the deck", unit: "m", category: 'preventive', unitPrice: null },
  { code: 1012, description: "Cleaning the top of the deck", unit: "m", category: 'preventive', unitPrice: null },
  { code: 1013, description: "Roadway sweeping", unit: "m", category: 'preventive', unitPrice: null },
  { code: 1014, description: "Drain cleaning", unit: "each", category: 'preventive', unitPrice: null },
  { code: 1015, description: "Drainage system cleaning", unit: "each", category: 'preventive', unitPrice: null },
  { code: 1016, description: "Cleaning inside box girder", unit: "m", category: 'preventive', unitPrice: null },
  { code: 1017, description: "Foundation unit cleaning", unit: "each", category: 'preventive', unitPrice: null },
  { code: 1018, description: "Removal of debris from waterway", unit: "hour", category: 'preventive', unitPrice: null },
  { code: 1031, description: "Replacement of interlocking deck joint seal", unit: "m", category: 'preventive', unitPrice: null },
  { code: 1041, description: "Asphalt resurfacing", unit: "m\u00b2", category: 'preventive', unitPrice: null },
  { code: 1042, description: "Sealing of asphalt cracks", unit: "m", category: 'preventive', unitPrice: null },
  { code: 1051, description: "Touch-up painting", unit: "m\u00b2", category: 'preventive', unitPrice: null },
  { code: 1052, description: "Zone painting", unit: "m\u00b2", category: 'preventive', unitPrice: null },
  { code: 1061, description: "Waterproofing of concrete surfaces", unit: "m\u00b2", category: 'preventive', unitPrice: null },
  { code: 1062, description: "Surface coating application", unit: "m\u00b2", category: 'preventive', unitPrice: null },
  { code: 1071, description: "Vegetation removal", unit: "each", category: 'preventive', unitPrice: null },
  { code: 1081, description: "Removal of concrete fragments", unit: "hour", category: 'preventive', unitPrice: null },
  { code: 1082, description: "Securing underside of deck", unit: "m\u00b2", category: 'preventive', unitPrice: null },
  { code: 1083, description: "Removal of rust layers", unit: "hour", category: 'preventive', unitPrice: null },
  { code: 1091, description: "Access to a confined space", unit: "each", category: 'preventive', unitPrice: null },
  { code: 2001, description: "Maintenance of cable bridge elements", unit: "\u2014", category: 'routine', unitPrice: null },
  { code: 2011, description: "Intervention for safety-related signage", unit: "each", category: 'routine', unitPrice: null },
  { code: 2012, description: "Intervention for capacity-related signage", unit: "each", category: 'routine', unitPrice: null },
  { code: 2051, description: "Correction of deck joint nosing", unit: "m", category: 'routine', unitPrice: null },
  { code: 2052, description: "Correction of steel deck joint element", unit: "hour", category: 'routine', unitPrice: null },
  { code: 2053, description: "Unblocking a deck joint", unit: "each", category: 'routine', unitPrice: null },
  { code: 2071, description: "Barrier / guardrail consolidation", unit: "m", category: 'routine', unitPrice: null },
  { code: 2131, description: "Temporary slab repair", unit: "hour", category: 'routine', unitPrice: null },
  { code: 2201, description: "Replacement of bolts/rivets", unit: "each", category: 'routine', unitPrice: null },
  { code: 2311, description: "Refilling of timber crib", unit: "each", category: 'routine', unitPrice: null },
  { code: 2312, description: "Consolidation of timber crib", unit: "each", category: 'routine', unitPrice: null },
  { code: 2331, description: "Fixing of timber cross members", unit: "m", category: 'routine', unitPrice: null },
  { code: 3001, description: "Repair/replacement of cable bridge element", unit: "each", category: 'repair', unitPrice: null },
  { code: 3005, description: "Installation/repair of a clearance gauge", unit: "each", category: 'repair', unitPrice: null },
  { code: 3011, description: "Riprap", unit: "each", category: 'repair', unitPrice: null },
  { code: 3012, description: "Watercourse correction", unit: "\u2014", category: 'repair', unitPrice: null },
  { code: 3021, description: "Embankment stabilisation", unit: "\u2014", category: 'repair', unitPrice: null },
  { code: 3022, description: "Slope protection", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3023, description: "Embankment repair", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3026, description: "Asphalt patching", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3027, description: "Granular material patching", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3031, description: "Foundation consolidation with sand-cement bags/riprap", unit: "each", category: 'repair', unitPrice: null },
  { code: 3032, description: "Foundation consolidation by adding concrete", unit: "each", category: 'repair', unitPrice: null },
  { code: 3033, description: "Pile consolidation", unit: "each", category: 'repair', unitPrice: null },
  { code: 3034, description: "Footing repair", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3035, description: "Foundation stabilisation", unit: "\u2014", category: 'repair', unitPrice: null },
  { code: 3042, description: "Repair/modification of bearing pedestals/stoppers", unit: "each", category: 'repair', unitPrice: null },
  { code: 3043, description: "Repositioning of bearing", unit: "each", category: 'repair', unitPrice: null },
  { code: 3044, description: "Replacement of bearing", unit: "each", category: 'repair', unitPrice: null },
  { code: 3045, description: "Repair of roller bearing", unit: "each", category: 'repair', unitPrice: null },
  { code: 3046, description: "Replacement of roller bearing", unit: "each", category: 'repair', unitPrice: null },
  { code: 3051, description: "Replacement of a deck joint", unit: "m", category: 'repair', unitPrice: null },
  { code: 3052, description: "Slab joint at abutment", unit: "m", category: 'repair', unitPrice: null },
  { code: 3053, description: "Elimination of deck joint at a pier", unit: "m", category: 'repair', unitPrice: null },
  { code: 3054, description: "Sealing of a longitudinal joint", unit: "m", category: 'repair', unitPrice: null },
  { code: 3061, description: "Repair/replacement of concrete sidewalk, kerb or median", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3062, description: "Modification/addition of drains", unit: "each", category: 'repair', unitPrice: null },
  { code: 3063, description: "Replacement of drainage system", unit: "each", category: 'repair', unitPrice: null },
  { code: 3064, description: "Repair/replacement of inspection walkway", unit: "\u2014", category: 'repair', unitPrice: null },
  { code: 3065, description: "Painting of a steel structure", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3066, description: "Correction of approach profile", unit: "each", category: 'repair', unitPrice: null },
  { code: 3067, description: "Replacement of asphalt surfacing", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3068, description: "Approach works", unit: "each", category: 'repair', unitPrice: null },
  { code: 3069, description: "Repair/replacement of stairway", unit: "each", category: 'repair', unitPrice: null },
  { code: 3071, description: "Barrier / guardrail repair", unit: "m", category: 'repair', unitPrice: null },
  { code: 3072, description: "Connection of approach barrier", unit: "each", category: 'repair', unitPrice: null },
  { code: 3073, description: "Replacement/addition of barrier", unit: "m", category: 'repair', unitPrice: null },
  { code: 3074, description: "Repair/replacement of approach barrier", unit: "m", category: 'repair', unitPrice: null },
  { code: 3081, description: "Repair of concrete retaining wall", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3082, description: "Repair of masonry retaining wall", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3083, description: "Repair \u2013 other wall types", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3084, description: "Repair \u2013 timber or other material retaining wall", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3091, description: "Repair of reinforced concrete culvert", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3092, description: "Repair of steel culvert", unit: "m", category: 'repair', unitPrice: null },
  { code: 3093, description: "Repair of timber culvert", unit: "m", category: 'repair', unitPrice: null },
  { code: 3094, description: "Repair/replacement of culvert inlet/outlet element", unit: "each", category: 'repair', unitPrice: null },
  { code: 3095, description: "Repair of polyethylene culvert", unit: "m", category: 'repair', unitPrice: null },
  { code: 3106, description: "Crack sealing by injection", unit: "m", category: 'repair', unitPrice: null },
  { code: 3111, description: "Repair of concrete abutment", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3112, description: "Repair of concrete pier", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3113, description: "Repair of concrete strut / raker", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3114, description: "Reconstruction of concrete foundation unit elements", unit: "each", category: 'repair', unitPrice: null },
  { code: 3115, description: "Repair of crack in a concrete element", unit: "m", category: 'repair', unitPrice: null },
  { code: 3121, description: "Repair of reinforced concrete beam/diaphragm", unit: "m", category: 'repair', unitPrice: null },
  { code: 3122, description: "Repair of reinforced concrete beam end", unit: "each", category: 'repair', unitPrice: null },
  { code: 3124, description: "Repair of prestressed concrete beam/diaphragm", unit: "m", category: 'repair', unitPrice: null },
  { code: 3125, description: "Repair of concrete box girder", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3126, description: "Reconstruction of reinforced concrete diaphragm", unit: "each", category: 'repair', unitPrice: null },
  { code: 3127, description: "Repair of reinforced concrete arch elements", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3131, description: "Repair of beam-supported slab and thick slab", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3132, description: "Repair of underside of thick slab", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3134, description: "Reconstruction of slab edge", unit: "m", category: 'repair', unitPrice: null },
  { code: 3135, description: "Repair of upper slab of concrete box girder", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3136, description: "Repair of slab edge", unit: "m", category: 'repair', unitPrice: null },
  { code: 3201, description: "Repair/replacement of steel connection", unit: "each", category: 'repair', unitPrice: null },
  { code: 3211, description: "Repair of steel bent", unit: "each", category: 'repair', unitPrice: null },
  { code: 3212, description: "Repair of steel strut / raker", unit: "each", category: 'repair', unitPrice: null },
  { code: 3221, description: "Repair/replacement of steel element", unit: "each", category: 'repair', unitPrice: null },
  { code: 3222, description: "Replacement of steel truss member", unit: "each", category: 'repair', unitPrice: null },
  { code: 3223, description: "Raising of steel truss end portal", unit: "each", category: 'repair', unitPrice: null },
  { code: 3224, description: "Addition of diaphragm/bracing on steel-timber bridge", unit: "each", category: 'repair', unitPrice: null },
  { code: 3231, description: "Repair of open steel grating", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3232, description: "Replacement of open steel grating", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3311, description: "Replacement of timber crib", unit: "m", category: 'repair', unitPrice: null },
  { code: 3312, description: "Replacement of timber bent", unit: "m", category: 'repair', unitPrice: null },
  { code: 3314, description: "Repair/replacement of timber crib seat", unit: "each", category: 'repair', unitPrice: null },
  { code: 3315, description: "Repair of timber bent", unit: "each", category: 'repair', unitPrice: null },
  { code: 3321, description: "Replacement of timber cross beams", unit: "each", category: 'repair', unitPrice: null },
  { code: 3322, description: "Repair/replacement of timber beam or diaphragm", unit: "m", category: 'repair', unitPrice: null },
  { code: 3323, description: "Replacement/addition of timber stringers", unit: "each", category: 'repair', unitPrice: null },
  { code: 3331, description: "Replacement of timber flooring", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3332, description: "Replacement of timber decking", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3333, description: "Replacement of laminated timber decking", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3334, description: "Repair of timber flooring", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3335, description: "Repair/replacement of timber sidewalk/kerb", unit: "m", category: 'repair', unitPrice: null },
  { code: 3337, description: "Repair of timber decking", unit: "each", category: 'repair', unitPrice: null },
  { code: 3341, description: "Repair of timber truss chord", unit: "m", category: 'repair', unitPrice: null },
  { code: 3342, description: "Repair of timber truss post", unit: "each", category: 'repair', unitPrice: null },
  { code: 3343, description: "Repair of timber truss diagonal", unit: "each", category: 'repair', unitPrice: null },
  { code: 3344, description: "Adjustment/replacement of tie rods", unit: "each", category: 'repair', unitPrice: null },
  { code: 3345, description: "Repair/replacement of timber bracing", unit: "each", category: 'repair', unitPrice: null },
  { code: 3346, description: "Repair/replacement of roofing", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3347, description: "Repair/replacement of cladding", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3348, description: "Protective coating of cladding", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3349, description: "Replacement of timber corbel", unit: "each", category: 'repair', unitPrice: null },
  { code: 3411, description: "Repair of masonry element", unit: "\u2014", category: 'repair', unitPrice: null },
]

const BY_CODE = new Map(MAINTENANCE_ACTIVITIES.map((a) => [a.code, a]))

export function activityByCode(code: number): MaintenanceActivity | undefined {
  return BY_CODE.get(code)
}

export const ELEMENT_ACTIVITY_SETS: ElementActivitySet[] = [
  { id: "waterway-and-embankment-waterway", group: "Waterway and embankment", element: "Waterway", scheduleNos: [500], activityCodes: [1018, 3011, 3012] },
  { id: "waterway-and-embankment-embankment", group: "Waterway and embankment", element: "Embankment", scheduleNos: [501], activityCodes: [1071, 3021, 3023] },
  { id: "waterway-and-embankment-slope-protection", group: "Waterway and embankment", element: "Slope protection", scheduleNos: [502], activityCodes: [3022] },
  { id: "waterway-and-embankment-bed-protection", group: "Waterway and embankment", element: "Bed protection", scheduleNos: [500], activityCodes: [3011] },
  { id: "abutment-foundation", group: "Abutment", element: "Foundation", scheduleNos: [406, 407], activityCodes: [3021, 3023, 3031, 3032, 3033, 3034, 3035, 3115] },
  { id: "abutment-front-wall", group: "Abutment", element: "Front wall", scheduleNos: [400], activityCodes: [1017, 1061, 1062, 1081, 2311, 2312, 3106, 3111, 3113, 3115, 3311, 3312, 3315, 3411] },
  { id: "abutment-columns", group: "Abutment", element: "Columns", scheduleNos: [404, 405], activityCodes: [1017, 1061, 1062, 1081, 3106, 3111, 3113, 3115, 3211, 3212, 3312, 3315] },
  { id: "abutment-headstock-pier-cap", group: "Abutment", element: "Headstock / pier cap", scheduleNos: [402], activityCodes: [1017, 1061, 1062, 1081, 2201, 3106, 3111, 3114, 3115, 3211, 3315] },
  { id: "abutment-breast-wall", group: "Abutment", element: "Breast wall", scheduleNos: [400], activityCodes: [1017, 1061, 1062, 2312, 3106, 3111, 3114, 3115, 3221, 3411] },
  { id: "abutment-bearing-pedestals", group: "Abutment", element: "Bearing pedestals", scheduleNos: [306], activityCodes: [1017, 1061, 1062, 3042, 3314] },
  { id: "abutment-corbels", group: "Abutment", element: "Corbels", scheduleNos: [309], activityCodes: [2201, 3221, 3349] },
  { id: "abutment-bearings", group: "Abutment", element: "Bearings", scheduleNos: [300, 301, 302, 303, 304, 305], activityCodes: [2201, 3043, 3044, 3045, 3046] },
  { id: "abutment-stoppers-thrust-blocks", group: "Abutment", element: "Stoppers / thrust blocks", scheduleNos: [307, 308], activityCodes: [1017, 1061, 1062, 3042] },
  { id: "abutment-wingwall-return-wall", group: "Abutment", element: "Wingwall / return wall", scheduleNos: [401], activityCodes: [1017, 1061, 1062, 2311, 2312, 3111, 3114, 3115, 3311, 3411] },
  { id: "abutment-seat", group: "Abutment", element: "Seat", scheduleNos: [400, 406], activityCodes: [1017, 1061, 1062, 3106, 3111, 3115, 3211, 3314, 3411] },
  { id: "pier-foundation", group: "Pier", element: "Foundation", scheduleNos: [406, 407], activityCodes: [3031, 3032, 3033, 3034, 3035, 3115] },
  { id: "pier-shaft-pier-wall", group: "Pier", element: "Shaft / pier wall", scheduleNos: [403], activityCodes: [1017, 1061, 1062, 1081, 2001, 2201, 2311, 2312, 3106, 3112, 3113, 3115, 3201, 3311, 3411] },
  { id: "pier-columns-bents", group: "Pier", element: "Columns / bents", scheduleNos: [404, 405], activityCodes: [1017, 1061, 1062, 1081, 2001, 2201, 3106, 3112, 3113, 3115, 3201, 3211, 3212, 3312, 3315] },
  { id: "pier-headstock-pier-cap", group: "Pier", element: "Headstock / pier cap", scheduleNos: [402], activityCodes: [1017, 1061, 1062, 1081, 2201, 3106, 3112, 3114, 3115, 3211, 3315] },
  { id: "pier-bearing-pedestals", group: "Pier", element: "Bearing pedestals", scheduleNos: [306], activityCodes: [1017, 1061, 1062, 3042, 3314] },
  { id: "pier-corbels", group: "Pier", element: "Corbels", scheduleNos: [309], activityCodes: [2201, 3221, 3349] },
  { id: "pier-bearings", group: "Pier", element: "Bearings", scheduleNos: [300, 301, 302, 303, 304, 305], activityCodes: [2201, 3043, 3044, 3045, 3046] },
  { id: "pier-stoppers-thrust-blocks", group: "Pier", element: "Stoppers / thrust blocks", scheduleNos: [307, 308], activityCodes: [1017, 1061, 1062, 3042] },
  { id: "pier-seat", group: "Pier", element: "Seat", scheduleNos: [402, 406], activityCodes: [1017, 1061, 1062, 3106, 3112, 3115, 3211, 3314, 3411] },
  { id: "decking-wearing-surface", group: "Decking", element: "Wearing surface", scheduleNos: [1], activityCodes: [1012, 1013, 1041, 1042, 2011, 3026, 3067, 3331, 3334] },
  { id: "decking-drainage-system", group: "Decking", element: "Drainage system", scheduleNos: [230, 505], activityCodes: [1014, 1015, 3062, 3063] },
  { id: "decking-slab-edge", group: "Decking", element: "Slab edge", scheduleNos: [200], activityCodes: [1012, 1061, 1062, 1081, 1082, 3106, 3134, 3136] },
  { id: "decking-deck-slab", group: "Decking", element: "Deck / slab", scheduleNos: [200], activityCodes: [1011, 1012, 1013, 1061, 1062, 1081, 1082, 2131, 2331, 3106, 3131, 3132, 3135, 3221, 3231, 3232, 3331, 3332, 3333, 3334, 3337] },
  { id: "beam-box-girder-beams-girders", group: "Beam / box girder", element: "Beams / girders", scheduleNos: [201, 202], activityCodes: [1011, 1016, 1061, 1062, 1081, 1083, 2201, 3063, 3106, 3121, 3122, 3124, 3125, 3201, 3221, 3322] },
  { id: "beam-box-girder-diaphragm", group: "Beam / box girder", element: "Diaphragm", scheduleNos: [213, 214], activityCodes: [1016, 2201, 3106, 3121, 3125, 3126, 3201, 3221] },
  { id: "truss-chords-members", group: "Truss", element: "Chords / members", scheduleNos: [203], activityCodes: [1011, 1012, 2201, 3221, 3222, 3341, 3342, 3343] },
  { id: "truss-connections", group: "Truss", element: "Connections", scheduleNos: [203], activityCodes: [1011, 1012, 2201, 3201] },
  { id: "arch-arch-spandrel", group: "Arch", element: "Arch / spandrel", scheduleNos: [204, 205, 207], activityCodes: [1011, 1012, 1061, 1062, 1081, 3106, 3127, 3221, 3222] },
  { id: "arch-hangers-posts", group: "Arch", element: "Hangers / posts", scheduleNos: [206, 209], activityCodes: [1011, 1012, 1061, 1062, 2201, 3127, 3221, 3222] },
  { id: "suspension-cable-stayed-cables-and-accessories", group: "Suspension / cable-stayed", element: "Cables and accessories", scheduleNos: [208, 209], activityCodes: [2001, 3001] },
  { id: "suspension-cable-stayed-anchor-block", group: "Suspension / cable-stayed", element: "Anchor block", scheduleNos: [400, 406], activityCodes: [1061, 1062, 3106, 3111, 3114, 3115] },
  { id: "deck-structure-cross-beams-stringers", group: "Deck structure", element: "Cross beams / stringers", scheduleNos: [211, 212], activityCodes: [1011, 1081, 2201, 3106, 3121, 3201, 3221, 3321, 3323] },
  { id: "bracing-bracing-diaphragms", group: "Bracing", element: "Bracing / diaphragms", scheduleNos: [213, 214], activityCodes: [1011, 1061, 1062, 1081, 1083, 2201, 3065, 3121, 3124, 3126, 3201, 3221, 3224, 3322, 3345] },
  { id: "joint-deck-joints", group: "Joint", element: "Deck joints", scheduleNos: [100, 101, 102, 103, 104, 105, 106, 107, 108], activityCodes: [1031, 2051, 2052, 2053, 3026, 3051, 3052, 3053, 3054] },
  { id: "kerb-sidewalk-sidewalk-footway", group: "Kerb / sidewalk", element: "Sidewalk / footway", scheduleNos: [4], activityCodes: [1061, 1062, 3026, 3061, 3335] },
  { id: "kerb-sidewalk-kerb", group: "Kerb / sidewalk", element: "Kerb", scheduleNos: [3], activityCodes: [1061, 1062, 3026, 3061, 3221, 3335] },
  { id: "restraint-system-barrier-railing", group: "Restraint system", element: "Barrier / railing", scheduleNos: [2], activityCodes: [1061, 1062, 1081, 2071, 3071, 3073] },
  { id: "corrosion-protection-structural-steel", group: "Corrosion protection", element: "Structural steel", scheduleNos: [201, 202, 203, 404, 405], activityCodes: [1051, 1052, 3065] },
  { id: "approach-carriageway-transition", group: "Approach", element: "Carriageway transition", scheduleNos: [1, 501], activityCodes: [1042, 2011, 2012, 3005, 3026, 3027, 3061, 3066] },
  { id: "approach-drainage-system", group: "Approach", element: "Drainage system", scheduleNos: [505], activityCodes: [1015, 3068] },
  { id: "approach-approach-barrier", group: "Approach", element: "Approach barrier", scheduleNos: [2], activityCodes: [3072, 3074] },
  { id: "culvert-headwall", group: "Culvert", element: "Headwall", scheduleNos: [606], activityCodes: [3094, 3115, 3411] },
  { id: "culvert-wingwall", group: "Culvert", element: "Wingwall", scheduleNos: [605], activityCodes: [3094, 3115, 3411] },
  { id: "culvert-foundation", group: "Culvert", element: "Foundation", scheduleNos: [607, 610], activityCodes: [1071, 3023, 3031, 3032, 3034] },
  { id: "culvert-invert", group: "Culvert", element: "Invert", scheduleNos: [604], activityCodes: [3091, 3092, 3093, 3095] },
  { id: "culvert-barrel-vault", group: "Culvert", element: "Barrel / vault", scheduleNos: [600, 601, 602, 603], activityCodes: [3091, 3092, 3093, 3095, 3106, 3115, 3411] },
  { id: "culvert-abutment-culvert", group: "Culvert", element: "Abutment (culvert)", scheduleNos: [609], activityCodes: [3094, 3115, 3411] },
  { id: "retaining-wall-foundation", group: "Retaining wall", element: "Foundation", scheduleNos: [705], activityCodes: [3031, 3032, 3034, 3035] },
  { id: "retaining-wall-wall", group: "Retaining wall", element: "Wall", scheduleNos: [700, 701], activityCodes: [1018, 1061, 1062, 1071, 1081, 2312, 3022, 3023, 3081, 3082, 3084, 3115] },
  { id: "access-system-inspection-walkway-handrail", group: "Access system", element: "Inspection walkway / handrail", scheduleNos: [800, 803], activityCodes: [3064, 3221] },
  { id: "structure-global-activities", group: "Structure", element: "Global activities", scheduleNos: [], activityCodes: [1091, 2011, 2012, 2052, 3005, 3011, 3022, 3042, 3044, 3051, 3052, 3053, 3061, 3062, 3064, 3065, 3067, 3068, 3073, 3074, 3094, 3114, 3126, 3224, 3335, 3349] },
]

/** Activities available for an Appendix C schedule number. */
export function activitiesForSchedule(scheduleNo: number): MaintenanceActivity[] {
  const codes = new Set<number>()
  for (const set of ELEMENT_ACTIVITY_SETS) {
    if (set.scheduleNos.includes(scheduleNo)) {
      for (const c of set.activityCodes) codes.add(c)
    }
  }
  return [...codes]
    .map((c) => BY_CODE.get(c))
    .filter((a): a is MaintenanceActivity => !!a)
    .sort((a, b) => a.code - b.code)
}

/** Element activity sets that match a schedule number (for grouping UI). */
export function activitySetsForSchedule(scheduleNo: number): ElementActivitySet[] {
  return ELEMENT_ACTIVITY_SETS.filter((s) => s.scheduleNos.includes(scheduleNo))
}

export function activitiesForSet(set: ElementActivitySet): MaintenanceActivity[] {
  return set.activityCodes
    .map((c) => BY_CODE.get(c))
    .filter((a): a is MaintenanceActivity => !!a)
}

