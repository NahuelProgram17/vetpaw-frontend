import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAppointments, markNotificationsSeen, getUnreadCount } from '../services/api'

const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif"
const G1 = '#4CAF50'
const O1 = '#FF9800'

export default function Navbar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [notifications, setNotifications] = useState([])
    const [unreadMessages, setUnreadMessages] = useState(0)
    const [showNotif, setShowNotif] = useState(false)
    const notifRef = useRef(null)

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

    const handleLogout = () => { logout(); navigate('/') }

    const statusLabel = (s) => {
        if (s === 'confirmed') return '✅ Confirmado'
        if (s === 'cancelled') return '❌ Cancelado'
        return s
    }

    // Estilos reutilizables
    const linkStyle = {
        fontFamily: FONT, fontSize: 15, fontWeight: 600,
        color: 'rgba(255,255,255,0.65)', padding: '6px 10px',
        textDecoration: 'none', borderRadius: 8, transition: 'color .15s, background .15s',
        letterSpacing: 0.2,
    }
    const linkHover = (e) => {
        e.currentTarget.style.color = '#4CAF50'
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

    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
            <nav style={{
                background: '#0a1520',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                padding: '0 28px', height: 68,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'sticky', top: 0, zIndex: 50,
                backdropFilter: 'blur(12px)',
            }}>
                {/* Logo */}
                <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
                    <img src="/logo_vetpaw.png" alt="VetPaw" style={{ height: 58, width: 'auto' }} />
                </Link>

                {/* Links */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {!user ? (
                        <>
                            <Link to="/clinics" style={linkStyle}
                                onMouseEnter={linkHover} onMouseLeave={linkLeave}>Veterinarias</Link>
                            <Link to="/login" style={{ ...btnOutline, marginLeft: 8 }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'transparent' }}>
                                Ingresar
                            </Link>
                            <Link to="/register" style={{ ...btnGradient, marginLeft: 6 }}>
                                Registrarme
                            </Link>
                        </>
                    ) : user.role === 'clinic' ? (
                        <>
                            <Link to="/clinic/dashboard" style={linkStyle} onMouseEnter={linkHover} onMouseLeave={linkLeave}>Mi panel</Link>
                            <Link to="/messages" style={{ ...linkStyle, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                                onMouseEnter={linkHover} onMouseLeave={linkLeave}>
                                💬 Mensajes
                                {unreadMessages > 0 && (
                                    <span style={{ background: O1, color: '#fff', fontSize: 10, fontWeight: 800, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {unreadMessages}
                                    </span>
                                )}
                            </Link>
                            <Link to="/profile" style={linkStyle} onMouseEnter={linkHover} onMouseLeave={linkLeave}>Mi perfil</Link>
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

                            {/* Mensajes */}
                            <Link to="/messages" style={{ ...linkStyle, position: 'relative', display: 'inline-flex', alignItems: 'center' }}
                                onMouseEnter={linkHover} onMouseLeave={linkLeave}>
                                💬
                                {unreadMessages > 0 && (
                                    <span style={{ position: 'absolute', top: 2, right: 2, background: O1, color: '#fff', fontSize: 9, fontWeight: 800, width: 15, height: 15, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {unreadMessages}
                                    </span>
                                )}
                            </Link>

                            <Link to="/profile" style={linkStyle} onMouseEnter={linkHover} onMouseLeave={linkLeave}>Mi perfil</Link>

                            {/* Notificaciones */}
                            <div style={{ position: 'relative' }} ref={notifRef}>
                                <button onClick={handleOpenNotif} style={{
                                    position: 'relative', background: 'none', border: 'none',
                                    cursor: 'pointer', padding: '6px 8px', fontSize: 16,
                                }}>
                                    🔔
                                    {notifications.length > 0 && (
                                        <span style={{
                                            position: 'absolute', top: 2, right: 2,
                                            background: O1, color: '#fff', fontSize: 9, fontWeight: 800,
                                            width: 15, height: 15, borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {notifications.length}
                                        </span>
                                    )}
                                </button>

                                {showNotif && (
                                    <div style={{
                                        position: 'absolute', right: 0, top: 46, width: 300,
                                        background: '#0f1923', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 18, boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                                        overflow: 'hidden', zIndex: 50,
                                    }}>
                                        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                            <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: FONT }}>Notificaciones</p>
                                        </div>
                                        {notifications.length === 0 ? (
                                            <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
                                                No tenés notificaciones nuevas
                                            </div>
                                        ) : (
                                            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                                                {notifications.map((n) => (
                                                    <div key={n.id} style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                        <p style={{ color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: FONT }}>
                                                            {statusLabel(n.status)} — {n.reason || 'Turno'}
                                                        </p>
                                                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 3 }}>
                                                            🐾 {n.pet_name} · 🏥 {n.clinic_name}
                                                        </p>
                                                        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 2 }}>
                                                            {new Date(n.requested_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                            <Link to="/appointments" onClick={() => setShowNotif(false)}
                                                style={{ color: G1, fontSize: 12, fontWeight: 700, textDecoration: 'none', fontFamily: FONT }}>
                                                Ver todos los turnos →
                                            </Link>
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
            </nav>
        </>
    )
}
