/**
 * Support-axis windows for multi-span bridges, and opening axes for culverts.
 *
 * Bridge convention (N spans → N+1 axes along the road / X):
 *   Axis 1     = Abutment A1 (start)
 *   Axis 2..N  = Piers P1..P(N-1)
 *   Axis N+1   = Abutment A2 (end)
 *
 * Culvert convention (opening faces along the stream / Z, ⊥ to the road):
 *   Axis 1 = Inlet opening
 *   Axis 2 = Outlet opening
 *
 * When spans > 2, the user picks a 3-axis window to view, e.g.:
 *   Axis 1–3, Axis 2–4, Axis 3–5, …
 * Each window covers two consecutive spans and is remapped to fill the 3D view
 * so short spans (e.g. Rakaia ~12 m) stay readable between piers.
 */

import type { BridgeAsset, BridgeElement } from '../types'
import {
  AXIS_WINDOW_VIEW_WIDTH,
  abutmentX,
  pierX,
} from './sceneMetrics'
import { culvertSceneMetrics, structureIsCulvert } from './sceneLayout'

export type BridgeAxisKind = 'abutment' | 'pier' | 'opening'

export type BridgeAxis = {
  /** 1-based axis index along the structure */
  index: number
  /** Short UI label, e.g. "Axis 1" */
  label: string
  /** Detail, e.g. "A1 abutment" / "Inlet opening" */
  detail: string
  kind: BridgeAxisKind
  groupId: string
  /** Scene X of the support line (road direction). Culvert openings use 0. */
  xScene: number
  /**
   * Scene Z of the axis line. Culvert openings sit on the barrel faces
   * (perpendicular to the road). Bridges leave this undefined (Z = 0).
   */
  zScene?: number
  /** Plan alignment of the axis line. */
  alignment?: 'road' | 'opening'
}

export type AxisWindow = {
  id: string
  startAxis: number
  endAxis: number
  /** e.g. "Axis 1 – 3" */
  label: string
  /** Spans visible in this window, e.g. ["S1","S2"] */
  spanGroupIds: string[]
  /** Support group ids in range, e.g. ["A1","P1","P2"] */
  supportGroupIds: string[]
  /** Mid X of the window in scene units (unscaled layout) */
  centreX: number
  /** Width of the window in unscaled scene units (2 spans) */
  widthScene: number
  /** Approximate real length of the window (m) */
  widthM: number
}

/** True when the structure needs an axis-window selector. */
export function needsAxisWindow(bridge: BridgeAsset): boolean {
  if (bridge.kind && bridge.kind !== 'bridge') return false
  if (bridge.family?.includes('culvert')) return false
  if (bridge.family === 'retaining-wall' || bridge.family === 'noise-wall') return false
  if (bridge.family?.startsWith('tunnel')) return false
  return bridge.spans > 2
}

/** Build ordered support axes for a bridge, or opening axes for a culvert. */
export function buildBridgeAxes(bridge: BridgeAsset): BridgeAxis[] {
  if (structureIsCulvert(bridge)) {
    const { inletZ, outletZ } = culvertSceneMetrics(bridge)
    return [
      {
        index: 1,
        label: 'Axis 1',
        detail: 'Inlet opening',
        kind: 'opening',
        groupId: 'IN',
        xScene: 0,
        zScene: inletZ,
        alignment: 'opening',
      },
      {
        index: 2,
        label: 'Axis 2',
        detail: 'Outlet opening',
        kind: 'opening',
        groupId: 'OUT',
        xScene: 0,
        zScene: outletZ,
        alignment: 'opening',
      },
    ]
  }

  const spans = Math.max(bridge.spans, 1)
  const axes: BridgeAxis[] = []

  axes.push({
    index: 1,
    label: 'Axis 1',
    detail: 'A1 abutment',
    kind: 'abutment',
    groupId: 'A1',
    xScene: abutmentX(-1, spans),
    alignment: 'road',
  })

  for (let p = 1; p <= spans - 1; p++) {
    const axisIndex = p + 1
    axes.push({
      index: axisIndex,
      label: `Axis ${axisIndex}`,
      detail: `P${p} pier`,
      kind: 'pier',
      groupId: `P${p}`,
      xScene: pierX(p, spans),
      alignment: 'road',
    })
  }

  const last = spans + 1
  axes.push({
    index: last,
    label: `Axis ${last}`,
    detail: 'A2 abutment',
    kind: 'abutment',
    groupId: 'A2',
    xScene: abutmentX(1, spans),
    alignment: 'road',
  })

  return axes
}

