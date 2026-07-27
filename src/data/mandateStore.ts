import type { InspectionMandate, InspectionMandateItem, InspectionMandateStatus } from '../types'

const STORAGE_KEY = 'bridge-network-inspection-mandates-v1'

function readMandates(): InspectionMandate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as InspectionMandate[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((m) => m && typeof m.id === 'string' && Array.isArray(m.items))
      .map(normalizeMandate)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  } catch {
    return []
  }
}

function writeMandates(items: InspectionMandate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function normalizeMandate(m: InspectionMandate): InspectionMandate {
  const items = m.items
    .filter((item) => item && typeof item.structureId === 'string')
    .map((item, index) => ({
      structureId: String(item.structureId).trim(),
      order: Number.isFinite(item.order) && item.order > 0 ? item.order : index + 1,
      addedAt: item.addedAt || m.createdAt || new Date().toISOString(),
      notes: item.notes,
      visitedAt: item.visitedAt ?? null,
    }))
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({ ...item, order: index + 1 }))

  return {
    ...m,
    title: m.title?.trim() || 'Untitled mandate',
    createdBy: m.createdBy?.trim() || 'PM',
    status: m.status ?? 'draft',
    items,
  }
}

function nextId(existing: InspectionMandate[]): string {
  const stamp = Date.now().toString(36)
  const n = existing.length + 1
  return `IM-${stamp}-${String(n).padStart(3, '0')}`
}

export function loadMandates(): InspectionMandate[] {
  return readMandates()
}

export function getMandate(id: string): InspectionMandate | null {
  return readMandates().find((m) => m.id === id) ?? null
}

export function createMandate(input: {
  title: string
  createdBy?: string
  dueDate?: string
  notes?: string
  structureIds?: string[]
}): InspectionMandate {
  const existing = readMandates()
  const now = new Date().toISOString()
  const structureIds = [...new Set((input.structureIds ?? []).map((id) => id.trim()).filter(Boolean))]
  const items: InspectionMandateItem[] = structureIds.map((structureId, index) => ({
    structureId,
    order: index + 1,
    addedAt: now,
    visitedAt: null,
  }))
  const mandate: InspectionMandate = {
    id: nextId(existing),
    title: input.title.trim() || 'Inspection mandate',
    createdBy: input.createdBy?.trim() || 'PM',
    createdAt: now,
    updatedAt: now,
    dueDate: input.dueDate || undefined,
    status: 'draft',
    notes: input.notes?.trim() || undefined,
    items,
  }
  writeMandates([mandate, ...existing])
  return mandate
}

export function saveMandate(mandate: InspectionMandate): InspectionMandate[] {
  const existing = readMandates()
  const normalized = normalizeMandate({
    ...mandate,
    updatedAt: new Date().toISOString(),
  })
  const next = [normalized, ...existing.filter((m) => m.id !== normalized.id)]
  writeMandates(next)
  return next
}

export function deleteMandate(id: string): InspectionMandate[] {
  const next = readMandates().filter((m) => m.id !== id)
  writeMandates(next)
  return next
}

export function setMandateStatus(
  id: string,
  status: InspectionMandateStatus,
): InspectionMandate[] {
  const existing = readMandates()
  const target = existing.find((m) => m.id === id)
  if (!target) return existing
  return saveMandate({ ...target, status })
}

/** Add structure IDs to a mandate (deduped, appended in given order). */
export function addStructuresToMandate(
  mandateId: string,
  structureIds: string[],
): InspectionMandate | null {
  const existing = readMandates()
  const mandate = existing.find((m) => m.id === mandateId)
  if (!mandate) return null

  const known = new Set(mandate.items.map((item) => item.structureId))
  const now = new Date().toISOString()
  let order = mandate.items.length
  const additions: InspectionMandateItem[] = []
  for (const raw of structureIds) {
    const structureId = raw.trim()
    if (!structureId || known.has(structureId)) continue
    known.add(structureId)
    order += 1
    additions.push({
      structureId,
      order,
      addedAt: now,
      visitedAt: null,
    })
  }
  if (additions.length === 0) return mandate

  const next = {
    ...mandate,
    status: mandate.status === 'draft' ? ('active' as const) : mandate.status,
    items: [...mandate.items, ...additions],
  }
  saveMandate(next)
  return getMandate(mandateId)
}

export function removeStructureFromMandate(
  mandateId: string,
  structureId: string,
): InspectionMandate | null {
  const mandate = getMandate(mandateId)
  if (!mandate) return null
  const items = mandate.items
    .filter((item) => item.structureId !== structureId)
    .map((item, index) => ({ ...item, order: index + 1 }))
  saveMandate({ ...mandate, items })
  return getMandate(mandateId)
}

export function reorderMandateItem(
  mandateId: string,
  structureId: string,
  direction: 'up' | 'down',
): InspectionMandate | null {
  const mandate = getMandate(mandateId)
  if (!mandate) return null
  const items = [...mandate.items].sort((a, b) => a.order - b.order)
  const index = items.findIndex((item) => item.structureId === structureId)
  if (index < 0) return mandate
  const swapWith = direction === 'up' ? index - 1 : index + 1
  if (swapWith < 0 || swapWith >= items.length) return mandate
  ;[items[index], items[swapWith]] = [items[swapWith], items[index]]
  const reordered = items.map((item, i) => ({ ...item, order: i + 1 }))
  saveMandate({ ...mandate, items: reordered })
  return getMandate(mandateId)
}

export function markMandateItemVisited(
  mandateId: string,
  structureId: string,
  visited = true,
): InspectionMandate | null {
  const mandate = getMandate(mandateId)
  if (!mandate) return null
  const items = mandate.items.map((item) =>
    item.structureId === structureId
      ? { ...item, visitedAt: visited ? new Date().toISOString() : null }
      : item,
  )
  saveMandate({ ...mandate, items })
  return getMandate(mandateId)
}
