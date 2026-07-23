import type { BridgeAsset } from '../types'

type SiteHazardCardsProps = {
  bridge: BridgeAsset
  compact?: boolean
  onOpenOverview?: () => void
}

export function SiteHazardCards({ bridge, compact = false, onOpenOverview }: SiteHazardCardsProps) {
  const flood = bridge.floodHazard
  const geology = bridge.geologyHazard
  const seismic = bridge.seismicHazard

  return (
    <div className={`site-hazard-cards${compact ? ' compact' : ''}`}>
      {seismic ? (
        <div className="nshm-hazard-card">
          <p className="nshm-hazard-label">Earthquake · NZ NSHM</p>
          <strong>
            PGA {seismic.pga.toFixed(2)} g
            <em>
              {' '}
              · 10% in {seismic.investigationYears} yr · Vs30 {seismic.vs30}
            </em>
          </strong>
          <p>
            {seismic.locationName ?? `${bridge.lat.toFixed(3)}, ${bridge.lng.toFixed(3)}`}
            {' · '}
            {seismic.source === 'nshm-api' ? seismic.model : 'regional estimate (API unavailable)'}
          </p>
          <div className="nshm-hazard-actions">
            <a className="page-btn primary" href={seismic.mapUrl} target="_blank" rel="noreferrer">
              Hazard Maps
            </a>
            <a className="page-btn" href={seismic.curvesUrl} target="_blank" rel="noreferrer">
              Site curves
            </a>
          </div>
        </div>
      ) : (
        <p className="nshm-hazard-pending">Assessing earthquake (NSHM) hazard…</p>
      )}

      {flood ? (
        <div className="nshm-hazard-card flood-hazard-card">
          <p className="nshm-hazard-label">Flood · NIWA river flood statistics</p>
          {flood.overStream ? (
            <>
              <strong>
                {flood.riverName ? flood.riverName : `REC ${flood.nzReach ?? 'reach'}`}
                {flood.catchmentKm2 != null && (
                  <em>
                    {' '}
                    · {flood.catchmentKm2} km² catchment
                  </em>
                )}
              </strong>
              <p className="page-note subtle">
                Peak flows (m³/s) by return period — Henderson &amp; Collins 2018
              </p>
              <div className="flood-flow-table-wrap">
                <table className="flood-flow-table">
                  <thead>
                    <tr>
                      <th>Return</th>
                      <th>AEP</th>
                      <th>Q (m³/s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flood.flows.map((f) => (
                      <tr key={String(f.returnPeriodYr)}>
                        <td>{f.label}</td>
                        <td>{(f.aep * 100).toFixed(f.aep < 0.01 ? 2 : 0)}%</td>
                        <td>
                          <strong>{f.flowM3s.toLocaleString()}</strong>
                          {f.seM3s != null && <em> ±{f.seM3s}</em>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p>
              {flood.note ??
                'No stream reach found nearby — structure may not span a mapped waterway.'}
            </p>
          )}
          <div className="nshm-hazard-actions">
            <a className="page-btn primary" href={flood.mapUrl} target="_blank" rel="noreferrer">
              Open NIWA flood lookup
            </a>
          </div>
        </div>
      ) : (
        <p className="nshm-hazard-pending">Assessing flood (NIWA) hazard…</p>
      )}

      {geology ? (
        <div className="nshm-hazard-card geology-hazard-card">
          <p className="nshm-hazard-label">Geology · GNS 1:250k + landslides</p>
          <strong>
            {geology.unit?.name ?? 'Unit unknown'}
            {geology.unit?.mainRock && <em> · {geology.unit.mainRock}</em>}
          </strong>
          <p>
            {geology.unit?.rockGroup ? `Rock group: ${geology.unit.rockGroup}` : '—'}
            {geology.unit?.rockClass ? ` · ${geology.unit.rockClass}` : ''}
            {geology.softGround ? ' · soft / weak ground' : ''}
          </p>
          {geology.unit?.description && (
            <p className="page-note subtle">{geology.unit.description}</p>
          )}
          <p>
            Landslides:{' '}
            <strong>
              {geology.landslideProximity === 'on-deposit'
                ? 'on mapped deposit'
                : geology.landslideProximity === 'nearby'
                  ? `${geology.landslidesNearby.length} nearby mapped deposit(s)`
                  : 'none mapped nearby'}
            </strong>
          </p>
          {geology.landslidesNearby.length > 0 && (
            <ul className="page-stats compact">
              {geology.landslidesNearby.slice(0, 3).map((ls) => (
                <li key={ls.name}>{ls.name}</li>
              ))}
            </ul>
          )}
          <div className="nshm-hazard-actions">
            <a
              className="page-btn primary"
              href={geology.geologyMapUrl}
              target="_blank"
              rel="noreferrer"
            >
              Geology map
            </a>
            <a
              className="page-btn"
              href={geology.landslideMapUrl}
              target="_blank"
              rel="noreferrer"
            >
              Landslide map
            </a>
            {onOpenOverview && (
              <button type="button" className="page-btn" onClick={onOpenOverview}>
                View in twin
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="nshm-hazard-pending">Assessing geology / landslide hazard…</p>
      )}
    </div>
  )
}

/** Shared donut legend + conic gradient stops for the six risk types. */
export function riskDonutStyle(breakdown: BridgeAsset['riskBreakdown']): string {
  const g = breakdown.geology ?? 0
  const s = breakdown.structural
  const h = breakdown.hydraulic
  const q = breakdown.seismic
  const t = breakdown.traffic
  const p1 = s
  const p2 = p1 + h
  const p3 = p2 + q
  const p4 = p3 + g
  const p5 = p4 + t
  return `conic-gradient(
    #38bdf8 0 ${p1}%,
    #22d3ee ${p1}% ${p2}%,
    #a78bfa ${p2}% ${p3}%,
    #84cc16 ${p3}% ${p4}%,
    #f59e0b ${p4}% ${p5}%,
    #94a3b8 ${p5}% 100%
  )`
}
