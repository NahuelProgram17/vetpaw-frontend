import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAppointments, markNotificationsSeen, getUnreadCount } from '../services/api'

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
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotif(false)
            }
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
            try {
                await markNotificationsSeen()
                setNotifications([])
            } catch (e) { console.error(e) }
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    const statusLabel = (s) => {
        if (s === 'confirmed') return '✅ Confirmado'
        if (s === 'cancelled') return '❌ Cancelado'
        return s
    }

    return (
        <nav className="bg-[#1a1a2e] px-6 h-14 flex items-center justify-between sticky top-0 z-50 border-b border-white/5">
            <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#ff6b6b] rounded-lg flex items-center justify-center text-white font-bold text-sm">V</div>
                <span className="text-white font-medium text-lg">VetPaw</span>
            </Link>

            <div className="flex items-center gap-2">
                {!user ? (
                    <>
                        <Link to="/clinics" className="text-white/70 text-sm px-3 py-1.5 hover:text-white transition">Veterinarias</Link>
                        <Link to="/login" className="text-white text-sm border border-white/30 px-4 py-1.5 rounded-lg hover:bg-white/10 transition">Ingresar</Link>
                        <Link to="/register" className="bg-[#ff6b6b] text-white text-sm px-4 py-1.5 rounded-lg hover:bg-[#ff5252] transition">Registrarme</Link>
                    </>
                ) : user.role === 'clinic' ? (
                    <>
                        <Link to="/clinic/dashboard" className="text-white/70 text-sm px-3 py-1.5 hover:text-white transition">Mi panel</Link>
                        <Link to="/messages" className="relative text-white/70 text-sm px-3 py-1.5 hover:text-white transition inline-flex items-center gap-1">
                            💬 Mensajes
                            {unreadMessages > 0 && (
                                <span className="bg-[#ff6b6b] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                    {unreadMessages}
                                </span>
                            )}
                        </Link>
                        <Link to="/profile" className="text-white/70 text-sm px-3 py-1.5 hover:text-white transition">Mi perfil</Link>
                        <span className="text-white/50 text-sm">|</span>
                        <span className="text-white/70 text-sm">{user.first_name || user.username}</span>
                        <button onClick={handleLogout} className="text-white/50 text-sm px-3 py-1.5 hover:text-white transition">Salir</button>
                    </>
                ) : (
                    <>
                        <Link to="/dashboard" className="text-white/70 text-sm px-3 py-1.5 hover:text-white transition">Mi panel</Link>
                        <Link to="/pets" className="text-white/70 text-sm px-3 py-1.5 hover:text-white transition">Mascotas</Link>
                        <Link to="/appointments" className="text-white/70 text-sm px-3 py-1.5 hover:text-white transition">Turnos</Link>
                        <Link to="/history" className="text-white/70 text-sm px-3 py-1.5 hover:text-white transition">Historial</Link>
                        <Link to="/clinics" className="text-white/70 text-sm px-3 py-1.5 hover:text-white transition">Veterinarias</Link>
                        <Link to="/messages" className="relative text-white/70 text-sm px-3 py-1.5 hover:text-white transition inline-flex items-center gap-1">
                            💬
                            {unreadMessages > 0 && (
                                <span className="bg-[#ff6b6b] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                    {unreadMessages}
                                </span>
                            )}
                        </Link>
                        <Link to="/profile" className="text-white/70 text-sm px-3 py-1.5 hover:text-white transition">Mi perfil</Link>

                        {/* Notificaciones */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={handleOpenNotif}
                                className="relative text-white/70 hover:text-white transition px-2 py-1.5"
                            >
                                🔔
                                {notifications.length > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 bg-[#ff6b6b] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                        {notifications.length}
                                    </span>
                                )}
                            </button>

                            {showNotif && (
                                <div className="absolute right-0 top-10 w-80 bg-[#1e1e35] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                                    <div className="px-4 py-3 border-b border-white/08">
                                        <p className="text-white font-bold text-sm">Notificaciones</p>
                                    </div>
                                    {notifications.length === 0 ? (
                                        <div className="px-4 py-6 text-center text-white/40 text-sm">
                                            No tenés notificaciones nuevas
                                        </div>
                                    ) : (
                                        <div className="max-h-72 overflow-y-auto">
                                            {notifications.map((n) => (
                                                <div key={n.id} className="px-4 py-3 border-b border-white/05 hover:bg-white/04 transition">
                                                    <p className="text-white text-sm font-semibold">
                                                        {statusLabel(n.status)} — {n.reason || 'Turno'}
                                                    </p>
                                                    <p className="text-white/40 text-xs mt-0.5">
                                                        🐾 {n.pet_name} · 🏥 {n.clinic_name}
                                                    </p>
                                                    <p className="text-white/30 text-xs mt-0.5">
                                                        {new Date(n.requested_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="px-4 py-2 border-t border-white/08">
                                        <Link to="/appointments" onClick={() => setShowNotif(false)}
                                            className="text-[#ffd93d] text-xs font-bold hover:underline">
                                            Ver todos los turnos →
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        <span className="text-white/50 text-sm">|</span>
                        <span className="text-white/70 text-sm">{user.first_name || user.username}</span>
                        <button onClick={handleLogout} className="text-white/50 text-sm px-3 py-1.5 hover:text-white transition">Salir</button>
                    </>
                )}
            </div>
        </nav>
    )
}