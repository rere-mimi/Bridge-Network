type BrandLogoProps = {
  className?: string
  title?: string
}

/** BN monogram mark for Bridge Network — red letters on grey. */
export function BrandLogo({ className = '', title = 'Bridge Network' }: BrandLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id="bn-logo-plate" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6b7280" />
          <stop offset="1" stopColor="#374151" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#bn-logo-plate)" />
      <rect
        x="3.5"
        y="3.5"
        width="57"
        height="57"
        rx="12"
        stroke="#9ca3af"
        strokeOpacity="0.45"
        strokeWidth="1.5"
      />
      {/* B — stem + bowls with counters */}
      <path
        fill="#dc2626"
        fillRule="evenodd"
        d="M14 14h12.2c5.35 0 8.9 2.7 8.9 7.05 0 2.95-1.55 5.15-4.15 6.2 3.25 1.05 5.35 3.55 5.35 7.2 0 4.95-3.85 8.55-9.75 8.55H14V14zm6.4 11.9h2.05c2.55 0 4.05-1.2 4.05-3.2 0-1.95-1.5-3.05-4.05-3.05H20.4v6.25zm0 13.4h2.45c2.9 0 4.65-1.4 4.65-3.6s-1.75-3.5-4.65-3.5H20.4v7.1z"
      />
      {/* N */}
      <path
        fill="#dc2626"
        d="M36.5 14h6.55l10.2 22.05V14H59v36h-6.6L42.15 27.85V50H36.5V14z"
      />
    </svg>
  )
}
