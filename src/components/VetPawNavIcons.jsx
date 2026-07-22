import panelIcon from '../assets/vetpaw-nav-icons/panel.png'
import communityIcon from '../assets/vetpaw-nav-icons/community.png'
import petsIcon from '../assets/vetpaw-nav-icons/pets.png'
import appointmentsIcon from '../assets/vetpaw-nav-icons/appointments.png'
import historyIcon from '../assets/vetpaw-nav-icons/history.png'
import clinicsIcon from '../assets/vetpaw-nav-icons/clinics.png'
import lostIcon from '../assets/vetpaw-nav-icons/lost.png'
import messagesIcon from '../assets/vetpaw-nav-icons/messages.png'
import profileIcon from '../assets/vetpaw-nav-icons/profile.png'
import settingsIcon from '../assets/vetpaw-nav-icons/settings.png'
import notificationsIcon from '../assets/vetpaw-nav-icons/notifications.png'
import logoutIcon from '../assets/vetpaw-nav-icons/logout.png'

const ICONS = {
  community: communityIcon,
  panel: panelIcon,
  pets: petsIcon,
  appointments: appointmentsIcon,
  history: historyIcon,
  clinics: clinicsIcon,
  lost: lostIcon,
  messages: messagesIcon,
  profile: profileIcon,
  settings: settingsIcon,
  notifications: notificationsIcon,
  logout: logoutIcon,
  login: logoutIcon,
}

export function NavIcon({ name, active = false, compact = false, danger = false }) {
  const src = ICONS[name] || panelIcon
  const dimension = compact ? 30 : 32
  const bg = danger
    ? 'linear-gradient(135deg, rgba(255,107,107,0.16), rgba(255,107,107,0.08))'
    : active
      ? 'linear-gradient(135deg, rgba(120,214,92,0.28), rgba(247,181,71,0.18))'
      : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))'
  const border = danger
    ? '1px solid rgba(255,107,107,0.24)'
    : active
      ? '1px solid rgba(120,214,92,0.30)'
      : '1px solid rgba(255,255,255,0.08)'

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
        boxShadow: active
          ? '0 10px 20px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.08)'
          : 'inset 0 1px 0 rgba(255,255,255,0.04)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {name === 'explore' || name === 'adoptions' ? (
        <span aria-hidden="true" style={{ fontSize: compact ? 18 : 19, lineHeight: 1 }}>{name === 'adoptions' ? '🏠' : '🔎'}</span>
      ) : (
        <img
          src={src}
          alt=""
          style={{
            width: compact ? 22 : 24,
            height: compact ? 22 : 24,
            objectFit: 'contain',
            display: 'block',
            filter: danger ? 'saturate(1.02)' : 'none',
          }}
        />
      )}
    </span>
  )
}

export default NavIcon
