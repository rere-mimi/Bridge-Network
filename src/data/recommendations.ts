import type {
  BridgeAsset,
  BridgeElement,
  ConditionState,
  MaintenanceRecommendation,
  MaintenanceRecommendationStatus,
} from '../types'
import {
  activityByCode,
  activitiesForSchedule,
  type MaintenanceActivity,
  type MaintenanceCategory,
} from './maintenanceActivities'
import { unitPriceForActivity } from './activityPricing'
import { evaluateElementConditionState } from './conditionState'

export function createRecommendationId(): string {
  return `rec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function buildRecommendation(input: {
  activity: MaintenanceActivity
  element: BridgeElement
  quantity: number
  unitPrice?: number
  status?: MaintenanceRecommendationStatus
  inspectionId?: string
  notes?: string
  conditionState?: ConditionState
}): MaintenanceRecommendation {
  const unitPrice = input.unitPrice ?? unitPriceForActivity(input.activity.code, input.activity.unitPrice)
  const quantity = Math.max(0, input.quantity)
  return {
    id: createRecommendationId(),
    activityCode: input.activity.code,
    activityDescription: input.activity.description,
    unit: input.activity.unit,
    category: input.activity.category,
    quantity,
    unitPrice,
    totalCost: Math.round(quantity * unitPrice * 100) / 100,
    elementId: input.element.id,
    elementName: input.element.name,
    scheduleNo: input.element.scheduleNo,
    groupId: input.element.groupId,
    status: input.status ?? 'proposed',
    inspectionId: input.inspectionId,
    notes: input.notes,
    createdAt: new Date().toISOString(),
    conditionState: input.conditionState,
  }
}

export function availableActivitiesForElement(element: BridgeElement): MaintenanceActivity[] {
  return activitiesForSchedule(element.scheduleNo)
}

export function recommendationsForBridge(bridge: BridgeAsset): MaintenanceRecommendation[] {
  return bridge.recommendations ?? []
}

export function recommendationsForElement(
  bridge: BridgeAsset,
  elementId: string,
): MaintenanceRecommendation[] {
  return recommendationsForBridge(bridge).filter((r) => r.elementId === elementId)
}

export function totalRecommendationCost(
  items: MaintenanceRecommendation[],
  statuses?: MaintenanceRecommendationStatus[],
): number {
  return items
    .filter((r) => !statuses || statuses.includes(r.status))
    .reduce((s, r) => s + r.totalCost, 0)
}

export function costByCategory(
  items: MaintenanceRecommendation[],
): Record<MaintenanceCategory, number> {
  const out: Record<MaintenanceCategory, number> = {
    preventive: 0,
    routine: 0,
    repair: 0,
    major: 0,
  }
  for (const r of items) {
    if (r.status === 'deferred' || r.status === 'completed') continue
    out[r.category] += r.totalCost
  }
  return out
}

export function upsertRecommendation(
  list: MaintenanceRecommendation[],
  next: MaintenanceRecommendation,
): MaintenanceRecommendation[] {
  const idx = list.findIndex(
    (r) =>
      r.id === next.id ||
      (r.elementId === next.elementId &&
        r.activityCode === next.activityCode &&
        r.status === 'proposed'),
  )
  if (idx >= 0) {
    const copy = [...list]
    copy[idx] = { ...next, id: list[idx].id }
    return copy
  }
  return [next, ...list]
}

export function removeRecommendation(
  list: MaintenanceRecommendation[],
  id: string,
): MaintenanceRecommendation[] {
  return list.filter((r) => r.id !== id)
}

export function applyRecommendationsToStructure(
  bridge: BridgeAsset,
  recommendations: MaintenanceRecommendation[],
  drawnDefects: BridgeAsset['drawnDefects'],
  options?: { inspectionSummary?: string },
): BridgeAsset {
  const today = new Date().toISOString().slice(0, 10)
  const openCost = totalRecommendationCost(recommendations, ['proposed', 'approved'])
  const byCat = costByCategory(recommendations)

  // Update element scores from provisional CS where defects exist
  const elements = bridge.elements.map((el) => {
    const pinned = (drawnDefects ?? []).filter((d) => d.elementId === el.id)
    if (!pinned.length) return el
    const sizeM = el.sizeM
      ? {
          length: el.sizeM.length ?? 1,
          width: el.sizeM.width ?? el.sizeM.diameter ?? 1,
          height: el.sizeM.height ?? 1,
        }
      : null
    const evalResult = evaluateElementConditionState(el, drawnDefects ?? [], sizeM)
    return {
      ...el,
      conditionScore: evalResult.conditionScore,
      band: evalResult.band,
    }
  })

  const conditionIndex = elements.length
    ? Math.round(elements.reduce((s, e) => s + e.conditionScore, 0) / elements.length)
    : bridge.conditionIndex

  const inspection = {
    id: `i-${bridge.id}-${Date.now()}`,
    date: today,
    inspector: 'Field inspection',
    summary:
      options?.inspectionSummary?.trim() ||
      `Inspection update · ${recommendations.filter((r) => r.status === 'proposed').length} proposed activities · est. $${Math.round(openCost).toLocaleString()}`,
    score: conditionIndex,
  }

  // Rough envelope: convert NZD totals to $M-ish forecast bump for current year bucket
  const routineM = Math.round(((byCat.preventive + byCat.routine) / 1_000_000) * 1000) / 1000
  const rehabM = Math.round((byCat.repair / 1_000_000) * 1000) / 1000
  const year = new Date().getFullYear()
  const maintenanceForecast = bridge.maintenanceForecast.map((row) =>
    row.year === year || row.year === bridge.maintenanceForecast[0]?.year
      ? {
          ...row,
          routine: Math.max(row.routine, routineM || row.routine),
          rehab: Math.max(row.rehab, rehabM || row.rehab),
        }
      : row,
  )

  return {
    ...bridge,
    elements,
    recommendations,
    drawnDefects: drawnDefects ?? [],
    lastInspection: today,
    conditionIndex,
    conditionBand:
      conditionIndex >= 90
        ? 'excellent'
        : conditionIndex >= 80
          ? 'good'
          : conditionIndex >= 65
            ? 'fair'
            : conditionIndex >= 50
              ? 'poor'
              : 'critical',
    inspections: [inspection, ...bridge.inspections].slice(0, 12),
    maintenanceForecast,
    documents: {
      ...bridge.documents,
      reports: bridge.documents.reports + 1,
    },
    source: 'user',
  }
}

export function suggestQuantity(
  activity: MaintenanceActivity,
  element: BridgeElement,
  percentAreaInDefect?: number,
): number {
  if (activity.unit === 'each' || activity.unit === '—') return 1
  if (activity.unit === 'hour') return 4
  if (activity.unit === 'm²') {
    const base = element.unit === 'm²' ? element.totalQuantity : (element.sizeM?.length ?? 10) * (element.sizeM?.width ?? 3)
    const pct = Math.max(0.02, (percentAreaInDefect ?? 5) / 100)
    return Math.round(Math.max(0.5, base * pct) * 10) / 10
  }
  // m
  const len = element.sizeM?.length ?? element.totalQuantity ?? 10
  return Math.round(Math.max(1, len * 0.25) * 10) / 10
}

export function activityOrThrow(code: number): MaintenanceActivity {
  const a = activityByCode(code)
  if (!a) throw new Error(`Unknown activity ${code}`)
  return a
}
