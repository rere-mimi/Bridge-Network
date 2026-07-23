import { useMemo, useState } from 'react'
import type { BridgeAsset, BridgeElement, ConditionState, DrawnDefect } from '../types'
import { defectsForMaterial, DEFECT_TYPE_BY_CODE } from '../data/defectTypes'
import {
  resolveInspectableAreaM2,
  linearDefectDensityMPerM2,
  areaDefectExtentPercent,
} from '../data/elementInspectableArea'
import {
  buildQuickAddDefect,
  defaultMeasureForConditionState,
} from '../data/quickAddDefect'
import { roundMetric } from '../data/defectMetrics'

type DefectQuickAddPanelProps = {
  element: BridgeElement
  bridge: BridgeAsset
  onAdd: (defect: DrawnDefect) => void
  /** Compact layout for the isolate overlay */
  compact?: boolean
}

const CS_OPTIONS: ConditionState[] = [1, 2, 3, 4]

export function DefectQuickAddPanel({
  element,
  bridge,
  onAdd,
  compact = false,
}: DefectQuickAddPanelProps) {
  const catalogue = useMemo(
    () => defectsForMaterial(element.material),
    [element.material],
  )
  const inspectable = useMemo(
    () => resolveInspectableAreaM2(element, bridge),
    [element, bridge],
  )

  const [defectCode, setDefectCode] = useState(
    () => catalogue[0]?.code ?? '1150',
  )
  const [cs, setCs] = useState<ConditionState>(2)
  const selectedType = DEFECT_TYPE_BY_CODE[defectCode] ?? catalogue[0]
  const geometry = selectedType?.geometry ?? 'area'

  const suggested = useMemo(
    () => defaultMeasureForConditionState(geometry, cs, inspectable.areaM2),
    [geometry, cs, inspectable.areaM2],
  )

  const [lengthM, setLengthM] = useState<string>('')
  const [areaM2, setAreaM2] = useState<string>('')
  const [useCustomMeasure, setUseCustomMeasure] = useState(false)

  const effectiveLength =
    geometry === 'line'
      ? useCustomMeasure && lengthM !== ''
        ? Number(lengthM)
        : (suggested.lengthM ?? 0)
      : undefined
  const effectiveArea =
    geometry !== 'line'
      ? useCustomMeasure && areaM2 !== ''
        ? Number(areaM2)
        : (suggested.areaM2 ?? 0)
      : undefined

  const density =
    effectiveLength != null
      ? linearDefectDensityMPerM2(effectiveLength, inspectable.areaM2)
      : null
  const extentPct =
    effectiveArea != null
      ? areaDefectExtentPercent(effectiveArea, inspectable.areaM2)
      : null

  function handleAdd() {
    if (!selectedType) return
    const defect = buildQuickAddDefect({
      element,
      bridge,
      defectCode: selectedType.code,
      conditionState: cs,
      lengthM: geometry === 'line' ? effectiveLength : undefined,
      areaM2: geometry !== 'line' ? effectiveArea : undefined,
    })
    onAdd(defect)
  }

  return (
    <div className={`defect-quick-add${compact ? ' compact' : ''}`}>
      <p className="section-label">Add defect (isolate / section)</p>
      <p className="page-note subtle">
        Material {(element.material ?? 'C').toUpperCase()} · inspectable area{' '}
        <strong>{inspectable.areaM2.toFixed(2)} m²</strong>
      </p>
      <p className="defect-area-formula" title="Verify in elementInspectableArea.ts">
        {inspectable.kind}: {inspectable.formula}
      </p>

      <label className="defect-quick-field">
        <span>Defect type</span>
        <select
          value={selectedType?.code ?? defectCode}
          onChange={(e) => {
            setDefectCode(e.target.value)
            setUseCustomMeasure(false)
            setLengthM('')
            setAreaM2('')
          }}
        >
          {catalogue.map((d) => (
            <option key={d.code} value={d.code}>
              {d.code} · {d.name} ({d.geometry})
            </option>
          ))}
        </select>
      </label>

      <fieldset className="defect-cs-fieldset">
        <legend>Condition state</legend>
        <div className="defect-cs-row">
          {CS_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              className={cs === n ? `cs-btn cs-${n} active` : `cs-btn cs-${n}`}
              onClick={() => {
                setCs(n)
                setUseCustomMeasure(false)
                setLengthM('')
                setAreaM2('')
              }}
            >
              CS {n}
            </button>
          ))}
        </div>
      </fieldset>

      {geometry === 'line' ? (
        <label className="defect-quick-field">
          <span>Length (m) — density = L / area</span>
          <input
            type="number"
            min={0}
            step={0.01}
            placeholder={String(suggested.lengthM ?? '')}
            value={useCustomMeasure ? lengthM : String(effectiveLength ?? '')}
            onChange={(e) => {
              setUseCustomMeasure(true)
              setLengthM(e.target.value)
            }}
          />
        </label>
      ) : (
        <label className="defect-quick-field">
          <span>Defect area (m²)</span>
          <input
            type="number"
            min={0}
            step={0.01}
            placeholder={String(suggested.areaM2 ?? '')}
            value={useCustomMeasure ? areaM2 : String(effectiveArea ?? '')}
            onChange={(e) => {
              setUseCustomMeasure(true)
              setAreaM2(e.target.value)
            }}
          />
        </label>
      )}

      <ul className="page-stats compact">
        {density != null && (
          <li>
            Extent density <strong>{roundMetric(density, 4)} m/m²</strong>
          </li>
        )}
        {extentPct != null && (
          <li>
            Extent <strong>{extentPct.toFixed(2)}%</strong> of element area
          </li>
        )}
        <li>
          Severity <strong>CS {cs}</strong>
        </li>
      </ul>

      <button type="button" className="page-btn primary" onClick={handleAdd}>
        Add defect
      </button>
    </div>
  )
}
