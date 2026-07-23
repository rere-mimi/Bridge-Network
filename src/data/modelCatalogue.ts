/**
 * Model catalogue — source of truth for 3D / inventory modelling.
 *
 * Compiled from:
 * - Appendix B — Standard Component Schedule (TMR)
 * - Appendix C — Standard Component Identification (TMR structure families)
 * - inv-struc Ch.5 — Structure types, materials, general element types (MTQ)
 *
 * `structural3d` marks components that belong in the twin mesh.
 * Non-structural items (wearing surface, waterway, fill, grass, etc.) stay in
 * inventory but are excluded from the 3D model.
 */

export type MaterialCode = 'S' | 'P' | 'C' | 'T' | 'M' | 'O'

export type ComponentGroup = 'abutment' | 'pier' | 'span' | 'approach'

export type StructureKind =
  | 'bridge'
  | 'culvert'
  | 'retaining-wall'
  | 'sign-gantry'
  | 'tunnel'
  | 'other'

/** Materials available on a component (Appendix B columns). */
export type MaterialAvailability = Partial<Record<MaterialCode, boolean>>

export type CatalogueMaterial = {
  code: MaterialCode
  /** Appendix B label */
  label: string
  /** inv-struc §5.27 related codes when mapped */
  inventoryCodes?: number[]
}

export type CatalogueComponent = {
  /** Appendix B component number */
  no: number
  name: string
  code: string
  category: string
  significance: 1 | 2 | 3 | 4
  groups: ComponentGroup[]
  materials: MaterialAvailability
  /** Include in 3D twin geometry */
  structural3d: boolean
}

export type CatalogueStructureType = {
  id: string
  name: string
  kind: StructureKind
  /** Source: tmr-appendix-c | mtq-inv-struc */
  source: 'tmr-appendix-c' | 'mtq-inv-struc'
  /** MTQ type code when from inv-struc */
  code?: number
  /** Typical primary materials */
  materials: MaterialCode[]
  /** Appendix B components typically present */
  componentNos: number[]
}

export const MATERIALS: CatalogueMaterial[] = [
  { code: 'S', label: 'Steel', inventoryCodes: [5, 6, 13, 14, 15, 18] },
  { code: 'P', label: 'Precast / prestressed concrete', inventoryCodes: [2, 27] },
  { code: 'C', label: 'Cast-in-situ / reinforced concrete', inventoryCodes: [1, 2, 3, 4, 26] },
  { code: 'T', label: 'Timber', inventoryCodes: [7, 12, 14, 21, 29] },
  { code: 'M', label: 'Masonry', inventoryCodes: [9] },
  { code: 'O', label: 'Other (elastomer, asphalt, PVC, aluminium, …)', inventoryCodes: [8, 10, 11, 16, 17, 20, 99] },
]

/** inv-struc §5.27 — full material list (reference). */
export const INVENTORY_MATERIALS: Array<{ code: number; name: string }> = [
  { code: 1, name: 'Béton régulier' },
  { code: 2, name: 'Béton BHP' },
  { code: 3, name: 'Béton au latex' },
  { code: 4, name: 'Chape de béton' },
  { code: 5, name: 'Acier régulier' },
  { code: 6, name: 'Acier intempérique' },
  { code: 7, name: 'Bois' },
  { code: 8, name: 'Aluminium' },
  { code: 9, name: 'Maçonnerie' },
  { code: 10, name: 'Polyéthylène' },
  { code: 11, name: 'Enrobé' },
  { code: 12, name: 'Bois recouvert de béton' },
  { code: 13, name: 'Béton/Acier' },
  { code: 14, name: 'Bois/Acier' },
  { code: 15, name: 'Acier/Aluminium' },
  { code: 16, name: 'PVC' },
  { code: 17, name: 'Fonte' },
  { code: 18, name: "Tôle d'acier" },
  { code: 19, name: 'Sacs de sable-ciment' },
  { code: 20, name: 'Gabions' },
  { code: 21, name: 'Bois/Béton' },
  { code: 22, name: 'Béton ou acier ou bois' },
  { code: 23, name: 'Céramique' },
  { code: 24, name: 'Amiante' },
  { code: 25, name: 'Ciment-amiante' },
  { code: 26, name: 'Blocs de béton' },
  { code: 27, name: 'Béton précontraint' },
  { code: 28, name: 'Enrobé avec amiante' },
  { code: 29, name: 'Bois recouvert de lambris' },
  { code: 99, name: 'Autres' },
]

function mat(...codes: MaterialCode[]): MaterialAvailability {
  const out: MaterialAvailability = {}
  for (const c of codes) out[c] = true
  return out
}

/**
 * Appendix B — Standard Component Schedule.
 * `structural3d` follows load-bearing / primary structure intent.
 */
