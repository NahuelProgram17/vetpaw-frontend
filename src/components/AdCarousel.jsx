import { useState, useEffect, useRef } from 'react'

const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif"

// ─────────────────────────────────────────────────────────────
//  PUBLICIDADES — editá SOLO este array para sumar/sacar locales
//  1) Subí la imagen del banner a la carpeta /public
//  2) Agregá un objeto acá abajo:
//       image: ruta de la imagen (siempre con "/" adelante)
//       link : WhatsApp  -> https://wa.me/54XXXXXXXXXX
//              Instagram -> https://instagram.com/usuario_del_local
//       alt  : nombre/descripción del local (accesibilidad + SEO)
// ─────────────────────────────────────────────────────────────
const ADS = [
    {
        id: 'chicha',
        image: '/chicha_petshop_v2.png',
        link: 'https://wa.me/541169345282',
        alt: 'Chicha Petshop — Todo lo que tu perro necesita',
    },
    // Ejemplo para sumar otro local (descomentá y editá):
    // {
    //     id: 'peluqueria-lucas',
    //     image: '/peluqueria_lucas.png',
    //     link: 'https://instagram.com/peluqueria_lucas',
    //     alt: 'Peluquería Canina Lucas',
    // },
]

const ROTATE_MS = 5000  // cada cuánto rota (milisegundos)

export default function AdCarousel() {
    const [i, setI] = useState(0)
    const [paused, setPaused] = useState(false)
    const touchX = useRef(null)
    const n = ADS.length

    const go = (idx) => setI((idx + n) % n)
    const next = () => go(i + 1)
    const prev = () => go(i - 1)

    // Rotación automática (se pausa al pasar el mouse por encima)
    useEffect(() => {
        if (n <= 1 || paused) return
        const t = setInterval(() => setI(p => (p + 1) % n), ROTATE_MS)
        return () => clearInterval(t)
    }, [n, paused])

    if (n === 0) return null
    const ad = ADS[i]

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
        zIndex: 2, paddingBottom: 4, transition: 'background .2s',
    })

    return (
        <div className="section-pad" style={{ padding: '10px 20px' }}>
            <style>{`@keyframes adFade { from { opacity: 0 } to { opacity: 1 } }`}</style>

            <div
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                style={{ position: 'relative', width: '92%', margin: '0 auto' }}
            >
                {/* Imagen clickeable → link del local */}
                <a href={ad.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none' }}>
                    <img
                        key={ad.id}
                        src={ad.image}
                        alt={ad.alt}
                        style={{ width: '100%', borderRadius: 20, display: 'block', cursor: 'pointer', animation: 'adFade .5s ease' }}
                    />
                </a>

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
                    <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8, zIndex: 2 }}>
                        {ADS.map((a, idx) => (
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
