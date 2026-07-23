import { useEffect, useRef, useState } from 'react'
import { DRAW_TOOL_DEFECTS, labelForDrawnDefect } from '../data/defectTypes'
import type { DrawnDefect, DrawnDefectKind } from '../types'

type Point = { x: number; y: number }

type DefectDrawLayerProps = {
  active: boolean
  tool: DrawnDefectKind | null
  defects: DrawnDefect[]
  bridgeLengthM: number
  bridgeWidthM?: number
  onComplete: (defect: DrawnDefect) => void
  selectedElementId?: string | null
  /** Optional Appendix E override for the active tool */
  defectCode?: string
}

function dist(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function polylineLength(points: Point[], lengthM: number, widthM: number) {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    const dx = (points[i].x - points[i - 1].x) * lengthM
    const dy = (points[i].y - points[i - 1].y) * widthM
    total += Math.hypot(dx, dy)
  }
  return total
}

function polygonArea(points: Point[], lengthM: number, widthM: number) {
  if (points.length < 3) return 0
  let sum = 0
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    sum += points[i].x * lengthM * (points[j].y * widthM)
    sum -= points[j].x * lengthM * (points[i].y * widthM)
  }
  return Math.abs(sum) / 2
}

export function DefectDrawLayer({
  active,
  tool,
  defects,
  bridgeLengthM,
  bridgeWidthM = 12,
  onComplete,
  selectedElementId,
  defectCode,
}: DefectDrawLayerProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [draft, setDraft] = useState<Point[]>([])
  const [cursor, setCursor] = useState<Point | null>(null)
  const draftRef = useRef<Point[]>([])
  const toolRef = useRef(tool)
  const onCompleteRef = useRef(onComplete)
  const defectCodeRef = useRef(defectCode)

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
    setDraft([])
    setCursor(null)
  }, [tool, active])

  function buildDefect(points: Point[], currentTool: DrawnDefectKind): DrawnDefect | null {
    const minPoints = currentTool === 'crack' ? 2 : 3
    if (points.length < minPoints) return null

    const closed =
      currentTool !== 'crack' &&
      points.length > 2 &&
      dist(points[0], points[points.length - 1]) < 0.03
        ? points.slice(0, -1)
        : points

    const code = defectCodeRef.current ?? DRAW_TOOL_DEFECTS[currentTool].code

    return {
      id: `drawn-${Date.now()}`,
      kind: currentTool,
      defectCode: code,
      points: closed,
      label: labelForDrawnDefect(currentTool, code),
      createdAt: new Date().toISOString(),
      elementId: selectedElementId ?? null,
      lengthM:
        currentTool === 'crack'
          ? Number(polylineLength(closed, bridgeLengthM * 0.35, bridgeWidthM).toFixed(2))
          : undefined,
      areaM2:
        currentTool !== 'crack'
          ? Number(polygonArea(closed, bridgeLengthM * 0.35, bridgeWidthM).toFixed(2))
          : undefined,
    }
  }

  function finish(points: Point[]) {
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

  function toNorm(event: { clientX: number; clientY: number }): Point | null {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return null
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    }
  }

  if (!active) {
    return (
      <svg className="defect-layer readonly" viewBox="0 0 1 1" preserveAspectRatio="none">
        {renderDefects(defects)}
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
        if (!tool) return
        const p = toNorm(e)
        if (!p) return

        if (tool !== 'crack' && draft.length >= 3 && dist(draft[0], p) < 0.03) {
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
      {renderDefects(defects)}

      {preview.length > 0 && tool === 'crack' && (
        <polyline
          points={preview.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="#ef4444"
          strokeWidth="0.008"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {preview.length > 0 && tool && tool !== 'crack' && (
        <polygon
          points={preview.map((p) => `${p.x},${p.y}`).join(' ')}
          fill={tool === 'patch' ? 'rgba(56,189,248,0.2)' : 'rgba(249,115,22,0.28)'}
          stroke={tool === 'patch' ? '#38bdf8' : '#f97316'}
          strokeWidth="0.006"
        />
      )}

      {draft.map((p, i) => (
        <circle
          key={`${p.x}-${p.y}-${i}`}
          cx={p.x}
          cy={p.y}
          r="0.01"
          fill="#f8fafc"
          stroke="#ef4444"
          strokeWidth="0.004"
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
          strokeWidth="0.008"
          strokeLinecap="round"
        />
      )
    }
    return (
      <polygon
        key={defect.id}
        points={defect.points.map((p) => `${p.x},${p.y}`).join(' ')}
        fill={
          defect.kind === 'patch' ? 'rgba(56,189,248,0.22)' : 'rgba(249,115,22,0.3)'
        }
        stroke={defect.kind === 'patch' ? '#38bdf8' : '#f97316'}
        strokeWidth="0.006"
      />
    )
  })
}
