import { useRef, useState } from 'react'
import type { BridgeAsset } from '../types'
import {
  attachImportedIfc,
  downloadIfc,
  importIfcFile,
  structureFromImportedIfc,
} from '../data/ifcExchange'
import { loadStructureDatabase } from '../data/structureStore'
import { nextStructureId } from '../data/structureFactory'

type ModelExchangePanelProps = {
  bridge: BridgeAsset
  onBridgeUpdated: (bridge: BridgeAsset) => void
  onStructureCreated?: (bridge: BridgeAsset) => void
  compact?: boolean
}

export function ModelExchangePanel({
  bridge,
  onBridgeUpdated,
  onStructureCreated,
  compact = false,
}: ModelExchangePanelProps) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [mode, setMode] = useState<'overlay' | 'new'>('overlay')

  async function handleFile(file: File) {
    setBusy(true)
    setMessage(null)
    try {
      const buffer = await file.arrayBuffer()
      const model = await importIfcFile(buffer, file.name)
      if (mode === 'new' && onStructureCreated) {
        const ids = loadStructureDatabase().map((b) => b.id)
        const id = nextStructureId(ids)
        const created = structureFromImportedIfc(model, id, {
          name: file.name.replace(/\.ifc$/i, ''),
          road: bridge.road,
          region: bridge.region,
          city: bridge.city,
          lat: bridge.lat,
          lng: bridge.lng,
          owner: bridge.owner,
        })
        onStructureCreated(created)
        setMessage(`Created structure ${created.id} from ${model.meshCount} meshes.`)
      } else {
        const updated = attachImportedIfc(bridge, model)
        onBridgeUpdated(updated)
        setMessage(
          `Imported ${model.meshCount} meshes from ${file.name} (overlay on ${bridge.name}).`,
        )
      }
    } catch (err) {
      console.error(err)
      setMessage(
        err instanceof Error
          ? `Import failed: ${err.message}`
          : 'Import failed — check the IFC file exported from Revit.',
      )
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className={`model-exchange${compact ? ' compact' : ''}`}>
      <p className="section-label">Revit / IFC exchange</p>
      <p className="page-note subtle">
        Export IFC2x3 for Revit (Link IFC / Import IFC). Import Revit’s IFC export as a 3D
        overlay or a new structure.
      </p>

      <div className="model-exchange-actions">
        <button
          type="button"
          className="page-btn primary"
          onClick={() => {
            downloadIfc(bridge)
            setMessage(`Downloaded IFC for ${bridge.name}. Open or Link in Revit.`)
          }}
        >
          Export IFC (Revit)
        </button>
        <button
          type="button"
          className="page-btn"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? 'Importing…' : 'Import IFC / Revit'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".ifc,application/x-step,application/ifc"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
          }}
        />
      </div>

      <fieldset className="model-exchange-mode">
        <legend>On import</legend>
        <label>
          <input
            type="radio"
            name="ifc-mode"
            checked={mode === 'overlay'}
            onChange={() => setMode('overlay')}
          />
          Overlay on this structure
        </label>
        <label>
          <input
            type="radio"
            name="ifc-mode"
            checked={mode === 'new'}
            onChange={() => setMode('new')}
            disabled={!onStructureCreated}
          />
          Create new structure
        </label>
      </fieldset>

      {bridge.importedModel && (
        <p className="page-note">
          Active import: <strong>{bridge.importedModel.fileName}</strong> ·{' '}
          {bridge.importedModel.meshCount} meshes ·{' '}
          <button
            type="button"
            className="linkish"
            onClick={() => {
              const { importedModel: _drop, ...rest } = bridge
              onBridgeUpdated({ ...rest, importedModel: undefined })
              setMessage('Cleared imported IFC overlay.')
            }}
          >
            Clear overlay
          </button>
        </p>
      )}

      {message && <p className="page-note subtle">{message}</p>}
    </div>
  )
}
