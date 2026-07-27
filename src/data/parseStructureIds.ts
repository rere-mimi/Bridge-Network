import type { BridgeAsset } from '../types'

const ID_PATTERN = /\b(\d{5})\b/g

/** Extract unique 5-digit structure IDs from free text (paste / CSV cells). */
export function extractStructureIds(text: string): string[] {
  if (!text?.trim()) return []
  const found: string[] = []
  const seen = new Set<string>()
  for (const match of text.matchAll(ID_PATTERN)) {
    const id = match[1]
    if (seen.has(id)) continue
    seen.add(id)
    found.push(id)
  }
  return found
}

export type StructureIdResolveResult = {
  /** IDs present in the inventory */
  matched: BridgeAsset[]
  /** IDs requested but not found */
  missing: string[]
  /** All unique IDs parsed from input */
  parsed: string[]
}

export function resolveStructureIds(
  text: string,
  inventory: BridgeAsset[],
): StructureIdResolveResult {
  const parsed = extractStructureIds(text)
  const byId = new Map(inventory.map((b) => [b.id, b]))
  const matched: BridgeAsset[] = []
  const missing: string[] = []
  for (const id of parsed) {
    const hit = byId.get(id)
    if (hit) matched.push(hit)
    else missing.push(id)
  }
  return { matched, missing, parsed }
}

/**
 * Parse a CSV / TSV blob. Prefers a column named id / structureid / bridgeid;
 * otherwise uses the first column that looks like 5-digit IDs.
 */
export function parseStructureIdsFromCsv(csvText: string): string[] {
  const lines = csvText
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length === 0) return []

  const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ','
  const rows = lines.map((line) => splitCsvLine(line, delimiter))
  const header = rows[0].map((cell) => cell.trim().toLowerCase().replace(/[^a-z0-9]/g, ''))

  const idColCandidates = ['id', 'structureid', 'bridgeid', 'assetid', 'structure', 'bridge']
  let colIndex = header.findIndex((h) => idColCandidates.includes(h))

  const dataRows = colIndex >= 0 ? rows.slice(1) : rows
  if (colIndex < 0) {
    // Pick the column with the most 5-digit hits
    const colCount = Math.max(...rows.map((r) => r.length), 0)
    let bestCol = 0
    let bestHits = -1
    for (let c = 0; c < colCount; c++) {
      const hits = rows.reduce((n, row) => n + extractStructureIds(row[c] ?? '').length, 0)
      if (hits > bestHits) {
        bestHits = hits
        bestCol = c
      }
    }
    colIndex = bestCol
  }

  const blob = dataRows.map((row) => row[colIndex] ?? '').join('\n')
  return extractStructureIds(blob)
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (ch === delimiter && !inQuotes) {
      cells.push(current)
      current = ''
      continue
    }
    current += ch
  }
  cells.push(current)
  return cells
}
