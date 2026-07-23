import { useMemo, useState } from 'react'
import type { BeamSectionType, BridgeAsset, ElementSizeM, PierType } from '../types'
import {
  descriptionForElement,
  elementsForFamily,
  familyLabel,
  isCulvertFamily,
  isTunnelFamily,
  isWallFamily,
  materialFromBridge,
  STANDARD_ELEMENTS,
  type StructureFamily,
} from '../data/elementSchedule'
import {
  buildStructureFromDraft,
  draftFromStructure,
  kindFromFamily,
  nextStructureId,
  type StructureDraft,
} from '../data/structureFactory'
import {
  BEAM_TYPE_OPTIONS,
  defaultGeometry,
  editableDimensionSchedules,
  PIER_TYPE_OPTIONS,
  type StructureGeometry,
} from '../data/structureGeometry'
import {
  ARCH_SPANDREL_OPTIONS,
  validateArchComponents,
  type ArchSpandrelType,
} from '../data/archBridgeComponents'
import {
  categoryFromFamily,
  MODEL_CATEGORIES,
  sketchesForCategory,
  type ModelCategory,
} from '../data/modelSketches'
import { LocationPickerMap } from './LocationPickerMap'
import type { StructureKind } from '../types'

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
  /** When set, builder opens in edit mode for this structure */
  initialStructure?: BridgeAsset | null
  onSaved: (structure: BridgeAsset) => void
  onCancel: () => void
}

const BUILDER_SECTIONS = [
  { id: 'category', label: 'Category' },
  { id: 'sketch', label: 'Sketch' },
  { id: 'identity', label: 'Identity' },
  { id: 'size', label: 'Size' },
  { id: 'elements', label: 'Elements' },
] as const

function elementName(no: number): string {
  return STANDARD_ELEMENTS.find((e) => e.no === no)?.name ?? `Element ${no}`
}

function sizeFieldsFor(scheduleNo: number): Array<keyof ElementSizeM> {
  if ([404, 405, 407, 601, 602, 610, 701].includes(scheduleNo)) {
    return scheduleNo === 405
      ? ['length', 'width', 'height']
      : ['diameter', 'height']
  }
  if ([600, 603].includes(scheduleNo)) {
    return ['length', 'width', 'height', 'openingHeight']
  }
  return ['length', 'width', 'height']
}

function geometryKind(family: StructureFamily): 'bridge' | 'culvert' {
  return isCulvertFamily(family) ? 'culvert' : 'bridge'
}

