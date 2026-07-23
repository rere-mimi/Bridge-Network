import type { StructureFamily } from './elementSchedule'
import type { StructureKind } from '../types'

export type ModelCategory = 'bridge' | 'walls' | 'culvert' | 'tunnel'

export type ModelSketch = {
  id: string
  family: StructureFamily
  category: ModelCategory
  title: string
  blurb: string
  /** Inline SVG paths for the thumbnail (viewBox 0 0 160 96) */
  sketch: string
}

export const MODEL_CATEGORIES: Array<{
  id: ModelCategory
  kind: StructureKind
  title: string
  blurb: string
}> = [
  {
    id: 'bridge',
    kind: 'bridge',
    title: 'Bridge',
    blurb: 'Deck, beams, arches, abutments and piers spanning a crossing.',
  },
  {
    id: 'walls',
    kind: 'retaining-wall',
    title: 'Walls',
    blurb: 'Retaining walls and noise walls — facing, piles and footings.',
  },
  {
    id: 'culvert',
    kind: 'culvert',
    title: 'Culvert',
    blurb: 'Box, pipe, pipe-arch or arch barrels under the roadway.',
  },
  {
    id: 'tunnel',
    kind: 'tunnel',
    title: 'Tunnel',
    blurb: 'Lined or cut-and-cover tunnels with portals and lining.',
  },
]

