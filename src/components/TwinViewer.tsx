import { Canvas, useThree } from '@react-three/fiber'
import { ContactShadows, Html, OrbitControls } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react'
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
import { pickFaceFromEvent } from '../data/meshPick'
import {
  axesInWindow,
  axisWindowCaption,
  axisWindowViewTransform,
  buildAxisWindows,
  elementInAxisWindow,
  findAxisWindow,
  needsAxisWindow,
  toAxisViewPoint,
  type AxisWindow,
  type BridgeAxis,
} from '../data/bridgeAxes'
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
  ImportedIfcMesh,
  ModelComment,
} from '../types'
import { metresToScene } from '../data/ifcExchange'
import { openCommentCountByElement } from '../data/modelComments'

type ViewerTab = '3d' | 'section' | 'map' | 'drawings'

function PartGeometry({ part }: { part: ScenePart }) {
  if (part.shape === 'cylinder') {
    const radius = Math.max(part.size[0], part.size[2]) * 0.5
    const length = part.size[1]
    // Higher radial resolution for accurate raycast / visual detail
    return <cylinderGeometry args={[radius, radius, length, 48, 1, true]} />
  }
  // Explicit width/height/depth segments improve picking on large faces
  const [sx, sy, sz] = part.size
  const seg = (m: number) => (m > 2.5 ? 4 : m > 1.2 ? 2 : 1)
  return <boxGeometry args={[sx, sy, sz, seg(sx), seg(sy), seg(sz)]} />
}

export type MeshPickResult = {
  face: DefectFace
  uv: { x: number; y: number }
  point: [number, number, number]
}