export const COMPONENTS: CatalogueComponent[] = [
  // Deck surface (1–9) — not structural mesh
  { no: 1, name: 'Fill/Wearing Surface on Deck', code: 'WS', category: 'Deck surface', significance: 2, groups: ['span'], materials: mat('C', 'O'), structural3d: false },
  { no: 2, name: 'Bridge Railing/Barriers', code: 'BR', category: 'Deck surface', significance: 1, groups: ['abutment', 'span'], materials: mat('S', 'P', 'C', 'T', 'O'), structural3d: false },
  { no: 3, name: 'Bridge Kerbs', code: 'K', category: 'Deck surface', significance: 1, groups: ['abutment', 'span'], materials: mat('S', 'P', 'C', 'T'), structural3d: false },
  { no: 4, name: 'Footways', code: 'FY', category: 'Deck surface', significance: 1, groups: ['span', 'approach'], materials: mat('S', 'P', 'C', 'T', 'O'), structural3d: false },

  // Deck joints (10–19)
  { no: 10, name: 'Pourable Joint Seal', code: 'J', category: 'Deck joints', significance: 2, groups: ['abutment', 'pier', 'span'], materials: mat('O'), structural3d: false },
  { no: 11, name: 'Compression Joint Seal', code: 'J', category: 'Deck joints', significance: 2, groups: ['abutment', 'pier', 'span'], materials: mat('O'), structural3d: false },
  { no: 12, name: 'Assembly Joint Seal', code: 'J', category: 'Deck joints', significance: 2, groups: ['abutment', 'pier'], materials: mat('O'), structural3d: false },
  { no: 13, name: 'Open Expansion Joint', code: 'J', category: 'Deck joints', significance: 2, groups: ['abutment', 'pier', 'span'], materials: mat('S', 'O'), structural3d: true },
  { no: 14, name: 'Sliding Joint', code: 'J', category: 'Deck joints', significance: 2, groups: ['abutment', 'pier', 'span'], materials: mat('S'), structural3d: true },
  { no: 15, name: 'Fixed/Small Movement Joints', code: 'J', category: 'Deck joints', significance: 2, groups: ['abutment', 'pier', 'span'], materials: mat('O'), structural3d: false },

  // Superstructure (20–39)
  { no: 20, name: 'Deck Slab', code: 'D', category: 'Superstructure', significance: 3, groups: ['span'], materials: mat('P', 'C', 'T'), structural3d: true },
  { no: 21, name: 'Closed Web/Box Girders', code: 'G', category: 'Superstructure', significance: 4, groups: ['span'], materials: mat('S', 'P', 'C'), structural3d: true },
  { no: 22, name: 'Open Girders', code: 'G', category: 'Superstructure', significance: 4, groups: ['span'], materials: mat('S', 'P', 'C', 'T'), structural3d: true },
  { no: 23, name: 'Through Truss', code: 'TT', category: 'Superstructure', significance: 4, groups: ['span'], materials: mat('S'), structural3d: true },
  { no: 24, name: 'Deck Truss', code: 'TT', category: 'Superstructure', significance: 4, groups: ['span'], materials: mat('S'), structural3d: true },
  { no: 25, name: 'Arches', code: 'ARH', category: 'Superstructure', significance: 4, groups: ['span'], materials: mat('S', 'P', 'C', 'O'), structural3d: true },
  { no: 26, name: 'Cables/Hangers', code: 'HR', category: 'Superstructure', significance: 4, groups: ['span'], materials: mat('S'), structural3d: true },
  { no: 27, name: 'Corbels', code: 'COR', category: 'Superstructure', significance: 3, groups: ['abutment', 'pier'], materials: mat('C', 'T'), structural3d: true },
  { no: 28, name: 'Cross Beams/Floor Beams', code: 'XB', category: 'Superstructure', significance: 3, groups: ['span'], materials: mat('S', 'T'), structural3d: true },
  { no: 29, name: 'Deck Planks', code: 'D', category: 'Superstructure', significance: 3, groups: ['span'], materials: mat('P', 'T'), structural3d: true },
  { no: 30, name: 'Steel Decking', code: 'D', category: 'Superstructure', significance: 3, groups: ['span'], materials: mat('S'), structural3d: true },
  { no: 31, name: 'Diaphragms/Bracing (Cross Girders)', code: 'XG', category: 'Superstructure', significance: 3, groups: ['span'], materials: mat('S', 'C'), structural3d: true },
  { no: 32, name: 'Load Bearing Diaphragms', code: 'XG', category: 'Superstructure', significance: 4, groups: ['span'], materials: mat('C'), structural3d: true },
  { no: 33, name: 'Spiking Plank', code: 'SP', category: 'Superstructure', significance: 1, groups: ['span'], materials: mat('T'), structural3d: false },

  // Bearings (40–49)
  { no: 40, name: 'Fixed Bearings', code: 'B', category: 'Bearings', significance: 2, groups: ['abutment', 'pier'], materials: mat('O'), structural3d: true },
  { no: 41, name: 'Sliding Bearings', code: 'B', category: 'Bearings', significance: 2, groups: ['abutment', 'pier'], materials: mat('O'), structural3d: true },
  { no: 42, name: 'Elastomeric/Pot Bearings', code: 'B', category: 'Bearings', significance: 2, groups: ['abutment', 'pier'], materials: mat('O'), structural3d: true },
  { no: 43, name: 'Rockers/Rollers', code: 'B', category: 'Bearings', significance: 2, groups: ['abutment', 'pier'], materials: mat('S'), structural3d: true },
  { no: 44, name: 'Mortar Pads/Bearing Pedestals', code: 'MP, PED', category: 'Bearings', significance: 1, groups: ['abutment', 'pier'], materials: mat('O'), structural3d: true },
  { no: 45, name: 'Restraint Angles/Blocks', code: 'RA', category: 'Bearings', significance: 2, groups: ['abutment', 'pier'], materials: mat('S', 'O'), structural3d: true },

  // Substructure (50–69)
  { no: 50, name: 'Abutment', code: 'A', category: 'Substructure', significance: 3, groups: ['abutment'], materials: mat('C', 'O'), structural3d: true },
  { no: 51, name: 'Wingwall/Retaining Wall', code: 'WW, RW', category: 'Substructure', significance: 3, groups: ['abutment', 'span', 'approach'], materials: mat('S', 'P', 'C', 'T', 'O'), structural3d: true },
  { no: 52, name: 'Abutment Sheeting/Infill Panels', code: 'ABS', category: 'Substructure', significance: 2, groups: ['abutment'], materials: mat('S', 'P', 'C', 'T', 'O'), structural3d: true },
  { no: 53, name: 'Batter Protection', code: 'PRO', category: 'Substructure', significance: 1, groups: ['abutment', 'approach'], materials: mat('P', 'C', 'O'), structural3d: false },
  { no: 54, name: 'Headstocks', code: 'H', category: 'Substructure', significance: 4, groups: ['abutment', 'pier'], materials: mat('S', 'P', 'C', 'T'), structural3d: true },
  { no: 55, name: 'Pier Headstocks (Integral)', code: 'H', category: 'Substructure', significance: 4, groups: ['pier'], materials: mat('C'), structural3d: true },
  { no: 56, name: 'Columns or Piles', code: 'C', category: 'Substructure', significance: 4, groups: ['abutment', 'pier'], materials: mat('S', 'P', 'C', 'T', 'O'), structural3d: true },
  { no: 57, name: 'Pile Bracing/Wales', code: 'WAL', category: 'Substructure', significance: 3, groups: ['abutment', 'pier'], materials: mat('S', 'C', 'T'), structural3d: true },
  { no: 58, name: 'Pier Walls', code: 'PW', category: 'Substructure', significance: 3, groups: ['pier'], materials: mat('C', 'O'), structural3d: true },
  { no: 59, name: 'Footing/Pile Cap/Sill Log', code: 'F, CAP, SL', category: 'Substructure', significance: 3, groups: ['abutment', 'pier'], materials: mat('C', 'T'), structural3d: true },
  { no: 60, name: 'Wing Piles', code: 'P', category: 'Substructure', significance: 3, groups: ['abutment'], materials: mat('S', 'P', 'C', 'T'), structural3d: true },

  // Miscellaneous (70–79) — exclude environment / approaches from 3D
  { no: 70, name: 'Bridge Approaches', code: 'AP', category: 'Miscellaneous', significance: 2, groups: ['approach'], materials: mat('O'), structural3d: false },
  { no: 71, name: 'Waterway', code: 'W', category: 'Miscellaneous', significance: 2, groups: ['span'], materials: mat('C', 'O'), structural3d: false },
  { no: 72, name: 'Approach Guardrail', code: 'GR', category: 'Miscellaneous', significance: 1, groups: ['approach'], materials: mat('S', 'P', 'C', 'T', 'O'), structural3d: false },
  { no: 73, name: 'ID Number Display', code: 'ID', category: 'Miscellaneous', significance: 1, groups: ['abutment', 'pier'], materials: mat('S', 'O'), structural3d: false },
  { no: 74, name: 'External Strengthening/Post Tensioning', code: 'EPT', category: 'Miscellaneous', significance: 4, groups: ['abutment', 'pier', 'span'], materials: mat('S', 'O'), structural3d: true },

  // Culverts (80–89)
  { no: 80, name: 'Pipe Culverts', code: 'PC', category: 'Culverts', significance: 4, groups: ['span'], materials: mat('S', 'P', 'O'), structural3d: true },
  { no: 81, name: 'Box Culverts', code: 'BC', category: 'Culverts', significance: 4, groups: ['span'], materials: mat('P', 'C'), structural3d: true },
  { no: 82, name: 'Modular Culverts', code: 'MC', category: 'Culverts', significance: 4, groups: ['span'], materials: mat('P'), structural3d: true },
  { no: 83, name: 'Arch Culverts', code: 'AC', category: 'Culverts', significance: 4, groups: ['span'], materials: mat('S', 'P', 'C', 'O'), structural3d: true },
  { no: 84, name: 'Headwalls/Wingwalls', code: 'HW', category: 'Culverts', significance: 1, groups: ['abutment', 'span'], materials: mat('P', 'C', 'O'), structural3d: true },
  { no: 85, name: 'Culvert Base Slab/Pipe Invert', code: 'CBS', category: 'Culverts', significance: 3, groups: ['span'], materials: mat('C', 'O'), structural3d: true },

  // LTMS (91–99)
  { no: 91, name: 'Footings', code: 'F', category: 'LTMS', significance: 3, groups: ['pier'], materials: mat('C'), structural3d: true },
  { no: 92, name: 'Base Plates, Fittings & Hold Down Bolts', code: 'BP', category: 'LTMS', significance: 3, groups: ['pier'], materials: mat('S'), structural3d: true },
  { no: 93, name: 'Columns', code: 'C', category: 'LTMS', significance: 4, groups: ['pier'], materials: mat('S'), structural3d: true },
  { no: 94, name: 'Truss Columns', code: 'C', category: 'LTMS', significance: 4, groups: ['pier'], materials: mat('S'), structural3d: true },
  { no: 95, name: 'Cantilever Arms Or Gantry Beams', code: 'CAN, GB', category: 'LTMS', significance: 4, groups: ['span'], materials: mat('S'), structural3d: true },
  { no: 96, name: 'Gantry Truss', code: 'GT', category: 'LTMS', significance: 4, groups: ['span'], materials: mat('S'), structural3d: true },
  { no: 97, name: 'Sign Face Support Structure', code: 'SF', category: 'LTMS', significance: 3, groups: ['span'], materials: mat('S'), structural3d: true },
  { no: 98, name: 'Ancillaries (walkways, cable trays, ladders)', code: 'ANC', category: 'LTMS', significance: 2, groups: ['span'], materials: mat('S'), structural3d: false },
  { no: 99, name: 'LTMS Mounted Devices', code: 'LMD', category: 'LTMS', significance: 2, groups: ['span'], materials: mat('O'), structural3d: false },

  // Retaining walls (100–103)
  { no: 100, name: 'Wall Facing/Panels', code: 'WFP', category: 'Retaining walls', significance: 4, groups: ['abutment'], materials: mat('S', 'P', 'C', 'T', 'O'), structural3d: true },
  { no: 101, name: 'Column supports', code: 'CS', category: 'Retaining walls', significance: 4, groups: ['abutment'], materials: mat('S', 'P', 'C', 'T', 'O'), structural3d: true },
  { no: 102, name: 'Foundation', code: 'F', category: 'Retaining walls', significance: 3, groups: ['abutment'], materials: mat('P', 'C'), structural3d: true },
  { no: 103, name: 'Connections', code: 'CON', category: 'Retaining walls', significance: 3, groups: ['abutment'], materials: mat('S'), structural3d: true },
]

