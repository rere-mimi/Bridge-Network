/**
 * Revit ↔ Bridge Network IFC exchange.
 *
 * Export: IFC2x3 Coordination View (metres, Z-up) — Link / Import in Revit.
 * Import: parse IFC (Revit Export to IFC) via web-ifc → mesh overlay on the twin.
 *
 * Coordinate mapping (our twin → IFC):
 *   twin X (road)  → IFC X
 *   twin Z (stream) → IFC Y
 *   twin Y (up)    → IFC Z
 */

import type { BridgeAsset, BridgeElement, ImportedIfcModel, ImportedIfcMesh } from '../types'
import { buildSceneNodes, type SceneNode, type ScenePart } from './sceneLayout'

const SCENE_LENGTH = 10

function roadWidthScene(deckWidthM: number) {
  return Math.min(3.2, Math.max(1.6, deckWidthM / 5))
}

function ifcGuid(): string {
  // Compact IFC GlobalId (22-char base64-like) — Revit accepts any unique string of this form
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$'
  let out = ''
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  for (let i = 0; i < 22; i++) {
    out += alphabet[bytes[i % 16] % 64]
  }
  return out
}

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

/** Scene units → metres (twin Y-up). */
export function sceneToMetres(
  bridge: BridgeAsset,
  scene: [number, number, number],
): [number, number, number] {
  const deck = bridge.deckWidthM ?? 12
  const roadW = roadWidthScene(deck)
  return [
    (scene[0] / SCENE_LENGTH) * Math.max(bridge.lengthM, 1),
    scene[1] / 0.22,
    (scene[2] / roadW) * Math.max(deck, 1),
  ]
}

/** Metres (twin Y-up) → scene units. */
export function metresToScene(
  bridge: BridgeAsset,
  metres: [number, number, number],
): [number, number, number] {
  const deck = bridge.deckWidthM ?? 12
  const roadW = roadWidthScene(deck)
  return [
    (metres[0] / Math.max(bridge.lengthM, 1)) * SCENE_LENGTH,
    metres[1] * 0.22,
    (metres[2] / Math.max(deck, 1)) * roadW,
  ]
}

/** Twin Y-up metres → IFC Z-up metres. */
export function twinToIfc([x, y, z]: [number, number, number]): [number, number, number] {
  return [x, z, y]
}

/** IFC Z-up metres → twin Y-up metres. */
export function ifcToTwin([x, y, z]: [number, number, number]): [number, number, number] {
  return [x, z, y]
}

function sceneSizeToMetres(
  bridge: BridgeAsset,
  size: [number, number, number],
): [number, number, number] {
  const [ox, oy, oz] = sceneToMetres(bridge, [0, 0, 0])
  const [sx, sy, sz] = sceneToMetres(bridge, size)
  return [Math.abs(sx - ox), Math.abs(sy - oy), Math.abs(sz - oz)]
}

type Solid = {
  name: string
  elementId: string
  scheduleNo: number
  material?: string
  shape: 'box' | 'cylinder'
  /** Centre in twin metres (Y-up) */
  centreM: [number, number, number]
  /** Size in twin metres [lengthX, heightY, widthZ] */
  sizeM: [number, number, number]
  rotation?: [number, number, number]
}

function partWorldSolid(
  bridge: BridgeAsset,
  node: SceneNode,
  part: ScenePart,
): Solid {
  const absScene: [number, number, number] = [
    node.position[0] + part.position[0],
    node.position[1] + part.position[1],
    node.position[2] + part.position[2],
  ]
  return {
    name: node.element.name,
    elementId: node.element.id,
    scheduleNo: node.element.scheduleNo,
    material: node.element.material,
    shape: part.shape === 'cylinder' ? 'cylinder' : 'box',
    centreM: sceneToMetres(bridge, absScene),
    sizeM: sceneSizeToMetres(bridge, part.size),
    rotation: part.rotation,
  }
}

export function buildWorldSolids(bridge: BridgeAsset): Solid[] {
  const nodes = buildSceneNodes(bridge, 'material').filter((n) => n.kind === 'solid')
  const solids: Solid[] = []
  for (const node of nodes) {
    for (const part of node.parts) {
      solids.push(partWorldSolid(bridge, node, part))
    }
  }
  return solids
}

class IfcWriter {
  private id = 0
  private lines: string[] = []

  next(): number {
    this.id += 1
    return this.id
  }

  add(line: string): number {
    const n = this.next()
    this.lines.push(`#${n}=${line};`)
    return n
  }

