type BrandLogoProps = {
  className?: string
  title?: string
}

/** Spreadsheet + arch-bridge mark for Bridge Network. */
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
        <linearGradient id="bn-logo-bg" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0ea5e9" />
          <stop offset="1" stopColor="#0369a1" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#bn-logo-bg)" />
      <rect x="10" y="28" width="44" height="26" rx="3" fill="#e0f2fe" opacity="0.95" />
      <rect x="10" y="28" width="44" height="6" rx="3" fill="#7dd3fc" />
      <rect x="10" y="31" width="44" height="3" fill="#7dd3fc" />
      <g stroke="#0369a1" strokeOpacity="0.35" strokeWidth="1">
        <path d="M10 34.5h44M10 40.5h44M10 46.5h44" />
        <path d="M21 28v26M32 28v26M43 28v26" />
      </g>
      <path
        d="M12 36 C20 12, 44 12, 52 36"
        stroke="#0f172a"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.88"
      />
      <path
        d="M14 36 C21 16, 43 16, 50 36"
        stroke="#f8fafc"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M18 36v12M32 28v20M46 36v12"
        stroke="#0f172a"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M18 36v12M32 28v20M46 36v12"
        stroke="#38bdf8"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path d="M12 36h40" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
