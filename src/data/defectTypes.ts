/**
 * Appendix E — Defect Types, organised by element material.
 * Structures Inspection Manual (TMR)
 *
 * Material codes (Appendix F):
 *   C = Reinforced concrete
 *   P = Prestressed concrete
 *   S = Steel
 *   T = Timber
 *   M = Masonry
 *   O = Other / mixed
 *
 * Condition-state scoring from severity × extent will be plugged in later.
 */

export type DefectGeometry = 'point' | 'line' | 'area'
export type DrawnDefectKind = 'crack' | 'spall' | 'patch'
export type MaterialCode = 'S' | 'P' | 'C' | 'T' | 'M' | 'O'
export type DefectFace = 'top' | 'front' | 'side' | 'end'

export type DefectType = {
  code: string
  name: string
  geometry: DefectGeometry
  /** Primary materials this defect applies to */
  materials: MaterialCode[]
}

export const DEFECT_TYPES: DefectType[] = [
  // Steel / metal
  { code: '1000', name: 'Corrosion (General)', geometry: 'area', materials: ['S', 'O'] },
  { code: '1010', name: 'Corrosion (corrugated metal)', geometry: 'area', materials: ['S'] },
  { code: '1020', name: 'Fatigue crack (steel/other)', geometry: 'line', materials: ['S', 'O'] },
  { code: '1030', name: 'Connection (General)', geometry: 'point', materials: ['S', 'O'] },
  { code: '1040', name: 'Connection (Timber Planks)', geometry: 'point', materials: ['T'] },
  { code: '1050', name: 'Connection (Barriers)', geometry: 'point', materials: ['S', 'C', 'O'] },
  { code: '1060', name: 'Connection (Cable/hanger)', geometry: 'point', materials: ['S'] },
  { code: '1070', name: 'Connection (Bearing)', geometry: 'point', materials: ['S', 'O'] },

  // Concrete / masonry / reinforcement
  { code: '1100', name: 'Delamination/spall (Concrete/Masonry)', geometry: 'area', materials: ['C', 'P', 'M'] },
  { code: '1110', name: 'Delamination/spall (Unlined drive/tunnel)', geometry: 'area', materials: ['C', 'O'] },
  { code: '1120', name: 'Exposed rebar / visible reinforcement', geometry: 'point', materials: ['C', 'P'] },
  { code: '1130', name: 'Exposed prestressing', geometry: 'point', materials: ['P'] },
  { code: '1140', name: 'Cracking (Prestressed Concrete)', geometry: 'line', materials: ['P'] },
  { code: '1150', name: 'Cracking (Reinforced concrete)', geometry: 'line', materials: ['C'] },
  { code: '1160', name: 'Efflorescence/rust staining', geometry: 'area', materials: ['C', 'P', 'M'] },
  { code: '1170', name: 'Abrasion/wear (Concrete)', geometry: 'area', materials: ['C', 'P'] },
  { code: '1180', name: 'Abrasion/wear (Mattress/Basket)', geometry: 'area', materials: ['O'] },

  // Timber
  { code: '1200', name: 'Decay/Section loss (timber)', geometry: 'area', materials: ['T'] },
  { code: '1210', name: 'Check/shake (timber)', geometry: 'line', materials: ['T'] },
  { code: '1220', name: 'Crack (timber)', geometry: 'line', materials: ['T'] },
  { code: '1230', name: 'Split/delamination (timber)', geometry: 'line', materials: ['T'] },
  { code: '1240', name: 'Abrasion/wear (timber)', geometry: 'area', materials: ['T'] },

  // Masonry
  { code: '1300', name: 'Mortar breakdown (Masonry)', geometry: 'area', materials: ['M'] },
  { code: '1310', name: 'Split/spall/displacement (masonry)', geometry: 'line', materials: ['M'] },

  // Metal culvert abrasion
  { code: '1400', name: 'Abrasion/wear (Metal Culvert)', geometry: 'area', materials: ['S'] },

  // Distortion (geometry / member type)
  { code: '1500', name: 'Distortion (Barrier)', geometry: 'point', materials: ['S', 'C', 'O'] },
  { code: '1510', name: 'Distortion (Footpath/Kerb)', geometry: 'point', materials: ['C', 'O'] },
  { code: '1530', name: 'Distortion (Deck Units)', geometry: 'point', materials: ['C', 'P', 'S'] },
  { code: '1540', name: 'Distortion (Steel Members)', geometry: 'point', materials: ['S'] },
  { code: '1550', name: 'Distortion (Arch)', geometry: 'point', materials: ['C', 'S', 'M'] },
  { code: '1560', name: 'Distortion (Cable/Hanger)', geometry: 'point', materials: ['S'] },
  { code: '1570', name: 'Distortion (corrugated metal arch/culvert)', geometry: 'point', materials: ['S'] },
  { code: '1580', name: 'Distortion (Pipe Culvert)', geometry: 'point', materials: ['S', 'C', 'O'] },
  { code: '1590', name: 'Distortion (Invert Protection)', geometry: 'point', materials: ['C', 'O'] },
  { code: '1600', name: 'Distortion (Headwall/Spandrel)', geometry: 'point', materials: ['C', 'M'] },
  { code: '1610', name: 'Distortion (Wall Facing)', geometry: 'point', materials: ['C', 'O'] },
  { code: '1620', name: 'Distortion (Wing Wall)', geometry: 'point', materials: ['C', 'M', 'S'] },

  // Bearings / movement
  { code: '2000', name: 'Movement (Bearing)', geometry: 'point', materials: ['O', 'S'] },
  { code: '2010', name: 'Movement (Seismic linkage/restraint)', geometry: 'point', materials: ['S', 'O'] },
  { code: '2020', name: 'Alignment (Bearing)', geometry: 'point', materials: ['O', 'S'] },
  { code: '2030', name: 'Bulging, splitting or tearing (Bearing)', geometry: 'line', materials: ['O'] },
  { code: '2040', name: 'Loss of bearing support', geometry: 'point', materials: ['O', 'C', 'S'] },

  // Joints
  { code: '2100', name: 'Leakage (Joint)', geometry: 'point', materials: ['O'] },
  { code: '2110', name: 'Joint width', geometry: 'point', materials: ['O'] },
  { code: '2120', name: 'Seal adhesion (Joint)', geometry: 'point', materials: ['O'] },
  { code: '2130', name: 'Seal damage (Joint)', geometry: 'point', materials: ['O'] },
  { code: '2140', name: 'Debris impaction (Joint)', geometry: 'point', materials: ['O'] },
  { code: '2150', name: 'Adjacent deck/nosing (Joint)', geometry: 'point', materials: ['O', 'C'] },
  { code: '2160', name: 'Metal deterioration or damage (Joint)', geometry: 'point', materials: ['S', 'O'] },
  { code: '2170', name: 'Joint overlay', geometry: 'point', materials: ['O'] },
  { code: '2180', name: 'Delamination/Spall/Patched Area (Plug Joint)', geometry: 'area', materials: ['O', 'C'] },

  // Wearing surface
  { code: '3000', name: 'Delamination/Spall/Patched Area (AC/chip seal)', geometry: 'area', materials: ['O'] },
  { code: '3010', name: 'Crack (AC/chip seal wearing surface)', geometry: 'line', materials: ['O'] },
  { code: '3020', name: 'Deformations, heaves and shoves', geometry: 'point', materials: ['O'] },
  { code: '3100', name: 'Delamination/Spall/Patched Area (Concrete wearing surface)', geometry: 'area', materials: ['C', 'P'] },
  { code: '3110', name: 'Crack (Concrete wearing surface)', geometry: 'line', materials: ['C', 'P'] },
  { code: '3300', name: 'Effectiveness (AC/chip seal/concrete wearing surface)', geometry: 'point', materials: ['C', 'O'] },
  { code: '3400', name: 'Effectiveness (Steel protective coatings)', geometry: 'area', materials: ['S'] },
  { code: '3410', name: 'Effectiveness (Concrete/other protective coatings)', geometry: 'area', materials: ['C', 'P', 'O'] },

  // Settlement / scour / environment
  { code: '4000', name: 'Settlement (Substructure)', geometry: 'point', materials: ['C', 'S', 'O'] },
  { code: '4100', name: 'Settlement (slope/scour protection)', geometry: 'point', materials: ['O'] },
  { code: '4200', name: 'Settlement (Culvert)', geometry: 'point', materials: ['C', 'S', 'O'] },
  { code: '5000', name: 'Scour (localised)', geometry: 'point', materials: ['O', 'C', 'S'] },
  { code: '5100', name: 'Scour (degradation)', geometry: 'point', materials: ['O'] },
  { code: '5200', name: 'Scour (aggradation)', geometry: 'point', materials: ['O'] },
  { code: '5300', name: 'Scour (lateral erosion)', geometry: 'point', materials: ['O'] },
  { code: '5400', name: 'Scour (unlined culvert/drive invert)', geometry: 'point', materials: ['O', 'C'] },
  { code: '6000', name: 'Waterway blockage', geometry: 'point', materials: ['O'] },
  { code: '6100', name: 'Drainage', geometry: 'point', materials: ['O'] },
  { code: '7000', name: 'Vegetation encroachment', geometry: 'point', materials: ['O'] },
  { code: '8000', name: 'Debris/detritus', geometry: 'point', materials: ['O'] },
  { code: '8300', name: 'Sign/marker faces', geometry: 'point', materials: ['O'] },
  { code: '8500', name: 'Graffiti', geometry: 'area', materials: ['C', 'S', 'O'] },
  { code: '8700', name: 'Utilities General', geometry: 'point', materials: ['O'] },
  { code: '8800', name: 'Lighting General', geometry: 'point', materials: ['O'] },
  { code: '9000', name: 'Damage', geometry: 'point', materials: ['C', 'P', 'S', 'T', 'M', 'O'] },
]

