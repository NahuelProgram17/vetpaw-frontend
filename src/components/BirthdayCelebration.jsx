import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
    getCurrentBirthdayCelebrations,
    openBirthdayGift,
    markBirthdayCardDownloaded,
} from '../services/api'
import { downloadBirthdayCard, shareBirthdayCard } from '../utils/birthdayCard'

const confettiColors = ['#4CAF50', '#FF9800', '#FFD54F', '#7CE0FF', '#F48FB1']
const confettiPieces = Array.from({ length: 54 }, (_, index) => ({
    id: index,
    color: confettiColors[index % confettiColors.length],
    left: `${(index * 37) % 100}%`,
    delay: `${(index % 12) * 0.09}s`,
    duration: `${2.7 + (index % 7) * 0.22}s`,
    rotation: `${(index * 47) % 360}deg`,
}))

export default function BirthdayCelebration() {
    const { user } = useAuth()
    const [celebrations, setCelebrations] = useState([])
    const [opened, setOpened] = useState(false)
    const [busy, setBusy] = useState(false)
    const [message, setMessage] = useState('')
    const [loadedForUserId, setLoadedForUserId] = useState(null)

    const current = celebrations[0] || null
    const visible = Boolean(user?.role === 'owner' && user?.id === loadedForUserId && current)

    useEffect(() => {
        if (user?.role !== 'owner') return undefined
        let cancelled = false
        const load = async () => {
            try {
                const data = await getCurrentBirthdayCelebrations()
                if (!cancelled) {
                    setCelebrations(Array.isArray(data) ? data : data.results || [])
                    setOpened(false)
                    setLoadedForUserId(user.id)
                }
            } catch (error) {
                console.error('No se pudieron cargar los cumpleaños:', error)
            }
        }
        const timer = window.setTimeout(load, 650)
        return () => {
            cancelled = true
            window.clearTimeout(timer)
        }
    }, [user?.id, user?.role])

    useEffect(() => {
        if (!visible) return undefined
        const previous = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = previous }
    }, [visible])

    const dayText = useMemo(() => {
        if (!current) return ''
        if (current.is_today) return `¡Hoy ${current.pet_name} está de cumpleaños!`
        if (current.days_since_birthday === 1) return `El cumpleaños de ${current.pet_name} fue ayer`
        return `El cumpleaños de ${current.pet_name} fue hace ${current.days_since_birthday} días`
    }, [current])

    const notifyUpdate = () => window.dispatchEvent(new CustomEvent('vetpaw:birthday-updated'))

    const handleOpen = async () => {
        if (!current || busy) return
        setBusy(true)
        setMessage('')
        try {
            const updated = await openBirthdayGift(current.id)
            setCelebrations((items) => [updated, ...items.slice(1)])
            setOpened(true)
            notifyUpdate()
        } catch {
            setMessage('No pudimos abrir el regalo. Probá nuevamente en unos segundos.')
        } finally {
            setBusy(false)
        }
    }

    const handleDownload = async () => {
        if (!current || busy) return
        setBusy(true)
        setMessage('Preparando tu tarjeta…')
        try {
            await downloadBirthdayCard(current)
            await markBirthdayCardDownloaded(current.id).catch(() => {})
            setMessage('¡Tarjeta descargada! Ya podés compartirla donde quieras 💚')
        } catch {
            setMessage('No pudimos generar la tarjeta. Probá nuevamente.')
        } finally {
            setBusy(false)
        }
    }

    const handleShare = async () => {
        if (!current || busy) return
        setBusy(true)
        setMessage('Preparando la sorpresa…')
        try {
            const result = await shareBirthdayCard(current)
            await markBirthdayCardDownloaded(current.id).catch(() => {})
            setMessage(result === 'shared' ? '¡Gracias por compartir este momento! 🐾' : 'La tarjeta se descargó para que puedas compartirla.')
        } catch (error) {
            if (error?.name !== 'AbortError') setMessage('No pudimos compartirla. Probá con el botón Descargar.')
        } finally {
            setBusy(false)
        }
    }

    const closeCurrent = () => {
        setCelebrations((items) => items.slice(1))
        setOpened(false)
        setMessage('')
    }

    if (!visible) return null

    return (
        <div className="birthday-overlay" role="dialog" aria-modal="true" aria-label={`Cumpleaños de ${current.pet_name}`}>
            <div className="birthday-confetti" aria-hidden="true">
                {confettiPieces.map((piece) => (
                    <span key={piece.id} style={{
                        '--left': piece.left,
                        '--delay': piece.delay,
                        '--duration': piece.duration,
                        '--rotation': piece.rotation,
                        '--color': piece.color,
                    }} />
                ))}
            </div>

            <section className={`birthday-modal ${opened ? 'is-opened' : ''}`}>
                <button className="birthday-close" onClick={closeCurrent} aria-label="Cerrar">×</button>

                {!opened ? (
                    <>
                        <div className="birthday-kicker">🎉 Sorpresa VetPaw</div>
                        <div className="birthday-photo-wrap">
                            {current.pet_photo ? (
                                <img src={current.pet_photo} alt={current.pet_name} className="birthday-photo" />
                            ) : (
                                <div className="birthday-photo birthday-photo-placeholder">🐾</div>
                            )}
                            <span className="birthday-crown">👑</span>
                        </div>
                        <p className="birthday-day-text">{dayText}</p>
                        <h2>Preparamos una cajita para {current.pet_name}</h2>
                        <p className="birthday-intro">Tiene una insignia anual, un recuerdo para compartir y un pequeño vale de mimos.</p>
                        <button className="birthday-main-button" onClick={handleOpen} disabled={busy}>
                            {busy ? 'Abriendo…' : '🎁 Abrir regalo'}
                        </button>
                        <p className="birthday-soft-note">La sorpresa queda guardada en Notificaciones.</p>
                    </>
                ) : (
                    <>
                        <div className="birthday-kicker">✨ Regalo desbloqueado</div>
                        <div className="birthday-badge-big">
                            <span>{current.badge?.emoji || '🎖️'}</span>
                            <strong>{current.badge?.name}</strong>
                            <small>{current.badge?.subtitle}</small>
                            <b>{current.year}</b>
                        </div>
                        <h2>¡Feliz cumpleaños, {current.pet_name}!</h2>
                        <p className="birthday-message">{current.message}</p>
                        <div className="birthday-gift-coupon">
                            <span>🎟️ VALE DE CUMPLEAÑOS</span>
                            <p>{current.gift_text}</p>
                        </div>
                        <div className="birthday-actions">
                            <button onClick={handleShare} disabled={busy}>📲 Compartir</button>
                            <button onClick={handleDownload} disabled={busy}>🖼️ Descargar tarjeta</button>
                        </div>
                        {message && <p className="birthday-feedback">{message}</p>}
                        <button className="birthday-secondary-button" onClick={closeCurrent}>Guardar recuerdo y cerrar</button>
                    </>
                )}
            </section>

            <style>{`
                .birthday-overlay { position: fixed; inset: 0; z-index: 4000; display: grid; place-items: center; padding: 22px; background: rgba(1,8,17,.84); backdrop-filter: blur(13px); font-family: 'Plus Jakarta Sans','Nunito',sans-serif; overflow: auto; }
                .birthday-modal { width: min(560px, 100%); position: relative; z-index: 2; text-align: center; color: #fff; border-radius: 30px; padding: 34px 34px 28px; background: radial-gradient(circle at 50% 0%, rgba(255,152,0,.17), transparent 38%), linear-gradient(155deg,#162a40,#0e1d2d 65%,#123120); border: 1px solid rgba(135,225,146,.4); box-shadow: 0 30px 100px rgba(0,0,0,.65), inset 0 1px 0 rgba(255,255,255,.08); animation: birthdayPop .45s cubic-bezier(.2,.9,.25,1.15); }
                .birthday-modal.is-opened { width: min(650px, 100%); }
                .birthday-close { position: absolute; top: 14px; right: 14px; width: 38px; height: 38px; border: 1px solid rgba(255,255,255,.14); border-radius: 50%; background: rgba(4,12,22,.55); color: #fff; font-size: 25px; cursor: pointer; }
                .birthday-kicker { display: inline-flex; padding: 7px 14px; border-radius: 999px; background: rgba(255,202,84,.12); border: 1px solid rgba(255,202,84,.28); color: #ffd675; font-weight: 900; font-size: 13px; text-transform: uppercase; letter-spacing: .8px; }
                .birthday-photo-wrap { width: 205px; height: 205px; margin: 22px auto 15px; position: relative; border-radius: 50%; padding: 7px; background: linear-gradient(135deg,#4CAF50,#FF9800,#FFD54F); box-shadow: 0 0 0 9px rgba(255,255,255,.04), 0 18px 45px rgba(0,0,0,.45); }
                .birthday-photo { width: 100%; height: 100%; object-fit: contain; border-radius: 50%; background: #07111f; display: grid; place-items: center; font-size: 74px; }
                .birthday-crown { position: absolute; right: -12px; top: -25px; font-size: 54px; transform: rotate(14deg); filter: drop-shadow(0 7px 8px rgba(0,0,0,.4)); animation: birthdayCrown 1.8s ease-in-out infinite; }
                .birthday-day-text { margin: 4px 0 8px; color: #8fe39a; font-weight: 900; font-size: 15px; }
                .birthday-modal h2 { font-family: 'Baloo 2','Nunito',sans-serif; font-size: clamp(28px,5vw,40px); line-height: 1.04; margin: 8px 0 12px; }
                .birthday-intro,.birthday-message { color: rgba(255,255,255,.72); line-height: 1.65; font-size: 15px; }
                .birthday-main-button { margin-top: 22px; width: 100%; border: 0; border-radius: 16px; padding: 16px 24px; color: #fff; font-weight: 900; font-size: 17px; cursor: pointer; background: linear-gradient(135deg,#4CAF50,#FF9800); box-shadow: 0 14px 35px rgba(76,175,80,.28); transition: transform .18s, box-shadow .18s; }
                .birthday-main-button:hover { transform: translateY(-2px) scale(1.01); box-shadow: 0 18px 45px rgba(255,152,0,.3); }
                .birthday-main-button:disabled,.birthday-actions button:disabled { opacity: .65; cursor: wait; }
                .birthday-soft-note { margin-top: 12px; color: rgba(255,255,255,.36); font-size: 12px; }
                .birthday-badge-big { width: min(410px,100%); margin: 22px auto 18px; display: grid; justify-items: center; gap: 5px; padding: 23px; border-radius: 24px; background: linear-gradient(145deg,rgba(76,175,80,.22),rgba(255,152,0,.16)); border: 1px solid rgba(255,213,79,.28); box-shadow: inset 0 0 35px rgba(255,255,255,.03); }
                .birthday-badge-big span { font-size: 70px; line-height: 1; }
                .birthday-badge-big strong { font-size: 21px; }
                .birthday-badge-big small { color: rgba(255,255,255,.6); }
                .birthday-badge-big b { margin-top: 5px; color: #ffd675; font-size: 13px; }
                .birthday-gift-coupon { margin: 18px 0; text-align: left; padding: 16px 18px; border-radius: 16px; border: 1px dashed rgba(255,202,84,.48); background: rgba(255,202,84,.07); }
                .birthday-gift-coupon span { color: #ffd675; font-size: 11px; font-weight: 900; letter-spacing: 1px; }
                .birthday-gift-coupon p { margin-top: 6px; color: rgba(255,255,255,.82); font-weight: 700; line-height: 1.45; }
                .birthday-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                .birthday-actions button,.birthday-secondary-button { border-radius: 13px; padding: 13px 12px; font-family: inherit; font-weight: 900; cursor: pointer; }
                .birthday-actions button { border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.07); color: #fff; }
                .birthday-actions button:hover { background: rgba(76,175,80,.16); border-color: rgba(76,175,80,.45); }
                .birthday-secondary-button { width: 100%; margin-top: 12px; background: transparent; border: 0; color: rgba(255,255,255,.5); }
                .birthday-feedback { margin-top: 10px; color: #9ce8a5; font-size: 12px; font-weight: 800; }
                .birthday-confetti { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 1; }
                .birthday-confetti span { position: absolute; top: -30px; left: var(--left); width: 10px; height: 22px; border-radius: 3px; background: var(--color); transform: rotate(var(--rotation)); animation: birthdayFall var(--duration) linear var(--delay) infinite; }
                @keyframes birthdayPop { from { opacity: 0; transform: translateY(25px) scale(.92); } to { opacity: 1; transform: none; } }
                @keyframes birthdayCrown { 0%,100% { transform: rotate(12deg) translateY(0); } 50% { transform: rotate(16deg) translateY(-7px); } }
                @keyframes birthdayFall { to { transform: translateY(110vh) rotate(720deg); } }
                @media (max-width: 600px) { .birthday-overlay { padding: 12px; align-items: start; } .birthday-modal { margin: 18px 0; padding: 28px 18px 22px; border-radius: 24px; } .birthday-photo-wrap { width: 170px; height: 170px; } .birthday-actions { grid-template-columns: 1fr; } }
            `}</style>
        </div>
    )
}