/**
 * Appendix C — Standard Element Schedule (app numbering) → structural3d.
 * Non-structural: wearing surface, barriers, kerbs, footways, waterway,
 * embankment/fill, scour protection, drainage, services, signage, lighting.
 */
export const APP_SCHEDULE_STRUCTURAL_3D: Record<number, boolean> = {
  // Carriageway level
  1: false, // wearing surface
  2: false, // barrier/railings
  3: false, // kerbs
  4: false, // footway
  5: false, // signage
  6: false, // lighting
  // Deck joints — open metal joints yes; sealed plugs no
  100: true,
  101: true,
  102: true,
  103: false,
  104: false,
  105: false,
  106: false,
  107: false,
  108: false,
  // Superstructure
  200: true,
  201: true,
  202: true,
  203: true,
  204: true,
  205: true,
  206: true,
  207: true,
  208: true,
  209: true,
  210: true,
  211: true,
  212: true,
  213: true,
  214: true,
  215: false, // spiking strip
  216: true,
  217: true,
  230: false, // drainage
  // Bearings
  300: true,
  301: true,
  302: true,
  303: true,
  304: true,
  305: true,
  306: true,
  307: true,
  308: true,
  309: true,
  // Substructure
  400: true,
  401: true,
  402: true,
  403: true,
  404: true,
  405: true,
  406: true,
  407: true,
  408: true,
  // Miscellaneous / site — excluded from 3D
  500: false, // waterway
  501: false, // batter/embankment
  502: false, // slope/scour
  503: false, // feature crossed
  504: false, // services
  505: false, // open drainage
  // Culvert
  600: true,
  601: true,
  602: true,
  603: true,
  604: true,
  605: true,
  606: true,
  607: true,
  608: false, // waterdrive (unlined)
  609: true,
  610: true,
  // Tunnel
  650: true,
  651: true,
  // Retaining / noise wall
  700: true,
  701: true,
  702: true,
  703: true,
  704: false, // wall drainage
  705: true,
  // LTMS / gantries
  800: true,
  801: true,
  802: true,
  803: true,
  804: true,
  805: true,
  806: true,
  // Rockfall / slope control
  900: true,
  901: true,
  902: true,
  903: false, // drainage
  904: false, // slope face
  905: false, // slope covering
  906: false, // erosion control
}

