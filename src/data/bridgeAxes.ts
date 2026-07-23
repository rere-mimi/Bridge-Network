/**
 * Support-axis windows for multi-span bridges.
 *
 * Convention (N spans → N+1 axes):
 *   Axis 1     = Abutment A1 (start)
 *   Axis 2..N  = Piers P1..P(N-1)
 *   Axis N+1   = Abutment A2 (end)
 *
 * When spans > 2, the user picks a 3-axis window to view, e.g.:
 *   Axis 1–3, Axis 2–4, Axis 3–5, …
 * Each window covers two consecutive spans.
 */

import type { BridgeAsset, BridgeElement } from '../types'

export type BridgeAxisKind = 'abutment' | 'pier'

export type BridgeAxis = {
  /** 1-based axis index along the structure */
  index: number
  /** Short UI label, e.g. "Axis 1" */
  label: string
  /** Detail, e.g. "A1 abutment" / "P2 pier" */
  detail: string
  kind: BridgeAxisKind
  groupId: string
  /** Scene X of the support line (same convention as sceneLayout) */
  xScene: number
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
  /** Mid X of the window in scene units */
  centreX: number
}

const SCENE_LENGTH = 10

function pierX(pierIndex: number, spans: number): number {
  const spanLen = SCENE_LENGTH / Math.max(spans, 1)
  return -SCENE_LENGTH / 2 + spanLen * pierIndex
}

/** True when the structure needs an axis-window selector. */
export function needsAxisWindow(bridge: BridgeAsset): boolean {
  if (bridge.kind && bridge.kind !== 'bridge') return false
  if (bridge.family?.includes('culvert')) return false
  if (bridge.family === 'retaining-wall' || bridge.family === 'noise-wall') return false
  if (bridge.family?.startsWith('tunnel')) return false
  return bridge.spans > 2
}

/** Build ordered support axes for a bridge (abutment → piers → abutment). */
export function buildBridgeAxes(bridge: BridgeAsset): BridgeAxis[] {
  const spans = Math.max(bridge.spans, 1)
  const axes: BridgeAxis[] = []

  axes.push({
    index: 1,
    label: 'Axis 1',
    detail: 'A1 abutment',
    kind: 'abutment',
    groupId: 'A1',
    xScene: -SCENE_LENGTH / 2,
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
    })
  }

  const last = spans + 1
  axes.push({
    index: last,
    label: `Axis ${last}`,
    detail: 'A2 abutment',
    kind: 'abutment',
    groupId: 'A2',
    xScene: SCENE_LENGTH / 2,
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
  const windows: AxisWindow[] = []
  for (let start = 1; start <= axes.length - 2; start++) {
    const end = start + 2
    const a0 = axes[start - 1]
    const a1 = axes[start]
    const a2 = axes[start + 1]
    // Spans between consecutive axes: axis k → k+1 is span S(k)
    const spanGroupIds = [`S${start}`, `S${start + 1}`]
    windows.push({
      id: `${start}-${end}`,
      startAxis: start,
      endAxis: end,
      label: `Axis ${start} – ${end}`,
      spanGroupIds,
      supportGroupIds: [a0.groupId, a1.groupId, a2.groupId],
      centreX: (a0.xScene + a2.xScene) / 2,
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

export function axisWindowCaption(window: AxisWindow | null, spans: number): string {
  if (!window) return `All ${spans} spans`
  return `${window.label} · ${window.spanGroupIds.join(' + ')}`
}
