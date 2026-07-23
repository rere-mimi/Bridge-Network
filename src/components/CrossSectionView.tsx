import type { BridgeAsset, DrawnDefect } from '../types'

type CrossSectionViewProps = {
  bridge: BridgeAsset
  isolatedPart: string | null
  showScale: boolean
  defects: DrawnDefect[]
}

export function CrossSectionView({
  bridge,
  isolatedPart,
  showScale,
  defects,
}: CrossSectionViewProps) {
  const widthM = Math.min(bridge.lengthM, 40)
  const metresToPx = 14
  const svgW = 640
  const svgH = 280
  const deckY = 110
  const pierH = 70
  const scaleLen = 5
  const scalePx = scaleLen * metresToPx

  const dim = (part: string) =>
    isolatedPart && isolatedPart !== part ? 0.18 : 1

  return (
    <div className="section-view">
      <div className="section-meta">
        <strong>2D cross section</strong>
        <span>
          {bridge.name} · span depth schematic · {widthM.toFixed(0)} m excerpt
        </span>
      </div>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="section-svg" role="img">
        <defs>
          <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#64748b" strokeWidth="1" />
          </pattern>
        </defs>

        {/* water */}
        <rect x="0" y="190" width={svgW} height="90" fill="#123447" />
        <path
          d="M0 200 Q40 190 80 200 T160 200 T240 200 T320 200 T400 200 T480 200 T560 200 T640 200"
          fill="none"
          stroke="#2dd4bf"
          strokeOpacity="0.35"
          strokeWidth="2"
        />

        {/* ground banks */}
        <rect x="0" y="170" width="70" height="40" fill="#334155" opacity={dim('bearing')} />
        <rect x="570" y="170" width="70" height="40" fill="#334155" opacity={dim('bearing')} />

        {/* piers */}
        {[160, 320, 480].map((x, i) => (
          <g key={x} opacity={isolatedPart === 'pier' ? (i === 1 ? 1 : 0.15) : dim('pier')}>
            <rect x={x - 14} y={deckY + 18} width="28" height={pierH} fill="#94a3b8" />
            <rect x={x - 22} y={deckY + 12} width="44" height="10" fill="#cbd5e1" />
            {isolatedPart === 'pier' && i === 1 && (
              <rect
                x={x - 26}
                y={deckY + 8}
                width="52"
                height={pierH + 18}
                fill="none"
                stroke="#7dd3fc"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
            )}
          </g>
        ))}

        {/* girders */}
        <g opacity={dim('girder')}>
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x="80"
              y={deckY + 4 + i * 3}
              width="480"
              height="6"
              fill={isolatedPart === 'girder' && i === 2 ? '#fde68a' : '#475569'}
              opacity={isolatedPart === 'girder' && i !== 2 ? 0.25 : 1}
            />
          ))}
        </g>

        {/* deck */}
        <g opacity={dim('deck')}>
          <rect
            x="70"
            y={deckY - 8}
            width="500"
            height="16"
            fill={isolatedPart === 'deck' ? '#bfdbfe' : '#64748b'}
            stroke={isolatedPart === 'deck' ? '#7dd3fc' : 'none'}
            strokeWidth="2"
          />
          <rect x="70" y={deckY - 18} width="500" height="6" fill="#e2e8f0" />
        </g>

        {/* bearings */}
        <g opacity={dim('bearing')}>
          {[95, 545].map((x) => (
            <rect
              key={x}
              x={x}
              y={deckY + 8}
              width="18"
              height="10"
              fill={isolatedPart === 'bearing' ? '#fdba74' : '#78716c'}
              stroke={isolatedPart === 'bearing' ? '#fb923c' : 'none'}
            />
          ))}
        </g>

        {/* drawn defects projected onto section */}
        {defects.map((defect) => {
          if (defect.kind === 'crack' && defect.points.length > 1) {
            const d = defect.points
              .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${70 + p.x * 500} ${deckY - 20 + p.y * 90}`)
              .join(' ')
            return (
              <path
                key={defect.id}
                d={d}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )
          }
          if (defect.points.length > 2) {
            const points = defect.points
              .map((p) => `${70 + p.x * 500},${deckY - 20 + p.y * 90}`)
              .join(' ')
            return (
              <polygon
                key={defect.id}
                points={points}
                fill={defect.kind === 'patch' ? 'url(#hatch)' : 'rgba(249,115,22,0.35)'}
                stroke={defect.kind === 'patch' ? '#38bdf8' : '#f97316'}
                strokeWidth="2"
              />
            )
          }
          return null
        })}

        {showScale && (
          <g transform={`translate(40, ${svgH - 36})`}>
            <line x1="0" y1="0" x2={scalePx} y2="0" stroke="#e2e8f0" strokeWidth="2" />
            <line x1="0" y1="-6" x2="0" y2="6" stroke="#e2e8f0" strokeWidth="2" />
            <line x1={scalePx} y1="-6" x2={scalePx} y2="6" stroke="#e2e8f0" strokeWidth="2" />
            <text x={scalePx / 2} y="18" textAnchor="middle" fill="#94a3b8" fontSize="12">
              {scaleLen} m
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
