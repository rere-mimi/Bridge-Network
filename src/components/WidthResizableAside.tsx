import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'

type WidthResizableAsideProps = {
  children: ReactNode
  storageKey?: string
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  className?: string
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function WidthResizableAside({
  children,
  storageKey,
  defaultWidth = 360,
  minWidth = 260,
  maxWidth = 560,
  className = '',
  collapsed = false,
  onCollapsedChange,
}: WidthResizableAsideProps) {
  const reactId = useId()
  const key = storageKey ?? `aside-${reactId}`
  const asideRef = useRef<HTMLElement | null>(null)
  const [width, setWidth] = useState(() => {
    if (typeof window === 'undefined') return defaultWidth
    const saved = window.localStorage.getItem(`twin-panel-w:${key}`)
    if (saved) {
      const parsed = Number(saved)
      if (!Number.isNaN(parsed)) return parsed
    }
    return defaultWidth
  })
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    window.localStorage.setItem(`twin-panel-w:${key}`, String(width))
  }, [key, width])

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()
      const startX = event.clientX
      const startWidth = width
      setDragging(true)

      const onMove = (moveEvent: PointerEvent) => {
        // Dragging the left edge: moving left increases width
        const next = Math.min(
          maxWidth,
          Math.max(minWidth, startWidth + (startX - moveEvent.clientX)),
        )
        setWidth(next)
      }

      const onUp = () => {
        setDragging(false)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [maxWidth, minWidth, width],
  )

  if (collapsed) {
    return (
      <aside className={`width-aside is-collapsed ${className}`.trim()}>
        <button
          type="button"
          className="width-aside-expand"
          title="Show details panel"
          onClick={() => onCollapsedChange?.(false)}
        >
          « Details
        </button>
      </aside>
    )
  }

  return (
    <aside
      ref={asideRef}
      className={`width-aside ${dragging ? 'is-dragging' : ''} ${className}`.trim()}
      style={{ width, flex: `0 0 ${width}px` }}
    >
      <button
        type="button"
        className="width-resize-handle"
        aria-label="Resize details panel"
        title="Drag to resize panel"
        onPointerDown={onPointerDown}
      />
      <div className="width-aside-toolbar">
        <span>Details panel</span>
        <button
          type="button"
          className="page-btn ghost"
          title="Collapse panel"
          onClick={() => onCollapsedChange?.(true)}
        >
          Collapse
        </button>
      </div>
      <div className="width-aside-body">{children}</div>
    </aside>
  )
}
