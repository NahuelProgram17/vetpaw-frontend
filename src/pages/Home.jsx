import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useRef, useEffect } from 'react'
import api from '../services/api'

// ── Paleta del logo ──────────────────────────────────
const G1 = '#4CAF50'   // verde logo
const G2 = '#66BB6A'   // verde claro
const O1 = '#FF9800'   // naranja logo
const O2 = '#FFB74D'   // naranja claro
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
            formData.append('photo', fotoMascota); formData.append('description', descripcionMascota)
            formData.append('contact_type', contactType); formData.append('contact_value', contactValue)
            await api.post('/lost-pets/create/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            setReporteEnviado(true); setFotoMascota(null); setFotoPreview(null); setDescripcionMascota(''); setContactValue('')
            fetchLostPets(); setTimeout(() => setReporteEnviado(false), 5000)
        } catch (e) { setErrorEnvio('Hubo un error al publicar. Intentá de nuevo.') }
        finally { setEnviando(false) }
    }

    const handleReportar = async (id) => {
        if (reportados[id]) return
        try {
            await api.post(`/lost-pets/${id}/report/`)
            setReportados(prev => ({ ...prev, [id]: true }))
            setLostPets(prev => prev.map(p => p.id === id ? { ...p, report_count: p.report_count + 1 } : p))
        } catch (e) { console.error('Error al reportar', e) }
    }

    return (
        <>
            {/* Google Font */}
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

            <div style={{ minHeight: '100vh', background: DARK, fontFamily: FONT }}>

                {/* ── HERO ── */}
                <div style={{
                    position: 'relative', minHeight: 520, overflow: 'hidden',
                    display: 'flex', alignItems: 'center',
                    backgroundImage: 'url(/hero.jpg)', backgroundSize: 'cover', backgroundPosition: 'center 35%',
                }}>
                    {/* Overlay degradado con colores del logo */}
                    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(120deg, rgba(15,25,35,0.92) 0%, rgba(15,25,35,0.75) 50%, rgba(255,152,0,0.25) 100%)` }} />
                    {/* Glow naranja decorativo */}
                    <div style={{ position: 'absolute', top: -100, right: -100, width: 500, height: 500, background: `radial-gradient(circle, rgba(255,152,0,0.15) 0%, transparent 70%)`, pointerEvents: 'none' }} />
                    {/* Glow verde decorativo */}
                    <div style={{ position: 'absolute', bottom: -80, left: 300, width: 400, height: 400, background: `radial-gradient(circle, rgba(76,175,80,0.12) 0%, transparent 70%)`, pointerEvents: 'none' }} />

                    <div style={{ position: 'relative', zIndex: 2, padding: '56px 56px', maxWidth: 580 }}>
                        {/* Badge */}
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            background: 'rgba(76,175,80,0.15)', border: `1px solid rgba(76,175,80,0.4)`,
                            color: G2, fontSize: 12, fontWeight: 700, padding: '7px 16px', borderRadius: 99, marginBottom: 24,
                            letterSpacing: 0.5,
                        }}>
                            <span style={{ width: 7, height: 7, background: G1, borderRadius: '50%', display: 'inline-block', boxShadow: `0 0 8px ${G1}` }} />
                            La app veterinaria de Argentina
                        </div>

                        <h1 style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 18, letterSpacing: -1.5 }}>
                            El historial de tu{' '}
                            <span style={{ background: `linear-gradient(135deg, ${G1}, ${O1})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                mascota
                            </span>
                            ,<br />siempre con vos
                        </h1>

                        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, lineHeight: 1.75, marginBottom: 32, fontWeight: 400 }}>
                            Expediente digital, turnos online y tu veterinaria de confianza.<br />Sin papeles, sin llamadas.
                        </p>

                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                            {user ? (
                                <Link to={user.role === 'clinic' ? '/clinic/dashboard' : '/dashboard'}
                                    style={{ background: `linear-gradient(135deg, ${G1}, ${O1})`, color: '#fff', fontWeight: 800, fontSize: 15, padding: '14px 28px', borderRadius: 14, textDecoration: 'none', boxShadow: `0 6px 24px rgba(76,175,80,0.35)` }}>
                                    Ir a mi panel →
                                </Link>
                            ) : (
                                <>
                                    <Link to="/register"
                                        style={{ background: `linear-gradient(135deg, ${G1}, ${O1})`, color: '#fff', fontWeight: 800, fontSize: 15, padding: '14px 28px', borderRadius: 14, textDecoration: 'none', boxShadow: `0 6px 24px rgba(76,175,80,0.35)` }}>
                                        Crear cuenta gratis
                                    </Link>
                                    <Link to="/register?role=vet"
                                        style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 15, fontWeight: 600, padding: '14px 28px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.18)', textDecoration: 'none', backdropFilter: 'blur(8px)' }}>
                                        Soy veterinario/a
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── STATS ── */}
                <div style={{ background: DARK2, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
                    {[
                        { n: '+200', l: 'Veterinarias', color: G1 },
                        { n: '+5.000', l: 'Mascotas registradas', color: O1 },
                        { n: '24/7', l: 'Acceso al historial', color: G1 },
                        { n: '100%', l: 'Gratis para dueños', color: O1 },
                    ].map((s, i) => (
                        <div key={i} style={{ padding: '20px 0', textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                            <div style={{ fontSize: 24, fontWeight: 900, color: s.color, fontFamily: FONT }}>{s.n}</div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4, fontWeight: 500 }}>{s.l}</div>
                        </div>
                    ))}
                </div>

                {/* ── BANNER PUBLICITARIO ── */}
                <div style={{ padding: '28px 40px' }}>
                    <div style={{
                        borderRadius: 24, overflow: 'hidden', position: 'relative',
                        background: `linear-gradient(120deg, #0f1923 0%, #1a1060 50%, #3d1a00 100%)`,
                        boxShadow: `0 8px 48px rgba(255,152,0,0.2)`,
                        minHeight: 200, display: 'flex',
                        border: '1px solid rgba(255,152,0,0.15)',
                    }}>
                        {/* Foto */}
                        <div style={{ width: 260, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                            <img src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=500&q=85" alt="Perro"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 40%, rgba(26,16,96,0.9))' }} />
                        </div>

                        {/* Info izquierda */}
                        <div style={{ flex: 1, padding: '32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 3, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 10 }}>Publicidad destacada</span>
                            <h3 style={{ fontSize: 30, fontWeight: 900, color: '#fff', lineHeight: 1.05, marginBottom: 8, fontFamily: FONT, animation: 'slideLeft 0.6s ease both' }}>PipetaPlus Pro</h3>
                            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 6, fontWeight: 600 }}>Protección antiparasitaria total</p>
                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 22 }}>Para perros y gatos · Efecto 3 meses · Sin receta</p>
                            <button style={{
                                background: `linear-gradient(135deg, ${G1}, ${O1})`, color: '#fff', fontWeight: 800, fontSize: 13,
                                padding: '12px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
                                alignSelf: 'flex-start', boxShadow: `0 4px 20px rgba(76,175,80,0.35)`, fontFamily: FONT,
                                animation: 'btnBounce 0.6s 0.4s cubic-bezier(.22,.68,0,1.4) both',
                            }}>Comprar ahora</button>
                        </div>

                        {/* Centro — beneficios */}
                        <div style={{
                            width: 220, flexShrink: 0,
                            display: 'flex', flexDirection: 'column', justifyContent: 'center',
                            padding: '24px 20px', gap: 12,
                            borderLeft: '1px solid rgba(255,255,255,0.07)',
                            borderRight: '1px solid rgba(255,255,255,0.07)',
                        }}>
                            {[
                                { icon: '✅', text: 'Elimina pulgas y garrapatas' },
                                { icon: '🐶', text: 'Para perros y gatos' },
                                { icon: '⏱️', text: 'Efecto hasta 3 meses' },
                                { icon: '🚫', text: 'Sin receta médica' },
                                { icon: '🚚', text: 'Envío gratis a todo el país' },
                            ].map((b, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, animation: `fadeUp 0.5s ${0.1 * i + 0.3}s ease both` }}>
                                    <span style={{ fontSize: 16 }}>{b.icon}</span>
                                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>{b.text}</span>
                                </div>
                            ))}
                        </div>

                        {/* Precio animado */}
                        <div style={{
                            width: 180, flexShrink: 0,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            padding: '24px 16px', gap: 6,
                            background: 'rgba(255,255,255,0.03)',
                        }}>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textDecoration: 'line-through' }}>$14.000</span>
                            <div style={{
                                fontSize: 42, fontWeight: 900, color: O1, lineHeight: 1, fontFamily: FONT,
                                animation: 'pricePop 0.6s 0.2s cubic-bezier(.22,.68,0,1.4) both, pricePulse 2s 1s ease-in-out infinite',
                            }}>$10.000</div>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>precio especial</span>
                            <div style={{ marginTop: 8, background: O1, color: '#fff', fontSize: 11, fontWeight: 900, padding: '5px 14px', borderRadius: 99 }}>🔥 OFERTA</div>
                            <style>{`
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
            `}</style>
                        </div>
                    </div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 8, textAlign: 'right' }}>Publicidad · VetPaw Ads</p>
                </div>

                {/* ── FEATURES ── */}
                <div style={{ padding: '4px 40px 28px' }}>
                    <h2 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 2 }}>¿Qué podés hacer?</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                        {[
                            { bg: 'rgba(76,175,80,0.08)', border: 'rgba(76,175,80,0.25)', iconBg: 'rgba(76,175,80,0.15)', icon: '📋', title: 'Expediente digital', text: 'Vacunas, alergias y toda la historia clínica en un lugar seguro.', accent: G1 },
                            { bg: 'rgba(255,152,0,0.08)', border: 'rgba(255,152,0,0.25)', iconBg: 'rgba(255,152,0,0.15)', icon: '📅', title: 'Turnos online', text: 'Pedí turno con tu veterinaria sin llamar, en cualquier momento.', accent: O1 },
                            { bg: 'rgba(107,202,255,0.08)', border: 'rgba(107,202,255,0.2)', iconBg: 'rgba(107,202,255,0.12)', icon: '🔒', title: 'Vos controlás todo', text: 'Solo las veterinarias que elegís pueden ver el historial.', accent: '#6bcaff' },
                        ].map((f, i) => (
                            <div key={i} style={{
                                background: f.bg, border: `1.5px solid ${f.border}`, borderRadius: 20, padding: 22,
                                transition: 'transform .2s, box-shadow .2s',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${f.border}` }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                            >
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: f.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14 }}>{f.icon}</div>
                                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 6, fontFamily: FONT }}>{f.title}</h3>
                                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, fontWeight: 400 }}>{f.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── SENASA ── */}
                <div style={{ padding: '4px 40px 28px' }}>
                    <a href="https://mascotas.senasa.gob.ar/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #0f172a 0%, #0c2a4a 100%)',
                            borderRadius: 20, padding: '24px 28px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            border: '1.5px solid rgba(107,202,255,0.15)',
                            transition: 'transform .2s, border-color .2s', cursor: 'pointer',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(107,202,255,0.4)' }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(107,202,255,0.15)' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                <div style={{ width: 56, height: 56, borderRadius: 16, flexShrink: 0, background: 'rgba(107,202,255,0.1)', border: '1.5px solid rgba(107,202,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>✈️</div>
                                <div>
                                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: '#6bcaff', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>SENASA · Trámite oficial</span>
                                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4, fontFamily: FONT }}>¿Viajás con tu mascota?</h3>
                                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>Consultá los requisitos oficiales para viajar dentro del país o al exterior.</p>
                                </div>
                            </div>
                            <div style={{ flexShrink: 0, marginLeft: 20, background: '#6bcaff', color: '#0f172a', fontWeight: 800, fontSize: 12, padding: '10px 18px', borderRadius: 10, whiteSpace: 'nowrap', fontFamily: FONT }}>
                                Ver requisitos
                            </div>
                        </div>
                    </a>
                </div>

                {/* ── VETERINARIAS DESTACADAS ── */}
                <div style={{ padding: '4px 40px 28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: FONT }}>🏥 Veterinarias destacadas</h2>
                        <Link to="/clinics" style={{ fontSize: 13, color: G2, fontWeight: 700, textDecoration: 'none' }}>Ver todas →</Link>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
                        {veterinariasDestacadas.map((v, i) => (
                            <div key={i} style={{
                                borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
                                boxShadow: v.destacada ? `0 6px 32px rgba(76,175,80,0.2)` : '0 2px 12px rgba(0,0,0,0.3)',
                                border: v.destacada ? `2px solid rgba(76,175,80,0.35)` : '1.5px solid rgba(255,255,255,0.07)',
                                background: DARK2, transition: 'transform .2s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
                                    <img src={v.img} alt={v.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.7))' }} />
                                    {v.destacada && (
                                        <span style={{
                                            position: 'absolute', top: 12, right: 12,
                                            background: `linear-gradient(135deg, ${G1}, ${O1})`,
                                            color: '#fff', fontSize: 11, fontWeight: 800,
                                            padding: '5px 12px', borderRadius: 99,
                                            boxShadow: `0 2px 12px rgba(76,175,80,0.4)`,
                                        }}>⭐ Destacada</span>
                                    )}
                                    <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
                                        <h4 style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 2, fontFamily: FONT }}>{v.nombre}</h4>
                                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>📍 {v.localidad}</p>
                                    </div>
                                </div>
                                <div style={{ padding: '14px 16px 18px' }}>
                                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 14, fontWeight: 500 }}>{v.especialidad}</p>
                                    <Link to="/register" style={{
                                        display: 'block', textAlign: 'center', fontSize: 13, fontWeight: 800, color: '#fff',
                                        background: v.destacada ? `linear-gradient(135deg, ${G1}, ${O1})` : 'rgba(255,255,255,0.08)',
                                        padding: '11px', borderRadius: 12, textDecoration: 'none', fontFamily: FONT,
                                        boxShadow: v.destacada ? `0 4px 16px rgba(76,175,80,0.3)` : 'none',
                                        border: v.destacada ? 'none' : '1px solid rgba(255,255,255,0.12)',
                                    }}>
                                        Sacar turno
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── SABÍAS QUE ── */}
                <div style={{ padding: '4px 40px 28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: FONT }}>💡 Sabías que...</h2>
                        <Link to="/tips" style={{ fontSize: 13, color: G2, fontWeight: 700, textDecoration: 'none' }}>Ver más →</Link>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                        {curiosidades.map((c, i) => (
                            <div key={i} style={{
                                background: DARK2, border: '1.5px solid rgba(255,255,255,0.07)', borderRadius: 20,
                                overflow: 'hidden', cursor: 'pointer', transition: 'transform .2s, border-color .2s',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = c.tagColor }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
                            >
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

                {/* ── MASCOTAS PERDIDAS ── */}
                <div style={{ padding: '4px 40px 28px' }}>
                    <div style={{ background: DARK2, border: '1.5px solid rgba(255,255,255,0.07)', borderRadius: 24, overflow: 'hidden' }}>

                        {/* Header */}
                        <div style={{ background: `linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 100%)`, padding: '26px 32px', position: 'relative', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, background: `rgba(76,175,80,0.1)`, borderRadius: '50%' }} />
                            <div style={{ position: 'absolute', bottom: -30, right: 80, width: 100, height: 100, background: `rgba(255,152,0,0.08)`, borderRadius: '50%' }} />
                            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 6, position: 'relative', zIndex: 1, fontFamily: FONT }}>🐾 Mascotas perdidas</h2>
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', position: 'relative', zIndex: 1 }}>¿Encontraste una mascota? Publicalo y ayudá a que vuelva a casa.</p>
                        </div>

                        {/* Formulario */}
                        <div style={{ padding: '28px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            {reporteEnviado ? (
                                <div style={{ background: 'rgba(76,175,80,0.1)', border: `1.5px solid rgba(76,175,80,0.3)`, borderRadius: 16, padding: '24px', textAlign: 'center' }}>
                                    <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
                                    <h3 style={{ fontWeight: 800, color: G2, fontSize: 16, fontFamily: FONT }}>¡Reporte publicado!</h3>
                                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>Gracias por ayudar. Esperamos que esta mascota vuelva a casa pronto.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleReporte} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                    {/* Foto */}
                                    <div>
                                        <label style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 10, fontFamily: FONT }}>
                                            Foto de la mascota <span style={{ color: O1 }}>*</span>
                                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 400, marginLeft: 8 }}>Solo JPG</span>
                                        </label>
                                        {fotoPreview ? (
                                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                                <img src={fotoPreview} alt="Preview" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 14, border: `2px solid ${G1}` }} />
                                                <button type="button" onClick={() => { setFotoPreview(null); setFotoMascota(null) }}
                                                    style={{ position: 'absolute', top: -8, right: -8, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: 12, fontWeight: 900 }}>✕</button>
                                            </div>
                                        ) : (
                                            <div onClick={() => fileRef.current.click()}
                                                style={{ border: '2px dashed rgba(255,255,255,0.15)', borderRadius: 16, padding: '32px', textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', transition: 'border-color .2s' }}
                                                onMouseEnter={e => e.currentTarget.style.borderColor = G1}
                                                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}>
                                                <div style={{ fontSize: 36, marginBottom: 10 }}>📷</div>
                                                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Clic para subir foto JPG</p>
                                                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>Máx. 5MB</p>
                                            </div>
                                        )}
                                        <input ref={fileRef} type="file" accept=".jpg,.jpeg" onChange={handleFoto} style={{ display: 'none' }} />
                                    </div>

                                    {/* Descripción */}
                                    <div>
                                        <label style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 10, fontFamily: FONT }}>
                                            ¿Dónde y cuándo la encontraste? <span style={{ color: O1 }}>*</span>
                                        </label>
                                        <textarea value={descripcionMascota} onChange={e => setDescripcionMascota(e.target.value)}
                                            placeholder="Ej: Encontré este perro en la calle Martín Lazarte, barrio Suárez, Moreno. Es macho, color marrón, sin collar."
                                            rows={3}
                                            style={{ width: '100%', padding: '13px 16px', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 13, color: '#fff', resize: 'vertical', fontFamily: FONT, outline: 'none', lineHeight: 1.65, boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)' }}
                                            onFocus={e => e.target.style.borderColor = G1}
                                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                    </div>

                                    {/* Contacto */}
                                    <div>
                                        <label style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 10, fontFamily: FONT }}>
                                            Datos de contacto <span style={{ color: O1 }}>*</span>
                                        </label>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <select value={contactType} onChange={e => setContactType(e.target.value)}
                                                style={{ padding: '12px 14px', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 13, color: '#fff', background: 'rgba(255,255,255,0.07)', outline: 'none', cursor: 'pointer', fontFamily: FONT }}>
                                                <option value="phone" style={{ background: DARK2 }}>📱 Celular</option>
                                                <option value="home_phone" style={{ background: DARK2 }}>📞 Tel. casa</option>
                                                <option value="email" style={{ background: DARK2 }}>✉️ Email</option>
                                            </select>
                                            <input value={contactValue} onChange={e => setContactValue(e.target.value)}
                                                placeholder={contactType === 'email' ? 'tucorreo@email.com' : 'Ej: 11 2345-6789'}
                                                style={{ flex: 1, padding: '12px 16px', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 13, color: '#fff', outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', fontFamily: FONT }}
                                                onFocus={e => e.target.style.borderColor = G1}
                                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                        </div>
                                    </div>

                                    {errorEnvio && <p style={{ color: '#f87171', fontSize: 12, margin: 0, fontWeight: 600 }}>{errorEnvio}</p>}

                                    <button type="submit" disabled={enviando} style={{
                                        background: enviando ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${G1}, ${O1})`,
                                        color: '#fff', fontWeight: 800, fontSize: 14,
                                        padding: '15px', borderRadius: 14, border: 'none',
                                        cursor: enviando ? 'not-allowed' : 'pointer',
                                        boxShadow: enviando ? 'none' : `0 6px 24px rgba(76,175,80,0.3)`,
                                        fontFamily: FONT, letterSpacing: 0.3,
                                    }}>
                                        {enviando ? 'Publicando...' : '🐾 Publicar reporte de mascota perdida'}
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Muro */}
                        <div style={{ padding: '24px 32px' }}>
                            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 18, fontFamily: FONT }}>
                                📋 Reportes activos <span style={{ color: G1 }}>({lostPets.length})</span>
                            </h3>
                            {cargandoMuro ? (
                                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Cargando reportes...</p>
                            ) : lostPets.length === 0 ? (
                                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>No hay reportes activos por el momento.</p>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                                    {lostPets.map(pet => (
                                        <div key={pet.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 18, overflow: 'hidden' }}>
                                            <div style={{ height: 180, overflow: 'hidden', position: 'relative' }}>
                                                <img src={pet.photo_url} alt="Mascota perdida" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <div style={{ position: 'absolute', top: 10, right: 10, background: DARK, color: G2, fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 99, border: `1px solid rgba(76,175,80,0.3)` }}>
                                                    {pet.days_left}d restantes
                                                </div>
                                            </div>
                                            <div style={{ padding: '14px 16px' }}>
                                                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, marginBottom: 12 }}>
                                                    {pet.description.length > 100 ? pet.description.slice(0, 100) + '...' : pet.description}
                                                </p>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                                                        {pet.contact_type === 'phone' ? '📱' : pet.contact_type === 'home_phone' ? '📞' : '✉️'} {pet.contact_value}
                                                    </div>
                                                    <button onClick={() => handleReportar(pet.id)}
                                                        style={{
                                                            background: reportados[pet.id] ? 'rgba(76,175,80,0.1)' : 'rgba(255,152,0,0.1)',
                                                            border: `1px solid ${reportados[pet.id] ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)'}`,
                                                            color: reportados[pet.id] ? G2 : O2,
                                                            fontSize: 11, fontWeight: 700, padding: '5px 10px',
                                                            borderRadius: 8, cursor: reportados[pet.id] ? 'default' : 'pointer', fontFamily: FONT,
                                                        }}>
                                                        {reportados[pet.id] ? '✓ Reportado' : '⚠️ Reportar'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── BANNER ANUNCIANTES ── */}
                <div style={{ padding: '4px 40px 28px' }}>
                    <div style={{
                        background: `linear-gradient(135deg, rgba(76,175,80,0.12) 0%, rgba(255,152,0,0.12) 100%)`,
                        border: `1.5px solid rgba(76,175,80,0.2)`,
                        borderRadius: 24, padding: '32px 36px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <div>
                            <h3 style={{ color: '#fff', fontWeight: 900, fontSize: 20, marginBottom: 8, fontFamily: FONT }}>¿Tenés una marca de productos para mascotas?</h3>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 20, lineHeight: 1.65 }}>
                                Miles de dueños buscan lo mejor para sus animales cada día. Hacé que te encuentren primero en VetPaw.
                            </p>
                            <div style={{ display: 'flex', gap: 28 }}>
                                {[{ n: '+5.000', l: 'usuarios activos', c: G1 }, { n: '+200', l: 'veterinarias', c: O1 }, { n: '100%', l: 'audiencia target', c: G1 }].map((s, i) => (
                                    <div key={i}>
                                        <p style={{ fontWeight: 900, fontSize: 20, color: s.c, fontFamily: FONT }}>{s.n}</p>
                                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{s.l}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', flexShrink: 0, marginLeft: 32 }}>
                            <div style={{ fontSize: 56, marginBottom: 14 }}>📣</div>
                            <button style={{
                                background: `linear-gradient(135deg, ${G1}, ${O1})`,
                                color: '#fff', fontWeight: 800, fontSize: 13, padding: '13px 24px',
                                borderRadius: 14, border: 'none', cursor: 'pointer', fontFamily: FONT,
                                boxShadow: `0 6px 24px rgba(76,175,80,0.3)`,
                            }}>
                                Quiero anunciar
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── FOOTER ── */}
                <footer style={{ background: '#080f16', padding: '32px 40px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                        <img src="/logo_vetpaw.png" alt="VetPaw" style={{ height: '100px', width: 'auto' }} />
                        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, textAlign: 'center', maxWidth: 300, lineHeight: 1.6 }}>
                            La app veterinaria de Argentina.<br />Tu mascota merece lo mejor.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 28, flexWrap: 'wrap' }}>
                            {['Términos', 'Privacidad', 'Sumar mi veterinaria', 'Anunciar en VetPaw', 'Contacto', 'Blog'].map(l => (
                                <span key={l} style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, cursor: 'pointer', fontWeight: 500, transition: 'color .2s' }}
                                    onMouseEnter={e => e.target.style.color = G2}
                                    onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.3)'}
                                >{l}</span>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                            {[{ icon: '📘', label: 'Facebook' }, { icon: '📸', label: 'Instagram' }, { icon: '🐦', label: 'Twitter' }].map(s => (
                                <div key={s.label} style={{
                                    width: 38, height: 38, borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, cursor: 'pointer',
                                    transition: 'all .2s',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(76,175,80,0.15)'; e.currentTarget.style.borderColor = 'rgba(76,175,80,0.3)' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                                >{s.icon}</div>
                            ))}
                        </div>
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 18, width: '100%', textAlign: 'center' }}>
                            <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>
                                © 2026 VetPaw · Todos los derechos reservados · Hecho con ❤️ en Argentina
                            </p>
                        </div>
                    </div>
                </footer>

            </div>
        </>
    )
}
