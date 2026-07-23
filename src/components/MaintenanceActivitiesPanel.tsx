import { useMemo, useState } from 'react'
import type { BridgeAsset, BridgeElement } from '../types'
import {
  formatMoney,
  saveActivityPriceOverride,
  unitPriceForActivity,
} from '../data/activityPricing'
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
  const [priceTick, setPriceTick] = useState(0)

  const selected =
    elementOptions.find((e) => e.scheduleNo === selectedSchedule) ?? elementOptions[0] ?? null

  const activities = useMemo(() => {
    void priceTick
    if (!selected) return []
    const list = activitiesForSchedule(selected.scheduleNo)
    if (categoryFilter === 'all') return list
    return list.filter((a) => a.category === categoryFilter)
  }, [selected, categoryFilter, priceTick])

  const sets = selected ? activitySetsForSchedule(selected.scheduleNo) : []

  return (
    <div className="maint-activities">
      <header className="maint-activities-header">
        <div>
          <h2>Activities per element</h2>
          <p>
            MTQ §15.8 catalogue mapped to Appendix C elements. Edit unit prices (NZD) here — they
            apply when selecting activities during inspection.
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
            <span className="muted">Prices editable · saved in this browser</span>
          </div>

          <div className="model-dim-table-wrap maint-activity-table-wrap">
            <table className="model-dim-table maint-activity-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Activity</th>
                  <th>Unit</th>
                  <th>Category</th>
                  <th>Price / unit (NZD)</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => {
                  const price = unitPriceForActivity(a.code, a.unitPrice)
                  return (
                    <tr key={a.code}>
                      <td>{a.code}</td>
                      <td>{a.description}</td>
                      <td>{a.unit}</td>
                      <td>{MAINTENANCE_CATEGORY_LABEL[a.category].split(' (')[0]}</td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          step="1"
                          className="price-input"
                          value={price}
                          title={formatMoney(price)}
                          onChange={(e) => {
                            const v = Number(e.target.value)
                            saveActivityPriceOverride(a.code, Number.isFinite(v) ? v : 0)
                            setPriceTick((t) => t + 1)
                          }}
                        />
                      </td>
                    </tr>
                  )
                })}
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
