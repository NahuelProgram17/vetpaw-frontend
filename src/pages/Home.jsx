import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useRef } from 'react'

const veterinariasDestacadas = [
    { nombre: 'Clínica Vida Animal', localidad: 'Palermo, CABA', especialidad: 'Clínica general · Cirugía', img: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&q=80', destacada: true },
    { nombre: 'VetSur 24hs', localidad: 'Lomas de Zamora, GBA', especialidad: 'Urgencias · Guardia permanente', img: 'https://images.unsplash.com/photo-1612531385446-f7e6d131e1d0?w=800&q=80', destacada: true },
    { nombre: 'Centro Veterinario del Norte', localidad: 'San Isidro, GBA', especialidad: 'Dermatología · Odontología', img: 'https://images.unsplash.com/photo-1559000357-f6b52ddfbe37?w=800&q=80', destacada: false },
]

const curiosidades = [
    {
        tag: 'Perros', tagColor: '#ff6b6b',
        img: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80',
        title: 'El olfato canino es 40 veces más poderoso que el humano',
        text: 'Tienen 300 millones de receptores olfativos. Por eso los usan en detección médica.',
    },
    {
        tag: 'Gatos', tagColor: '#6bcaff',
        img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80',
        title: 'Los gatos ronronean tanto de felicidad como de estrés',
        text: 'La frecuencia del ronroneo (25-150 Hz) ayuda a regenerar tejidos óseos.',
    },
    {
        tag: 'Conejos', tagColor: '#ffd93d',
        img: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=800&q=80',
        title: 'Los conejos no pueden vomitar',
        text: 'Su digestión es unidireccional. Una mala dieta puede ser fatal en pocas horas.',
    },
]

export default function Home() {
    const { user } = useAuth()
    const [fotoMascota, setFotoMascota] = useState(null)
    const [fotoPreview, setFotoPreview] = useState(null)
    const [descripcionMascota, setDescripcionMascota] = useState('')
    const [reporteEnviado, setReporteEnviado] = useState(false)
    const fileRef = useRef()

    const handleFoto = (e) => {
        const file = e.target.files[0]
        if (!file) return
        if (!file.type.includes('jpeg') && !file.name.endsWith('.jpg')) {
            alert('Solo se aceptan archivos JPG.')
            return
        }
        setFotoMascota(file)
        setFotoPreview(URL.createObjectURL(file))
    }

    const handleReporte = (e) => {
        e.preventDefault()
        if (!fotoMascota || !descripcionMascota.trim()) {
            alert('Por favor agregá una foto y una descripción.')
            return
        }
        setReporteEnviado(true)
        setFotoMascota(null)
        setFotoPreview(null)
        setDescripcionMascota('')
        setTimeout(() => setReporteEnviado(false), 5000)
    }

    return (
        <div style={{ minHeight: '100vh', background: '#fafaf8', fontFamily: "'Nunito', sans-serif" }}>

            {/* ── HERO ── */}
            <div style={{
                position: 'relative',
                minHeight: 440,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                backgroundImage: 'url(/hero.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center 40%',
                backgroundColor: '#1a2a1a',
            }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,30,0.38)' }} />
                <div style={{ position: 'relative', zIndex: 2, padding: '48px 48px 48px', maxWidth: 520 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: 'rgba(255,107,107,0.18)', border: '1px solid rgba(255,107,107,0.4)',
                        color: '#ff9e9e', fontSize: 12, padding: '6px 14px', borderRadius: 99, marginBottom: 16,
                    }}>
                        <span style={{ width: 6, height: 6, background: '#ff6b6b', borderRadius: '50%', display: 'inline-block' }} />
                        La app veterinaria de Argentina
                    </div>
                    <h1 style={{ fontSize: 42, fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: 14, letterSpacing: -1 }}>
                        El historial de tu{' '}
                        <em style={{ fontStyle: 'normal', color: '#ffd93d' }}>mascota</em>,
                        <br />siempre con vos
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
                        Expediente digital, turnos online y tu veterinaria de confianza.<br />Sin papeles, sin llamadas.
                    </p>
                    <div style={{ display: 'flex', gap: 12 }}>
                        {user ? (
                            <Link to={user.role === 'vet' ? '/vet/dashboard' : '/dashboard'}
                                style={{ background: '#ffd93d', color: '#1a1a2e', fontWeight: 800, fontSize: 14, padding: '12px 22px', borderRadius: 14, textDecoration: 'none' }}>
                                Ir a mi panel →
                            </Link>
                        ) : (
                            <>
                                <Link to="/register"
                                    style={{ background: '#ffd93d', color: '#1a1a2e', fontWeight: 800, fontSize: 14, padding: '12px 22px', borderRadius: 14, textDecoration: 'none' }}>
                                    Crear cuenta gratis
                                </Link>
                                <Link to="/register?role=vet"
                                    style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 14, padding: '12px 22px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.22)', textDecoration: 'none' }}>
                                    Soy veterinario/a
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ── STATS ── */}
            <div style={{ background: '#fff', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: '1px solid #f0ede8' }}>
                {[
                    { n: '+200', l: 'Veterinarias' },
                    { n: '+5.000', l: 'Mascotas registradas' },
                    { n: '24/7', l: 'Acceso al historial' },
                    { n: '100%', l: 'Gratis para dueños' },
                ].map((s, i) => (
                    <div key={i} style={{ padding: '16px 0', textAlign: 'center', borderRight: i < 3 ? '1px solid #f0ede8' : 'none' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>{s.n}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>{s.l}</div>
                    </div>
                ))}
            </div>

            {/* ── BANNER PUBLICITARIO ── */}
            <div style={{ padding: '24px 32px' }}>
                <div style={{
                    borderRadius: 22, overflow: 'hidden', position: 'relative',
                    background: 'linear-gradient(120deg, #1a1a2e 0%, #2d1060 40%, #ff4e00 100%)',
                    boxShadow: '0 8px 40px rgba(255,78,0,0.3)',
                    minHeight: 200,
                    display: 'flex',
                }}>
                    {/* Foto perro */}
                    <div style={{ width: 260, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                        <img
                            src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=500&q=85"
                            alt="Perro"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
                        />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 50%, rgba(45,16,96,0.8))' }} />
                    </div>

                    {/* Contenido central */}
                    <div style={{ flex: 1, padding: '28px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 3, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', marginBottom: 8 }}>
                            Publicidad destacada
                        </span>
                        <h3 style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1.05, marginBottom: 8 }}>
                            PipetaPlus Pro
                        </h3>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 6, fontWeight: 600 }}>
                            Protección antiparasitaria total
                        </p>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 20 }}>
                            Para perros y gatos · Efecto 3 meses · Sin receta
                        </p>
                        <button style={{
                            background: '#ffd93d', color: '#1a1a2e', fontWeight: 900, fontSize: 13,
                            padding: '12px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
                            alignSelf: 'flex-start', boxShadow: '0 4px 20px rgba(255,217,61,0.4)',
                        }}>
                            Comprar ahora →
                        </button>
                    </div>

                    {/* Precio derecha */}
                    <div style={{
                        width: 180, flexShrink: 0,
                        background: 'rgba(255,255,255,0.05)',
                        borderLeft: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        padding: '24px 16px', gap: 6,
                    }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }}>$14.000</span>
                        <div style={{ fontSize: 48, fontWeight: 900, color: '#ffd93d', lineHeight: 1 }}>$10k</div>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>precio especial</span>
                        <div style={{
                            marginTop: 8, background: '#ff4e00', color: '#fff',
                            fontSize: 11, fontWeight: 900, padding: '5px 14px',
                            borderRadius: 99, letterSpacing: 1,
                        }}>🔥 OFERTA</div>
                    </div>
                </div>
                <p style={{ fontSize: 11, color: '#c4bfb8', marginTop: 6, textAlign: 'right' }}>Publicidad · VetPaw Ads</p>
            </div>

            {/* ── FEATURES ── */}
            <div style={{ padding: '8px 32px 24px' }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 16 }}>¿Qué podés hacer?</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                    {[
                        { bg: '#fff8f0', border: '#ffe4c8', icon: '📋', title: 'Expediente digital', text: 'Vacunas, alergias y toda la historia clínica en un lugar.' },
                        { bg: '#fffbeb', border: '#fde68a', icon: '📅', title: 'Turnos online', text: 'Pedí turno con tu veterinaria sin llamar.' },
                        { bg: '#f0fdf4', border: '#bbf7d0', icon: '🔒', title: 'Vos controlás todo', text: 'Solo las veterinarias que elegís ven el historial.' },
                    ].map((f, i) => (
                        <div key={i} style={{ background: f.bg, border: `1.5px solid ${f.border}`, borderRadius: 18, padding: 20 }}>
                            <div style={{ width: 42, height: 42, borderRadius: 12, background: f.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 12 }}>{f.icon}</div>
                            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e', marginBottom: 4 }}>{f.title}</h3>
                            <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>{f.text}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── VETERINARIAS DESTACADAS ── */}
            <div style={{ padding: '8px 32px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>🏥 Veterinarias destacadas</h2>
                    <Link to="/clinics" style={{ fontSize: 12, color: '#ff6b6b', fontWeight: 700, textDecoration: 'none' }}>Ver todas →</Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                    {veterinariasDestacadas.map((v, i) => (
                        <div key={i} style={{
                            borderRadius: 20, overflow: 'hidden', position: 'relative', cursor: 'pointer',
                            boxShadow: v.destacada ? '0 6px 28px rgba(255,107,107,0.22)' : '0 2px 12px rgba(0,0,0,0.07)',
                            border: v.destacada ? '2px solid rgba(255,107,107,0.4)' : '1.5px solid #f0ede8',
                            background: '#fff', transition: 'transform .2s',
                        }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
                                <img src={v.img} alt={v.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.6))' }} />
                                {v.destacada && (
                                    <span style={{
                                        position: 'absolute', top: 12, right: 12,
                                        background: 'linear-gradient(135deg, #ff6b6b, #ff4a4a)',
                                        color: '#fff', fontSize: 11, fontWeight: 900,
                                        padding: '5px 12px', borderRadius: 99,
                                        boxShadow: '0 2px 10px rgba(255,107,107,0.5)',
                                    }}>⭐ Destacada</span>
                                )}
                                <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
                                    <h4 style={{ fontSize: 15, fontWeight: 900, color: '#fff', marginBottom: 2, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{v.nombre}</h4>
                                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>📍 {v.localidad}</p>
                                </div>
                            </div>
                            <div style={{ padding: '12px 16px 16px' }}>
                                <p style={{ fontSize: 11, color: '#b0b8c1', marginBottom: 12 }}>{v.especialidad}</p>
                                <Link to="/register" style={{
                                    display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 800,
                                    color: '#fff',
                                    background: v.destacada ? 'linear-gradient(135deg, #ff6b6b, #ff4a4a)' : '#1a1a2e',
                                    padding: '10px', borderRadius: 10, textDecoration: 'none',
                                    boxShadow: v.destacada ? '0 3px 12px rgba(255,107,107,0.35)' : 'none',
                                }}>
                                    Sacar turno →
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── SABÍAS QUE ── */}
            <div style={{ padding: '8px 32px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>Sabías que...</h2>
                    <button style={{ fontSize: 12, color: '#ff6b6b', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Ver más →</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                    {curiosidades.map((c, i) => (
                        <div key={i} style={{
                            background: '#fff', border: '1.5px solid #f0ede8', borderRadius: 20,
                            overflow: 'hidden', cursor: 'pointer', transition: 'transform .2s, border-color .2s',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = c.tagColor }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#f0ede8' }}
                        >
                            <div style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
                                <img src={c.img} alt={c.tag} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.35))' }} />
                                <div style={{
                                    position: 'absolute', bottom: 10, left: 10,
                                    background: c.tagColor, color: '#fff', fontSize: 10, fontWeight: 800,
                                    padding: '4px 12px', borderRadius: 99,
                                }}>{c.tag}</div>
                            </div>
                            <div style={{ padding: '14px' }}>
                                <h4 style={{ fontSize: 12, fontWeight: 800, color: '#1a1a2e', lineHeight: 1.4, marginBottom: 6 }}>{c.title}</h4>
                                <p style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.6 }}>{c.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── MASCOTAS PERDIDAS ── */}
            <div style={{ padding: '8px 32px 24px' }}>
                <div style={{ background: '#fff', border: '1.5px solid #f0ede8', borderRadius: 24, overflow: 'hidden' }}>
                    <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 100%)', padding: '24px 28px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: 'rgba(255,107,107,0.15)', borderRadius: '50%' }} />
                        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 6, position: 'relative', zIndex: 1 }}>🐾 Mascotas perdidas</h2>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', position: 'relative', zIndex: 1 }}>¿Encontraste una mascota? Publicalo y ayudá a que vuelva a casa.</p>
                    </div>
                    <div style={{ padding: '24px 28px' }}>
                        {reporteEnviado ? (
                            <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 14, padding: '20px', textAlign: 'center' }}>
                                <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                                <h3 style={{ fontWeight: 800, color: '#16a34a', fontSize: 15 }}>¡Reporte publicado!</h3>
                                <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Gracias por ayudar. Esperamos que esta mascota vuelva a casa pronto.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleReporte} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>
                                        Foto de la mascota <span style={{ color: '#ff6b6b' }}>*</span>
                                        <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400, marginLeft: 8 }}>Solo JPG</span>
                                    </label>
                                    {fotoPreview ? (
                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                            <img src={fotoPreview} alt="Preview" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 14, border: '2px solid #ffd93d' }} />
                                            <button type="button" onClick={() => { setFotoPreview(null); setFotoMascota(null) }}
                                                style={{ position: 'absolute', top: -8, right: -8, background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: 12, fontWeight: 900 }}>✕</button>
                                        </div>
                                    ) : (
                                        <div onClick={() => fileRef.current.click()}
                                            style={{ border: '2px dashed #e5e7eb', borderRadius: 14, padding: '28px', textAlign: 'center', cursor: 'pointer', background: '#fafaf8' }}
                                            onMouseEnter={e => e.currentTarget.style.borderColor = '#ffd93d'}
                                            onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}>
                                            <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                                            <p style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>Clic para subir foto JPG</p>
                                            <p style={{ fontSize: 11, color: '#c4bfb8', marginTop: 3 }}>Máx. 5MB</p>
                                        </div>
                                    )}
                                    <input ref={fileRef} type="file" accept=".jpg,.jpeg" onChange={handleFoto} style={{ display: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>
                                        ¿Dónde y cuándo la encontraste? <span style={{ color: '#ff6b6b' }}>*</span>
                                    </label>
                                    <textarea value={descripcionMascota} onChange={e => setDescripcionMascota(e.target.value)}
                                        placeholder="Ej: Encontré este perro en la calle Martín Lazarte, barrio Suárez, Moreno, Buenos Aires. Es macho, color marrón, sin collar."
                                        rows={4}
                                        style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: 12, fontSize: 13, color: '#374151', resize: 'vertical', fontFamily: "'Nunito', sans-serif", outline: 'none', lineHeight: 1.6, boxSizing: 'border-box' }}
                                        onFocus={e => e.target.style.borderColor = '#ffd93d'}
                                        onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                    <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Cuanto más detalle, mejor. Incluí zona, características físicas y cómo contactarte.</p>
                                </div>
                                <button type="submit" style={{
                                    background: 'linear-gradient(135deg, #ff6b6b, #ff4a4a)',
                                    color: '#fff', fontWeight: 900, fontSize: 14,
                                    padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                                    boxShadow: '0 4px 16px rgba(255,107,107,0.3)', fontFamily: "'Nunito', sans-serif",
                                }}>
                                    🐾 Publicar reporte de mascota perdida
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* ── BANNER ANUNCIANTES ── */}
            <div style={{ padding: '8px 32px 24px' }}>
                <div style={{
                    background: 'linear-gradient(135deg, #ffd93d 0%, #ffb800 100%)',
                    borderRadius: 22, padding: '28px 32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    boxShadow: '0 6px 30px rgba(255,184,0,0.2)',
                }}>
                    <div>
                        <h3 style={{ color: '#1a1a2e', fontWeight: 900, fontSize: 18, marginBottom: 6 }}>¿Tenés una marca de productos para mascotas?</h3>
                        <p style={{ color: 'rgba(26,26,46,0.65)', fontSize: 13, marginBottom: 16 }}>
                            Miles de dueños buscan lo mejor para sus animales cada día. Hacé que te encuentren primero en VetPaw y convertí esa búsqueda en ventas reales.
                        </p>
                        <div style={{ display: 'flex', gap: 24 }}>
                            {[{ n: '+5.000', l: 'usuarios activos' }, { n: '+200', l: 'veterinarias' }, { n: '100%', l: 'audiencia target' }].map((s, i) => (
                                <div key={i}>
                                    <p style={{ fontWeight: 900, fontSize: 18, color: '#1a1a2e' }}>{s.n}</p>
                                    <p style={{ fontSize: 11, color: 'rgba(26,26,46,0.55)' }}>{s.l}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 24 }}>
                        <div style={{ fontSize: 56, marginBottom: 12 }}>📣</div>
                        <button style={{ background: '#1a1a2e', color: '#ffd93d', fontWeight: 900, fontSize: 13, padding: '12px 22px', borderRadius: 12, border: 'none', cursor: 'pointer' }}>
                            Quiero anunciar →
                        </button>
                    </div>
                </div>
            </div>

            {/* ── FOOTER ── */}
            <footer style={{ background: '#1a1a2e', padding: '28px 32px', marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <div style={{ width: 26, height: 26, background: '#ff6b6b', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 900 }}>V</div>
                            <span style={{ color: '#fff', fontWeight: 700 }}>VetPaw</span>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, maxWidth: 220 }}>La app veterinaria de Argentina. Tu mascota merece lo mejor.</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px 48px' }}>
                        {['Términos', 'Privacidad', 'Sumar mi veterinaria', 'Anunciar en VetPaw', 'Contacto', 'Blog'].map(l => (
                            <span key={l} style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, cursor: 'pointer' }}>{l}</span>
                        ))}
                    </div>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, textAlign: 'center' }}>© 2026 VetPaw · Todos los derechos reservados</p>
                </div>
            </footer>
        </div>
    )
}
