import type { BridgeAsset, BridgeElement, ConditionBand, ElementSizeM } from '../types'
import { isStructural3dSchedule } from './modelCatalogue'
import { sizeForSchedule } from './structureGeometry'

export type SceneColorMode = 'material' | 'condition' | 'severity'

const BAND_COLOR: Record<ConditionBand, string> = {
  excellent: '#22c55e',
  good: '#84cc16',
  fair: '#eab308',
  poor: '#f97316',
  critical: '#ef4444',
}

/** Twin mesh colour by construction material (default view). */
export const MATERIAL_MESH_COLOR: Record<string, string> = {
  C: '#94a3b8',
  P: '#a8b5c7',
  S: '#64748b',
  T: '#b45309',
  M: '#78716c',
  O: '#6b7280',
}

const SEVERITY_COLOR: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
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

function resolveSize(bridge: BridgeAsset, el: BridgeElement): ElementSizeM {
  return {
    ...sizeForSchedule(bridge.geometry, el.scheduleNo),
    ...el.sizeM,
  }
}

function toSceneSizeM(size: ElementSizeM, fallback: SceneSizeM): SceneSizeM {
  return {
    length: size.length ?? fallback.length,
    width: size.width ?? size.diameter ?? fallback.width,
    height: size.height ?? size.openingHeight ?? fallback.height,
  }
}

/** Map a real metre value onto scene units using structure length. */
function mToScene(bridge: BridgeAsset, metres: number, axis: 'x' | 'y' | 'z' = 'x'): number {
  if (axis === 'x') return (metres / Math.max(bridge.lengthM, 1)) * SCENE_LENGTH
  // Vertical / transverse: keep roughly proportional to roadway width mapping
  const deck = bridge.deckWidthM ?? 12
  const roadW = roadWidthScene(deck)
  if (axis === 'z') return (metres / Math.max(deck, 1)) * roadW
  return metres * 0.22 // height → scene Y scale (~4.5 m → ~1)
}

