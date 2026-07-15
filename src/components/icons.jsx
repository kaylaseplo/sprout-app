export function ChatIcon({ width = 24, height = 24, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}

export function ActivityIcon({ width = 24, height = 24, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
      <circle cx="12" cy="12" r="3.5" />
    </svg>
  )
}

export function ClassroomIcon({ width = 24, height = 24, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
      <circle cx="17.5" cy="9.5" r="2.3" />
      <path d="M15.8 14.2c2.9.4 5.2 2.6 5.2 5.3" />
    </svg>
  )
}

export function CameraIcon({ width = 24, height = 24, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 8h2.5l1.3-2h8.4l1.3 2H20a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="14" r="3.5" />
    </svg>
  )
}

export function MicIcon({ width = 24, height = 24, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  )
}

export function LogoutIcon({ width = 24, height = 24, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
