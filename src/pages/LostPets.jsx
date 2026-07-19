import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useRef, useEffect } from 'react'
import api from '../services/api'
import ownerBg from "../assets/vetpaw-owner-bg.png";
import dashboardPetsIcon from "../assets/vetpaw-dashboard-icons/dashboard-pets.png";
import lostSearchIcon from "../assets/vetpaw-lost-icons/lost-search.png";
import lostFoundIcon from "../assets/vetpaw-lost-icons/lost-found.png";
import lostReportsIcon from "../assets/vetpaw-lost-icons/lost-reports.png";
import { prepareImageForUpload, replaceObjectUrl, revokeObjectUrl } from "../utils/imageUpload";
import ImageEditorModal from '../components/ImageEditorModal';

// ───────────────────────── Tokens de diseño
const BG = "#0a121d"
const CARD = "#16212f"
const CARD2 = "#1b2a3d"
const BORDER = "rgba(255,255,255,0.08)"
const TEXT = "#fff"
const MUTED = "rgba(255,255,255,0.5)"
const MUTED2 = "rgba(255,255,255,0.65)"
const MUTED3 = "rgba(255,255,255,0.35)"
const G1 = "#4CAF50"
const G2 = "#66BB6A"
const O1 = "#FF9800"
const O2 = "#FFB74D"
const B1 = "#6bcaff"
const V1 = "#a78bfa"
const RED = "#ff6b6b"
const WA = "#25D366"
const GRAD = `linear-gradient(135deg, ${G1}, ${O1})`
const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif"

// ───────────────────────── Datos estáticos
const PROVINCIAS = [
    'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes',
    'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones',
    'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
    'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
]

const SPECIES_FORM = [
    { val: 'dog', label: 'Perro', emoji: '🐶' },
    { val: 'cat', label: 'Gato', emoji: '🐱' },
    { val: 'bird', label: 'Pájaro', emoji: '🦜' },
    { val: 'rabbit', label: 'Conejo', emoji: '🐰' },
    { val: 'fish', label: 'Pez', emoji: '🐟' },
    { val: 'other', label: 'Otro', emoji: '🐕' },
]

