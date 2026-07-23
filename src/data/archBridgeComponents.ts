/**
 * Arch bridge component validation against a standard diagram.
 *
 * Reference parts (Structville / ICE Manual of Bridge Design):
 * deck, crown, spandrel, arch rib/barrel, springings, extrados, intrados,
 * skewback/abutment, rise, span.
 *
 * Mapped to Appendix C element schedule + Appendix B components.
 */

export type ArchSpandrelType = 'closed' | 'open'

export type ArchDiagramPart = {
  /** Label as shown on typical arch-bridge diagrams */
  diagram: string
  /** How it appears in our inventory / twin */
  role: 'element' | 'geometry' | 'face' | 'structure'
  /** Appendix C schedule number(s) when role is element */
  scheduleNos: number[]
  /** Appendix B component number(s) */
  componentNos: number[]
  note: string
  /** Required on a valid arch twin */
  required: boolean
}

/** Canonical diagram → inventory mapping for deck-arch bridges. */
export const ARCH_DIAGRAM_PARTS: ArchDiagramPart[] = [
  {
    diagram: 'Deck',
    role: 'element',
    scheduleNos: [200],
    componentNos: [20],
    note: 'Roadway slab above the arch / spandrel.',
    required: true,
  },
  {
    diagram: 'Crown',
    role: 'geometry',
    scheduleNos: [204, 205],
    componentNos: [25],
    note: 'Highest point of the arch rib/barrel — not a separate schedule item.',
    required: true,
  },
  {
    diagram: 'Spandrel',
    role: 'element',
    scheduleNos: [206, 207],
    componentNos: [25],
    note: 'Space between arch and deck: walls (closed) or columns (open).',
    required: true,
  },
  {
    diagram: 'Arch rib / barrel',
    role: 'element',
    scheduleNos: [204, 205],
    componentNos: [25],
    note: '204 open-spandrel rib · 205 closed-spandrel barrel.',
    required: true,
  },
  {
    diagram: 'Springings',
    role: 'geometry',
    scheduleNos: [204, 205],
    componentNos: [25],
    note: 'Arch ends where the rib meets the skewback — modelled on the barrel ends.',
    required: true,
  },
  {
    diagram: 'Extrados (back)',
    role: 'face',
    scheduleNos: [204, 205],
    componentNos: [25],
    note: 'Outer (upper) face of the arch ring — defect face “top/side”.',
    required: false,
  },
  {
    diagram: 'Intrados (soffit)',
    role: 'face',
    scheduleNos: [204, 205],
    componentNos: [25],
    note: 'Inner (underside) face of the arch — primary soffit inspection surface.',
    required: false,
  },
  {
    diagram: 'Skewback / abutment',
    role: 'element',
    scheduleNos: [400],
    componentNos: [50],
    note: 'Receives horizontal thrust from the arch springings.',
    required: true,
  },
  {
    diagram: 'Wingwall',
    role: 'element',
    scheduleNos: [401],
    componentNos: [51],
    note: 'Retains approach fill beside the abutment (typical on diagrams).',
    required: false,
  },
  {
    diagram: 'Rise',
    role: 'geometry',
    scheduleNos: [204, 205],
    componentNos: [25],
    note: 'Vertical dimension of the arch (element height / openingHeight).',
    required: true,
  },
  {
    diagram: 'Span',
    role: 'structure',
    scheduleNos: [],
    componentNos: [],
    note: 'Clear span between springings — structure length / span count.',
    required: true,
  },
]

export const ARCH_SPANDREL_OPTIONS: Array<{
  id: ArchSpandrelType
  label: string
  hint: string
  archSchedule: number
  spandrelSchedule: number
}> = [
  {
    id: 'closed',
    label: 'Closed spandrel',
    hint: 'Solid fill / walls between barrel and deck (element 205 + 207)',
    archSchedule: 205,
    spandrelSchedule: 207,
  },
  {
    id: 'open',
    label: 'Open spandrel',
    hint: 'Arch ribs with columns up to the deck (element 204 + 206)',
    archSchedule: 204,
    spandrelSchedule: 206,
  },
]

export type ArchComponentCheck = {
  diagram: string
  ok: boolean
  detail: string
  scheduleNos: number[]
}

/** Validate that an inventory covers the diagram parts for the chosen spandrel type. */
export function validateArchComponents(
  scheduleNos: number[],
  spandrelType: ArchSpandrelType = 'closed',
): ArchComponentCheck[] {
  const set = new Set(scheduleNos)
  const archNo = spandrelType === 'open' ? 204 : 205
  const spandrelNo = spandrelType === 'open' ? 206 : 207

  return ARCH_DIAGRAM_PARTS.map((part) => {
    if (part.diagram === 'Arch rib / barrel') {
      const ok = set.has(archNo)
      return {
        diagram: part.diagram,
        ok,
        detail: ok
          ? `Present · ${archNo} ${spandrelType === 'open' ? 'open spandrel arch' : 'closed spandrel arch'}`
          : `Missing · expected ${archNo}`,
        scheduleNos: [archNo],
      }
    }
    if (part.diagram === 'Spandrel') {
      const ok = set.has(spandrelNo)
      return {
        diagram: part.diagram,
        ok,
        detail: ok
          ? `Present · ${spandrelNo} ${spandrelType === 'open' ? 'spandrel column' : 'spandrel wall'}`
          : `Missing · expected ${spandrelNo}`,
        scheduleNos: [spandrelNo],
      }
    }
    if (part.role === 'element' && part.required) {
      const hit = part.scheduleNos.find((n) => set.has(n))
      return {
        diagram: part.diagram,
        ok: hit != null,
        detail: hit != null ? `Present · ${hit}` : `Missing · expected ${part.scheduleNos.join(' / ')}`,
        scheduleNos: part.scheduleNos,
      }
    }
    if (part.role === 'element' && !part.required) {
      const hit = part.scheduleNos.find((n) => set.has(n))
      return {
        diagram: part.diagram,
        ok: true,
        detail: hit != null ? `Present · ${hit}` : `Optional · ${part.note}`,
        scheduleNos: part.scheduleNos,
      }
    }
    // geometry / face / structure — validated by presence of arch + deck when required
    const archPresent = set.has(204) || set.has(205)
    const deckPresent = set.has(200)
    const ok =
      !part.required ||
      (part.diagram === 'Span' ? true : part.diagram === 'Deck' ? deckPresent : archPresent)
    return {
      diagram: part.diagram,
      ok,
      detail: part.note,
      scheduleNos: part.scheduleNos,
    }
  })
}

export function archComponentsValid(checks: ArchComponentCheck[]): boolean {
  return checks.every((c) => c.ok)
}
