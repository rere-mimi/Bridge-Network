type BrandLogoProps = {
  className?: string
  title?: string
}

/** Red book mark for Bridge Network. */
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
        <linearGradient id="bn-book-cover" x1="20" y1="10" x2="52" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ef4444" />
          <stop offset="1" stopColor="#b91c1c" />
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
      {/* Book body */}
      <path
        fill="url(#bn-book-cover)"
        d="M18 12.5c0-1.1.9-2 2-2h24.5c1.66 0 3 1.34 3 3v37c0 1.66-1.34 3-3 3H20c-1.1 0-2-.9-2-2V12.5z"
      />
      {/* Spine */}
      <path fill="#7f1d1d" d="M18 12.5c0-1.1.9-2 2-2h4.5v45.5H20c-1.1 0-2-.9-2-2V12.5z" />
      {/* Spine highlight */}
      <path fill="#fca5a5" fillOpacity="0.35" d="M20.5 11h1.6v44.5h-1.6z" />
      {/* Page block edge */}
      <path fill="#f3f4f6" d="M45.5 13.5h2.2c.9 0 1.6.7 1.6 1.6v34.8c0 .9-.7 1.6-1.6 1.6h-2.2V13.5z" />
      <path stroke="#d1d5db" strokeWidth="0.7" d="M46.2 16.5v30M47.4 16.5v30" />
      {/* Cover title band */}
      <rect x="27" y="22" width="14" height="2.4" rx="1.2" fill="#fecaca" fillOpacity="0.85" />
      <rect x="27" y="27.5" width="10" height="1.8" rx="0.9" fill="#fecaca" fillOpacity="0.55" />
    </svg>
  )
}
