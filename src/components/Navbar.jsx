import { useCallback, useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    getAppointments,
    getBirthdayCelebrations,
    getCommunityNotifications,
    getCommunityNotificationsUnreadCount,
    getUnreadCount,
    markCommunityNotificationRead,
    markNotificationsSeen,
} from '../services/api'
import InstallPWA from './InstallPWA'
import NavIcon from './VetPawNavIcons'

const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif"
const BROWSER_FONT = "'Nunito', 'Plus Jakarta Sans', sans-serif"
const G1 = '#4CAF50'
const O1 = '#FF9800'

// ── Detectar PWA desktop standalone ──
const useIsStandalone = () => {
    const [isStandalone, setIsStandalone] = useState(
        window.matchMedia('(display-mode: standalone)').matches
    )
    useEffect(() => {
        const mq = window.matchMedia('(display-mode: standalone)')
        const handler = (e) => setIsStandalone(e.matches)
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [])
    return isStandalone
}

export default function Navbar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [notifications, setNotifications] = useState([])
    const [notificationCount, setNotificationCount] = useState(0)
    const [unreadMessages, setUnreadMessages] = useState(0)
    const [showNotif, setShowNotif] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const notifRef = useRef(null)
    const isStandalone = useIsStandalone()
    const isPWADesktop = isStandalone && !isMobile

    const fetchNotifications = useCallback(async () => {
        if (!user) return
        try {
            const socialPromise = Promise.all([
                getCommunityNotifications({ page_size: 8 }),
                getCommunityNotificationsUnreadCount(),
            ])

            if (user.role !== 'owner') {
                const [socialData, socialUnread] = await socialPromise
                const socialRows = socialData.results ?? socialData
                const normalized = (Array.isArray(socialRows) ? socialRows : []).map((item) => ({
                    id: item.id,
                    notification_key: `community-${item.id}`,
                    source: 'community',
                    status: item.notification_type,
                    message: item.message,
                    meta: item.extra_text || item.actor?.display_name || 'Actividad de la comunidad',
                    requested_date: item.created_at,
                    target_url: item.target_url || '/comunidad',
                    is_read: item.is_read,
                }))
                setNotifications(
                    normalized
                        .sort((a, b) => {
                            if (Boolean(a.is_read) !== Boolean(b.is_read)) return a.is_read ? 1 : -1
                            return new Date(b.requested_date || 0) - new Date(a.requested_date || 0)
                        })
                        .slice(0, 2)
                )
                setNotificationCount(socialUnread.unread || 0)
                return
            }

            const [[socialData, socialUnread], appointmentData, birthdayData] = await Promise.all([
                socialPromise,
                getAppointments(),
                getBirthdayCelebrations(true),
            ])
            const socialRows = socialData.results ?? socialData
            const appts = appointmentData.results ?? appointmentData
            const birthdays = birthdayData.results ?? birthdayData

            const socialNotifications = (Array.isArray(socialRows) ? socialRows : []).map((item) => ({
                id: item.id,
                notification_key: `community-${item.id}`,
                source: 'community',
                status: item.notification_type,
                message: item.message,
                meta: item.extra_text || item.actor?.display_name || 'Actividad de la comunidad',
                requested_date: item.created_at,
                target_url: item.target_url || '/comunidad',
                is_read: item.is_read,
            }))
            const appointmentNotifications = (Array.isArray(appts) ? appts : [])
                .filter((item) => item.seen_by_owner === false)
                .map((item) => ({
                    ...item,
                    source: 'appointment',
                    notification_key: `appointment-${item.id}`,
                    message: `${item.reason || 'Turno'} · ${item.clinic_name}`,
                    meta: `🐾 ${item.pet_name}`,
                    target_url: '/appointments',
                    is_read: false,
                }))
            const birthdayNotifications = (Array.isArray(birthdays) ? birthdays : []).map((item) => ({
                id: item.id,
                source: 'birthday',
                notification_key: `birthday-${item.id}`,
                status: 'birthday',
                message: `${item.pet_name} cumple ${item.age} año${item.age === 1 ? '' : 's'}`,
                meta: item.badge?.name || 'Insignia VetPaw',
                requested_date: item.birthday_date,
                target_url: '/notifications',
                is_read: false,
            }))

            const combined = [...socialNotifications, ...birthdayNotifications, ...appointmentNotifications]
                .sort((a, b) => {
                    if (Boolean(a.is_read) !== Boolean(b.is_read)) return a.is_read ? 1 : -1
                    return new Date(b.requested_date || 0) - new Date(a.requested_date || 0)
                })
                .slice(0, 2)
            setNotifications(combined)
            setNotificationCount(
                (socialUnread.unread || 0) + birthdayNotifications.length + appointmentNotifications.length
            )
        } catch (e) {
            console.error(e)
        }
    }, [user])

    const fetchUnreadMessages = useCallback(async () => {
        try {
            const data = await getUnreadCount()
            setUnreadMessages(data.unread || 0)
        } catch (e) { console.error(e) }
    }, [])

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [])

    useEffect(() => {
        setMenuOpen(false)
        setShowNotif(false)
    }, [location.pathname])

    useEffect(() => {
        if (!user) {
            setNotifications([])
            setNotificationCount(0)
            setUnreadMessages(0)
            return undefined
        }

        fetchNotifications()
        fetchUnreadMessages()
        const interval = setInterval(() => {
            fetchNotifications()
            fetchUnreadMessages()
        }, 30000)
        return () => clearInterval(interval)
    }, [user, fetchNotifications, fetchUnreadMessages])

    useEffect(() => {
        const refreshNotifications = () => {
            if (user) fetchNotifications()
        }
        window.addEventListener('vetpaw:birthday-updated', refreshNotifications)
        window.addEventListener('vetpaw:notifications-updated', refreshNotifications)
        return () => {
            window.removeEventListener('vetpaw:birthday-updated', refreshNotifications)
            window.removeEventListener('vetpaw:notifications-updated', refreshNotifications)
        }
    }, [user, fetchNotifications])

    useEffect(() => {
        const handler = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [menuOpen])

    // ── Cuando es PWA desktop, agregar margen al body para el sidebar ──
    useEffect(() => {
        if (isPWADesktop) {
            document.body.style.marginLeft = sidebarCollapsed ? '72px' : '220px'
            document.body.style.transition = 'margin-left 0.25s ease'
        } else {
            document.body.style.marginLeft = ''
            document.body.style.transition = ''
        }
        return () => {
            document.body.style.marginLeft = ''
            document.body.style.transition = ''
        }
    }, [isPWADesktop, sidebarCollapsed])



    const handleOpenNotif = async () => {
        const opening = !showNotif
        setShowNotif(opening)
        if (opening && user?.role === 'owner' && notifications.some((item) => item.source === 'appointment')) {
            try {
                await markNotificationsSeen()
                await fetchNotifications()
            } catch (e) {
                console.error(e)
            }
        }
    }

    const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false) }

    const statusLabel = (status) => {
        if (status === 'reaction') return '🐾 Nueva patita'
        if (status === 'comment') return '💬 Nuevo comentario'
        if (status === 'follow') return '👥 Nuevo seguidor'
        if (status === 'comment_reaction') return '🐾 Patita en tu comentario'
        if (status === 'reply') return '↩️ Nueva respuesta'
        if (status === 'mention') return '📣 Nueva mención'
        if (status === 'clinic_appointment') return '📅 Nuevo turno desde Comunidad'
        if (status === 'clinic_appointment_update') return '🏥 Turno veterinario actualizado'
        if (status === 'adoption_application') return '🏡 Nueva solicitud de adopción'
        if (status === 'adoption_help_offer') return '🤝 Nuevo ofrecimiento de ayuda'
        if (status === 'adoption_application_update') return '📋 Solicitud de adopción actualizada'
        if (status === 'birthday') return '🎂 Cumpleaños'
        if (status === 'confirmed') return '✅ Turno confirmado'
        if (status === 'cancelled') return '❌ Turno cancelado'
        return '🔔 Novedad VetPaw'
    }

    const handleNotificationClick = async (item) => {
        try {
            if (item.source === 'community' && !item.is_read) {
                await markCommunityNotificationRead(item.id)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setShowNotif(false)
            navigate(item.target_url || '/notifications')
            window.dispatchEvent(new CustomEvent('vetpaw:notifications-updated'))
            fetchNotifications()
        }
    }

    const notificationDate = (value) => {
        if (!value) return ''
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return ''
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
    }

    const isActive = (path) => {
        if (path === '/comunidad' && location.pathname === '/') return true
        return location.pathname === path || location.pathname.startsWith(path + '/')
    }

    const renderNavIcon = (name, active = false, compact = false, danger = false) => (
        <NavIcon name={name} active={active} compact={compact} danger={danger} />
    )

    // ── Links según rol ──
    const ownerLinks = [
        { to: '/comunidad', icon: 'community', label: 'Comunidad' },
        { to: '/explorar', icon: 'explore', label: 'Explorar' },
        { to: '/adopciones', icon: 'adoptions', label: 'Adopciones' },
        { to: '/mis-favoritos', icon: 'explore', label: 'Mis favoritos' },
        { to: '/dashboard', icon: 'panel', label: 'Mi panel' },
        { to: '/pets', icon: 'pets', label: 'Mascotas' },
        { to: '/appointments', icon: 'appointments', label: 'Turnos' },
        { to: '/history', icon: 'history', label: 'Historial' },
        { to: '/clinics', icon: 'clinics', label: 'Veterinarias' },
        { to: '/mascotas-perdidas', icon: 'lost', label: 'Mascotas perdidas' },
        { to: '/messages', icon: 'messages', label: 'Mensajes', badge: unreadMessages },
        { to: '/profile', icon: 'profile', label: 'Mi perfil' },
        { to: '/configuracion', icon: 'settings', label: 'Configuración' },
    ]

    const clinicLinks = [
        { to: '/comunidad', icon: 'community', label: 'Comunidad' },
        { to: '/explorar', icon: 'explore', label: 'Explorar' },
        { to: '/adopciones', icon: 'adoptions', label: 'Adopciones' },
        { to: '/clinic/dashboard', icon: 'panel', label: 'Mi panel' },
        { to: '/clinic/comunidad', icon: 'community', label: 'Comunidad profesional' },
        { to: '/messages', icon: 'messages', label: 'Mensajes', badge: unreadMessages },
        { to: '/profile', icon: 'profile', label: 'Mi perfil' },
        { to: '/configuracion', icon: 'settings', label: 'Configuración' },
    ]

    const businessLinks = [
        { to: '/comunidad', icon: 'community', label: 'Comunidad' },
        { to: '/explorar', icon: 'explore', label: 'Explorar' },
        { to: '/adopciones', icon: 'adoptions', label: 'Adopciones' },
        { to: '/business/dashboard', icon: 'panel', label: 'Mi negocio' },
        { to: '/business/comercial', icon: 'explore', label: 'Panel comercial' },
        { to: '/messages', icon: 'messages', label: 'Mensajes', badge: unreadMessages },
        { to: '/profile', icon: 'profile', label: 'Mi cuenta' },
        { to: '/configuracion', icon: 'settings', label: 'Configuración' },
    ]

    const shelterLinks = [
        { to: '/comunidad', icon: 'community', label: 'Comunidad' },
        { to: '/explorar', icon: 'explore', label: 'Explorar' },
        { to: '/adopciones', icon: 'adoptions', label: 'Adopciones' },
        { to: '/shelter/dashboard', icon: 'panel', label: 'Mi refugio' },
        { to: '/refugio/adopciones', icon: 'adoptions', label: 'Gestionar adopciones' },
        { to: '/messages', icon: 'messages', label: 'Mensajes', badge: unreadMessages },
        { to: '/profile', icon: 'profile', label: 'Mi cuenta' },
        { to: '/configuracion', icon: 'settings', label: 'Configuración' },
    ]

    const roleLinks = { owner: ownerLinks, clinic: clinicLinks, business: businessLinks, shelter: shelterLinks }
    const rolePanelPath = { owner: '/dashboard', clinic: '/clinic/dashboard', business: '/business/dashboard', shelter: '/shelter/dashboard' }
    const roleLabel = { owner: 'Dueño/a', clinic: 'Clínica', business: 'Negocio', shelter: 'Refugio' }
    const roleIconName = { owner: 'pets', clinic: 'clinics', business: 'explore', shelter: 'lost' }

    const guestLinks = [
        { to: '/comunidad', icon: 'community', label: 'Comunidad' },
        { to: '/explorar', icon: 'explore', label: 'Explorar' },
        { to: '/adopciones', icon: 'adoptions', label: 'Adopciones' },
        { to: '/clinics', icon: 'clinics', label: 'Veterinarias' },
        { to: '/mascotas-perdidas', icon: 'lost', label: 'Mascotas perdidas' },
        { to: '/login', icon: 'login', label: 'Ingresar' },
    ]

    const sidebarLinks = !user ? guestLinks : (roleLinks[user.role] || ownerLinks)

    // ── Estilos compartidos ──
    const browserLinkStyle = (path, accent = G1) => {
        const active = isActive(path)
        const softAccent = accent === O1 ? '#ffc36a' : '#8fda91'
        return {
            fontFamily: BROWSER_FONT,
            fontSize: 14,
            fontWeight: 800,
            color: active ? accent : softAccent,
            padding: '9px 9px 7px',
            textDecoration: 'none',
            borderRadius: 9,
            letterSpacing: 0.15,
            lineHeight: 1.05,
            whiteSpace: 'nowrap',
            background: active ? `${accent}16` : 'transparent',
            borderBottom: active ? `2px solid ${accent}` : '2px solid transparent',
            transition: 'color .16s, background .16s, border-color .16s, transform .16s',
        }
    }

    const browserLinkEvents = (path, accent = G1) => ({
        onMouseEnter: (e) => {
            e.currentTarget.style.color = accent
            e.currentTarget.style.background = `${accent}14`
            e.currentTarget.style.borderBottomColor = accent
            e.currentTarget.style.transform = 'translateY(-1px)'
        },
        onMouseLeave: (e) => {
            const active = isActive(path)
            e.currentTarget.style.color = active ? accent : (accent === O1 ? '#ffc36a' : '#8fda91')
            e.currentTarget.style.background = active ? `${accent}16` : 'transparent'
            e.currentTarget.style.borderBottomColor = active ? accent : 'transparent'
            e.currentTarget.style.transform = 'translateY(0)'
        },
    })
    const btnOutline = {
        fontFamily: FONT, fontSize: 15, fontWeight: 700,
        color: '#fff', padding: '7px 18px', borderRadius: 10,
        border: '1.5px solid rgba(255,255,255,0.2)',
        textDecoration: 'none', transition: 'border-color .15s, background .15s',
        background: 'transparent',
    }
    const btnGradient = {
        fontFamily: FONT, fontSize: 15, fontWeight: 700,
        color: '#fff', padding: '7px 18px', borderRadius: 10,
        background: `linear-gradient(135deg, ${G1}, ${O1})`,
        textDecoration: 'none',
        boxShadow: `0 3px 14px rgba(76,175,80,0.3)`,
        border: 'none',
    }
    const drawerLink = {
        fontFamily: FONT, fontSize: 17, fontWeight: 700,
        color: 'rgba(255,255,255,0.8)', padding: '14px 0',
        textDecoration: 'none', display: 'flex', alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        transition: 'color .15s',
    }

    const drawerLinks = !user ? guestLinks : (roleLinks[user.role] || ownerLinks)

    // ══════════════════════════════════════════
    // PWA DESKTOP — Sidebar izquierdo
    // ══════════════════════════════════════════
    if (isPWADesktop) {
        const W = sidebarCollapsed ? 72 : 220

        return (
            <>
                <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

                <aside style={{
                    position: 'fixed', top: 0, left: 0, bottom: 0,
                    width: W, zIndex: 200,
                    background: 'rgba(10, 21, 32, 0.85)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRight: '1px solid rgba(255,255,255,0.07)',
                    display: 'flex', flexDirection: 'column',
                    transition: 'width 0.25s ease',
                    overflow: 'hidden',
                    boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
                }}>

                    {/* Logo + colapsar */}
                    <div style={{
                        height: 64, display: 'flex', alignItems: 'center',
                        justifyContent: sidebarCollapsed ? 'center' : 'space-between',
                        padding: sidebarCollapsed ? '0 16px' : '0 16px 0 12px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        flexShrink: 0,
                    }}>
                        {!sidebarCollapsed && (
                            <Link to="/inicio-vetpaw" style={{ display: 'flex', alignItems: 'center' }}>
                                <img src="/logo_vetpaw.png" alt="VetPaw" style={{ height: 44, width: 'auto' }} />
                            </Link>
                        )}
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.10)',
                                borderRadius: 8, cursor: 'pointer',
                                width: 30, height: 30, display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                color: 'rgba(255,255,255,0.5)', fontSize: 14,
                                transition: 'background 0.15s', flexShrink: 0,
                            }}
                            title={sidebarCollapsed ? 'Expandir' : 'Colapsar'}
                        >
                            {sidebarCollapsed ? '›' : '‹'}
                        </button>
                    </div>

                    {/* User info */}
                    {user && !sidebarCollapsed && (
                        <div style={{
                            padding: '14px 16px',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            flexShrink: 0,
                        }}>
                            <p style={{ color: G1, fontFamily: FONT, fontWeight: 800, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user.profile_name || user.first_name || user.username}
                            </p>
                            <p style={{ color: 'rgba(255,255,255,0.35)', fontFamily: FONT, fontSize: 11, marginTop: 2 }}>
                                {roleLabel[user.role] || 'Usuario'}
                            </p>
                        </div>
                    )}
                    {user && sidebarCollapsed && (
                        <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${G1}, ${O1})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                                {renderNavIcon(roleIconName[user.role] || 'profile', true, true)}
                            </div>
                        </div>
                    )}

                    {/* Links de navegación */}
                    <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0', scrollbarWidth: 'none' }}>
                        {sidebarLinks.map(({ to, icon, label, badge }) => {
                            const active = isActive(to)
                            return (
                                <Link
                                    key={to} to={to}
                                    title={sidebarCollapsed ? label : ''}
                                    style={{
                                        display: 'flex', alignItems: 'center',
                                        gap: 10,
                                        padding: sidebarCollapsed ? '12px 0' : '10px 16px',
                                        justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                                        textDecoration: 'none',
                                        color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                                        background: active ? 'rgba(76,175,80,0.15)' : 'transparent',
                                        borderRight: active ? `3px solid ${G1}` : '3px solid transparent',
                                        fontFamily: FONT, fontWeight: active ? 700 : 600,
                                        fontSize: 14,
                                        transition: 'all 0.15s',
                                        position: 'relative',
                                    }}
                                    onMouseEnter={e => {
                                        if (!active) {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                                            e.currentTarget.style.color = '#fff'
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!active) {
                                            e.currentTarget.style.background = 'transparent'
                                            e.currentTarget.style.color = 'rgba(255,255,255,0.55)'
                                        }
                                    }}
                                >
                                    <span style={{ flexShrink: 0 }}>{renderNavIcon(icon, active, sidebarCollapsed)}</span>
                                    {!sidebarCollapsed && (
                                        <>
                                            <span style={{ flex: 1 }}>{label}</span>
                                            {badge > 0 && (
                                                <span style={{ background: O1, color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 10, padding: '2px 7px', flexShrink: 0 }}>
                                                    {badge}
                                                </span>
                                            )}
                                        </>
                                    )}
                                    {sidebarCollapsed && badge > 0 && (
                                        <span style={{ position: 'absolute', top: 8, right: 8, background: O1, color: '#fff', fontSize: 9, fontWeight: 800, width: 14, height: 14, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {badge}
                                        </span>
                                    )}
                                </Link>
                            )
                        })}

                        {/* Notificaciones sociales y de actividad */}
                        {user && (() => {
                            const active = isActive('/notifications')
                            return (
                                <Link
                                    to="/notifications"
                                    title={sidebarCollapsed ? 'Notificaciones' : ''}
                                    style={{
                                        display: 'flex', alignItems: 'center',
                                        gap: 10, width: '100%', boxSizing: 'border-box',
                                        padding: sidebarCollapsed ? '12px 0' : '10px 16px',
                                        justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                                        textDecoration: 'none',
                                        color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                                        background: active ? 'rgba(76,175,80,0.15)' : 'transparent',
                                        borderRight: active ? `3px solid ${G1}` : '3px solid transparent',
                                        fontFamily: FONT, fontWeight: active ? 700 : 600, fontSize: 14,
                                        cursor: 'pointer', transition: 'all 0.15s',
                                        position: 'relative',
                                    }}
                                    onMouseEnter={e => {
                                        if (!active) {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                                            e.currentTarget.style.color = '#fff'
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!active) {
                                            e.currentTarget.style.background = 'transparent'
                                            e.currentTarget.style.color = 'rgba(255,255,255,0.55)'
                                        }
                                    }}
                                >
                                    <span style={{ flexShrink: 0 }}>{renderNavIcon('notifications', active, sidebarCollapsed)}</span>
                                    {!sidebarCollapsed && <span style={{ flex: 1, textAlign: 'left' }}>Notificaciones</span>}
                                    {notificationCount > 0 && (
                                        <span style={{
                                            position: sidebarCollapsed ? 'absolute' : 'static',
                                            top: sidebarCollapsed ? 8 : 'auto',
                                            right: sidebarCollapsed ? 8 : 'auto',
                                            background: O1, color: '#fff',
                                            fontSize: sidebarCollapsed ? 9 : 10,
                                            fontWeight: 800,
                                            width: sidebarCollapsed ? 14 : 'auto',
                                            height: sidebarCollapsed ? 14 : 'auto',
                                            borderRadius: sidebarCollapsed ? '50%' : 10,
                                            padding: sidebarCollapsed ? 0 : '2px 7px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {notificationCount}
                                        </span>
                                    )}
                                </Link>
                            )
                        })()}
                    </nav>

                    {/* Footer sidebar */}
                    <div style={{
                        padding: sidebarCollapsed ? '12px 0' : '12px 16px',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        flexShrink: 0,
                        display: 'flex', flexDirection: 'column', gap: 8,
                        alignItems: sidebarCollapsed ? 'center' : 'stretch',
                    }}>
                        {!sidebarCollapsed && <InstallPWA />}
                        {user ? (
                            <button
                                onClick={handleLogout}
                                title={sidebarCollapsed ? 'Cerrar sesión' : ''}
                                style={{
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                                    gap: 8,
                                    padding: sidebarCollapsed ? '10px' : '10px 12px',
                                    borderRadius: 10,
                                    background: 'rgba(255,107,107,0.08)',
                                    border: '1px solid rgba(255,107,107,0.2)',
                                    color: '#ff6b6b', fontFamily: FONT, fontSize: 13,
                                    fontWeight: 700, cursor: 'pointer',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,107,0.15)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,107,107,0.08)'}
                            >
                                {renderNavIcon('logout', false, sidebarCollapsed, true)}
                                {!sidebarCollapsed && 'Cerrar sesión'}
                            </button>
                        ) : (
                            !sidebarCollapsed && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <Link to="/login" style={{ ...btnOutline, textAlign: 'center', padding: '10px', fontSize: 13 }}>Ingresar</Link>
                                    <Link to="/register" style={{ ...btnGradient, textAlign: 'center', padding: '10px', fontSize: 13 }}>Registrarme</Link>
                                </div>
                            )
                        )}
                    </div>
                </aside>
            </>
        )
    }

    // ══════════════════════════════════════════
    // BROWSER / MOBILE — Navbar normal (sin cambios)
    // ══════════════════════════════════════════
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
            <style>{`
                @media (max-width: 480px) {
                    .vp-nav-main { padding: 0 16px !important; }
                    .vp-nav-logo { height: 48px !important; }
                }
                @media (max-width: 360px) {
                    .vp-nav-main { padding: 0 12px !important; }
                    .vp-nav-logo { height: 42px !important; }
                }
            `}</style>

            <nav className="vp-nav-main" style={{
                background: '#0a1520',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                padding: '0 28px', height: 68,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'sticky', top: 0, zIndex: 200,
                backdropFilter: 'blur(12px)',
            }}>
                <Link to="/inicio-vetpaw" style={{ display: 'flex', alignItems: 'center' }}>
                    <img src="/logo_vetpaw.png" alt="VetPaw" className="vp-nav-logo" style={{ height: 58, width: 'auto' }} />
                </Link>

                {!isMobile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {!user ? (
                            <>
                                <Link to="/comunidad" style={browserLinkStyle('/comunidad', G1)} {...browserLinkEvents('/comunidad', G1)}>Comunidad</Link>
                                <Link to="/explorar" style={browserLinkStyle('/explorar', O1)} {...browserLinkEvents('/explorar', O1)}>Explorar</Link>
                                <Link to="/adopciones" style={browserLinkStyle('/adopciones', G1)} {...browserLinkEvents('/adopciones', G1)}>Adopciones</Link>
                                <Link to="/clinics" style={browserLinkStyle('/clinics', G1)} {...browserLinkEvents('/clinics', G1)}>Veterinarias</Link>
                                <Link to="/mascotas-perdidas" style={browserLinkStyle('/mascotas-perdidas', O1)} {...browserLinkEvents('/mascotas-perdidas', O1)}>Mascotas perdidas</Link>
                                <InstallPWA />
                                <Link to="/login" style={{ ...btnOutline, marginLeft: 8, fontFamily: BROWSER_FONT, fontWeight: 800 }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = G1; e.currentTarget.style.color = G1; e.currentTarget.style.background = 'rgba(76,175,80,0.08)' }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'transparent' }}>
                                    Ingresar
                                </Link>
                                <Link to="/register" style={{ ...btnGradient, marginLeft: 6, fontFamily: BROWSER_FONT, fontWeight: 900 }}>Registrarme</Link>
                            </>
                        ) : user.role !== 'owner' ? (
                            <>
                                <Link to="/comunidad" style={browserLinkStyle('/comunidad', O1)} {...browserLinkEvents('/comunidad', O1)}>Comunidad</Link>
                                <Link to="/explorar" style={browserLinkStyle('/explorar', G1)} {...browserLinkEvents('/explorar', G1)}>Explorar</Link>
                                <Link to="/adopciones" style={browserLinkStyle('/adopciones', O1)} {...browserLinkEvents('/adopciones', O1)}>Adopciones</Link>
                                <Link to={rolePanelPath[user.role]} style={browserLinkStyle(rolePanelPath[user.role], G1)} {...browserLinkEvents(rolePanelPath[user.role], G1)}>Mi panel</Link>
                                <Link to="/messages" style={{ ...browserLinkStyle('/messages', O1), display: 'inline-flex', alignItems: 'center', gap: 6 }} {...browserLinkEvents('/messages', O1)}>
                                    Mensajes
                                    {unreadMessages > 0 && (
                                        <span style={{ background: G1, color: '#07131d', fontSize: 10, fontWeight: 900, minWidth: 17, height: 17, padding: '0 5px', borderRadius: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {unreadMessages}
                                        </span>
                                    )}
                                </Link>
                                <Link to="/profile" style={browserLinkStyle('/profile', G1)} {...browserLinkEvents('/profile', G1)}>Mi perfil</Link>
                                <Link to="/configuracion" style={browserLinkStyle('/configuracion', O1)} {...browserLinkEvents('/configuracion', O1)}>Configuración</Link>
                                <Link to="/notifications" style={{ ...browserLinkStyle('/notifications', G1), display: 'inline-flex', alignItems: 'center', gap: 5 }} {...browserLinkEvents('/notifications', G1)}>
                                    Notificaciones
                                    {notificationCount > 0 && (
                                        <span style={{ background: O1, color: '#07131d', fontSize: 10, fontWeight: 900, minWidth: 17, height: 17, padding: '0 5px', borderRadius: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {notificationCount}
                                        </span>
                                    )}
                                </Link>
                                <InstallPWA />
                                <span style={{ color: 'rgba(255,255,255,0.18)', margin: '0 3px' }}>|</span>
                                <span style={{ fontFamily: BROWSER_FONT, color: G1, fontWeight: 900, fontSize: 14, padding: '7px 6px' }}>{user.profile_name || user.first_name || user.username}</span>
                                <button onClick={handleLogout} style={{ fontFamily: BROWSER_FONT, fontSize: 14, fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer', color: '#ffc36a', padding: '7px 7px' }}
                                    onMouseEnter={e => e.currentTarget.style.color = O1}
                                    onMouseLeave={e => e.currentTarget.style.color = '#ffc36a'}>
                                    Salir
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/comunidad" style={browserLinkStyle('/comunidad', G1)} {...browserLinkEvents('/comunidad', G1)}>Comunidad</Link>
                                <Link to="/explorar" style={browserLinkStyle('/explorar', O1)} {...browserLinkEvents('/explorar', O1)}>Explorar</Link>
                                <Link to="/adopciones" style={browserLinkStyle('/adopciones', G1)} {...browserLinkEvents('/adopciones', G1)}>Adopciones</Link>
                                <Link to="/dashboard" style={browserLinkStyle('/dashboard', G1)} {...browserLinkEvents('/dashboard', G1)}>Mi panel</Link>
                                <Link to="/pets" style={browserLinkStyle('/pets', O1)} {...browserLinkEvents('/pets', O1)}>Mascotas</Link>
                                <Link to="/appointments" style={browserLinkStyle('/appointments', G1)} {...browserLinkEvents('/appointments', G1)}>Turnos</Link>
                                <Link to="/clinics" style={browserLinkStyle('/clinics', G1)} {...browserLinkEvents('/clinics', G1)}>Veterinarias</Link>
                                <Link to="/mascotas-perdidas" style={browserLinkStyle('/mascotas-perdidas', O1)} {...browserLinkEvents('/mascotas-perdidas', O1)}>Mascotas perdidas</Link>
                                <Link to="/messages" style={{ ...browserLinkStyle('/messages', G1), display: 'inline-flex', alignItems: 'center', gap: 5 }} {...browserLinkEvents('/messages', G1)}>
                                    Mensajes
                                    {unreadMessages > 0 && (
                                        <span style={{ background: O1, color: '#07131d', fontSize: 10, fontWeight: 900, minWidth: 17, height: 17, padding: '0 5px', borderRadius: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {unreadMessages}
                                        </span>
                                    )}
                                </Link>
                                <InstallPWA />
                                <div style={{ position: 'relative' }} ref={notifRef}>
                                    <button
                                        onClick={handleOpenNotif}
                                        style={{
                                            ...browserLinkStyle('/notifications', O1),
                                            position: 'relative',
                                            borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                                            cursor: 'pointer',
                                            display: 'inline-flex', alignItems: 'center', gap: 5,
                                        }}
                                        {...browserLinkEvents('/notifications', O1)}
                                    >
                                        Notificaciones
                                        {notificationCount > 0 && (
                                            <span style={{ background: G1, color: '#07131d', fontSize: 10, fontWeight: 900, minWidth: 17, height: 17, padding: '0 5px', borderRadius: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {notificationCount}
                                            </span>
                                        )}
                                    </button>
                                    {showNotif && (
                                        <div style={{ position: 'absolute', right: 0, top: 46, width: 300, background: '#0f1923', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, boxShadow: '0 16px 48px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 300 }}>
                                            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                                <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: BROWSER_FONT }}>Notificaciones</p>
                                            </div>
                                            {notifications.length === 0 ? (
                                                <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Todavía no hay actividad para mostrar</div>
                                            ) : (
                                                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                                                    {notifications.map(n => (
                                                        <button
                                                            key={n.notification_key || n.id}
                                                            onClick={() => handleNotificationClick(n)}
                                                            style={{
                                                                position: 'relative', width: '100%', padding: '12px 36px 12px 18px',
                                                                border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                                background: n.is_read ? 'transparent' : 'linear-gradient(90deg,rgba(76,175,80,.13),rgba(255,152,0,.04))',
                                                                textAlign: 'left', cursor: 'pointer',
                                                            }}
                                                        >
                                                            {!n.is_read && <span aria-label="Nueva" title="Nueva" style={{ position: 'absolute', top: 16, right: 16, width: 9, height: 9, borderRadius: '50%', background: G1, boxShadow: '0 0 0 5px rgba(76,175,80,.12)' }} />}
                                                            <p style={{ color: '#fff', fontSize: 14, fontWeight: 800, fontFamily: BROWSER_FONT }}>{statusLabel(n.status)}</p>
                                                            <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 3, lineHeight: 1.4 }}>{n.message}</p>
                                                            {n.meta && <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.meta}</p>}
                                                            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, marginTop: 3 }}>{notificationDate(n.requested_date)}</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                                <Link to="/notifications" onClick={() => setShowNotif(false)} style={{ color: G1, fontSize: 12, fontWeight: 800, textDecoration: 'none', fontFamily: BROWSER_FONT }}>Ver todas las notificaciones →</Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <span style={{ color: 'rgba(255,255,255,0.18)', margin: '0 3px' }}>|</span>
                                <Link to="/profile" style={{ fontFamily: BROWSER_FONT, color: G1, fontWeight: 900, fontSize: 14, padding: '7px 5px', textDecoration: 'none' }}>{user.profile_name || user.first_name || user.username}</Link>
                                <button onClick={handleLogout} style={{ fontFamily: BROWSER_FONT, fontSize: 14, fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer', color: '#ffc36a', padding: '7px 5px' }}
                                    onMouseEnter={e => e.currentTarget.style.color = O1}
                                    onMouseLeave={e => e.currentTarget.style.color = '#ffc36a'}>
                                    Salir
                                </button>
                            </>
                        )}
                    </div>
                )}

                {isMobile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {user && (
                            <Link to="/messages" style={{ position: 'relative', fontSize: 20, textDecoration: 'none', padding: '4px 6px' }}>
                                {renderNavIcon('messages', isActive('/messages'), true)}
                                {unreadMessages > 0 && (
                                    <span style={{ position: 'absolute', top: 0, right: 0, background: O1, color: '#fff', fontSize: 9, fontWeight: 800, width: 14, height: 14, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {unreadMessages}
                                    </span>
                                )}
                            </Link>
                        )}
                        {user && (
                            <button onClick={handleOpenNotif} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: '4px 6px' }}>
                                {renderNavIcon('notifications', showNotif || isActive('/notifications'), true)}
                                {notificationCount > 0 && (
                                    <span style={{ position: 'absolute', top: 0, right: 0, background: O1, color: '#fff', fontSize: 9, fontWeight: 800, width: 14, height: 14, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {notificationCount}
                                    </span>
                                )}
                            </button>
                        )}
                        <InstallPWA />
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            style={{
                                background: menuOpen ? 'rgba(76,175,80,0.12)' : 'rgba(255,255,255,0.06)',
                                border: `1.5px solid ${menuOpen ? 'rgba(76,175,80,0.4)' : 'rgba(255,255,255,0.12)'}`,
                                borderRadius: 10, cursor: 'pointer',
                                width: 42, height: 42,
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', gap: 5,
                                padding: 0, transition: 'all 0.2s',
                            }}
                            aria-label="Menú"
                        >
                            {menuOpen ? (
                                <span style={{ color: '#fff', fontSize: 18, lineHeight: 1 }}>✕</span>
                            ) : (
                                <>
                                    <span style={{ display: 'block', width: 18, height: 2, background: 'rgba(255,255,255,0.8)', borderRadius: 2 }} />
                                    <span style={{ display: 'block', width: 14, height: 2, background: 'rgba(255,255,255,0.5)', borderRadius: 2 }} />
                                    <span style={{ display: 'block', width: 18, height: 2, background: 'rgba(255,255,255,0.8)', borderRadius: 2 }} />
                                </>
                            )}
                        </button>
                    </div>
                )}
            </nav>

            {isMobile && (
                <>
                    {menuOpen && (
                        <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 250, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }} />
                    )}
                    <div style={{
                        position: 'fixed', top: 0, right: 0, bottom: 0,
                        width: 280, zIndex: 260,
                        background: '#0a1520',
                        borderLeft: '1px solid rgba(255,255,255,0.08)',
                        transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
                        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                        display: 'flex', flexDirection: 'column',
                        boxShadow: menuOpen ? '-8px 0 40px rgba(0,0,0,0.5)' : 'none',
                        overflowY: 'auto',
                    }}>
                        <div style={{ height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                            {user ? (
                                <div>
                                    <p style={{ color: G1, fontFamily: FONT, fontWeight: 800, fontSize: 15 }}>{user.profile_name || user.first_name || user.username}</p>
                                    <p style={{ color: 'rgba(255,255,255,0.35)', fontFamily: FONT, fontSize: 12, marginTop: 2 }}>{roleLabel[user.role] || 'Usuario'}</p>
                                </div>
                            ) : (
                                <img src="/logo_vetpaw.png" alt="VetPaw" style={{ height: 44 }} />
                            )}
                            <button onClick={() => setMenuOpen(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.6)', width: 34, height: 34, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        </div>
                        <div style={{ padding: '8px 20px', flex: 1 }}>
                            {drawerLinks.map(({ to, icon, label, badge }) => (
                                <Link key={to} to={to} style={drawerLink} onClick={() => setMenuOpen(false)}>
                                    {icon && <span style={{ marginRight: 12, display: 'inline-flex' }}>{renderNavIcon(icon, isActive(to), true)}</span>}
                                    <span style={{ flex: 1 }}>{label}</span>
                                    {badge > 0 && (
                                        <span style={{ background: O1, color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 10, padding: '2px 7px' }}>{badge}</span>
                                    )}
                                </Link>
                            ))}
                        </div>
                        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                            {user ? (
                                <button onClick={handleLogout} style={{ width: '100%', padding: '13px', borderRadius: 12, background: 'rgba(255,107,107,0.10)', border: '1px solid rgba(255,107,107,0.25)', color: '#ff6b6b', fontFamily: FONT, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                                    Cerrar sesión
                                </button>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <Link to="/login" onClick={() => setMenuOpen(false)} style={{ ...btnOutline, display: 'block', textAlign: 'center', padding: '13px' }}>Ingresar</Link>
                                    <Link to="/register" onClick={() => setMenuOpen(false)} style={{ ...btnGradient, display: 'block', textAlign: 'center', padding: '13px' }}>Registrarme</Link>
                                </div>
                            )}
                        </div>
                    </div>
                    {user && showNotif && (
                        <div ref={notifRef} style={{ position: 'fixed', top: 72, right: 16, width: 'calc(100vw - 32px)', maxWidth: 340, background: '#0f1923', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, boxShadow: '0 16px 48px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 300 }}>
                            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: FONT }}>Notificaciones</p>
                            </div>
                            {notifications.length === 0 ? (
                                <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Todavía no hay actividad para mostrar</div>
                            ) : (
                                <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                                    {notifications.map(n => (
                                        <button
                                            key={n.notification_key || n.id}
                                            onClick={() => handleNotificationClick(n)}
                                            style={{
                                                position: 'relative', width: '100%', padding: '12px 36px 12px 18px',
                                                border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                background: n.is_read ? 'transparent' : 'linear-gradient(90deg,rgba(76,175,80,.13),rgba(255,152,0,.04))',
                                                textAlign: 'left', cursor: 'pointer',
                                            }}
                                        >
                                            {!n.is_read && <span aria-label="Nueva" title="Nueva" style={{ position: 'absolute', top: 16, right: 16, width: 9, height: 9, borderRadius: '50%', background: G1, boxShadow: '0 0 0 5px rgba(76,175,80,.12)' }} />}
                                            <p style={{ color: '#fff', fontSize: 14, fontWeight: 800, fontFamily: FONT }}>{statusLabel(n.status)}</p>
                                            <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 3, lineHeight: 1.4 }}>{n.message}</p>
                                            {n.meta && <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.meta}</p>}
                                            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, marginTop: 3 }}>{notificationDate(n.requested_date)}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <Link to="/notifications" onClick={() => setShowNotif(false)} style={{ color: G1, fontSize: 12, fontWeight: 700, textDecoration: 'none', fontFamily: FONT }}>Ver todas las notificaciones →</Link>
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    )
}