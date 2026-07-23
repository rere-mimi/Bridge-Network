import type { BridgeAsset, BridgeElement, ConditionBand } from '../types'
import { isStructural3dSchedule } from './modelCatalogue'

const BAND_COLOR: Record<ConditionBand, string> = {
  excellent: '#22c55e',
  good: '#84cc16',
  fair: '#eab308',
  poor: '#f97316',
  critical: '#ef4444',
}

export type SceneSizeM = {
  length: number
  width: number
  height: number
}

export type SceneShape = 'box' | 'cylinder' | 'ibeam'

export type ScenePart = {
  /** Local offset from node pivot */
  position: [number, number, number]
  size: [number, number, number]
  shape?: SceneShape
  color?: string
  /** Euler rotation in radians */
  rotation?: [number, number, number]
}

export type SceneNode = {
  element: BridgeElement
  /** Scene-space pivot (isolate orbit centre) */
  position: [number, number, number]
  /** Real-world metres for section scales */
  sizeM: SceneSizeM
  color: string
  faces: Array<'top' | 'front' | 'side' | 'end'>
  parts: ScenePart[]
  kind: 'solid' | 'marker'
}

/**
 * Scene axes (plan):
 *   X = roadway / traffic direction
 *   Z = stream / channel direction
 *
 * Bridge: deck & roadway along X (parallel to road), spanning across the stream (⊥ Z).
 * Culvert: barrel along Z (perpendicular to road), stream flows through the barrel.
 */
const SCENE_LENGTH = 10
const DECK_Y = 1.35

function parseIndex(groupId: string): number {
  const n = Number(groupId.replace(/\D/g, ''))
  return Number.isFinite(n) && n > 0 ? n : 1
}

function girderIndex(element: BridgeElement): number {
  const parts = element.id.split('-')
  const last = Number(parts[parts.length - 1])
  return Number.isFinite(last) ? last : 1
}

function spanCentreX(spanIndex: number, spans: number): number {
  const spanLen = SCENE_LENGTH / Math.max(spans, 1)
  return -SCENE_LENGTH / 2 + spanLen * (spanIndex - 0.5)
}

function pierX(pierIndex: number, spans: number): number {
  const spanLen = SCENE_LENGTH / Math.max(spans, 1)
  return -SCENE_LENGTH / 2 + spanLen * pierIndex
}

function hasElement(bridge: BridgeAsset, scheduleNo: number) {
  return bridge.elements.some((e) => e.scheduleNo === scheduleNo)
}

function isCulvert(bridge: BridgeAsset) {
  return (
    bridge.kind === 'culvert' ||
    bridge.family?.includes('culvert') ||
    bridge.elements.some((e) => e.scheduleNo >= 600 && e.scheduleNo <= 610)
  )
}

function roadWidthScene(deckWidthM: number) {
  return Math.min(3.2, Math.max(1.6, deckWidthM / 5))
}

function ibeamParts(
  length: number,
  height: number,
  width: number,
  color: string,
): ScenePart[] {
  const flange = height * 0.14
  const web = width * 0.28
  return [
    {
      position: [0, height / 2 - flange / 2, 0],
      size: [length, flange, width],
      shape: 'box',
      color,
    },
    {
      position: [0, 0, 0],
      size: [length, height - flange * 2, web],
      shape: 'box',
      color,
    },
    {
      position: [0, -height / 2 + flange / 2, 0],
      size: [length, flange, width],
      shape: 'box',
      color,
    },
  ]
}

/**
 * Build selectable 3D nodes with realistic composite geometry.
 * Axes: X = roadway, Z = stream.
 * Culverts: barrel ⊥ roadway (along Z), stream through opening.
 * Bridges: deck ∥ roadway (along X), spanning ⊥ stream.
 */
export function buildSceneNodes(bridge: BridgeAsset): SceneNode[] {
  const nodes = isCulvert(bridge) ? buildCulvertNodes(bridge) : buildBridgeNodes(bridge)
  // Model basis: structural elements only (no grass, waterway, fill, wearing surface, barriers…)
  return nodes.filter((n) => isStructural3dSchedule(n.element.scheduleNo))
}

