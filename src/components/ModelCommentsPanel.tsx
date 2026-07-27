import { useMemo, useState } from 'react'
import type {
  BridgeAsset,
  BridgeElement,
  DefectFace,
  ModelComment,
  ModelCommentAuthorRole,
} from '../types'
import { saveUserStructure } from '../data/structureStore'

const FACE_OPTIONS: Array<{ id: DefectFace | ''; label: string }> = [
  { id: '', label: 'Whole element' },
  { id: 'top', label: 'Top' },
  { id: 'front', label: 'Front' },
  { id: 'side', label: 'Side' },
  { id: 'end', label: 'End' },
]

type ModelCommentsPanelProps = {
  bridge: BridgeAsset
  element: BridgeElement | null
  onBridgeChange: (bridge: BridgeAsset) => void
  /** Default author label when adding */
  defaultAuthor?: string
  defaultRole?: ModelCommentAuthorRole
}

export function ModelCommentsPanel({
  bridge,
  element,
  onBridgeChange,
  defaultAuthor = 'Project manager',
  defaultRole = 'pm',
}: ModelCommentsPanelProps) {
  const [text, setText] = useState('')
  const [author, setAuthor] = useState(defaultAuthor)
  const [role, setRole] = useState<ModelCommentAuthorRole>(defaultRole)
  const [face, setFace] = useState<DefectFace | ''>('')

  const comments = bridge.modelComments ?? []

  const visible = useMemo(() => {
    const open = comments.filter((c) => !c.resolvedAt)
    if (!element) {
      return open.filter((c) => !c.elementId)
    }
    const onElement = open.filter((c) => c.elementId === element.id)
    const structureWide = open.filter((c) => !c.elementId)
    return [...onElement, ...structureWide]
  }, [comments, element])

  function persist(nextComments: ModelComment[]) {
    const updated: BridgeAsset = {
      ...bridge,
      modelComments: nextComments,
      source: 'user',
    }
    const next = saveUserStructure(updated)
    const saved = next.find((b) => b.id === bridge.id) ?? updated
    onBridgeChange(saved)
  }

  function handleAdd() {
    const body = text.trim()
    if (!body) return
    const comment: ModelComment = {
      id: `mc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: body,
      author: author.trim() || (role === 'pm' ? 'Project manager' : 'Inspector'),
      role,
      createdAt: new Date().toISOString(),
      elementId: element?.id ?? null,
      face: face || undefined,
      resolvedAt: null,
    }
    persist([comment, ...comments])
    setText('')
  }

  function handleResolve(id: string) {
    persist(
      comments.map((c) =>
        c.id === id ? { ...c, resolvedAt: new Date().toISOString() } : c,
      ),
    )
  }

  function handleDelete(id: string) {
    persist(comments.filter((c) => c.id !== id))
  }

  return (
    <div className="model-comments-panel">
      <p className="section-label">
        {element ? 'Model comments on this element' : 'Structure briefings'}
      </p>
      <p className="page-note subtle">
        PM briefings for the inspector live on the 3D model — select an element to pin a comment,
        or leave structure-wide notes below.
      </p>

      <div className="model-comments-form">
        <label className="db-field grow">
          <span>{role === 'pm' ? 'PM briefing' : 'Inspector note'}</span>
          <textarea
            rows={3}
            value={text}
            placeholder={
              element
                ? `Note for ${element.name} (${element.code})…`
                : 'Structure-wide briefing for the next inspection…'
            }
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <div className="model-comments-form-row">
          <label className="db-field">
            <span>Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as ModelCommentAuthorRole)}
            >
              <option value="pm">PM</option>
              <option value="inspector">Inspector</option>
            </select>
          </label>
          <label className="db-field grow">
            <span>Author</span>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} />
          </label>
          {element && (
            <label className="db-field">
              <span>Face</span>
              <select
                value={face}
                onChange={(e) => setFace(e.target.value as DefectFace | '')}
              >
                {FACE_OPTIONS.map((opt) => (
                  <option key={opt.id || 'all'} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className="mandate-actions">
          <button type="button" className="page-btn primary" onClick={handleAdd} disabled={!text.trim()}>
            Add to 3D model
          </button>
        </div>
      </div>

      <ul className="model-comments-list">
        {visible.map((c) => (
          <li key={c.id} className={`model-comment role-${c.role}`}>
            <div className="model-comment-head">
              <em>{c.role === 'pm' ? 'PM' : 'Inspector'}</em>
              <strong>{c.author}</strong>
              <span>{new Date(c.createdAt).toLocaleString()}</span>
            </div>
            <p>{c.text}</p>
            <div className="model-comment-meta">
              {!c.elementId && <span>Structure-wide</span>}
              {c.elementId && c.elementId !== element?.id && <span>Also on other element</span>}
              {c.face && <span>Face · {c.face}</span>}
            </div>
            <div className="mandate-row-actions">
              <button type="button" className="page-btn" onClick={() => handleResolve(c.id)}>
                Resolve
              </button>
              <button type="button" className="page-btn danger" onClick={() => handleDelete(c.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="empty">No open comments{element ? ' on this element' : ''}.</li>
        )}
      </ul>
    </div>
  )
}

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