export function isStructural3dSchedule(scheduleNo: number): boolean {
  if (scheduleNo in APP_SCHEDULE_STRUCTURAL_3D) {
    return APP_SCHEDULE_STRUCTURAL_3D[scheduleNo]
  }
  const comp = COMPONENTS.find((c) => c.no === scheduleNo)
  return comp?.structural3d ?? scheduleNo >= 200
}

/**
 * Structure types used to base 3D families.
 * Combines Appendix C typical figures + inv-struc span types.
 */
export const STRUCTURE_TYPES: CatalogueStructureType[] = [
  // Appendix C figures
  { id: 'psc-deck-unit', name: 'PSC deck unit bridge', kind: 'bridge', source: 'tmr-appendix-c', materials: ['P', 'C'], componentNos: [1, 2, 20, 22, 40, 42, 50, 54, 56] },
  { id: 'psc-girder', name: 'PSC girder bridge', kind: 'bridge', source: 'tmr-appendix-c', materials: ['P', 'C'], componentNos: [1, 2, 20, 22, 31, 42, 50, 54, 56] },
  { id: 'steel-girder', name: 'Steel girder bridge', kind: 'bridge', source: 'tmr-appendix-c', materials: ['S', 'C'], componentNos: [1, 2, 20, 22, 31, 40, 50, 54, 56] },
  { id: 'timber-bridge', name: 'Timber bridge', kind: 'bridge', source: 'tmr-appendix-c', materials: ['T'], componentNos: [2, 29, 22, 33, 50, 56, 59] },
  { id: 'box-girder', name: 'Closed web / box girder bridge', kind: 'bridge', source: 'tmr-appendix-c', materials: ['S', 'P', 'C'], componentNos: [1, 20, 21, 42, 50, 54, 56] },
  { id: 'truss-bridge', name: 'Truss bridge', kind: 'bridge', source: 'tmr-appendix-c', materials: ['S'], componentNos: [20, 23, 24, 28, 31, 50, 56] },
  { id: 'arch-bridge', name: 'Arch bridge', kind: 'bridge', source: 'tmr-appendix-c', materials: ['S', 'P', 'C', 'M'], componentNos: [20, 25, 50, 56, 59] },
  { id: 'cable-stayed', name: 'Cable / hanger bridge', kind: 'bridge', source: 'tmr-appendix-c', materials: ['S', 'C'], componentNos: [20, 26, 50, 56] },
  { id: 'concrete-culvert', name: 'Concrete culvert (box / pipe / arch)', kind: 'culvert', source: 'tmr-appendix-c', materials: ['P', 'C'], componentNos: [80, 81, 82, 83, 84, 85] },
  { id: 'steel-culvert', name: 'Steel culvert (pipe / arch)', kind: 'culvert', source: 'tmr-appendix-c', materials: ['S'], componentNos: [80, 83, 84, 85] },
  { id: 'ltms', name: 'LTMS / sign gantry', kind: 'sign-gantry', source: 'tmr-appendix-c', materials: ['S', 'C'], componentNos: [91, 92, 93, 94, 95, 96, 97] },
  { id: 'retaining-wall', name: 'Retaining wall', kind: 'retaining-wall', source: 'tmr-appendix-c', materials: ['S', 'P', 'C', 'T', 'O'], componentNos: [100, 101, 102, 103] },
  { id: 'tunnel', name: 'Tunnel', kind: 'tunnel', source: 'tmr-appendix-c', materials: ['C', 'S'], componentNos: [50, 56, 58, 59] },
  { id: 'pedestrian', name: 'Pedestrian bridge', kind: 'bridge', source: 'tmr-appendix-c', materials: ['S', 'C', 'T'], componentNos: [2, 4, 20, 22, 50, 56] },

  // inv-struc culverts 11–21
  { id: 'mtq-11', name: 'Ponceau à dalle en béton armé', kind: 'culvert', source: 'mtq-inv-struc', code: 11, materials: ['C'], componentNos: [81, 84, 85] },
  { id: 'mtq-12', name: 'Ponceau portique en béton armé', kind: 'culvert', source: 'mtq-inv-struc', code: 12, materials: ['C'], componentNos: [81, 84] },
  { id: 'mtq-13', name: 'Ponceau rectangulaire en béton armé', kind: 'culvert', source: 'mtq-inv-struc', code: 13, materials: ['C'], componentNos: [81, 84, 85] },
  { id: 'mtq-14', name: 'Ponceau circulaire en béton armé', kind: 'culvert', source: 'mtq-inv-struc', code: 14, materials: ['C'], componentNos: [80, 84] },
  { id: 'mtq-15', name: 'Ponceau circulaire en acier', kind: 'culvert', source: 'mtq-inv-struc', code: 15, materials: ['S'], componentNos: [80, 84] },
  { id: 'mtq-16', name: 'Ponceau circulaire polyéthylène', kind: 'culvert', source: 'mtq-inv-struc', code: 16, materials: ['O'], componentNos: [80, 84] },
  { id: 'mtq-17', name: 'Ponceau elliptique en acier', kind: 'culvert', source: 'mtq-inv-struc', code: 17, materials: ['S'], componentNos: [80, 84] },
  { id: 'mtq-18', name: 'Ponceau arqué en acier', kind: 'culvert', source: 'mtq-inv-struc', code: 18, materials: ['S'], componentNos: [83, 84] },
  { id: 'mtq-19', name: 'Ponceau voûté en béton armé', kind: 'culvert', source: 'mtq-inv-struc', code: 19, materials: ['C'], componentNos: [83, 84, 85] },
  { id: 'mtq-20', name: 'Ponceau voûté en acier', kind: 'culvert', source: 'mtq-inv-struc', code: 20, materials: ['S'], componentNos: [83, 84] },
  { id: 'mtq-21', name: 'Ponceau rectangulaire en bois', kind: 'culvert', source: 'mtq-inv-struc', code: 21, materials: ['T'], componentNos: [81, 84] },

  // inv-struc bridges 31–51
  { id: 'mtq-31', name: 'Pont à dalle pleine en béton armé', kind: 'bridge', source: 'mtq-inv-struc', code: 31, materials: ['C'], componentNos: [20, 50, 54, 56] },
  { id: 'mtq-32', name: 'Pont à dalle pleine en béton précontraint', kind: 'bridge', source: 'mtq-inv-struc', code: 32, materials: ['P'], componentNos: [20, 50, 54, 56] },
  { id: 'mtq-33', name: 'Pont à dalle évidée en béton armé', kind: 'bridge', source: 'mtq-inv-struc', code: 33, materials: ['C'], componentNos: [20, 50, 56] },
  { id: 'mtq-34', name: 'Pont à dalle évidée en béton précontraint', kind: 'bridge', source: 'mtq-inv-struc', code: 34, materials: ['P'], componentNos: [20, 50, 56] },
  { id: 'mtq-35', name: 'Portique en béton armé', kind: 'bridge', source: 'mtq-inv-struc', code: 35, materials: ['C'], componentNos: [20, 50, 56, 58] },
  { id: 'mtq-36', name: 'Portique béton armé sans remblai', kind: 'bridge', source: 'mtq-inv-struc', code: 36, materials: ['C'], componentNos: [20, 50, 56] },
  { id: 'mtq-37', name: 'Portique en béton précontraint', kind: 'bridge', source: 'mtq-inv-struc', code: 37, materials: ['P'], componentNos: [20, 50, 56] },
  { id: 'mtq-38', name: 'Pont à béquilles, béton armé', kind: 'bridge', source: 'mtq-inv-struc', code: 38, materials: ['C'], componentNos: [20, 50, 56] },
  { id: 'mtq-39', name: 'Pont à béquilles, béton précontraint', kind: 'bridge', source: 'mtq-inv-struc', code: 39, materials: ['P'], componentNos: [20, 50, 56] },
  { id: 'mtq-41', name: 'Pont à poutres en béton armé', kind: 'bridge', source: 'mtq-inv-struc', code: 41, materials: ['C'], componentNos: [20, 22, 50, 54, 56] },
  { id: 'mtq-42', name: 'Pont à poutres béton précontraint préfabriqué', kind: 'bridge', source: 'mtq-inv-struc', code: 42, materials: ['P'], componentNos: [20, 22, 50, 54, 56] },
  { id: 'mtq-43', name: 'Pont à poutres béton précontraint coulé en place', kind: 'bridge', source: 'mtq-inv-struc', code: 43, materials: ['P', 'C'], componentNos: [20, 22, 50, 54, 56] },
  { id: 'mtq-44', name: 'Pont à poutres en acier', kind: 'bridge', source: 'mtq-inv-struc', code: 44, materials: ['S', 'C'], componentNos: [20, 22, 31, 50, 54, 56] },
  { id: 'mtq-45', name: 'Pont acier-bois', kind: 'bridge', source: 'mtq-inv-struc', code: 45, materials: ['S', 'T'], componentNos: [22, 29, 50, 56] },
  { id: 'mtq-46', name: 'Pont à poutres en bois', kind: 'bridge', source: 'mtq-inv-struc', code: 46, materials: ['T'], componentNos: [22, 29, 50, 56] },
  { id: 'mtq-47', name: 'Portique en béton', kind: 'bridge', source: 'mtq-inv-struc', code: 47, materials: ['C'], componentNos: [20, 50, 56] },
  { id: 'mtq-48', name: 'Portique béton armé sans remblais', kind: 'bridge', source: 'mtq-inv-struc', code: 48, materials: ['C'], componentNos: [20, 50, 56] },
  { id: 'mtq-49', name: 'Portique en acier', kind: 'bridge', source: 'mtq-inv-struc', code: 49, materials: ['S'], componentNos: [20, 50, 56] },
  { id: 'mtq-50', name: 'Pont à béquilles en béton', kind: 'bridge', source: 'mtq-inv-struc', code: 50, materials: ['C'], componentNos: [20, 50, 56] },
  { id: 'mtq-51', name: 'Pont à béquilles en acier', kind: 'bridge', source: 'mtq-inv-struc', code: 51, materials: ['S'], componentNos: [20, 50, 56] },
  { id: 'mtq-52', name: 'Pont à poutres en acier enrobées de béton', kind: 'bridge', source: 'mtq-inv-struc', code: 52, materials: ['S', 'C'], componentNos: [20, 22, 50, 54, 56] },
  { id: 'mtq-56', name: 'Pont à poutres-caissons en béton armé', kind: 'bridge', source: 'mtq-inv-struc', code: 56, materials: ['C'], componentNos: [20, 21, 50, 54, 56] },
  { id: 'mtq-57', name: 'Pont à poutres-caissons en béton précontraint', kind: 'bridge', source: 'mtq-inv-struc', code: 57, materials: ['P'], componentNos: [20, 21, 50, 54, 56] },
  { id: 'mtq-58', name: 'Pont à poutres-caissons en acier', kind: 'bridge', source: 'mtq-inv-struc', code: 58, materials: ['S'], componentNos: [20, 21, 50, 54, 56] },

  // Truss / arch / cable (61–82)
  { id: 'mtq-61', name: 'Pont à tablier inférieur en acier (truss)', kind: 'bridge', source: 'mtq-inv-struc', code: 61, materials: ['S'], componentNos: [20, 23, 28, 50, 56] },
  { id: 'mtq-62', name: 'Pont à tablier intermédiaire en acier', kind: 'bridge', source: 'mtq-inv-struc', code: 62, materials: ['S'], componentNos: [20, 23, 50, 56] },
  { id: 'mtq-63', name: 'Pont Pony-Warren en acier', kind: 'bridge', source: 'mtq-inv-struc', code: 63, materials: ['S'], componentNos: [20, 23, 50, 56] },
  { id: 'mtq-64', name: 'Pont Bailey en acier', kind: 'bridge', source: 'mtq-inv-struc', code: 64, materials: ['S'], componentNos: [20, 23, 50, 56] },
  { id: 'mtq-65', name: 'Pont à tablier supérieur en acier (truss)', kind: 'bridge', source: 'mtq-inv-struc', code: 65, materials: ['S'], componentNos: [20, 24, 50, 56] },
  { id: 'mtq-66', name: 'Pont en bois (truss)', kind: 'bridge', source: 'mtq-inv-struc', code: 66, materials: ['T'], componentNos: [23, 29, 50, 56] },
  { id: 'mtq-67', name: 'Pont couvert', kind: 'bridge', source: 'mtq-inv-struc', code: 67, materials: ['T'], componentNos: [23, 29, 50, 56] },
  { id: 'mtq-71', name: 'Pont à tablier inférieur, béton armé', kind: 'bridge', source: 'mtq-inv-struc', code: 71, materials: ['C'], componentNos: [20, 23, 50, 56] },
  { id: 'mtq-72', name: 'Pont à tablier inférieur, acier (arc)', kind: 'bridge', source: 'mtq-inv-struc', code: 72, materials: ['S'], componentNos: [20, 25, 50, 56] },
  { id: 'mtq-73', name: 'Pont à tablier intermédiaire, béton armé', kind: 'bridge', source: 'mtq-inv-struc', code: 73, materials: ['C'], componentNos: [20, 25, 50, 56] },
  { id: 'mtq-74', name: 'Pont à tablier intermédiaire, acier', kind: 'bridge', source: 'mtq-inv-struc', code: 74, materials: ['S'], componentNos: [20, 25, 50, 56] },
  { id: 'mtq-75', name: 'Pont à tablier supérieur, béton armé', kind: 'bridge', source: 'mtq-inv-struc', code: 75, materials: ['C'], componentNos: [20, 25, 50, 56] },
  { id: 'mtq-76', name: 'Pont à tablier supérieur, acier', kind: 'bridge', source: 'mtq-inv-struc', code: 76, materials: ['S'], componentNos: [20, 25, 50, 56] },
  { id: 'mtq-77', name: 'Pont à tablier supérieur, bois', kind: 'bridge', source: 'mtq-inv-struc', code: 77, materials: ['T'], componentNos: [20, 25, 50, 56] },
  { id: 'mtq-81', name: 'Pont suspendu', kind: 'bridge', source: 'mtq-inv-struc', code: 81, materials: ['S', 'C'], componentNos: [20, 26, 50, 56] },
  { id: 'mtq-82', name: 'Pont à haubans', kind: 'bridge', source: 'mtq-inv-struc', code: 82, materials: ['S', 'C'], componentNos: [20, 26, 50, 56] },
  { id: 'mtq-85', name: 'Pont mobile', kind: 'bridge', source: 'mtq-inv-struc', code: 85, materials: ['S', 'C'], componentNos: [20, 50, 56] },
  { id: 'mtq-94', name: 'Tunnel / structure complexe (type 94)', kind: 'tunnel', source: 'mtq-inv-struc', code: 94, materials: ['C', 'S'], componentNos: [50, 56, 58, 59] },
  { id: 'mtq-97', name: 'Mur (type 97)', kind: 'retaining-wall', source: 'mtq-inv-struc', code: 97, materials: ['C', 'S', 'O'], componentNos: [100, 101, 102, 103] },
]