export const DEFECT_TYPE_BY_CODE: Record<string, DefectType> = Object.fromEntries(
  DEFECT_TYPES.map((d) => [d.code, d]),
)

export const MATERIAL_LABEL: Record<MaterialCode, string> = {
  C: 'Reinforced concrete',
  P: 'Prestressed concrete',
  S: 'Steel',
  T: 'Timber',
  M: 'Masonry',
  O: 'Other',
}

export const FACE_LABEL: Record<DefectFace, string> = {
  top: 'Top (plan)',
  front: 'Front (elevation)',
  side: 'Side (elevation)',
  end: 'End (section)',
}

/** Default draw-tool → Appendix E code by material. */
const DRAW_DEFAULTS: Record<MaterialCode, Record<DrawnDefectKind, string>> = {
  C: { crack: '1150', spall: '1100', patch: '3100' },
  P: { crack: '1140', spall: '1100', patch: '3100' },
  S: { crack: '1020', spall: '1000', patch: '3400' },
  T: { crack: '1220', spall: '1200', patch: '1240' },
  M: { crack: '1310', spall: '1100', patch: '1300' },
  O: { crack: '3010', spall: '3000', patch: '2180' },
}

/** Alternate codes offered in the defect picker for each tool × material. */
const DRAW_ALTERNATES: Record<MaterialCode, Record<DrawnDefectKind, string[]>> = {
  C: {
    crack: ['1150', '3110', '1140'],
    spall: ['1100', '1120', '1160', '1170', '3100'],
    patch: ['3100', '1100', '3410'],
  },
  P: {
    crack: ['1140', '1150', '3110'],
    spall: ['1100', '1130', '1120', '1160', '3100'],
    patch: ['3100', '1100', '3410'],
  },
  S: {
    crack: ['1020', '1540'],
    spall: ['1000', '1010', '1400', '3400'],
    patch: ['3400', '1000', '1010'],
  },
  T: {
    crack: ['1220', '1210', '1230'],
    spall: ['1200', '1240'],
    patch: ['1240', '1200'],
  },
  M: {
    crack: ['1310'],
    spall: ['1100', '1300'],
    patch: ['1300', '1100'],
  },
  O: {
    crack: ['3010', '2030', '1020'],
    spall: ['3000', '2180', '1100'],
    patch: ['2180', '3000', '3100'],
  },
}