function buildCulvertNodes(bridge: BridgeAsset): SceneNode[] {
  const deckWidthM = bridge.deckWidthM ?? 8
  const roadW = roadWidthScene(deckWidthM)
  const lengthM = Math.max(bridge.lengthM, 6)
  // Barrel / stream along Z (perpendicular to roadway on X)
  const barrelLen = Math.max(roadW + 1.6, Math.min(5.4, 2.4 + lengthM / 18))
  const openingH = 1.05
  // Clear opening width across the channel (along X, under the road)
  const openingW = Math.min(2.6, Math.max(1.2, roadW * 0.7))
  const wall = 0.16
  const invertY = 0.08
  const roofY = invertY + openingH + wall
  const showGussets =
    hasElement(bridge, 605) || hasElement(bridge, 606) || hasElement(bridge, 609)
  const nodes: SceneNode[] = []
  const byNo = (n: number) => bridge.elements.find((e) => e.scheduleNo === n)

  const barrelEl =
    byNo(600) ?? byNo(601) ?? byNo(602) ?? byNo(603) ?? bridge.elements.find((e) => e.group === 'span')
  if (barrelEl) {
    const color = BAND_COLOR[barrelEl.band]
    const isPipe = barrelEl.scheduleNo === 601 || barrelEl.scheduleNo === 602
    const parts: ScenePart[] = []

    if (isPipe) {
      const r = openingH * (barrelEl.scheduleNo === 602 ? 0.52 : 0.48)
      // Cylinder default axis = Y; rotate onto Z so stream runs through the pipe
      parts.push({
        position: [0, invertY + r, 0],
        size: [r * 2, barrelLen, r * 2],
        shape: 'cylinder',
        color,
        rotation: [Math.PI / 2, 0, 0],
      })
    } else {
      // Box / arch barrel: invert, side walls, roof — clear opening along ±Z (stream)
      parts.push(
        {
          position: [0, invertY + wall / 2, 0],
          size: [openingW + wall * 2, wall, barrelLen],
          color,
        },
        {
          position: [openingW / 2 + wall / 2, invertY + wall + openingH / 2, 0],
          size: [wall, openingH, barrelLen],
          color,
        },
        {
          position: [-(openingW / 2 + wall / 2), invertY + wall + openingH / 2, 0],
          size: [wall, openingH, barrelLen],
          color,
        },
        {
          position: [0, roofY, 0],
          size: [openingW + wall * 2, wall, barrelLen],
          color,
        },
      )
    }

    nodes.push({
      element: barrelEl,
      position: [0, 0, 0],
      sizeM: {
        length: lengthM,
        width: deckWidthM,
        height: openingH + wall * 2,
      },
      color,
      faces: ['front', 'end', 'top'],
      parts,
      kind: 'solid',
    })
  }

  const invert = byNo(604)
  if (invert) {
    nodes.push({
      element: invert,
      position: [0, invertY, 0],
      sizeM: { length: lengthM, width: deckWidthM * 0.9, height: 0.2 },
      color: BAND_COLOR[invert.band],
      faces: ['top', 'front', 'end'],
      parts: [
        {
          position: [0, 0, 0],
          size: [openingW + wall, 0.08, barrelLen * 1.05],
          color: '#64748b',
        },
      ],
      kind: 'solid',
    })
  }

  // Wingwalls / gussets at inlet & outlet (±Z), flaring along the stream banks
  for (const no of [605, 606, 609]) {
    const el = byNo(no)
    if (!el || !showGussets) continue
    const color = BAND_COLOR[el.band]
    const flare = no === 605 ? 0.85 : 0.55
    nodes.push({
      element: el,
      position: [0, invertY + openingH * 0.45, 0],
      sizeM: {
        length: flare * 2,
        width: 0.35,
        height: openingH + 0.4,
      },
      color,
      faces: ['front', 'side', 'top'],
      parts: [
        {
          position: [openingW / 2 + wall, 0, -barrelLen / 2 - flare * 0.25],
          size: [wall * 0.9, openingH + 0.35, flare],
          color,
          rotation: [0, 0.35, 0],
        },
        {
          position: [-(openingW / 2 + wall), 0, -barrelLen / 2 - flare * 0.25],
          size: [wall * 0.9, openingH + 0.35, flare],
          color,
          rotation: [0, -0.35, 0],
        },
        {
          position: [openingW / 2 + wall, 0, barrelLen / 2 + flare * 0.25],
          size: [wall * 0.9, openingH + 0.35, flare],
          color,
          rotation: [0, -0.35, 0],
        },
        {
          position: [-(openingW / 2 + wall), 0, barrelLen / 2 + flare * 0.25],
          size: [wall * 0.9, openingH + 0.35, flare],
          color,
          rotation: [0, 0.35, 0],
        },
      ],
      kind: 'solid',
    })
  }

  // Structural footings / piles only (no embankment fill, roadway, barriers, waterway markers)
  for (const no of [607, 610]) {
    const el = byNo(no)
    if (!el || nodes.some((n) => n.element.id === el.id)) continue
    const color = BAND_COLOR[el.band]
    nodes.push({
      element: el,
      position: [0, invertY - 0.12, 0],
      sizeM: { length: 1.2, width: openingW + 0.6, height: 0.35 },
      color,
      faces: ['top', 'front', 'end'],
      parts: [
        {
          position: [0, 0, 0],
          size: [openingW + wall * 2, 0.14, barrelLen * 0.9],
          color,
        },
      ],
      kind: 'solid',
    })
  }

  return nodes
}