  point(x: number, y: number, z: number): number {
    return this.add(`IFCCARTESIANPOINT((${x.toFixed(5)},${y.toFixed(5)},${z.toFixed(5)}))`)
  }

  direction(x: number, y: number, z: number): number {
    return this.add(`IFCDIRECTION((${x.toFixed(6)},${y.toFixed(6)},${z.toFixed(6)}))`)
  }

  toString(fileName: string): string {
    const now = new Date().toISOString().slice(0, 19)
    return [
      'ISO-10303-21;',
      'HEADER;',
      "FILE_DESCRIPTION(('ViewDefinition [CoordinationView]'),'2;1');",
      `FILE_NAME('${esc(fileName)}','${now}',('Bridge Network'),('Bridge Network'),'Bridge Network IFC Export','Bridge Network','');`,
      "FILE_SCHEMA(('IFC2X3'));",
      'ENDSEC;',
      'DATA;',
      ...this.lines,
      'ENDSEC;',
      'END-ISO-10303-21;',
      '',
    ].join('\n')
  }
}

function ifcEntityForSchedule(scheduleNo: number): 'IfcSlab' | 'IfcBeam' | 'IfcColumn' | 'IfcBuildingElementProxy' {
  if ([200, 100].includes(scheduleNo)) return 'IfcSlab'
  if ([201, 202, 203, 204, 205].includes(scheduleNo)) return 'IfcBeam'
  if ([403, 404, 405, 407, 206].includes(scheduleNo)) return 'IfcColumn'
  return 'IfcBuildingElementProxy'
}

/**
 * Export a bridge twin to IFC2x3 text suitable for Revit Link IFC / Import IFC.
 * Geometry is in real metres (Z-up).
 */
