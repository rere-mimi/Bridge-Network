import type { BridgeElement } from '../types'
import type { SceneNode } from '../data/sceneLayout'

type FaceId = 'top' | 'front' | 'side' | 'end'

const FACE_LABEL: Record<FaceId, string> = {
  top: 'Top (plan)',
  front: 'Front (elevation)',
  side: 'Side (elevation)',
  end: 'End (section)',
}

type FaceDims = {
  horizontalM: number
  verticalM: number
  fill: string
  stroke: string
}

function dimsForFace(node: SceneNode, face: FaceId): FaceDims {
  const { length, width, height } = node.sizeM
  const fill = node.color
  const stroke = '#e2e8f0'
  switch (face) {
    case 'top':
      return { horizontalM: length, verticalM: width, fill, stroke }
    case 'front':
      return { horizontalM: length, verticalM: height, fill, stroke }
    case 'side':
      return { horizontalM: width, verticalM: height, fill, stroke }
    case 'end':
      return { horizontalM: width, verticalM: height, fill, stroke }
  }
}

function niceStep(maxM: number): number {
  if (maxM <= 1) return 0.2
  if (maxM <= 3) return 0.5
  if (maxM <= 8) return 1
  if (maxM <= 20) return 2
  if (maxM <= 50) return 5
  return 10
}

function FacePanel({
  face,
  node,
}: {
  face: FaceId
  node: SceneNode
}) {
  const dims = dimsForFace(node, face)
  const padL = 48
  const padT = 36
  const padR = 18
  const padB = 28
  const plotW = 280
  const plotH = 180
  const svgW = padL + plotW + padR
  const svgH = padT + plotH + padB

  const sx = plotW / Math.max(dims.horizontalM, 0.01)
  const sy = plotH / Math.max(dims.verticalM, 0.01)
  const scale = Math.min(sx, sy) * 0.82
  const shapeW = dims.horizontalM * scale
  const shapeH = dims.verticalM * scale
  const ox = padL + (plotW - shapeW) / 2
  const oy = padT + (plotH - shapeH) / 2

  const hStep = niceStep(dims.horizontalM)
  const vStep = niceStep(dims.verticalM)
  const hTicks: number[] = []
  for (let v = 0; v <= dims.horizontalM + 1e-6; v += hStep) hTicks.push(Number(v.toFixed(2)))
  const vTicks: number[] = []
  for (let v = 0; v <= dims.verticalM + 1e-6; v += vStep) vTicks.push(Number(v.toFixed(2)))

  return (
    <article className="face-panel">
      <header>
        <strong>{FACE_LABEL[face]}</strong>
        <span>
          {dims.horizontalM.toFixed(2)} m × {dims.verticalM.toFixed(2)} m
        </span>
      </header>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="face-svg" role="img">
        {/* plot background */}
        <rect
          x={padL}
          y={padT}
          width={plotW}
          height={plotH}
          fill="#0b1220"
          stroke="#334155"
          strokeWidth="1"
        />

        {/* top scale */}
        <line
          x1={ox}
          y1={padT - 10}
          x2={ox + shapeW}
          y2={padT - 10}
          stroke="#94a3b8"
          strokeWidth="1.5"
        />
        {hTicks.map((t) => {
          const x = ox + (t / dims.horizontalM) * shapeW
          return (
            <g key={`h-${t}`}>
              <line x1={x} y1={padT - 14} x2={x} y2={padT - 6} stroke="#cbd5e1" />
              <text x={x} y={16} textAnchor="middle" fill="#94a3b8" fontSize="10">
                {t}
              </text>
            </g>
          )
        })}
        <text x={ox + shapeW / 2} y={28} textAnchor="middle" fill="#64748b" fontSize="9">
          metres
        </text>

        {/* side scale */}
        <line
          x1={padL - 10}
          y1={oy}
          x2={padL - 10}
          y2={oy + shapeH}
          stroke="#94a3b8"
          strokeWidth="1.5"
        />
        {vTicks.map((t) => {
          const y = oy + shapeH - (t / dims.verticalM) * shapeH
          return (
            <g key={`v-${t}`}>
              <line x1={padL - 14} y1={y} x2={padL - 6} y2={y} stroke="#cbd5e1" />
              <text x={padL - 18} y={y + 3} textAnchor="end" fill="#94a3b8" fontSize="10">
                {t}
              </text>
            </g>
          )
        })}

        {/* element face */}
        <rect
          x={ox}
          y={oy}
          width={shapeW}
          height={shapeH}
          fill={dims.fill}
          fillOpacity="0.85"
          stroke="#7dd3fc"
          strokeWidth="2"
        />
        {/* hatch for depth cue */}
        <path
          d={`M ${ox} ${oy + shapeH * 0.35} L ${ox + shapeW} ${oy + shapeH * 0.35}`}
          stroke="#0f172a"
          strokeOpacity="0.25"
          strokeWidth="1"
        />
      </svg>
    </article>
  )
}

type CrossSectionViewProps = {
  element: BridgeElement
  node: SceneNode
  bridgeName: string
  bridgeId: string
}

export function CrossSectionView({
  element,
  node,
  bridgeName,
  bridgeId,
}: CrossSectionViewProps) {
  const faces = node.faces

  return (
    <div className="section-window">
      <header className="section-window-header">
        <div>
          <p className="eyebrow">
            Bridge {bridgeId} · 2D cross-section window
          </p>
          <h1>{element.id}</h1>
          <p>
            {bridgeName} · {element.majorGroup} · {element.subgroup} · Code {element.code} ·{' '}
            {element.name}
          </p>
        </div>
        <div className="section-window-dims">
          <div>
            <span>Length</span>
            <strong>{node.sizeM.length.toFixed(2)} m</strong>
          </div>
          <div>
            <span>Width</span>
            <strong>{node.sizeM.width.toFixed(2)} m</strong>
          </div>
          <div>
            <span>Height</span>
            <strong>{node.sizeM.height.toFixed(2)} m</strong>
          </div>
        </div>
      </header>

      <div className="face-grid">
        {faces.map((face) => (
          <FacePanel key={face} face={face} node={node} />
        ))}
      </div>

      <p className="section-window-note">
        Each panel shows one visible face of the selected element with metre scales on the top and
        side.
      </p>
    </div>
  )
}

/** @deprecated legacy bridge overview section — kept for type compatibility */
export function LegacyBridgeSectionPlaceholder() {
  return null
}