function HighlightableMesh({
  selected,
  faded,
  color,
  emissive = '#7dd3fc',
  partSize,
  allowedFaces,
  children,
  onSelect,
  ...props
}: {
  selected: boolean
  faded?: boolean
  color: string
  emissive?: string
  partSize: [number, number, number]
  allowedFaces?: DefectFace[]
  children: ReactNode
  onSelect?: (pick: MeshPickResult | null) => void
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
        const pick = pickFaceFromEvent(e, partSize, allowedFaces)
        onSelect?.(pick)
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

/**
 * Soft one-shot framing only — does not lock the orbit pivot.
 * User can pan / orbit freely without being pulled back to a centre target.
 */
function CameraFrameOnce({
  frameKey,
  isolate,
  target,
  axisFramed,
}: {
  frameKey: string
  isolate: boolean
  target: [number, number, number] | null
  axisFramed?: boolean
}) {
  const { camera, controls } = useThree()
  const lastKey = useRef('')

  useEffect(() => {
    const orbit = controls as unknown as {
      target: THREE.Vector3
      update: () => void
      minDistance: number
      maxDistance: number
    } | null
    if (!orbit) return
    if (lastKey.current === frameKey) return
    lastKey.current = frameKey

    if (isolate && target) {
      const pivot = new THREE.Vector3(...target)
      orbit.target.copy(pivot)
      camera.position.copy(pivot).add(new THREE.Vector3(2.4, 1.6, 2.6))
      orbit.update()
      return
    }

    if (axisFramed) {
      orbit.target.set(0, 0.9, 0)
      camera.position.set(4.2, 2.9, 6.2)
      orbit.update()
      return
    }

    orbit.target.set(0, 0.7, 0)
    camera.position.set(5.8, 3.4, 6.8)
    orbit.update()
  }, [frameKey, isolate, target, axisFramed, camera, controls])

  return null
}

function CommentMarkers({
  nodes,
  comments,
  viewXf,
  selectedId,
  onSelectId,
}: {
  nodes: SceneNode[]
  comments: ModelComment[] | undefined
  viewXf: { offsetX: number; scale: number }
  selectedId: string | null
  onSelectId: (id: string) => void
}) {
  const counts = openCommentCountByElement(comments)
  if (counts.size === 0) return null
  return (
    <group>
      {nodes.map((node) => {
        const count = counts.get(node.element.id)
        if (!count) return null
        const x = node.position[0] * viewXf.scale + viewXf.offsetX
        const y = node.position[1] + nodeExtent(node)[1] * 0.55 + 0.55
        const z = node.position[2]
        const active = selectedId === node.element.id
        return (
          <group key={`mc-${node.element.id}`} position={[x, y, z]}>
            <Html center distanceFactor={16} zIndexRange={[100, 0]}>
              <button
                type="button"
                className={`model-comment-chip ${active ? 'active' : ''}`}
                title={`${count} open comment${count === 1 ? '' : 's'}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectId(node.element.id)
                }}
              >
                PM · {count}
              </button>
            </Html>
          </group>
        )
      })}
    </group>
  )
}

function AxisLabelMarkers({ axes }: { axes: BridgeAxis[] }) {
  return (
    <group>
      {axes.map((axis) => {
        const x = axis.xScene
        const z = axis.zScene ?? 0
        const opening = axis.alignment === 'opening' || axis.kind === 'opening'
        return (
          <group key={axis.index} position={[x, 2.15, z]}>
            {/* Vertical tick; opening axes also show a cross-line on the face (along road X) */}
            <mesh position={[0, -0.85, 0]}>
              <boxGeometry args={[0.04, 1.7, 0.04]} />
              <meshStandardMaterial color="#38bdf8" transparent opacity={0.55} />
            </mesh>
            {opening && (
              <mesh position={[0, -1.35, 0]} rotation={[0, 0, Math.PI / 2]}>
                <boxGeometry args={[0.04, 1.4, 0.04]} />
                <meshStandardMaterial color="#f87171" transparent opacity={0.7} />
              </mesh>
            )}
            <Html center distanceFactor={14} style={{ pointerEvents: 'none' }}>
              <div className="axis-label-chip">
                <strong>{axis.label}</strong>
                <span>{axis.detail}</span>
              </div>
            </Html>
          </group>
        )
      })}
    </group>
  )
}

function SceneNodeMesh({
  node,
  selected,
  onSelect,
}: {
  node: SceneNode
  selected: boolean
  onSelect: (pick: MeshPickResult | null) => void
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
          partSize={part.size}
          allowedFaces={node.faces}
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

function ImportedIfcMeshView({
  bridge,
  mesh,
}: {
  bridge: BridgeAsset
  mesh: ImportedIfcMesh
}) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const twinPositions = mesh.positions
    const scenePositions = new Float32Array((twinPositions.length / 3) * 3)
    for (let i = 0; i < twinPositions.length; i += 3) {
      const [sx, sy, sz] = metresToScene(bridge, [
        twinPositions[i],
        twinPositions[i + 1],
        twinPositions[i + 2],
      ])
      scenePositions[i] = sx
      scenePositions[i + 1] = sy
      scenePositions[i + 2] = sz
    }
    geo.setAttribute('position', new THREE.BufferAttribute(scenePositions, 3))
    geo.setIndex(mesh.indices)
    geo.computeVertexNormals()
    return geo
  }, [bridge, mesh])

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color={mesh.color || '#94a3b8'}
        metalness={0.15}
        roughness={0.75}
        transparent
        opacity={0.92}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function BridgeModel({
  bridge,
  selectedId,
  isolate,
  colorMode,
  axisWindow,
  onSelect,
}: {
  bridge: BridgeAsset
  selectedId: string | null
  isolate: boolean
  colorMode: SceneColorMode
  axisWindow: AxisWindow | null
  onSelect: (node: SceneNode, pick: MeshPickResult | null) => void
}) {
  const nodes = useMemo(() => buildSceneNodes(bridge, colorMode), [bridge, colorMode])
  const visibleNodes = useMemo(
    () => nodes.filter((n) => elementInAxisWindow(n.element, axisWindow)),
    [nodes, axisWindow],
  )
  const selected = findSceneNode(nodes, selectedId)
  const hideOthers = isolate && !!selected
  const imported = bridge.importedModel?.meshes ?? []
  const hasImport = imported.length > 0
  const viewXf = useMemo(() => axisWindowViewTransform(axisWindow), [axisWindow])
  const labelAxes = useMemo(() => {
    const axes = axesInWindow(bridge, axisWindow)
    return axes.map((axis) => ({
      ...axis,
      // Only remap road-aligned axes through the span window transform.
      xScene:
        axis.alignment === 'opening'
          ? axis.xScene
          : axis.xScene * viewXf.scale + viewXf.offsetX,
      zScene: axis.zScene ?? 0,
    }))
  }, [bridge, axisWindow, viewXf])

  return (
    <group>
      {/* Structural twin only — no ground, grass, water, or embankment */}
      <gridHelper args={[28, 28, '#1e293b', '#0f172a']} position={[0, -0.5, 0]} />

      {/* Remap selected axis window so 2 spans fill the frame (avoids side-by-side axes) */}
      <group position={[viewXf.offsetX, 0, 0]} scale={viewXf.scale}>
        {visibleNodes.map((node) => {
          const active = selectedId === node.element.id
          if (hideOthers && !active) return null
          return (
            <SceneNodeMesh
              key={node.element.id}
              node={node}
              selected={active}
              onSelect={(pick) => onSelect(node, pick)}
            />
          )
        })}

        {hasImport && (
          <group>
            {imported.map((mesh) => (
              <ImportedIfcMeshView key={mesh.id} bridge={bridge} mesh={mesh} />
            ))}
          </group>
        )}
      </group>

      {/* Labels stay unscaled so axis chips remain readable */}
      <AxisLabelMarkers axes={labelAxes} />
      <CommentMarkers
        nodes={visibleNodes}
        comments={bridge.modelComments}
        viewXf={viewXf}
        selectedId={selectedId}
        onSelectId={(id) => {
          const node = findSceneNode(nodes, id)
          if (node) onSelect(node, null)
        }}
      />
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
  const [axisWindowId, setAxisWindowId] = useState<string | null>(null)
  const [seedUv, setSeedUv] = useState<{ x: number; y: number } | null>(null)
  const [seedNonce, setSeedNonce] = useState(0)
  const controlsRef = useRef(null)

  const nodes = useMemo(() => buildSceneNodes(bridge, colorMode), [bridge, colorMode])
  const selectedNode = findSceneNode(nodes, selectedElementId)
  const axisWindows = useMemo(() => buildAxisWindows(bridge), [bridge])
  const showAxisPicker = needsAxisWindow(bridge)
  const axisWindow = useMemo(
    () => (showAxisPicker ? findAxisWindow(bridge, axisWindowId) : null),
    [bridge, axisWindowId, showAxisPicker],
  )
  const viewXf = useMemo(() => axisWindowViewTransform(axisWindow), [axisWindow])
  const focusTarget = useMemo(() => {
    if (!selectedNode) return null
    return toAxisViewPoint(selectedNode.position, viewXf)
  }, [selectedNode, viewXf])
  const selectedMaterial = selectedNode?.element.material
  const materialCode = normalizeMaterial(selectedMaterial)
  /** Defect tools always draw on the 2D face board so UV stays correct in 3D. */
  const show3d = viewMode === '3d'
  const show2dDraw = viewMode === 'section' || viewMode === 'drawings'
  const drawingActive = !!defectTool && !!selectedElementId && show2dDraw

  useEffect(() => {
    // Reset / clamp window when structure or span count changes
    if (!showAxisPicker) {
      setAxisWindowId(null)
      return
    }
    if (!axisWindowId || !axisWindows.some((w) => w.id === axisWindowId)) {
      setAxisWindowId(axisWindows[0]?.id ?? null)
    }
  }, [bridge.id, bridge.spans, showAxisPicker, axisWindowId, axisWindows])

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
    setDefectTool((t) => {
      const next = t === kind ? null : kind
      if (next && (viewMode === 'section' || viewMode === 'drawings') && selectedElementId) {
        // Already on a 2D board — draw immediately
      } else if (next && viewMode === '3d') {
        // Stay in 3D; next mesh click seeds UV and opens the 2D board
      } else if (!next && viewMode === 'section') {
        onViewMode('3d')
      }
      return next
    })
  }

  function handleElementSelect(node: SceneNode, pick: MeshPickResult | null) {
    onSelectElement({
      id: node.element.id,
      label: node.element.name,
      element: node.element,
    })
    if (!isolate) onIsolateChange(false)

    if (!pick) return

    setDefectFace(pick.face)
    setSeedUv(pick.uv)
    setSeedNonce((n) => n + 1)

    // Precise mesh pick while a draw tool is active → open 2D board at that UV
    if (defectTool || viewMode === 'drawings') {
      if (!defectTool) setDefectTool('crack')
      if (viewMode === '3d') onViewMode('section')
    }
  }

  function openSection() {
    if (!selectedElementId) return
    openCrossSectionWindow(bridge.id, selectedElementId)
  }

  const frameKey = `${bridge.id}:${axisWindow?.id ?? 'all'}:${isolate ? selectedElementId : 'free'}`

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
              if (id === '3d' && defectTool && viewMode !== '3d') {
                // Keep tool armed so user can re-pick on the mesh
              }
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
          className={viewMode === 'section' || viewMode === 'drawings' || drawingActive ? 'active' : ''}
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
        {showAxisPicker && (
          <label
            className="viewer-axis-window"
            title="Select which support axes to display (3-axis window)"
          >
            View axes
            <select
              value={axisWindow?.id ?? ''}
              onChange={(e) => setAxisWindowId(e.target.value)}
            >
              {axisWindows.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label} ({w.spanGroupIds.join('+')})
                </option>
              ))}
            </select>
          </label>
        )}
        {showAxisPicker && (
          <span className="toolbar-sep" />
        )}
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
          title={
            defectTool === 'crack'
              ? 'Click the exact point on the 3D mesh (or draw on the 2D face)'
              : `${toolTitle('crack', selectedMaterial)} — click mesh point or draw in 2D`
          }
          onClick={() => toggleTool('crack')}
        >
          {toolLabel('crack', selectedMaterial)}
        </button>
        <button
          type="button"
          className={defectTool === 'spall' ? 'active warn' : ''}
          title={`${toolTitle('spall', selectedMaterial)} — click mesh point or draw in 2D`}
          onClick={() => toggleTool('spall')}
        >
          {toolLabel('spall', selectedMaterial)}
        </button>
        <button
          type="button"
          className={defectTool === 'patch' ? 'active info' : ''}
          title={`${toolTitle('patch', selectedMaterial)} — click mesh point or draw in 2D`}
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

      <div
        className="viewer-stage"
        style={
          height
            ? { height, minHeight: height }
            : undefined
        }
      >
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
                axisWindow={axisWindow}
                onSelect={handleElementSelect}
              />
              <ContactShadows opacity={0.35} scale={16} blur={2.5} far={8} />
              <OrbitControls
                ref={controlsRef}
                makeDefault
                enableDamping
                dampingFactor={0.08}
                enablePan
                screenSpacePanning
                minDistance={0.05}
                maxDistance={400}
                // No polar clamp — free look above and below the model
                maxPolarAngle={Math.PI}
                minPolarAngle={0}
              />
              <CameraFrameOnce
                frameKey={frameKey}
                isolate={isolate}
                target={focusTarget}
                axisFramed={!isolate && !!axisWindow}
              />
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
              {defectTool
                ? 'Click the exact point on the element mesh — drawing opens on that face at the hit location'
                : !selectedElementId
                  ? 'Orbit freely · pan to look around · pick Crack / Spall / Patch then click the mesh to draw'
                  : isolate
                    ? 'Isolated · pick a defect tool then click the mesh at the defect location'
                    : showAxisPicker
                      ? `${axisWindowCaption(axisWindow, bridge.spans)} · free look · pick a defect tool then click the mesh`
                      : 'Free look · pick Crack / Spall / Patch then click the exact mesh point to draw'}
            </p>
            {showAxisPicker && axisWindow && !isolate && (
              <div className="isolate-badge axis-window-badge">
                {axisWindow.label}
                <em>
                  {axisWindow.supportGroupIds.join(' · ')} ·{' '}
                  {axisWindow.widthM >= 10
                    ? `${Math.round(axisWindow.widthM)} m`
                    : `${axisWindow.widthM.toFixed(1)} m`}{' '}
                  window
                </em>
              </div>
            )}
            {isolate && selectedNode && (
              <div className="isolate-badge">
                Isolated · {selectedNode.element.name} · add defect in the element panel
              </div>
            )}
            {bridge.importedModel && (
              <div className="isolate-badge ifc-badge">
                IFC · {bridge.importedModel.fileName} · {bridge.importedModel.meshCount} meshes
              </div>
            )}
          </>
        )}

        {show2dDraw && (
          <div className="defect-2d-stage">
            <DefectDrawLayer
              active={drawingActive}
              tool={defectTool}
              defects={drawnDefects}
              elementSizeM={elementSizeM}
              face={defectFace}
              selectedElementId={selectedElementId}
              elementName={selectedNode?.element.name}
              material={selectedMaterial}
              defectCode={defectCode ?? undefined}
              unrestricted
              seedUv={seedUv}
              seedNonce={seedNonce}
              onComplete={(defect) =>
                onDrawnDefectsChange([defect, ...drawnDefects])
              }
            />
            {!defectTool && (
              <p className="viewer-hint defect-2d-hint">
                2D face · select Crack / Spall / Patch to draw · or return to 3D and click the exact mesh point
              </p>
            )}
            {defectTool && (
              <p className="viewer-hint defect-2d-hint">
                Drawing on 2D · {FACE_LABEL[defectFace]}
                {seedUv ? ' · seeded from 3D click' : ''} · continue clicking on the face
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
      </div>
    </section>
  )
}