/**
 * Appendix C Standard Element Schedule — elements used by the app inventory.
 * Each element instance in a model = schedule no + material + group.
 */
export type CatalogueElement = {
  no: number
  name: string
  category: string
  structural3d: boolean
}

export const ELEMENTS: CatalogueElement[] = [
  { no: 1, name: 'Wearing surface', category: 'Carriageway level', structural3d: false },
  { no: 2, name: 'Barrier/railings', category: 'Carriageway level', structural3d: false },
  { no: 3, name: 'Kerbs', category: 'Carriageway level', structural3d: false },
  { no: 4, name: 'Footway', category: 'Carriageway level', structural3d: false },
  { no: 5, name: 'Signage', category: 'Carriageway level', structural3d: false },
  { no: 6, name: 'Lighting', category: 'Carriageway level', structural3d: false },
  { no: 100, name: 'Open joint - butt', category: 'Deck joints', structural3d: true },
  { no: 101, name: 'Open joint - sliding plate', category: 'Deck joints', structural3d: true },
  { no: 102, name: 'Open joint - cantilever/finger', category: 'Deck joints', structural3d: true },
  { no: 103, name: 'Closed joint - filled butt', category: 'Deck joints', structural3d: false },
  { no: 104, name: 'Closed joint - asphaltic plug', category: 'Deck joints', structural3d: false },
  { no: 105, name: 'Closed joint - compression seal', category: 'Deck joints', structural3d: false },
  { no: 106, name: 'Closed joint - strip seal', category: 'Deck joints', structural3d: false },
  { no: 107, name: 'Closed joint - modular', category: 'Deck joints', structural3d: false },
  { no: 108, name: 'Closed joint - reinforced elastomer', category: 'Deck joints', structural3d: false },
  { no: 200, name: 'Deck', category: 'Superstructure', structural3d: true },
  { no: 201, name: 'Open beam', category: 'Superstructure', structural3d: true },
  { no: 202, name: 'Closed web/box girder', category: 'Superstructure', structural3d: true },
  { no: 203, name: 'Truss', category: 'Superstructure', structural3d: true },
  { no: 204, name: 'Open spandrel arch', category: 'Superstructure', structural3d: true },
  { no: 205, name: 'Closed spandrel arch', category: 'Superstructure', structural3d: true },
  { no: 206, name: 'Spandrel column', category: 'Superstructure', structural3d: true },
  { no: 207, name: 'Spandrel wall', category: 'Superstructure', structural3d: true },
  { no: 208, name: 'Cable', category: 'Superstructure', structural3d: true },
  { no: 209, name: 'Hanger', category: 'Superstructure', structural3d: true },
  { no: 210, name: 'Half-joint', category: 'Superstructure', structural3d: true },
  { no: 211, name: 'Transom', category: 'Superstructure', structural3d: true },
  { no: 212, name: 'Stringer', category: 'Superstructure', structural3d: true },
  { no: 213, name: 'Diaphragm/bracing', category: 'Superstructure', structural3d: true },
  { no: 214, name: 'Load bearing diaphragm', category: 'Superstructure', structural3d: true },
  { no: 215, name: 'Spiking Strip', category: 'Superstructure', structural3d: false },
  { no: 216, name: 'External strengthening', category: 'Superstructure', structural3d: true },
  { no: 217, name: 'Jacket system', category: 'Superstructure', structural3d: true },
  { no: 230, name: 'Superstructure drainage', category: 'Superstructure', structural3d: false },
  { no: 300, name: 'Fixed bearing', category: 'Bearings', structural3d: true },
  { no: 301, name: 'Movable', category: 'Bearings', structural3d: true },
  { no: 302, name: 'Elastomeric pad/strip bearing', category: 'Bearings', structural3d: true },
  { no: 303, name: 'Spherical bearing', category: 'Bearings', structural3d: true },
  { no: 304, name: 'Pot bearing', category: 'Bearings', structural3d: true },
  { no: 305, name: 'Enclosed bearing', category: 'Bearings', structural3d: true },
  { no: 306, name: 'Mortar pad /bearing pedestal', category: 'Bearings', structural3d: true },
  { no: 307, name: 'Restraint angle/thrust block', category: 'Bearings', structural3d: true },
  { no: 308, name: 'Seismic restraint', category: 'Bearings', structural3d: true },
  { no: 309, name: 'Corbel', category: 'Bearings', structural3d: true },
  { no: 400, name: 'Abutment', category: 'Substructure', structural3d: true },
  { no: 401, name: 'Wingwall', category: 'Substructure', structural3d: true },
  { no: 402, name: 'Pier cap', category: 'Substructure', structural3d: true },
  { no: 403, name: 'Pier wall', category: 'Substructure', structural3d: true },
  { no: 404, name: 'Column', category: 'Substructure', structural3d: true },
  { no: 405, name: 'Column (trestle)', category: 'Substructure', structural3d: true },
  { no: 406, name: 'Pile cap/Footing', category: 'Substructure', structural3d: true },
  { no: 407, name: 'Piles', category: 'Substructure', structural3d: true },
  { no: 408, name: 'Jacket system', category: 'Substructure', structural3d: true },
  { no: 500, name: 'Waterway', category: 'Miscellaneous', structural3d: false },
  { no: 501, name: 'Batter/embankment', category: 'Miscellaneous', structural3d: false },
  { no: 502, name: 'Slope/scour Protection', category: 'Miscellaneous', structural3d: false },
  { no: 503, name: 'Feature crossed', category: 'Miscellaneous', structural3d: false },
  { no: 504, name: 'Services', category: 'Miscellaneous', structural3d: false },
  { no: 505, name: 'Open drainage', category: 'Miscellaneous', structural3d: false },
  { no: 600, name: 'Box culvert', category: 'Culvert', structural3d: true },
  { no: 601, name: 'Pipe culvert', category: 'Culvert', structural3d: true },
  { no: 602, name: 'Pipe-arch culvert', category: 'Culvert', structural3d: true },
  { no: 603, name: 'Arch culvert', category: 'Culvert', structural3d: true },
  { no: 604, name: 'Invert protection', category: 'Culvert', structural3d: true },
  { no: 605, name: 'Wingwall', category: 'Culvert', structural3d: true },
  { no: 606, name: 'Headwall', category: 'Culvert', structural3d: true },
  { no: 607, name: 'Footing', category: 'Culvert', structural3d: true },
  { no: 608, name: 'Waterdrive', category: 'Culvert', structural3d: false },
  { no: 609, name: 'Abutment (Culvert)', category: 'Culvert', structural3d: true },
  { no: 610, name: 'Piles (Culvert)', category: 'Culvert', structural3d: true },
  { no: 650, name: 'Tunnel lining', category: 'Tunnel', structural3d: true },
  { no: 651, name: 'Tunnel ceiling panels/roofing', category: 'Tunnel', structural3d: true },
  { no: 700, name: 'Wall facing/panels', category: 'Retaining wall/noise wall', structural3d: true },
  { no: 701, name: 'Pile/column', category: 'Retaining wall/noise wall', structural3d: true },
  { no: 702, name: 'Anchors', category: 'Retaining wall/noise wall', structural3d: true },
  { no: 703, name: 'Horizontal restraint', category: 'Retaining wall/noise wall', structural3d: true },
  { no: 704, name: 'Drainage system (Wall)', category: 'Retaining wall/noise wall', structural3d: false },
  { no: 705, name: 'Pile cap/Footing', category: 'Retaining wall/noise wall', structural3d: true },
  { no: 800, name: 'Base plates', category: 'Large traffic signs/gantries', structural3d: true },
  { no: 801, name: 'Columns', category: 'Large traffic signs/gantries', structural3d: true },
  { no: 802, name: 'Columns (trestle)', category: 'Large traffic signs/gantries', structural3d: true },
  { no: 803, name: 'Cantilever arms/Gantry beams', category: 'Large traffic signs/gantries', structural3d: true },
  { no: 804, name: 'Gantry truss', category: 'Large traffic signs/gantries', structural3d: true },
  { no: 805, name: 'Sign face support', category: 'Large traffic signs/gantries', structural3d: true },
  { no: 806, name: 'Footing', category: 'Large traffic signs/gantries', structural3d: true },
  { no: 900, name: 'Posts (incl. restraining cables)', category: 'Rockfall/slope debris control', structural3d: true },
  { no: 901, name: 'Mesh (incl. lateral cables)', category: 'Rockfall/slope debris control', structural3d: true },
  { no: 902, name: 'Anchors', category: 'Rockfall/slope debris control', structural3d: true },
  { no: 903, name: 'Drainage system (Geo)', category: 'Rockfall/slope debris control', structural3d: false },
  { no: 904, name: 'Slope face', category: 'Rockfall/slope debris control', structural3d: false },
  { no: 905, name: 'Slope covering', category: 'Rockfall/slope debris control', structural3d: false },
  { no: 906, name: 'Erosion control', category: 'Rockfall/slope debris control', structural3d: false },
]

