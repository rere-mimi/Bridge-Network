import { useMemo, useState } from 'react'
import type { BridgeAsset, BridgeElement, MaintenanceRecommendation } from '../types'
import { formatMoney, unitLabel, unitPriceForActivity } from '../data/activityPricing'
import { evaluateElementConditionState } from '../data/conditionState'
import {
  availableActivitiesForElement,
  buildRecommendation,
  suggestQuantity,
  upsertRecommendation,
  removeRecommendation,
} from '../data/recommendations'
import { MAINTENANCE_CATEGORY_LABEL } from '../data/maintenanceActivities'

type Props = {
  bridge: BridgeAsset
  element: BridgeElement | null
  recommendations: MaintenanceRecommendation[]
  drawnDefectCount: number
  sizeM?: { length: number; width: number; height: number } | null
  onChange: (next: MaintenanceRecommendation[]) => void
}

export function InspectionActivityPicker({
  bridge,
  element,
  recommendations,
  drawnDefectCount,
  sizeM,
  onChange,
}: Props) {
  const activities = useMemo(
    () => (element ? availableActivitiesForElement(element) : []),
    [element],
  )
  const [activityCode, setActivityCode] = useState<number | ''>('')
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)
  const [notes, setNotes] = useState('')

  const condition = useMemo(() => {
    if (!element) return null
    return evaluateElementConditionState(element, bridge.drawnDefects ?? [], sizeM)
  }, [bridge.drawnDefects, element, sizeM])

  const elementRecs = recommendations.filter((r) => r.elementId === element?.id)
  const selectedActivity = activities.find((a) => a.code === activityCode)

  function pickActivity(code: number) {
    setActivityCode(code)
    const act = activities.find((a) => a.code === code)
    if (!act || !element) return
    const price = unitPriceForActivity(code, act.unitPrice)
    setUnitPrice(price)
    setQuantity(
      suggestQuantity(act, element, condition?.summary.percentAreaInDefect),
    )
  }

  function addRecommendation() {
    if (!element || !selectedActivity) return
    const rec = buildRecommendation({
      activity: selectedActivity,
      element,
      quantity,
      unitPrice,
      notes: notes.trim() || undefined,
      conditionState: condition?.conditionState,
    })
    onChange(upsertRecommendation(recommendations, rec))
    setNotes('')
  }

  if (!element) {
    return (
      <div className="insp-activity-picker">
        <p className="model-help">Select an element on the twin to recommend maintenance activities.</p>
      </div>
    )
  }

  return (
    <div className="insp-activity-picker">
      <header className="insp-activity-header">
        <div>
          <p className="section-label">Inspection activities</p>
          <strong>
            {element.code} · {element.name}
          </strong>
          <span className="muted">
            {' '}
            · {element.groupId} · {activities.length} available
          </span>
        </div>
        {condition && (
          <div className="insp-cs-badge" title={condition.basis}>
            <em>CS {condition.conditionState}</em>
            <span>
              {condition.summary.percentAreaInDefect.toFixed(1)}% extent
              {drawnDefectCount ? ` · ${drawnDefectCount} drawn` : ''}
            </span>
            <small>Provisional</small>
          </div>
        )}
      </header>

      <div className="insp-activity-form">
        <label className="model-field">
          Activity
          <select
            value={activityCode}
            onChange={(e) => pickActivity(Number(e.target.value))}
          >
            <option value="">Select activity…</option>
            {activities.map((a) => (
              <option key={a.code} value={a.code}>
                {a.code} · {a.description} ({unitLabel(a.unit)})
              </option>
            ))}
          </select>
        </label>
        <div className="insp-activity-qty-row">
          <label className="model-field">
            Quantity
            <input
              type="number"
              min={0}
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(0, Number(e.target.value) || 0))}
            />
          </label>
          <label className="model-field">
            Unit price (NZD)
            <input
              type="number"
              min={0}
              step="1"
              value={unitPrice}
              onChange={(e) => setUnitPrice(Math.max(0, Number(e.target.value) || 0))}
            />
          </label>
          <label className="model-field">
            Line total
            <input readOnly value={formatMoney(quantity * unitPrice)} />
          </label>
        </div>
        {selectedActivity && (
          <p className="model-help">
            {MAINTENANCE_CATEGORY_LABEL[selectedActivity.category]} · unit:{' '}
            {unitLabel(selectedActivity.unit)}
          </p>
        )}
        <label className="model-field">
          Notes
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional inspection note"
          />
        </label>
        <button
          type="button"
          className="page-btn primary"
          disabled={!selectedActivity || quantity <= 0}
          onClick={addRecommendation}
        >
          Add to worklist
        </button>
      </div>

      {elementRecs.length > 0 && (
        <div className="insp-activity-list">
          <p className="section-label">Proposed for this element</p>
          <ul>
            {elementRecs.map((r) => (
              <li key={r.id}>
                <div>
                  <strong>
                    {r.activityCode} · {r.activityDescription}
                  </strong>
                  <em>
                    {r.quantity} {unitLabel(r.unit)} × {formatMoney(r.unitPrice)} ={' '}
                    {formatMoney(r.totalCost)}
                    {r.conditionState ? ` · CS${r.conditionState}` : ''}
                  </em>
                </div>
                <button
                  type="button"
                  className="page-btn ghost"
                  onClick={() => onChange(removeRecommendation(recommendations, r.id))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