function columnSpreadZ(count: number, roadHalf: number, index: number): number {
  if (count <= 1) return 0
  return -roadHalf * 0.72 + ((index - 1) / Math.max(count - 1, 1)) * roadHalf * 1.44
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

/** Parabolic deck-arch y (rise at crown, 0 at springings). Local x in [-half, half]. */
function archRiseAt(x: number, halfSpan: number, rise: number) {
  const t = halfSpan <= 0 ? 0 : x / halfSpan
  return rise * (1 - t * t)
}

/**
 * Arch rib / barrel segments along a parabola (span along X, rise in Y).
 * Matches diagram: springings at ends, crown at mid-span, intrados/extrados via ring thickness.
 */
function archBarrelParts(
  spanScene: number,
  riseScene: number,
  ringThickness: number,
  ribWidth: number,
  color: string,
  zOffset = 0,
  segments = 14,
): ScenePart[] {
  const parts: ScenePart[] = []
  const L = Math.max(0.8, spanScene * 0.94)
  const half = L / 2
  const rise = Math.max(0.45, riseScene)

  for (let i = 0; i < segments; i++) {
    const t0 = i / segments
    const t1 = (i + 1) / segments
    const x0 = -half + t0 * L
    const x1 = -half + t1 * L
    const xm = (x0 + x1) / 2
    const y0 = archRiseAt(x0, half, rise)
    const y1 = archRiseAt(x1, half, rise)
    const ym = archRiseAt(xm, half, rise)
    const dx = x1 - x0
    const dy = y1 - y0
    const segLen = Math.hypot(dx, dy)
    const angle = Math.atan2(dy, dx)
    parts.push({
      position: [xm, ym, zOffset],
      size: [Math.max(0.12, segLen * 1.08), ringThickness, ribWidth],
      rotation: [0, 0, angle],
      color,
    })
  }
  return parts
}

/** Closed-spandrel fill between barrel extrados and deck level (diagram “spandrel”). */
function closedSpandrelFillParts(
  spanScene: number,
  riseScene: number,
  roadW: number,
  color: string,
  steps = 8,
): ScenePart[] {
  const parts: ScenePart[] = []
  const L = Math.max(0.8, spanScene * 0.9)
  const half = L / 2
  const rise = Math.max(0.45, riseScene)
  const deckY = rise + 0.08

  for (let i = 0; i < steps; i++) {
    const t = (i + 0.5) / steps
    const x = -half + t * L
    const archY = archRiseAt(x, half, rise)
    const fillH = Math.max(0.05, deckY - archY - 0.06)
    if (fillH < 0.08) continue
    const sliceW = (L / steps) * 1.05
    // Solid fill across most of the roadway width
    parts.push({
      position: [x, archY + fillH * 0.5 + 0.02, 0],
      size: [sliceW, fillH, roadW * 0.7],
      color,
    })
  }
  return parts
}

/** Spandrel wall elevation following the arch (element 207). */
function spandrelWallParts(
  spanScene: number,
  riseScene: number,
  wallThickness: number,
  z: number,
  color: string,
  steps = 10,
): ScenePart[] {
  const parts: ScenePart[] = []
  const L = Math.max(0.8, spanScene * 0.88)
  const half = L / 2
  const rise = Math.max(0.45, riseScene)
  const deckY = rise + 0.05

  for (let i = 0; i < steps; i++) {
    const t = (i + 0.5) / steps
    const x = -half + t * L
    const archY = archRiseAt(x, half, rise)
    const h = Math.max(0.08, deckY - archY)
    parts.push({
      position: [x, archY + h * 0.5, z],
      size: [(L / steps) * 1.08, h, wallThickness],
      color,
    })
  }
  return parts
}

/**
 * Build selectable 3D nodes with realistic composite geometry.
 * Axes: X = roadway, Z = stream.
 * Culverts: barrel ⊥ roadway (along Z), stream through opening.
 * Bridges: deck ∥ roadway (along X), spanning ⊥ stream.
 */
export function buildSceneNodes(
  bridge: BridgeAsset,
  colorMode: SceneColorMode = 'material',
): SceneNode[] {
  const nodes = isCulvert(bridge)
    ? buildCulvertNodes(bridge, colorMode)
    : isWall(bridge)
      ? buildWallNodes(bridge, colorMode)
      : isTunnel(bridge)
        ? buildTunnelNodes(bridge, colorMode)
        : buildBridgeNodes(bridge, colorMode)
  // Model basis: structural elements only (no grass, waterway, fill, wearing surface, barriers…)
  return nodes.filter((n) => isStructural3dSchedule(n.element.scheduleNo))
}

function isWall(bridge: BridgeAsset) {
  return (
    bridge.kind === 'retaining-wall' ||
    bridge.family === 'retaining-wall' ||
    bridge.family === 'noise-wall' ||
    bridge.elements.some((e) => e.scheduleNo >= 700 && e.scheduleNo < 800)
  )
}

function isTunnel(bridge: BridgeAsset) {
  return bridge.kind === 'tunnel' || bridge.family === 'tunnel-lined' || bridge.family === 'tunnel-cut-cover'
}

function elementColor(
  el: BridgeElement,
  bridge: BridgeAsset,
  colorMode: SceneColorMode,
): string {
  if (colorMode === 'condition') return BAND_COLOR[el.band]
  if (colorMode === 'severity') {
    const related = bridge.defects.filter(
      (d) =>
        d.elementName === el.id ||
        d.elementName === el.name ||
        d.elementCode === el.code ||
        d.elementName.includes(el.groupId),
    )
    const drawn = (bridge.drawnDefects ?? []).filter((d) => d.elementId === el.id)
    const rank = (s: string) =>
      s === 'critical' ? 4 : s === 'high' ? 3 : s === 'medium' ? 2 : 1
    let worst = 0
    let color = MATERIAL_MESH_COLOR[el.material ?? 'C'] ?? MATERIAL_MESH_COLOR.C
    for (const d of related) {
      const r = rank(d.severity)
      if (r > worst) {
        worst = r
        color = SEVERITY_COLOR[d.severity] ?? color
      }
    }
    for (const d of drawn) {
      const sev =
        d.conditionState === 4
          ? 'critical'
          : d.conditionState === 3
            ? 'high'
            : d.conditionState === 2
              ? 'medium'
              : 'low'
      const r = rank(sev)
      if (r > worst) {
        worst = r
        color = SEVERITY_COLOR[sev]
      }
    }
    return color
  }
  return MATERIAL_MESH_COLOR[el.material ?? 'C'] ?? MATERIAL_MESH_COLOR.C
}

function buildCulvertNodes(bridge: BridgeAsset, colorMode: SceneColorMode): SceneNode[] {
  const deckWidthM = bridge.deckWidthM ?? 8
  const roadW = roadWidthScene(deckWidthM)
  const lengthM = Math.max(bridge.lengthM, 6)
  // Barrel / stream along Z (perpendicular to roadway on X)
  const barrelElPreview =
    bridge.elements.find((e) => [600, 601, 602, 603].includes(e.scheduleNo)) ?? null
  const barrelSize = barrelElPreview ? resolveSize(bridge, barrelElPreview) : {}
  const barrelLen = Math.max(
    roadW + 1.6,
    Math.min(5.4, mToScene(bridge, barrelSize.length ?? lengthM * 0.35) || 2.4 + lengthM / 18),
  )
  const openingH = Math.max(
    0.55,
    mToScene(bridge, barrelSize.openingHeight ?? barrelSize.height ?? 1.05, 'y') || 1.05,
  )
  // Clear opening width across the channel (along X, under the road)
  const openingW = Math.min(
    2.6,
    Math.max(1.2, barrelSize.width ?? barrelSize.diameter ?? roadW * 0.7),
  )
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
    const color = elementColor(barrelEl, bridge, colorMode)
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
      color: elementColor(invert, bridge, colorMode),
      faces: ['top', 'front', 'end'],
      parts: [
        {
          position: [0, 0, 0],
          size: [openingW + wall, 0.08, barrelLen * 1.05],
          color: elementColor(invert, bridge, colorMode),
        },
      ],
      kind: 'solid',
    })
  }

  // Wingwalls / gussets at inlet & outlet (±Z), flaring along the stream banks
  for (const no of [605, 606, 609]) {
    const el = byNo(no)
    if (!el || !showGussets) continue
    const color = elementColor(el, bridge, colorMode)
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
    const color = elementColor(el, bridge, colorMode)
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

function buildWallNodes(bridge: BridgeAsset, colorMode: SceneColorMode): SceneNode[] {
  const lengthM = Math.max(bridge.lengthM, 8)
  const heightM = bridge.deckWidthM ?? 4
  const wallLen = Math.min(10, Math.max(4, lengthM / 8))
  const wallH = Math.max(1.2, mToScene(bridge, heightM, 'y'))
  const nodes: SceneNode[] = []

  for (const el of bridge.elements) {
    if (!isStructural3dSchedule(el.scheduleNo)) continue
    const color = elementColor(el, bridge, colorMode)
    if (el.scheduleNo === 700) {
      nodes.push({
        element: el,
        position: [0, wallH * 0.45, 0],
        sizeM: { length: lengthM, width: 0.4, height: heightM },
        color,
        faces: ['front', 'side', 'top'],
        parts: [
          {
            position: [0, 0, 0],
            size: [wallLen, wallH, 0.18],
            color,
          },
        ],
        kind: 'solid',
      })
    } else if (el.scheduleNo === 701) {
      const idx = girderIndex(el)
      const count = Math.max(
        1,
        bridge.elements.filter((e) => e.scheduleNo === 701).length,
      )
      const x = -wallLen * 0.4 + ((idx - 1) / Math.max(count - 1, 1)) * wallLen * 0.8
      nodes.push({
        element: el,
        position: [x, wallH * 0.35, 0.05],
        sizeM: { length: 0.5, width: 0.5, height: heightM },
        color,
        faces: ['front', 'side', 'end'],
        parts: [
          {
            position: [0, 0, 0],
            size: [0.22, wallH * 0.95, 0.22],
            shape: 'cylinder',
            color,
          },
        ],
        kind: 'solid',
      })
    } else if (el.scheduleNo === 705) {
      nodes.push({
        element: el,
        position: [0, 0.05, 0],
        sizeM: { length: lengthM * 0.3, width: 1.2, height: 0.6 },
        color,
        faces: ['top', 'front', 'end'],
        parts: [
          {
            position: [0, 0, 0],
            size: [wallLen * 0.9, 0.2, 0.7],
            color,
          },
        ],
        kind: 'solid',
      })
    }
  }
  return nodes
}

function buildTunnelNodes(bridge: BridgeAsset, colorMode: SceneColorMode): SceneNode[] {
  const barrelLen = Math.min(8, Math.max(3.5, bridge.lengthM / 12))
  const openingH = 1.6
  const openingW = Math.min(2.8, Math.max(1.6, (bridge.deckWidthM ?? 8) / 5))
  const nodes: SceneNode[] = []
  const cutCover = bridge.family === 'tunnel-cut-cover'

  for (const el of bridge.elements) {
    if (!isStructural3dSchedule(el.scheduleNo)) continue
    const color = elementColor(el, bridge, colorMode)
    if (el.scheduleNo === 403 || el.scheduleNo === 400) {
      nodes.push({
        element: el,
        position: [0, openingH * 0.55, 0],
        sizeM: { length: bridge.lengthM, width: openingW + 1, height: openingH + 1 },
        color,
        faces: ['front', 'side', 'top'],
        parts: cutCover
          ? [
              {
                position: [0, -openingH * 0.35, 0],
                size: [openingW + 0.5, 0.2, barrelLen],
                color,
              },
              {
                position: [openingW * 0.55, 0, 0],
                size: [0.22, openingH, barrelLen],
                color,
              },
              {
                position: [-openingW * 0.55, 0, 0],
                size: [0.22, openingH, barrelLen],
                color,
              },
              {
                position: [0, openingH * 0.45, 0],
                size: [openingW + 0.5, 0.22, barrelLen],
                color,
              },
            ]
          : [
              {
                position: [0, 0, 0],
                size: [openingW + 0.35, openingH + 0.35, barrelLen],
                shape: 'cylinder',
                color,
                rotation: [Math.PI / 2, 0, 0],
              },
            ],
        kind: 'solid',
      })
    } else if (el.scheduleNo === 200 && cutCover) {
      nodes.push({
        element: el,
        position: [0, openingH + 0.25, 0],
        sizeM: { length: bridge.lengthM, width: bridge.deckWidthM ?? 10, height: 0.3 },
        color,
        faces: ['top', 'front', 'end'],
        parts: [
          {
            position: [0, 0, 0],
            size: [openingW + 1.2, 0.16, barrelLen * 1.05],
            color,
          },
        ],
        kind: 'solid',
      })
    } else if (el.scheduleNo === 406 || el.scheduleNo === 407) {
      nodes.push({
        element: el,
        position: [0, -0.15, 0],
        sizeM: { length: 2, width: openingW + 1, height: 0.8 },
        color,
        faces: ['top', 'front', 'end'],
        parts: [
          {
            position: [0, 0, 0],
            size: [openingW + 0.6, 0.18, barrelLen * 0.9],
            color,
          },
        ],
        kind: 'solid',
      })
    }
  }
  return nodes
}

function buildBridgeNodes(bridge: BridgeAsset, colorMode: SceneColorMode): SceneNode[] {
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
    const color = elementColor(el, bridge, colorMode)
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
        case 200: {
          const size = resolveSize(bridge, el)
          const sizeM = toSceneSizeM(size, {
            length: spanLenM,
            width: deckWidthM,
            height: 0.35,
          })
          const deckH = Math.max(0.08, mToScene(bridge, sizeM.height, 'y'))
          node = {
            element: el,
            position: [x, DECK_Y, 0],
            sizeM,
            color,
            faces: ['top', 'front', 'end'],
            parts: [
              {
                position: [0, 0, 0],
                size: [spanLenScene * 0.97, deckH, roadW + 0.15],
                color,
              },
            ],
            kind: 'solid',
          }
          break
        }
        case 201: {
          const g = girderIndex(el)
          const count = Math.max(
            bridge.elements.filter((e) => e.groupId === el.groupId && e.scheduleNo === 201)
              .length,
            bridge.geometry?.girderCountPerSpan || 1,
          )
          const z = columnSpreadZ(count, roadHalf, g)
          const size = resolveSize(bridge, el)
          const sizeM = toSceneSizeM(size, {
            length: spanLenM,
            width: 0.45,
            height: 1.2,
          })
          const beamType = bridge.geometry?.beamType ?? 'open-ibeam'
          const h = Math.max(0.2, mToScene(bridge, sizeM.height, 'y'))
          const w = Math.max(0.12, mToScene(bridge, sizeM.width, 'z'))
          const len = spanLenScene * 0.92
          node = {
            element: el,
            position: [x, DECK_Y - h * 0.55, z],
            sizeM,
            color,
            faces: ['top', 'side', 'end'],
            parts:
              beamType === 't-beam'
                ? [
                    {
                      position: [0, h * 0.35, 0],
                      size: [len, h * 0.28, w * 1.8],
                      color,
                    },
                    {
                      position: [0, -h * 0.1, 0],
                      size: [len, h * 0.72, w * 0.45],
                      color,
                    },
                  ]
                : ibeamParts(len, h, w, color),
            kind: 'solid',
          }
          break
        }
        case 202: {
          const g = girderIndex(el)
          const siblings = bridge.elements.filter(
            (e) => e.groupId === el.groupId && e.scheduleNo === 202,
          )
          const count = Math.max(siblings.length, 1)
          const z = count > 1 ? columnSpreadZ(count, roadHalf, g) : 0
          const size = resolveSize(bridge, el)
          const sizeM = toSceneSizeM(size, {
            length: spanLenM,
            width: deckWidthM * 0.7,
            height: 1.6,
          })
          const h = Math.max(0.35, mToScene(bridge, sizeM.height, 'y'))
          const boxW =
            count > 1
              ? Math.max(0.35, mToScene(bridge, sizeM.width, 'z'))
              : roadW * 0.85
          node = {
            element: el,
            position: [x, DECK_Y - h * 0.45, z],
            sizeM,
            color,
            faces: ['top', 'front', 'end'],
            parts: [
              {
                position: [0, h * 0.2, 0],
                size: [spanLenScene * 0.92, h * 0.25, boxW],
                color,
              },
              {
                position: [0, -h * 0.15, boxW * 0.38],
                size: [spanLenScene * 0.92, h * 0.7, Math.max(0.1, boxW * 0.12)],
                color,
              },
              {
                position: [0, -h * 0.15, -boxW * 0.38],
                size: [spanLenScene * 0.92, h * 0.7, Math.max(0.1, boxW * 0.12)],
                color,
              },
              {
                position: [0, -h * 0.4, 0],
                size: [spanLenScene * 0.92, h * 0.2, boxW * 0.85],
                color,
              },
            ],
            kind: 'solid',
          }
          break
        }
        case 204: {
          // Open spandrel arch ribs — two parallel ribs under the deck
          const size = resolveSize(bridge, el)
          const sizeM = toSceneSizeM(size, {
            length: spanLenM,
            width: 0.55,
            height: 3.2,
          })
          const rise = Math.max(0.7, mToScene(bridge, sizeM.height, 'y'))
          const ribW = Math.max(0.12, mToScene(bridge, sizeM.width, 'z'))
          const ringT = Math.max(0.1, rise * 0.12)
          const zOff = roadHalf * 0.42
          node = {
            element: el,
            position: [x, DECK_Y - rise - 0.15, 0],
            sizeM,
            color,
            faces: ['front', 'side', 'top'],
            parts: [
              ...archBarrelParts(spanLenScene, rise, ringT, ribW, color, -zOff),
              ...archBarrelParts(spanLenScene, rise, ringT, ribW, color, zOff),
            ],
            kind: 'solid',
          }
          break
        }
        case 205: {
          // Closed spandrel arch — barrel + solid spandrel fill (diagram closed-spandrel)
          const size = resolveSize(bridge, el)
          const sizeM = toSceneSizeM(size, {
            length: spanLenM,
            width: deckWidthM * 0.75,
            height: 3.2,
          })
          const rise = Math.max(0.75, mToScene(bridge, sizeM.height, 'y'))
          const ringT = Math.max(0.12, rise * 0.14)
          const barrelW = Math.max(roadW * 0.55, mToScene(bridge, sizeM.width * 0.55, 'z'))
          node = {
            element: el,
            position: [x, DECK_Y - rise - 0.12, 0],
            sizeM,
            color,
            faces: ['front', 'side', 'top'],
            parts: [
              ...archBarrelParts(spanLenScene, rise, ringT, barrelW, color, 0, 16),
              ...closedSpandrelFillParts(spanLenScene, rise, roadW, color, 10),
            ],
            kind: 'solid',
          }
          break
        }
        case 206: {
          // Spandrel column — post from arch rib up to deck (open spandrel)
          const siblings = bridge.elements.filter(
            (e) => e.groupId === el.groupId && e.scheduleNo === 206,
          )
          const count = Math.max(siblings.length, 3)
          const idx = girderIndex(el)
          const size = resolveSize(bridge, el)
          const sizeM = toSceneSizeM(size, {
            length: 0.45,
            width: 0.45,
            height: 1.6,
          })
          const colW = Math.max(0.08, mToScene(bridge, sizeM.width, 'z'))
          const archSiblings = bridge.elements.filter(
            (e) => e.groupId === el.groupId && e.scheduleNo === 204,
          )
          const archSize = archSiblings[0]
            ? toSceneSizeM(resolveSize(bridge, archSiblings[0]), {
                length: spanLenM,
                width: 0.55,
                height: 3.2,
              })
            : { length: spanLenM, width: 0.55, height: 3.2 }
          const rise = Math.max(0.7, mToScene(bridge, archSize.height, 'y'))
          const L = spanLenScene * 0.88
          const half = L / 2
          // Keep posts off the springings
          const t = count <= 1 ? 0.5 : (idx - 0.5) / count
          const localX = -half + t * L
          const archY = archRiseAt(localX, half, rise)
          const topY = rise + 0.05
          const colH = Math.max(0.15, topY - archY)
          const zRib = roadHalf * 0.42
          node = {
            element: el,
            position: [x, DECK_Y - rise - 0.15, 0],
            sizeM,
            color,
            faces: ['front', 'side', 'end'],
            parts: [
              {
                position: [localX, archY + colH * 0.5, -zRib],
                size: [colW, colH, colW],
                color,
              },
              {
                position: [localX, archY + colH * 0.5, zRib],
                size: [colW, colH, colW],
                color,
              },
            ],
            kind: 'solid',
          }
          break
        }
        case 207: {
          // Spandrel walls along each elevation face
          const size = resolveSize(bridge, el)
          const sizeM = toSceneSizeM(size, {
            length: spanLenM,
            width: 0.35,
            height: 2.2,
          })
          const archEl = bridge.elements.find(
            (e) => e.groupId === el.groupId && e.scheduleNo === 205,
          )
          const archSize = archEl
            ? toSceneSizeM(resolveSize(bridge, archEl), {
                length: spanLenM,
                width: deckWidthM * 0.75,
                height: 3.2,
              })
            : { length: spanLenM, width: deckWidthM * 0.75, height: 3.2 }
          const rise = Math.max(0.75, mToScene(bridge, archSize.height, 'y'))
          const wallT = Math.max(0.06, mToScene(bridge, sizeM.width, 'z'))
          const z = roadHalf * 0.38
          node = {
            element: el,
            position: [x, DECK_Y - rise - 0.12, 0],
            sizeM,
            color,
            faces: ['front', 'side', 'top'],
            parts: [
              ...spandrelWallParts(spanLenScene, rise, wallT, -z, color),
              ...spandrelWallParts(spanLenScene, rise, wallT, z, color),
            ],
            kind: 'solid',
          }
          break
        }
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
        case 402: {
          const size = resolveSize(bridge, el)
          const sizeM = toSceneSizeM(size, {
            length: 1.2,
            width: deckWidthM * 0.7,
            height: 0.8,
          })
          const capH = Math.max(0.12, mToScene(bridge, sizeM.height, 'y'))
          const capW = Math.max(roadW * 0.6, mToScene(bridge, sizeM.width, 'z'))
          node = {
            element: el,
            position: [x, 0.95, 0],
            sizeM,
            color,
            faces: ['top', 'front', 'side'],
            parts: [
              {
                position: [0, 0, 0],
                size: [Math.max(0.4, mToScene(bridge, sizeM.length)), capH, capW],
                color,
              },
            ],
            kind: 'solid',
          }
          break
        }
        case 403: {
          const size = resolveSize(bridge, el)
          const sizeM = toSceneSizeM(size, {
            length: 0.8,
            width: deckWidthM * 0.7,
            height: 4,
          })
          const wallH = Math.max(0.8, mToScene(bridge, sizeM.height, 'y'))
          const wallW = Math.max(roadW * 0.55, mToScene(bridge, sizeM.width, 'z'))
          node = {
            element: el,
            position: [x, wallH * 0.35, 0],
            sizeM,
            color,
            faces: ['front', 'side', 'top'],
            parts: [
              {
                position: [0, 0, 0],
                size: [Math.max(0.25, mToScene(bridge, sizeM.length)), wallH, wallW],
                color,
              },
            ],
            kind: 'solid',
          }
          break
        }
        case 404:
        case 405:
        case 407: {
          const c = girderIndex(el)
          const siblings = bridge.elements.filter(
            (e) => e.groupId === el.groupId && e.scheduleNo === el.scheduleNo,
          )
          const count = Math.max(
            siblings.length,
            bridge.geometry?.columnsPerPier ?? 2,
          )
          const z = columnSpreadZ(count, roadHalf, c)
          const size = resolveSize(bridge, el)
          const sizeM = toSceneSizeM(size, {
            length: size.diameter ?? 0.9,
            width: size.diameter ?? 0.9,
            height: size.height ?? 4.5,
          })
          const colH = Math.max(0.7, mToScene(bridge, sizeM.height, 'y'))
          const dia = Math.max(
            0.18,
            mToScene(bridge, size.diameter ?? sizeM.width, 'z'),
          )
          const isTrestle = el.scheduleNo === 405
          node = {
            element: el,
            position: [x, colH * 0.35, z],
            sizeM,
            color,
            faces: ['front', 'side', 'top'],
            parts: isTrestle
              ? [
                  {
                    position: [0, 0, 0],
                    size: [dia * 1.2, colH, dia * 1.2],
                    color,
                  },
                ]
              : [
                  {
                    position: [0, 0, 0],
                    size: [dia, colH, dia],
                    shape: 'cylinder',
                    color,
                  },
                ],
            kind: 'solid',
          }
          break
        }
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
        case 400: {
          const size = resolveSize(bridge, el)
          const sizeM = toSceneSizeM(size, {
            length: 1.5,
            width: deckWidthM,
            height: 5,
          })
          const wallH = Math.max(0.9, mToScene(bridge, sizeM.height, 'y'))
          const wallT = Math.max(0.3, mToScene(bridge, sizeM.length))
          node = {
            element: el,
            position: [x, wallH * 0.4, 0],
            sizeM,
            color,
            faces: ['front', 'side', 'top'],
            parts: [
              {
                position: [0, 0, 0],
                size: [wallT, wallH, roadW + 0.4],
                color,
              },
              {
                position: [side * -0.2, wallH * 0.4, 0],
                size: [wallT * 0.8, 0.2, roadW + 0.2],
                color: '#94a3b8',
              },
            ],
            kind: 'solid',
          }
          break
        }
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
        case 404:
        case 405:
        case 407: {
          const c = girderIndex(el)
          const siblings = bridge.elements.filter(
            (e) => e.groupId === el.groupId && e.scheduleNo === el.scheduleNo,
          )
          const count = Math.max(
            siblings.length,
            bridge.geometry?.columnsPerAbutment ?? 4,
          )
          const z = columnSpreadZ(count, roadHalf, c)
          const size = resolveSize(bridge, el)
          const sizeM = toSceneSizeM(size, {
            length: size.diameter ?? 0.9,
            width: size.diameter ?? 0.9,
            height: size.height ?? 4.5,
          })
          const colH = Math.max(0.7, mToScene(bridge, sizeM.height, 'y'))
          const dia = Math.max(
            0.18,
            mToScene(bridge, size.diameter ?? sizeM.width, 'z'),
          )
          node = {
            element: el,
            position: [x, colH * 0.35, z],
            sizeM,
            color,
            faces: ['front', 'side', 'top'],
            parts: [
              {
                position: [0, 0, 0],
                size: [dia, colH, dia],
                shape: el.scheduleNo === 405 ? 'box' : 'cylinder',
                color,
              },
            ],
            kind: 'solid',
          }
          break
        }
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
