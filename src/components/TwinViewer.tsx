import { Canvas } from '@react-three/fiber'
import { ContactShadows, Html, OrbitControls } from '@react-three/drei'
import {
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react'
import type { Mesh } from 'three'
import { CrossSectionView } from './CrossSectionView'
import { DefectDrawLayer } from './DefectDrawLayer'
import type {
  BridgeAsset,
  BridgeElement,
  ConditionBand,
  DrawnDefect,
  DrawnDefectKind,
} from '../types'

const BAND_COLOR: Record<ConditionBand, string> = {
  excellent: '#22c55e',
  good: '#84cc16',
  fair: '#eab308',
  poor: '#f97316',
  critical: '#ef4444',
}

type PartId = 'pier' | 'girder' | 'deck' | 'bearing'
type ViewerTab = '3d' | 'section' | 'map' | 'drawings'

type Hotspot = {
  id: string
  part: PartId
  label: string
  position: [number, number, number]
  element: BridgeElement
  detail: string
}

function buildHotspots(bridge: BridgeAsset): Hotspot[] {
  const pier = bridge.elements.find((e) => e.code === 'PIE' || e.code === 'SUP')
  const girder = bridge.elements.find(
    (e) => e.code === 'GIR' || e.code === 'SUP' || e.code === 'DEC',
  )
  const bearing = bridge.elements.find((e) => e.code === 'BEA')
  const deck = bridge.elements.find((e) => e.code === 'DEC')

  const spots: Hotspot[] = []
  if (pier) {
    spots.push({
      id: 'pier-2',
      part: 'pier',
      label: 'Pier 2',
      position: [-1.2, 0.55, 0.15],
      element: pier,
      detail: `${bridge.defects.filter((d) => d.elementCode === pier.code).length || 2} Defects`,
    })
  }
  if (girder) {
    spots.push({
      id: 'girder-g4',
      part: 'girder',
      label: girder.code === 'GIR' ? 'Girder G4' : girder.name,
      position: [0.4, 1.35, 0.35],
      element: girder,
      detail: `Condition: ${girder.band}`,
    })
  }
  if (deck) {
    spots.push({
      id: 'deck',
      part: 'deck',
      label: 'Deck panel',
      position: [1.6, 1.55, 0],
      element: deck,
      detail: `Score ${deck.conditionScore}`,
    })
  }
  if (bearing) {
    spots.push({
      id: 'bearing',
      part: 'bearing',
      label: 'Bearing line',
      position: [-2.4, 1.05, 0.2],
      element: bearing,
      detail: `Risk ${bearing.riskScore}`,
    })
  }
  return spots
}

function HighlightableMesh({
  selected,
  faded,
  color,
  emissive = '#7dd3fc',
  children,
  onSelect,
  ...props
}: {
  selected: boolean
  faded?: boolean
  color: string
  emissive?: string
  children: ReactNode
  onSelect?: () => void
} & ComponentProps<'mesh'>) {
  const ref = useRef<Mesh>(null)

  return (
    <mesh
      ref={ref}
      castShadow
      receiveShadow
      visible={!faded}
      onClick={(e) => {
        e.stopPropagation()
        onSelect?.()
      }}
      {...props}
    >
      {children}
      <meshStandardMaterial
        color={selected ? '#dbeafe' : color}
        emissive={selected ? emissive : '#000000'}
        emissiveIntensity={selected ? 0.85 : 0}
        roughness={selected ? 0.35 : 0.7}
        metalness={selected ? 0.25 : 0.1}
        transparent={faded}
        opacity={faded ? 0.08 : 1}
      />
    </mesh>
  )
}

function BridgeModel({
  bridge,
  selectedId,
  isolate,
  onSelect,
}: {
  bridge: BridgeAsset
  selectedId: string | null
  isolate: boolean
  onSelect: (hotspot: Hotspot) => void
}) {
  const hotspots = useMemo(() => buildHotspots(bridge), [bridge])
  const spanCount = Math.min(Math.max(bridge.spans, 3), 6)
  const selected = hotspots.find((h) => h.id === selectedId) ?? null
  const selectedPart = selected?.part ?? null
  const hideOthers = isolate && !!selectedPart

  const selectPart = (part: PartId) => {
    const spot = hotspots.find((h) => h.part === part)
    if (spot) onSelect(spot)
  }

  const faded = (part: PartId) => hideOthers && selectedPart !== part

  return (
    <group>
      {!hideOthers && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]} receiveShadow>
            <planeGeometry args={[18, 10]} />
            <meshStandardMaterial color="#1d4f63" roughness={0.35} metalness={0.2} />
          </mesh>
          <mesh position={[-6.2, 0.05, 0]} castShadow>
            <boxGeometry args={[3.5, 0.8, 8]} />
            <meshStandardMaterial color="#3f4f46" />
          </mesh>
          <mesh position={[6.2, 0.05, 0]} castShadow>
            <boxGeometry args={[3.5, 0.8, 8]} />
            <meshStandardMaterial color="#3f4f46" />
          </mesh>
        </>
      )}

      {Array.from({ length: spanCount - 1 }).map((_, i) => {
        const x = -3.5 + (i + 1) * (7 / spanCount)
        const isTargetPier = i === 1
        const lit = selectedPart === 'pier' && isTargetPier
        const hidePier = hideOthers && selectedPart === 'pier' && !isTargetPier
        if (hidePier) return null
        return (
          <group key={`pier-${i}`} position={[x, 0, 0]}>
            <HighlightableMesh
              selected={lit}
              faded={faded('pier') && !isTargetPier}
              color="#9aa3a7"
              position={[0, 0.35, 0]}
              onSelect={() => selectPart('pier')}
            >
              <boxGeometry args={[0.35, 1.1, 1.4]} />
            </HighlightableMesh>
            <HighlightableMesh
              selected={lit}
              faded={faded('pier') && !isTargetPier}
              color="#b0b8bc"
              position={[0, 0.95, 0]}
              onSelect={() => selectPart('pier')}
            >
              <boxGeometry args={[0.7, 0.18, 1.7]} />
            </HighlightableMesh>
            {lit && (
              <pointLight position={[0, 1.4, 0.8]} intensity={2.4} distance={4} color="#7dd3fc" />
            )}
          </group>
        )
      })}

      <HighlightableMesh
        selected={selectedPart === 'deck'}
        faded={faded('deck')}
        color="#6b7280"
        position={[0, 1.25, 0]}
        onSelect={() => selectPart('deck')}
      >
        <boxGeometry args={[9.2, 0.22, 2.2]} />
      </HighlightableMesh>
      {selectedPart === 'deck' && (
        <pointLight position={[1.5, 2.2, 0]} intensity={2.2} distance={5} color="#93c5fd" />
      )}

      {[-0.7, -0.25, 0.25, 0.7].map((z, i) => {
        const lit = selectedPart === 'girder' && i === 2
        if (hideOthers && selectedPart === 'girder' && i !== 2) return null
        return (
          <group key={`girder-${i}`}>
            <HighlightableMesh
              selected={lit}
              faded={faded('girder') && i !== 2}
              color="#4b5563"
              position={[0, 1.05, z]}
              onSelect={() => selectPart('girder')}
            >
              <boxGeometry args={[8.8, 0.28, 0.18]} />
            </HighlightableMesh>
            {lit && (
              <pointLight position={[0.4, 1.6, z]} intensity={2.6} distance={4.5} color="#fde68a" />
            )}
          </group>
        )
      })}

      {!hideOthers && (
        <>
          <mesh position={[0, 1.55, 1.05]}>
            <boxGeometry args={[9.2, 0.28, 0.08]} />
            <meshStandardMaterial color="#d1d5db" />
          </mesh>
          <mesh position={[0, 1.55, -1.05]}>
            <boxGeometry args={[9.2, 0.28, 0.08]} />
            <meshStandardMaterial color="#d1d5db" />
          </mesh>
          <mesh position={[0, 1.37, 0]}>
            <boxGeometry args={[8.6, 0.01, 0.06]} />
            <meshStandardMaterial color="#f8fafc" emissive="#94a3b8" emissiveIntensity={0.2} />
          </mesh>
        </>
      )}

      {[-0.6, 0, 0.6].map((z, i) => (
        <HighlightableMesh
          key={`bearing-${i}`}
          selected={selectedPart === 'bearing'}
          faded={faded('bearing')}
          color="#78716c"
          position={[-4.2, 1.05, z]}
          onSelect={() => selectPart('bearing')}
        >
          <boxGeometry args={[0.35, 0.16, 0.28]} />
        </HighlightableMesh>
      ))}
      {selectedPart === 'bearing' && (
        <pointLight position={[-4.1, 1.5, 0]} intensity={2.1} distance={3.5} color="#fdba74" />
      )}

      {hotspots.map((spot) => {
        if (hideOthers && spot.part !== selectedPart) return null
        const active = selectedId === spot.id
        const color = BAND_COLOR[spot.element.band]
        return (
          <group key={spot.id} position={spot.position}>
            <mesh
              onClick={(e) => {
                e.stopPropagation()
                onSelect(spot)
              }}
            >
              <sphereGeometry args={[active ? 0.15 : 0.11, 24, 24]} />
              <meshStandardMaterial
                color={active ? '#f8fafc' : color}
                emissive={active ? '#7dd3fc' : color}
                emissiveIntensity={active ? 1.4 : 0.45}
                toneMapped={false}
              />
            </mesh>
            {active && (
              <>
                <mesh>
                  <ringGeometry args={[0.18, 0.26, 32]} />
                  <meshBasicMaterial color="#7dd3fc" transparent opacity={0.85} />
                </mesh>
                <pointLight intensity={1.8} distance={3} color="#e0f2fe" />
              </>
            )}
            <Html distanceFactor={8} position={[0, 0.38, 0]} center>
              <button
                type="button"
                className={active ? 'hotspot-label active' : 'hotspot-label'}
                onClick={() => onSelect(spot)}
              >
                <strong>{spot.label}</strong>
                <span>
                  {spot.element.band} · {spot.detail}
                </span>
              </button>
            </Html>
          </group>
        )
      })}
    </group>
  )
}

