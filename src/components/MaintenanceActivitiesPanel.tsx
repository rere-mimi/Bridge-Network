import { useMemo, useState } from 'react'
import type { BridgeAsset, BridgeElement } from '../types'
import {
  activitiesForSchedule,
  activitySetsForSchedule,
  MAINTENANCE_CATEGORY_LABEL,
  type MaintenanceCategory,
} from '../data/maintenanceActivities'

type Props = {
  bridge: BridgeAsset
}

function uniqueElements(elements: BridgeElement[]): BridgeElement[] {
  const seen = new Set<string>()
  const out: BridgeElement[] = []
  for (const el of elements) {
    const key = `${el.scheduleNo}`
    if (seen.has(key)) continue
    // Prefer first instance per schedule for activity catalogue lookup
    seen.add(key)
    out.push(el)
  }
  return out.sort((a, b) => a.scheduleNo - b.scheduleNo || a.name.localeCompare(b.name))
}

export function MaintenanceActivitiesPanel({ bridge }: Props) {
  const elementOptions = useMemo(() => uniqueElements(bridge.elements), [bridge.elements])
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(
    () => elementOptions[0]?.scheduleNo ?? null,
  )
  const [categoryFilter, setCategoryFilter] = useState<'all' | MaintenanceCategory>('all')

  const selected =
    elementOptions.find((e) => e.scheduleNo === selectedSchedule) ?? elementOptions[0] ?? null

  const activities = useMemo(() => {
    if (!selected) return []
    const list = activitiesForSchedule(selected.scheduleNo)
    if (categoryFilter === 'all') return list
    return list.filter((a) => a.category === categoryFilter)
  }, [selected, categoryFilter])

  const sets = selected ? activitySetsForSchedule(selected.scheduleNo) : []

  return (
    <div className="maint-activities">
      <header className="maint-activities-header">
        <div>
          <h2>Activities per element</h2>
          <p>
            Recommended maintenance activities from MTQ inspection manual §15.8 (Table 15.8-1).
            Unit price will be applied when an activity is selected at inspection.
          </p>
        </div>
        <dl className="maint-activities-meta">
          <div>
            <dt>Structure</dt>
            <dd>{bridge.name}</dd>
          </div>
          <div>
            <dt>Element types</dt>
            <dd>{elementOptions.length}</dd>
          </div>
          <div>
            <dt>Activities shown</dt>
            <dd>{activities.length}</dd>
          </div>
        </dl>
      </header>

      <div className="maint-activities-layout">
        <aside className="maint-element-picker">
          <label className="model-field">
            Element (Appendix C)
            <select
              value={selected?.scheduleNo ?? ''}
              onChange={(e) => setSelectedSchedule(Number(e.target.value) || null)}
            >
              {elementOptions.map((el) => (
                <option key={el.scheduleNo} value={el.scheduleNo}>
                  {String(el.scheduleNo).padStart(3, '0')} · {el.name.replace(/ \d+$/, '')}
                </option>
              ))}
            </select>
          </label>
          {sets.length > 0 && (
            <ul className="maint-set-tags">
              {sets.map((s) => (
                <li key={s.id}>
                  <strong>{s.group}</strong>
                  <span>{s.element}</span>
                </li>
              ))}
            </ul>
          )}
          {selected && sets.length === 0 && (
            <p className="model-help">
              No mapped activity set for this element yet. Global structure activities may still
              apply at inspection.
            </p>
          )}
        </aside>

        <div className="maint-activity-panel">
          <div className="maint-activity-filters">
            <label>
              Category
              <select
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value as 'all' | MaintenanceCategory)
                }
              >
                <option value="all">All</option>
                <option value="preventive">{MAINTENANCE_CATEGORY_LABEL.preventive}</option>
                <option value="routine">{MAINTENANCE_CATEGORY_LABEL.routine}</option>
                <option value="repair">{MAINTENANCE_CATEGORY_LABEL.repair}</option>
              </select>
            </label>
            <span className="muted">
              Price/unit column reserved for inspection selection
            </span>
          </div>

          <div className="model-dim-table-wrap maint-activity-table-wrap">
            <table className="model-dim-table maint-activity-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Activity</th>
                  <th>Unit</th>
                  <th>Category</th>
                  <th>Price / unit</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => (
                  <tr key={a.code}>
                    <td>{a.code}</td>
                    <td>{a.description}</td>
                    <td>{a.unit}</td>
                    <td>{MAINTENANCE_CATEGORY_LABEL[a.category].split(' (')[0]}</td>
                    <td className="price-pending">
                      {a.unitPrice != null ? `$${a.unitPrice}` : '—'}
                    </td>
                  </tr>
                ))}
                {activities.length === 0 && (
                  <tr>
                    <td colSpan={5} className="dim-na">
                      No activities for this element / filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
