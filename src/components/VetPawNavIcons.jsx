import React from 'react'

const palette = {
  green: '#78d65c',
  greenSoft: '#a8ec88',
  orange: '#f7b547',
  orangeSoft: '#ffd37c',
  white: '#f7fbff',
  line: 'rgba(255,255,255,0.94)',
  muted: 'rgba(255,255,255,0.78)',
}

const iconProps = {
  fill: 'none',
  stroke: palette.line,
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function IconSvg({ children, size = 18, viewBox = '0 0 24 24' }) {
  return (
    <svg width={size} height={size} viewBox={viewBox} aria-hidden="true">
      {children}
    </svg>
  )
}

const icons = {
  panel: ({ size }) => (
    <IconSvg size={size}>
      <path {...iconProps} d="M3.5 10.8 12 4l8.5 6.8" />
      <path {...iconProps} d="M6.4 9.7V20h11.2V9.7" />
      <path {...iconProps} d="M10 20v-5.2h4V20" />
      <circle cx="18.2" cy="17.1" r="1.4" fill={palette.orange} opacity="0.95" />
    </IconSvg>
  ),
  pets: ({ size }) => (
    <IconSvg size={size}>
      <circle cx="8" cy="8" r="1.9" fill={palette.orange} />
      <circle cx="16" cy="8" r="1.9" fill={palette.orange} />
      <circle cx="6.1" cy="13.1" r="1.8" fill={palette.orangeSoft} />
      <circle cx="17.9" cy="13.1" r="1.8" fill={palette.orangeSoft} />
      <path d="M12 11.4c-2.5 0-4.7 2.1-4.7 4.6 0 2 1.6 3.1 3.5 3.1.9 0 1.4-.3 2.1-.8.7.5 1.2.8 2.1.8 1.9 0 3.5-1.1 3.5-3.1 0-2.5-2.2-4.6-4.7-4.6Z" fill={palette.green} />
    </IconSvg>
  ),
  appointments: ({ size }) => (
    <IconSvg size={size}>
      <rect x="4" y="5.5" width="16" height="14.5" rx="3" {...iconProps} />
      <path {...iconProps} d="M7.7 3.8v3.1M16.3 3.8v3.1M4 9.5h16" />
      <circle cx="16.6" cy="16.7" r="3.4" fill={palette.green} opacity="0.92" />
      <path d="M15.5 16.7l.8.8 1.7-2.1" fill="none" stroke="#0b1620" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </IconSvg>
  ),
  history: ({ size }) => (
    <IconSvg size={size}>
      <rect x="5.2" y="3.8" width="13.6" height="16.6" rx="2.6" {...iconProps} />
      <path {...iconProps} d="M9.2 7.4h5.6M8.5 11.3h7M8.5 14.6h7" />
      <path d="M12 17.7v-3.5M10.2 15.9h3.6" stroke={palette.green} strokeWidth="2" strokeLinecap="round" />
      <rect x="9" y="2.6" width="6" height="3" rx="1.2" fill={palette.orange} />
    </IconSvg>
  ),
  clinics: ({ size }) => (
    <IconSvg size={size}>
      <path {...iconProps} d="M4.8 19.8V10.2c0-.9.7-1.6 1.6-1.6h11.2c.9 0 1.6.7 1.6 1.6v9.6" />
      <path {...iconProps} d="M8.2 19.8v-4.2h7.6v4.2M9 12.2h1.6M13.4 12.2H15" />
      <circle cx="18.1" cy="6.5" r="3.7" fill={palette.green} opacity="0.92" />
      <path d="M18.1 4.8v3.4M16.4 6.5h3.4" stroke="#0b1620" strokeWidth="1.8" strokeLinecap="round" />
    </IconSvg>
  ),
  lost: ({ size }) => (
    <IconSvg size={size}>
      <circle cx="10.2" cy="10.2" r="5.6" {...iconProps} />
      <path {...iconProps} d="m14.5 14.5 4.1 4.1" />
      <circle cx="8.6" cy="9" r=".95" fill={palette.orange} />
      <circle cx="11.8" cy="9" r=".95" fill={palette.orange} />
      <circle cx="7.8" cy="11.8" r=".9" fill={palette.orangeSoft} />
      <circle cx="12.6" cy="11.8" r=".9" fill={palette.orangeSoft} />
      <path d="M10.2 10.6c-1.3 0-2.4 1-2.4 2.3 0 .9.8 1.5 1.8 1.5.4 0 .7-.1.9-.4.3.3.5.4 1 .4 1 0 1.8-.6 1.8-1.5 0-1.3-1.1-2.3-2.4-2.3Z" fill={palette.green} />
    </IconSvg>
  ),
  messages: ({ size }) => (
    <IconSvg size={size}>
      <path {...iconProps} d="M5 6.2h10.4c2.1 0 3.8 1.6 3.8 3.7 0 2.1-1.7 3.8-3.8 3.8H10l-3.6 3V13.7H5c-1.1 0-2-.9-2-2v-3.5c0-1.1.9-2 2-2Z" />
      <circle cx="9" cy="10" r="1" fill={palette.greenSoft} />
      <circle cx="12.2" cy="10" r="1" fill={palette.orange} />
      <circle cx="15.4" cy="10" r="1" fill={palette.greenSoft} />
    </IconSvg>
  ),
  profile: ({ size }) => (
    <IconSvg size={size}>
      <circle cx="12" cy="8" r="3.2" {...iconProps} />
      <path {...iconProps} d="M5.2 19.2c1.6-3.2 4-4.8 6.8-4.8s5.2 1.6 6.8 4.8" />
      <circle cx="18.4" cy="17.7" r="1.4" fill={palette.green} />
    </IconSvg>
  ),
  settings: ({ size }) => (
    <IconSvg size={size}>
      <path {...iconProps} d="M12 3.8v2.1M12 18.1v2.1M5.9 5.9l1.5 1.5M16.6 16.6l1.5 1.5M3.8 12h2.1M18.1 12h2.1M5.9 18.1l1.5-1.5M16.6 7.4l1.5-1.5" />
      <circle cx="12" cy="12" r="4.2" {...iconProps} />
      <circle cx="12" cy="12" r="1.8" fill={palette.green} />
    </IconSvg>
  ),
  notifications: ({ size }) => (
    <IconSvg size={size}>
      <path {...iconProps} d="M7.2 17.4h9.6c-.7-.8-1.1-1.9-1.1-3v-2c0-2.2-1.2-4.1-3.1-4.8V6.8a.6.6 0 0 0-.6-.6h0a.6.6 0 0 0-.6.6v.8c-1.9.7-3.1 2.6-3.1 4.8v2c0 1.1-.4 2.2-1.1 3Z" />
      <path {...iconProps} d="M10.1 18.1a2.1 2.1 0 0 0 3.8 0" />
      <circle cx="17.6" cy="7.1" r="2.2" fill={palette.green} />
    </IconSvg>
  ),
  logout: ({ size }) => (
    <IconSvg size={size}>
      <path {...iconProps} d="M10.5 5H7.6A2.6 2.6 0 0 0 5 7.6v8.8A2.6 2.6 0 0 0 7.6 19h2.9" />
      <path d="M13 12h7" stroke={palette.orange} strokeWidth="2" strokeLinecap="round" />
      <path d="m17 8.8 3.2 3.2-3.2 3.2" fill="none" stroke={palette.orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </IconSvg>
  ),
  login: ({ size }) => (
    <IconSvg size={size}>
      <path {...iconProps} d="M10.5 5H7.6A2.6 2.6 0 0 0 5 7.6v8.8A2.6 2.6 0 0 0 7.6 19h2.9" />
      <path d="M13 12h7" stroke={palette.green} strokeWidth="2" strokeLinecap="round" />
      <path d="m17 8.8 3.2 3.2-3.2 3.2" fill="none" stroke={palette.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </IconSvg>
  ),
}

export function NavIcon({ name, active = false, size = 18, compact = false, danger = false }) {
  const Icon = icons[name] || icons.panel
  const bg = danger
    ? 'linear-gradient(135deg, rgba(255,107,107,0.18), rgba(255,107,107,0.08))'
    : active
      ? 'linear-gradient(135deg, rgba(120,214,92,0.28), rgba(247,181,71,0.18))'
      : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))'

  const border = danger
    ? '1px solid rgba(255,107,107,0.20)'
    : active
      ? '1px solid rgba(120,214,92,0.30)'
      : '1px solid rgba(255,255,255,0.08)'

  const boxShadow = active
    ? '0 10px 20px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.08)'
    : 'inset 0 1px 0 rgba(255,255,255,0.04)'

  const dimension = compact ? 30 : 32

  return (
    <span
      style={{
        width: dimension,
        height: dimension,
        minWidth: dimension,
        borderRadius: 11,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bg,
        border,
        boxShadow,
      }}
    >
      <Icon size={size} />
    </span>
  )
}

export default NavIcon
