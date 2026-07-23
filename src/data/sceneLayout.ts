import type { BridgeAsset, BridgeElement, ConditionBand } from '../types'

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

export type SceneNode = {
  element: BridgeElement
  /** Scene-space centre */
  position: [number, number, number]
  /** Scene-space box size [x, y, z] */
  size: [number, number, number]
  /** Real-world metres for section scales */
  sizeM: SceneSizeM
  color: string
  /** Faces shown in the 2D section window */
  faces: Array<'top' | 'front' | 'side' | 'end'>
  kind: 'solid' | 'marker'
}

const SCENE_LENGTH = 9.2
const SCENE_WIDTH = 2.2
const DECK_Y = 1.25

function parseIndex(groupId: string): number {
  const n = Number(groupId.replace(/\D/g, ''))
  return Number.isFinite(n) && n > 0 ? n : 1
}

function girderIndex(element: BridgeElement): number {
  const parts = element.id.split('-')
  const last = parts[parts.length - 1]
  const n = Number(last)
  return Number.isFinite(n) ? n : 1
}

function spanCentreX(spanIndex: number, spans: number): number {
  const spanLen = SCENE_LENGTH / Math.max(spans, 1)
  return -SCENE_LENGTH / 2 + spanLen * (spanIndex - 0.5)
}

function pierX(pierIndex: number, spans: number): number {
  const spanLen = SCENE_LENGTH / Math.max(spans, 1)
  return -SCENE_LENGTH / 2 + spanLen * pierIndex
}

function abutmentX(index: number): number {
  return index <= 1 ? -SCENE_LENGTH / 2 - 0.15 : SCENE_LENGTH / 2 + 0.15
}

function approachX(index: number): number {
  return index <= 1 ? -SCENE_LENGTH / 2 - 1.6 : SCENE_LENGTH / 2 + 1.6
}

function metresPerSceneX(lengthM: number) {
  return lengthM / SCENE_LENGTH
}

/**
 * Build one selectable 3D node per inventory element so clicks map
 * precisely to Appendix C coded instances.
 */
