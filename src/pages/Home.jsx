import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AdCarousel from '../components/AdCarousel'

const G1 = '#4CAF50'
const G2 = '#66BB6A'
const O1 = '#FF9800'
const O2 = '#FFB74D'
const DARK = '#0f1923'
const DARK2 = '#162032'
const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif"

const veterinariasDestacadas = [
    { nombre: 'Clínica Vida Animal', localidad: 'Palermo, CABA', especialidad: 'Clínica general · Cirugía', img: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&q=80', destacada: true },
    { nombre: 'VetSur 24hs', localidad: 'Lomas de Zamora, GBA', especialidad: 'Urgencias · Guardia permanente', img: 'https://images.unsplash.com/photo-1612531385446-f7e6d131e1d0?w=800&q=80', destacada: true },
    { nombre: 'Centro Veterinario del Norte', localidad: 'San Isidro, GBA', especialidad: 'Dermatología · Odontología', img: 'https://images.unsplash.com/photo-1559000357-f6b52ddfbe37?w=800&q=80', destacada: false },
]

const tipsHome = [
    {
        icon: '🐾', accent: '#ef4444', accent2: '#f97316',
        title: '¿Se perdió tu mascota?',
        text: 'Publicá su foto gratis y que la vea toda la comunidad de tu zona. Cuanto antes, mejor.',
        cta: 'Publicar ahora', link: '/mascotas-perdidas', gated: false,
    },
    {
        icon: '💊', accent: '#4CAF50', accent2: '#66BB6A',
        title: '¿Cuándo fue la última pipeta?',
        text: 'Llevá el control de desparasitaciones, pulgas y pipetas. No se te pasa ninguna.',
        cta: 'Llevar el control', link: '/pets', gated: true,
    },
    {
        icon: '🐶', accent: '#FF9800', accent2: '#FFB74D',
        title: 'Cargá tu primera mascota',
        text: 'Armá su ficha con foto, peso y datos. Tené todo de tu mascota en un solo lugar.',
        cta: 'Crear ficha', link: '/pets', gated: true,
    },
]

export default function Home() {
    const { user } = useAuth()

    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
            <style>{`
                * { box-sizing: border-box; }
                @keyframes pricePop {
                    from { opacity: 0; transform: translateX(40px) scale(0.7); }
                    to   { opacity: 1; transform: translateX(0) scale(1); }
                }
                @keyframes slideLeft {
                    from { opacity: 0; transform: translateX(-40px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes btnBounce {
                    0%   { opacity: 0; transform: scale(0.5); }
                    70%  { transform: scale(1.1); }
                    100% { opacity: 1; transform: scale(1); }
                }
                @keyframes pricePulse {
                    0%, 100% { transform: scale(1); }
                    50%      { transform: scale(1.06); }
                }
                @keyframes cardIn {
                    from { opacity: 0; transform: scale(0.95) translateY(20px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
                @media (max-width: 768px) {
                    .hero-inner { padding: 40px 20px !important; }
                    .hero-title { font-size: 30px !important; letter-spacing: -0.5px !important; }
                    .hero-title br { display: none !important; }
                    .hero-sub { font-size: 14px !important; }
                    .hero-sub br { display: none !important; }
                    .hero-btns { flex-direction: column !important; gap: 10px !important; }
                    .hero-btns a { text-align: center !important; }
                    .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
                    .section-pad { padding: 16px !important; }
                    .banner-ad-wrap { flex-direction: column !important; }
                    .banner-ad-foto { width: 100% !important; height: 200px !important; flex-shrink: unset !important; }
                    .banner-ad-info { padding: 20px 16px !important; }
                    .banner-ad-centro { display: none !important; }
                    .banner-ad-precio { width: 100% !important; flex-direction: row !important; flex-wrap: wrap !important; justify-content: center !important; align-items: center !important; gap: 12px !important; padding: 18px 16px !important; }
                    .banner-precio-num { font-size: 36px !important; animation: none !important; }
                    .banner-oferta-badge { white-space: nowrap !important; flex-shrink: 0 !important; margin-top: 0 !important; }
                    .grid-3 { grid-template-columns: 1fr !important; }
                    .grid-2 { grid-template-columns: 1fr !important; }
                    .senasa-inner { flex-direction: column !important; gap: 14px !important; }
                    .senasa-btn { width: 100% !important; text-align: center !important; margin-left: 0 !important; }
                    .lost-teaser-inner { flex-direction: column !important; gap: 16px !important; align-items: stretch !important; }
                    .lost-teaser-inner > div:first-child { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
                    .lost-teaser-btn { width: 100% !important; text-align: center !important; }
                    .banner-anun-inner { flex-direction: column !important; text-align: center !important; }
                    .banner-anun-stats { justify-content: center !important; }
                    .banner-anun-right { margin-left: 0 !important; margin-top: 16px !important; }
                    .footer-pad { padding: 24px 20px !important; }
                    .lost-form-pad { padding: 20px 16px !important; }
                    .lost-muro-pad { padding: 16px !important; }
                    .lost-header-pad { padding: 20px 16px !important; }
                    .contact-row { flex-direction: column !important; }
                    .contact-row select { width: 100% !important; }
                    .lost-filters { flex-direction: column !important; }
                    .prov-loc-row { flex-direction: column !important; }
                }
                @media (max-width: 400px) {
                    .hero-inner { padding: 32px 16px !important; }
                    .hero-title { font-size: 26px !important; }
                    .stats-grid { grid-template-columns: 1fr !important; }
                    .stats-grid > div { border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.06) !important; }
                    .stats-grid > div:last-child { border-bottom: none !important; }
                    .section-pad { padding: 12px !important; }
                    .footer-pad { padding: 20px 14px !important; }
                }
            `}</style>

            <div style={{ minHeight: '100vh', background: DARK, fontFamily: FONT }}>

                {/* HERO */}
                <div style={{ position: 'relative', minHeight: 520, overflow: 'hidden', display: 'flex', alignItems: 'center', backgroundImage: 'url(/hero.jpg)', backgroundSize: 'cover', backgroundPosition: 'center 35%' }}>
                    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(120deg, rgba(15,25,35,0.92) 0%, rgba(15,25,35,0.75) 50%, rgba(255,152,0,0.25) 100%)` }} />
                    <div style={{ position: 'absolute', top: -100, right: -100, width: 500, height: 500, background: `radial-gradient(circle, rgba(255,152,0,0.15) 0%, transparent 70%)`, pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: -80, left: 300, width: 400, height: 400, background: `radial-gradient(circle, rgba(76,175,80,0.12) 0%, transparent 70%)`, pointerEvents: 'none' }} />
                    <div className="hero-inner" style={{ position: 'relative', zIndex: 2, padding: '56px 56px', maxWidth: 580 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(76,175,80,0.15)', border: `1px solid rgba(76,175,80,0.4)`, color: G2, fontSize: 12, fontWeight: 700, padding: '7px 16px', borderRadius: 99, marginBottom: 24, letterSpacing: 0.5 }}>
                            <span style={{ width: 7, height: 7, background: G1, borderRadius: '50%', display: 'inline-block', boxShadow: `0 0 8px ${G1}` }} />
                            La app veterinaria de Argentina
                        </div>
                        <h1 className="hero-title" style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 18, letterSpacing: -1.5 }}>
                            La plataforma que{' '}
                            <span style={{ background: `linear-gradient(135deg, ${G1}, ${O1})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>conecta</span>
                            ,<br />veterinarias y dueños de mascotas
                        </h1>
                        <p className="hero-sub" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, lineHeight: 1.75, marginBottom: 32, fontWeight: 400 }}>
                            Expediente digital, turnos online y tu veterinaria de confianza.<br />Sin papeles, sin llamadas.
                        </p>
                        <div className="hero-btns" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                            {user ? (
                                <Link to={({ owner: '/dashboard', clinic: '/clinic/dashboard', business: '/business/dashboard', shelter: '/shelter/dashboard' })[user.role] || '/comunidad'} style={{ background: `linear-gradient(135deg, ${G1}, ${O1})`, color: '#fff', fontWeight: 800, fontSize: 15, padding: '14px 28px', borderRadius: 14, textDecoration: 'none', boxShadow: `0 6px 24px rgba(76,175,80,0.35)` }}>Ir a mi panel →</Link>
                            ) : (
                                <>
                                    <Link to="/register" style={{ background: `linear-gradient(135deg, ${G1}, ${O1})`, color: '#fff', fontWeight: 800, fontSize: 15, padding: '14px 28px', borderRadius: 14, textDecoration: 'none', boxShadow: `0 6px 24px rgba(76,175,80,0.35)` }}>Crear cuenta gratis</Link>
                                    <Link to="/register?role=vet" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 15, fontWeight: 600, padding: '14px 28px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.18)', textDecoration: 'none', backdropFilter: 'blur(8px)' }}>Soy veterinario/a</Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* STATS */}
                <div className="stats-grid" style={{ background: DARK2, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
                    {[{ n: '+200', l: 'Veterinarias', color: G1 }, { n: '+5.000', l: 'Mascotas registradas', color: O1 }, { n: '24/7', l: 'Acceso al historial', color: G1 }, { n: '100%', l: 'Gratis para dueños', color: O1 }].map((s, i) => (
                        <div key={i} style={{ padding: '20px 0', textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                            <div style={{ fontSize: 24, fontWeight: 900, color: s.color, fontFamily: FONT }}>{s.n}</div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4, fontWeight: 500 }}>{s.l}</div>
                        </div>
                    ))}
                </div>

                {/* BANNER PUBLICITARIO (carrusel) */}
                <AdCarousel />

                {/* CÓMO FUNCIONA (acceso) */}
                <div className="section-pad" style={{ padding: '4px 40px 28px' }}>
                    <Link to="/como-funciona" style={{ textDecoration: 'none', display: 'block' }}>
                        <div style={{ background: 'linear-gradient(135deg, rgba(76,175,80,0.1), rgba(255,152,0,0.1))', borderRadius: 20, padding: '24px 28px', border: '1.5px solid rgba(76,175,80,0.25)', transition: 'transform .2s, border-color .2s', cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(76,175,80,0.5)' }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(76,175,80,0.25)' }}>
                            <div className="senasa-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                    <div style={{ width: 56, height: 56, borderRadius: 16, flexShrink: 0, background: 'rgba(76,175,80,0.12)', border: '1.5px solid rgba(76,175,80,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>💡</div>
                                    <div>
                                        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: G2, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Conocé VetPaw</span>
                                        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4, fontFamily: FONT }}>¿Cómo funciona VetPaw?</h3>
                                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>Mirá todo lo que podés hacer, seas dueño de una mascota o una veterinaria.</p>
                                    </div>
                                </div>
                                <div className="senasa-btn" style={{ flexShrink: 0, marginLeft: 20, background: `linear-gradient(135deg, ${G1}, ${O1})`, color: '#fff', fontWeight: 800, fontSize: 12, padding: '10px 18px', borderRadius: 10, whiteSpace: 'nowrap', fontFamily: FONT }}>Ver cómo funciona →</div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* SENASA */}
                <div className="section-pad" style={{ padding: '4px 40px 28px' }}>
                    <a href="https://mascotas.senasa.gob.ar/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
                        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0c2a4a 100%)', borderRadius: 20, padding: '24px 28px', border: '1.5px solid rgba(107,202,255,0.15)', transition: 'transform .2s, border-color .2s', cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(107,202,255,0.4)' }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(107,202,255,0.15)' }}>
                            <div className="senasa-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                    <div style={{ width: 56, height: 56, borderRadius: 16, flexShrink: 0, background: 'rgba(107,202,255,0.1)', border: '1.5px solid rgba(107,202,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>✈️</div>
                                    <div>
                                        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: '#6bcaff', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>SENASA · Trámite oficial</span>
                                        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4, fontFamily: FONT }}>¿Viajás con tu mascota?</h3>
                                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>Consultá los requisitos oficiales para viajar dentro del país o al exterior.</p>
                                    </div>
                                </div>
                                <div className="senasa-btn" style={{ flexShrink: 0, marginLeft: 20, background: '#6bcaff', color: '#0f172a', fontWeight: 800, fontSize: 12, padding: '10px 18px', borderRadius: 10, whiteSpace: 'nowrap', fontFamily: FONT }}>Ver requisitos</div>
                            </div>
                        </div>
                    </a>
                </div>

                {/* VETERINARIAS DESTACADAS */}
                <div className="section-pad" style={{ padding: '4px 40px 28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: FONT }}>🏥 Veterinarias destacadas</h2>
                        <Link to="/clinics" style={{ fontSize: 13, color: G2, fontWeight: 700, textDecoration: 'none' }}>Ver todas →</Link>
                    </div>
                    <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
                        {veterinariasDestacadas.map((v, i) => (
                            <div key={i} style={{ borderRadius: 20, overflow: 'hidden', cursor: 'pointer', boxShadow: v.destacada ? `0 6px 32px rgba(76,175,80,0.2)` : '0 2px 12px rgba(0,0,0,0.3)', border: v.destacada ? `2px solid rgba(76,175,80,0.35)` : '1.5px solid rgba(255,255,255,0.07)', background: DARK2, transition: 'transform .2s' }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                <div style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
                                    <img src={v.img} alt={v.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.7))' }} />
                                    {v.destacada && <span style={{ position: 'absolute', top: 12, right: 12, background: `linear-gradient(135deg, ${G1}, ${O1})`, color: '#fff', fontSize: 11, fontWeight: 800, padding: '5px 12px', borderRadius: 99, boxShadow: `0 2px 12px rgba(76,175,80,0.4)` }}>⭐ Destacada</span>}
                                    <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
                                        <h4 style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 2, fontFamily: FONT }}>{v.nombre}</h4>
                                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>📍 {v.localidad}</p>
                                    </div>
                                </div>
                                <div style={{ padding: '14px 16px 18px' }}>
                                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 14, fontWeight: 500 }}>{v.especialidad}</p>
                                    <Link to="/register" style={{ display: 'block', textAlign: 'center', fontSize: 13, fontWeight: 800, color: '#fff', background: v.destacada ? `linear-gradient(135deg, ${G1}, ${O1})` : 'rgba(255,255,255,0.08)', padding: '11px', borderRadius: 12, textDecoration: 'none', fontFamily: FONT, boxShadow: v.destacada ? `0 4px 16px rgba(76,175,80,0.3)` : 'none', border: v.destacada ? 'none' : '1px solid rgba(255,255,255,0.12)' }}>Sacar turno</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* TIPS QUE LLEVAN A FUNCIONES */}
                <div className="section-pad" style={{ padding: '4px 40px 28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: FONT }}>💡 Tips para tu mascota</h2>
                        <Link to="/tips" style={{ fontSize: 13, color: G2, fontWeight: 700, textDecoration: 'none' }}>Ver más →</Link>
                    </div>
                    <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                        {tipsHome.map((t, i) => {
                            const destino = t.gated && !user ? '/register' : t.link
                            return (
                                <Link key={i} to={destino} style={{ textDecoration: 'none' }}>
                                    <div style={{ background: DARK2, border: '1.5px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden', cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform .2s, border-color .2s' }}
                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = t.accent }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}>
                                        {/* Cabecera con degradé + ícono */}
                                        <div style={{ height: 92, background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                            <span style={{ fontSize: 44, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }}>{t.icon}</span>
                                        </div>
                                        <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                            <h4 style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.4, marginBottom: 8, fontFamily: FONT }}>{t.title}</h4>
                                            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, marginBottom: 16, flex: 1 }}>{t.text}</p>
                                            <span style={{ alignSelf: 'flex-start', background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`, color: '#fff', fontSize: 13, fontWeight: 800, padding: '10px 18px', borderRadius: 12, fontFamily: FONT }}>
                                                {t.cta} →
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>

                {/* ══════════════════════════════════════
                    TEASER MASCOTAS PERDIDAS → /mascotas-perdidas
                ══════════════════════════════════════ */}
                <div className="section-pad" style={{ padding: '4px 40px 28px' }}>
                    <Link to="/mascotas-perdidas" style={{ textDecoration: 'none', display: 'block' }}>
                        <div className="lost-teaser-wrap" style={{ background: `linear-gradient(135deg, #1a0505 0%, #3d0a0a 55%, #1a0a05 100%)`, border: '1.5px solid rgba(239,68,68,0.35)', borderRadius: 24, padding: '28px 32px', position: 'relative', overflow: 'hidden', transition: 'transform .2s, border-color .2s', cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.6)' }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #ef4444, #f97316, #ef4444)' }} />
                            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'rgba(239,68,68,0.08)', borderRadius: '50%' }} />
                            <div className="lost-teaser-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, position: 'relative', zIndex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                                    <div style={{ background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 900, letterSpacing: 3, padding: '6px 14px', borderRadius: 6, textTransform: 'uppercase', flexShrink: 0, boxShadow: '0 0 20px rgba(239,68,68,0.5)', animation: 'pricePulse 2s ease-in-out infinite' }}>🐾 ALERTA</div>
                                    <div>
                                        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: 1, fontFamily: FONT, marginBottom: 4 }}>Mascotas perdidas o encontradas</h2>
                                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>¿Perdiste tu mascota o encontraste una en la calle? Publicá tu reporte y mirá el muro de toda la comunidad.</p>
                                    </div>
                                </div>
                                <div className="lost-teaser-btn" style={{ flexShrink: 0, background: `linear-gradient(135deg, #ef4444, #f97316)`, color: '#fff', fontWeight: 800, fontSize: 13, padding: '13px 24px', borderRadius: 14, whiteSpace: 'nowrap', fontFamily: FONT, boxShadow: '0 6px 24px rgba(239,68,68,0.3)' }}>Ver mascotas perdidas →</div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* BANNER ANUNCIANTES */}
                <div className="section-pad" style={{ padding: '4px 40px 28px' }}>
                    <div style={{ background: `linear-gradient(135deg, rgba(76,175,80,0.12) 0%, rgba(255,152,0,0.12) 100%)`, border: `1.5px solid rgba(76,175,80,0.2)`, borderRadius: 24, padding: '32px 36px' }}>
                        <div className="banner-anun-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h3 style={{ color: '#fff', fontWeight: 900, fontSize: 20, marginBottom: 8, fontFamily: FONT }}>¿Tenés una marca de productos para mascotas?</h3>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 20, lineHeight: 1.65 }}>Miles de dueños buscan lo mejor para sus animales cada día. Hacé que te encuentren primero en VetPaw.</p>
                                <div className="banner-anun-stats" style={{ display: 'flex', gap: 28 }}>
                                    {[{ n: '+5.000', l: 'usuarios activos', c: G1 }, { n: '+200', l: 'veterinarias', c: O1 }, { n: '100%', l: 'audiencia target', c: G1 }].map((s, i) => (
                                        <div key={i}><p style={{ fontWeight: 900, fontSize: 20, color: s.c, fontFamily: FONT }}>{s.n}</p><p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{s.l}</p></div>
                                    ))}
                                </div>
                            </div>
                            <div className="banner-anun-right" style={{ textAlign: 'center', flexShrink: 0, marginLeft: 32 }}>
                                <div style={{ fontSize: 56, marginBottom: 14 }}>📣</div>
                                <Link to="/anunciar" style={{ display: 'inline-block', background: `linear-gradient(135deg, ${G1}, ${O1})`, color: '#fff', fontWeight: 800, fontSize: 13, padding: '13px 24px', borderRadius: 14, textDecoration: 'none', fontFamily: FONT, boxShadow: `0 6px 24px rgba(76,175,80,0.3)` }}>Quiero anunciar</Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <footer className="footer-pad" style={{ background: '#080f16', padding: '32px 40px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                        <img src="/logo_vetpaw.png" alt="VetPaw" style={{ height: '100px', width: 'auto' }} />
                        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, textAlign: 'center', maxWidth: 300, lineHeight: 1.6 }}>La app veterinaria de Argentina.<br />Tu mascota merece lo mejor.</p>
                        <a href="https://wa.me/541125908891" target="_blank" rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366', borderRadius: 12, padding: '10px 20px', textDecoration: 'none', fontFamily: FONT, fontWeight: 700, fontSize: 13 }}>
                            💬 11-2590-8891
                        </a>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap', padding: '0 16px' }}>
                            {[{ l: 'Términos', to: '/terminos' }, { l: 'Privacidad', to: '/privacidad' }, { l: 'Sumar mi veterinaria', to: '/sumar-veterinaria' }, { l: 'Anunciar en VetPaw', to: '/anunciar' }, { l: 'Contacto', to: '/contacto' }, { l: 'Blog', to: '/blog' }].map(item => (
                                <Link key={item.l} to={item.to} style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, cursor: 'pointer', fontWeight: 500, transition: 'color .2s', textDecoration: 'none' }}
                                    onMouseEnter={e => e.target.style.color = G2}
                                    onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.3)'}>{item.l}</Link>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                            <a href="https://www.instagram.com/vetpawoficial" target="_blank" rel="noopener noreferrer"
                                style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .2s', textDecoration: 'none' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(193,53,132,0.15)'; e.currentTarget.style.borderColor = 'rgba(193,53,132,0.4)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="rgba(255,255,255,0.6)" />
                                </svg>
                            </a>
                        </div>
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 18, width: '100%', textAlign: 'center' }}>
                            <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>© 2026 VetPaw · Todos los derechos reservados · Hecho con ❤️ en Argentina</p>
                        </div>
                    </div>
                </footer>

            </div>
        </>
    )
}