function buildBridgeNodes(bridge: BridgeAsset): SceneNode[] {
  const spans = Math.max(bridge.spans, 1)
  const spanLenScene = SCENE_LENGTH / spans
  const spanLenM = bridge.lengthM / spans
  const deckWidthM = bridge.deckWidthM ?? 12
  const roadW = roadWidthScene(deckWidthM)
  const roadHalf = roadW / 2
  const nodes: SceneNode[] = []

  for (const el of bridge.elements) {
    if (!isStructural3dSchedule(el.scheduleNo)) continue
    const idx = parseIndex(el.groupId)
    const color = BAND_COLOR[el.band]
    let node: SceneNode | null = null

    if (el.group === 'span') {
      const x = spanCentreX(idx, spans)
      switch (el.scheduleNo) {
        case 100:
          node = {
            element: el,
            position: [x - spanLenScene / 2 + 0.04, DECK_Y + 0.12, 0],
            sizeM: { length: 0.05, width: deckWidthM, height: 0.2 },
            color: '#f59e0b',
            faces: ['top', 'front', 'end'],
            parts: [
              {
                position: [0, 0, 0],
                size: [0.07, 0.08, roadW * 0.95],
                color: '#f59e0b',
              },
            ],
            kind: 'solid',
          }
          break
        case 200:
          node = {
            element: el,
            position: [x, DECK_Y, 0],
            sizeM: { length: spanLenM, width: deckWidthM, height: 0.35 },
            color,
            faces: ['top', 'front', 'end'],
            parts: [
              {
                position: [0, 0, 0],
                size: [spanLenScene * 0.97, 0.2, roadW + 0.15],
                color,
              },
            ],
            kind: 'solid',
          }
          break
        case 201: {
          const g = girderIndex(el)
          const count = Math.max(
            bridge.elements.filter((e) => e.groupId === el.groupId && e.scheduleNo === 201)
              .length,
            4,
          )
          const z = -roadHalf * 0.72 + ((g - 1) / Math.max(count - 1, 1)) * roadHalf * 1.44
          const h = 0.42
          node = {
            element: el,
            position: [x, DECK_Y - 0.32, z],
            sizeM: { length: spanLenM, width: 0.45, height: 1.2 },
            color,
            faces: ['top', 'side', 'end'],
            parts: ibeamParts(spanLenScene * 0.92, h, 0.22, color),
            kind: 'solid',
          }
          break
        }
        case 202:
          node = {
            element: el,
            position: [x, DECK_Y - 0.38, 0],
            sizeM: { length: spanLenM, width: deckWidthM * 0.7, height: 1.6 },
            color,
            faces: ['top', 'front', 'end'],
            parts: [
              {
                position: [0, 0.12, 0],
                size: [spanLenScene * 0.92, 0.16, roadW * 0.85],
                color,
              },
              {
                position: [0, -0.05, roadW * 0.36],
                size: [spanLenScene * 0.92, 0.45, 0.14],
                color,
              },
              {
                position: [0, -0.05, -roadW * 0.36],
                size: [spanLenScene * 0.92, 0.45, 0.14],
                color,
              },
              {
                position: [0, -0.22, 0],
                size: [spanLenScene * 0.92, 0.14, roadW * 0.7],
                color,
              },
            ],
            kind: 'solid',
          }
          break
        case 205:
          node = {
            element: el,
            position: [x, DECK_Y - 0.55, 0],
            sizeM: { length: spanLenM, width: deckWidthM * 0.5, height: 2.4 },
            color,
            faces: ['front', 'side', 'top'],
            parts: [
              {
                position: [0, 0.35, 0],
                size: [spanLenScene * 0.55, 0.22, roadW * 0.55],
                color,
              },
              {
                position: [-spanLenScene * 0.22, -0.15, 0],
                size: [0.28, 0.95, roadW * 0.35],
                color,
              },
              {
                position: [spanLenScene * 0.22, -0.15, 0],
                size: [0.28, 0.95, roadW * 0.35],
                color,
              },
            ],
            kind: 'solid',
          }
          break
        case 207:
          node = {
            element: el,
            position: [x, DECK_Y - 0.2, roadHalf * 0.55],
            sizeM: { length: spanLenM, width: 0.4, height: 1.8 },
            color,
            faces: ['front', 'side', 'top'],
            parts: [
              {
                position: [0, 0, 0],
                size: [spanLenScene * 0.8, 0.55, 0.12],
                color,
              },
            ],
            kind: 'solid',
          }
          break
        case 211:
        case 213:
        case 214:
          node = {
            element: el,
            position: [x + (el.scheduleNo === 213 ? spanLenScene * 0.28 : 0), DECK_Y - 0.28, 0],
            sizeM: { length: 0.5, width: deckWidthM, height: 0.9 },
            color,
            faces: ['top', 'front', 'end'],
            parts: [
              {
                position: [0, 0, 0],
                size: [0.18, 0.28, roadW * 0.9],
                color,
              },
            ],
            kind: 'solid',
          }
          break
        default:
          break
      }
    }

    if (el.group === 'pier') {
      const x = pierX(idx, spans)
      switch (el.scheduleNo) {
        case 402:
          node = {
            element: el,
            position: [x, 0.95, 0],
            sizeM: { length: 1.2, width: deckWidthM * 0.7, height: 0.8 },
            color,
            faces: ['top', 'front', 'side'],
            parts: [
              {
                position: [0, 0, 0],
                size: [0.75, 0.22, roadW + 0.35],
                color,
              },
            ],
            kind: 'solid',
          }
          break
        case 404:
          node = {
            element: el,
            position: [x, 0.4, 0],
            sizeM: { length: 0.9, width: 0.9, height: 4.5 },
            color,
            faces: ['front', 'side', 'top'],
            parts: [
              {
                position: [0, 0, roadHalf * 0.35],
                size: [0.38, 1.05, 0.38],
                shape: 'cylinder',
                color,
              },
              {
                position: [0, 0, -roadHalf * 0.35],
                size: [0.38, 1.05, 0.38],
                shape: 'cylinder',
                color,
              },
            ],
            kind: 'solid',
          }
          break
        case 406:
          node = {
            element: el,
            position: [x, -0.08, 0],
            sizeM: { length: 2.5, width: 3.5, height: 1.0 },
            color,
            faces: ['top', 'front', 'side'],
            parts: [
              {
                position: [0, 0, 0],
                size: [1.1, 0.22, roadW + 0.5],
                color,
              },
            ],
            kind: 'solid',
          }
          break
        case 302:
        case 306:
          node = {
            element: el,
            position: [x, 1.08, 0],
            sizeM: { length: 0.6, width: 0.5, height: 0.25 },
            color,
            faces: ['top', 'front', 'side'],
            parts: [-0.45, 0, 0.45].map((z) => ({
              position: [0, 0, z] as [number, number, number],
              size: [0.28, 0.12, 0.22] as [number, number, number],
              color,
            })),
            kind: 'solid',
          }
          break
        default:
          break
      }
    }

    if (el.group === 'abutment') {
      const side = idx <= 1 ? -1 : 1
      const x = side * (SCENE_LENGTH / 2 + 0.05)
      switch (el.scheduleNo) {
        case 400:
          node = {
            element: el,
            position: [x, 0.55, 0],
            sizeM: { length: 1.5, width: deckWidthM, height: 5 },
            color,
            faces: ['front', 'side', 'top'],
            parts: [
              {
                position: [0, 0, 0],
                size: [0.55, 1.35, roadW + 0.4],
                color,
              },
              {
                position: [side * -0.2, 0.55, 0],
                size: [0.45, 0.2, roadW + 0.2],
                color: '#94a3b8',
              },
            ],
            kind: 'solid',
          }
          break
        case 401:
          node = {
            element: el,
            position: [x + side * 0.45, 0.45, 0],
            sizeM: { length: 4, width: 0.4, height: 3.5 },
            color,
            faces: ['front', 'side', 'top'],
            parts: [
              {
                position: [0, 0, roadHalf + 0.15],
                size: [1.1, 1.05, 0.16],
                color,
                rotation: [0, side * 0.4, 0],
              },
              {
                position: [0, 0, -(roadHalf + 0.15)],
                size: [1.1, 1.05, 0.16],
                color,
                rotation: [0, side * -0.4, 0],
              },
            ],
            kind: 'solid',
          }
          break
        case 302:
        case 306:
          node = {
            element: el,
            position: [x + side * -0.15, 1.08, 0],
            sizeM: { length: 0.6, width: 0.5, height: 0.25 },
            color,
            faces: ['top', 'front', 'side'],
            parts: [-0.4, 0.4].map((z) => ({
              position: [0, 0, z] as [number, number, number],
              size: [0.28, 0.12, 0.22] as [number, number, number],
              color,
            })),
            kind: 'solid',
          }
          break
        default:
          break
      }
    }

    // Approaches: structural wingwalls / retaining only (no embankment, road, barriers)
    if (el.group === 'approach') {
      const side = idx <= 1 ? -1 : 1
      const x = side * (SCENE_LENGTH / 2 + 1.2)
      if (el.scheduleNo === 401 || el.scheduleNo === 700) {
        node = {
          element: el,
          position: [x, 0.55, side * (roadHalf + 0.35)],
          sizeM: { length: 4, width: 0.4, height: 2.2 },
          color,
          faces: ['front', 'side', 'top'],
          parts: [
            {
              position: [0, 0, 0],
              size: [1.6, 1.1, 0.18],
              color,
            },
          ],
          kind: 'solid',
        }
      }
    }

    if (node) nodes.push(node)
  }

  return nodes
}

export function findSceneNode(nodes: SceneNode[], elementId: string | null) {
  if (!elementId) return null
  return nodes.find((n) => n.element.id === elementId) ?? null
}

/** Keep legacy size field consumers happy via first part extents */
export function nodeExtent(node: SceneNode): [number, number, number] {
  if (!node.parts.length) return [0.2, 0.2, 0.2]
  let maxX = 0
  let maxY = 0
  let maxZ = 0
  for (const p of node.parts) {
    maxX = Math.max(maxX, Math.abs(p.position[0]) + p.size[0] / 2)
    maxY = Math.max(maxY, Math.abs(p.position[1]) + p.size[1] / 2)
    maxZ = Math.max(maxZ, Math.abs(p.position[2]) + p.size[2] / 2)
  }
  return [maxX * 2, maxY * 2, maxZ * 2]
}
