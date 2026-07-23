/**
 * Indicative unit prices (NZD) for MTQ maintenance activities.
 * Overridable in Settings / Maintenance; used when selecting activities at inspection.
 */

import type { MaintenanceUnit } from './maintenanceActivities'

const STORAGE_KEY = 'bridge-network-activity-prices-v1'

/** Sensible default unit rates — editable later. */
export const DEFAULT_ACTIVITY_PRICES: Record<number, number> = {
  1011: 45,
  1012: 40,
  1013: 25,
  1014: 180,
  1015: 220,
  1016: 55,
  1017: 250,
  1018: 95,
  1031: 180,
  1041: 85,
  1042: 35,
  1051: 120,
  1052: 95,
  1061: 75,
  1062: 65,
  1071: 350,
  1081: 110,
  1082: 140,
  1083: 95,
  1091: 800,
  2001: 1500,
  2011: 450,
  2012: 450,
  2051: 220,
  2052: 130,
  2053: 600,
  2071: 95,
  2131: 180,
  2201: 85,
  2311: 900,
  2312: 1200,
  2331: 70,
  3001: 4500,
  3005: 2800,
  3011: 950,
  3012: 12000,
  3021: 18000,
  3022: 180,
  3023: 220,
  3026: 95,
  3027: 55,
  3031: 2200,
  3032: 3500,
  3033: 4800,
  3034: 650,
  3035: 25000,
  3042: 1800,
  3043: 3200,
  3044: 8500,
  3045: 4200,
  3046: 9500,
  3051: 1200,
  3052: 980,
  3053: 1500,
  3054: 280,
  3061: 420,
  3062: 1800,
  3063: 6500,
  3064: 4200,
  3065: 185,
  3066: 8500,
  3067: 95,
  3068: 12000,
  3069: 5500,
  3071: 280,
  3072: 2200,
  3073: 380,
  3074: 320,
  3081: 480,
  3082: 520,
  3083: 450,
  3084: 390,
  3091: 420,
  3092: 380,
  3093: 290,
  3094: 3200,
  3095: 260,
  3106: 180,
  3111: 520,
  3112: 540,
  3113: 560,
  3114: 12000,
  3115: 210,
  3121: 380,
  3122: 4500,
  3124: 420,
  3125: 580,
  3126: 15000,
  3127: 620,
  3131: 480,
  3132: 460,
  3134: 350,
  3135: 520,
  3136: 320,
  3201: 2800,
  3211: 3500,
  3212: 3800,
  3221: 2600,
  3222: 8500,
  3223: 18000,
  3224: 4200,
  3231: 380,
  3232: 520,
  3311: 420,
  3312: 380,
  3314: 1800,
  3315: 1600,
  3321: 1400,
  3322: 320,
  3323: 1200,
  3331: 280,
  3332: 260,
  3333: 320,
  3334: 180,
  3335: 210,
  3337: 950,
  3341: 290,
  3342: 1600,
  3343: 1400,
  3344: 900,
  3345: 1200,
  3346: 180,
  3347: 160,
  3348: 95,
  3349: 1100,
  3411: 450,
}

function readOverrides(): Record<number, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, number>
    const out: Record<number, number> = {}
    for (const [k, v] of Object.entries(parsed)) {
      const code = Number(k)
      if (Number.isFinite(code) && typeof v === 'number' && v >= 0) out[code] = v
    }
    return out
  } catch {
    return {}
  }
}

export function loadActivityPriceOverrides(): Record<number, number> {
  return readOverrides()
}

export function saveActivityPriceOverride(code: number, price: number | null) {
  const all = readOverrides()
  if (price == null || !Number.isFinite(price)) delete all[code]
  else all[code] = Math.max(0, price)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function saveActivityPriceOverrides(map: Record<number, number>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

/** Resolved unit price for an activity (override → default → 0). */
export function unitPriceForActivity(code: number, fallback?: number | null): number {
  const overrides = readOverrides()
  if (overrides[code] != null) return overrides[code]
  if (fallback != null && fallback > 0) return fallback
  return DEFAULT_ACTIVITY_PRICES[code] ?? 0
}

export function formatMoney(amount: number, digits = 0): string {
  return amount.toLocaleString(undefined, {
    style: 'currency',
    currency: 'NZD',
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })
}

export function unitLabel(unit: MaintenanceUnit): string {
  switch (unit) {
    case 'each':
      return 'each'
    case 'hour':
      return 'hour'
    case 'm²':
      return 'm²'
    case 'm':
      return 'm'
    default:
      return 'lump sum'
  }
}