export function exportBridgeToIfc(bridge: BridgeAsset): string {
  const w = new IfcWriter()
  const solids = buildWorldSolids(bridge)
  const stamp = Math.floor(Date.now() / 1000)

  const person = w.add(`IFCPERSON($,$,'Bridge Network',$,$,$,$,$)`)
  const org = w.add(`IFCORGANIZATION($,'Bridge Network',$,$,$)`)
  const pao = w.add(`IFCPERSONANDORGANIZATION(#${person},#${org},$)`)
  const app = w.add(`IFCAPPLICATION(#${org},'1.0','Bridge Network','BridgeNetwork')`)
  const owner = w.add(
    `IFCOWNERHISTORY(#${pao},#${app},$,.ADDED.,$,$,$,${stamp})`,
  )

  const xDir = w.direction(1, 0, 0)
  const zDir = w.direction(0, 0, 1)
  const origin = w.point(0, 0, 0)
  const world = w.add(`IFCAXIS2PLACEMENT3D(#${origin},#${zDir},#${xDir})`)
  const trueNorth = w.direction(0, 1, 0)
  const ctx = w.add(
    `IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.0E-05,#${world},#${trueNorth})`,
  )
  const subCtx = w.add(
    `IFCGEOMETRICREPRESENTATIONSUBCONTEXT('Body','Model',*,*,*,*,#${ctx},$,.MODEL_VIEW.,$)`,
  )
  const metre = w.add('IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.)')
  const units = w.add(`IFCUNITASSIGNMENT((#${metre}))`)
  const project = w.add(
    `IFCPROJECT('${ifcGuid()}',#${owner},'${esc(bridge.name)}','Bridge Network export',$,$,$,(#${ctx}),#${units})`,
  )

  const sitePlace = w.add(`IFCAXIS2PLACEMENT3D(#${origin},#${zDir},#${xDir})`)
  const siteLp = w.add(`IFCLOCALPLACEMENT($,#${sitePlace})`)
  const site = w.add(
    `IFCSITE('${ifcGuid()}',#${owner},'${esc(bridge.name)} Site',$,$,#${siteLp},$,$,.ELEMENT.,$,$,$,$,$)`,
  )

  const bldgPlace = w.add(`IFCAXIS2PLACEMENT3D(#${origin},#${zDir},#${xDir})`)
  const bldgLp = w.add(`IFCLOCALPLACEMENT(#${siteLp},#${bldgPlace})`)
  const building = w.add(
    `IFCBUILDING('${ifcGuid()}',#${owner},'${esc(bridge.name)}',$,$,#${bldgLp},$,$,.ELEMENT.,$,$,$)`,
  )

  const storeyPlace = w.add(`IFCAXIS2PLACEMENT3D(#${origin},#${zDir},#${xDir})`)
  const storeyLp = w.add(`IFCLOCALPLACEMENT(#${bldgLp},#${storeyPlace})`)
  const storey = w.add(
    `IFCBUILDINGSTOREY('${ifcGuid()}',#${owner},'Structure',$,$,#${storeyLp},$,$,.ELEMENT.,0.)`,
  )

  w.add(`IFCRELAGGREGATES('${ifcGuid()}',#${owner},$,$,#${project},(#${site}))`)
  w.add(`IFCRELAGGREGATES('${ifcGuid()}',#${owner},$,$,#${site},(#${building}))`)
  w.add(`IFCRELAGGREGATES('${ifcGuid()}',#${owner},$,$,#${building},(#${storey}))`)

  const productIds: number[] = []

  solids.forEach((solid, index) => {
    const [ix, iy, iz] = twinToIfc(solid.centreM)
    const [sx, sy, sz] = twinToIfc([solid.sizeM[0], solid.sizeM[1], solid.sizeM[2]])
    // After twin→IFC: sx=lengthX, sy=widthZ(stream), sz=heightY

    const placePt = w.point(ix, iy, iz)
    let axis = zDir
    let ref = xDir
    if (solid.shape === 'cylinder' && solid.rotation) {
      // Columns: cylinder axis along twin Y → IFC Z (default)
      axis = zDir
      ref = xDir
    }
    const placement3d = w.add(`IFCAXIS2PLACEMENT3D(#${placePt},#${axis},#${ref})`)
    const local = w.add(`IFCLOCALPLACEMENT(#${storeyLp},#${placement3d})`)

    let bodyRep: number
    if (solid.shape === 'cylinder') {
      const radius = Math.max(sx, sy) * 0.5
      const height = Math.max(sz, 0.05)
      const profileOrigin = w.point(0, 0, 0)
      const profilePlace = w.add(`IFCAXIS2PLACEMENT2D(#${profileOrigin},$)`)
      const circle = w.add(`IFCCIRCLEPROFILEDEF(.AREA.,$,#${profilePlace},${radius.toFixed(5)})`)
      const extrudeDir = w.direction(0, 0, 1)
      const solidPos = w.point(0, 0, -height / 2)
      const solidPlace = w.add(`IFCAXIS2PLACEMENT3D(#${solidPos},#${zDir},#${xDir})`)
      const extruded = w.add(
        `IFCEXTRUDEDAREASOLID(#${circle},#${solidPlace},#${extrudeDir},${height.toFixed(5)})`,
      )
      bodyRep = w.add(
        `IFCSHAPEREPRESENTATION(#${subCtx},'Body','SweptSolid',(#${extruded}))`,
      )
    } else {
      const hx = Math.max(sx, 0.05) / 2
      const hy = Math.max(sy, 0.05) / 2
      const hz = Math.max(sz, 0.05)
      const profileOrigin = w.point(0, 0, 0)
      const profilePlace = w.add(`IFCAXIS2PLACEMENT2D(#${profileOrigin},$)`)
      const rect = w.add(
        `IFCRECTANGLEPROFILEDEF(.AREA.,$,#${profilePlace},${(hx * 2).toFixed(5)},${(hy * 2).toFixed(5)})`,
      )
      const extrudeDir = w.direction(0, 0, 1)
      const solidPos = w.point(0, 0, -hz / 2)
      const solidPlace = w.add(`IFCAXIS2PLACEMENT3D(#${solidPos},#${zDir},#${xDir})`)
      const extruded = w.add(
        `IFCEXTRUDEDAREASOLID(#${rect},#${solidPlace},#${extrudeDir},${hz.toFixed(5)})`,
      )
      bodyRep = w.add(
        `IFCSHAPEREPRESENTATION(#${subCtx},'Body','SweptSolid',(#${extruded}))`,
      )
    }

    const productShape = w.add(`IFCPRODUCTDEFINITIONSHAPE($,$,(#${bodyRep}))`)
    const entity = ifcEntityForSchedule(solid.scheduleNo)
    const tag = esc(`${solid.elementId}-${index}`)
    const name = esc(`${solid.name} (${solid.scheduleNo})`)
    const product = w.add(
      `${entity.toUpperCase()}('${ifcGuid()}',#${owner},'${name}','Appendix C ${solid.scheduleNo}',$,#${local},#${productShape},'${tag}')`,
    )
    productIds.push(product)

    // Property set for Revit identity data
    const pSchedule = w.add(`IFCPROPERTYSINGLEVALUE('ScheduleNo',$,IFCINTEGER(${solid.scheduleNo}),$)`)
    const pElement = w.add(
      `IFCPROPERTYSINGLEVALUE('ElementId',$,IFCLABEL('${esc(solid.elementId)}'),$)`,
    )
    const pMat = w.add(
      `IFCPROPERTYSINGLEVALUE('Material',$,IFCLABEL('${esc(solid.material ?? '')}'),$)`,
    )
    const pset = w.add(
      `IFCPROPERTYSET('${ifcGuid()}',#${owner},'BridgeNetwork',$,(#${pSchedule},#${pElement},#${pMat}))`,
    )
    w.add(
      `IFCRELDEFINESBYPROPERTIES('${ifcGuid()}',#${owner},$,$,(#${product}),#${pset})`,
    )
  })

  if (productIds.length) {
    const list = productIds.map((id) => `#${id}`).join(',')
    w.add(
      `IFCRELCONTAINEDINSPATIALSTRUCTURE('${ifcGuid()}',#${owner},$,$,(${list}),#${storey})`,
    )
  }

  const safeName = bridge.name.replace(/[^\w\-]+/g, '_').slice(0, 40)
  return w.toString(`${bridge.id}-${safeName}.ifc`)
}

