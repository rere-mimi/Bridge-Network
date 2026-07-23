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
  defaultDefectCode,
  defectTypesForTool,
  FACE_LABEL,
  MATERIAL_LABEL,
  normalizeMaterial,
  toolLabel,
  toolTitle,
  type DefectFace,
} from '../data/defectTypes'
import { faceMetres } from '../data/defectMetrics'
import {
  buildSceneNodes,
  findSceneNode,
  MATERIAL_MESH_COLOR,
  nodeExtent,
  type SceneColorMode,
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
  colorMode,
  onSelect,
}: {
  bridge: BridgeAsset
  selectedId: string | null
  isolate: boolean
  colorMode: SceneColorMode
  onSelect: (node: SceneNode) => void
}) {
  const nodes = useMemo(() => buildSceneNodes(bridge, colorMode), [bridge, colorMode])
  const selected = findSceneNode(nodes, selectedId)
  const hideOthers = isolate && !!selected

  return (
    <group>
      {/* Structural twin only — no ground, grass, water, or embankment */}
      <gridHelper args={[24, 24, '#1e293b', '#0f172a']} position={[0, -0.5, 0]} />

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
  fullscreen?: boolean
  onFullscreenChange?: (value: boolean) => void
  /** Default mesh colouring — material unless risk/maintenance allows severity. */
  colorMode?: SceneColorMode
  onColorModeChange?: (mode: SceneColorMode) => void
  allowSeverityColor?: boolean
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
  fullscreen = false,
  onFullscreenChange,
  colorMode = 'material',
  onColorModeChange,
  allowSeverityColor = false,
}: TwinViewerProps) {
  const [showScale, setShowScale] = useState(true)
  const [defectTool, setDefectTool] = useState<DrawnDefectKind | null>(null)
  const [defectFace, setDefectFace] = useState<DefectFace>('front')
  const [defectCode, setDefectCode] = useState<string | null>(null)
  const controlsRef = useRef(null)

  const nodes = useMemo(() => buildSceneNodes(bridge, colorMode), [bridge, colorMode])
  const selectedNode = findSceneNode(nodes, selectedElementId)
  const focusTarget = selectedNode?.position ?? null
  const selectedMaterial = selectedNode?.element.material
  const materialCode = normalizeMaterial(selectedMaterial)
  /** Defect tools always draw on the 2D face board so UV stays correct in 3D. */
  const drawingIn2d = !!defectTool && !!selectedElementId
  const show3d = viewMode === '3d' && !drawingIn2d
  const show2dDraw = drawingIn2d || viewMode === 'section'

  const elementSizeM = selectedNode?.sizeM ?? {
    length: bridge.lengthM * 0.25,
    width: bridge.deckWidthM ?? 12,
    height: 2.5,
  }
  const faceM = faceMetres(elementSizeM, defectFace)

  const toolOptions = defectTool
    ? defectTypesForTool(defectTool, selectedMaterial)
    : []

  useEffect(() => {
    if (!defectTool) {
      setDefectCode(null)
      return
    }
    setDefectCode(defaultDefectCode(defectTool, selectedMaterial))
  }, [defectTool, selectedMaterial, selectedElementId])

  function toggleTool(kind: DrawnDefectKind) {
    if (!selectedElementId) return
    setDefectTool((t) => {
      const next = t === kind ? null : kind
      if (next) {
        onIsolateChange(true)
        // Force 2D drawing surface so defects map to the face for later 3D display
        onViewMode('section')
      } else if (viewMode === 'section') {
        onViewMode('3d')
      }
      return next
    })
  }

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
    <section className={`twin-viewer ${fullscreen ? 'is-fullscreen' : ''}`}>
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
                onViewMode('section')
                return
              }
              if (id === '3d' && defectTool) setDefectTool(null)
              onViewMode(id)
            }}
          >
            {label}
          </button>
        ))}
        {onFullscreenChange && (
          <button
            type="button"
            className={`viewer-fullscreen-btn ${fullscreen ? 'active' : ''}`}
            title={fullscreen ? 'Exit fullscreen (Esc)' : 'Open 3D model fullscreen'}
            onClick={() => {
              if (!fullscreen) onViewMode('3d')
              onFullscreenChange(!fullscreen)
            }}
          >
            {fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          </button>
        )}
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
          className={viewMode === 'section' || drawingIn2d ? 'active' : ''}
          disabled={!selectedElementId}
          title="Open 2D face view for defect drawing (popup overview also available)"
          onClick={() => {
            onViewMode('section')
          }}
        >
          2D draw
        </button>
        <button
          type="button"
          className="ghost"
          disabled={!selectedElementId}
          title="Open printable 2D cross section in a new window"
          onClick={openSection}
        >
          Section popup
        </button>
        <button
          type="button"
          className={showScale ? 'active' : ''}
          title="Toggle scale bar"
          onClick={() => setShowScale((v) => !v)}
        >
          Scale
        </button>
        {onFullscreenChange && (
          <button
            type="button"
            className={fullscreen ? 'active' : ''}
            title={fullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen 3D model'}
            onClick={() => {
              if (!fullscreen) onViewMode('3d')
              onFullscreenChange(!fullscreen)
            }}
          >
            {fullscreen ? 'Exit FS' : 'Fullscreen'}
          </button>
        )}
        <span className="toolbar-sep" />
        <label className="viewer-color-mode" title="Mesh colour basis">
          Colour
          <select
            value={colorMode}
            onChange={(e) => onColorModeChange?.(e.target.value as SceneColorMode)}
            disabled={!onColorModeChange}
          >
            <option value="material">Material</option>
            {allowSeverityColor && <option value="severity">Defect severity</option>}
            {allowSeverityColor && <option value="condition">Condition band</option>}
          </select>
        </label>
        <span className="toolbar-sep" />
        <button
          type="button"
          className={defectTool === 'crack' ? 'active danger' : ''}
          disabled={!selectedElementId}
          title={
            selectedElementId
              ? `${toolTitle('crack', selectedMaterial)} — opens 2D face drawing`
              : 'Select an element first to pin the defect'
          }
          onClick={() => toggleTool('crack')}
        >
          {toolLabel('crack', selectedMaterial)}
        </button>
        <button
          type="button"
          className={defectTool === 'spall' ? 'active warn' : ''}
          disabled={!selectedElementId}
          title={
            selectedElementId
              ? `${toolTitle('spall', selectedMaterial)} — opens 2D face drawing`
              : 'Select an element first to pin the defect'
          }
          onClick={() => toggleTool('spall')}
        >
          {toolLabel('spall', selectedMaterial)}
        </button>
        <button
          type="button"
          className={defectTool === 'patch' ? 'active info' : ''}
          disabled={!selectedElementId}
          title={
            selectedElementId
              ? `${toolTitle('patch', selectedMaterial)} — opens 2D face drawing`
              : 'Select an element first to pin the defect'
          }
          onClick={() => toggleTool('patch')}
        >
          {toolLabel('patch', selectedMaterial)}
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

      {defectTool && selectedElementId && selectedNode && (
        <div className="defect-pin-bar" role="group" aria-label="Defect pin settings">
          <span className="defect-pin-meta">
            Pin → {selectedNode.element.name}
            {' · '}
            {MATERIAL_LABEL[materialCode]}
            {' · '}
            face {faceM.horizontalM.toFixed(2)}×{faceM.verticalM.toFixed(2)} m
          </span>
          <label>
            Face
            <select
              value={defectFace}
              onChange={(e) => setDefectFace(e.target.value as DefectFace)}
            >
              {(Object.keys(FACE_LABEL) as DefectFace[]).map((f) => (
                <option key={f} value={f}>
                  {FACE_LABEL[f]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Appendix E
            <select
              value={defectCode ?? ''}
              onChange={(e) => setDefectCode(e.target.value)}
            >
              {toolOptions.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.code} · {opt.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="viewer-stage" style={height ? { height, minHeight: height } : undefined}>
        {show3d && (
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
                colorMode={colorMode}
                onSelect={handleElementSelect}
              />
              <ContactShadows opacity={0.35} scale={16} blur={2.5} far={8} />
              <OrbitControls
                ref={controlsRef}
                makeDefault
                enableDamping
                dampingFactor={0.08}
                maxPolarAngle={Math.PI / 2.02}
                minDistance={isolate ? 0.8 : 3}
                maxDistance={isolate ? 8 : 16}
              />
              <CameraFocus isolate={isolate} target={focusTarget} />
            </Canvas>

            {/* Read-only defect overlay on 3D when not drawing */}
            <DefectDrawLayer
              active={false}
              tool={null}
              defects={drawnDefects}
              elementSizeM={elementSizeM}
              face={defectFace}
              selectedElementId={selectedElementId}
              elementName={selectedNode?.element.name}
              material={selectedMaterial}
              defectCode={defectCode ?? undefined}
              onComplete={() => undefined}
              unrestricted
            />

            <div className="condition-scale">
              <p>{colorMode === 'material' ? 'Material' : colorMode === 'severity' ? 'Severity' : 'Condition'}</p>
              {colorMode === 'material'
                ? (
                    [
                      ['C', 'Concrete'],
                      ['P', 'Prestressed'],
                      ['S', 'Steel'],
                      ['T', 'Timber'],
                      ['M', 'Masonry'],
                    ] as const
                  ).map(([code, label]) => (
                    <div key={code}>
                      <i style={{ background: MATERIAL_MESH_COLOR[code] }} />
                      {label}
                    </div>
                  ))
                : colorMode === 'severity'
                  ? (
                      [
                        ['low', '#22c55e'],
                        ['medium', '#eab308'],
                        ['high', '#f97316'],
                        ['critical', '#ef4444'],
                      ] as const
                    ).map(([band, color]) => (
                      <div key={band}>
                        <i style={{ background: color }} />
                        {band}
                      </div>
                    ))
                  : (
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
              {!selectedElementId
                ? 'Select an element first — then pick a defect tool to draw on its 2D face'
                : isolate
                  ? 'Isolated · pick a defect tool to draw in 2D · or open popup section'
                  : 'Click any element · pick Crack / Spall / Patch to draw in 2D'}
            </p>
            {isolate && selectedNode && (
              <div className="isolate-badge">
                Isolated · {selectedNode.element.name}
              </div>
            )}
          </>
        )}

        {show2dDraw && (
          <div className="defect-2d-stage">
            <DefectDrawLayer
              active={drawingIn2d}
              tool={defectTool}
              defects={drawnDefects}
              elementSizeM={elementSizeM}
              face={defectFace}
              selectedElementId={selectedElementId}
              elementName={selectedNode?.element.name}
              material={selectedMaterial}
              defectCode={defectCode ?? undefined}
              unrestricted
              onComplete={(defect) =>
                onDrawnDefectsChange([defect, ...drawnDefects])
              }
            />
            {!drawingIn2d && (
              <p className="viewer-hint defect-2d-hint">
                2D face view · select Crack / Spall / Patch to draw on this face
              </p>
            )}
            {drawingIn2d && (
              <p className="viewer-hint defect-2d-hint">
                Drawing on 2D · {FACE_LABEL[defectFace]} · defects stay pinned to this face in 3D
              </p>
            )}
            <button
              type="button"
              className="page-btn defect-2d-back"
              onClick={() => {
                setDefectTool(null)
                onViewMode('3d')
              }}
            >
              Back to 3D
            </button>
          </div>
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