function ScaleBar({ lengthM }: { lengthM: number }) {
  const barM = lengthM >= 100 ? 20 : lengthM >= 40 ? 10 : 5
  return (
    <div className="scale-bar" aria-label={`Scale bar ${barM} metres`}>
      <div className="scale-track">
        <i />
        <i />
        <i />
        <i />
      </div>
      <span>0</span>
      <strong>{barM} m</strong>
    </div>
  )
}

type TwinViewerProps = {
  bridge: BridgeAsset
  selectedElementId: string | null
  onSelectElement: (payload: {
    id: string
    label: string
    element: BridgeElement
  }) => void
  viewMode: ViewerTab
  onViewMode: (mode: ViewerTab) => void
  height?: number
  drawnDefects: DrawnDefect[]
  onDrawnDefectsChange: (defects: DrawnDefect[]) => void
  isolate: boolean
  onIsolateChange: (value: boolean) => void
}

export function TwinViewer({
  bridge,
  selectedElementId,
  onSelectElement,
  viewMode,
  onViewMode,
  height,
  drawnDefects,
  onDrawnDefectsChange,
  isolate,
  onIsolateChange,
}: TwinViewerProps) {
  const [showScale, setShowScale] = useState(true)
  const [defectTool, setDefectTool] = useState<DrawnDefectKind | null>(null)

  const hotspots = useMemo(() => buildHotspots(bridge), [bridge])
  const selectedPart =
    hotspots.find((h) => h.id === selectedElementId)?.part ?? null

  const drawingActive =
    !!defectTool && (viewMode === '3d' || viewMode === 'section')

  function handleElementSelect(spot: Hotspot) {
    // Second left-click on the already selected element → isolate + 2D section
    if (selectedElementId === spot.id) {
      onIsolateChange(true)
      onViewMode('section')
      return
    }
    onSelectElement({
      id: spot.id,
      label: spot.label,
      element: spot.element,
    })
    onIsolateChange(false)
  }

  return (
    <section className="twin-viewer">
      <div className="viewer-tabs">
        {(
          [
            ['3d', '3D Model'],
            ['section', '2D Cross section'],
            ['map', 'Map View'],
            ['drawings', 'Drawings'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={viewMode === id ? 'active' : ''}
            onClick={() => onViewMode(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="viewer-toolbar" role="toolbar" aria-label="Viewer tools">
        <button
          type="button"
          className={isolate ? 'active' : ''}
          disabled={!selectedElementId}
          title="Isolate selected element"
          onClick={() => onIsolateChange(!isolate)}
        >
          Isolate
        </button>
        <button
          type="button"
          className={viewMode === 'section' ? 'active' : ''}
          title="2D cross section"
          onClick={() => onViewMode(viewMode === 'section' ? '3d' : 'section')}
        >
          2D section
        </button>
        <button
          type="button"
          className={showScale ? 'active' : ''}
          title="Toggle scale bar"
          onClick={() => setShowScale((v) => !v)}
        >
          Scale
        </button>
        <span className="toolbar-sep" />
        <button
          type="button"
          className={defectTool === 'crack' ? 'active danger' : ''}
          title="Draw crack line"
          onClick={() => setDefectTool((t) => (t === 'crack' ? null : 'crack'))}
        >
          Crack line
        </button>
        <button
          type="button"
          className={defectTool === 'spall' ? 'active warn' : ''}
          title="Draw spall area"
          onClick={() => setDefectTool((t) => (t === 'spall' ? null : 'spall'))}
        >
          Spall area
        </button>
        <button
          type="button"
          className={defectTool === 'patch' ? 'active info' : ''}
          title="Draw patch area"
          onClick={() => setDefectTool((t) => (t === 'patch' ? null : 'patch'))}
        >
          Patch area
        </button>
        {drawnDefects.length > 0 && (
          <button
            type="button"
            className="ghost"
            onClick={() => onDrawnDefectsChange([])}
            title="Clear drawn defects"
          >
            Clear drawings
          </button>
        )}
      </div>

      <div className="viewer-stage" style={height ? { height, minHeight: height } : undefined}>
        {viewMode === '3d' && (
          <>
            <Canvas camera={{ position: [5.5, 3.2, 6.5], fov: 42 }} shadows>
              <color attach="background" args={['#0b1220']} />
              <ambientLight intensity={0.55} />
              <directionalLight
                castShadow
                position={[6, 8, 4]}
                intensity={1.35}
                shadow-mapSize={[1024, 1024]}
              />
              <BridgeModel
                bridge={bridge}
                selectedId={selectedElementId}
                isolate={isolate}
                onSelect={handleElementSelect}
              />
              <ContactShadows opacity={0.35} scale={16} blur={2.5} far={8} />
              <OrbitControls
                makeDefault
                enabled={!drawingActive}
                maxPolarAngle={Math.PI / 2.05}
                minDistance={4}
                maxDistance={14}
              />
            </Canvas>

            <DefectDrawLayer
              active={drawingActive}
              tool={defectTool}
              defects={drawnDefects}
              bridgeLengthM={bridge.lengthM}
              selectedElementId={selectedElementId}
              onComplete={(defect) =>
                onDrawnDefectsChange([defect, ...drawnDefects])
              }
            />

            <div className="condition-scale">
              <p>Condition scale</p>
              {Object.entries(BAND_COLOR).map(([band, color]) => (
                <div key={band}>
                  <i style={{ background: color }} />
                  {band}
                </div>
              ))}
            </div>

            {showScale && <ScaleBar lengthM={bridge.lengthM} />}

            <p className="viewer-hint">
              {drawingActive
                ? defectTool === 'crack'
                  ? 'Click to place crack points · double-click / Enter / right-click to finish'
                  : 'Click to place area points · click near start or Enter to close'
                : isolate
                  ? 'Isolated element · 2D section available from toolbar'
                  : 'Click element to select · click again to isolate + open 2D section'}
            </p>
            {isolate && selectedPart && (
              <div className="isolate-badge">Isolated · {selectedPart}</div>
            )}
          </>
        )}

        {viewMode === 'section' && (
          <>
            <CrossSectionView
              bridge={bridge}
              isolatedPart={isolate ? selectedPart : null}
              showScale={showScale}
              defects={drawnDefects}
            />
            <DefectDrawLayer
              active={drawingActive}
              tool={defectTool}
              defects={drawnDefects}
              bridgeLengthM={bridge.lengthM}
              selectedElementId={selectedElementId}
              onComplete={(defect) =>
                onDrawnDefectsChange([defect, ...drawnDefects])
              }
            />
            {showScale && <ScaleBar lengthM={bridge.lengthM} />}
            <p className="viewer-hint">
              {drawingActive
                ? 'Draw defects on the cross section'
                : '2D cross section · toggle Isolate / Scale / defect tools'}
            </p>
          </>
        )}

        {viewMode === 'map' && (
          <div className="viewer-fallback map-fallback">
            <p>{bridge.name}</p>
            <span>
              {bridge.lat.toFixed(4)}, {bridge.lng.toFixed(4)} · {bridge.road}
            </span>
          </div>
        )}

        {viewMode === 'drawings' && (
          <div className="viewer-fallback">
            <p>Drawing set</p>
            <span>
              {bridge.documents.drawings} sheets available in the document register
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
