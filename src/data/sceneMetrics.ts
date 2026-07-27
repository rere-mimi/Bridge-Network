/**
 * Shared bridge longitudinal layout metrics for the 3D twin.
 *
 * Short multi-span bridges (e.g. Rakaia: 144 × ~12 m) must not crush each span
 * into a sliver of a fixed 10-unit box — otherwise piers look adjacent with no
 * deck gap. Each span gets at least MIN_SPAN_SCENE units; long bridges grow
 * beyond SCENE_LENGTH and axis windows remap into the camera frame.
 */

export const SCENE_LENGTH = 10

/** Minimum scene width per span so ~12 m spans stay visually open between piers. */
export const MIN_SPAN_SCENE = 3.2

/** Target remapped width for a 3-axis (2-span) window in the viewer. */
export const AXIS_WINDOW_VIEW_WIDTH = 10

export function spanSceneLength(spans: number): number {
  return Math.max(SCENE_LENGTH / Math.max(spans, 1), MIN_SPAN_SCENE)
}

export function bridgeSceneLength(spans: number): number {
  return spanSceneLength(spans) * Math.max(spans, 1)
}

export function spanCentreX(spanIndex: number, spans: number): number {
  const pitch = spanSceneLength(spans)
  const total = bridgeSceneLength(spans)
  return -total / 2 + pitch * (spanIndex - 0.5)
}

/** Pier index 1..N-1 along N spans. */
export function pierX(pierIndex: number, spans: number): number {
  const pitch = spanSceneLength(spans)
  const total = bridgeSceneLength(spans)
  return -total / 2 + pitch * pierIndex
}

export function abutmentX(side: -1 | 1, spans: number): number {
  return side * (bridgeSceneLength(spans) / 2)
}

/** Keep support thickness from swallowing the span clear gap. */
export function alongSpanSize(
  sizeScene: number,
  spanLenScene: number,
  maxFrac = 0.2,
): number {
  const cap = Math.max(spanLenScene * maxFrac, 0.08)
  return Math.min(Math.max(sizeScene, 0.08), cap)
}