export function buildSceneNodes(bridge: BridgeAsset): SceneNode[] {
  const spans = Math.max(bridge.spans, 1)
  const spanLenScene = SCENE_LENGTH / spans
  const spanLenM = bridge.lengthM / spans
  const deckWidthM = 12
  const mPerX = metresPerSceneX(bridge.lengthM)
  const nodes: SceneNode[] = []

  for (const el of bridge.elements) {
    const idx = parseIndex(el.groupId)
    const color = BAND_COLOR[el.band]
    let node: SceneNode | null = null

    if (el.group === 'span') {
      const x = spanCentreX(idx, spans)
      switch (el.scheduleNo) {
        case 1: // wearing surface
          node = {
            element: el,
            position: [x, DECK_Y + 0.14, 0],
            size: [spanLenScene * 0.92, 0.04, SCENE_WIDTH * 0.92],
            sizeM: { length: spanLenM, width: deckWidthM, height: 0.05 },
            color,
            faces: ['top', 'front', 'end'],
            kind: 'solid',
          }
          break
        case 2: // barrier
          node = {
            element: el,
            position: [x, DECK_Y + 0.32, SCENE_WIDTH / 2 - 0.04],
            size: [spanLenScene * 0.9, 0.28, 0.08],
            sizeM: { length: spanLenM, width: 0.3, height: 1.1 },
            color: '#d1d5db',
            faces: ['front', 'side', 'top'],
            kind: 'solid',
          }
          break
        case 3: // kerbs
          node = {
            element: el,
            position: [x, DECK_Y + 0.16, SCENE_WIDTH / 2 - 0.18],
            size: [spanLenScene * 0.9, 0.1, 0.12],
            sizeM: { length: spanLenM, width: 0.45, height: 0.25 },
            color: '#9ca3af',
            faces: ['top', 'front', 'end'],
            kind: 'solid',
          }
          break
        case 4: // footway
          node = {
            element: el,
            position: [x, DECK_Y + 0.13, -SCENE_WIDTH / 2 + 0.28],
            size: [spanLenScene * 0.9, 0.05, 0.42],
            sizeM: { length: spanLenM, width: 1.8, height: 0.12 },
            color: '#94a3b8',
            faces: ['top', 'front', 'end'],
            kind: 'solid',
          }
          break
        case 100: // joint
          node = {
            element: el,
            position: [x - spanLenScene / 2 + 0.05, DECK_Y + 0.12, 0],
            size: [0.08, 0.08, SCENE_WIDTH * 0.85],
            sizeM: { length: 0.05, width: deckWidthM, height: 0.2 },
            color: '#f59e0b',
            faces: ['top', 'front', 'end'],
            kind: 'solid',
          }
          break
        case 200: // deck
          node = {
            element: el,
            position: [x, DECK_Y, 0],
            size: [spanLenScene * 0.94, 0.22, SCENE_WIDTH],
            sizeM: { length: spanLenM, width: deckWidthM, height: 0.35 },
            color,
            faces: ['top', 'front', 'end'],
            kind: 'solid',
          }
          break
        case 201: {
          // open beam lines
          const g = girderIndex(el)
          const count = Math.max(
            bridge.elements.filter((e) => e.groupId === el.groupId && e.scheduleNo === 201).length,
            4,
          )
          const z = -0.75 + ((g - 1) / Math.max(count - 1, 1)) * 1.5
          node = {
            element: el,
            position: [x, DECK_Y - 0.2, z],
            size: [spanLenScene * 0.9, 0.28, 0.16],
            sizeM: { length: spanLenM, width: 0.45, height: 1.2 },
            color,
            faces: ['top', 'side', 'end'],
            kind: 'solid',
          }
          break
        }
        case 202: // box girder
          node = {
            element: el,
            position: [x, DECK_Y - 0.28, 0],
            size: [spanLenScene * 0.9, 0.42, SCENE_WIDTH * 0.7],
            sizeM: { length: spanLenM, width: deckWidthM * 0.7, height: 1.6 },
            color,
            faces: ['top', 'front', 'end'],
            kind: 'solid',
          }
          break
        case 205: // arch
          node = {
            element: el,
            position: [x, DECK_Y - 0.15, 0],
            size: [spanLenScene * 0.85, 0.55, SCENE_WIDTH * 0.55],
            sizeM: { length: spanLenM, width: deckWidthM * 0.5, height: 2.4 },
            color,
            faces: ['front', 'side', 'top'],
            kind: 'solid',
          }
          break
        case 207: // spandrel wall
          node = {
            element: el,
            position: [x, DECK_Y - 0.05, SCENE_WIDTH * 0.28],
            size: [spanLenScene * 0.8, 0.45, 0.12],
            sizeM: { length: spanLenM, width: 0.4, height: 1.8 },
            color,
            faces: ['front', 'side', 'top'],
            kind: 'solid',
          }
          break
        case 211: // transom
          node = {
            element: el,
            position: [x, DECK_Y - 0.18, 0],
            size: [0.22, 0.2, SCENE_WIDTH * 0.85],
            sizeM: { length: 0.5, width: deckWidthM, height: 0.8 },
            color,
            faces: ['top', 'front', 'end'],
            kind: 'solid',
          }
          break
        case 213:
        case 214:
          node = {
            element: el,
            position: [x + spanLenScene * 0.28, DECK_Y - 0.18, 0],
            size: [0.16, 0.22, SCENE_WIDTH * 0.75],
            sizeM: { length: 0.4, width: deckWidthM * 0.8, height: 0.9 },
            color,
            faces: ['top', 'front', 'end'],
            kind: 'solid',
          }
          break
        case 230:
          node = {
            element: el,
            position: [x, DECK_Y - 0.05, SCENE_WIDTH / 2 - 0.35],
            size: [0.12, 0.12, 0.12],
            sizeM: { length: 0.3, width: 0.3, height: 0.3 },
            color: '#38bdf8',
            faces: ['front', 'side', 'top'],
            kind: 'marker',
          }
          break
        case 600:
        case 601:
        case 602:
        case 603:
          node = {
            element: el,
            position: [x, 0.35, 0],
            size: [spanLenScene * 0.92, 0.7, SCENE_WIDTH * 0.55],
            sizeM: { length: spanLenM, width: deckWidthM, height: 2.4 },
            color,
            faces: ['front', 'end', 'top'],
            kind: 'solid',
          }
          break
        case 604:
          node = {
            element: el,
            position: [x, 0.02, 0],
            size: [spanLenScene * 0.9, 0.08, SCENE_WIDTH * 0.5],
            sizeM: { length: spanLenM, width: deckWidthM * 0.9, height: 0.2 },
            color: '#64748b',
            faces: ['top', 'front', 'end'],
            kind: 'solid',
          }
          break
        case 605:
          node = {
            element: el,
            position: [x - spanLenScene * 0.4, 0.4, SCENE_WIDTH * 0.35],
            size: [0.7, 0.8, 0.16],
            sizeM: { length: 2.5, width: 0.35, height: 2.2 },
            color,
            faces: ['front', 'side', 'top'],
            kind: 'solid',
          }
          break
        case 606:
          node = {
            element: el,
            position: [x - spanLenScene * 0.45, 0.55, 0],
            size: [0.18, 0.9, SCENE_WIDTH * 0.6],
            sizeM: { length: 0.4, width: deckWidthM, height: 2.5 },
            color,
            faces: ['front', 'side', 'top'],
            kind: 'solid',
          }
          break
        case 607:
        case 609:
        case 610:
          node = {
            element: el,
            position: [x, 0.15, ((el.scheduleNo % 3) - 1) * 0.35],
            size: [0.45, 0.35, 0.45],
            sizeM: { length: 1.2, width: 1.2, height: 1.0 },
            color,
            faces: ['top', 'front', 'side'],
            kind: 'solid',
          }
          break
        default:
          node = {
            element: el,
            position: [x, DECK_Y + 0.45, ((el.scheduleNo % 7) - 3) * 0.12],
            size: [0.16, 0.16, 0.16],
            sizeM: { length: 0.4, width: 0.4, height: 0.4 },
            color,
            faces: ['top', 'front', 'side'],
            kind: 'marker',
          }
      }
    }

    if (el.group === 'pier') {
      const x = pierX(idx, spans)
      switch (el.scheduleNo) {
        case 402: // pier cap
          node = {
            element: el,
            position: [x, 0.95, 0],
            size: [0.7, 0.18, 1.7],
            sizeM: { length: 1.2, width: deckWidthM * 0.7, height: 0.8 },
            color,
            faces: ['top', 'front', 'side'],
            kind: 'solid',
          }
          break
        case 404: // column
          node = {
            element: el,
            position: [x, 0.45, 0],
            size: [0.35, 1.0, 0.7],
            sizeM: { length: 0.9, width: 0.9, height: 4.5 },
            color,
            faces: ['front', 'side', 'top'],
            kind: 'solid',
          }
          break
        case 406:
          node = {
            element: el,
            position: [x, -0.05, 0],
            size: [0.9, 0.2, 1.4],
            sizeM: { length: 2.5, width: 3.5, height: 1.0 },
            color,
            faces: ['top', 'front', 'side'],
            kind: 'solid',
          }
          break
        case 407:
          node = {
            element: el,
            position: [x, 0.15, 0.45],
            size: [0.22, 0.5, 0.22],
            sizeM: { length: 0.6, width: 0.6, height: 8 },
            color,
            faces: ['front', 'side', 'top'],
            kind: 'solid',
          }
          break
        case 302:
        case 306:
          node = {
            element: el,
            position: [x, 1.05, ((el.scheduleNo === 302 ? 1 : -1) * 0.35)],
            size: [0.32, 0.14, 0.26],
            sizeM: { length: 0.6, width: 0.5, height: 0.25 },
            color,
            faces: ['top', 'front', 'side'],
            kind: 'solid',
          }
          break
        case 100:
          node = {
            element: el,
            position: [x, DECK_Y + 0.12, 0],
            size: [0.08, 0.08, SCENE_WIDTH * 0.85],
            sizeM: { length: 0.05, width: deckWidthM, height: 0.2 },
            color: '#f59e0b',
            faces: ['top', 'front', 'end'],
            kind: 'solid',
          }
          break
        default:
          node = {
            element: el,
            position: [x, 0.7, ((el.scheduleNo % 5) - 2) * 0.15],
            size: [0.14, 0.14, 0.14],
            sizeM: { length: 0.4, width: 0.4, height: 0.4 },
            color,
            faces: ['top', 'front', 'side'],
            kind: 'marker',
          }
      }
    }

    if (el.group === 'abutment') {
      const x = abutmentX(idx)
      const side = idx <= 1 ? -1 : 1
      switch (el.scheduleNo) {
        case 400:
          node = {
            element: el,
            position: [x, 0.55, 0],
            size: [0.55, 1.35, 2.0],
            sizeM: { length: 1.5, width: deckWidthM, height: 5 },
            color,
            faces: ['front', 'side', 'top'],
            kind: 'solid',
          }
          break
        case 401:
          node = {
            element: el,
            position: [x + side * 0.35, 0.5, 1.15],
            size: [0.9, 1.1, 0.22],
            sizeM: { length: 4, width: 0.4, height: 3.5 },
            color,
            faces: ['front', 'side', 'top'],
            kind: 'solid',
          }
          break
        case 404:
          node = {
            element: el,
            position: [x, 0.4, -0.55],
            size: [0.3, 0.9, 0.3],
            sizeM: { length: 0.8, width: 0.8, height: 4 },
            color,
            faces: ['front', 'side', 'top'],
            kind: 'solid',
          }
          break
        case 406:
          node = {
            element: el,
            position: [x, -0.05, 0],
            size: [1.1, 0.18, 2.1],
            sizeM: { length: 3, width: 5, height: 1 },
            color,
            faces: ['top', 'front', 'side'],
            kind: 'solid',
          }
          break
        case 407:
          node = {
            element: el,
            position: [x, 0.2, 0.7],
            size: [0.2, 0.55, 0.2],
            sizeM: { length: 0.5, width: 0.5, height: 8 },
            color,
            faces: ['front', 'side', 'top'],
            kind: 'solid',
          }
          break
        case 302:
        case 306:
          node = {
            element: el,
            position: [x + side * -0.15, 1.05, 0],
            size: [0.32, 0.14, 0.26],
            sizeM: { length: 0.6, width: 0.5, height: 0.25 },
            color,
            faces: ['top', 'front', 'side'],
            kind: 'solid',
          }
          break
        case 100:
          node = {
            element: el,
            position: [x + side * -0.2, DECK_Y + 0.12, 0],
            size: [0.08, 0.08, SCENE_WIDTH * 0.85],
            sizeM: { length: 0.05, width: deckWidthM, height: 0.2 },
            color: '#f59e0b',
            faces: ['top', 'front', 'end'],
            kind: 'solid',
          }
          break
        default:
          node = {
            element: el,
            position: [x, 0.85, ((el.scheduleNo % 5) - 2) * 0.12],
            size: [0.14, 0.14, 0.14],
            sizeM: { length: 0.4, width: 0.4, height: 0.4 },
            color,
            faces: ['top', 'front', 'side'],
            kind: 'marker',
          }
      }
    }

    if (el.group === 'approach') {
      const x = approachX(idx)
      switch (el.scheduleNo) {
        case 1:
          node = {
            element: el,
            position: [x, 0.12, 0],
            size: [2.4, 0.08, SCENE_WIDTH],
            sizeM: { length: 2.4 * mPerX, width: deckWidthM, height: 0.15 },
            color,
            faces: ['top', 'front', 'end'],
            kind: 'solid',
          }
          break
        case 2:
          node = {
            element: el,
            position: [x, 0.35, SCENE_WIDTH / 2 - 0.05],
            size: [2.2, 0.28, 0.08],
            sizeM: { length: 2.2 * mPerX, width: 0.3, height: 1.0 },
            color: '#d1d5db',
            faces: ['front', 'side', 'top'],
            kind: 'solid',
          }
          break
        case 501:
          node = {
            element: el,
            position: [x, -0.05, 1.4],
            size: [2.0, 0.35, 0.8],
            sizeM: { length: 8, width: 4, height: 2 },
            color: '#3f4f46',
            faces: ['top', 'front', 'side'],
            kind: 'solid',
          }
          break
        case 502:
          node = {
            element: el,
            position: [x, -0.1, -1.3],
            size: [2.0, 0.2, 0.7],
            sizeM: { length: 8, width: 3, height: 0.6 },
            color: '#64748b',
            faces: ['top', 'front', 'side'],
            kind: 'solid',
          }
          break
        default:
          node = {
            element: el,
            position: [x, 0.4, ((el.scheduleNo % 5) - 2) * 0.15],
            size: [0.14, 0.14, 0.14],
            sizeM: { length: 0.4, width: 0.4, height: 0.4 },
            color,
            faces: ['top', 'front', 'side'],
            kind: 'marker',
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
