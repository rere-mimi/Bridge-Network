/**
 * Appendix B — Standard Component Schedule
 * Structures Inspection Manual, Transport and Main Roads (TMR), September 2016
 */

export type ComponentGroup = 'abutment' | 'pier' | 'span' | 'approach'
export type MaterialHint = 'S' | 'P' | 'C' | 'T' | 'O' | '-'
export type QuantityUnit = 'm²' | 'm' | 'each'

export type StandardComponent = {
  no: number
  name: string
  code: string
  significance: 1 | 2 | 3 | 4
  unit: QuantityUnit
  groups: ComponentGroup[]
  category: string
}

/** Table B1 + Table B2 applicability (bridge-relevant components). */
export const STANDARD_COMPONENTS: StandardComponent[] = [
  // Deck Surface (1-9)
  { no: 1, name: 'Fill/Wearing Surface on Deck', code: 'WS', significance: 2, unit: 'm²', groups: ['span'], category: 'Deck Surface' },
  { no: 2, name: 'Bridge Railing/Barriers', code: 'BR', significance: 1, unit: 'm', groups: ['abutment', 'span'], category: 'Deck Surface' },
  { no: 3, name: 'Bridge Kerbs', code: 'K', significance: 1, unit: 'm', groups: ['abutment', 'span'], category: 'Deck Surface' },
  { no: 4, name: 'Footways', code: 'FY', significance: 1, unit: 'm', groups: ['span', 'approach'], category: 'Deck Surface' },

  // Deck Joints (10-19)
  { no: 10, name: 'Pourable Joint Seal', code: 'J', significance: 2, unit: 'm', groups: ['abutment', 'pier', 'span'], category: 'Deck Joints' },
  { no: 11, name: 'Compression Joint Seal', code: 'J', significance: 2, unit: 'm', groups: ['abutment', 'pier', 'span'], category: 'Deck Joints' },
  { no: 13, name: 'Open Expansion Joint', code: 'J', significance: 2, unit: 'm', groups: ['abutment', 'pier', 'span'], category: 'Deck Joints' },
  { no: 15, name: 'Fixed/Small Movement Joints', code: 'J', significance: 2, unit: 'm', groups: ['abutment', 'pier', 'span'], category: 'Deck Joints' },

  // Superstructure (20-39)
  { no: 20, name: 'Deck Slab', code: 'D', significance: 3, unit: 'm²', groups: ['span'], category: 'Superstructure' },
  { no: 21, name: 'Closed Web/Box Girders', code: 'G', significance: 4, unit: 'm', groups: ['span'], category: 'Superstructure' },
  { no: 22, name: 'Open Girders', code: 'G', significance: 4, unit: 'each', groups: ['span'], category: 'Superstructure' },
  { no: 25, name: 'Arches', code: 'ARH', significance: 4, unit: 'm', groups: ['span'], category: 'Superstructure' },
  { no: 27, name: 'Corbels', code: 'COR', significance: 3, unit: 'each', groups: ['abutment', 'pier'], category: 'Superstructure' },
  { no: 28, name: 'Cross Beams/Floor Beams', code: 'XB', significance: 3, unit: 'each', groups: ['span'], category: 'Superstructure' },
  { no: 31, name: 'Diaphragms/Bracing (Cross Girders)', code: 'XG', significance: 3, unit: 'each', groups: ['span'], category: 'Superstructure' },
  { no: 32, name: 'Load Bearing Diaphragms', code: 'XG', significance: 4, unit: 'each', groups: ['span'], category: 'Superstructure' },

  // Bearings (40-49)
  { no: 40, name: 'Fixed Bearings', code: 'B', significance: 2, unit: 'each', groups: ['abutment', 'pier'], category: 'Bearings' },
  { no: 41, name: 'Sliding Bearings', code: 'B', significance: 2, unit: 'each', groups: ['abutment', 'pier'], category: 'Bearings' },
  { no: 42, name: 'Elastomeric/Pot Bearings', code: 'B', significance: 2, unit: 'each', groups: ['abutment', 'pier'], category: 'Bearings' },
  { no: 44, name: 'Mortar Pads/Bearing Pedestals', code: 'MP', significance: 1, unit: 'each', groups: ['abutment', 'pier'], category: 'Bearings' },
  { no: 45, name: 'Restraint Angles/Blocks', code: 'RA', significance: 2, unit: 'each', groups: ['abutment', 'pier'], category: 'Bearings' },

  // Substructure (50-69)
  { no: 50, name: 'Abutment', code: 'A', significance: 3, unit: 'each', groups: ['abutment'], category: 'Substructure' },
  { no: 51, name: 'Wingwall/Retaining Wall', code: 'WW', significance: 3, unit: 'each', groups: ['abutment', 'span', 'approach'], category: 'Substructure' },
  { no: 52, name: 'Abutment Sheeting/Infill Panels', code: 'ABS', significance: 2, unit: 'm²', groups: ['abutment'], category: 'Substructure' },
  { no: 53, name: 'Batter Protection', code: 'PRO', significance: 1, unit: 'm²', groups: ['abutment', 'approach'], category: 'Substructure' },
  { no: 54, name: 'Headstocks', code: 'H', significance: 4, unit: 'each', groups: ['abutment', 'pier'], category: 'Substructure' },
  { no: 55, name: 'Pier Headstocks (Integral)', code: 'H', significance: 4, unit: 'each', groups: ['pier'], category: 'Substructure' },
  { no: 56, name: 'Columns or Piles', code: 'C', significance: 4, unit: 'each', groups: ['abutment', 'pier'], category: 'Substructure' },
  { no: 57, name: 'Pile Bracing/Wales', code: 'WAL', significance: 3, unit: 'each', groups: ['abutment', 'pier'], category: 'Substructure' },
  { no: 58, name: 'Pier Walls', code: 'PW', significance: 3, unit: 'm²', groups: ['pier'], category: 'Substructure' },
  { no: 59, name: 'Footing/Pile Cap/Sill Log', code: 'F', significance: 3, unit: 'each', groups: ['abutment', 'pier'], category: 'Substructure' },
  { no: 60, name: 'Wing Piles', code: 'P', significance: 3, unit: 'each', groups: ['abutment'], category: 'Substructure' },

  // Miscellaneous (70-79)
  { no: 70, name: 'Bridge Approaches', code: 'AP', significance: 2, unit: 'each', groups: ['approach'], category: 'Miscellaneous' },
  { no: 71, name: 'Waterway', code: 'W', significance: 2, unit: 'each', groups: ['span'], category: 'Miscellaneous' },
  { no: 72, name: 'Approach Guardrail', code: 'GR', significance: 1, unit: 'each', groups: ['approach'], category: 'Miscellaneous' },
  { no: 73, name: 'ID Number Display', code: 'ID', significance: 1, unit: 'each', groups: ['abutment', 'pier'], category: 'Miscellaneous' },
  { no: 74, name: 'External Strengthening/Post Tensioning', code: 'EPT', significance: 4, unit: 'each', groups: ['abutment', 'pier', 'span'], category: 'Miscellaneous' },
]

export type StructureFamily = 'girder' | 'box' | 'arch' | 'slab'

/** Typical inspected subset used to seed a live inventory for a family. */
export function componentsForFamily(family: StructureFamily): StandardComponent[] {
  const include = new Set<number>()

  // Common to all bridges
  ;[1, 2, 3, 13, 20, 42, 44, 50, 51, 54, 56, 59, 70, 71, 72, 73].forEach((n) => include.add(n))

  if (family === 'girder' || family === 'slab') {
    ;[22, 28, 31].forEach((n) => include.add(n))
  }
  if (family === 'box') {
    ;[21, 31, 32].forEach((n) => include.add(n))
  }
  if (family === 'arch') {
    ;[25, 28].forEach((n) => include.add(n))
  }

  return STANDARD_COMPONENTS.filter((c) => include.has(c.no))
}

export function groupLabel(group: ComponentGroup, index: number): string {
  switch (group) {
    case 'abutment':
      return `A${index}`
    case 'pier':
      return `P${index}`
    case 'span':
      return `S${index}`
    case 'approach':
      return `AP${index}`
  }
}
