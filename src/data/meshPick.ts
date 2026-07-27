/**
 * Map a Three.js mesh raycast hit onto an element face + UV (0–1).
 * Used so defect / drawing clicks land on the exact surface point.
 */

import * as THREE from 'three'
import type { DefectFace } from './defectTypes'

export type MeshHitUv = {
  face: DefectFace
  /** Face-local UV, origin at face corner, y down for drawing board consistency */
  uv: { x: number; y: number }
  /** World-space hit point */
  point: [number, number, number]
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

/**
 * Infer face + UV from a hit on a box-like part (axis-aligned in part local space).
 * `localPoint` and `localNormal` must be in the mesh/part local frame.
 */
export function hitToFaceUv(
  localPoint: THREE.Vector3,
  localNormal: THREE.Vector3,
  size: [number, number, number],
  allowed?: DefectFace[],
): Omit<MeshHitUv, 'point'> | null {
  const [sx, sy, sz] = size
  if (sx <= 0 || sy <= 0 || sz <= 0) return null

  const hx = sx / 2
  const hy = sy / 2
  const hz = sz / 2
  const nx = localNormal.x
  const ny = localNormal.y
  const nz = localNormal.z
  const ax = Math.abs(nx)
  const ay = Math.abs(ny)
  const az = Math.abs(nz)

  let face: DefectFace
  let u: number
  let v: number

  if (ay >= ax && ay >= az) {
    // ±Y → top (plan). Drawing y runs along +Z.
    face = 'top'
    u = (localPoint.x + hx) / sx
    v = (localPoint.z + hz) / sz
  } else if (az >= ax) {
    // ±Z → front elevation (along span X, up Y)
    face = 'front'
    u = (localPoint.x + hx) / sx
    v = 1 - (localPoint.y + hy) / sy // flip so top of element is top of board
  } else {
    // ±X → end section (across Z, up Y)
    face = 'end'
    u = (localPoint.z + hz) / sz
    v = 1 - (localPoint.y + hy) / sy
  }

  // Remap to "side" if end isn't allowed but side is (transverse elevation)
  if (allowed?.length) {
    if (!allowed.includes(face)) {
      if (face === 'end' && allowed.includes('side')) face = 'side'
      else if (face === 'front' && allowed.includes('side') && !allowed.includes('front')) {
        face = 'side'
        u = (localPoint.z + hz) / sz
        v = 1 - (localPoint.y + hy) / sy
      } else if (face === 'top' && !allowed.includes('top') && allowed.includes('front')) {
        face = 'front'
        u = (localPoint.x + hx) / sx
        v = 1 - (localPoint.y + hy) / sy
      } else if (!allowed.includes(face)) {
        face = allowed[0]
      }
    }
  }

  return {
    face,
    uv: { x: clamp01(u), y: clamp01(v) },
  }
}

/**
 * Convert a R3F / three pointer event hit on a mesh into face UV.
 * Works for box and cylinder parts (cylinder approximated via local bounds).
 */
export function pickFaceFromEvent(
  event: {
    point: THREE.Vector3
    face?: THREE.Face | null
    object: THREE.Object3D
  },
  partSize: [number, number, number],
  allowed?: DefectFace[],
): MeshHitUv | null {
  const mesh = event.object as THREE.Mesh
  const localPoint = mesh.worldToLocal(event.point.clone())

  let localNormal = new THREE.Vector3(0, 1, 0)
  if (event.face?.normal) {
    // BoxBufferGeometry face normals are in local space
    localNormal = event.face.normal.clone().normalize()
  } else {
    // Fallback: dominant axis from local point vs box
    const [sx, sy, sz] = partSize
    const scores: Array<[number, THREE.Vector3]> = [
      [Math.abs(localPoint.y) / (sy / 2 || 1), new THREE.Vector3(0, Math.sign(localPoint.y) || 1, 0)],
      [Math.abs(localPoint.z) / (sz / 2 || 1), new THREE.Vector3(0, 0, Math.sign(localPoint.z) || 1)],
      [Math.abs(localPoint.x) / (sx / 2 || 1), new THREE.Vector3(Math.sign(localPoint.x) || 1, 0, 0)],
    ]
    scores.sort((a, b) => b[0] - a[0])
    localNormal = scores[0][1]
  }

  const mapped = hitToFaceUv(localPoint, localNormal, partSize, allowed)
  if (!mapped) return null

  return {
    ...mapped,
    point: [event.point.x, event.point.y, event.point.z],
  }
}
