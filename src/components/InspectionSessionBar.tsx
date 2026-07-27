import type {
  BridgeAsset,
  DrawnDefect,
  InspectionHistoryItem,
  InspectionSessionMode,
  MaintenanceRecommendation,
} from '../types'

type InspectionSessionBarProps = {
  bridge: BridgeAsset
  mode: InspectionSessionMode
  onModeChange: (mode: InspectionSessionMode) => void
  /** Read-only previous visit defects (last saved on the asset). */
  previousDefects: DrawnDefect[]
  previousRecommendations: MaintenanceRecommendation[]
}

export function InspectionSessionBar({
  bridge,
  mode,
  onModeChange,
  previousDefects,
  previousRecommendations,
}: InspectionSessionBarProps) {
  const last: InspectionHistoryItem | undefined = bridge.inspections[0]
  const hasPrevious =
    Boolean(last) || previousDefects.length > 0 || previousRecommendations.length > 0

  return (
    <div className="insp-session-bar">
      <div className="insp-session-modes" role="group" aria-label="Inspection start mode">
        <button
          type="button"
          className={mode === 'follow-up' ? 'active' : ''}
          disabled={!hasPrevious}
          title={
            hasPrevious
              ? 'Continue from the last saved inspection defaults'
              : 'No previous inspection on this structure yet'
          }
          onClick={() => onModeChange('follow-up')}
        >
          Follow-up previous
        </button>
        <button
          type="button"
          className={mode === 'scratch' ? 'active' : ''}
          onClick={() => onModeChange('scratch')}
        >
          Start from scratch
        </button>
      </div>
      <div className="insp-session-copy">
        {mode === 'follow-up' ? (
          <p>
            Draft seeded from the last saved visit
            {last ? ` (${last.date} · score ${last.score})` : ''}. Edit defects and activities,
            then save as a follow-up.
          </p>
        ) : (
          <p>
            Blank draft — previous inspection defaults stay visible below for reference. Save
            when ready as a new visit.
          </p>
        )}
      </div>
    </div>
  )
}

type PreviousInspectionPanelProps = {
  bridge: BridgeAsset
  previousDefects: DrawnDefect[]
  previousRecommendations: MaintenanceRecommendation[]
  mode: InspectionSessionMode
}

export function PreviousInspectionPanel({
  bridge,
  previousDefects,
  previousRecommendations,
  mode,
}: PreviousInspectionPanelProps) {
  const last = bridge.inspections[0]
  if (!last && previousDefects.length === 0 && previousRecommendations.length === 0) {
    return (
      <div className="previous-insp-panel">
        <p className="section-label">Previous inspection</p>
        <p className="page-note">No saved inspection on this structure yet.</p>
      </div>
    )
  }

  return (
    <div className="previous-insp-panel">
      <p className="section-label">Previous inspection defaults</p>
      {last && (
        <div className="previous-insp-summary">
          <strong>{last.date}</strong>
          <span>
            {last.inspector} · score {last.score}
          </span>
          <em>{last.summary}</em>
        </div>
      )}
      <ul className="page-stats compact">
        <li>
          Drawn defects <strong>{previousDefects.length}</strong>
        </li>
        <li>
          Activities <strong>{previousRecommendations.length}</strong>
        </li>
        <li>
          Last inspection date <strong>{bridge.lastInspection}</strong>
        </li>
      </ul>
      {mode === 'scratch' && previousDefects.length > 0 && (
        <>
          <p className="section-label">Previous defects (read-only)</p>
          <ul className="defect-list">
            {previousDefects.slice(0, 8).map((d) => (
              <li key={d.id}>
                <span
                  className={`sev ${d.kind === 'crack' ? 'sev-critical' : d.kind === 'spall' ? 'sev-high' : 'sev-medium'}`}
                />
                <div>
                  <strong>{d.label}</strong>
                  <em>
                    E{d.defectCode}
                    {d.elementId ? ` · ${d.elementId}` : ''}
                    {d.conditionState ? ` · CS${d.conditionState}` : ''}
                  </em>
                </div>
              </li>
            ))}
            {previousDefects.length > 8 && (
              <li className="empty">+{previousDefects.length - 8} more on last save</li>
            )}
          </ul>
        </>
      )}
      {mode === 'follow-up' && (
        <p className="page-note subtle">
          Those defects and activities are already loaded into your editable draft above.
        </p>
      )}
    </div>
  )
}
