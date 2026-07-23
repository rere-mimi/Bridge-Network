import { useMemo, useState } from 'react'
import type { BridgeAsset } from '../types'
import {
  descriptionForElement,
  elementsForFamily,
  familyLabel,
  isCulvertFamily,
  materialFromBridge,
  type StructureFamily,
} from '../data/elementSchedule'
import {
  buildStructureFromDraft,
  kindFromFamily,
  nextStructureId,
  type StructureDraft,
} from '../data/structureFactory'
import { LocationPickerMap } from './LocationPickerMap'

const BRIDGE_FAMILIES: StructureFamily[] = ['girder', 'box', 'arch', 'slab']
const CULVERT_FAMILIES: StructureFamily[] = [
  'box-culvert',
  'pipe-culvert',
  'pipe-arch-culvert',
  'arch-culvert',
]

const MATERIALS = [
  'Reinforced concrete',
  'Prestressed concrete',
  'Steel',
  'Steel / Concrete',
  'Timber',
  'Masonry',
]

type ModelBuilderProps = {
  existingIds: string[]
  onCreated: (structure: BridgeAsset) => void
  onCancel: () => void
}

type Step = 1 | 2 | 3 | 4 | 5

export function ModelBuilder({ existingIds, onCreated, onCancel }: ModelBuilderProps) {
  const [step, setStep] = useState<Step>(1)
  const [kind, setKind] = useState<'bridge' | 'culvert'>('bridge')
  const [family, setFamily] = useState<StructureFamily>('girder')
  const [material, setMaterial] = useState('Reinforced concrete')
  const [name, setName] = useState('')
  const [road, setRoad] = useState('')
  const [region, setRegion] = useState('')
  const [city, setCity] = useState('')
  const [owner, setOwner] = useState('')
  const [yearBuilt, setYearBuilt] = useState(2000)
  const [lengthM, setLengthM] = useState(40)
  const [spans, setSpans] = useState(2)
  const [deckWidthM, setDeckWidthM] = useState(12)
  const [girderCount, setGirderCount] = useState(4)
  const [lat, setLat] = useState(-41.28)
  const [lng, setLng] = useState(174.77)
  const [notes, setNotes] = useState('')
  const [selectedNos, setSelectedNos] = useState<number[]>(() =>
    elementsForFamily('girder').map((e) => e.no),
  )

  const structureId = useMemo(() => nextStructureId(existingIds), [existingIds])
  const catalogue = useMemo(() => elementsForFamily(family), [family])
  const preferredMaterial = materialFromBridge(material)

  function chooseKind(next: 'bridge' | 'culvert') {
    setKind(next)
    const nextFamily = next === 'bridge' ? 'girder' : 'box-culvert'
    setFamily(nextFamily)
    setSelectedNos(elementsForFamily(nextFamily).map((e) => e.no))
    if (next === 'culvert') {
      setSpans(1)
      setDeckWidthM(3.5)
      setLengthM(18)
      setGirderCount(1)
    } else {
      setSpans(2)
      setDeckWidthM(12)
      setLengthM(40)
      setGirderCount(4)
    }
  }

  function chooseFamily(next: StructureFamily) {
    setFamily(next)
    setSelectedNos(elementsForFamily(next).map((e) => e.no))
  }

  function toggleElement(no: number) {
    setSelectedNos((prev) =>
      prev.includes(no) ? prev.filter((n) => n !== no) : [...prev, no].sort((a, b) => a - b),
    )
  }

  function canContinue(): boolean {
    if (step === 1) return true
    if (step === 2) return !!family && !!material
    if (step === 3) return name.trim().length > 1 && road.trim().length > 0 && region.trim().length > 0
    if (step === 4) return lengthM > 0 && spans >= 1 && deckWidthM > 0
    if (step === 5) return selectedNos.length > 0
    return false
  }

  function create() {
    const draft: StructureDraft = {
      id: structureId,
      name: name.trim(),
      road: road.trim(),
      region: region.trim(),
      city: city.trim() || region.trim(),
      lat,
      lng,
      yearBuilt,
      lengthM,
      spans: isCulvertFamily(family) ? 1 : spans,
      deckWidthM,
      material,
      owner: owner.trim() || 'Local owner',
      family,
      girderCountPerSpan: girderCount,
      includeElementNos: selectedNos,
      notes,
    }
    onCreated(buildStructureFromDraft(draft))
  }

  return (
    <div className="model-builder">
      <header className="model-builder-header">
        <div>
          <p className="eyebrow">Appendix C / F model builder</p>
          <h1>Create structure model</h1>
          <p>
            Build a bridge or culvert from the standard element schedule, assign dimensions and
            material, then save it into your local database.
          </p>
        </div>
        <div className="model-builder-id">
          <span>Assigned ID</span>
          <strong>{structureId}</strong>
        </div>
      </header>

      <ol className="model-steps">
        {(['Type', 'Family', 'Identity', 'Dimensions', 'Elements'] as const).map((label, i) => {
          const n = (i + 1) as Step
          return (
            <li key={label} className={step === n ? 'active' : step > n ? 'done' : ''}>
              <em>{n}</em>
              {label}
            </li>
          )
        })}
      </ol>

      {step === 1 && (
        <section className="model-card">
          <h2>What are you modelling?</h2>
          <div className="model-choice-grid">
            <button
              type="button"
              className={kind === 'bridge' ? 'active' : ''}
              onClick={() => chooseKind('bridge')}
            >
              <strong>Bridge</strong>
              <span>Deck, beams, bearings, abutments, piers — Superstructure / Substructure</span>
            </button>
            <button
              type="button"
              className={kind === 'culvert' ? 'active' : ''}
              onClick={() => chooseKind('culvert')}
            >
              <strong>Culvert</strong>
              <span>Box, pipe, pipe-arch or arch barrel with headwalls and invert protection</span>
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="model-card">
          <h2>Structure family & material</h2>
          <p className="model-help">
            Families follow Appendix C categories used to seed the element inventory. Material picks
            the Appendix F description variant (C / P / S / T / M / O).
          </p>
          <div className="model-choice-grid">
            {(kind === 'bridge' ? BRIDGE_FAMILIES : CULVERT_FAMILIES).map((item) => (
              <button
                key={item}
                type="button"
                className={family === item ? 'active' : ''}
                onClick={() => chooseFamily(item)}
              >
                <strong>{familyLabel(item)}</strong>
                <span>{kindFromFamily(item)}</span>
              </button>
            ))}
          </div>
          <label className="model-field">
            Primary material
            <select value={material} onChange={(e) => setMaterial(e.target.value)}>
              {MATERIALS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        </section>
      )}

      {step === 3 && (
        <section className="model-card">
          <h2>Structure identity & location</h2>
          <div className="model-form-grid">
            <label className="model-field">
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mill Creek Culvert" />
            </label>
            <label className="model-field">
              Road / route
              <input value={road} onChange={(e) => setRoad(e.target.value)} placeholder="e.g. SH1" />
            </label>
            <label className="model-field">
              Region
              <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g. Wellington" />
            </label>
            <label className="model-field">
              City / locality
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Optional" />
            </label>
            <label className="model-field">
              Owner
              <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Asset owner" />
            </label>
            <label className="model-field">
              Year built
              <input
                type="number"
                value={yearBuilt}
                min={1850}
                max={2100}
                onChange={(e) => setYearBuilt(Number(e.target.value) || 2000)}
              />
            </label>
          </div>

          <div className="location-picker">
            <div className="location-picker-fields">
              <p className="model-help">
                Set the site by typing coordinates or clicking the map.
              </p>
              <label className="model-field">
                Latitude
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(Number(e.target.value) || 0)}
                />
              </label>
              <label className="model-field">
                Longitude
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(Number(e.target.value) || 0)}
                />
              </label>
              <p className="location-picker-readout">
                Selected: <code>{lat.toFixed(5)}, {lng.toFixed(5)}</code>
              </p>
            </div>
            <LocationPickerMap
              lat={lat}
              lng={lng}
              onPick={(nextLat, nextLng) => {
                setLat(nextLat)
                setLng(nextLng)
              }}
            />
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="model-card">
          <h2>Dimensions</h2>
          <p className="model-help">
            These values drive Appendix C quantities and the 3D twin layout for the new model.
          </p>
          <div className="model-form-grid">
            <label className="model-field">
              Overall length (m)
              <input
                type="number"
                min={1}
                step="0.1"
                value={lengthM}
                onChange={(e) => setLengthM(Number(e.target.value) || 1)}
              />
            </label>
            <label className="model-field">
              {kind === 'culvert' ? 'Barrel width (m)' : 'Deck width (m)'}
              <input
                type="number"
                min={0.5}
                step="0.1"
                value={deckWidthM}
                onChange={(e) => setDeckWidthM(Number(e.target.value) || 1)}
              />
            </label>
            {kind === 'bridge' && (
              <>
                <label className="model-field">
                  Number of spans
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={spans}
                    onChange={(e) => setSpans(Math.max(1, Number(e.target.value) || 1))}
                  />
                </label>
                <label className="model-field">
                  Beams / girders per span
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={girderCount}
                    onChange={(e) => setGirderCount(Math.max(1, Number(e.target.value) || 1))}
                  />
                </label>
              </>
            )}
          </div>
          <label className="model-field">
            Notes (stored on first inspection record)
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Design assumptions, drawing refs, inspection caveats…"
            />
          </label>
        </section>
      )}

      {step === 5 && (
        <section className="model-card">
          <h2>Appendix C element set</h2>
          <p className="model-help">
            Toggle which standard elements to include. Descriptions come from Appendix F for material
            code <code>{preferredMaterial}</code>.
          </p>
          <div className="model-element-list">
            {catalogue.map((el) => {
              const desc = descriptionForElement(el.no, preferredMaterial)
              const checked = selectedNos.includes(el.no)
              return (
                <label key={el.no} className={checked ? 'active' : ''}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleElement(el.no)}
                  />
                  <div>
                    <strong>
                      {String(el.no).padStart(3, '0')} · {el.name}
                    </strong>
                    <span>
                      {el.category} · SR {el.significance} · {el.unit}
                    </span>
                    {desc && <em>{desc.title}</em>}
                  </div>
                </label>
              )
            })}
          </div>
          <p className="model-summary">
            Will create <strong>{selectedNos.length}</strong> element types across location groups for{' '}
            <strong>{structureId}</strong> · {familyLabel(family)}.
          </p>
        </section>
      )}

      <footer className="model-builder-actions">
        <button type="button" className="page-btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <div className="model-builder-nav">
          {step > 1 && (
            <button type="button" className="page-btn" onClick={() => setStep((s) => (s - 1) as Step)}>
              Back
            </button>
          )}
          {step < 5 ? (
            <button
              type="button"
              className="page-btn primary"
              disabled={!canContinue()}
              onClick={() => setStep((s) => (s + 1) as Step)}
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              className="page-btn primary"
              disabled={!canContinue()}
              onClick={create}
            >
              Save to database
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
