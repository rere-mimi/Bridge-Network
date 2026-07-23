import { Canvas, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react'
import type { Mesh } from 'three'
import * as THREE from 'three'
import { openCrossSectionWindow } from './CrossSectionApp'
import { DefectDrawLayer } from './DefectDrawLayer'
import {
  buildSceneNodes,
  findSceneNode,
  nodeExtent,
  type SceneNode,
  type ScenePart,
} from '../data/sceneLayout'
import type {
  BridgeAsset,
  BridgeElement,
  DrawnDefect,
  DrawnDefectKind,
} from '../types'

type ViewerTab = '3d' | 'section' | 'map' | 'drawings'

const SCENE_WATER_LEN = 9.5

function PartGeometry({ part }: { part: ScenePart }) {
  if (part.shape === 'cylinder') {
    const radius = Math.max(part.size[0], part.size[2]) * 0.5
    const length = part.size[1]
    return <cylinderGeometry args={[radius, radius, length, 28, 1, true]} />
  }
  return <boxGeometry args={part.size} />
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
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default'
      }}
      {...props}
    >
      {children}
      <meshStandardMaterial
        color={selected ? '#dbeafe' : color}
        emissive={selected ? emissive : '#000000'}
        emissiveIntensity={selected ? 0.55 : 0}
        roughness={selected ? 0.4 : 0.78}
        metalness={selected ? 0.18 : 0.08}
        side={THREE.DoubleSide}
        transparent={faded}
        opacity={faded ? 0.08 : 1}
      />
    </mesh>
  )
}

function CameraFocus({
  isolate,
  target,
}: {
  isolate: boolean
  target: [number, number, number] | null
}) {
  const { camera, controls } = useThree()
  const defaultPos = useRef(new THREE.Vector3(5.8, 3.4, 6.8))
  const defaultTarget = useRef(new THREE.Vector3(0, 0.7, 0))

  useEffect(() => {
    const orbit = controls as unknown as {
      target: THREE.Vector3
      update: () => void
      minDistance: number
      maxDistance: number
    } | null
    if (!orbit) return

    if (isolate && target) {
      const pivot = new THREE.Vector3(...target)
      orbit.target.copy(pivot)
      const offset = new THREE.Vector3(2.4, 1.6, 2.6)
      camera.position.copy(pivot).add(offset)
      orbit.minDistance = 0.8
      orbit.maxDistance = 8
      orbit.update()
      return
    }

    camera.position.copy(defaultPos.current)
    orbit.target.copy(defaultTarget.current)
    orbit.minDistance = 3
    orbit.maxDistance = 18
    orbit.update()
  }, [isolate, target, camera, controls])

  return null
}

