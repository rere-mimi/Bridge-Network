/**
 * Appendix E — Defect Types
 * Structures Inspection Manual (TMR)
 */

export type DefectGeometry = 'point' | 'line' | 'area'
export type DrawnDefectKind = 'crack' | 'spall' | 'patch'

export type DefectType = {
  code: string
  name: string
  geometry: DefectGeometry
}

export const DEFECT_TYPES: DefectType[] = [
  { code: '1000', name: "Corrosion (General)", geometry: 'point' },
  { code: '1010', name: "Corrosion (corrugated metal)", geometry: 'point' },
  { code: '1020', name: "Fatigue crack (steel/other)", geometry: 'line' },
  { code: '1030', name: "Connection (General)", geometry: 'point' },
  { code: '1040', name: "Connection (Timber Planks)", geometry: 'point' },
  { code: '1050', name: "Connection (Barriers)", geometry: 'point' },
  { code: '1060', name: "Connection (Cable/hanger)", geometry: 'point' },
  { code: '1070', name: "Connection (Bearing)", geometry: 'point' },
  { code: '1100', name: "Delamination/spall (Concrete/Ma sonry)", geometry: 'area' },
  { code: '1110', name: "Delamination/spall (Unlined drive/tunnel)", geometry: 'area' },
  { code: '1120', name: "Exposed rebar", geometry: 'point' },
  { code: '1130', name: "Exposed prestressing", geometry: 'point' },
  { code: '1140', name: "Cracking (Prestressed Concrete)", geometry: 'line' },
  { code: '1150', name: "Cracking (Reinforced concrete)", geometry: 'line' },
  { code: '1160', name: "Efflorescence/rust staining.", geometry: 'point' },
  { code: '1170', name: "Abrasion/wear (Concrete)", geometry: 'area' },
  { code: '1180', name: "Abrasion/wear (Mattress/Basket)", geometry: 'area' },
  { code: '1200', name: "Decay/Section loss (timber)", geometry: 'area' },
  { code: '1210', name: "Check/shake (timber)", geometry: 'line' },
  { code: '1220', name: "Crack (timber)", geometry: 'line' },
  { code: '1230', name: "Split/delamination (timber)", geometry: 'line' },
  { code: '1240', name: "Abrasion/wear (timber)", geometry: 'area' },
  { code: '1300', name: "Mortar breakdown (Masonry)", geometry: 'point' },
  { code: '1310', name: "Split/spall/dis placement (masonry)", geometry: 'line' },
  { code: '1400', name: "Abrasion/wear (Metal Culvert)", geometry: 'area' },
  { code: '1500', name: "Distortion (Barrier)", geometry: 'point' },
  { code: '1510', name: "Distortion (Footpath/Ke rb)", geometry: 'point' },
  { code: '1530', name: "Distortion (Deck Units)", geometry: 'point' },
  { code: '1540', name: "Distortion (Steel Members)", geometry: 'point' },
  { code: '1550', name: "Distortion (Arch)", geometry: 'point' },
  { code: '1560', name: "Distortion (Cable/Hanger)", geometry: 'point' },
  { code: '1570', name: "Distortion (corrugated metal arch/culvert)", geometry: 'point' },
  { code: '1580', name: "Distortion (Pipe Culvert)", geometry: 'point' },
  { code: '1590', name: "Distortion (Invert Protection)", geometry: 'point' },
  { code: '1600', name: "Distortion (Headwall/Spandrel)", geometry: 'point' },
  { code: '1610', name: "Distortion (Wall Facing)", geometry: 'point' },
  { code: '1620', name: "Distortion (Wing Wall)", geometry: 'point' },
  { code: '2000', name: "Movement (Bearing)", geometry: 'point' },
  { code: '2010', name: "Movement (Seismic linkage/restr aint system)", geometry: 'point' },
  { code: '2020', name: "Alignment (Bearing)", geometry: 'point' },
  { code: '2030', name: "Bulging, splitting or tearing (Bearing)", geometry: 'line' },
  { code: '2040', name: "Loss of bearing support", geometry: 'point' },
  { code: '2100', name: "Leakage (Joint)", geometry: 'point' },
  { code: '2110', name: "Joint width", geometry: 'point' },
  { code: '2120', name: "Seal adhesion (Joint)", geometry: 'point' },
  { code: '2130', name: "Seal damage (Joint)", geometry: 'point' },
  { code: '2140', name: "Debris impaction (Joint)", geometry: 'point' },
  { code: '2150', name: "Adjacent deck/nosing (Joint)", geometry: 'point' },
  { code: '2160', name: "Metal deterioration or damage (Joint)", geometry: 'point' },
  { code: '2170', name: "Joint overlay", geometry: 'point' },
  { code: '2180', name: "Delamination/Spall/Patche d Area (Plug Joint)", geometry: 'area' },
  { code: '3000', name: "Delamination/Spall/Patche d Area (AC/chip seal wearing surface)", geometry: 'area' },
  { code: '3010', name: "Crack (AC/chip seal wearing surface)", geometry: 'line' },
  { code: '3020', name: "Deformations, heaves and shoves", geometry: 'point' },
  { code: '3100', name: "Delamination/Spall/Patche d Area (Concrete wearing surface)", geometry: 'area' },
  { code: '3110', name: "Crack (Concrete wearing surface)", geometry: 'line' },
  { code: '3300', name: "Effectiveness (AC/chip seal/concrete wearing surface)", geometry: 'point' },
  { code: '3400', name: "Effectiveness (Steel protective coatings)", geometry: 'point' },
  { code: '3410', name: "Effectiveness (Concrete/other Protective coatings)", geometry: 'point' },
  { code: '4000', name: "Settlement (Substructure)", geometry: 'point' },
  { code: '4100', name: "Settlement (slope/scour protection)", geometry: 'point' },
  { code: '4200', name: "Settlement (Culvert)", geometry: 'point' },
  { code: '5000', name: "Scour (localised)", geometry: 'point' },
  { code: '5100', name: "Scour (degradation)", geometry: 'point' },
  { code: '5200', name: "Scour (aggradation)", geometry: 'point' },
  { code: '5300', name: "Scour (lateral erosion)", geometry: 'point' },
  { code: '5400', name: "Scour (unlined culvert/drive invert degradation)", geometry: 'point' },
  { code: '6000', name: "Waterway blockage", geometry: 'point' },
  { code: '6100', name: "Drainage", geometry: 'point' },
  { code: '7000', name: "Vegetation encroachment", geometry: 'point' },
  { code: '8000', name: "Debris/detritus", geometry: 'point' },
  { code: '8300', name: "Sign/marker faces", geometry: 'point' },
  { code: '8500', name: "Graffiti", geometry: 'point' },
  { code: '8700', name: "Utilities General", geometry: 'point' },
  { code: '8800', name: "Lighting General", geometry: 'point' },
  { code: '9000', name: "Damage", geometry: 'point' },
]

