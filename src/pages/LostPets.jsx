import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useRef, useEffect } from 'react'
import api from '../services/api'

const G1 = '#4CAF50'
const O1 = '#FF9800'
const DARK = '#0f1923'
const DARK2 = '#111e2b'
const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif"

const PROVINCIAS = [
    'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes',
    'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones',
    'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
    'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
]

export default function LostPets() {
    const { user } = useAuth()

    const [fotoMascota, setFotoMascota] = useState(null)
    const [fotoPreview, setFotoPreview] = useState(null)
    const [descripcionMascota, setDescripcionMascota] = useState('')
    const [contactType, setContactType] = useState('phone')
    const [contactValue, setContactValue] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [reporteEnviado, setReporteEnviado] = useState(false)
    const [errorEnvio, setErrorEnvio] = useState('')
    const [reportType, setReportType] = useState('lost')
    const [province, setProvince] = useState('')
    const [locality, setLocality] = useState('')
    const fileRef = useRef()

    const [lostPets, setLostPets] = useState([])
    const [cargandoMuro, setCargandoMuro] = useState(true)
    const [selectedPet, setSelectedPet] = useState(null)
    const [filterProvince, setFilterProvince] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [visibleCount, setVisibleCount] = useState(10)

    useEffect(() => { fetchLostPets() }, [])

    const fetchLostPets = async (prov = '', status = '') => {
        setCargandoMuro(true)
        try {
            let url = '/lost-pets/'
            const params = []
            if (prov) params.push(`province=${encodeURIComponent(prov)}`)
            if (params.length) url += '?' + params.join('&')
            const res = await api.get(url)
            let data = res.data
            if (status === 'lost') data = data.filter(p => p.report_type === 'lost')
            if (status === 'found') data = data.filter(p => p.report_type === 'found')
            setLostPets(data)
        } catch (e) { console.error(e) }
        finally { setCargandoMuro(false) }
    }

    const handleFoto = (e) => {
        const file = e.target.files[0]
        if (!file) return
        if (!file.type.includes('jpeg') && !file.name.endsWith('.jpg') && !file.type.includes('png')) {
            alert('Solo se aceptan archivos JPG o PNG.'); return
        }
        setFotoMascota(file)
        setFotoPreview(URL.createObjectURL(file))
    }

    const handleReporte = async (e) => {
        e.preventDefault(); setErrorEnvio('')
        if (!descripcionMascota.trim() || !contactValue.trim() || !province || !locality) {
            setErrorEnvio('Por favor completá todos los campos obligatorios.'); return
        }
        setEnviando(true)
        try {
            const formData = new FormData()
            formData.append('report_type', reportType)
            if (fotoMascota) formData.append('photo', fotoMascota)
            formData.append('description', descripcionMascota)
            formData.append('contact_type', contactType)
            formData.append('contact_value', contactValue)
            formData.append('province', province)
            formData.append('locality', locality)
            await api.post('/lost-pets/create/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            setReporteEnviado(true)
            setFotoMascota(null); setFotoPreview(null)
            setDescripcionMascota(''); setContactValue('')
            setProvince(''); setLocality('')
            fetchLostPets()
            setTimeout(() => setReporteEnviado(false), 5000)
        } catch (e) { setErrorEnvio('Hubo un error al publicar. Intentá de nuevo.') }
        finally { setEnviando(false) }
    }

    const inp = {
        width: '100%', padding: '11px 14px',
        background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)',
        borderRadius: 10, color: '#fff', fontSize: 13, fontFamily: FONT,
        outline: 'none', boxSizing: 'border-box',
    }

    const visiblePets = lostPets.slice(0, visibleCount)

    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
            <style>{`
                * { box-sizing: border-box; }
                @keyframes cardIn {
                    from { opacity: 0; transform: scale(0.95) translateY(16px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
                .lp-card { transition: transform .18s, box-shadow .18s; }
                .lp-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.4); }
                .lp-filter-sel:focus { border-color: ${G1} !important; outline: none; }
                @media (max-width: 900px) {
                    .lp-grid { grid-template-columns: repeat(2, 1fr) !important; }
                    .lp-form-row { flex-direction: column !important; }
                    .lp-hero-title { font-size: 28px !important; }
                }
                @media (max-width: 600px) {
                    .lp-grid { grid-template-columns: 1fr !important; }
                    .lp-hero { padding: 32px 20px !important; }
                    .lp-section { padding: 20px 16px !important; }
                    .lp-form-inner { padding: 20px 16px !important; }
                }
            `}</style>

            <div style={{ minHeight: '100vh', background: DARK, fontFamily: FONT, color: '#fff' }}>

                {/* HERO */}
                <div className="lp-hero" style={{
                    background: 'linear-gradient(135deg, #0a1a0a 0%, #1a2a0a 40%, #0a1520 100%)',
                    padding: '48px 40px 40px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, background: 'radial-gradient(circle, rgba(76,175,80,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: -60, left: 200, width: 300, height: 300, background: 'radial-gradient(circle, rgba(255,152,0,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
                    <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 280 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,152,0,0.15)', border: '1px solid rgba(255,152,0,0.4)', color: O1, fontSize: 11, fontWeight: 800, padding: '5px 14px', borderRadius: 99, marginBottom: 18, letterSpacing: 1, textTransform: 'uppercase' }}>
                                🐾 Alerta activa
                            </div>
                            <h1 className="lp-hero-title" style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.1, marginBottom: 14, letterSpacing: -1 }}>
                                Mascotas{' '}
                                <span style={{ color: O1 }}>Perdidas</span>
                                {' '}o{' '}
                                <span style={{ color: G1 }}>Encontradas</span>
                            </h1>
                            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 480, marginBottom: 0 }}>
                                Ayudamos a reencontrar familias con sus mascotas. Publicá un aviso y compartilo para que llegue más lejos.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
                            <div style={{ background: 'rgba(255,152,0,0.1)', border: '1px solid rgba(255,152,0,0.25)', borderRadius: 14, padding: '16px 24px', textAlign: 'center' }}>
                                <div style={{ fontSize: 28, fontWeight: 900, color: O1 }}>{lostPets.filter(p => p.report_type === 'lost').length}</div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Se buscan</div>
                            </div>
                            <div style={{ background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.25)', borderRadius: 14, padding: '16px 24px', textAlign: 'center' }}>
                                <div style={{ fontSize: 28, fontWeight: 900, color: G1 }}>{lostPets.filter(p => p.report_type === 'found').length}</div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Encontradas</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FILTROS */}
                <div className="lp-section" style={{ padding: '20px 40px', background: DARK2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        <select className="lp-filter-sel" value={filterProvince}
                            onChange={e => { setFilterProvince(e.target.value); fetchLostPets(e.target.value, filterStatus) }}
                            style={{ ...inp, width: 'auto', minWidth: 200, cursor: 'pointer' }}>
                            <option value="" style={{ background: DARK2 }}>📍 Todas las provincias</option>
                            {PROVINCIAS.map(p => <option key={p} value={p} style={{ background: DARK2 }}>{p}</option>)}
                        </select>
                        <select className="lp-filter-sel" value={filterStatus}
                            onChange={e => { setFilterStatus(e.target.value); fetchLostPets(filterProvince, e.target.value) }}
                            style={{ ...inp, width: 'auto', minWidth: 180, cursor: 'pointer' }}>
                            <option value="" style={{ background: DARK2 }}>🔍 Mostrar todos</option>
                            <option value="lost" style={{ background: DARK2 }}>🔍 Solo perdidas</option>
                            <option value="found" style={{ background: DARK2 }}>📍 Solo encontradas</option>
                        </select>
                        {(filterProvince || filterStatus) && (
                            <button onClick={() => { setFilterProvince(''); setFilterStatus(''); fetchLostPets('', '') }}
                                style={{ padding: '11px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>
                                ✕ Limpiar filtros
                            </button>
                        )}
                        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                            {lostPets.length} reporte{lostPets.length !== 1 ? 's' : ''} activo{lostPets.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {/* GRID */}
                <div className="lp-section" style={{ padding: '32px 40px', maxWidth: 1140, margin: '0 auto' }}>
                    {cargandoMuro ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Cargando reportes...</div>
                    ) : lostPets.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>No hay reportes activos por el momento.</p>
                        </div>
                    ) : (
                        <>
                            <div className="lp-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
                                {visiblePets.map((pet, idx) => {
                                    const isLost = pet.report_type === 'lost'
                                    return (
                                        <div key={pet.id} className="lp-card" onClick={() => setSelectedPet(pet)}
                                            style={{ background: DARK2, borderRadius: 16, overflow: 'hidden', border: `1.5px solid ${isLost ? 'rgba(255,152,0,0.2)' : 'rgba(76,175,80,0.2)'}`, cursor: 'pointer', animation: `cardIn 0.3s ease both`, animationDelay: `${idx * 0.04}s` }}>
                                            <div style={{ height: 160, position: 'relative', overflow: 'hidden' }}>
                                                {pet.photo_url ? (
                                                    <img src={pet.photo_url} alt="Mascota" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🐾</div>
                                                )}
                                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.6))' }} />
                                                <div style={{ position: 'absolute', top: 8, left: 8, background: isLost ? O1 : G1, color: '#fff', fontSize: 9, fontWeight: 900, letterSpacing: 1, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                                                    {isLost ? 'PERDIDA' : 'ENCONTRADA'}
                                                </div>
                                            </div>
                                            <div style={{ padding: '12px 14px' }}>
                                                {(pet.locality || pet.province) && (
                                                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
                                                        📍 {[pet.locality, pet.province].filter(Boolean).join(', ')}
                                                    </p>
                                                )}
                                                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55, marginBottom: 10 }}>
                                                    {pet.description?.length > 80 ? pet.description.slice(0, 80) + '...' : pet.description}
                                                </p>
                                                {pet.contact_type === 'email' ? (
                                                    <a href={`mailto:${pet.contact_value}`} onClick={e => e.stopPropagation()} style={{ display: 'block', textAlign: 'center', background: 'rgba(107,202,255,0.1)', border: '1px solid rgba(107,202,255,0.25)', color: '#6bcaff', fontSize: 11, fontWeight: 700, padding: '7px', borderRadius: 8, textDecoration: 'none' }}>✉️ Contactar</a>
                                                ) : (
                                                    <a href={`https://wa.me/54${pet.contact_value?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ display: 'block', textAlign: 'center', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', color: '#25D366', fontSize: 11, fontWeight: 700, padding: '7px', borderRadius: 8, textDecoration: 'none' }}>💬 Contactar</a>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            {visibleCount < lostPets.length && (
                                <div style={{ textAlign: 'center', marginTop: 28 }}>
                                    <button onClick={() => setVisibleCount(v => v + 10)} style={{ padding: '12px 28px', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>
                                        Cargar más publicaciones ↓
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* FORMULARIO */}
                <div className="lp-section" style={{ padding: '0 40px 60px', maxWidth: 1140, margin: '0 auto' }}>
                    <div style={{ background: DARK2, border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(76,175,80,0.12)', border: '1px solid rgba(76,175,80,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🐾</div>
                            <div>
                                <h2 style={{ fontSize: 17, fontWeight: 900, color: '#fff', fontFamily: FONT, marginBottom: 2 }}>¿Qué querés reportar?</h2>
                                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Publicá un aviso y ayudá a que más mascotas vuelvan a casa</p>
                            </div>
                        </div>

                        <div className="lp-form-inner" style={{ padding: '28px 32px' }}>
                            {!user ? (
                                <div style={{ background: 'linear-gradient(135deg, rgba(76,175,80,0.08), rgba(255,152,0,0.08))', border: '1.5px solid rgba(76,175,80,0.2)', borderRadius: 16, padding: '36px', textAlign: 'center' }}>
                                    <div style={{ fontSize: 44, marginBottom: 14 }}>🔒</div>
                                    <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', fontFamily: FONT, marginBottom: 10 }}>Necesitás una cuenta para publicar</h3>
                                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, maxWidth: 420, margin: '0 auto 24px' }}>
                                        Crear tu cuenta es gratis y lleva menos de un minuto. Podés seguir viendo los reportes sin registrarte.
                                    </p>
                                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                                        <Link to="/register" style={{ background: `linear-gradient(135deg, ${G1}, ${O1})`, color: '#fff', fontWeight: 800, fontSize: 14, padding: '13px 26px', borderRadius: 12, textDecoration: 'none', fontFamily: FONT }}>Registrarme gratis</Link>
                                        <Link to="/login" style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', fontWeight: 700, fontSize: 14, padding: '13px 26px', borderRadius: 12, textDecoration: 'none', border: '1.5px solid rgba(255,255,255,0.15)', fontFamily: FONT }}>Ingresar</Link>
                                    </div>
                                </div>
                            ) : reporteEnviado ? (
                                <div style={{ background: 'rgba(76,175,80,0.08)', border: '1.5px solid rgba(76,175,80,0.25)', borderRadius: 14, padding: '32px', textAlign: 'center' }}>
                                    <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
                                    <h3 style={{ fontWeight: 800, color: '#66BB6A', fontSize: 16, fontFamily: FONT }}>¡Reporte publicado!</h3>
                                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>Gracias por ayudar. Esperamos que esta mascota vuelva a casa pronto.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleReporte}>
                                    <div className="lp-form-row" style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                                        <button type="button" onClick={() => setReportType('lost')}
                                            style={{ flex: 1, padding: '16px', borderRadius: 14, border: `2px solid ${reportType === 'lost' ? O1 : 'rgba(255,255,255,0.1)'}`, background: reportType === 'lost' ? 'rgba(255,152,0,0.1)' : 'rgba(255,255,255,0.03)', color: reportType === 'lost' ? O1 : 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: FONT, transition: 'all .2s' }}>
                                            🔍 Busco a mi mascota
                                            <div style={{ fontSize: 11, fontWeight: 400, marginTop: 4, opacity: 0.7 }}>Mi mascota se perdió</div>
                                        </button>
                                        <button type="button" onClick={() => setReportType('found')}
                                            style={{ flex: 1, padding: '16px', borderRadius: 14, border: `2px solid ${reportType === 'found' ? G1 : 'rgba(255,255,255,0.1)'}`, background: reportType === 'found' ? 'rgba(76,175,80,0.1)' : 'rgba(255,255,255,0.03)', color: reportType === 'found' ? G1 : 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: FONT, transition: 'all .2s' }}>
                                            🐾 Encontré una mascota
                                            <div style={{ fontSize: 11, fontWeight: 400, marginTop: 4, opacity: 0.7 }}>Quiero ayudar a encontrar su familia</div>
                                        </button>
                                    </div>

                                    <div className="lp-form-row" style={{ display: 'flex', gap: 20 }}>
                                        <div style={{ flex: '0 0 200px' }}>
                                            <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>Foto de la mascota <span style={{ color: O1 }}>*</span></label>
                                            {fotoPreview ? (
                                                <div style={{ position: 'relative' }}>
                                                    <img src={fotoPreview} alt="Preview" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 12, border: `2px solid ${G1}` }} />
                                                    <button type="button" onClick={() => { setFotoPreview(null); setFotoMascota(null) }} style={{ position: 'absolute', top: -8, right: -8, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: 12, fontWeight: 900 }}>✕</button>
                                                </div>
                                            ) : (
                                                <div onClick={() => fileRef.current.click()}
                                                    style={{ border: '2px dashed rgba(255,255,255,0.12)', borderRadius: 12, height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', background: 'rgba(255,255,255,0.02)', transition: 'border-color .2s' }}
                                                    onMouseEnter={e => e.currentTarget.style.borderColor = G1}
                                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}>
                                                    <div style={{ fontSize: 28 }}>📷</div>
                                                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Subí una foto clara</p>
                                                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>JPG, PNG – máx. 5MB</p>
                                                </div>
                                            )}
                                            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleFoto} style={{ display: 'none' }} />
                                        </div>

                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                                            <div>
                                                <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                                                    {reportType === 'lost' ? '¿Dónde y cuándo la perdiste?' : '¿Dónde y cuándo la encontraste?'} <span style={{ color: O1 }}>*</span>
                                                </label>
                                                <textarea value={descripcionMascota} onChange={e => setDescripcionMascota(e.target.value)} maxLength={500}
                                                    placeholder="Contanos más detalles: lugar, fecha, hora, cómo estaba, si tenía collar, rasgos distintivos, etc."
                                                    rows={4} style={{ ...inp, resize: 'none' }}
                                                    onFocus={e => e.target.style.borderColor = G1}
                                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'right', marginTop: 4 }}>{descripcionMascota.length}/500</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: 12 }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>Provincia <span style={{ color: O1 }}>*</span></label>
                                                    <select value={province} onChange={e => setProvince(e.target.value)} style={{ ...inp, cursor: 'pointer' }}
                                                        onFocus={e => e.target.style.borderColor = G1}
                                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}>
                                                        <option value="" style={{ background: DARK2 }}>Seleccioná una provincia</option>
                                                        {PROVINCIAS.map(p => <option key={p} value={p} style={{ background: DARK2 }}>{p}</option>)}
                                                    </select>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>Ciudad / Localidad <span style={{ color: O1 }}>*</span></label>
                                                    <input value={locality} onChange={e => setLocality(e.target.value)} placeholder="Ej: Moreno, Palermo..." style={inp}
                                                        onFocus={e => e.target.style.borderColor = G1}
                                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>Datos de contacto <span style={{ color: O1 }}>*</span></label>
                                                <div style={{ display: 'flex', gap: 10 }}>
                                                    <select value={contactType} onChange={e => setContactType(e.target.value)} style={{ ...inp, width: 'auto', minWidth: 140, cursor: 'pointer' }}>
                                                        <option value="phone" style={{ background: DARK2 }}>📱 WhatsApp</option>
                                                        <option value="home_phone" style={{ background: DARK2 }}>📞 Teléfono</option>
                                                        <option value="email" style={{ background: DARK2 }}>✉️ Email</option>
                                                    </select>
                                                    <input value={contactValue} onChange={e => setContactValue(e.target.value)}
                                                        placeholder={contactType === 'email' ? 'tucorreo@email.com' : '11 2345-6789'}
                                                        style={{ ...inp, flex: 1 }}
                                                        onFocus={e => e.target.style.borderColor = G1}
                                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {errorEnvio && <p style={{ color: '#f87171', fontSize: 12, marginTop: 16, fontWeight: 600 }}>{errorEnvio}</p>}

                                    <button type="submit" disabled={enviando}
                                        style={{
                                            width: '100%', marginTop: 20, padding: '16px',
                                            background: enviando ? 'rgba(255,255,255,0.08)' : `linear-gradient(135deg, ${G1}, ${O1})`,
                                            color: '#fff', fontWeight: 800, fontSize: 15, borderRadius: 14,
                                            border: 'none', cursor: enviando ? 'not-allowed' : 'pointer',
                                            fontFamily: FONT, letterSpacing: 0.3,
                                            boxShadow: enviando ? 'none' : '0 6px 24px rgba(76,175,80,0.25)',
                                        }}>
                                        {enviando ? 'Publicando...' : '🐾 Publicar aviso'}
                                        {!enviando && <div style={{ fontSize: 11, fontWeight: 400, marginTop: 3, opacity: 0.7 }}>Tu publicación ayudará a que más personas lo vean</div>}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL */}
            {selectedPet && (
                <div onClick={() => setSelectedPet(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div onClick={e => e.stopPropagation()} style={{ background: '#162032', borderRadius: 24, overflow: 'hidden', maxWidth: 480, width: '100%', border: `2px solid ${selectedPet.report_type === 'lost' ? 'rgba(255,152,0,0.4)' : 'rgba(76,175,80,0.4)'}`, boxShadow: '0 32px 80px rgba(0,0,0,0.6)', animation: 'cardIn 0.3s cubic-bezier(.22,.68,0,1.2) both' }}>
                        <div style={{ position: 'relative', height: 280 }}>
                            {selectedPet.photo_url ? (
                                <img src={selectedPet.photo_url} alt="Mascota" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>🐾</div>
                            )}
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7))' }} />
                            <div style={{ position: 'absolute', top: 14, left: 14, background: selectedPet.report_type === 'lost' ? O1 : G1, color: '#fff', fontSize: 11, fontWeight: 900, letterSpacing: 2, padding: '6px 14px', borderRadius: 6, textTransform: 'uppercase' }}>
                                {selectedPet.report_type === 'lost' ? '🔍 SE BUSCA' : '📍 ENCONTRADA'}
                            </div>
                            {selectedPet.days_left && (
                                <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.6)', color: '#66BB6A', fontSize: 11, fontWeight: 800, padding: '5px 12px', borderRadius: 99, border: '1px solid rgba(76,175,80,0.3)' }}>{selectedPet.days_left}d restantes</div>
                            )}
                            <button onClick={() => setSelectedPet(null)} style={{ position: 'absolute', bottom: 14, right: 14, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        </div>
                        <div style={{ padding: '20px 24px 24px' }}>
                            {(selectedPet.province || selectedPet.locality) && (
                                <div style={{ marginBottom: 12 }}>
                                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '5px 12px', fontWeight: 600 }}>
                                        📍 {[selectedPet.locality, selectedPet.province].filter(Boolean).join(', ')}
                                    </span>
                                </div>
                            )}
                            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 20 }}>{selectedPet.description}</p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                                    {selectedPet.contact_type === 'phone' ? '📱' : selectedPet.contact_type === 'home_phone' ? '📞' : '✉️'} {selectedPet.contact_value}
                                </div>
                                {selectedPet.contact_type === 'email' ? (
                                    <a href={`mailto:${selectedPet.contact_value}`} style={{ background: 'rgba(107,202,255,0.15)', border: '1px solid rgba(107,202,255,0.4)', color: '#6bcaff', fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontFamily: FONT }}>✉️ Contactar por email</a>
                                ) : (
                                    <a href={`https://wa.me/54${selectedPet.contact_value?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.4)', color: '#25D366', fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontFamily: FONT }}>💬 WhatsApp</a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