export function normalizeMaterial(raw?: string | null): MaterialCode {
  if (!raw) return 'C'
  const key = raw.trim().charAt(0).toUpperCase()
  if (key === 'S' || key === 'P' || key === 'C' || key === 'T' || key === 'M' || key === 'O') {
    return key
  }
  const lower = raw.toLowerCase()
  if (lower.includes('steel') || lower.includes('metal')) return 'S'
  if (lower.includes('prestress') || lower.includes('pre-stress')) return 'P'
  if (lower.includes('timber') || lower.includes('wood')) return 'T'
  if (lower.includes('masonry') || lower.includes('brick') || lower.includes('stone')) return 'M'
  if (lower.includes('concrete')) return 'C'
  return 'O'
}

export function defectsForMaterial(material?: string | null): DefectType[] {
  const mat = normalizeMaterial(material)
  return DEFECT_TYPES.filter((d) => d.materials.includes(mat) || d.materials.includes('O'))
}

export function defectsForMaterialAndGeometry(
  material: string | null | undefined,
  geometry: DefectGeometry,
): DefectType[] {
  return defectsForMaterial(material).filter((d) => d.geometry === geometry)
}

export function defaultDefectCode(
  kind: DrawnDefectKind,
  material?: string | null,
): string {
  const mat = normalizeMaterial(material)
  return DRAW_DEFAULTS[mat][kind]
}