export const DEFECT_TYPE_BY_CODE: Record<string, DefectType> = Object.fromEntries(
  DEFECT_TYPES.map((d) => [d.code, d]),
)

/** Default Appendix E mapping for the twin draw tools. */
export const DRAW_TOOL_DEFECTS: Record<
  DrawnDefectKind,
  { code: string; name: string; geometry: DefectGeometry }
> = {
  crack: { code: '1150', name: 'Cracking (Reinforced concrete)', geometry: 'line' },
  spall: { code: '1100', name: 'Delamination/spall (Concrete/Masonry)', geometry: 'area' },
  patch: { code: '3100', name: 'Delamination/Spall/Patched Area (Concrete wearing surface)', geometry: 'area' },
}

export const DRAW_TOOL_ALTERNATES: Record<DrawnDefectKind, string[]> = {
  crack: ['1150', '1140', '1020', '3110', '3010', '1220'],
  spall: ['1100', '2180', '3100', '3000'],
  patch: ['3100', '3000', '2180', '1100'],
}

export function defectTypesForTool(kind: DrawnDefectKind): DefectType[] {
  const codes = DRAW_TOOL_ALTERNATES[kind]
  return codes
    .map((c) => DEFECT_TYPE_BY_CODE[c])
    .filter((d): d is DefectType => Boolean(d))
}

export function labelForDrawnDefect(kind: DrawnDefectKind, code?: string): string {
  const mapped = code ? DEFECT_TYPE_BY_CODE[code] : undefined
  const fallback = DRAW_TOOL_DEFECTS[kind]
  const type = mapped ?? fallback
  return `${type.code} ${type.name}`
}
