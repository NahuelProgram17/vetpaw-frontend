import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useRef, useEffect } from 'react'
import api from '../services/api'

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

const curiosidades = [
    { tag: 'Perros', tagColor: O1, img: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80', title: 'El olfato canino es 40 veces más poderoso que el humano', text: 'Tienen 300 millones de receptores olfativos. Por eso los usan en detección médica.' },
    { tag: 'Gatos', tagColor: G1, img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80', title: 'Los gatos ronronean tanto de felicidad como de estrés', text: 'La frecuencia del ronroneo (25-150 Hz) ayuda a regenerar tejidos óseos.' },
    { tag: 'Conejos', tagColor: '#6bcaff', img: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=800&q=80', title: 'Los conejos no pueden vomitar', text: 'Su digestión es unidireccional. Una mala dieta puede ser fatal en pocas horas.' },
]

export default function Home() {
    const { user } = useAuth()
    const [fotoMascota, setFotoMascota] = useState(null)
    const [fotoPreview, setFotoPreview] = useState(null)
    const [descripcionMascota, setDescripcionMascota] = useState('')
    const [contactType, setContactType] = useState('phone')
    const [contactValue, setContactValue] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [reporteEnviado, setReporteEnviado] = useState(false)
    const [errorEnvio, setErrorEnvio] = useState('')
    const fileRef = useRef()
    const [lostPets, setLostPets] = useState([])
    const [cargandoMuro, setCargandoMuro] = useState(true)
    const [reportados, setReportados] = useState({})
    const [reportType, setReportType] = useState('found')
    const [selectedPet, setSelectedPet] = useState(null)

    useEffect(() => { fetchLostPets() }, [])

    const fetchLostPets = async () => {
        try { const res = await api.get('/lost-pets/'); setLostPets(res.data) }
        catch (e) { console.error('Error cargando mascotas perdidas', e) }
        finally { setCargandoMuro(false) }
    }

    const handleFoto = (e) => {
        const file = e.target.files[0]
        if (!file) return
        if (!file.type.includes('jpeg') && !file.name.endsWith('.jpg')) { alert('Solo se aceptan archivos JPG.'); return }
        setFotoMascota(file)
        setFotoPreview(URL.createObjectURL(file))
    }

    const handleReporte = async (e) => {
        e.preventDefault(); setErrorEnvio('')
        if (!fotoMascota || !descripcionMascota.trim() || !contactValue.trim()) { setErrorEnvio('Por favor completá todos los campos.'); return }
        setEnviando(true)
        try {
            const formData = new FormData()
            formData.append('report_type', reportType)
            formData.append('photo', fotoMascota); formData.append('description', descripcionMascota)
            formData.append('contact_type', contactType); formData.append('contact_value', contactValue)
            await api.post('/lost-pets/create/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            setReporteEnviado(true); setFotoMascota(null); setFotoPreview(null); setDescripcionMascota(''); setContactValue('')
            fetchLostPets(); setTimeout(() => setReporteEnviado(false), 5000)
        } catch (e) { setErrorEnvio('Hubo un error al publicar. Intentá de nuevo.') }
        finally { setEnviando(false) }
    }

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
                    .hero-sub { font-size: 14px !important; }
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
                    .banner-anun-inner { flex-direction: column !important; text-align: center !important; }
                    .banner-anun-stats { justify-content: center !important; }
                    .banner-anun-right { margin-left: 0 !important; margin-top: 16px !important; }
                    .footer-pad { padding: 24px 20px !important; }
                    .lost-form-pad { padding: 20px 16px !important; }
                    .lost-muro-pad { padding: 16px !important; }
                    .lost-header-pad { padding: 20px 16px !important; }
                    .contact-row { flex-direction: column !important; }
                    .contact-row select { width: 100% !important; }
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
                                <Link to={user.role === 'clinic' ? '/clinic/dashboard' : '/dashboard'} style={{ background: `linear-gradient(135deg, ${G1}, ${O1})`, color: '#fff', fontWeight: 800, fontSize: 15, padding: '14px 28px', borderRadius: 14, textDecoration: 'none', boxShadow: `0 6px 24px rgba(76,175,80,0.35)` }}>Ir a mi panel →</Link>
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

                <div className="section-pad" style={{ padding: '10px 20px' }}>
                    <a href="https://wa.me/541169345282" target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none' }}>
                        <img
                            src="/chicha_petshop.png"
                            alt="Chica Petshop — Todo lo que tu perro necesita"
                            style={{
                                width: '70%',
                                borderRadius: 20,
                                display: 'block',
                                cursor: 'pointer',
                                margin: '0 auto'
                            }}
                        />
                    </a>

                    <p style={{
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.2)',
                        marginTop: 8,
                        textAlign: 'right'
                    }}>
                        Publicidad · VetPaw Ads
                    </p>
                </div>

                {/* FEATURES */}
                <div className="section-pad" style={{ padding: '4px 40px 28px' }}>
                    <h2 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 2 }}>¿Qué podés hacer?</h2>
                    <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                        {[
                            { bg: 'rgba(76,175,80,0.08)', border: 'rgba(76,175,80,0.25)', iconBg: 'rgba(76,175,80,0.15)', icon: '📋', title: 'Expediente digital', text: 'Vacunas, alergias y toda la historia clínica en un lugar seguro.', accent: G1 },
                            { bg: 'rgba(255,152,0,0.08)', border: 'rgba(255,152,0,0.25)', iconBg: 'rgba(255,152,0,0.15)', icon: '📅', title: 'Turnos online', text: 'Pedí turno con tu veterinaria sin llamar, en cualquier momento.', accent: O1 },
                            { bg: 'rgba(107,202,255,0.08)', border: 'rgba(107,202,255,0.2)', iconBg: 'rgba(107,202,255,0.12)', icon: '🔒', title: 'Vos controlás todo', text: 'Solo las veterinarias que elegís pueden ver el historial.', accent: '#6bcaff' },
                        ].map((f, i) => (
                            <div key={i} style={{ background: f.bg, border: `1.5px solid ${f.border}`, borderRadius: 20, padding: 22, transition: 'transform .2s, box-shadow .2s' }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${f.border}` }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: f.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14 }}>{f.icon}</div>
                                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 6, fontFamily: FONT }}>{f.title}</h3>
                                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, fontWeight: 400 }}>{f.text}</p>
                            </div>
                        ))}
                    </div>
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

                {/* SABIAS QUE */}
                <div className="section-pad" style={{ padding: '4px 40px 28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: FONT }}>💡 Sabías que...</h2>
                        <Link to="/tips" style={{ fontSize: 13, color: G2, fontWeight: 700, textDecoration: 'none' }}>Ver más →</Link>
                    </div>
                    <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                        {curiosidades.map((c, i) => (
                            <div key={i} style={{ background: DARK2, border: '1.5px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden', cursor: 'pointer', transition: 'transform .2s, border-color .2s' }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = c.tagColor }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}>
                                <div style={{ height: 180, overflow: 'hidden', position: 'relative' }}>
                                    <img src={c.img} alt={c.tag} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.5))' }} />
                                    <div style={{ position: 'absolute', bottom: 10, left: 10, background: c.tagColor, color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 99 }}>{c.tag}</div>
                                </div>
                                <div style={{ padding: '14px 16px' }}>
                                    <h4 style={{ fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1.4, marginBottom: 6, fontFamily: FONT }}>{c.title}</h4>
                                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65 }}>{c.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* MASCOTAS PERDIDAS */}
                <div className="section-pad" style={{ padding: '4px 40px 28px' }}>
                    <div style={{ background: DARK2, border: '1.5px solid rgba(255,255,255,0.07)', borderRadius: 24, overflow: 'hidden' }}>
                        <div className="lost-header-pad" style={{ background: `linear-gradient(135deg, #1a0505 0%, #3d0a0a 50%, #1a0a05 100%)`, padding: '28px 32px', position: 'relative', overflow: 'hidden', borderBottom: '3px solid rgba(239,68,68,0.4)' }}>
                            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'rgba(239,68,68,0.08)', borderRadius: '50%' }} />
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #ef4444, #f97316, #ef4444)' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
                                <div style={{ background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 900, letterSpacing: 3, padding: '6px 14px', borderRadius: 6, textTransform: 'uppercase', flexShrink: 0, boxShadow: '0 0 20px rgba(239,68,68,0.5)', animation: 'pricePulse 2s ease-in-out infinite' }}>🐾 ALERTA</div>
                                <div>
                                    <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: 1, fontFamily: FONT, marginBottom: 4 }}>Mascotas perdidas o encontradas</h2>
                                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>¿Perdiste tu mascota o encontraste una en la calle? Publicalo acá y ayudá a reunirlos.</p>
                                </div>
                            </div>
                        </div>

                        <div className="lost-form-pad" style={{ padding: '28px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            {reporteEnviado ? (
                                <div style={{ background: 'rgba(76,175,80,0.1)', border: `1.5px solid rgba(76,175,80,0.3)`, borderRadius: 16, padding: '24px', textAlign: 'center' }}>
                                    <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
                                    <h3 style={{ fontWeight: 800, color: G2, fontSize: 16, fontFamily: FONT }}>¡Reporte publicado!</h3>
                                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>Gracias por ayudar. Esperamos que esta mascota vuelva a casa pronto.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleReporte} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                    <div>
                                        <label style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 10, fontFamily: FONT }}>¿Qué querés reportar? <span style={{ color: O1 }}>*</span></label>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button type="button" onClick={() => setReportType('found')} style={{ flex: 1, padding: '12px', borderRadius: 12, border: `2px solid ${reportType === 'found' ? G1 : 'rgba(255,255,255,0.1)'}`, background: reportType === 'found' ? 'rgba(76,175,80,0.12)' : 'rgba(255,255,255,0.04)', color: reportType === 'found' ? G1 : 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: FONT, transition: 'all .2s' }}>📍 Encontré una mascota</button>
                                            <button type="button" onClick={() => setReportType('lost')} style={{ flex: 1, padding: '12px', borderRadius: 12, border: `2px solid ${reportType === 'lost' ? '#ef4444' : 'rgba(255,255,255,0.1)'}`, background: reportType === 'lost' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)', color: reportType === 'lost' ? '#ef4444' : 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: FONT, transition: 'all .2s' }}>😢 Perdí mi mascota</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 10, fontFamily: FONT }}>Foto de la mascota <span style={{ color: O1 }}>*</span><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 400, marginLeft: 8 }}>Solo JPG</span></label>
                                        {fotoPreview ? (
                                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                                <img src={fotoPreview} alt="Preview" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 14, border: `2px solid ${G1}` }} />
                                                <button type="button" onClick={() => { setFotoPreview(null); setFotoMascota(null) }} style={{ position: 'absolute', top: -8, right: -8, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: 12, fontWeight: 900 }}>✕</button>
                                            </div>
                                        ) : (
                                            <div onClick={() => fileRef.current.click()} style={{ border: '2px dashed rgba(255,255,255,0.15)', borderRadius: 16, padding: '32px', textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', transition: 'border-color .2s' }}
                                                onMouseEnter={e => e.currentTarget.style.borderColor = G1}
                                                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}>
                                                <div style={{ fontSize: 36, marginBottom: 10 }}>📷</div>
                                                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Clic para subir foto JPG</p>
                                                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>Máx. 5MB</p>
                                            </div>
                                        )}
                                        <input ref={fileRef} type="file" accept=".jpg,.jpeg" onChange={handleFoto} style={{ display: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 10, fontFamily: FONT }}>{reportType === 'lost' ? '¿Dónde y cuándo la perdiste?' : '¿Dónde y cuándo la encontraste?'} <span style={{ color: O1 }}>*</span></label>
                                        <textarea value={descripcionMascota} onChange={e => setDescripcionMascota(e.target.value)}
                                            placeholder={reportType === 'lost' ? 'Ej: Perdí a mi perro el martes en el barrio Suárez, Moreno. Es macho, color marrón, sin collar.' : 'Ej: Encontré este perro en la calle Martín Lazarte, barrio Suárez, Moreno. Es macho, color marrón, sin collar.'}
                                            rows={3} style={{ width: '100%', padding: '13px 16px', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 13, color: '#fff', resize: 'vertical', fontFamily: FONT, outline: 'none', lineHeight: 1.65, boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)' }}
                                            onFocus={e => e.target.style.borderColor = G1}
                                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 10, fontFamily: FONT }}>Datos de contacto <span style={{ color: O1 }}>*</span></label>
                                        <div className="contact-row" style={{ display: 'flex', gap: 10 }}>
                                            <select value={contactType} onChange={e => setContactType(e.target.value)} style={{ padding: '12px 14px', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 13, color: '#fff', background: 'rgba(255,255,255,0.07)', outline: 'none', cursor: 'pointer', fontFamily: FONT }}>
                                                <option value="phone" style={{ background: DARK2 }}>📱 Celular</option>
                                                <option value="home_phone" style={{ background: DARK2 }}>📞 Tel. casa</option>
                                                <option value="email" style={{ background: DARK2 }}>✉️ Email</option>
                                            </select>
                                            <input value={contactValue} onChange={e => setContactValue(e.target.value)} placeholder={contactType === 'email' ? 'tucorreo@email.com' : 'Ej: 11 2345-6789'} style={{ flex: 1, padding: '12px 16px', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 13, color: '#fff', outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', fontFamily: FONT }}
                                                onFocus={e => e.target.style.borderColor = G1}
                                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                        </div>
                                    </div>
                                    {errorEnvio && <p style={{ color: '#f87171', fontSize: 12, margin: 0, fontWeight: 600 }}>{errorEnvio}</p>}
                                    <button type="submit" disabled={enviando} style={{ background: enviando ? 'rgba(255,255,255,0.1)' : reportType === 'lost' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : `linear-gradient(135deg, ${G1}, ${O1})`, color: '#fff', fontWeight: 800, fontSize: 14, padding: '15px', borderRadius: 14, border: 'none', cursor: enviando ? 'not-allowed' : 'pointer', boxShadow: enviando ? 'none' : '0 6px 24px rgba(76,175,80,0.3)', fontFamily: FONT, letterSpacing: 0.3 }}>
                                        {enviando ? 'Publicando...' : reportType === 'lost' ? '😢 Publicar mascota perdida' : '📍 Publicar mascota encontrada'}
                                    </button>
                                </form>
                            )}
                        </div>

                        <div className="lost-muro-pad" style={{ padding: '24px 32px' }}>
                            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 18, fontFamily: FONT }}>
                                📋 Reportes activos <span style={{ color: G1 }}>({lostPets.length})</span>
                            </h3>
                            {cargandoMuro ? (
                                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Cargando reportes...</p>
                            ) : lostPets.length === 0 ? (
                                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>No hay reportes activos por el momento.</p>
                            ) : (
                                <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                                    {lostPets.map(pet => {
                                        const isLost = pet.report_type === 'lost'
                                        const badgeColor = isLost ? '#ef4444' : G1
                                        const badgeBg = isLost ? 'rgba(239,68,68,0.15)' : 'rgba(76,175,80,0.15)'
                                        const badgeText = isLost ? '🔍 SE BUSCA' : '📍 ENCONTRADA'
                                        return (
                                            <div key={pet.id} onClick={() => setSelectedPet(pet)} style={{ background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${isLost ? 'rgba(239,68,68,0.2)' : 'rgba(76,175,80,0.2)'}`, borderRadius: 18, overflow: 'hidden', cursor: 'pointer', transition: 'transform .2s' }}
                                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                                <div style={{ height: 180, overflow: 'hidden', position: 'relative' }}>
                                                    <img src={pet.photo_url} alt="Mascota" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%', filter: isLost ? 'grayscale(40%)' : 'none' }} />
                                                    <div style={{ position: 'absolute', top: 10, left: 10, background: badgeBg, color: badgeColor, fontSize: 10, fontWeight: 900, letterSpacing: 1, padding: '4px 10px', borderRadius: 6, border: `1px solid ${badgeColor}`, textTransform: 'uppercase', backdropFilter: 'blur(8px)' }}>{badgeText}</div>
                                                    <div style={{ position: 'absolute', top: 10, right: 10, background: DARK, color: G2, fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 99, border: `1px solid rgba(76,175,80,0.3)` }}>{pet.days_left}d restantes</div>
                                                </div>
                                                <div style={{ padding: '14px 16px' }}>
                                                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, marginBottom: 12 }}>
                                                        {pet.description.length > 100 ? pet.description.slice(0, 100) + '...' : pet.description}
                                                    </p>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                                                            {pet.contact_type === 'phone' ? '📱' : pet.contact_type === 'home_phone' ? '📞' : '✉️'} {pet.contact_value}
                                                        </div>
                                                        {pet.contact_type === 'email' ? (
                                                            <a href={`mailto:${pet.contact_value}`} onClick={e => e.stopPropagation()} style={{ background: 'rgba(107,202,255,0.1)', border: '1px solid rgba(107,202,255,0.3)', color: '#6bcaff', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8, textDecoration: 'none', fontFamily: FONT }}>✉️ Contactar</a>
                                                        ) : (
                                                            <a href={`https://wa.me/54${pet.contact_value.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8, textDecoration: 'none', fontFamily: FONT }}>💬 Contactar</a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
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

            {/* MODAL MASCOTA */}
            {selectedPet && (
                <div onClick={() => setSelectedPet(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div onClick={e => e.stopPropagation()} style={{ background: '#162032', borderRadius: 24, overflow: 'hidden', maxWidth: 480, width: '100%', border: `2px solid ${selectedPet.report_type === 'lost' ? 'rgba(239,68,68,0.4)' : 'rgba(76,175,80,0.4)'}`, boxShadow: '0 32px 80px rgba(0,0,0,0.6)', animation: 'cardIn 0.3s cubic-bezier(.22,.68,0,1.2) both' }}>
                        <div style={{ position: 'relative', height: 280 }}>
                            <img src={selectedPet.photo_url} alt="Mascota" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7))' }} />
                            <div style={{ position: 'absolute', top: 14, left: 14, background: selectedPet.report_type === 'lost' ? 'rgba(239,68,68,0.9)' : 'rgba(76,175,80,0.9)', color: '#fff', fontSize: 11, fontWeight: 900, letterSpacing: 2, padding: '6px 14px', borderRadius: 6, textTransform: 'uppercase' }}>
                                {selectedPet.report_type === 'lost' ? '🔍 SE BUSCA' : '📍 ENCONTRADA'}
                            </div>
                            <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.6)', color: '#66BB6A', fontSize: 11, fontWeight: 800, padding: '5px 12px', borderRadius: 99, border: '1px solid rgba(76,175,80,0.3)' }}>{selectedPet.days_left}d restantes</div>
                            <button onClick={() => setSelectedPet(null)} style={{ position: 'absolute', bottom: 14, right: 14, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        </div>
                        <div style={{ padding: '20px 24px 24px' }}>
                            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 20 }}>{selectedPet.description}</p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                                    {selectedPet.contact_type === 'phone' ? '📱' : selectedPet.contact_type === 'home_phone' ? '📞' : '✉️'} {selectedPet.contact_value}
                                </div>
                                {selectedPet.contact_type === 'email' ? (
                                    <a href={`mailto:${selectedPet.contact_value}`} style={{ background: 'rgba(107,202,255,0.15)', border: '1px solid rgba(107,202,255,0.4)', color: '#6bcaff', fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontFamily: FONT }}>✉️ Contactar por email</a>
                                ) : (
                                    <a href={`https://wa.me/54${selectedPet.contact_value.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.4)', color: '#25D366', fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontFamily: FONT }}>💬 Contactar por WhatsApp</a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