/**
 * Sliding 3-axis windows: 1–3, 2–4, 3–5, …
 * Empty when spans ≤ 2 (whole bridge is shown).
 */
export function buildAxisWindows(bridge: BridgeAsset): AxisWindow[] {
  if (!needsAxisWindow(bridge)) return []
  const axes = buildBridgeAxes(bridge)
  const spans = Math.max(bridge.spans, 1)
  const spanLenM = bridge.lengthM / spans
  const windows: AxisWindow[] = []
  for (let start = 1; start <= axes.length - 2; start++) {
    const end = start + 2
    const a0 = axes[start - 1]
    const a1 = axes[start]
    const a2 = axes[start + 1]
    // Spans between consecutive axes: axis k → k+1 is span S(k)
    const spanGroupIds = [`S${start}`, `S${start + 1}`]
    const widthScene = a2.xScene - a0.xScene
    windows.push({
      id: `${start}-${end}`,
      startAxis: start,
      endAxis: end,
      label: `Axis ${start} – ${end}`,
      spanGroupIds,
      supportGroupIds: [a0.groupId, a1.groupId, a2.groupId],
      centreX: (a0.xScene + a2.xScene) / 2,
      widthScene,
      widthM: spanLenM * 2,
    })
  }
  return windows
}

export function findAxisWindow(bridge: BridgeAsset, windowId: string | null): AxisWindow | null {
  const windows = buildAxisWindows(bridge)
  if (!windows.length) return null
  return windows.find((w) => w.id === windowId) ?? windows[0]
}

/** Axes that fall inside the selected window (for labels). */
export function axesInWindow(bridge: BridgeAsset, window: AxisWindow | null): BridgeAxis[] {
  const axes = buildBridgeAxes(bridge)
  if (!window) return axes
  return axes.filter((a) => a.index >= window.startAxis && a.index <= window.endAxis)
}

/**
 * Whether an inventory element belongs to the selected axis window.
 * When window is null, everything is visible.
 */
export function elementInAxisWindow(
  element: BridgeElement,
  window: AxisWindow | null,
): boolean {
  if (!window) return true
  const gid = element.groupId
  if (window.spanGroupIds.includes(gid)) return true
  if (window.supportGroupIds.includes(gid)) return true
  // Approaches: AP1 with A1, AP2 with A2
  if (gid === 'AP1' && window.supportGroupIds.includes('A1')) return true
  if (gid === 'AP2' && window.supportGroupIds.includes('A2')) return true
  return false
}

/**
 * Remap a compressed multi-span layout so the selected 3-axis window fills the view.
 * Uniform scale keeps pier / span proportions while spreading axes apart on screen.
 */
export function axisWindowViewTransform(window: AxisWindow | null): {
  scale: number
  offsetX: number
} {
  if (!window) return { scale: 1, offsetX: 0 }
  const scale = AXIS_WINDOW_VIEW_WIDTH / Math.max(window.widthScene, 0.05)
  return {
    scale,
    offsetX: -window.centreX * scale,
  }
}

/** Map an unscaled scene point into the remapped axis-window frame. */
export function toAxisViewPoint(
  point: [number, number, number],
  transform: { scale: number; offsetX: number },
): [number, number, number] {
  const { scale, offsetX } = transform
  return [point[0] * scale + offsetX, point[1] * scale, point[2] * scale]
}

export function axisWindowCaption(window: AxisWindow | null, spans: number): string {
  if (!window) return `All ${spans} spans`
  const metres =
    window.widthM >= 10
      ? `${Math.round(window.widthM)} m`
      : `${window.widthM.toFixed(1)} m`
  return `${window.label} · ${window.spanGroupIds.join(' + ')} · ${metres}`
}
