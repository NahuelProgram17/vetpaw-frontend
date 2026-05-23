import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAppointments, markNotificationsSeen, getUnreadCount } from '../services/api'
import InstallPWA from './InstallPWA'

const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif"
const G1 = '#4CAF50'
const O1 = '#FF9800'

export default function Navbar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [notifications, setNotifications] = useState([])
    const [unreadMessages, setUnreadMessages] = useState(0)
    const [showNotif, setShowNotif] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const notifRef = useRef(null)

    // Detectar mobile
    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [])

    // Cerrar menú al cambiar de ruta
    useEffect(() => {
        setMenuOpen(false)
        setShowNotif(false)
    }, [location.pathname])

    useEffect(() => {
        if (user?.role === 'owner') {
            fetchNotifications()
            fetchUnreadMessages()
            const interval = setInterval(fetchUnreadMessages, 30000)
            return () => clearInterval(interval)
        }
        if (user?.role === 'clinic') {
            fetchUnreadMessages()
            const interval = setInterval(fetchUnreadMessages, 30000)
            return () => clearInterval(interval)
        }
    }, [user])

    useEffect(() => {
        const handler = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Bloquear scroll del body cuando el drawer está abierto
    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [menuOpen])

    const fetchNotifications = async () => {
        try {
            const data = await getAppointments()
            const appts = data.results ?? data
            setNotifications(appts.filter(a => a.seen_by_owner === false))
        } catch (e) { console.error(e) }
    }

    const fetchUnreadMessages = async () => {
        try {
            const data = await getUnreadCount()
            setUnreadMessages(data.unread || 0)
        } catch (e) { console.error(e) }
    }

    const handleOpenNotif = async () => {
        setShowNotif(!showNotif)
        if (!showNotif && notifications.length > 0) {
            try { await markNotificationsSeen(); setNotifications([]) }
            catch (e) { console.error(e) }
        }
    }

    const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false) }

    const statusLabel = (s) => {
        if (s === 'confirmed') return '✅ Confirmado'
        if (s === 'cancelled') return '❌ Cancelado'
        return s
    }

    // ── Estilos ──
    const linkStyle = {
        fontFamily: FONT, fontSize: 15, fontWeight: 600,
        color: 'rgba(255,255,255,0.65)', padding: '6px 10px',
        textDecoration: 'none', borderRadius: 8,
        transition: 'color .15s, background .15s', letterSpacing: 0.2,
    }
    const linkHover = (e) => {
        e.currentTarget.style.color = G1
        e.currentTarget.style.background = 'rgba(76,175,80,0.08)'
    }
    const linkLeave = (e) => {
        e.currentTarget.style.color = 'rgba(255,255,255,0.65)'
        e.currentTarget.style.background = 'transparent'
    }
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

    // Link del drawer (mobile) — más grande para tocar fácil
    const drawerLink = {
        fontFamily: FONT, fontSize: 17, fontWeight: 700,
        color: 'rgba(255,255,255,0.8)', padding: '14px 0',
        textDecoration: 'none', display: 'flex', alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        transition: 'color .15s',
    }

    // Links del owner para el drawer
    const ownerLinks = [
        { to: '/dashboard', label: 'Mi panel' },
        { to: '/pets',      label: '🐾 Mascotas' },
        { to: '/appointments', label: '📅 Turnos' },
        { to: '/history',   label: '📋 Historial' },
        { to: '/clinics',   label: '🏥 Veterinarias' },
        { to: '/messages',  label: '💬 Mensajes', badge: unreadMessages },
        { to: '/profile',   label: 'Mi perfil' },
    ]

    const clinicLinks = [
        { to: '/clinic/dashboard', label: 'Mi panel' },
        { to: '/messages', label: '💬 Mensajes', badge: unreadMessages },
        { to: '/profile',  label: 'Mi perfil' },
    ]

    const guestLinks = [
        { to: '/clinics', label: 'Veterinarias' },
    ]

    const drawerLinks = !user ? guestLinks : user.role === 'clinic' ? clinicLinks : ownerLinks

    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

            <nav style={{
                background: '#0a1520',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                padding: '0 28px', height: 68,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'sticky', top: 0, zIndex: 200,
                backdropFilter: 'blur(12px)',
            }}>
                {/* Logo */}
                <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
                    <img src="/logo_vetpaw.png" alt="VetPaw" style={{ height: 58, width: 'auto' }} />
                </Link>

                {/* ── DESKTOP: links completos ── */}
                {!isMobile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {!user ? (
                            <>
                                <Link to="/clinics" style={linkStyle} onMouseEnter={linkHover} onMouseLeave={linkLeave}>Veterinarias</Link>
                                <InstallPWA />   {/* ← ACÁ */}
                                <Link to="/login" style={{ ...btnOutline, marginLeft: 8 }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'transparent' }}>
                                    Ingresar
                                </Link>
                                <Link to="/register" style={{ ...btnGradient, marginLeft: 6 }}>Registrarme</Link>
                            </>
                        ) : user.role === 'clinic' ? (
                            <>
                                <Link to="/clinic/dashboard" style={linkStyle} onMouseEnter={linkHover} onMouseLeave={linkLeave}>Mi panel</Link>
                                <Link to="/messages" style={{ ...linkStyle, display: 'inline-flex', alignItems: 'center', gap: 5 }} onMouseEnter={linkHover} onMouseLeave={linkLeave}>
                                    💬 Mensajes
                                    {unreadMessages > 0 && (
                                        <span style={{ background: O1, color: '#fff', fontSize: 10, fontWeight: 800, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {unreadMessages}
                                        </span>
                                    )}
                                </Link>
                                <Link to="/profile" style={linkStyle} onMouseEnter={linkHover} onMouseLeave={linkLeave}>Mi perfil</Link>
                                <InstallPWA />   {/* ← ACÁ */}
                                <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 4px' }}>|</span>
                                <span style={{ ...linkStyle, color: G1, fontWeight: 700 }}>{user.first_name || user.username}</span>
                                <button onClick={handleLogout} style={{ ...linkStyle, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
                                    Salir
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/dashboard" style={linkStyle} onMouseEnter={linkHover} onMouseLeave={linkLeave}>Mi panel</Link>
                                <Link to="/pets" style={linkStyle} onMouseEnter={linkHover} onMouseLeave={linkLeave}>Mascotas</Link>
                                <Link to="/appointments" style={linkStyle} onMouseEnter={linkHover} onMouseLeave={linkLeave}>Turnos</Link>
                                <Link to="/history" style={linkStyle} onMouseEnter={linkHover} onMouseLeave={linkLeave}>Historial</Link>
                                <Link to="/clinics" style={linkStyle} onMouseEnter={linkHover} onMouseLeave={linkLeave}>Veterinarias</Link>

                                <Link to="/messages" style={{ ...linkStyle, position: 'relative', display: 'inline-flex', alignItems: 'center' }} onMouseEnter={linkHover} onMouseLeave={linkLeave}>
                                    💬
                                    {unreadMessages > 0 && (
                                        <span style={{ position: 'absolute', top: 2, right: 2, background: O1, color: '#fff', fontSize: 9, fontWeight: 800, width: 15, height: 15, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {unreadMessages}
                                        </span>
                                    )}
                                </Link>

                                <Link to="/profile" style={linkStyle} onMouseEnter={linkHover} onMouseLeave={linkLeave}>Mi perfil</Link>
                                <InstallPWA />   {/* ← AGREGÁ ACÁ */}

                                {/* Notificaciones */}
                                <div style={{ position: 'relative' }} ref={notifRef}>
                                    <button onClick={handleOpenNotif} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', fontSize: 16 }}>
                                        🔔
                                        {notifications.length > 0 && (
                                            <span style={{ position: 'absolute', top: 2, right: 2, background: O1, color: '#fff', fontSize: 9, fontWeight: 800, width: 15, height: 15, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {notifications.length}
                                            </span>
                                        )}
                                    </button>
                                    {showNotif && (
                                        <div style={{ position: 'absolute', right: 0, top: 46, width: 300, background: '#0f1923', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, boxShadow: '0 16px 48px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 300 }}>
                                            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                                <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: FONT }}>Notificaciones</p>
                                            </div>
                                            {notifications.length === 0 ? (
                                                <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>No tenés notificaciones nuevas</div>
                                            ) : (
                                                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                                                    {notifications.map(n => (
                                                        <div key={n.id} style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                            <p style={{ color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: FONT }}>{statusLabel(n.status)} — {n.reason || 'Turno'}</p>
                                                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 3 }}>🐾 {n.pet_name} · 🏥 {n.clinic_name}</p>
                                                            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 2 }}>{new Date(n.requested_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                                <Link to="/appointments" onClick={() => setShowNotif(false)} style={{ color: G1, fontSize: 12, fontWeight: 700, textDecoration: 'none', fontFamily: FONT }}>Ver todos los turnos →</Link>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 4px' }}>|</span>
                                <span style={{ ...linkStyle, color: G1, fontWeight: 700 }}>{user.first_name || user.username}</span>
                                <button onClick={handleLogout} style={{ ...linkStyle, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
                                    Salir
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* ── MOBILE: iconos rápidos + hamburger ── */}
                {isMobile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* Mensajes rápido */}
                        {user && (
                            <Link to="/messages" style={{ position: 'relative', fontSize: 20, textDecoration: 'none', padding: '4px 6px' }}>
                                💬
                                {unreadMessages > 0 && (
                                    <span style={{ position: 'absolute', top: 0, right: 0, background: O1, color: '#fff', fontSize: 9, fontWeight: 800, width: 14, height: 14, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {unreadMessages}
                                    </span>
                                )}
                            </Link>
                        )}
                        {/* Notif rápido (solo owner) */}
                        {user?.role === 'owner' && (
                            <button onClick={handleOpenNotif} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: '4px 6px' }}>
                                🔔
                                {notifications.length > 0 && (
                                    <span style={{ position: 'absolute', top: 0, right: 0, background: O1, color: '#fff', fontSize: 9, fontWeight: 800, width: 14, height: 14, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {notifications.length}
                                    </span>
                                )}
                            </button>
                        )}
                        {/* Hamburger */}
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

            {/* ── MOBILE: Overlay + Drawer ── */}
            {isMobile && (
                <>
                    {/* Overlay oscuro */}
                    {menuOpen && (
                        <div
                            onClick={() => setMenuOpen(false)}
                            style={{
                                position: 'fixed', inset: 0, zIndex: 150,
                                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
                            }}
                        />
                    )}

                    {/* Drawer lateral derecho */}
                    <div style={{
                        position: 'fixed', top: 0, right: 0, bottom: 0,
                        width: 280, zIndex: 160,
                        background: '#0a1520',
                        borderLeft: '1px solid rgba(255,255,255,0.08)',
                        transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
                        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                        display: 'flex', flexDirection: 'column',
                        boxShadow: menuOpen ? '-8px 0 40px rgba(0,0,0,0.5)' : 'none',
                        overflowY: 'auto',
                    }}>
                        {/* Header del drawer */}
                        <div style={{
                            height: 68, display: 'flex', alignItems: 'center',
                            justifyContent: 'space-between', padding: '0 20px',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            flexShrink: 0,
                        }}>
                            {user ? (
                                <div>
                                    <p style={{ color: G1, fontFamily: FONT, fontWeight: 800, fontSize: 15 }}>
                                        {user.first_name || user.username}
                                    </p>
                                    <p style={{ color: 'rgba(255,255,255,0.35)', fontFamily: FONT, fontSize: 12, marginTop: 2 }}>
                                        {user.role === 'clinic' ? '🏥 Clínica' : '🐾 Dueño/a'}
                                    </p>
                                </div>
                            ) : (
                                <img src="/logo_vetpaw.png" alt="VetPaw" style={{ height: 44 }} />
                            )}
                            <button
                                onClick={() => setMenuOpen(false)}
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.6)', width: 34, height: 34, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >✕</button>
                        </div>

                        {/* Links */}
                        <div style={{ padding: '8px 20px', flex: 1 }}>
                            {drawerLinks.map(({ to, label, badge }) => (
                                <Link
                                    key={to} to={to}
                                    style={drawerLink}
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <span style={{ flex: 1 }}>{label}</span>
                                    {badge > 0 && (
                                        <span style={{ background: O1, color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 10, padding: '2px 7px' }}>
                                            {badge}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>

                        {/* Footer del drawer */}
                        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                            {user ? (
                                <button
                                    onClick={handleLogout}
                                    style={{
                                        width: '100%', padding: '13px', borderRadius: 12,
                                        background: 'rgba(255,107,107,0.10)',
                                        border: '1px solid rgba(255,107,107,0.25)',
                                        color: '#ff6b6b', fontFamily: FONT, fontSize: 15,
                                        fontWeight: 700, cursor: 'pointer',
                                    }}
                                >
                                    Cerrar sesión
                                </button>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <Link to="/login" onClick={() => setMenuOpen(false)} style={{ ...btnOutline, display: 'block', textAlign: 'center', padding: '13px' }}>
                                        Ingresar
                                    </Link>
                                    <Link to="/register" onClick={() => setMenuOpen(false)} style={{ ...btnGradient, display: 'block', textAlign: 'center', padding: '13px' }}>
                                        Registrarme
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notif dropdown mobile (owner) */}
                    {user?.role === 'owner' && showNotif && (
                        <div ref={notifRef} style={{
                            position: 'fixed', top: 72, right: 16, width: 'calc(100vw - 32px)', maxWidth: 340,
                            background: '#0f1923', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 18, boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                            overflow: 'hidden', zIndex: 300,
                        }}>
                            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: FONT }}>Notificaciones</p>
                            </div>
                            {notifications.length === 0 ? (
                                <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>No tenés notificaciones nuevas</div>
                            ) : (
                                <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                                    {notifications.map(n => (
                                        <div key={n.id} style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <p style={{ color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: FONT }}>{statusLabel(n.status)} — {n.reason || 'Turno'}</p>
                                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 3 }}>🐾 {n.pet_name} · 🏥 {n.clinic_name}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <Link to="/appointments" onClick={() => setShowNotif(false)} style={{ color: G1, fontSize: 12, fontWeight: 700, textDecoration: 'none', fontFamily: FONT }}>Ver todos los turnos →</Link>
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    )
}
