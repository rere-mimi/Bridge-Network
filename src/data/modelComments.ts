import type { ModelComment } from '../types'

/** Count open comments pinned to an element (for 3D markers). */
export function openCommentCountByElement(
  comments: ModelComment[] | undefined,
): Map<string, number> {
  const map = new Map<string, number>()
  for (const c of comments ?? []) {
    if (c.resolvedAt || !c.elementId) continue
    map.set(c.elementId, (map.get(c.elementId) ?? 0) + 1)
  }
  return map
}
