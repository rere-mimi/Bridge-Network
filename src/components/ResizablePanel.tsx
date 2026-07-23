import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'

type ResizablePanelProps = {
  title?: string
  badge?: string
  className?: string
  children: ReactNode
  defaultHeight?: number
  minHeight?: number
  maxHeight?: number
  storageKey?: string
  selected?: boolean
  onSelect?: () => void
  onHeightChange?: (height: number) => void
}

export function ResizablePanel({
  title,
  badge,
  className = '',
  children,
  defaultHeight,
  minHeight = 140,
  maxHeight = 720,
  storageKey,
  selected = false,
  onSelect,
  onHeightChange,
}: ResizablePanelProps) {
  const reactId = useId()
  const key = storageKey ?? `panel-${reactId}`
  const panelRef = useRef<HTMLElement | null>(null)
  const [height, setHeight] = useState<number | null>(() => {
    if (typeof window === 'undefined') return defaultHeight ?? null
    const saved = window.localStorage.getItem(`twin-panel-h:${key}`)
    if (saved) {
      const parsed = Number(saved)
      if (!Number.isNaN(parsed)) return parsed
    }
    return defaultHeight ?? null
  })
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (height == null) return
    window.localStorage.setItem(`twin-panel-h:${key}`, String(height))
    onHeightChange?.(height)
  }, [height, key, onHeightChange])

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()
      onSelect?.()
      const startY = event.clientY
      const startHeight =
        height ?? panelRef.current?.getBoundingClientRect().height ?? minHeight
      setDragging(true)

      const onMove = (moveEvent: PointerEvent) => {
        const next = Math.min(
          maxHeight,
          Math.max(minHeight, startHeight + (moveEvent.clientY - startY)),
        )
        setHeight(next)
      }

      const onUp = () => {
        setDragging(false)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [height, maxHeight, minHeight, onSelect],
  )

  const style: CSSProperties =
    height != null
      ? {
          height,
          maxHeight,
          minHeight,
        }
      : {
          minHeight,
        }

  return (
    <section
      ref={panelRef}
      className={`panel-block resizable-panel ${selected ? 'is-selected' : ''} ${dragging ? 'is-dragging' : ''} ${className}`}
      style={style}
      onMouseDown={() => onSelect?.()}
      onFocusCapture={() => onSelect?.()}
    >
      {title ? (
        <header>
          <h2>{title}</h2>
          {badge ? <span>{badge}</span> : null}
        </header>
      ) : null}
      <div className="resizable-panel-body">{children}</div>
      <button
        type="button"
        className="resize-handle"
        aria-label={title ? `Resize ${title} panel` : 'Resize panel'}
        title="Drag to resize"
        onPointerDown={onPointerDown}
      >
        <span aria-hidden="true" />
      </button>
    </section>
  )
}
