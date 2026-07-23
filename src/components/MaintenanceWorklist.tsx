import { useMemo } from 'react'
import type { BridgeAsset, MaintenanceRecommendation } from '../types'
import { formatMoney, unitLabel } from '../data/activityPricing'
import {
  costByCategory,
  recommendationsForBridge,
  totalRecommendationCost,
} from '../data/recommendations'
import { MAINTENANCE_CATEGORY_LABEL } from '../data/maintenanceActivities'

type Props = {
  bridge: BridgeAsset
  onUpdateStatus?: (id: string, status: MaintenanceRecommendation['status']) => void
  onRemove?: (id: string) => void
}

export function MaintenanceWorklist({ bridge, onUpdateStatus, onRemove }: Props) {
  const items = recommendationsForBridge(bridge)
  const open = useMemo(
    () => items.filter((r) => r.status === 'proposed' || r.status === 'approved'),
    [items],
  )
  const totals = costByCategory(items)
  const openTotal = totalRecommendationCost(items, ['proposed', 'approved'])

  return (
    <div className="maint-worklist">
      <header className="maint-worklist-header">
        <div>
          <h2>Costed worklist</h2>
          <p>
            Activities selected during inspection for <strong>{bridge.name}</strong>. Unit prices
            are in NZD.
          </p>
        </div>
        <dl className="maint-worklist-kpis">
          <div>
            <dt>Open total</dt>
            <dd>{formatMoney(openTotal)}</dd>
          </div>
          <div>
            <dt>Preventive / routine</dt>
            <dd>{formatMoney(totals.preventive + totals.routine)}</dd>
          </div>
          <div>
            <dt>Repair</dt>
            <dd>{formatMoney(totals.repair)}</dd>
          </div>
          <div>
            <dt>Items</dt>
            <dd>{open.length}</dd>
          </div>
        </dl>
      </header>

      <div className="model-dim-table-wrap maint-worklist-table-wrap">
        <table className="model-dim-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Activity</th>
              <th>Element</th>
              <th>Qty</th>
              <th>Unit price</th>
              <th>Total</th>
              <th>Category</th>
              <th>Status</th>
              {onRemove || onUpdateStatus ? <th /> : null}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={9} className="dim-na">
                  No inspection recommendations yet. Select activities on Overview while inspecting
                  an element, then save the inspection.
                </td>
              </tr>
            )}
            {items.map((r) => (
              <tr key={r.id}>
                <td>{r.activityCode}</td>
                <td>{r.activityDescription}</td>
                <td>
                  {r.groupId} · {r.elementName}
                </td>
                <td>
                  {r.quantity} {unitLabel(r.unit)}
                </td>
                <td>{formatMoney(r.unitPrice)}</td>
                <td>
                  <strong>{formatMoney(r.totalCost)}</strong>
                </td>
                <td>{MAINTENANCE_CATEGORY_LABEL[r.category].split(' (')[0]}</td>
                <td>
                  {onUpdateStatus ? (
                    <select
                      value={r.status}
                      onChange={(e) =>
                        onUpdateStatus(r.id, e.target.value as MaintenanceRecommendation['status'])
                      }
                    >
                      <option value="proposed">Proposed</option>
                      <option value="approved">Approved</option>
                      <option value="completed">Completed</option>
                      <option value="deferred">Deferred</option>
                    </select>
                  ) : (
                    r.status
                  )}
                </td>
                {(onRemove || onUpdateStatus) && (
                  <td>
                    {onRemove && (
                      <button
                        type="button"
                        className="page-btn ghost"
                        onClick={() => onRemove(r.id)}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