function SceneNodeMesh({
  node,
  selected,
  onSelect,
}: {
  node: SceneNode
  selected: boolean
  onSelect: () => void
}) {
  const [, sy] = nodeExtent(node)
  return (
    <group position={node.position}>
      {node.parts.map((part, i) => (
        <HighlightableMesh
          key={`${node.element.id}-p${i}`}
          selected={selected}
          color={part.color ?? node.color}
          position={part.position}
          rotation={part.rotation}
          onSelect={onSelect}
        >
          <PartGeometry part={part} />
        </HighlightableMesh>
      ))}
      {selected && (
        <pointLight
          position={[0, sy * 0.45 + 0.35, 0.5]}
          intensity={1.8}
          distance={4}
          color="#7dd3fc"
        />
      )}
    </group>
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
  onSelect: (node: SceneNode) => void
}) {
  const nodes = useMemo(() => buildSceneNodes(bridge), [bridge])
  const selected = findSceneNode(nodes, selectedId)
  const hideOthers = isolate && !!selected
  const culvert =
    bridge.kind === 'culvert' ||
    bridge.family?.includes('culvert') ||
    bridge.elements.some((e) => e.scheduleNo >= 600 && e.scheduleNo < 650)

  return (
    <group>
      {!hideOthers && (
        <>
          {/* Ground / channel bed */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.42, 0]} receiveShadow>
            <planeGeometry args={[22, 14]} />
            <meshStandardMaterial color={culvert ? '#3d4f3a' : '#1d4f63'} roughness={0.85} />
          </mesh>
          {!culvert && (
            <mesh position={[0, -0.28, 0]} receiveShadow>
              <boxGeometry args={[SCENE_WATER_LEN, 0.2, 6]} />
              <meshStandardMaterial color="#0f3a4d" roughness={0.35} metalness={0.15} />
            </mesh>
          )}
          {culvert && (
            // Stream channel through opening axis
            <mesh position={[0, -0.2, 0]} receiveShadow>
              <boxGeometry args={[3.2, 0.15, 8]} />
              <meshStandardMaterial color="#1e4658" roughness={0.4} />
            </mesh>
          )}
        </>
      )}

      {nodes.map((node) => {
        const active = selectedId === node.element.id
        if (hideOthers && !active) return null
        return (
          <SceneNodeMesh
            key={node.element.id}
            node={node}
            selected={active}
            onSelect={() => onSelect(node)}
          />
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
  const controlsRef = useRef(null)

  const nodes = useMemo(() => buildSceneNodes(bridge), [bridge])
  const selectedNode = findSceneNode(nodes, selectedElementId)
  const focusTarget = selectedNode?.position ?? null

  const drawingActive = !!defectTool && viewMode === '3d'

  function handleElementSelect(node: SceneNode) {
    onSelectElement({
      id: node.element.id,
      label: node.element.name,
      element: node.element,
    })
    if (!isolate) onIsolateChange(false)
  }

  function openSection() {
    if (!selectedElementId) return
    openCrossSectionWindow(bridge.id, selectedElementId)
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
            onClick={() => {
              if (id === 'section') {
                openSection()
                return
              }
              onViewMode(id)
            }}
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
          title="Isolate selected element and close up"
          onClick={() => onIsolateChange(!isolate)}
        >
          Isolate
        </button>
        <button
          type="button"
          className={viewMode === 'section' ? 'active' : ''}
          disabled={!selectedElementId}
          title="Open 2D cross section in a new window"
          onClick={openSection}
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
          title="Appendix E 1150 — Cracking (RC) line"
          onClick={() => setDefectTool((t) => (t === 'crack' ? null : 'crack'))}
        >
          Crack 1150
        </button>
        <button
          type="button"
          className={defectTool === 'spall' ? 'active warn' : ''}
          title="Appendix E 1100 — Delamination/spall area"
          onClick={() => setDefectTool((t) => (t === 'spall' ? null : 'spall'))}
        >
          Spall 1100
        </button>
        <button
          type="button"
          className={defectTool === 'patch' ? 'active info' : ''}
          title="Appendix E 3100 — Patched area"
          onClick={() => setDefectTool((t) => (t === 'patch' ? null : 'patch'))}
        >
          Patch 3100
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
        {(viewMode === '3d' || viewMode === 'section') && (
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
                ref={controlsRef}
                makeDefault
                enabled={!drawingActive}
                enableDamping
                dampingFactor={0.08}
                maxPolarAngle={Math.PI / 2.02}
                minDistance={isolate ? 0.8 : 3}
                maxDistance={isolate ? 8 : 16}
              />
              <CameraFocus isolate={isolate} target={focusTarget} />
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
              {(
                [
                  ['excellent', '#22c55e'],
                  ['good', '#84cc16'],
                  ['fair', '#eab308'],
                  ['poor', '#f97316'],
                  ['critical', '#ef4444'],
                ] as const
              ).map(([band, color]) => (
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
                  ? 'Isolated · orbit around element centre · open 2D section for face views'
                  : 'Click any element mesh to select · Isolate for close-up · 2D section opens a new window'}
            </p>
            {isolate && selectedNode && (
              <div className="isolate-badge">
                Isolated · {selectedNode.element.name}
              </div>
            )}
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