/** Visual type cards shown under the chosen category. */
export const MODEL_SKETCHES: ModelSketch[] = [
  // Bridges
  {
    id: 'girder',
    family: 'girder',
    category: 'bridge',
    title: 'Girder / beam',
    blurb: 'Open beams under a deck — most common highway form.',
    sketch: `
      <rect x="8" y="28" width="144" height="10" rx="2" fill="currentColor" opacity="0.9"/>
      <rect x="18" y="40" width="10" height="28" rx="1" fill="currentColor" opacity="0.75"/>
      <rect x="48" y="40" width="10" height="28" rx="1" fill="currentColor" opacity="0.75"/>
      <rect x="102" y="40" width="10" height="28" rx="1" fill="currentColor" opacity="0.75"/>
      <rect x="132" y="40" width="10" height="28" rx="1" fill="currentColor" opacity="0.75"/>
      <rect x="12" y="68" width="28" height="14" rx="2" fill="currentColor" opacity="0.55"/>
      <rect x="120" y="68" width="28" height="14" rx="2" fill="currentColor" opacity="0.55"/>
      <rect x="70" y="68" width="20" height="12" rx="2" fill="currentColor" opacity="0.45"/>
    `,
  },
  {
    id: 'box',
    family: 'box',
    category: 'bridge',
    title: 'Box girder',
    blurb: 'Closed cells under the deck — longer spans, stiffer torsion.',
    sketch: `
      <rect x="10" y="26" width="140" height="8" rx="2" fill="currentColor" opacity="0.9"/>
      <path d="M22 36h116v22H22z" fill="none" stroke="currentColor" stroke-width="6" opacity="0.8"/>
      <rect x="14" y="62" width="26" height="16" rx="2" fill="currentColor" opacity="0.5"/>
      <rect x="120" y="62" width="26" height="16" rx="2" fill="currentColor" opacity="0.5"/>
    `,
  },
  {
    id: 'slab',
    family: 'slab',
    category: 'bridge',
    title: 'Slab',
    blurb: 'Solid or voided slab deck — short spans, simple section.',
    sketch: `
      <rect x="12" y="34" width="136" height="18" rx="3" fill="currentColor" opacity="0.85"/>
      <rect x="16" y="56" width="24" height="18" rx="2" fill="currentColor" opacity="0.5"/>
      <rect x="120" y="56" width="24" height="18" rx="2" fill="currentColor" opacity="0.5"/>
    `,
  },
  {
    id: 'arch',
    family: 'arch',
    category: 'bridge',
    title: 'Arch',
    blurb: 'Curved barrel or ribs carrying the deck through thrust.',
    sketch: `
      <rect x="20" y="22" width="120" height="8" rx="2" fill="currentColor" opacity="0.85"/>
      <path d="M28 78 Q80 18 132 78" fill="none" stroke="currentColor" stroke-width="7" opacity="0.9"/>
      <rect x="14" y="70" width="20" height="14" rx="2" fill="currentColor" opacity="0.5"/>
      <rect x="126" y="70" width="20" height="14" rx="2" fill="currentColor" opacity="0.5"/>
    `,
  },
  // Walls
  {
    id: 'retaining-wall',
    family: 'retaining-wall',
    category: 'walls',
    title: 'Retaining wall',
    blurb: 'Facing panels or stem wall holding back fill.',
    sketch: `
      <path d="M20 78 L70 78 L70 28 L20 20 Z" fill="currentColor" opacity="0.25"/>
      <rect x="70" y="22" width="14" height="56" rx="2" fill="currentColor" opacity="0.9"/>
      <rect x="58" y="72" width="40" height="10" rx="2" fill="currentColor" opacity="0.55"/>
      <line x1="88" y1="30" x2="130" y2="30" stroke="currentColor" stroke-width="2" opacity="0.35"/>
      <line x1="88" y1="44" x2="124" y2="44" stroke="currentColor" stroke-width="2" opacity="0.35"/>
    `,
  },
  {
    id: 'noise-wall',
    family: 'noise-wall',
    category: 'walls',
    title: 'Noise wall',
    blurb: 'Tall barrier wall on piles or footing along the corridor.',
    sketch: `
      <rect x="40" y="16" width="12" height="62" rx="2" fill="currentColor" opacity="0.9"/>
      <rect x="70" y="16" width="12" height="62" rx="2" fill="currentColor" opacity="0.9"/>
      <rect x="100" y="16" width="12" height="62" rx="2" fill="currentColor" opacity="0.9"/>
      <rect x="36" y="16" width="80" height="8" rx="1" fill="currentColor" opacity="0.55"/>
      <rect x="34" y="78" width="84" height="8" rx="2" fill="currentColor" opacity="0.45"/>
    `,
  },
  // Culverts
  {
    id: 'box-culvert',
    family: 'box-culvert',
    category: 'culvert',
    title: 'Box culvert',
    blurb: 'Rectangular barrel under the road with headwalls.',
    sketch: `
      <rect x="30" y="30" width="100" height="40" rx="2" fill="none" stroke="currentColor" stroke-width="8" opacity="0.85"/>
      <rect x="18" y="24" width="14" height="52" rx="2" fill="currentColor" opacity="0.55"/>
      <rect x="128" y="24" width="14" height="52" rx="2" fill="currentColor" opacity="0.55"/>
    `,
  },
  {
    id: 'pipe-culvert',
    family: 'pipe-culvert',
    category: 'culvert',
    title: 'Pipe culvert',
    blurb: 'Circular pipe barrel — concrete or corrugated metal.',
    sketch: `
      <circle cx="80" cy="50" r="28" fill="none" stroke="currentColor" stroke-width="8" opacity="0.9"/>
      <rect x="20" y="30" width="12" height="40" rx="2" fill="currentColor" opacity="0.45"/>
      <rect x="128" y="30" width="12" height="40" rx="2" fill="currentColor" opacity="0.45"/>
    `,
  },
  {
    id: 'pipe-arch-culvert',
    family: 'pipe-arch-culvert',
    category: 'culvert',
    title: 'Pipe-arch',
    blurb: 'Low-rise arched metal pipe for wider openings.',
    sketch: `
      <path d="M40 68 Q80 18 120 68" fill="none" stroke="currentColor" stroke-width="8" opacity="0.9"/>
      <line x1="40" y1="68" x2="120" y2="68" stroke="currentColor" stroke-width="6" opacity="0.7"/>
    `,
  },
  {
    id: 'arch-culvert',
    family: 'arch-culvert',
    category: 'culvert',
    title: 'Arch culvert',
    blurb: 'Open-bottom arch spanning between foundations.',
    sketch: `
      <path d="M36 72 Q80 22 124 72" fill="none" stroke="currentColor" stroke-width="8" opacity="0.9"/>
      <rect x="28" y="70" width="16" height="12" rx="1" fill="currentColor" opacity="0.5"/>
      <rect x="116" y="70" width="16" height="12" rx="1" fill="currentColor" opacity="0.5"/>
    `,
  },
  // Tunnels
  {
    id: 'tunnel-lined',
    family: 'tunnel-lined',
    category: 'tunnel',
    title: 'Lined tunnel',
    blurb: 'Bored or mined tunnel with structural lining.',
    sketch: `
      <path d="M30 78 V48 Q80 12 130 48 V78" fill="none" stroke="currentColor" stroke-width="8" opacity="0.9"/>
      <ellipse cx="80" cy="52" rx="22" ry="18" fill="currentColor" opacity="0.2"/>
    `,
  },
  {
    id: 'tunnel-cut-cover',
    family: 'tunnel-cut-cover',
    category: 'tunnel',
    title: 'Cut-and-cover',
    blurb: 'Rectangular box tunnel built in an open excavation.',
    sketch: `
      <rect x="28" y="28" width="104" height="48" rx="2" fill="none" stroke="currentColor" stroke-width="8" opacity="0.85"/>
      <rect x="20" y="20" width="120" height="10" rx="2" fill="currentColor" opacity="0.4"/>
      <rect x="48" y="42" width="64" height="28" rx="2" fill="currentColor" opacity="0.2"/>
    `,
  },
]

export function sketchesForCategory(category: ModelCategory): ModelSketch[] {
  return MODEL_SKETCHES.filter((s) => s.category === category)
}

export function sketchForFamily(family: StructureFamily): ModelSketch | undefined {
  return MODEL_SKETCHES.find((s) => s.family === family)
}

export function categoryFromFamily(family: StructureFamily): ModelCategory {
  const hit = MODEL_SKETCHES.find((s) => s.family === family)
  return hit?.category ?? 'bridge'
}

export function kindFromCategory(category: ModelCategory): StructureKind {
  return MODEL_CATEGORIES.find((c) => c.id === category)?.kind ?? 'bridge'
}
