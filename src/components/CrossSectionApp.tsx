import { useMemo } from 'react'
import { loadStructureDatabase } from '../data/structureStore'
import { buildSceneNodes, findSceneNode } from '../data/sceneLayout'
import { CrossSectionView } from './CrossSectionView'

function parseSectionParams() {
  const full = window.location.hash
  const qIndex = full.indexOf('?')
  const params = new URLSearchParams(qIndex >= 0 ? full.slice(qIndex + 1) : '')
  return {
    bridgeId: params.get('bridge') ?? '',
    elementId: params.get('element') ?? '',
  }
}

export function CrossSectionApp() {
  const { bridgeId, elementId } = useMemo(() => parseSectionParams(), [])
  const structures = useMemo(() => loadStructureDatabase(), [])
  const bridge = structures.find((b) => b.id === bridgeId) ?? structures[0]
  const nodes = useMemo(() => (bridge ? buildSceneNodes(bridge) : []), [bridge])
  const node =
    findSceneNode(nodes, elementId) ??
    nodes.find((n) => n.element.id === elementId) ??
    nodes[0]

  if (!bridge || !node) {
    return (
      <div className="section-window empty">
        <h1>No element selected</h1>
        <p>Open a cross-section from the twin viewer with an element selected.</p>
      </div>
    )
  }

  return (
    <CrossSectionView
      element={node.element}
      node={node}
      bridgeName={bridge.name}
      bridgeId={bridge.id}
    />
  )
}

export function openCrossSectionWindow(bridgeId: string, elementId: string) {
  const url = `${import.meta.env.BASE_URL}#/section?bridge=${encodeURIComponent(bridgeId)}&element=${encodeURIComponent(elementId)}`
  window.open(
    url,
    `section-${elementId}`,
    'popup=yes,width=1200,height=900,menubar=no,toolbar=no,location=no,status=no',
  )
}