export function ModelBuilder({
  existingIds,
  initialStructure = null,
  onSaved,
  onCancel,
}: ModelBuilderProps) {
  const editing = !!initialStructure
  const seed = initialStructure ? draftFromStructure(initialStructure) : null

  const [category, setCategory] = useState<ModelCategory>(
    seed ? categoryFromFamily(seed.family) : 'bridge',
  )
  const [kind, setKind] = useState<StructureKind>(
    seed ? kindFromFamily(seed.family) : 'bridge',
  )
  const [family, setFamily] = useState<StructureFamily>(seed?.family ?? 'girder')
  const [material, setMaterial] = useState(seed?.material ?? 'Reinforced concrete')
  const [name, setName] = useState(seed?.name ?? '')
  const [road, setRoad] = useState(seed?.road ?? '')
  const [region, setRegion] = useState(seed?.region ?? '')
  const [city, setCity] = useState(seed?.city ?? '')
  const [owner, setOwner] = useState(seed?.owner ?? '')
  const [yearBuilt, setYearBuilt] = useState(seed?.yearBuilt ?? 2000)
  const [lengthM, setLengthM] = useState(seed?.lengthM ?? 40)
  const [spans, setSpans] = useState(seed?.spans ?? 2)
  const [deckWidthM, setDeckWidthM] = useState(seed?.deckWidthM ?? 12)
  const [girderCount, setGirderCount] = useState(seed?.girderCountPerSpan ?? 4)
  const [beamType, setBeamType] = useState<BeamSectionType>(
    seed?.geometry.beamType ?? 'open-ibeam',
  )
  const [pierType, setPierType] = useState<PierType>(
    seed?.geometry.pierType ?? 'multi-column',
  )
  const [columnsPerPier, setColumnsPerPier] = useState(
    seed?.geometry.columnsPerPier ?? 2,
  )
  const [columnsPerAbutment, setColumnsPerAbutment] = useState(
    seed?.geometry.columnsPerAbutment ?? 4,
  )
  const [archSpandrelType, setArchSpandrelType] = useState<ArchSpandrelType>(
    seed?.geometry.archSpandrelType ?? 'closed',
  )
  const [spandrelColumnCount, setSpandrelColumnCount] = useState(
    seed?.geometry.spandrelColumnCount ?? 6,
  )
  const [elementSizes, setElementSizes] = useState<Record<number, ElementSizeM>>(
    () => seed?.geometry.elementSizes ?? defaultGeometry({
      lengthM: 40,
      spans: 2,
      deckWidthM: 12,
      kind: 'bridge',
      family: 'girder',
      girderCountPerSpan: 4,
    }).elementSizes,
  )
  const [lat, setLat] = useState(seed?.lat ?? -41.28)
  const [lng, setLng] = useState(seed?.lng ?? 174.77)
  const [notes, setNotes] = useState('')
  const [selectedNos, setSelectedNos] = useState<number[]>(
    () => seed?.includeElementNos ?? elementsForFamily('girder').map((e) => e.no),
  )

  const structureId = editing
    ? initialStructure!.id
    : nextStructureId(existingIds.filter((id) => id !== seed?.id))
  const catalogue = useMemo(() => elementsForFamily(family), [family])
  const preferredMaterial = materialFromBridge(material)

  const dimensionNos = useMemo(
    () => editableDimensionSchedules(geometryKind(family), selectedNos),
    [family, selectedNos],
  )

  function rebuildSizes(next: {
    family: StructureFamily
    lengthM: number
    spans: number
    deckWidthM: number
    girderCount: number
    keep?: Record<number, ElementSizeM>
  }) {
    const fresh = defaultGeometry({
      lengthM: next.lengthM,
      spans: next.spans,
      deckWidthM: next.deckWidthM,
      kind: geometryKind(next.family),
      family: next.family,
      girderCountPerSpan: next.girderCount,
    }).elementSizes
    setElementSizes({ ...fresh, ...next.keep })
  }

  function chooseCategory(next: ModelCategory) {
    setCategory(next)
    const meta = MODEL_CATEGORIES.find((c) => c.id === next)!
    setKind(meta.kind)
    const first = sketchesForCategory(next)[0]
    const nextFamily = first?.family ?? 'girder'
    setFamily(nextFamily)
    setSelectedNos(elementsForFamily(nextFamily).map((e) => e.no))
    if (next === 'culvert') {
      setSpans(1)
      setDeckWidthM(3.5)
      setLengthM(18)
      setGirderCount(1)
      setBeamType('slab')
      setPierType('wall')
      setColumnsPerPier(1)
      setColumnsPerAbutment(1)
      rebuildSizes({
        family: nextFamily,
        lengthM: 18,
        spans: 1,
        deckWidthM: 3.5,
        girderCount: 1,
      })
    } else if (next === 'walls') {
      setSpans(1)
      setDeckWidthM(4)
      setLengthM(40)
      setGirderCount(0)
      setBeamType('slab')
      setPierType('wall')
      rebuildSizes({
        family: nextFamily,
        lengthM: 40,
        spans: 1,
        deckWidthM: 4,
        girderCount: 0,
      })
    } else if (next === 'tunnel') {
      setSpans(1)
      setDeckWidthM(10)
      setLengthM(120)
      setGirderCount(0)
      setBeamType('slab')
      setPierType('wall')
      rebuildSizes({
        family: nextFamily,
        lengthM: 120,
        spans: 1,
        deckWidthM: 10,
        girderCount: 0,
      })
    } else {
      setSpans(2)
      setDeckWidthM(12)
      setLengthM(40)
      setGirderCount(4)
      setBeamType('open-ibeam')
      setPierType('multi-column')
      setColumnsPerPier(2)
      setColumnsPerAbutment(4)
      rebuildSizes({
        family: nextFamily,
        lengthM: 40,
        spans: 2,
        deckWidthM: 12,
        girderCount: 4,
      })
    }
  }

  function chooseFamily(next: StructureFamily) {
    setFamily(next)
    setKind(kindFromFamily(next))
    setCategory(categoryFromFamily(next))
    setSelectedNos(elementsForFamily(next).map((e) => e.no))
    if (next === 'box') setBeamType('box')
    else if (next === 'slab' || isWallFamily(next) || isTunnelFamily(next)) {
      setBeamType('slab')
      setGirderCount(0)
    } else if (next === 'arch') {
      setBeamType('slab')
      setGirderCount(0)
      setArchSpandrelType('closed')
      setSpandrelColumnCount(6)
    } else if (next === 'girder') setBeamType('open-ibeam')
    else if (isCulvertFamily(next)) {
      setBeamType('slab')
      setGirderCount(1)
    }
    rebuildSizes({
      family: next,
      lengthM,
      spans,
      deckWidthM,
      girderCount:
        next === 'slab' || next === 'arch' || isWallFamily(next) || isTunnelFamily(next)
          ? 0
          : girderCount || 4,
    })
  }

  function chooseArchSpandrel(next: ArchSpandrelType) {
    setArchSpandrelType(next)
    const opt = ARCH_SPANDREL_OPTIONS.find((o) => o.id === next)
    if (!opt) return
    setSelectedNos((prev) => {
      const without = prev.filter((n) => ![204, 205, 206, 207].includes(n))
      return [...without, opt.archSchedule, opt.spandrelSchedule]
    })
  }

  function chooseBeamType(next: BeamSectionType) {
    setBeamType(next)
    if (next === 'slab') setGirderCount(0)
    else if (girderCount < 1) setGirderCount(4)
    // Ensure related schedule numbers are selected
    setSelectedNos((prev) => {
      const set = new Set(prev)
      if (next === 'open-ibeam' || next === 't-beam') {
        set.add(201)
        set.delete(202)
      } else if (next === 'box') {
        set.add(202)
        set.delete(201)
      } else {
        set.add(200)
      }
      return [...set].sort((a, b) => a - b)
    })
  }

  function choosePierType(next: PierType) {
    setPierType(next)
    setSelectedNos((prev) => {
      const set = new Set(prev)
      set.add(402)
      if (next === 'wall') {
        set.add(403)
        set.delete(404)
        set.delete(405)
      } else if (next === 'multi-column') {
        set.add(404)
        set.delete(403)
        set.delete(405)
      } else if (next === 'trestle') {
        set.add(405)
        set.delete(403)
        set.delete(404)
      } else {
        set.add(407)
        set.delete(403)
        set.delete(404)
        set.delete(405)
      }
      return [...set].sort((a, b) => a - b)
    })
  }

  function toggleElement(no: number) {
    setSelectedNos((prev) =>
      prev.includes(no) ? prev.filter((n) => n !== no) : [...prev, no].sort((a, b) => a - b),
    )
  }

  function patchSize(no: number, key: keyof ElementSizeM, value: number) {
    setElementSizes((prev) => ({
      ...prev,
      [no]: {
        ...prev[no],
        [key]: value,
      },
    }))
  }

  function currentGeometry(): StructureGeometry {
    return {
      beamType,
      girderCountPerSpan: girderCount,
      pierType,
      columnsPerPier,
      columnsPerAbutment,
      archSpandrelType: family === 'arch' ? archSpandrelType : undefined,
      spandrelColumnCount: family === 'arch' ? spandrelColumnCount : undefined,
      elementSizes,
    }
  }

  function canSave(): boolean {
    if (!family || !material) return false
    if (name.trim().length <= 1 || road.trim().length === 0 || region.trim().length === 0) {
      return false
    }
    if (!(lengthM > 0 && spans >= 1 && deckWidthM > 0)) return false
    if (kind === 'bridge' && pierType !== 'wall' && columnsPerPier < 1) return false
    return selectedNos.length > 0
  }

  function scrollToSection(id: string) {
    const el = document.getElementById(`builder-${id}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
      geometry: currentGeometry(),
      includeElementNos: selectedNos,
      notes,
    }
    onSaved(buildStructureFromDraft(draft, initialStructure ?? undefined))
  }

  const showColumnCounts =
    kind === 'bridge' && (pierType === 'multi-column' || pierType === 'trestle' || pierType === 'pile-bent')
  const showBeamCount = kind === 'bridge' && family !== 'arch' && beamType !== 'slab'
  const archChecks =
    family === 'arch' ? validateArchComponents(selectedNos, archSpandrelType) : null

  return (
    <div className="model-builder">
      <header className="model-builder-header">
        <div>
          <p className="eyebrow">Appendix C / F model builder</p>
          <h1>{editing ? 'Edit structure model' : 'Create structure model'}</h1>
          <p>
            {editing
              ? 'Scroll through every section below — identity, location, type sketch, size, and elements stay visible together.'
              : 'Scroll through every option on one page: category, sketch, identity, size, and elements. Refine dimensions after create with Edit model.'}
          </p>
        </div>
        <div className="model-builder-id">
          <span>{editing ? 'Structure ID' : 'Assigned ID'}</span>
          <strong>{structureId}</strong>
        </div>
      </header>

      <nav className="model-section-nav" aria-label="Builder sections">
        {BUILDER_SECTIONS.map((section, i) => (
          <button
            key={section.id}
            type="button"
            className="model-section-nav-btn"
            onClick={() => scrollToSection(section.id)}
          >
            <em>{i + 1}</em>
            {section.label}
          </button>
        ))}
      </nav>

      <div className="model-builder-scroll">
        <section id="builder-category" className="model-card">
          <h2>1. What are you modelling?</h2>
          <p className="model-help">
            Choose the asset category. Sketches for that category appear in the next section.
          </p>
          <div className="model-choice-grid">
            {MODEL_CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={category === item.id ? 'active' : ''}
                onClick={() => chooseCategory(item.id)}
              >
                <strong>{item.title}</strong>
                <span>{item.blurb}</span>
              </button>
            ))}
          </div>
        </section>

        <section id="builder-sketch" className="model-card">
          <h2>2. Pick a type sketch</h2>
          <p className="model-help">
            Sketches show the structural form at a glance. Names are under each card — dimensions stay
            high-level until the model is created, then every element size can be edited.
          </p>
          <div className="model-sketch-grid">
            {sketchesForCategory(category).map((item) => (
              <button
                key={item.id}
                type="button"
                className={`model-sketch-card ${family === item.family ? 'active' : ''}`}
                onClick={() => chooseFamily(item.family)}
              >
                <svg
                  className="model-sketch-art"
                  viewBox="0 0 160 96"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: item.sketch }}
                />
                <strong>{item.title}</strong>
                <span>{item.blurb}</span>
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

        <section id="builder-identity" className="model-card">
          <h2>3. Structure identity & location</h2>
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

        <section id="builder-size" className="model-card">
          <h2>{editing ? '4. Geometry — overall & element sizes' : '4. High-level size'}</h2>
          <p className="model-help">
            {editing
              ? 'Adjust overall size and every element dimension. These drive inventory quantities and the structural 3D twin.'
              : 'Set overall length, width and spans only. After the structure is created, open Edit model to refine every element dimension.'}
          </p>

          <h3 className="model-subhead">Overall</h3>
          <div className="model-form-grid">
            <label className="model-field">
              Overall length (m)
              <input
                type="number"
                min={1}
                step="0.1"
                value={lengthM}
                onChange={(e) => {
                  const v = Number(e.target.value) || 1
                  setLengthM(v)
                  rebuildSizes({
                    family,
                    lengthM: v,
                    spans,
                    deckWidthM,
                    girderCount,
                  })
                }}
              />
            </label>
            <label className="model-field">
              {kind === 'culvert'
                ? 'Barrel width (m)'
                : kind === 'retaining-wall'
                  ? 'Wall height (m)'
                  : kind === 'tunnel'
                    ? 'Clear width (m)'
                    : 'Deck width (m)'}
              <input
                type="number"
                min={0.5}
                step="0.1"
                value={deckWidthM}
                onChange={(e) => {
                  const v = Number(e.target.value) || 1
                  setDeckWidthM(v)
                  rebuildSizes({
                    family,
                    lengthM,
                    spans,
                    deckWidthM: v,
                    girderCount,
                  })
                }}
              />
            </label>
            {kind === 'bridge' && (
              <label className="model-field">
                Number of spans
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={spans}
                  onChange={(e) => {
                    const v = Math.max(1, Number(e.target.value) || 1)
                    setSpans(v)
                    rebuildSizes({
                      family,
                      lengthM,
                      spans: v,
                      deckWidthM,
                      girderCount,
                    })
                  }}
                />
              </label>
            )}
          </div>

          {editing && kind === 'bridge' && (
            <>
              {family === 'arch' ? (
                <>
                  <h3 className="model-subhead">Arch form (diagram)</h3>
                  <p className="model-help">
                    Validated against a standard arch-bridge diagram: deck, crown, spandrel, arch
                    rib/barrel, springings, skewback/abutment, rise and span.
                  </p>
                  <div className="model-choice-grid compact">
                    {ARCH_SPANDREL_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className={archSpandrelType === opt.id ? 'active' : ''}
                        onClick={() => chooseArchSpandrel(opt.id)}
                      >
                        <strong>{opt.label}</strong>
                        <span>{opt.hint}</span>
                      </button>
                    ))}
                  </div>
                  {archSpandrelType === 'open' && (
                    <div className="model-form-grid">
                      <label className="model-field">
                        Spandrel columns per span
                        <input
                          type="number"
                          min={3}
                          max={16}
                          value={spandrelColumnCount}
                          onChange={(e) =>
                            setSpandrelColumnCount(Math.max(3, Number(e.target.value) || 3))
                          }
                        />
                      </label>
                    </div>
                  )}
                  {archChecks && (
                    <ul className="arch-validate-list">
                      {archChecks.map((c) => (
                        <li key={c.diagram} className={c.ok ? 'ok' : 'fail'}>
                          <strong>{c.diagram}</strong>
                          <span>{c.detail}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <>
                  <h3 className="model-subhead">Beam / superstructure</h3>
                  <div className="model-choice-grid compact">
                    {BEAM_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className={beamType === opt.id ? 'active' : ''}
                        onClick={() => chooseBeamType(opt.id)}
                      >
                        <strong>{opt.label}</strong>
                        <span>{opt.hint}</span>
                      </button>
                    ))}
                  </div>
                  {showBeamCount && (
                    <div className="model-form-grid">
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
                    </div>
                  )}
                </>
              )}

              <h3 className="model-subhead">Pier / substructure</h3>
              <div className="model-choice-grid compact">
                {PIER_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={pierType === opt.id ? 'active' : ''}
                    onClick={() => choosePierType(opt.id)}
                  >
                    <strong>{opt.label}</strong>
                    <span>{opt.hint}</span>
                  </button>
                ))}
              </div>
              {showColumnCounts && (
                <div className="model-form-grid">
                  <label className="model-field">
                    Columns / piles per pier
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={columnsPerPier}
                      onChange={(e) =>
                        setColumnsPerPier(Math.max(1, Number(e.target.value) || 1))
                      }
                    />
                  </label>
                  <label className="model-field">
                    Columns / piles per abutment
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={columnsPerAbutment}
                      onChange={(e) =>
                        setColumnsPerAbutment(Math.max(1, Number(e.target.value) || 1))
                      }
                    />
                  </label>
                </div>
              )}
            </>
          )}

          {editing ? (
            <>
              <h3 className="model-subhead">Element dimensions (m)</h3>
              <p className="model-help">
                Edit sizes for each selected structural element type. Values apply to all instances of
                that schedule number.
              </p>
              <div className="model-dim-table-wrap">
                <table className="model-dim-table">
                  <thead>
                    <tr>
                      <th>Element</th>
                      <th>L</th>
                      <th>W</th>
                      <th>H</th>
                      <th>Ø</th>
                      <th>Opening H</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dimensionNos.map((no) => {
                      const size = elementSizes[no] ?? {}
                      const fields = sizeFieldsFor(no)
                      return (
                        <tr key={no}>
                          <td>
                            <strong>{String(no).padStart(3, '0')}</strong> {elementName(no)}
                          </td>
                          {(['length', 'width', 'height', 'diameter', 'openingHeight'] as const).map(
                            (key) => (
                              <td key={key}>
                                {fields.includes(key) ? (
                                  <input
                                    type="number"
                                    min={0.05}
                                    step="0.05"
                                    value={size[key] ?? ''}
                                    placeholder="—"
                                    onChange={(e) =>
                                      patchSize(no, key, Math.max(0.05, Number(e.target.value) || 0.05))
                                    }
                                  />
                                ) : (
                                  <span className="dim-na">—</span>
                                )}
                              </td>
                            ),
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {dimensionNos.length === 0 && (
                <p className="model-help">
                  Select structural elements below to edit their dimensions, or keep the defaults.
                </p>
              )}
            </>
          ) : (
            <p className="model-help">
              Element-by-element dimensions unlock after create — use <strong>Edit model</strong> on
              the structure overview.
            </p>
          )}

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

        <section id="builder-elements" className="model-card">
          <h2>5. Appendix C element set</h2>
          <p className="model-help">
            Toggle which standard elements to include. Descriptions come from Appendix F for material
            code <code>{preferredMaterial}</code>.{' '}
            {family === 'arch' ? (
              <>
                Arch form{' '}
                <strong>
                  {ARCH_SPANDREL_OPTIONS.find((o) => o.id === archSpandrelType)?.label}
                </strong>
              </>
            ) : (
              <>
                Beam type{' '}
                <strong>{BEAM_TYPE_OPTIONS.find((b) => b.id === beamType)?.label}</strong>
              </>
            )}
            {kind === 'bridge' && (
              <>
                {' '}
                · pier <strong>{PIER_TYPE_OPTIONS.find((p) => p.id === pierType)?.label}</strong>
                {showColumnCounts ? ` · ${columnsPerPier} columns/pier` : ''}
              </>
            )}
            .
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
                      {elementSizes[el.no]?.height
                        ? ` · H ${elementSizes[el.no].height} m`
                        : elementSizes[el.no]?.diameter
                          ? ` · Ø ${elementSizes[el.no].diameter} m`
                          : ''}
                    </span>
                    {desc && <em>{desc.title}</em>}
                  </div>
                </label>
              )
            })}
          </div>
          <p className="model-summary">
            Will {editing ? 'update' : 'create'} <strong>{selectedNos.length}</strong> element types
            across location groups for <strong>{structureId}</strong> · {familyLabel(family)}.
            {editing ? ' Existing defects and inspection history are kept.' : ''}
          </p>
        </section>
      </div>

      <footer className="model-builder-actions sticky">
        <button type="button" className="page-btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <div className="model-builder-nav">
          <button
            type="button"
            className="page-btn primary"
            disabled={!canSave()}
            onClick={create}
          >
            {editing ? 'Save changes' : 'Save to database'}
          </button>
        </div>
      </footer>
    </div>
  )
}
