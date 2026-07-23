import { Canvas } from '@react-three/fiber'
import { ContactShadows, Html, OrbitControls } from '@react-three/drei'
import { useMemo, useState } from 'react'
import type { BridgeAsset, BridgeElement, ConditionBand } from '../types'

const BAND_COLOR: Record<ConditionBand, string> = {
  excellent: '#22c55e',
  good: '#84cc16',
  fair: '#eab308',
  poor: '#f97316',
  critical: '#ef4444',
}

type Hotspot = {
  id: string
  label: string
  position: [number, number, number]
  element: BridgeElement
  detail: string
}

function buildHotspots(bridge: BridgeAsset): Hotspot[] {
  const pier = bridge.elements.find((e) => e.code === 'PIE' || e.code === 'SUP')
  const girder = bridge.elements.find((e) => e.code === 'GIR' || e.code === 'SUP' || e.code === 'DEC')
  const bearing = bridge.elements.find((e) => e.code === 'BEA')
  const deck = bridge.elements.find((e) => e.code === 'DEC')

  const spots: Hotspot[] = []
  if (pier) {
    spots.push({
      id: 'pier-2',
      label: 'Pier 2',
      position: [-1.2, 0.55, 0.15],
      element: pier,
      detail: `${bridge.defects.filter((d) => d.elementCode === pier.code).length || 2} Defects`,
    })
  }
  if (girder) {
    spots.push({
      id: 'girder-g4',
      label: girder.code === 'GIR' ? 'Girder G4' : girder.name,
      position: [0.4, 1.35, 0.35],
      element: girder,
      detail: `Condition: ${girder.band}`,
    })
  }
  if (deck) {
    spots.push({
      id: 'deck',
      label: 'Deck panel',
      position: [1.6, 1.55, 0],
      element: deck,
      detail: `Score ${deck.conditionScore}`,
    })
  }
  if (bearing) {
    spots.push({
      id: 'bearing',
      label: 'Bearing line',
      position: [-2.4, 1.05, 0.2],
      element: bearing,
      detail: `Risk ${bearing.riskScore}`,
    })
  }
  return spots
}

function BridgeModel({
  bridge,
  selectedId,
  onSelect,
}: {
  bridge: BridgeAsset
  selectedId: string | null
  onSelect: (hotspot: Hotspot) => void
}) {
  const hotspots = useMemo(() => buildHotspots(bridge), [bridge])
  const spanCount = Math.min(Math.max(bridge.spans, 3), 6)

  return (
    <group>
      {/* water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]} receiveShadow>
        <planeGeometry args={[18, 10]} />
        <meshStandardMaterial color="#1d4f63" roughness={0.35} metalness={0.2} />
      </mesh>

      {/* banks */}
      <mesh position={[-6.2, 0.05, 0]} castShadow>
        <boxGeometry args={[3.5, 0.8, 8]} />
        <meshStandardMaterial color="#3f4f46" />
      </mesh>
      <mesh position={[6.2, 0.05, 0]} castShadow>
        <boxGeometry args={[3.5, 0.8, 8]} />
        <meshStandardMaterial color="#3f4f46" />
      </mesh>

      {/* piers */}
      {Array.from({ length: spanCount - 1 }).map((_, i) => {
        const x = -3.5 + (i + 1) * (7 / spanCount)
        return (
          <group key={`pier-${i}`} position={[x, 0, 0]}>
            <mesh position={[0, 0.35, 0]} castShadow>
              <boxGeometry args={[0.35, 1.1, 1.4]} />
              <meshStandardMaterial color="#9aa3a7" />
            </mesh>
            <mesh position={[0, 0.95, 0]} castShadow>
              <boxGeometry args={[0.7, 0.18, 1.7]} />
              <meshStandardMaterial color="#b0b8bc" />
            </mesh>
          </group>
        )
      })}

      {/* deck */}
      <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[9.2, 0.22, 2.2]} />
        <meshStandardMaterial color="#6b7280" roughness={0.85} />
      </mesh>

      {/* girders */}
      {[-0.7, -0.25, 0.25, 0.7].map((z, i) => (
        <mesh key={`girder-${i}`} position={[0, 1.05, z]} castShadow>
          <boxGeometry args={[8.8, 0.28, 0.18]} />
          <meshStandardMaterial color="#4b5563" metalness={0.3} roughness={0.5} />
        </mesh>
      ))}

      {/* barriers */}
      <mesh position={[0, 1.55, 1.05]}>
        <boxGeometry args={[9.2, 0.28, 0.08]} />
        <meshStandardMaterial color="#d1d5db" />
      </mesh>
      <mesh position={[0, 1.55, -1.05]}>
        <boxGeometry args={[9.2, 0.28, 0.08]} />
        <meshStandardMaterial color="#d1d5db" />
      </mesh>

      {/* road markings */}
      <mesh position={[0, 1.37, 0]}>
        <boxGeometry args={[8.6, 0.01, 0.06]} />
        <meshStandardMaterial color="#f8fafc" emissive="#94a3b8" emissiveIntensity={0.2} />
      </mesh>

      {hotspots.map((spot) => {
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
              <sphereGeometry args={[active ? 0.14 : 0.11, 24, 24]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={active ? 0.8 : 0.45}
              />
            </mesh>
            <Html distanceFactor={8} position={[0, 0.35, 0]} center>
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

type TwinViewerProps = {
  bridge: BridgeAsset
  selectedElementId: string | null
  onSelectElement: (payload: {
    id: string
    label: string
    element: BridgeElement
  }) => void
  viewMode: '3d' | 'map' | 'drawings'
  onViewMode: (mode: '3d' | 'map' | 'drawings') => void
}

export function TwinViewer({
  bridge,
  selectedElementId,
  onSelectElement,
  viewMode,
  onViewMode,
}: TwinViewerProps) {
  const [hoverHint] = useState('Orbit · click pins for element detail')

  return (
    <section className="twin-viewer">
      <div className="viewer-tabs">
        {(
          [
            ['3d', '3D Model'],
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

      <div className="viewer-stage">
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
                onSelect={(spot) =>
                  onSelectElement({
                    id: spot.id,
                    label: spot.label,
                    element: spot.element,
                  })
                }
              />
              <ContactShadows opacity={0.35} scale={16} blur={2.5} far={8} />
              <OrbitControls
                makeDefault
                maxPolarAngle={Math.PI / 2.05}
                minDistance={4}
                maxDistance={14}
              />
            </Canvas>
            <div className="viewer-tools" aria-hidden="true">
              <span>↻</span>
              <span>↔</span>
              <span>⌕</span>
            </div>
            <div className="condition-scale">
              <p>Condition scale</p>
              {Object.entries(BAND_COLOR).map(([band, color]) => (
                <div key={band}>
                  <i style={{ background: color }} />
                  {band}
                </div>
              ))}
            </div>
            <p className="viewer-hint">{hoverHint}</p>
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
