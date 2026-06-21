import { useState, useEffect, useRef } from 'react'
import { getAds, createAd, updateAd, deleteAd } from '../services/api'

const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif"
const G1 = '#4CAF50'
const O1 = '#FF9800'
const DARK2 = '#162032'
const CARD = '#1a2535'

const emptyForm = { id: null, name: '', link: '', start_date: '', end_date: '', order: 0, is_active: true }

export default function AdsManager() {
    const [ads, setAds] = useState([])
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState(emptyForm)
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const fileRef = useRef()

    useEffect(() => { fetchAds() }, [])

    const fetchAds = async () => {
        setLoading(true)
        try {
            const data = await getAds()
            setAds(Array.isArray(data) ? data : (data.results || []))
        } catch (e) {
            console.error(e)
            setError('No se pudieron cargar los anuncios.')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setForm(emptyForm)
        setImageFile(null)
        setImagePreview(null)
        setError('')
        if (fileRef.current) fileRef.current.value = ''
    }

    const handleImage = (e) => {
        const file = e.target.files[0]
        if (!file) return
        setImageFile(file)
        setImagePreview(URL.createObjectURL(file))
    }

    const editAd = (ad) => {
        setForm({
            id: ad.id,
            name: ad.name || '',
            link: ad.link || '',
            start_date: ad.start_date || '',
            end_date: ad.end_date || '',
            order: ad.order ?? 0,
            is_active: ad.is_active,
        })
        setImageFile(null)
        setImagePreview(ad.image_url || null)
        setError('')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (!form.name.trim()) { setError('Poné el nombre del local.'); return }
        if (!form.id && !imageFile) { setError('Subí la imagen del banner.'); return }
        setSaving(true)
        try {
            const payload = {
                name: form.name.trim(),
                link: form.link.trim(),
                start_date: form.start_date,
                end_date: form.end_date,
                order: form.order,
                is_active: form.is_active,
            }
            if (imageFile) payload.image = imageFile
            if (form.id) {
                await updateAd(form.id, payload)
            } else {
                await createAd(payload)
            }
            await fetchAds()
            resetForm()
        } catch (err) {
            console.error(err)
            setError('No se pudo guardar. Revisá los datos e intentá de nuevo.')
        } finally {
            setSaving(false)
        }
    }

    const handleToggle = async (ad) => {
        try {
            await updateAd(ad.id, { is_active: !ad.is_active })
            await fetchAds()
        } catch (e) { console.error(e) }
    }

    const handleDelete = async (ad) => {
        if (!window.confirm(`¿Eliminar el anuncio de "${ad.name}"? No se puede deshacer.`)) return
        try {
            await deleteAd(ad.id)
            await fetchAds()
        } catch (e) { console.error(e) }
    }

    const fmt = (d) => {
        if (!d) return null
        const [y, m, day] = d.split('-')
        return `${day}/${m}/${y}`
    }

    const inputStyle = {
        width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 13, fontFamily: FONT, outline: 'none', boxSizing: 'border-box',
    }
    const labelStyle = { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6, fontFamily: FONT }

    return (
        <div>
            {/* ── Formulario alta/edición ── */}
            <div style={{ background: CARD, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '22px 24px', marginBottom: 28 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: FONT, marginBottom: 18 }}>
                    {form.id ? '✏️ Editar anuncio' : '➕ Nuevo anuncio'}
                </h3>

                {error && <div style={{ background: 'rgba(255,107,107,0.12)', border: '1px solid rgba(255,107,107,0.3)', color: '#ff6b6b', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={labelStyle}>Nombre del local *</label>
                        <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Chicha Petshop" />
                    </div>

                    <div>
                        <label style={labelStyle}>Link (opcional) — WhatsApp o Instagram</label>
                        <input style={inputStyle} value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="https://wa.me/54... o https://instagram.com/usuario" />
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 5 }}>Si lo dejás vacío, el banner se muestra pero no es clickeable.</p>
                    </div>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 140 }}>
                            <label style={labelStyle}>Inicio (mes gratis)</label>
                            <input type="date" style={inputStyle} value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                        </div>
                        <div style={{ flex: 1, minWidth: 140 }}>
                            <label style={labelStyle}>Fin (vence solo)</label>
                            <input type="date" style={inputStyle} value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
                        </div>
                        <div style={{ width: 90 }}>
                            <label style={labelStyle}>Orden</label>
                            <input type="number" style={inputStyle} value={form.order} onChange={e => setForm({ ...form, order: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Imagen del banner {form.id ? '(dejá vacío para no cambiarla)' : '*'}</label>
                        <input ref={fileRef} type="file" accept="image/*" onChange={handleImage}
                            style={{ ...inputStyle, padding: '9px 14px' }} />
                        {imagePreview && (
                            <img src={imagePreview} alt="preview" style={{ marginTop: 10, width: '100%', maxWidth: 360, borderRadius: 12, display: 'block', border: '1px solid rgba(255,255,255,0.1)' }} />
                        )}
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: FONT }}>
                        <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                        Activo (visible en el Home si está dentro de las fechas)
                    </label>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button type="submit" disabled={saving}
                            style={{ background: saving ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${G1}, ${O1})`, color: '#fff', fontWeight: 800, fontSize: 14, padding: '12px 24px', borderRadius: 12, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONT }}>
                            {saving ? 'Guardando...' : form.id ? '💾 Actualizar anuncio' : '➕ Crear anuncio'}
                        </button>
                        {form.id && (
                            <button type="button" onClick={resetForm}
                                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 14, padding: '12px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontFamily: FONT }}>
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* ── Lista de anuncios ── */}
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14, fontFamily: FONT }}>
                📋 Anuncios cargados ({ads.length})
            </h3>

            {loading ? (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Cargando...</p>
            ) : ads.length === 0 ? (
                <div style={{ background: CARD, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                    Todavía no cargaste ningún anuncio.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {ads.map(ad => (
                        <div key={ad.id} style={{ background: CARD, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                            <img src={ad.image_url} alt={ad.name} style={{ width: 130, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0, background: DARK2 }} />
                            <div style={{ flex: 1, minWidth: 180 }}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontFamily: FONT }}>{ad.name}</div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
                                    {ad.link ? '🔗 Con link' : '🚫 Sin link'}
                                    {(ad.start_date || ad.end_date) && ` · 📅 ${fmt(ad.start_date) || '—'} → ${fmt(ad.end_date) || '—'}`}
                                    {` · orden ${ad.order}`}
                                </div>
                                <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 6, background: ad.is_live ? 'rgba(107,255,184,0.15)' : 'rgba(255,255,255,0.06)', color: ad.is_live ? '#6bffb8' : 'rgba(255,255,255,0.4)', border: `1px solid ${ad.is_live ? 'rgba(107,255,184,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
                                        {ad.is_live ? '🟢 EN VIVO' : '⚪ NO VISIBLE'}
                                    </span>
                                    <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 6, background: 'rgba(107,202,255,0.12)', color: '#6bcaff', border: '1px solid rgba(107,202,255,0.3)' }}>
                                        👆 {ad.clicks ?? 0} click{(ad.clicks ?? 0) === 1 ? '' : 's'}
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <button onClick={() => handleToggle(ad)} title={ad.is_active ? 'Desactivar' : 'Activar'}
                                    style={{ background: ad.is_active ? 'rgba(255,217,61,0.12)' : 'rgba(107,255,184,0.12)', border: `1px solid ${ad.is_active ? 'rgba(255,217,61,0.3)' : 'rgba(107,255,184,0.3)'}`, color: ad.is_active ? '#ffd93d' : '#6bffb8', borderRadius: 9, padding: '8px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: FONT }}>
                                    {ad.is_active ? '⏸️ Pausar' : '▶️ Activar'}
                                </button>
                                <button onClick={() => editAd(ad)}
                                    style={{ background: 'rgba(107,202,255,0.12)', border: '1px solid rgba(107,202,255,0.3)', color: '#6bcaff', borderRadius: 9, padding: '8px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: FONT }}>
                                    ✏️ Editar
                                </button>
                                <button onClick={() => handleDelete(ad)}
                                    style={{ background: 'rgba(255,107,107,0.12)', border: '1px solid rgba(255,107,107,0.3)', color: '#ff6b6b', borderRadius: 9, padding: '8px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: FONT }}>
                                    🗑️ Borrar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
