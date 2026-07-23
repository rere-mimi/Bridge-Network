import { useEffect, useMemo, useRef, useState } from 'react'
import {
  defaultDefectCode,
  FACE_LABEL,
  labelForDrawnDefect,
  type DefectFace,
} from '../data/defectTypes'
import { faceMetres, measureDrawnDefect, type NormPoint } from '../data/defectMetrics'
import type { DrawnDefect, DrawnDefectKind } from '../types'

type DefectDrawLayerProps = {
  active: boolean
  tool: DrawnDefectKind | null
  defects: DrawnDefect[]
  /** Real-world size of the pinned element (metres) */
  elementSizeM: { length: number; width: number; height: number }
  face: DefectFace
  onComplete: (defect: DrawnDefect) => void
  /** Required — defects pin to this element and cannot leave it */
  selectedElementId: string | null
  elementName?: string | null
  material?: string | null
  defectCode?: string
}

type FaceRect = { x: number; y: number; w: number; h: number }

function dist(a: NormPoint, b: NormPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

function quantize(p: NormPoint): NormPoint {
  return {
    x: Math.round(clamp01(p.x) * 10000) / 10000,
    y: Math.round(clamp01(p.y) * 10000) / 10000,
  }
}

/** Centered face board matching element face aspect ratio (viewport 0–1 space). */
export function computeFaceRect(
  sizeM: { length: number; width: number; height: number },
  face: DefectFace,
): FaceRect {
  const metres = faceMetres(sizeM, face)
  const aspect = metres.horizontalM / Math.max(metres.verticalM, 0.05)
  const maxW = 0.78
  const maxH = 0.72
  let w: number
  let h: number
  if (aspect >= 1) {
    w = maxW
    h = Math.min(maxH, maxW / aspect)
  } else {
    h = maxH
    w = Math.min(maxW, maxH * aspect)
  }
  return {
    x: (1 - w) / 2,
    y: (1 - h) / 2 + 0.02,
    w,
    h,
  }
}

function pointInFace(p: NormPoint, face: FaceRect, margin = 0): boolean {
  return (
    p.x >= face.x - margin &&
    p.x <= face.x + face.w + margin &&
    p.y >= face.y - margin &&
    p.y <= face.y + face.h + margin
  )
}

/** Map viewport point → face-local UV (0–1), clamped to element limits. */
function toFaceUv(p: NormPoint, face: FaceRect): NormPoint {
  return quantize({
    x: (p.x - face.x) / face.w,
    y: (p.y - face.y) / face.h,
  })
}

/** Map face-local UV → viewport point for rendering inside the element board. */
function fromFaceUv(uv: NormPoint, face: FaceRect): NormPoint {
  return {
    x: face.x + clamp01(uv.x) * face.w,
    y: face.y + clamp01(uv.y) * face.h,
  }
}

const STROKE = {
  crack: 0.0024,
  area: 0.002,
  vertex: 0.0018,
  vertexR: 0.0048,
}

export function DefectDrawLayer({
  active,
  tool,
  defects,
  elementSizeM,
  face,
  onComplete,
  selectedElementId,
  elementName,
  material,
  defectCode,
}: DefectDrawLayerProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [draft, setDraft] = useState<NormPoint[]>([])
  const [cursor, setCursor] = useState<NormPoint | null>(null)
  const draftRef = useRef<NormPoint[]>([])
  const toolRef = useRef(tool)
  const onCompleteRef = useRef(onComplete)
  const defectCodeRef = useRef(defectCode)
  const materialRef = useRef(material)
  const faceRef = useRef(face)
  const sizeRef = useRef(elementSizeM)
  const elementIdRef = useRef(selectedElementId)

  const faceRect = useMemo(
    () => computeFaceRect(elementSizeM, face),
    [elementSizeM, face],
  )
  const faceRectRef = useRef(faceRect)

  useEffect(() => {
    draftRef.current = draft
  }, [draft])
  useEffect(() => {
    toolRef.current = tool
  }, [tool])
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])
  useEffect(() => {
    defectCodeRef.current = defectCode
  }, [defectCode])
  useEffect(() => {
    materialRef.current = material
  }, [material])
  useEffect(() => {
    faceRef.current = face
  }, [face])
  useEffect(() => {
    sizeRef.current = elementSizeM
  }, [elementSizeM])
  useEffect(() => {
    elementIdRef.current = selectedElementId
  }, [selectedElementId])
  useEffect(() => {
    faceRectRef.current = faceRect
  }, [faceRect])

  // Changing element / face clears draft — defects cannot move between elements.
  useEffect(() => {
    setDraft([])
    setCursor(null)
  }, [tool, active, face, selectedElementId])

  function buildDefect(points: NormPoint[], currentTool: DrawnDefectKind): DrawnDefect | null {
    const elementId = elementIdRef.current
    if (!elementId) return null

    // Force every vertex inside the element face (0–1 UV).
    const clamped = points.map((p) => quantize(p))
    const minPoints = currentTool === 'crack' ? 2 : 3
    if (clamped.length < minPoints) return null

    const closed =
      currentTool !== 'crack' &&
      clamped.length > 2 &&
      dist(clamped[0], clamped[clamped.length - 1]) < 0.02
        ? clamped.slice(0, -1)
        : clamped

    const code =
      defectCodeRef.current ?? defaultDefectCode(currentTool, materialRef.current)
    const faceId = faceRef.current
    const metrics = measureDrawnDefect(currentTool, closed, faceId, sizeRef.current)

    return {
      id: `drawn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      kind: currentTool,
      defectCode: code,
      points: closed,
      label: labelForDrawnDefect(currentTool, code, materialRef.current),
      createdAt: new Date().toISOString(),
      elementId,
      face: faceId,
      material: (() => {
        const m = materialRef.current?.trim().charAt(0).toUpperCase()
        return m === 'S' || m === 'P' || m === 'C' || m === 'T' || m === 'M' || m === 'O'
          ? m
          : undefined
      })(),
      lengthM: metrics.lengthM,
      areaM2: metrics.areaM2,
      lengthDensityMPerM2: metrics.lengthDensityMPerM2,
      faceAreaM2: metrics.faceAreaM2,
      equivAreaM2: metrics.equivAreaM2,
    }
  }

  function finish(points: NormPoint[]) {
    const currentTool = toolRef.current
    if (!currentTool || !elementIdRef.current) return
    const defect = buildDefect(points, currentTool)
    if (!defect) return
    onCompleteRef.current(defect)
    setDraft([])
    setCursor(null)
  }

  useEffect(() => {
    if (!active || !tool) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDraft([])
        return
      }
      if (event.key === 'Enter') {
        finish(draftRef.current)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, tool])

  function toViewport(event: { clientX: number; clientY: number }): NormPoint | null {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return null
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    }
  }

  /** Only returns a face UV when the pointer is inside the selected element board. */
  function toPinnedUv(event: { clientX: number; clientY: number }): NormPoint | null {
    const vp = toViewport(event)
    if (!vp) return null
    const board = faceRectRef.current
    if (!pointInFace(vp, board, 0.002)) return null
    return toFaceUv(vp, board)
  }

  const pinnedDefects = selectedElementId
    ? defects.filter(
        (d) => d.elementId === selectedElementId && (!d.face || d.face === face),
      )
    : []

  const metres = faceMetres(elementSizeM, face)
  const clipId = `element-face-clip-${selectedElementId ?? 'none'}-${face}`

  if (!active) {
    if (!selectedElementId) return null
    return (
      <svg className="defect-layer readonly" viewBox="0 0 1 1" preserveAspectRatio="none">
        <defs>
          <clipPath id={`${clipId}-ro`} clipPathUnits="userSpaceOnUse">
            <rect x={faceRect.x} y={faceRect.y} width={faceRect.w} height={faceRect.h} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId}-ro)`}>
          {renderDefects(pinnedDefects, faceRect)}
        </g>
        <rect
          x={faceRect.x}
          y={faceRect.y}
          width={faceRect.w}
          height={faceRect.h}
          fill="none"
          stroke="rgba(125,211,252,0.28)"
          strokeWidth="0.0025"
        />
      </svg>
    )
  }

  if (!selectedElementId) {
    return (
      <svg className="defect-layer active" viewBox="0 0 1 1" preserveAspectRatio="none">
        <rect x="0" y="0" width="1" height="1" fill="rgba(8,15,28,0.45)" />
        <text x="0.5" y="0.5" textAnchor="middle" fill="#e2e8f0" fontSize="0.035">
          Select an element first — defects stay inside that element
        </text>
      </svg>
    )
  }

  const preview = cursor && draft.length ? [...draft, cursor] : draft
  const previewVp = preview.map((uv) => fromFaceUv(uv, faceRect))

  return (
    <svg
      ref={svgRef}
      className={`defect-layer active tool-${tool ?? 'none'} element-locked`}
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      onPointerMove={(e) => {
        const uv = toPinnedUv(e)
        setCursor(uv)
      }}
      onPointerLeave={() => setCursor(null)}
      onClick={(e) => {
        if (!tool || !selectedElementId) return
        const uv = toPinnedUv(e)
        if (!uv) return // outside element limits — ignore

        if (tool !== 'crack' && draft.length >= 3 && dist(draft[0], uv) < 0.02) {
          finish([...draft, draft[0]])
          return
        }

        const next = [...draft, uv]
        setDraft(next)

        if (e.detail === 2) {
          finish(next)
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        finish(draft)
      }}
    >
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <rect x={faceRect.x} y={faceRect.y} width={faceRect.w} height={faceRect.h} />
        </clipPath>
      </defs>

      {/* Dim everything outside the selected element face — drawing is blocked there */}
      <path
        d={`M0,0 H1 V1 H0 Z M${faceRect.x},${faceRect.y} h${faceRect.w} v${faceRect.h} h${-faceRect.w} Z`}
        fill="rgba(8, 15, 28, 0.62)"
        fillRule="evenodd"
        style={{ pointerEvents: 'none' }}
      />

      {/* Element face board */}
      <rect
        x={faceRect.x}
        y={faceRect.y}
        width={faceRect.w}
        height={faceRect.h}
        fill="rgba(14, 165, 233, 0.06)"
        stroke="#38bdf8"
        strokeWidth="0.0035"
      />
      {/* Grid to reinforce element limits */}
      {[0.25, 0.5, 0.75].map((t) => (
        <g key={t} style={{ pointerEvents: 'none' }}>
          <line
            x1={faceRect.x + faceRect.w * t}
            y1={faceRect.y}
            x2={faceRect.x + faceRect.w * t}
            y2={faceRect.y + faceRect.h}
            stroke="rgba(148,163,184,0.22)"
            strokeWidth="0.0012"
          />
          <line
            x1={faceRect.x}
            y1={faceRect.y + faceRect.h * t}
            x2={faceRect.x + faceRect.w}
            y2={faceRect.y + faceRect.h * t}
            stroke="rgba(148,163,184,0.22)"
            strokeWidth="0.0012"
          />
        </g>
      ))}

      <text
        x={faceRect.x + 0.012}
        y={faceRect.y - 0.018}
        fill="rgba(186,230,253,0.95)"
        fontSize="0.024"
      >
        {elementName ? `${elementName} · ` : ''}
        {FACE_LABEL[face]} · {metres.horizontalM.toFixed(2)}×{metres.verticalM.toFixed(2)} m ·
        locked to element
      </text>

      <g clipPath={`url(#${clipId})`}>
        {renderDefects(pinnedDefects, faceRect)}

        {previewVp.length > 0 && tool === 'crack' && (
          <polyline
            points={previewVp.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#ef4444"
            strokeWidth={STROKE.crack}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {previewVp.length > 0 && tool && tool !== 'crack' && (
          <polygon
            points={previewVp.map((p) => `${p.x},${p.y}`).join(' ')}
            fill={tool === 'patch' ? 'rgba(56,189,248,0.16)' : 'rgba(249,115,22,0.2)'}
            stroke={tool === 'patch' ? '#38bdf8' : '#f97316'}
            strokeWidth={STROKE.area}
          />
        )}

        {draft.map((uv, i) => {
          const p = fromFaceUv(uv, faceRect)
          return (
            <circle
              key={`${uv.x}-${uv.y}-${i}`}
              cx={p.x}
              cy={p.y}
              r={STROKE.vertexR}
              fill="#f8fafc"
              stroke="#ef4444"
              strokeWidth={STROKE.vertex}
            />
          )
        })}
      </g>

      {!cursor && tool && (
        <text
          x="0.5"
          y={faceRect.y + faceRect.h + 0.04}
          textAnchor="middle"
          fill="rgba(148,163,184,0.9)"
          fontSize="0.022"
        >
          Draw only inside the highlighted element face — clicks outside are ignored
        </text>
      )}
    </svg>
  )
}

function renderDefects(defects: DrawnDefect[], faceRect: FaceRect) {
  return defects.map((defect) => {
    const pts = defect.points.map((uv) => fromFaceUv(uv, faceRect))
    if (defect.kind === 'crack') {
      return (
        <polyline
          key={defect.id}
          points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="#ef4444"
          strokeWidth={STROKE.crack}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )
    }
    return (
      <polygon
        key={defect.id}
        points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
        fill={
          defect.kind === 'patch' ? 'rgba(56,189,248,0.18)' : 'rgba(249,115,22,0.22)'
        }
        stroke={defect.kind === 'patch' ? '#38bdf8' : '#f97316'}
        strokeWidth={STROKE.area}
      />
    )
  })
}