export function downloadIfc(bridge: BridgeAsset): void {
  const text = exportBridgeToIfc(bridge)
  const blob = new Blob([text], { type: 'application/x-step' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${bridge.id}-${bridge.name.replace(/[^\w\-]+/g, '_').slice(0, 40)}.ifc`
  a.click()
  URL.revokeObjectURL(url)
}

function mulMat4(m: number[], v: [number, number, number, number]): [number, number, number] {
  return [
    m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12] * v[3],
    m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13] * v[3],
    m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14] * v[3],
  ]
}

let ifcApiPromise: Promise<import('web-ifc').IfcAPI> | null = null

async function getIfcApi(): Promise<import('web-ifc').IfcAPI> {
  if (!ifcApiPromise) {
    ifcApiPromise = (async () => {
      const WebIFC = await import('web-ifc')
      const api = new WebIFC.IfcAPI()
      api.SetWasmPath(import.meta.env.BASE_URL, true)
      await api.Init()
      return api
    })()
  }
  return ifcApiPromise
}

/**
 * Import an IFC file (e.g. Revit → Export IFC) into a mesh overlay payload.
 * Vertices stored in twin Y-up metres for persistence.
 */
export async function importIfcFile(
  buffer: ArrayBuffer,
  fileName: string,
): Promise<ImportedIfcModel> {
  const WebIFC = await import('web-ifc')
  const api = await getIfcApi()
  const data = new Uint8Array(buffer)
  const modelID = api.OpenModel(data)

  const meshes: ImportedIfcMesh[] = []
  let minX = Infinity
  let minY = Infinity
  let minZ = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let maxZ = -Infinity

  const flatMeshes = api.LoadAllGeometry(modelID)
  const count = flatMeshes.size()

  for (let i = 0; i < count; i++) {
    const flat = flatMeshes.get(i)
    const expressID = flat.expressID
    let name = `IFC-${expressID}`
    try {
      const line = api.GetLine(modelID, expressID, true)
      if (line?.Name?.value) name = String(line.Name.value)
      else if (line?.ObjectType?.value) name = String(line.ObjectType.value)
    } catch {
      /* ignore property failures */
    }

    const placedCount = flat.geometries.size()
    for (let g = 0; g < placedCount; g++) {
      const placed = flat.geometries.get(g)
      const geometry = api.GetGeometry(modelID, placed.geometryExpressID)
      const verts = api.GetVertexArray(
        geometry.GetVertexData(),
        geometry.GetVertexDataSize(),
      )
      const indices = api.GetIndexArray(
        geometry.GetIndexData(),
        geometry.GetIndexDataSize(),
      )
      const matrix = placed.flatTransformation
      const color = placed.color
      const hex =
        '#' +
        [color.x, color.y, color.z]
          .map((c) =>
            Math.round(Math.min(1, Math.max(0, c)) * 255)
              .toString(16)
              .padStart(2, '0'),
          )
          .join('')

      // web-ifc vertices: x,y,z,nx,ny,nz per vertex
      const positions: number[] = []
      for (let v = 0; v < verts.length; v += 6) {
        const wx = verts[v]
        const wy = verts[v + 1]
        const wz = verts[v + 2]
        const [tx, ty, tz] = mulMat4(matrix, [wx, wy, wz, 1])
        const [px, py, pz] = ifcToTwin([tx, ty, tz])
        positions.push(px, py, pz)
        minX = Math.min(minX, px)
        minY = Math.min(minY, py)
        minZ = Math.min(minZ, pz)
        maxX = Math.max(maxX, px)
        maxY = Math.max(maxY, py)
        maxZ = Math.max(maxZ, pz)
      }

      meshes.push({
        id: `ifc-${expressID}-${g}`,
        expressId: expressID,
        name,
        color: hex === '#000000' ? '#94a3b8' : hex,
        positions,
        indices: Array.from(indices),
      })
      geometry.delete()
    }
    flat.delete()
  }

  api.CloseModel(modelID)

  if (!Number.isFinite(minX)) {
    minX = minY = minZ = 0
    maxX = maxY = maxZ = 1
  }

  return {
    format: 'ifc',
    fileName,
    importedAt: new Date().toISOString(),
    meshCount: meshes.length,
    boundsM: {
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ],
    },
    meshes,
    schemaHint: WebIFC.IFC2X3 ? 'IFC' : 'IFC',
  }
}

/** Fit imported IFC extents into a BridgeAsset length/width estimate. */
export function extentsFromImportedModel(model: ImportedIfcModel): {
  lengthM: number
  deckWidthM: number
  heightM: number
} {
  const [minX, minY, minZ] = model.boundsM.min
  const [maxX, maxY, maxZ] = model.boundsM.max
  return {
    lengthM: Math.max(5, maxX - minX),
    deckWidthM: Math.max(3, maxZ - minZ),
    heightM: Math.max(2, maxY - minY),
  }
}

/** Attach imported IFC meshes to an existing structure (overlay). */
export function attachImportedIfc(
  bridge: BridgeAsset,
  model: ImportedIfcModel,
): BridgeAsset {
  return {
    ...bridge,
    importedModel: model,
    documents: {
      ...bridge.documents,
      drawings: bridge.documents.drawings + 1,
    },
  }
}

/** Create a lightweight structure shell from a Revit/IFC import. */
export function structureFromImportedIfc(
  model: ImportedIfcModel,
  id: string,
  meta?: Partial<Pick<BridgeAsset, 'name' | 'road' | 'region' | 'city' | 'lat' | 'lng' | 'owner'>>,
): BridgeAsset {
  const ext = extentsFromImportedModel(model)
  const now = new Date().toISOString().slice(0, 10)
  const element: BridgeElement = {
    id: `${id}-IFC-000`,
    bridgeId: id,
    code: '000',
    scheduleNo: 0,
    name: 'Imported IFC assembly',
    category: 'Imported',
    majorGroup: 'Superstructure',
    subgroup: 'IFC',
    group: 'span',
    groupId: 'S1',
    significance: 4,
    unit: 'each',
    totalQuantity: 1,
    conditionScore: 80,
    riskScore: 40,
    band: 'good',
    material: 'O',
    descriptionTitle: 'Revit / IFC import',
    description: `Imported from ${model.fileName} (${model.meshCount} meshes).`,
    sizeM: {
      length: ext.lengthM,
      width: ext.deckWidthM,
      height: ext.heightM,
    },
  }

  return {
    id,
    name: meta?.name ?? model.fileName.replace(/\.ifc$/i, ''),
    road: meta?.road ?? 'Imported',
    region: meta?.region ?? 'Imported',
    city: meta?.city ?? '—',
    lat: meta?.lat ?? -41.2865,
    lng: meta?.lng ?? 174.7762,
    yearBuilt: new Date().getFullYear(),
    lengthM: ext.lengthM,
    spans: 1,
    deckWidthM: ext.deckWidthM,
    material: 'Mixed / IFC',
    structureType: 'Imported IFC',
    kind: 'bridge',
    family: 'girder',
    source: 'user',
    createdAt: new Date().toISOString(),
    owner: meta?.owner ?? 'Imported',
    status: 'operational',
    lastInspection: now,
    nextInspectionDue: now,
    conditionIndex: 80,
    conditionBand: 'good',
    riskLevel: 'moderate',
    riskScore: 40,
    remainingLifeYears: 40,
    photoLabel: 'IFC',
    elements: [element],
    defects: [],
    drawnDefects: [],
    recommendations: [],
    inspections: [],
    documents: { drawings: 1, reports: 0, photos: 0 },
    riskBreakdown: {
      structural: 30,
      hydraulic: 18,
      seismic: 18,
      geology: 12,
      traffic: 12,
      other: 10,
    },
    maintenanceForecast: [],
    heatmap: [{ element: 'Imported', spans: ['good'] }],
    importedModel: model,
  }
}
