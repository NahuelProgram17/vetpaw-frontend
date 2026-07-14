import { useEffect, useState } from 'react'
import {
    getAppointments,
    getBirthdayCelebrations,
    markAllBirthdayCelebrationsRead,
    openBirthdayGift,
    markBirthdayCardDownloaded,
} from '../services/api'
import { downloadBirthdayCard, shareBirthdayCard } from '../utils/birthdayCard'
import ownerBg from '../assets/vetpaw-owner-bg.png'
import VetPawLoader from '../components/VetPawLoader'

const FONT = "'Plus Jakarta Sans','Nunito',sans-serif"

const formatDate = (value) => value
    ? new Date(`${value}T12:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
    : ''

export default function Notifications() {
    const [birthdays, setBirthdays] = useState([])
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [busyId, setBusyId] = useState(null)
    const [feedback, setFeedback] = useState('')

    const load = async () => {
        setLoading(true)
        try {
            const [birthdayData, appointmentData] = await Promise.all([
                getBirthdayCelebrations(),
                getAppointments(),
            ])
            setBirthdays(Array.isArray(birthdayData) ? birthdayData : birthdayData.results || [])
            const allAppointments = appointmentData.results ?? appointmentData
            setAppointments(Array.isArray(allAppointments) ? allAppointments.slice(0, 8) : [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const updateCelebration = (updated) => {
        setBirthdays((items) => items.map((item) => item.id === updated.id ? updated : item))
        window.dispatchEvent(new CustomEvent('vetpaw:birthday-updated'))
    }

    const handleOpen = async (celebration) => {
        setBusyId(celebration.id)
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
        setBusyId(celebration.id)
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
        setBusyId(celebration.id)
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

    const markAllRead = async () => {
        await markAllBirthdayCelebrationsRead()
        setBirthdays((items) => items.map((item) => ({ ...item, is_read: true })))
        window.dispatchEvent(new CustomEvent('vetpaw:birthday-updated'))
    }

    return (
        <main className="notifications-page">
            <div className="notifications-inner">
                <header className="notifications-header">
                    <div>
                        <span className="notifications-kicker">🔔 Tu centro VetPaw</span>
                        <h1>Notificaciones y recuerdos</h1>
                        <p>Acá quedan guardados los cumpleaños, insignias y novedades importantes de tus mascotas.</p>
                    </div>
                    {birthdays.some((item) => !item.is_read) && (
                        <button className="mark-read-button" onClick={markAllRead}>✓ Marcar cumpleaños como leídos</button>
                    )}
                </header>

                {loading ? (
                    <VetPawLoader message="Cargando notificaciones..." subText="Buscando recuerdos especiales" fullScreen={false} />
                ) : (
                    <>
                        <section className="notification-section">
                            <div className="section-heading">
                                <div><span>🎂</span><div><h2>Cumpleaños VetPaw</h2><p>Insignias coleccionables y tarjetas para compartir.</p></div></div>
                                <b>{birthdays.length}</b>
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
                                                        <button className="primary" onClick={() => handleOpen(celebration)} disabled={busyId === celebration.id}>🎁 Abrir regalo</button>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => handleShare(celebration)} disabled={busyId === celebration.id}>📲 Compartir</button>
                                                            <button onClick={() => handleDownload(celebration)} disabled={busyId === celebration.id}>🖼️ Descargar</button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                            {feedback && <p className="notifications-feedback">{feedback}</p>}
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
            </div>

            <style>{`
                .notifications-page { min-height: 100vh; padding: 105px 24px 65px; color: #fff; font-family: ${FONT}; background: linear-gradient(rgba(3,12,25,.82),rgba(3,12,25,.88)), url(${ownerBg}) center/cover fixed; }
                .notifications-inner { max-width: 1220px; margin: 0 auto; }
                .notifications-header { display: flex; justify-content: space-between; align-items: end; gap: 25px; margin-bottom: 26px; }
                .notifications-kicker { display: inline-flex; padding: 7px 12px; border-radius: 999px; color: #8fe39a; border: 1px solid rgba(76,175,80,.3); background: rgba(76,175,80,.08); font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .7px; }
                .notifications-header h1 { margin: 10px 0 5px; font-family: 'Baloo 2','Nunito',sans-serif; font-size: clamp(34px,5vw,56px); line-height: 1; }
                .notifications-header p { color: rgba(255,255,255,.5); max-width: 700px; }
                .mark-read-button { border: 1px solid rgba(255,255,255,.13); background: rgba(255,255,255,.06); color: #fff; border-radius: 12px; padding: 11px 15px; font-weight: 800; cursor: pointer; }
                .notification-section { background: rgba(18,33,49,.9); border: 1px solid rgba(255,255,255,.08); border-radius: 24px; padding: 22px; margin-top: 18px; box-shadow: 0 22px 70px rgba(0,0,0,.24); }
                .section-heading { display: flex; align-items: center; justify-content: space-between; padding-bottom: 18px; border-bottom: 1px solid rgba(255,255,255,.07); }
                .section-heading > div { display: flex; align-items: center; gap: 13px; }
                .section-heading > div > span { width: 46px; height: 46px; display: grid; place-items: center; border-radius: 14px; background: rgba(255,152,0,.12); font-size: 23px; }
                .section-heading h2 { font-size: 20px; }
                .section-heading p { color: rgba(255,255,255,.42); font-size: 13px; margin-top: 3px; }
                .section-heading > b { background: rgba(76,175,80,.14); color: #8fe39a; padding: 5px 10px; border-radius: 999px; }
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
                @media (max-width: 650px) { .notifications-page { padding: 88px 12px 45px; } .notifications-header { align-items: flex-start; flex-direction: column; } .notification-section { padding: 15px; border-radius: 19px; } .birthday-memory { grid-template-columns: 1fr; } .memory-photo-wrap { height: 245px; } .memory-photo-wrap img { min-height: 245px; } .appointment-list article { grid-template-columns: 1fr; gap: 6px; } }
            `}</style>
        </main>
    )
}