export const ELEMENT_CATEGORIES = [...new Set(ELEMENTS.map((e) => e.category))]

export function structuralElements(): CatalogueElement[] {
  return ELEMENTS.filter((e) => e.structural3d)
}

export function elementsByCategory(): Record<string, CatalogueElement[]> {
  const out: Record<string, CatalogueElement[]> = {}
  for (const e of ELEMENTS) {
    ;(out[e.category] ??= []).push(e)
  }
  return out
}

export const COMPONENT_CATEGORIES = [
  ...new Set(COMPONENTS.map((c) => c.category)),
]

export function structuralComponents(): CatalogueComponent[] {
  return COMPONENTS.filter((c) => c.structural3d)
}

export function componentsByCategory(): Record<string, CatalogueComponent[]> {
  const out: Record<string, CatalogueComponent[]> = {}
  for (const c of COMPONENTS) {
    ;(out[c.category] ??= []).push(c)
  }
  return out
}

export function catalogueSummary() {
  return {
    structureTypes: STRUCTURE_TYPES.length,
    components: COMPONENTS.length,
    structural3dComponents: structuralComponents().length,
    elements: ELEMENTS.length,
    structural3dElements: structuralElements().length,
    materials: MATERIALS.length,
    inventoryMaterials: INVENTORY_MATERIALS.length,
    categories: COMPONENT_CATEGORIES.length,
    elementCategories: ELEMENT_CATEGORIES.length,
  }
}