export function defectTypesForTool(
  kind: DrawnDefectKind,
  material?: string | null,
): DefectType[] {
  const mat = normalizeMaterial(material)
  const geometry: DefectGeometry = kind === 'crack' ? 'line' : 'area'
  const preferred = DRAW_ALTERNATES[mat][kind]
    .map((c) => DEFECT_TYPE_BY_CODE[c])
    .filter((d): d is DefectType => Boolean(d))
  const extras = defectsForMaterialAndGeometry(mat, geometry).filter(
    (d) => !preferred.some((p) => p.code === d.code),
  )
  return [...preferred, ...extras]
}

export function labelForDrawnDefect(
  kind: DrawnDefectKind,
  code?: string,
  material?: string | null,
): string {
  const mapped = code ? DEFECT_TYPE_BY_CODE[code] : undefined
  const fallbackCode = defaultDefectCode(kind, material)
  const type = mapped ?? DEFECT_TYPE_BY_CODE[fallbackCode]
  return type ? `${type.code} ${type.name}` : `${kind}`
}

/** Draw-tool button captions adapted to material. */
export function toolLabel(kind: DrawnDefectKind, material?: string | null): string {
  const code = defaultDefectCode(kind, material)
  const short =
    kind === 'crack'
      ? 'Crack'
      : kind === 'spall'
        ? normalizeMaterial(material) === 'S'
          ? 'Corrosion'
          : normalizeMaterial(material) === 'T'
            ? 'Decay'
            : 'Spall'
        : 'Patch'
  return `${short} ${code}`
}

export function toolTitle(kind: DrawnDefectKind, material?: string | null): string {
  const code = defaultDefectCode(kind, material)
  const type = DEFECT_TYPE_BY_CODE[code]
  return type
    ? `Appendix E ${type.code} — ${type.name}`
    : `Appendix E defect (${kind})`
}