// ───────────────────────── Helpers
const fmtDate = (d) => {
    if (!d) return ''
    const dt = new Date(d)
    if (isNaN(dt)) return ''
    return dt.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const speciesEmoji = (s) => {
    const found = SPECIES_FORM.find(x => x.val === s)
    return found ? found.emoji : '🐕'
}



function OwnerPawIcon() {
    return (
        <span className="owner-icon-badge owner-icon-badge--image" aria-hidden="true">
            <img src={dashboardPetsIcon} alt="" className="owner-title-icon-img" />
        </span>
    );
}
function OwnerCalendarIcon() {
    return (
        <span className="owner-icon-badge" aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="none">
                <rect x="12" y="16" width="40" height="36" rx="8" fill="rgba(107,202,255,.13)" stroke="#6bcaff" strokeWidth="2"/>
                <path d="M12 27h40" stroke="#4CAF50" strokeWidth="2"/>
                <path d="M22 11v10M42 11v10" stroke="#FF9800" strokeWidth="4" strokeLinecap="round"/>
                <rect x="20" y="34" width="8" height="8" rx="2" fill="#4CAF50"/><rect x="32" y="34" width="8" height="8" rx="2" fill="#FF9800"/>
            </svg>
        </span>
    );
}
function OwnerVetIcon() {
    return (
        <span className="owner-icon-badge" aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="none">
                <path d="M13 51V25l19-13 19 13v26" stroke="#6bcaff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M25 51V37h14v14" stroke="#4CAF50" strokeWidth="2.4" strokeLinecap="round"/>
                <path d="M32 23v12M26 29h12" stroke="#FF9800" strokeWidth="4" strokeLinecap="round"/>
            </svg>
        </span>
    );
}
function OwnerAlertPetIcon() {
    return (
        <span className="owner-icon-badge" aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="none">
                <path d="M32 11 55 52H9L32 11Z" fill="rgba(255,152,0,.15)" stroke="#FF9800" strokeWidth="2.5"/>
                <path d="M24 39c2.4-4 4.8-5.8 8-5.8S37.6 35 40 39l2.2 3.5c1.8 2.8-.2 6.5-3.6 6.5H25.4c-3.4 0-5.4-3.7-3.6-6.5L24 39Z" fill="#4CAF50"/>
                <circle cx="23" cy="31" r="3.5" fill="#FFB74D"/><circle cx="30" cy="26" r="3.5" fill="#6bcaff"/><circle cx="38" cy="31" r="3.5" fill="#FF9800"/>
            </svg>
        </span>
    );
}

export default function LostPets() {
    const { user } = useAuth()
    const navigate = useNavigate()

    // ── Listado y modal
    const [lostPets, setLostPets] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedPet, setSelectedPet] = useState(null)
    const [visibleCount, setVisibleCount] = useState(12)

    // ── Filtros
    const [filterProvince, setFilterProvince] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [filterSpecies, setFilterSpecies] = useState('')
    const [filterSearch, setFilterSearch] = useState('')

    // ── Form
    const [reportType, setReportType] = useState('lost')
    const [petName, setPetName] = useState('')
    const [species, setSpecies] = useState('')
    const [breed, setBreed] = useState('')
    const [incidentDate, setIncidentDate] = useState('')
    const [descripcion, setDescripcion] = useState('')
    const [province, setProvince] = useState('')
    const [locality, setLocality] = useState('')
    const [contactType, setContactType] = useState('phone')
    const [contactValue, setContactValue] = useState('')
    const [fotoMascota, setFotoMascota] = useState(null)
    const [fotoPreview, setFotoPreview] = useState(null)
    const [editorFile, setEditorFile] = useState(null)

    useEffect(() => () => revokeObjectUrl(fotoPreview), [fotoPreview])
    const [enviando, setEnviando] = useState(false)
    const [reporteEnviado, setReporteEnviado] = useState(false)
    const [errorEnvio, setErrorEnvio] = useState('')

    const fileRef = useRef()
    const cameraRef = useRef()
    const formRef = useRef()

    useEffect(() => { fetchLostPets() }, [])

    const fetchLostPets = async (prov = '') => {
        setLoading(true)
        try {
            let url = '/lost-pets/'
            if (prov) url += `?province=${encodeURIComponent(prov)}`
            const res = await api.get(url)
            setLostPets(res.data)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    // ── Filtros aplicados en cliente
    const filteredPets = lostPets.filter(p => {
        if (filterStatus === 'lost' && p.report_type !== 'lost') return false
        if (filterStatus === 'found' && p.report_type !== 'found') return false
        if (filterSpecies && p.species !== filterSpecies) return false
        if (filterSearch.trim()) {
            const q = filterSearch.trim().toLowerCase()
            const hay = `${p.pet_name || ''} ${p.breed || ''} ${p.locality || ''} ${p.province || ''} ${p.description || ''}`.toLowerCase()
            if (!hay.includes(q)) return false
        }
        return true
    })
    const visiblePets = filteredPets.slice(0, visibleCount)

    // ── Stats (data-driven)
    const lostCount = lostPets.filter(p => p.report_type === 'lost').length
    const foundCount = lostPets.filter(p => p.report_type === 'found').length
    const totalActive = lostPets.length

    const hasAnyFilter = !!(filterProvince || filterStatus || filterSpecies || filterSearch.trim())

    const handleFoto = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            const prepared = await prepareImageForUpload(file, { maxMB: 5, maxDimension: 2400, label: 'La foto' })
            setEditorFile(prepared)
        } catch (imageError) {
            alert(imageError.message || 'No pudimos preparar la foto.')
        } finally {
            e.target.value = ''
        }
    }

    const applyEditedPhoto = async (editedFile) => {
        setFotoMascota(editedFile)
        setFotoPreview((current) => replaceObjectUrl(current, editedFile))
        setEditorFile(null)
    }

    const handleReporte = async (e) => {
        e.preventDefault()
        setErrorEnvio('')
        if (!descripcion.trim() || !contactValue.trim() || !province || !locality) {
            setErrorEnvio('Por favor completá los campos obligatorios (descripción, contacto, provincia y localidad).')
            return
        }
        setEnviando(true)
        try {
            const fd = new FormData()
            fd.append('report_type', reportType)
            if (fotoMascota) fd.append('photo', fotoMascota)
            fd.append('description', descripcion)
            fd.append('contact_type', contactType)
            fd.append('contact_value', contactValue)
            fd.append('province', province)
            fd.append('locality', locality)
            // Campos nuevos opcionales
            if (petName.trim()) fd.append('pet_name', petName.trim())
            if (species) fd.append('species', species)
            if (breed.trim()) fd.append('breed', breed.trim())
            if (incidentDate) fd.append('incident_date', incidentDate)

            await api.post('/lost-pets/create/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
            setReporteEnviado(true)
            // Reset
            setFotoMascota(null); setFotoPreview((current) => { revokeObjectUrl(current); return null })
            if (fileRef.current) fileRef.current.value = ''
            if (cameraRef.current) cameraRef.current.value = ''
            setDescripcion(''); setContactValue('')
            setProvince(''); setLocality('')
            setPetName(''); setSpecies(''); setBreed(''); setIncidentDate('')
            fetchLostPets(filterProvince)
            setTimeout(() => setReporteEnviado(false), 6000)
        } catch (err) {
            setErrorEnvio('Hubo un error al publicar. Intentá de nuevo.')
        } finally {
            setEnviando(false)
        }
    }

    const scrollToForm = () => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const clearFilters = () => {
        setFilterProvince('')
        setFilterStatus('')
        setFilterSpecies('')
        setFilterSearch('')
        fetchLostPets('')
    }

    // ── Estilos comunes
    const cardSt = { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 20, color: TEXT }
    const inp = { width: '100%', padding: '11px 14px', background: CARD2, border: `1.5px solid ${BORDER}`, borderRadius: 10, color: TEXT, fontSize: 13, fontFamily: FONT, outline: 'none', boxSizing: 'border-box' }
    const lbl = { fontSize: 12, fontWeight: 700, color: MUTED, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 }

    return (
        <div className="lostpets-page" style={{ minHeight: '100vh', background: 'transparent', color: TEXT, fontFamily: FONT, paddingBottom: 60, position: 'relative' }}>
            <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

            <div className="lp-shell" style={{ maxWidth: 1400, margin: '0 auto', padding: '90px 24px 32px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>

                {/* ═════════════════════════════ MAIN COLUMN ═════════════════════════════ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>

                    {/* ─── Header ─── */}
                    <header className="lp-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                        <div>
                            <div className="owner-hero-title-row"><OwnerPawIcon /><h1 className="owner-title lp-main-title" style={{ fontSize: '2.6rem', fontWeight: 900, color: TEXT, margin: 0, lineHeight: 1.05, letterSpacing: '-1.5px' }}>
                                Mascotas <span style={{ color: O2 }}>perdidas</span> o <span style={{ color: G2 }}>encontradas</span>
                            </h1></div>
                            <p style={{ fontSize: '0.95rem', color: MUTED2, margin: 0, marginTop: 8, lineHeight: 1.5, maxWidth: 560 }}>
                                Ayudanos a reunir familias. Publicá un aviso o buscá mascotas en tu zona.
                            </p>
                        </div>
                        <button onClick={scrollToForm} style={{ background: GRAD, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontFamily: FONT, fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 6px 20px rgba(76,175,80,0.30)', whiteSpace: 'nowrap' }}>+ Publicar aviso</button>
                    </header>

                    {/* ─── 3 Stat cards ─── */}
                    <section className="lp-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                        <StatCard
                            iconImg={lostSearchIcon}
                            color={O2}
                            ringBg="rgba(255,152,0,0.12)"
                            num={lostCount}
                            label="Se buscan"
                            sub="Mascotas que esperan volver a casa"
                        />
                        <StatCard
                            iconImg={lostFoundIcon}
                            color={G2}
                            ringBg="rgba(76,175,80,0.12)"
                            num={foundCount}
                            label="Encontradas"
                            sub="Mascotas encontradas recientemente"
                        />
                        <StatCard
                            iconImg={lostReportsIcon}
                            color={O2}
                            ringBg="rgba(255,152,0,0.12)"
                            num={totalActive}
                            label="Reportes activos"
                            sub="Avisos vigentes en VetPaw"
                            cta={totalActive > 0 ? '→' : null}
                            onClick={totalActive > 0 ? () => window.scrollTo({ top: 400, behavior: 'smooth' }) : null}
                        />
                    </section>

                    {/* ─── Filtros ─── */}
                    <section style={{ ...cardSt, padding: 16, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                        <div style={{ minWidth: 160, flex: '1 1 160px' }}>
                            <label style={lbl}>Provincia</label>
                            <select value={filterProvince}
                                onChange={e => { setFilterProvince(e.target.value); fetchLostPets(e.target.value) }}
                                style={{ ...inp, cursor: 'pointer' }}>
                                <option value="" style={{ background: CARD2 }}>Todas</option>
                                {PROVINCIAS.map(p => <option key={p} value={p} style={{ background: CARD2 }}>{p}</option>)}
                            </select>
                        </div>
                        <div style={{ minWidth: 140, flex: '1 1 140px' }}>
                            <label style={lbl}>Estado</label>
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                                <option value="" style={{ background: CARD2 }}>Todos</option>
                                <option value="lost" style={{ background: CARD2 }}>Se busca</option>
                                <option value="found" style={{ background: CARD2 }}>Encontrada</option>
                            </select>
                        </div>
                        <div style={{ minWidth: 140, flex: '1 1 140px' }}>
                            <label style={lbl}>Especie</label>
                            <select value={filterSpecies} onChange={e => setFilterSpecies(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                                <option value="" style={{ background: CARD2 }}>Todas</option>
                                {SPECIES_FORM.map(s => <option key={s.val} value={s.val} style={{ background: CARD2 }}>{s.emoji} {s.label}</option>)}
                            </select>
                        </div>
                        <div style={{ minWidth: 220, flex: '2 1 220px' }}>
                            <label style={lbl}>Buscar</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: MUTED3, fontSize: 14, pointerEvents: 'none' }}>🔍</span>
                                <input value={filterSearch} onChange={e => setFilterSearch(e.target.value)} placeholder="Nombre, zona, raza…" style={{ ...inp, paddingLeft: 36 }} />
                            </div>
                        </div>
                        {hasAnyFilter && (
                            <button onClick={clearFilters} style={{ marginTop: 22, padding: '10px 16px', background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10, color: MUTED2, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}>
                                ✕ Limpiar filtros
                            </button>
                        )}
                    </section>

                    {/* ─── Reportes recientes (grid) ─── */}
                    <section>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: TEXT, margin: 0 }}>Reportes recientes</h2>
                            <span style={{ fontSize: 13, color: MUTED3, fontWeight: 600 }}>
                                {filteredPets.length} {filteredPets.length === 1 ? 'reporte' : 'reportes'}{hasAnyFilter ? ' coincide' + (filteredPets.length === 1 ? '' : 'n') : ''}
                            </span>
                        </div>

                        {loading ? (
                            <div style={{ ...cardSt, padding: 60, textAlign: 'center', color: MUTED3, fontSize: 14 }}>Cargando reportes…</div>
                        ) : filteredPets.length === 0 ? (
                            <div style={{ ...cardSt, padding: '60px 20px', textAlign: 'center' }}>
                                <div style={{ fontSize: 56, marginBottom: 14 }}>🔍</div>
                                <p style={{ color: MUTED2, fontSize: 15, margin: 0, fontWeight: 600 }}>
                                    {hasAnyFilter ? 'No hay reportes que coincidan con los filtros' : 'Aún no hay reportes activos'}
                                </p>
                                <p style={{ color: MUTED3, fontSize: 13, margin: 0, marginTop: 6 }}>
                                    {hasAnyFilter ? 'Probá ajustando o limpiando los filtros.' : 'Cuando alguien publique un aviso, aparecerá acá.'}
                                </p>
                                {!hasAnyFilter && (
                                    <button onClick={scrollToForm} style={{ marginTop: 18, background: GRAD, color: '#fff', border: 'none', borderRadius: 11, padding: '11px 22px', fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}>
                                        + Publicar el primer aviso
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="lp-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                                    {visiblePets.map(pet => (
                                        <PetCard key={pet.id} pet={pet} onOpen={() => setSelectedPet(pet)} />
                                    ))}
                                </div>
                                {visibleCount < filteredPets.length && (
                                    <div style={{ textAlign: 'center', marginTop: 22 }}>
                                        <button onClick={() => setVisibleCount(v => v + 12)} style={{ padding: '11px 24px', background: CARD2, border: `1.5px solid ${BORDER}`, borderRadius: 11, color: TEXT, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>
                                            Cargar más reportes ↓
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </section>

                    {/* ─── Formulario "Publicá un aviso" ─── */}
                    <section ref={formRef} style={{ ...cardSt, padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(76,175,80,0.12)', border: `1px solid ${G2}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🐕</div>
                            <div>
                                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: TEXT, margin: 0 }}>Publicá un aviso</h2>
                                <p style={{ fontSize: 12, color: MUTED3, margin: 0, marginTop: 2 }}>Completá los datos para ayudar a que más personas te encuentren.</p>
                            </div>
                        </div>

                        <div style={{ padding: '22px 24px 24px' }}>
                            {!user ? (
                                <div style={{ background: 'linear-gradient(135deg, rgba(76,175,80,0.08), rgba(255,152,0,0.08))', border: `1.5px solid rgba(76,175,80,0.2)`, borderRadius: 14, padding: 32, textAlign: 'center' }}>
                                    <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
                                    <h3 style={{ fontSize: 16, fontWeight: 800, color: TEXT, marginBottom: 8 }}>Necesitás una cuenta para publicar</h3>
                                    <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, maxWidth: 420, margin: '0 auto 22px' }}>
                                        Crear tu cuenta es gratis y lleva menos de un minuto. Podés seguir viendo los reportes sin registrarte.
                                    </p>
                                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                                        <Link to="/register" style={{ background: GRAD, color: '#fff', fontWeight: 800, fontSize: 14, padding: '12px 24px', borderRadius: 11, textDecoration: 'none' }}>Registrarme gratis</Link>
                                        <Link to="/login" style={{ background: CARD2, color: TEXT, fontWeight: 700, fontSize: 14, padding: '12px 24px', borderRadius: 11, textDecoration: 'none', border: `1.5px solid ${BORDER}` }}>Ingresar</Link>
                                    </div>
                                </div>
                            ) : reporteEnviado ? (
                                <div style={{ background: 'rgba(76,175,80,0.08)', border: `1.5px solid ${G2}40`, borderRadius: 12, padding: 28, textAlign: 'center' }}>
                                    <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
                                    <h3 style={{ fontWeight: 800, color: G2, fontSize: 16, margin: 0 }}>¡Reporte publicado!</h3>
                                    <p style={{ fontSize: 13, color: MUTED, marginTop: 8 }}>Gracias por ayudar. Esperamos que esta mascota vuelva a casa pronto.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleReporte}>
                                    {/* Tipo de reporte */}
                                    <div className="lp-form-row" style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                                        <button type="button" onClick={() => setReportType('lost')}
                                            style={{ flex: 1, padding: 14, borderRadius: 12, border: `2px solid ${reportType === 'lost' ? O2 : BORDER}`, background: reportType === 'lost' ? 'rgba(255,152,0,0.1)' : CARD2, color: reportType === 'lost' ? O2 : MUTED, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: FONT, transition: 'all .2s' }}>
                                            🔍 Busco a mi mascota
                                            <div style={{ fontSize: 11, fontWeight: 500, marginTop: 3, opacity: 0.8 }}>Mi mascota se perdió</div>
                                        </button>
                                        <button type="button" onClick={() => setReportType('found')}
                                            style={{ flex: 1, padding: 14, borderRadius: 12, border: `2px solid ${reportType === 'found' ? G2 : BORDER}`, background: reportType === 'found' ? 'rgba(76,175,80,0.1)' : CARD2, color: reportType === 'found' ? G2 : MUTED, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: FONT, transition: 'all .2s' }}>
                                            🐾 Encontré una mascota
                                            <div style={{ fontSize: 11, fontWeight: 500, marginTop: 3, opacity: 0.8 }}>Quiero ayudar a su familia</div>
                                        </button>
                                    </div>

                                    {/* Foto + descripción */}
                                    <div className="lp-form-row" style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                                        <div style={{ flex: '0 0 200px' }}>
                                            <label style={lbl}>Foto de la mascota <span style={{ color: O2 }}>*</span></label>
                                            {fotoPreview ? (
                                                <div style={{ position: 'relative' }}>
                                                    <img src={fotoPreview} alt="Preview" style={{ width: '100%', height: 190, objectFit: 'contain', objectPosition: 'center', background: '#07111f', borderRadius: 11, border: `2px solid ${G2}` }} />
                                                    <button type="button" onClick={() => { setFotoPreview((current) => { revokeObjectUrl(current); return null }); setFotoMascota(null); if (fileRef.current) fileRef.current.value = ''; if (cameraRef.current) cameraRef.current.value = '' }} style={{ position: 'absolute', top: -8, right: -8, background: RED, color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: 11, fontWeight: 900 }}>✕</button>
                                                </div>
                                            ) : (
                                                <div onClick={() => fileRef.current?.click()}
                                                    style={{ border: `2px dashed ${BORDER}`, borderRadius: 11, height: 156, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', background: CARD2 }}>
                                                    <div style={{ fontSize: 26 }}>📷</div>
                                                    <p style={{ fontSize: 12, color: MUTED, fontWeight: 600, margin: 0 }}>Subí una foto clara</p>
                                                    <p style={{ fontSize: 10, color: MUTED3, margin: 0 }}>JPG, PNG – máx. 5MB</p>
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                                <button type="button" onClick={() => fileRef.current?.click()} style={{ flex: 1, border: `1px solid ${BORDER}`, borderRadius: 9, background: CARD2, color: MUTED2, padding: '8px 6px', fontFamily: FONT, fontWeight: 700, cursor: 'pointer' }}>🖼️ Elegir</button>
                                                <button type="button" onClick={() => cameraRef.current?.click()} style={{ flex: 1, border: `1px solid ${G2}55`, borderRadius: 9, background: 'rgba(76,175,80,.09)', color: G2, padding: '8px 6px', fontFamily: FONT, fontWeight: 700, cursor: 'pointer' }}>📸 Cámara</button>
                                            </div>
                                            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFoto} style={{ display: 'none' }} />
                                            <input ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={handleFoto} style={{ display: 'none' }} />
                                        </div>

                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                                            <div>
                                                <label style={lbl}>
                                                    {reportType === 'lost' ? '¿Dónde y cuándo la perdiste?' : '¿Dónde y cuándo la encontraste?'} <span style={{ color: O2 }}>*</span>
                                                </label>
                                                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} maxLength={500}
                                                    placeholder="Contanos más detalles: lugar, fecha, hora, cómo estaba, si tenía collar, rasgos distintivos, etc."
                                                    rows={4} style={{ ...inp, resize: 'none' }} />
                                                <p style={{ fontSize: 10, color: MUTED3, textAlign: 'right', marginTop: 2 }}>{descripcion.length}/500</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Campos opcionales: nombre, especie, raza, fecha */}
                                    <div style={{ background: CARD2, border: `1px dashed ${BORDER}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
                                        <p style={{ fontSize: 12, color: MUTED, fontWeight: 700, marginBottom: 12, margin: 0 }}>
                                            📌 Datos opcionales — ayudan a que más gente reconozca a la mascota
                                        </p>
                                        <div className="lp-form-row" style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <label style={lbl}>Nombre</label>
                                                <input value={petName} onChange={e => setPetName(e.target.value)} maxLength={80} placeholder="Ej: Simba" style={inp} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <label style={lbl}>Especie</label>
                                                <select value={species} onChange={e => setSpecies(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                                                    <option value="" style={{ background: CARD2 }}>—</option>
                                                    {SPECIES_FORM.map(s => <option key={s.val} value={s.val} style={{ background: CARD2 }}>{s.emoji} {s.label}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="lp-form-row" style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <label style={lbl}>Raza</label>
                                                <input value={breed} onChange={e => setBreed(e.target.value)} maxLength={80} placeholder="Ej: Golden Retriever" style={inp} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <label style={lbl}>Fecha del incidente</label>
                                                <input type="date" value={incidentDate} onChange={e => setIncidentDate(e.target.value)} style={inp} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Provincia + Localidad */}
                                    <div className="lp-form-row" style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <label style={lbl}>Provincia <span style={{ color: O2 }}>*</span></label>
                                            <select value={province} onChange={e => setProvince(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                                                <option value="" style={{ background: CARD2 }}>Seleccioná una provincia</option>
                                                {PROVINCIAS.map(p => <option key={p} value={p} style={{ background: CARD2 }}>{p}</option>)}
                                            </select>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <label style={lbl}>Ciudad / Localidad <span style={{ color: O2 }}>*</span></label>
                                            <input value={locality} onChange={e => setLocality(e.target.value)} placeholder="Ej: Palermo, Moreno…" style={inp} />
                                        </div>
                                    </div>

                                    {/* Contacto */}
                                    <div className="lp-form-row" style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                                        <div style={{ flex: '0 0 180px', minWidth: 0 }}>
                                            <label style={lbl}>Medio de contacto <span style={{ color: O2 }}>*</span></label>
                                            <select value={contactType} onChange={e => setContactType(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                                                <option value="phone" style={{ background: CARD2 }}>📱 WhatsApp</option>
                                                <option value="home_phone" style={{ background: CARD2 }}>📞 Teléfono fijo</option>
                                                <option value="email" style={{ background: CARD2 }}>✉️ Email</option>
                                            </select>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <label style={lbl}>{contactType === 'email' ? 'Email' : 'Teléfono / Contacto'} <span style={{ color: O2 }}>*</span></label>
                                            <input value={contactValue} onChange={e => setContactValue(e.target.value)} placeholder={contactType === 'email' ? 'tucorreo@ejemplo.com' : 'Ej: 11 2345-6789'} style={inp} />
                                        </div>
                                    </div>

                                    {errorEnvio && <p style={{ color: RED, fontSize: 12, marginTop: 12, fontWeight: 600 }}>{errorEnvio}</p>}

                                    <button type="submit" disabled={enviando}
                                        style={{ width: '100%', marginTop: 18, padding: 15, background: enviando ? 'rgba(255,255,255,0.08)' : GRAD, color: '#fff', fontWeight: 800, fontSize: 15, borderRadius: 12, border: 'none', cursor: enviando ? 'not-allowed' : 'pointer', fontFamily: FONT, boxShadow: enviando ? 'none' : '0 6px 22px rgba(76,175,80,0.25)' }}>
                                        {enviando ? 'Publicando…' : 'Publicar aviso'}
                                        {!enviando && <div style={{ fontSize: 11, fontWeight: 500, marginTop: 2, opacity: 0.85 }}>Tu publicación ayudará a que más personas la vean</div>}
                                    </button>
                                </form>
                            )}
                        </div>
                    </section>
                </div>

                {/* ═════════════════════════════ SIDEBAR ═════════════════════════════ */}
                <aside className="lp-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

                    {/* ¿Qué hacer? */}
                    <div style={cardSt}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(102,187,106,0.12)', border: `1px solid ${G2}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🐕</div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: TEXT, margin: 0 }}>¿Qué hacer?</h3>
                        </div>

                        {/* Si perdiste a tu mascota */}
                        <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: 0, marginBottom: 8 }}>Si perdiste a tu mascota</p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <TipItem icon="📝" text="Publicá tu aviso cuanto antes. Incluí la mayor cantidad de detalles posibles." />
                            <TipItem icon="🚶" text="Recorré la zona y preguntá a vecinos y comercios cercanos." />
                            <TipItem icon="📢" text="Compartí el aviso en redes sociales y grupos locales." />
                        </ul>

                        {/* Si encontraste una mascota */}
                        <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: 0, marginBottom: 8 }}>Si encontraste una mascota</p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <TipItem icon="🔎" text="Verificá si tiene collar o identificación visible." />
                            <TipItem icon="📍" text="Publicá un aviso como “Encontrada” con la zona exacta." />
                            <TipItem icon="🏥" text="Llevala al veterinario para revisar si tiene microchip." />
                        </ul>
                    </div>

                    {/* La seguridad es lo primero */}
                    <div style={{ ...cardSt, background: 'rgba(76,175,80,0.06)', border: `1px solid ${G2}30` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <span style={{ fontSize: 18 }}>🛡️</span>
                            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: G2, margin: 0 }}>La seguridad es lo primero</h4>
                        </div>
                        <p style={{ fontSize: 12, color: MUTED2, lineHeight: 1.55, margin: 0 }}>
                            Nunca compartas información personal sensible. Coordiná encuentros en lugares públicos y seguros.
                        </p>
                    </div>

                    {/* Contactar soporte */}
                    <div style={cardSt}>
                        <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: TEXT, margin: 0, marginBottom: 4 }}>¿Necesitás más ayuda?</h4>
                        <p style={{ fontSize: 12, color: MUTED, margin: 0, marginBottom: 12 }}>Contactanos y te asesoramos.</p>
                        <button onClick={() => navigate('/contact')} style={{ width: '100%', background: CARD2, border: `1px solid ${BORDER}`, color: TEXT, padding: '11px 14px', borderRadius: 11, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: FONT, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            🎧 Contactar soporte
                        </button>
                    </div>
                </aside>
            </div>

            {/* ═════════════════════════════ MODAL ═════════════════════════════ */}
            {selectedPet && (
                <div onClick={() => setSelectedPet(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div onClick={e => e.stopPropagation()} style={{ background: CARD, borderRadius: 20, overflow: 'hidden', maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto', border: `2px solid ${selectedPet.report_type === 'lost' ? O2 + '50' : G2 + '50'}`, boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
                        <div style={{ position: 'relative', height: 'clamp(300px, 52vh, 520px)', background: '#070d16', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {selectedPet.photo_url ? (
                                <img
                                    src={selectedPet.photo_url}
                                    alt={selectedPet.pet_name || 'Mascota'}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block' }}
                                />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>{speciesEmoji(selectedPet.species)}</div>
                            )}
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7))' }} />
                            <div style={{ position: 'absolute', top: 14, left: 14, background: selectedPet.report_type === 'lost' ? O1 : G1, color: '#fff', fontSize: 11, fontWeight: 900, letterSpacing: 1.5, padding: '5px 12px', borderRadius: 6, textTransform: 'uppercase' }}>
                                {selectedPet.report_type === 'lost' ? '🔍 Se busca' : '📍 Encontrada'}
                            </div>
                            {typeof selectedPet.days_left === 'number' && (
                                <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.6)', color: G2, fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 99, border: `1px solid ${G2}50` }}>{selectedPet.days_left}d restantes</div>
                            )}
                            <button onClick={() => setSelectedPet(null)} style={{ position: 'absolute', bottom: 14, right: 14, background: 'rgba(0,0,0,0.5)', border: `1px solid ${BORDER}`, color: '#fff', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 14 }}>✕</button>
                        </div>
                        <div style={{ padding: '18px 22px 22px' }}>
                            {selectedPet.pet_name && (
                                <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: TEXT, margin: 0, marginBottom: 4 }}>{selectedPet.pet_name}</h3>
                            )}
                            {(selectedPet.species_display || selectedPet.breed) && (
                                <p style={{ fontSize: 13, color: MUTED2, margin: 0, marginBottom: 12 }}>
                                    {selectedPet.species_display && <span>{speciesEmoji(selectedPet.species)} {selectedPet.species_display}</span>}
                                    {selectedPet.species_display && selectedPet.breed && ' · '}
                                    {selectedPet.breed && <span>{selectedPet.breed}</span>}
                                </p>
                            )}
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                                {(selectedPet.locality || selectedPet.province) && (
                                    <span style={{ fontSize: 12, color: MUTED2, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '5px 11px', fontWeight: 600 }}>
                                        📍 {[selectedPet.locality, selectedPet.province].filter(Boolean).join(', ')}
                                    </span>
                                )}
                                {selectedPet.incident_date && (
                                    <span style={{ fontSize: 12, color: MUTED2, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '5px 11px', fontWeight: 600 }}>
                                        📅 {fmtDate(selectedPet.incident_date)}
                                    </span>
                                )}
                            </div>
                            <p style={{ fontSize: 14, color: MUTED2, lineHeight: 1.7, marginBottom: 18, whiteSpace: 'pre-wrap' }}>{selectedPet.description}</p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                <div style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>
                                    {selectedPet.contact_type === 'phone' ? '📱' : selectedPet.contact_type === 'home_phone' ? '📞' : '✉️'} {selectedPet.contact_value}
                                </div>
                                {selectedPet.contact_type === 'email' ? (
                                    <a href={`mailto:${selectedPet.contact_value}`} style={{ background: 'rgba(107,202,255,0.15)', border: `1px solid ${B1}40`, color: B1, fontSize: 13, fontWeight: 700, padding: '10px 18px', borderRadius: 10, textDecoration: 'none' }}>✉️ Email</a>
                                ) : (
                                    <a href={`https://wa.me/54${selectedPet.contact_value?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(37,211,102,0.15)', border: `1px solid ${WA}40`, color: WA, fontSize: 13, fontWeight: 700, padding: '10px 18px', borderRadius: 10, textDecoration: 'none' }}>💬 WhatsApp</a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {editorFile && (
                <ImageEditorModal
                    file={editorFile}
                    title="Ajustar foto del aviso"
                    onCancel={() => setEditorFile(null)}
                    onApply={applyEditedPhoto}
                />
            )}

            {/* ── Responsive ── */}
            <style>{`


/* ───────────────── VetPaw dueño visual refresh v2 ───────────────── */
.owner-cosmic-bg,
.dash-page,
.pets-page,
.appts-page,
.clinics-page,
.lostpets-page,
.history-page {
    background:
        linear-gradient(180deg, rgba(3, 10, 20, .72) 0%, rgba(5, 12, 28, .78) 42%, rgba(4, 9, 20, .86) 100%),
        url(${ownerBg}) center top / cover fixed no-repeat !important;
    position: relative;
    isolation: isolate;
}
.owner-cosmic-bg::before,
.dash-page::before,
.pets-page::before,
.appts-page::before,
.clinics-page::before,
.lostpets-page::before,
.history-page::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background:
        radial-gradient(circle at 15% 10%, rgba(54, 116, 255, .10), transparent 28%),
        radial-gradient(circle at 76% 88%, rgba(31, 95, 255, .15), transparent 32%),
        radial-gradient(circle at 92% 32%, rgba(76, 175, 80, .07), transparent 26%);
    opacity: .75;
}
.owner-cosmic-bg::after,
.dash-page::after,
.pets-page::after,
.appts-page::after,
.clinics-page::after,
.lostpets-page::after,
.history-page::after {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.025), transparent);
    opacity: .45;
}
.owner-title,
.dash-title-modern,
.pets-title,
.appts-title,
.hero-title,
.history-title {
    font-family: 'Plus Jakarta Sans', 'Nunito', sans-serif !important;
    font-style: normal !important;
    font-weight: 900 !important;
    letter-spacing: -1.3px !important;
    text-shadow: 0 10px 34px rgba(0,0,0,.25);
}
.owner-icon-badge {
    width: 52px;
    height: 52px;
    border-radius: 18px;
    display: inline-grid;
    place-items: center;
    background: linear-gradient(135deg, rgba(76,175,80,.16), rgba(255,152,0,.15));
    border: 1px solid rgba(255,255,255,.10);
    box-shadow: inset 0 0 26px rgba(255,255,255,.04), 0 12px 30px rgba(0,0,0,.25);
    color: #fff;
    vertical-align: middle;
}
.owner-icon-badge svg { width: 30px; height: 30px; display: block; }
.owner-icon-badge--image { overflow: hidden; }
.owner-title-icon-img { width: 38px; height: 38px; object-fit: contain; display: block; filter: drop-shadow(0 8px 16px rgba(0,0,0,.28)); }
.owner-hero-title-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }

 .owner-gradient-title,
.dash-title-modern,
.pets-title,
.appts-title,
.hero-title,
.history-main-title,
.history-title-main {
    background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 38%, #FFB300 72%, #FF9800 100%) !important;
    -webkit-background-clip: text !important;
    background-clip: text !important;
    color: transparent !important;
    -webkit-text-fill-color: transparent !important;
    filter:
        drop-shadow(1px 0 0 rgba(0,0,0,.82))
        drop-shadow(-1px 0 0 rgba(0,0,0,.82))
        drop-shadow(0 1px 0 rgba(0,0,0,.82))
        drop-shadow(0 -1px 0 rgba(0,0,0,.82))
        drop-shadow(0 3px 5px rgba(0,0,0,.36));
    text-shadow: none !important;
}
.paw-runner {
    font-size: 3rem;
    display: inline-block;
    animation: pawRun 1.35s ease-in-out infinite;
    transform-origin: center bottom;
}
@keyframes pawRun {
    0% { transform: translateX(-22px) translateY(0) rotate(-7deg); opacity: .55; }
    25% { transform: translateX(-8px) translateY(-5px) rotate(4deg); opacity: 1; }
    50% { transform: translateX(10px) translateY(0) rotate(-3deg); opacity: 1; }
    75% { transform: translateX(24px) translateY(-5px) rotate(5deg); opacity: .9; }
    100% { transform: translateX(42px) translateY(0) rotate(-6deg); opacity: .55; }
}


                @keyframes lpCardIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .lp-card { animation: lpCardIn 0.3s ease both; transition: transform .18s, border-color .18s, box-shadow .18s; }
                .lp-card:hover { transform: translateY(-3px); border-color: ${G2}40; box-shadow: 0 12px 32px rgba(0,0,0,0.4); }
                .lp-card-photo { height: clamp(250px, 27vw, 320px); }
                .lp-card-photo-main { transition: transform .22s ease; }
                .lp-card:hover .lp-card-photo-main { transform: scale(1.015); }
                .lp-shell select:focus, .lp-shell input:focus, .lp-shell textarea:focus { border-color: ${G2} !important; }

                @media (max-width: 1100px) {
                    .lp-shell { grid-template-columns: 1fr !important; }
                    .lp-sidebar { order: 2; }
                    .lp-grid { grid-template-columns: repeat(2, 1fr) !important; }
                }
                @media (max-width: 720px) {
                    .lp-shell { padding: 76px 14px 32px !important; gap: 16px !important; }
                    .lp-header h1 { font-size: 1.55rem !important; }
                    .lp-stats { grid-template-columns: 1fr !important; }
                    .lp-grid { grid-template-columns: 1fr !important; }
                    .lp-card-photo { height: clamp(290px, 82vw, 440px); }
                    .lp-form-row { flex-direction: column !important; }
                    .lp-form-row > div { flex: 1 1 100% !important; }
                }
                @media (max-width: 380px) {
                    .lp-shell { padding: 72px 10px 32px !important; }
                }
            `}</style>
        </div>
    )
}

// ──────────────── Sub-componentes
function StatCard({ icon, iconImg, color, ringBg, num, label, sub, cta, onClick }) {
    return (
        <div onClick={onClick} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 14, cursor: onClick ? 'pointer' : 'default', minWidth: 0 }}>
            <div style={{ width: 54, height: 54, borderRadius: '18px', background: ringBg, border: `1.5px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0, overflow: 'hidden' }}>{iconImg ? <img src={iconImg} alt="" style={{ width: 48, height: 48, objectFit: 'contain', filter: 'drop-shadow(0 8px 14px rgba(0,0,0,.30))' }} /> : icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '1.9rem', fontWeight: 900, color, lineHeight: 1, fontFamily: FONT }}>{num}</div>
                <div style={{ fontSize: '0.85rem', color: TEXT, fontWeight: 700, marginTop: 4 }}>{label}</div>
                {sub && <div style={{ fontSize: '0.74rem', color: MUTED3, marginTop: 2 }}>{sub}</div>}
            </div>
            {cta && <span style={{ color, fontSize: '1.3rem', fontWeight: 900, flexShrink: 0 }}>{cta}</span>}
        </div>
    )
}

function PetCard({ pet, onOpen }) {
    const isLost = pet.report_type === 'lost'
    const badgeColor = isLost ? O1 : G1
    const dateToShow = pet.incident_date || pet.created_at
    const isPhone = pet.contact_type === 'phone' || pet.contact_type === 'home_phone'

    return (
        <div className="lp-card" onClick={onOpen} style={{ background: CARD, borderRadius: 16, overflow: 'hidden', border: `1.5px solid ${badgeColor}25`, cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
            <div className="lp-card-photo" style={{ position: 'relative', overflow: 'hidden', background: '#07111f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {pet.photo_url ? (
                    <>
                        <img
                            src={pet.photo_url}
                            alt=""
                            aria-hidden="true"
                            style={{ position: 'absolute', inset: -22, width: 'calc(100% + 44px)', height: 'calc(100% + 44px)', objectFit: 'cover', filter: 'blur(22px) brightness(.48) saturate(.85)', transform: 'scale(1.08)', opacity: .75 }}
                        />
                        <img
                            className="lp-card-photo-main"
                            src={pet.photo_url}
                            alt={pet.pet_name || 'Mascota'}
                            loading="lazy"
                            style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block' }}
                        />
                        <div style={{ position: 'absolute', zIndex: 2, inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.06), transparent 55%, rgba(0,0,0,.20))', pointerEvents: 'none' }} />
                    </>
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 58 }}>{speciesEmoji(pet.species)}</div>
                )}
                <div style={{ position: 'absolute', zIndex: 3, top: 10, left: 10, background: badgeColor, color: '#fff', fontSize: 10, fontWeight: 900, letterSpacing: 1.2, padding: '4px 10px', borderRadius: 6, textTransform: 'uppercase', boxShadow: '0 6px 18px rgba(0,0,0,.32)' }}>
                    {isLost ? 'Se busca' : 'Encontrada'}
                </div>
                {pet.photo_url && <div style={{ position: 'absolute', zIndex: 3, right: 10, bottom: 10, background: 'rgba(7,17,31,.78)', color: 'rgba(255,255,255,.84)', border: `1px solid ${BORDER}`, borderRadius: 999, padding: '5px 9px', fontSize: 10, fontWeight: 800, backdropFilter: 'blur(8px)' }}>🔍 Ver foto completa</div>}
            </div>

            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                <div>
                    {pet.pet_name ? (
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: TEXT, margin: 0, lineHeight: 1.2 }}>{pet.pet_name}</h3>
                    ) : (
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: MUTED, margin: 0, lineHeight: 1.2, fontStyle: 'italic' }}>Sin nombre</h3>
                    )}
                    {(pet.species_display || pet.breed) && (
                        <p style={{ fontSize: 12, color: MUTED2, margin: 0, marginTop: 2 }}>
                            {pet.species_display && <span>{pet.species_display}</span>}
                            {pet.species_display && pet.breed && <span> · </span>}
                            {pet.breed && <span>{pet.breed}</span>}
                        </p>
                    )}
                </div>

                {(pet.locality || pet.province) && (
                    <p style={{ fontSize: 12, color: MUTED2, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                        📍 {[pet.locality, pet.province].filter(Boolean).join(', ')}
                    </p>
                )}
                {dateToShow && (
                    <p style={{ fontSize: 12, color: MUTED3, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                        📅 {fmtDate(dateToShow)}
                    </p>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
                    <button onClick={(e) => { e.stopPropagation(); onOpen() }} style={{ flex: 1, background: 'transparent', border: `1.5px solid ${G2}60`, color: G2, fontSize: 12, fontWeight: 700, padding: '9px 10px', borderRadius: 10, cursor: 'pointer', fontFamily: FONT }}>
                        Ver detalles
                    </button>
                    {isPhone && pet.contact_value && (
                        <a href={`https://wa.me/54${pet.contact_value.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(37,211,102,0.15)', border: `1px solid ${WA}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: WA, fontSize: 16, flexShrink: 0 }} title="WhatsApp">
                            💬
                        </a>
                    )}
                    {pet.contact_type === 'email' && pet.contact_value && (
                        <a href={`mailto:${pet.contact_value}`} onClick={e => e.stopPropagation()} style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(107,202,255,0.15)', border: `1px solid ${B1}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: B1, fontSize: 16, flexShrink: 0 }} title="Email">
                            ✉️
                        </a>
                    )}
                </div>
            </div>
        </div>
    )
}

function TipItem({ icon, text }) {
    return (
        <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: '50%', background: 'rgba(102,187,106,0.12)', border: `1px solid ${G2}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, marginTop: 1 }}>{icon}</span>
            <span style={{ fontSize: 12.5, color: MUTED2, lineHeight: 1.5 }}>{text}</span>
        </li>
    )
}
