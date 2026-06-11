import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useRef, useEffect } from 'react'
import api from '../services/api'

const G1 = '#4CAF50'
const G2 = '#66BB6A'
const O1 = '#FF9800'
const DARK = '#0f1923'
const DARK2 = '#162032'
const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif"

const PROVINCIAS = [
    'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes',
    'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones',
    'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
    'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
]

export default function LostPets() {
    const { user } = useAuth()

    // ── Form publicar mascota ──
    const [fotoMascota, setFotoMascota] = useState(null)
    const [fotoPreview, setFotoPreview] = useState(null)
    const [descripcionMascota, setDescripcionMascota] = useState('')
    const [contactType, setContactType] = useState('phone')
    const [contactValue, setContactValue] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [reporteEnviado, setReporteEnviado] = useState(false)
    const [errorEnvio, setErrorEnvio] = useState('')
    const [reportType, setReportType] = useState('found')
    const [province, setProvince] = useState('')
    const [locality, setLocality] = useState('')
    const fileRef = useRef()

    // ── Listado y filtros ──
    const [lostPets, setLostPets] = useState([])
    const [cargandoMuro, setCargandoMuro] = useState(true)
    const [selectedPet, setSelectedPet] = useState(null)
    const [filterProvince, setFilterProvince] = useState('')
    const [filterLocality, setFilterLocality] = useState('')

    useEffect(() => { fetchLostPets() }, [])

    const fetchLostPets = async (prov = '', loc = '') => {
        setCargandoMuro(true)
        try {
            let url = '/lost-pets/'
            const params = []
            if (prov) params.push(`province=${encodeURIComponent(prov)}`)
            if (loc) params.push(`locality=${encodeURIComponent(loc)}`)
            if (params.length) url += '?' + params.join('&')
            const res = await api.get(url)
            setLostPets(res.data)
        } catch (e) { console.error('Error cargando mascotas perdidas', e) }
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
        if (!fotoMascota || !descripcionMascota.trim() || !contactValue.trim() || !province || !locality) {
            setErrorEnvio('Por favor completá todos los campos incluyendo provincia y ciudad.'); return
        }
        setEnviando(true)
        try {
            const formData = new FormData()
            formData.append('report_type', reportType)
            formData.append('photo', fotoMascota)
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

    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
            <style>{`
                * { box-sizing: border-box; }
                @keyframes pricePulse {
                    0%, 100% { transform: scale(1); }
                    50%      { transform: scale(1.06); }
                }
                @keyframes cardIn {
                    from { opacity: 0; transform: scale(0.95) translateY(20px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
                @media (max-width: 768px) {
                    .section-pad { padding: 16px !important; }
                    .grid-3 { grid-template-columns: 1fr !important; }
                    .lost-form-pad { padding: 20px 16px !important; }
                    .lost-muro-pad { padding: 16px !important; }
                    .lost-header-pad { padding: 20px 16px !important; }
                    .contact-row { flex-direction: column !important; }
                    .contact-row select { width: 100% !important; }
                    .lost-filters { flex-direction: column !important; }
                    .prov-loc-row { flex-direction: column !important; }
                    .lost-gate-pad { padding: 28px 20px !important; }
                    .lost-gate-btns { flex-direction: column !important; }
                    .lost-gate-btns a { width: 100% !important; text-align: center !important; }
                }
            `}</style>

            <div style={{ minHeight: '100vh', background: DARK, fontFamily: FONT }}>

                <div className="section-pad" style={{ padding: '28px 40px' }}>
                    <div style={{ background: DARK2, border: '1.5px solid rgba(255,255,255,0.07)', borderRadius: 24, overflow: 'hidden', maxWidth: 1100, margin: '0 auto' }}>

                        {/* Header */}
                        <div className="lost-header-pad" style={{ background: `linear-gradient(135deg, #1a0505 0%, #3d0a0a 50%, #1a0a05 100%)`, padding: '28px 32px', position: 'relative', overflow: 'hidden', borderBottom: '3px solid rgba(239,68,68,0.4)' }}>
                            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'rgba(239,68,68,0.08)', borderRadius: '50%' }} />
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #ef4444, #f97316, #ef4444)' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
                                <div style={{ background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 900, letterSpacing: 3, padding: '6px 14px', borderRadius: 6, textTransform: 'uppercase', flexShrink: 0, boxShadow: '0 0 20px rgba(239,68,68,0.5)', animation: 'pricePulse 2s ease-in-out infinite' }}>🐾 ALERTA</div>
                                <div>
                                    <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: 1, fontFamily: FONT, marginBottom: 4 }}>Mascotas perdidas o encontradas</h1>
                                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>¿Perdiste tu mascota o encontraste una en la calle? Publicalo acá y ayudá a reunirlos.</p>
                                </div>
                            </div>
                        </div>

                        {/* Formulario publicar — requiere login */}
                        <div className="lost-form-pad" style={{ padding: '28px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            {!user ? (
                                /* ── BLOQUE: necesitás cuenta para publicar ── */
                                <div className="lost-gate-pad" style={{ background: `linear-gradient(135deg, rgba(76,175,80,0.10) 0%, rgba(255,152,0,0.10) 100%)`, border: '1.5px solid rgba(76,175,80,0.25)', borderRadius: 18, padding: '36px 32px', textAlign: 'center' }}>
                                    <div style={{ fontSize: 46, marginBottom: 14 }}>🐾</div>
                                    <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', fontFamily: FONT, marginBottom: 10, letterSpacing: -0.3 }}>
                                        Para publicar una mascota perdida necesitás una cuenta gratuita en VetPaw
                                    </h2>
                                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, maxWidth: 460, margin: '0 auto 24px' }}>
                                        Crear tu cuenta es gratis y lleva menos de un minuto. Así podés publicar reportes y ayudar a que más mascotas vuelvan a casa. El muro de reportes activos podés verlo más abajo sin registrarte.
                                    </p>
                                    <div className="lost-gate-btns" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                                        <Link to="/register" style={{ background: `linear-gradient(135deg, ${G1}, ${O1})`, color: '#fff', fontWeight: 800, fontSize: 14, padding: '13px 26px', borderRadius: 14, textDecoration: 'none', fontFamily: FONT, boxShadow: '0 6px 24px rgba(76,175,80,0.3)' }}>
                                            Registrarme gratis
                                        </Link>
                                        <Link to="/login" style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', fontWeight: 700, fontSize: 14, padding: '13px 26px', borderRadius: 14, textDecoration: 'none', fontFamily: FONT, border: '1.5px solid rgba(255,255,255,0.18)' }}>
                                            Ingresar
                                        </Link>
                                    </div>
                                </div>
                            ) : reporteEnviado ? (
                                <div style={{ background: 'rgba(76,175,80,0.1)', border: `1.5px solid rgba(76,175,80,0.3)`, borderRadius: 16, padding: '24px', textAlign: 'center' }}>
                                    <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
                                    <h3 style={{ fontWeight: 800, color: G2, fontSize: 16, fontFamily: FONT }}>¡Reporte publicado!</h3>
                                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>Gracias por ayudar. Esperamos que esta mascota vuelva a casa pronto.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleReporte} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                                    {/* Tipo de reporte */}
                                    <div>
                                        <label style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 10, fontFamily: FONT }}>¿Qué querés reportar? <span style={{ color: O1 }}>*</span></label>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button type="button" onClick={() => setReportType('found')} style={{ flex: 1, padding: '12px', borderRadius: 12, border: `2px solid ${reportType === 'found' ? G1 : 'rgba(255,255,255,0.1)'}`, background: reportType === 'found' ? 'rgba(76,175,80,0.12)' : 'rgba(255,255,255,0.04)', color: reportType === 'found' ? G1 : 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: FONT, transition: 'all .2s' }}>📍 Encontré una mascota</button>
                                            <button type="button" onClick={() => setReportType('lost')} style={{ flex: 1, padding: '12px', borderRadius: 12, border: `2px solid ${reportType === 'lost' ? '#ef4444' : 'rgba(255,255,255,0.1)'}`, background: reportType === 'lost' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)', color: reportType === 'lost' ? '#ef4444' : 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: FONT, transition: 'all .2s' }}>😢 Perdí mi mascota</button>
                                        </div>
                                    </div>

                                    {/* Foto */}
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

                                    {/* Descripción */}
                                    <div>
                                        <label style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 10, fontFamily: FONT }}>{reportType === 'lost' ? '¿Dónde y cuándo la perdiste?' : '¿Dónde y cuándo la encontraste?'} <span style={{ color: O1 }}>*</span></label>
                                        <textarea value={descripcionMascota} onChange={e => setDescripcionMascota(e.target.value)}
                                            placeholder={reportType === 'lost' ? 'Ej: Perdí a mi perro el martes en el barrio Suárez, Moreno. Es macho, color marrón, sin collar.' : 'Ej: Encontré este perro en la calle Martín Lazarte, barrio Suárez, Moreno. Es macho, color marrón, sin collar.'}
                                            rows={3} style={{ width: '100%', padding: '13px 16px', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 13, color: '#fff', resize: 'vertical', fontFamily: FONT, outline: 'none', lineHeight: 1.65, boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)' }}
                                            onFocus={e => e.target.style.borderColor = G1}
                                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                    </div>

                                    {/* Provincia y localidad */}
                                    <div className="prov-loc-row" style={{ display: 'flex', gap: 10 }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 10, fontFamily: FONT }}>Provincia <span style={{ color: O1 }}>*</span></label>
                                            <select value={province} onChange={e => setProvince(e.target.value)}
                                                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 13, color: province ? '#fff' : 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.07)', outline: 'none', cursor: 'pointer', fontFamily: FONT }}>
                                                <option value="" style={{ background: DARK2 }}>Seleccioná una provincia</option>
                                                {PROVINCIAS.map(p => <option key={p} value={p} style={{ background: DARK2 }}>{p}</option>)}
                                            </select>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 10, fontFamily: FONT }}>Ciudad / Localidad <span style={{ color: O1 }}>*</span></label>
                                            <input value={locality} onChange={e => setLocality(e.target.value)}
                                                placeholder="Ej: Moreno, Palermo, Rosario..."
                                                style={{ width: '100%', padding: '12px 16px', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 13, color: '#fff', outline: 'none', background: 'rgba(255,255,255,0.05)', fontFamily: FONT, boxSizing: 'border-box' }}
                                                onFocus={e => e.target.style.borderColor = G1}
                                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                        </div>
                                    </div>

                                    {/* Contacto */}
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

                        {/* ── Muro con filtros (visible sin login) ── */}
                        <div className="lost-muro-pad" style={{ padding: '24px 32px' }}>

                            {/* Filtros */}
                            <div className="lost-filters" style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                <div style={{ flex: 1, minWidth: 160 }}>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Filtrar por provincia</label>
                                    <select value={filterProvince} onChange={e => { setFilterProvince(e.target.value); fetchLostPets(e.target.value, filterLocality) }}
                                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 13, color: filterProvince ? '#fff' : 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.06)', outline: 'none', cursor: 'pointer', fontFamily: FONT }}>
                                        <option value="" style={{ background: DARK2 }}>Todas las provincias</option>
                                        {PROVINCIAS.map(p => <option key={p} value={p} style={{ background: DARK2 }}>{p}</option>)}
                                    </select>
                                </div>
                                <div style={{ flex: 1, minWidth: 160 }}>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Filtrar por ciudad</label>
                                    <input value={filterLocality} onChange={e => setFilterLocality(e.target.value)}
                                        placeholder="Ej: Moreno, Palermo..."
                                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 13, color: '#fff', outline: 'none', background: 'rgba(255,255,255,0.06)', fontFamily: FONT, boxSizing: 'border-box' }}
                                        onFocus={e => e.target.style.borderColor = G1}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                        onKeyDown={e => e.key === 'Enter' && fetchLostPets(filterProvince, filterLocality)} />
                                </div>
                                <button onClick={() => fetchLostPets(filterProvince, filterLocality)}
                                    style={{ padding: '10px 20px', background: `linear-gradient(135deg, ${G1}, ${O1})`, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}>
                                    🔍 Buscar
                                </button>
                                {(filterProvince || filterLocality) && (
                                    <button onClick={() => { setFilterProvince(''); setFilterLocality(''); fetchLostPets('', '') }}
                                        style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}>
                                        ✕ Limpiar
                                    </button>
                                )}
                            </div>

                            {/* Título con contador y zona activa */}
                            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 18, fontFamily: FONT }}>
                                📋 Reportes activos <span style={{ color: G1 }}>({lostPets.length})</span>
                                {(filterProvince || filterLocality) && (
                                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginLeft: 10 }}>
                                        en {[filterLocality, filterProvince].filter(Boolean).join(', ')}
                                    </span>
                                )}
                            </h3>

                            {/* Cards */}
                            {cargandoMuro ? (
                                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Cargando reportes...</p>
                            ) : lostPets.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                                    <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
                                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
                                        {filterProvince || filterLocality ? 'No hay reportes en esa zona.' : 'No hay reportes activos por el momento.'}
                                    </p>
                                    {(filterProvince || filterLocality) && (
                                        <button onClick={() => { setFilterProvince(''); setFilterLocality(''); fetchLostPets('', '') }}
                                            style={{ marginTop: 12, padding: '8px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: FONT }}>
                                            Ver todos los reportes
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                                    {lostPets.map(pet => {
                                        const isLost = pet.report_type === 'lost'
                                        const badgeColor = isLost ? '#ef4444' : G1
                                        const badgeBg = isLost ? 'rgba(239,68,68,0.15)' : 'rgba(76,175,80,0.15)'
                                        const badgeText = isLost ? '🔍 SE BUSCA' : '📍 ENCONTRADA'
                                        return (
                                            <div key={pet.id} onClick={() => setSelectedPet(pet)}
                                                style={{ background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${isLost ? 'rgba(239,68,68,0.2)' : 'rgba(76,175,80,0.2)'}`, borderRadius: 18, overflow: 'hidden', cursor: 'pointer', transition: 'transform .2s' }}
                                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                                <div style={{ height: 180, overflow: 'hidden', position: 'relative' }}>
                                                    <img src={pet.photo_url} alt="Mascota" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%', filter: isLost ? 'grayscale(40%)' : 'none' }} />
                                                    <div style={{ position: 'absolute', top: 10, left: 10, background: badgeBg, color: badgeColor, fontSize: 10, fontWeight: 900, letterSpacing: 1, padding: '4px 10px', borderRadius: 6, border: `1px solid ${badgeColor}`, textTransform: 'uppercase', backdropFilter: 'blur(8px)' }}>{badgeText}</div>
                                                    <div style={{ position: 'absolute', top: 10, right: 10, background: DARK, color: G2, fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 99, border: `1px solid rgba(76,175,80,0.3)` }}>{pet.days_left}d restantes</div>
                                                </div>
                                                <div style={{ padding: '14px 16px' }}>
                                                    {(pet.province || pet.locality) && (
                                                        <div style={{ marginBottom: 8 }}>
                                                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '3px 8px', fontWeight: 600 }}>
                                                                📍 {[pet.locality, pet.province].filter(Boolean).join(', ')}
                                                            </span>
                                                        </div>
                                                    )}
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
