import type { BridgeAsset } from '../types'
import type { NzMapBridge } from './nzBridgeCatalogue'
import { defaultGeometry } from './structureGeometry'
import { buildStructureFromDraft, nextStructureId, type StructureDraft } from './structureFactory'

function lengthFromHighway(highway: string): number {
  switch (highway) {
    case 'motorway':
    case 'trunk':
      return 120
    case 'primary':
      return 80
    case 'secondary':
      return 45
    default:
      return 28
  }
}

export function draftFromMapBridge(
  bridge: NzMapBridge,
  existingIds: string[],
): StructureDraft {
  const lengthM = lengthFromHighway(bridge.highway)
  const spans = bridge.highway === 'motorway' || bridge.highway === 'trunk' ? 3 : 1
  const deckWidthM = bridge.highway === 'motorway' ? 14 : 10
  const girderCountPerSpan = 4
  return {
    id: nextStructureId(existingIds),
    name: bridge.name,
    road: bridge.road || bridge.highway || 'Local road',
    region: bridge.region,
    city: bridge.region.split('/')[0]?.trim() || 'New Zealand',
    lat: bridge.lat,
    lng: bridge.lng,
    yearBuilt: 1980,
    lengthM,
    spans,
    deckWidthM,
    material: 'Concrete',
    owner: 'Map import (NZ network)',
    family: 'girder',
    girderCountPerSpan,
    geometry: defaultGeometry({
      lengthM,
      spans,
      deckWidthM,
      kind: 'bridge',
      family: 'girder',
      girderCountPerSpan,
    }),
    notes: `Imported from NZ map catalogue · OSM ${bridge.id}`,
  }
}

export function structureFromMapBridge(
  bridge: NzMapBridge,
  existingIds: string[],
): BridgeAsset {
  const draft = draftFromMapBridge(bridge, existingIds)
  const asset = buildStructureFromDraft(draft)
  return {
    ...asset,
    source: 'user',
    photoLabel: 'Map-imported bridge',
  }
}
