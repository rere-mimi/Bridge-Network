import type { BridgeAsset } from '../types'
import type { NzMapBridge } from './nzBridgeCatalogue'
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
  return {
    id: nextStructureId(existingIds),
    name: bridge.name,
    road: bridge.road || bridge.highway || 'Local road',
    region: bridge.region,
    city: bridge.region.split('/')[0]?.trim() || 'New Zealand',
    lat: bridge.lat,
    lng: bridge.lng,
    yearBuilt: 1980,
    lengthM: lengthFromHighway(bridge.highway),
    spans: bridge.highway === 'motorway' || bridge.highway === 'trunk' ? 3 : 1,
    deckWidthM: bridge.highway === 'motorway' ? 14 : 10,
    material: 'Concrete',
    owner: 'Map import (NZ network)',
    family: 'girder',
    girderCountPerSpan: 4,
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
