import { useState, useEffect, useRef } from 'react'
import { getActiveAds, registerAdClick } from '../services/api'

const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif"
const ROTATE_MS = 5000  // cada cuánto rota (milisegundos)

export default function AdCarousel() {
    const [ads, setAds] = useState([])
    const [i, setI] = useState(0)
    const [paused, setPaused] = useState(false)
    const touchX = useRef(null)

    // Traer los anuncios vigentes desde el backend
    useEffect(() => {
        let alive = true
        getActiveAds()
            .then((data) => {
                if (!alive) return
                const list = Array.isArray(data) ? data : (data.results || [])
                setAds(list)
            })
            .catch((e) => console.error('Error cargando anuncios', e))
        return () => { alive = false }
    }, [])

    const n = ads.length
    const go = (idx) => setI((idx + n) % n)
    const next = () => go(i + 1)
    const prev = () => go(i - 1)

    // Rotación automática (se pausa al pasar el mouse por encima)
    useEffect(() => {
        if (n <= 1 || paused) return
        const t = setInterval(() => setI(p => (p + 1) % n), ROTATE_MS)
        return () => clearInterval(t)
    }, [n, paused])

    // Si el índice quedó fuera de rango tras recargar, lo reseteo
    useEffect(() => {
        if (i >= n && n > 0) setI(0)
    }, [n, i])

    if (n === 0) return null

    // Swipe en mobile
    const onTouchStart = (e) => { touchX.current = e.touches[0].clientX }
    const onTouchEnd = (e) => {
        if (touchX.current == null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (dx > 40) prev()
        else if (dx < -40) next()
        touchX.current = null
    }

    const arrowStyle = (side) => ({
        position: 'absolute', top: '50%', [side]: 10, transform: 'translateY(-50%)',
        width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.25)',
        background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 26, lineHeight: 1, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)',
        zIndex: 3, paddingBottom: 4, transition: 'background .2s',
    })

    // Cada slide: clickeable (<a>) si tiene link, o estático (<div>) si no
    const Slide = ({ ad }) => {
        const img = <img src={ad.image_url} alt={ad.name} style={{ width: '100%', display: 'block' }} />
        if (ad.link) {
            return (
                <a href={ad.link} target="_blank" rel="noopener noreferrer"
                    onClick={() => registerAdClick(ad.id)}
                    style={{ flex: '0 0 100%', display: 'block', textDecoration: 'none', cursor: 'pointer' }}>
                    {img}
                </a>
            )
        }
        return <div style={{ flex: '0 0 100%', display: 'block' }}>{img}</div>
    }

    return (
        <div className="section-pad" style={{ padding: '10px 20px' }}>
            <div
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                style={{ position: 'relative', width: '92%', margin: '0 auto', overflow: 'hidden', borderRadius: 20 }}
            >
                {/* Riel que se desliza */}
                <div style={{
                    display: 'flex',
                    transform: `translateX(-${i * 100}%)`,
                    transition: 'transform .6s cubic-bezier(.45,.05,.25,1)',
                    alignItems: 'flex-start',
                }}>
                    {ads.map(ad => <Slide key={ad.id} ad={ad} />)}
                </div>

                {/* Flechas (solo si hay más de una publicidad) */}
                {n > 1 && (
                    <>
                        <button onClick={prev} aria-label="Anterior"
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
                            style={arrowStyle('left')}>‹</button>
                        <button onClick={next} aria-label="Siguiente"
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
                            style={arrowStyle('right')}>›</button>
                    </>
                )}

                {/* Puntitos indicadores */}
                {n > 1 && (
                    <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8, zIndex: 3 }}>
                        {ads.map((a, idx) => (
                            <button key={a.id} onClick={() => go(idx)} aria-label={`Ver publicidad ${idx + 1}`}
                                style={{
                                    width: idx === i ? 22 : 8, height: 8, borderRadius: 99, border: 'none',
                                    cursor: 'pointer', padding: 0, transition: 'all .25s',
                                    background: idx === i ? '#fff' : 'rgba(255,255,255,0.55)',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                                }} />
                        ))}
                    </div>
                )}
            </div>

            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'right', width: '92%', margin: '8px auto 0', fontFamily: FONT }}>
                Publicidad · VetPaw Ads
            </p>
        </div>
    )
}
