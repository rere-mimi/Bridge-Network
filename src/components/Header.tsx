type HeaderProps = {
  clock: Date
}

export function Header({ clock }: HeaderProps) {
  const stamp = clock.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <header className="app-header">
      <div className="brand-block">
        <div className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="10" fill="currentColor" />
            <path
              d="M8 23h7l2.5-7 4.5 14 2.5-7H32"
              stroke="#E8F6F2"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="20" cy="12" r="2.4" fill="#F0A202" />
          </svg>
        </div>
        <div className="brand-text">
          <p className="brand-name">Bridge Network</p>
          <p className="brand-tag">Live operations map</p>
        </div>
      </div>

      <div className="header-meta">
        <span className="live-chip large">
          <span className="live-dot" aria-hidden="true" />
          Live
        </span>
        <time dateTime={clock.toISOString()}>{stamp}</time>
      </div>
    </header>
  )
}
