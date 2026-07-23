import type { BridgeAsset } from '../types'
import { BRIDGES } from './bridges'

const STORAGE_KEY = 'bridge-network-user-structures-v1'

function readUserStructures(): BridgeAsset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as BridgeAsset[]
    if (!Array.isArray(parsed)) return []
    return parsed.map((item) => ({ ...item, source: 'user' as const }))
  } catch {
    return []
  }
}

function writeUserStructures(items: BridgeAsset[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function loadStructureDatabase(): BridgeAsset[] {
  const seed = BRIDGES.map((b) => ({
    ...b,
    source: b.source ?? ('seed' as const),
    kind: b.kind ?? ('bridge' as const),
  }))
  const user = readUserStructures()
  const byId = new Map<string, BridgeAsset>()
  for (const item of seed) byId.set(item.id, item)
  for (const item of user) byId.set(item.id, item)
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id))
}

export function saveUserStructure(structure: BridgeAsset): BridgeAsset[] {
  const user = readUserStructures().filter((item) => item.id !== structure.id)
  user.push({ ...structure, source: 'user' })
  writeUserStructures(user)
  return loadStructureDatabase()
}

export function deleteUserStructure(id: string): BridgeAsset[] {
  const user = readUserStructures().filter((item) => item.id !== id)
  writeUserStructures(user)
  return loadStructureDatabase()
}

export function exportDatabaseJson(structures: BridgeAsset[]): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      count: structures.length,
      structures,
    },
    null,
    2,
  )
}
