import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    getAppointments,
    getBirthdayCelebrations,
    getCommunityNotifications,
    markAllBirthdayCelebrationsRead,
    markAllCommunityNotificationsRead,
    markCommunityNotificationRead,
    openBirthdayGift,
    markBirthdayCardDownloaded,
} from '../services/api'
import { downloadBirthdayCard, shareBirthdayCard } from '../utils/birthdayCard'
import ownerBg from '../assets/vetpaw-owner-bg.png'
import VetPawLoader from '../components/VetPawLoader'
import PushNotificationSettings from '../components/PushNotificationSettings'

const FONT = "'Plus Jakarta Sans','Nunito',sans-serif"

const formatDate = (value) => {
    if (!value) return ''
    const normalized = String(value).includes('T') ? value : `${value}T12:00:00`
    const date = new Date(normalized)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
}

const relativeTime = (value) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000))
    if (seconds < 60) return 'recién'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `hace ${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `hace ${hours} h`
    const days = Math.floor(hours / 24)
    if (days < 7) return `hace ${days} d`
    return formatDate(value)
}

const socialIcon = (type) => {
    if (type === 'reaction') return '🐾'
    if (type === 'comment') return '💬'
    if (type === 'follow') return '👥'
    return '🔔'
}

export default function Notifications() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [social, setSocial] = useState([])
    const [birthdays, setBirthdays] = useState([])
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [busyId, setBusyId] = useState(null)
    const [feedback, setFeedback] = useState('')

    const load = useCallback(async () => {
        setLoading(true)
        try {
            if (user?.role === 'owner') {
                const [socialData, birthdayData, appointmentData] = await Promise.all([
                    getCommunityNotifications({ page_size: 50 }),
                    getBirthdayCelebrations(),
                    getAppointments(),
                ])
                setSocial(Array.isArray(socialData) ? socialData : socialData.results || [])
                setBirthdays(Array.isArray(birthdayData) ? birthdayData : birthdayData.results || [])
                const allAppointments = appointmentData.results ?? appointmentData
                setAppointments(Array.isArray(allAppointments) ? allAppointments.slice(0, 8) : [])
            } else {
                const socialData = await getCommunityNotifications({ page_size: 50 })
                setSocial(Array.isArray(socialData) ? socialData : socialData.results || [])
                setBirthdays([])
                setAppointments([])
            }
        } catch (error) {
            console.error(error)
            setFeedback('No pudimos cargar todas las notificaciones. Probá nuevamente.')
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        load()
    }, [load])

    const refreshNavbar = () => {
        window.dispatchEvent(new CustomEvent('vetpaw:notifications-updated'))
    }

    const updateCelebration = (updated) => {
        setBirthdays((items) => items.map((item) => item.id === updated.id ? updated : item))
        window.dispatchEvent(new CustomEvent('vetpaw:birthday-updated'))
    }

    const handleSocialOpen = async (notification) => {
        setBusyId(`social-${notification.id}`)
        try {
            if (!notification.is_read) {
                const updated = await markCommunityNotificationRead(notification.id)
                setSocial((items) => items.map((item) => item.id === updated.id ? updated : item))
                refreshNavbar()
            }
            navigate(notification.target_url || '/comunidad')
        } finally {
            setBusyId(null)
        }
    }

    const markAllSocialRead = async () => {
        setFeedback('')
        try {
            await markAllCommunityNotificationsRead()
            setSocial((items) => items.map((item) => ({ ...item, is_read: true })))
            refreshNavbar()
        } catch {
            setFeedback('No pudimos marcar la actividad como leída.')
        }
    }

    const handleOpen = async (celebration) => {
        setBusyId(`birthday-${celebration.id}`)
        setFeedback('')
        try {
            updateCelebration(await openBirthdayGift(celebration.id))
        } catch {
            setFeedback('No pudimos abrir el regalo. Probá nuevamente.')
        } finally {
            setBusyId(null)
        }
    }

    const handleDownload = async (celebration) => {
        setBusyId(`birthday-${celebration.id}`)
        setFeedback('Preparando la tarjeta…')
        try {
            await downloadBirthdayCard(celebration)
            await markBirthdayCardDownloaded(celebration.id).catch(() => {})
            setFeedback(`¡La tarjeta de ${celebration.pet_name} ya está lista!`)
        } catch {
            setFeedback('No pudimos generar la tarjeta.')
        } finally {
            setBusyId(null)
        }
    }

    const handleShare = async (celebration) => {
        setBusyId(`birthday-${celebration.id}`)
        setFeedback('Preparando el recuerdo…')
        try {
            await shareBirthdayCard(celebration)
            await markBirthdayCardDownloaded(celebration.id).catch(() => {})
            setFeedback('¡Recuerdo preparado para compartir!')
        } catch (error) {
            if (error?.name !== 'AbortError') setFeedback('No pudimos compartirlo. Probá descargando la tarjeta.')
        } finally {
            setBusyId(null)
        }
    }

    const markAllBirthdaysRead = async () => {
        await markAllBirthdayCelebrationsRead()
        setBirthdays((items) => items.map((item) => ({ ...item, is_read: true })))
        window.dispatchEvent(new CustomEvent('vetpaw:birthday-updated'))
    }

    const unreadSocial = social.filter((item) => !item.is_read).length

    return (
        <main className="notifications-page">
            <div className="notifications-inner">
                <header className="notifications-header">
                    <div>
                        <span className="notifications-kicker">🔔 Tu centro VetPaw</span>
                        <h1>Notificaciones y recuerdos</h1>
                        <p>Patitas, comentarios, nuevos seguidores y las novedades importantes de VetPaw quedan reunidas acá.</p>
                    </div>
                </header>

                <PushNotificationSettings />

                {loading ? (
                    <VetPawLoader message="Cargando notificaciones..." subText="Buscando la actividad más reciente" fullScreen={false} />
                ) : (
                    <>
                        <section className="notification-section social-section">
                            <div className="section-heading">
                                <div><span>🐾</span><div><h2>Actividad de la comunidad</h2><p>Interacciones con tus mascotas y publicaciones.</p></div></div>
                                <div className="heading-actions">
                                    <b>{unreadSocial} nuevas</b>
                                    {unreadSocial > 0 && <button className="mark-read-button small" onClick={markAllSocialRead}>✓ Marcar todas como leídas</button>}
                                </div>
                            </div>

                            {social.length === 0 ? (
                                <div className="empty-notifications">
                                    <span>🐾</span>
                                    <h3>Todavía no hay actividad social</h3>
                                    <p>Cuando alguien deje una patita, comente una publicación o siga una mascota, lo vas a encontrar acá.</p>
                                </div>
                            ) : (
                                <div className="social-list">
                                    {social.map((notification) => (
                                        <button
                                            type="button"
                                            key={notification.id}
                                            className={`social-notification ${notification.is_read ? '' : 'unread'}`}
                                            onClick={() => handleSocialOpen(notification)}
                                            disabled={busyId === `social-${notification.id}`}
                                        >
                                            <div className="social-avatar-wrap">
                                                {notification.actor?.avatar
                                                    ? <img src={notification.actor.avatar} alt="" />
                                                    : <span>{socialIcon(notification.notification_type)}</span>}
                                                <i>{socialIcon(notification.notification_type)}</i>
                                            </div>
                                            <div className="social-copy">
                                                <strong>{notification.message}</strong>
                                                {notification.extra_text && <p>“{notification.extra_text}”</p>}
                                                <time>{relativeTime(notification.created_at)}</time>
                                            </div>
                                            {!notification.is_read && <span className="social-new-dot" title="Sin leer" />}
                                            <span className="social-arrow">›</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </section>

                        {user?.role === 'owner' && (
                            <>
                                <section className="notification-section">
                                    <div className="section-heading">
                                        <div><span>🎂</span><div><h2>Cumpleaños VetPaw</h2><p>Insignias coleccionables y tarjetas para compartir.</p></div></div>
                                        <div className="heading-actions">
                                            <b>{birthdays.length}</b>
                                            {birthdays.some((item) => !item.is_read) && (
                                                <button className="mark-read-button small" onClick={markAllBirthdaysRead}>✓ Marcar como leídos</button>
                                            )}
                                        </div>
                                    </div>

                                    {birthdays.length === 0 ? (
                                        <div className="empty-notifications">
                                            <span>🎁</span>
                                            <h3>Todavía no hay recuerdos de cumpleaños</h3>
                                            <p>Cuando llegue el cumpleaños de una mascota con fecha de nacimiento cargada, VetPaw va a preparar una sorpresa automáticamente.</p>
                                        </div>
                                    ) : (
                                        <div className="birthday-grid">
                                            {birthdays.map((celebration) => (
                                                <article key={celebration.id} className={`birthday-memory ${!celebration.is_read ? 'unread' : ''}`}>
                                                    {!celebration.is_read && <span className="new-dot">NUEVO</span>}
                                                    <div className="memory-photo-wrap">
                                                        {celebration.pet_photo ? <img src={celebration.pet_photo} alt={celebration.pet_name} /> : <div>🐾</div>}
                                                        <span className="memory-badge-emoji">{celebration.badge?.emoji || '🎖️'}</span>
                                                    </div>
                                                    <div className="memory-content">
                                                        <p className="memory-date">{formatDate(celebration.birthday_date)}</p>
                                                        <h3>{celebration.pet_name} · {celebration.age} año{celebration.age === 1 ? '' : 's'}</h3>
                                                        <strong>{celebration.badge?.name}</strong>
                                                        <p>{celebration.message}</p>
                                                        {celebration.is_opened && (
                                                            <div className="memory-coupon"><b>🎟️ Vale de cumpleaños</b><span>{celebration.gift_text}</span></div>
                                                        )}
                                                        <div className="memory-actions">
                                                            {!celebration.is_opened ? (
                                                                <button className="primary" onClick={() => handleOpen(celebration)} disabled={busyId === `birthday-${celebration.id}`}>🎁 Abrir regalo</button>
                                                            ) : (
                                                                <>
                                                                    <button onClick={() => handleShare(celebration)} disabled={busyId === `birthday-${celebration.id}`}>📲 Compartir</button>
                                                                    <button onClick={() => handleDownload(celebration)} disabled={busyId === `birthday-${celebration.id}`}>🖼️ Descargar</button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </article>
                                            ))}
                                        </div>
                                    )}
                                </section>

                                <section className="notification-section">
                                    <div className="section-heading">
                                        <div><span>📅</span><div><h2>Turnos recientes</h2><p>Últimos movimientos de tus solicitudes.</p></div></div>
                                    </div>
                                    {appointments.length === 0 ? (
                                        <div className="empty-compact">No hay movimientos de turnos para mostrar.</div>
                                    ) : (
                                        <div className="appointment-list">
                                            {appointments.map((appointment) => (
                                                <article key={appointment.id}>
                                                    <span className={`appointment-status ${appointment.status}`}>{appointment.status === 'confirmed' ? '✅ Confirmado' : appointment.status === 'cancelled' ? '❌ Cancelado' : '🕓 Pendiente'}</span>
                                                    <div><h3>{appointment.reason || 'Consulta veterinaria'}</h3><p>🐾 {appointment.pet_name} · 🏥 {appointment.clinic_name}</p></div>
                                                    <time>{formatDate(appointment.requested_date)}</time>
                                                </article>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            </>
                        )}

                        {feedback && <p className="notifications-feedback global">{feedback}</p>}
                    </>
                )}
            </div>

            <style>{`
                .notifications-page { min-height: 100vh; padding: 105px 24px 65px; color: #fff; font-family: ${FONT}; background: linear-gradient(rgba(3,12,25,.82),rgba(3,12,25,.88)), url(${ownerBg}) center/cover fixed; }
                .notifications-inner { max-width: 1220px; margin: 0 auto; }
                .notifications-header { display: flex; justify-content: space-between; align-items: end; gap: 25px; margin-bottom: 26px; }
                .notifications-kicker { display: inline-flex; padding: 7px 12px; border-radius: 999px; color: #8fe39a; border: 1px solid rgba(76,175,80,.3); background: rgba(76,175,80,.08); font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .7px; }
                .notifications-header h1 { margin: 10px 0 5px; font-family: 'Baloo 2','Nunito',sans-serif; font-size: clamp(34px,5vw,56px); line-height: 1; }
                .notifications-header p { color: rgba(255,255,255,.55); max-width: 760px; line-height: 1.55; }
                .mark-read-button { border: 1px solid rgba(255,255,255,.13); background: rgba(255,255,255,.06); color: #fff; border-radius: 12px; padding: 11px 15px; font-weight: 800; cursor: pointer; }
                .mark-read-button.small { padding: 8px 11px; font-size: 11px; }
                .notification-section { background: rgba(18,33,49,.9); border: 1px solid rgba(255,255,255,.08); border-radius: 24px; padding: 22px; margin-top: 18px; box-shadow: 0 22px 70px rgba(0,0,0,.24); }
                .social-section { border-color: rgba(76,175,80,.18); }
                .section-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 18px; border-bottom: 1px solid rgba(255,255,255,.07); }
                .section-heading > div:first-child { display: flex; align-items: center; gap: 13px; }
                .section-heading > div:first-child > span { width: 46px; height: 46px; display: grid; place-items: center; border-radius: 14px; background: rgba(255,152,0,.12); font-size: 23px; }
                .section-heading h2 { font-size: 20px; }
                .section-heading p { color: rgba(255,255,255,.42); font-size: 13px; margin-top: 3px; }
                .heading-actions { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; justify-content: flex-end; }
                .heading-actions > b { background: rgba(76,175,80,.14); color: #8fe39a; padding: 5px 10px; border-radius: 999px; font-size: 12px; }
                .social-list { display: grid; gap: 9px; margin-top: 16px; }
                .social-notification { width: 100%; display: grid; grid-template-columns: 54px 1fr auto auto; align-items: center; gap: 13px; padding: 13px 14px; text-align: left; color: #fff; border: 1px solid rgba(255,255,255,.06); border-radius: 15px; background: rgba(255,255,255,.035); cursor: pointer; transition: transform .16s, background .16s, border-color .16s; }
                .social-notification:hover { transform: translateY(-1px); background: rgba(255,255,255,.06); border-color: rgba(76,175,80,.28); }
                .social-notification.unread { background: linear-gradient(90deg,rgba(76,175,80,.12),rgba(255,152,0,.045)); border-color: rgba(76,175,80,.28); }
                .social-notification:disabled { opacity: .6; cursor: wait; }
                .social-avatar-wrap { position: relative; width: 48px; height: 48px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.07); font-size: 22px; }
                .social-avatar-wrap img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
                .social-avatar-wrap i { position: absolute; right: -4px; bottom: -3px; width: 23px; height: 23px; display: grid; place-items: center; border-radius: 50%; background: #142536; border: 2px solid #1a2e40; font-style: normal; font-size: 12px; }
                .social-copy { min-width: 0; }
                .social-copy strong { display: block; font-size: 13px; line-height: 1.45; }
                .social-copy p { margin-top: 4px; color: rgba(255,255,255,.56); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .social-copy time { display: block; margin-top: 5px; color: rgba(255,255,255,.32); font-size: 10px; }
                .social-new-dot { width: 9px; height: 9px; border-radius: 50%; background: #4CAF50; box-shadow: 0 0 0 5px rgba(76,175,80,.12); }
                .social-arrow { color: rgba(255,255,255,.28); font-size: 25px; }
                .birthday-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 15px; margin-top: 18px; }
                .birthday-memory { position: relative; display: grid; grid-template-columns: 160px 1fr; min-height: 230px; overflow: hidden; border-radius: 19px; border: 1px solid rgba(255,255,255,.08); background: linear-gradient(145deg,rgba(28,49,70,.95),rgba(13,27,42,.96)); }
                .birthday-memory.unread { border-color: rgba(255,202,84,.42); box-shadow: 0 0 0 1px rgba(255,152,0,.08),0 14px 35px rgba(0,0,0,.22); }
                .new-dot { position: absolute; top: 12px; right: 12px; z-index: 2; background: #FF9800; border-radius: 999px; padding: 4px 8px; font-size: 9px; font-weight: 900; }
                .memory-photo-wrap { position: relative; min-height: 100%; background: #07111f; display: grid; place-items: center; }
                .memory-photo-wrap img { width: 100%; height: 100%; min-height: 230px; object-fit: contain; }
                .memory-photo-wrap > div { font-size: 70px; }
                .memory-badge-emoji { position: absolute; left: 10px; bottom: 10px; width: 48px; height: 48px; display: grid; place-items: center; border-radius: 50%; background: linear-gradient(135deg,#4CAF50,#FF9800); font-size: 25px; box-shadow: 0 8px 20px rgba(0,0,0,.35); }
                .memory-content { padding: 19px; }
                .memory-date { color: rgba(255,255,255,.4)!important; font-size: 11px!important; text-transform: uppercase; font-weight: 800; letter-spacing: .5px; }
                .memory-content h3 { margin: 5px 0 3px; font-size: 20px; }
                .memory-content > strong { color: #ffd675; font-size: 13px; }
                .memory-content > p { color: rgba(255,255,255,.61); line-height: 1.45; font-size: 13px; margin-top: 8px; }
                .memory-coupon { margin-top: 11px; display: grid; gap: 3px; padding: 9px 11px; border-radius: 11px; border: 1px dashed rgba(255,202,84,.35); background: rgba(255,202,84,.06); }
                .memory-coupon b { color: #ffd675; font-size: 11px; }
                .memory-coupon span { color: rgba(255,255,255,.6); font-size: 11px; line-height: 1.4; }
                .memory-actions { display: flex; gap: 8px; margin-top: 13px; flex-wrap: wrap; }
                .memory-actions button { border: 1px solid rgba(255,255,255,.13); background: rgba(255,255,255,.06); color: #fff; border-radius: 10px; padding: 9px 12px; font: 800 12px ${FONT}; cursor: pointer; }
                .memory-actions button.primary { border: 0; background: linear-gradient(135deg,#4CAF50,#FF9800); }
                .memory-actions button:disabled { opacity: .6; cursor: wait; }
                .notifications-feedback { color: #9ce8a5; font-size: 12px; font-weight: 800; margin: 12px 2px 0; }
                .notifications-feedback.global { text-align: center; }
                .empty-notifications { text-align: center; padding: 44px 20px 35px; }
                .empty-notifications > span { font-size: 54px; }
                .empty-notifications h3 { margin: 8px 0; }
                .empty-notifications p { color: rgba(255,255,255,.45); max-width: 580px; margin: auto; line-height: 1.55; }
                .empty-compact { padding: 25px 4px 4px; color: rgba(255,255,255,.4); }
                .appointment-list { display: grid; gap: 9px; margin-top: 16px; }
                .appointment-list article { display: grid; grid-template-columns: 130px 1fr auto; align-items: center; gap: 14px; padding: 13px 14px; background: rgba(255,255,255,.035); border-radius: 13px; border: 1px solid rgba(255,255,255,.055); }
                .appointment-list h3 { font-size: 14px; }
                .appointment-list p,.appointment-list time { color: rgba(255,255,255,.4); font-size: 11px; margin-top: 3px; }
                .appointment-status { font-size: 11px; font-weight: 900; }
                @media (max-width: 900px) { .birthday-grid { grid-template-columns: 1fr; } }
                @media (max-width: 650px) {
                    .notifications-page { padding: 88px 12px 45px; }
                    .notifications-header { align-items: flex-start; flex-direction: column; }
                    .notification-section { padding: 15px; border-radius: 19px; }
                    .section-heading { align-items: flex-start; flex-direction: column; }
                    .heading-actions { justify-content: flex-start; }
                    .social-notification { grid-template-columns: 48px 1fr auto; gap: 10px; padding: 12px 10px; }
                    .social-avatar-wrap { width: 43px; height: 43px; }
                    .social-new-dot { display: none; }
                    .birthday-memory { grid-template-columns: 1fr; }
                    .memory-photo-wrap { height: 245px; }
                    .memory-photo-wrap img { min-height: 245px; }
                    .appointment-list article { grid-template-columns: 1fr; gap: 6px; }
                }
            `}</style>
        </main>
    )
}
