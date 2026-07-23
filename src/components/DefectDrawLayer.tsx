import { useEffect, useRef, useState } from 'react'
import {
  defaultDefectCode,
  FACE_LABEL,
  labelForDrawnDefect,
  type DefectFace,
} from '../data/defectTypes'
import { measureDrawnDefect, type NormPoint } from '../data/defectMetrics'
import type { DrawnDefect, DrawnDefectKind } from '../types'

type DefectDrawLayerProps = {
  active: boolean
  tool: DrawnDefectKind | null
  defects: DrawnDefect[]
  /** Real-world size of the pinned element (metres) */
  elementSizeM: { length: number; width: number; height: number }
  face: DefectFace
  onComplete: (defect: DrawnDefect) => void
  /** Required — defects pin to this element */
  selectedElementId: string | null
  material?: string | null
  defectCode?: string
}

function dist(a: NormPoint, b: NormPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function quantize(p: NormPoint): NormPoint {
  return {
    x: Math.round(Math.min(1, Math.max(0, p.x)) * 10000) / 10000,
    y: Math.round(Math.min(1, Math.max(0, p.y)) * 10000) / 10000,
  }
}

const STROKE = {
  crack: 0.0028,
  area: 0.0022,
  vertex: 0.002,
  vertexR: 0.0055,
}

export function DefectDrawLayer({
  active,
  tool,
  defects,
  elementSizeM,
  face,
  onComplete,
  selectedElementId,
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
    setDraft([])
    setCursor(null)
  }, [tool, active, face, selectedElementId])

  function buildDefect(points: NormPoint[], currentTool: DrawnDefectKind): DrawnDefect | null {
    const elementId = elementIdRef.current
    if (!elementId) return null

    const minPoints = currentTool === 'crack' ? 2 : 3
    if (points.length < minPoints) return null

    const closed =
      currentTool !== 'crack' &&
      points.length > 2 &&
      dist(points[0], points[points.length - 1]) < 0.018
        ? points.slice(0, -1)
        : points

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
    if (!currentTool) return
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

  function toNorm(event: { clientX: number; clientY: number }): NormPoint | null {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return null
    return quantize({
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    })
  }

  const pinnedDefects = selectedElementId
    ? defects.filter((d) => d.elementId === selectedElementId && (!d.face || d.face === face))
    : []

  if (!active) {
    return (
      <svg className="defect-layer readonly" viewBox="0 0 1 1" preserveAspectRatio="none">
        {renderDefects(selectedElementId ? defects.filter((d) => d.elementId === selectedElementId) : defects)}
      </svg>
    )
  }

  const preview = cursor && draft.length ? [...draft, cursor] : draft

  return (
    <svg
      ref={svgRef}
      className={`defect-layer active tool-${tool ?? 'none'}`}
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      onPointerMove={(e) => {
        const p = toNorm(e)
        if (p) setCursor(p)
      }}
      onPointerLeave={() => setCursor(null)}
      onClick={(e) => {
        if (!tool || !selectedElementId) return
        const p = toNorm(e)
        if (!p) return

        if (tool !== 'crack' && draft.length >= 3 && dist(draft[0], p) < 0.018) {
          finish([...draft, draft[0]])
          return
        }

        const next = [...draft, p]
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
      {/* Face frame — makes the pinned face boundary obvious */}
      <rect
        x="0.01"
        y="0.01"
        width="0.98"
        height="0.98"
        fill="none"
        stroke="rgba(125,211,252,0.35)"
        strokeWidth="0.003"
        strokeDasharray="0.02 0.012"
      />
      <text x="0.02" y="0.045" fill="rgba(186,230,253,0.85)" fontSize="0.028">
        {FACE_LABEL[face]} · pin to element
      </text>

      {renderDefects(pinnedDefects)}

      {preview.length > 0 && tool === 'crack' && (
        <polyline
          points={preview.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="#ef4444"
          strokeWidth={STROKE.crack}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {preview.length > 0 && tool && tool !== 'crack' && (
        <polygon
          points={preview.map((p) => `${p.x},${p.y}`).join(' ')}
          fill={tool === 'patch' ? 'rgba(56,189,248,0.16)' : 'rgba(249,115,22,0.2)'}
          stroke={tool === 'patch' ? '#38bdf8' : '#f97316'}
          strokeWidth={STROKE.area}
        />
      )}

      {draft.map((p, i) => (
        <circle
          key={`${p.x}-${p.y}-${i}`}
          cx={p.x}
          cy={p.y}
          r={STROKE.vertexR}
          fill="#f8fafc"
          stroke="#ef4444"
          strokeWidth={STROKE.vertex}
        />
      ))}
    </svg>
  )
}

function renderDefects(defects: DrawnDefect[]) {
  return defects.map((defect) => {
    if (defect.kind === 'crack') {
      return (
        <polyline
          key={defect.id}
          points={defect.points.map((p) => `${p.x},${p.y}`).join(' ')}
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
        points={defect.points.map((p) => `${p.x},${p.y}`).join(' ')}
        fill={
          defect.kind === 'patch' ? 'rgba(56,189,248,0.18)' : 'rgba(249,115,22,0.22)'
        }
        stroke={defect.kind === 'patch' ? '#38bdf8' : '#f97316'}
        strokeWidth={STROKE.area}
      />
    )
  })
}
