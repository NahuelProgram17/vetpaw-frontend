import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'

const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif"
const G1 = '#4CAF50'
const O1 = '#FF9800'
const CARD = '#1a2535'
const CARD2 = '#162032'
const BORDER = 'rgba(255,255,255,0.08)'
const MUTED = 'rgba(255,255,255,0.55)'
const RED = '#ff6b6b'
const BLUE = '#6bcaff'

const speciesOptions = [
    { value: '', label: 'Sin especificar' },
    { value: 'dog', label: 'Perro' },
    { value: 'cat', label: 'Gato' },
    { value: 'bird', label: 'Pájaro' },
    { value: 'rabbit', label: 'Conejo' },
    { value: 'fish', label: 'Pez' },
    { value: 'other', label: 'Otro' },
]

const reportOptions = [
    { value: 'lost', label: 'Perdida' },
    { value: 'found', label: 'Encontrada' },
]

const contactOptions = [
    { value: 'phone', label: 'Celular' },
    { value: 'home_phone', label: 'Teléfono de casa' },
    { value: 'email', label: 'Email' },
]

const fmtDate = (value) => {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const fmtDateTime = (value) => {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const isActivePost = (pet) => {
    if (!pet?.expires_at) return true
    return new Date(pet.expires_at).getTime() > Date.now()
}

const emptyEdit = {
    pet_name: '',
    species: '',
    breed: '',
    report_type: 'lost',
    description: '',
    province: '',
    locality: '',
    incident_date: '',
    contact_type: 'phone',
    contact_value: '',
}

export default function AdminLostPetsManager() {
    const [pets, setPets] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState(emptyEdit)
    const [photo, setPhoto] = useState(null)
    const [saving, setSaving] = useState(false)

    const fetchPets = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await api.get('/lost-pets/admin/')
            setPets(res.data || [])
        } catch {
            setError('No se pudieron cargar las publicaciones de mascotas perdidas.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // Carga inicial del módulo admin de mascotas perdidas.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchPets()
    }, [])

    const stats = useMemo(() => {
        const active = pets.filter(isActivePost).length
        return {
            total: pets.length,
            active,
            expired: pets.length - active,
            lost: pets.filter(p => p.report_type === 'lost').length,
            found: pets.filter(p => p.report_type === 'found').length,
        }
    }, [pets])

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        return pets.filter(p => {
            const active = isActivePost(p)
            if (statusFilter === 'active' && !active) return false
            if (statusFilter === 'expired' && active) return false
            if (typeFilter !== 'all' && p.report_type !== typeFilter) return false
            if (q) {
                const hay = `${p.pet_name || ''} ${p.owner_name || ''} ${p.owner_username || ''} ${p.owner_email || ''} ${p.locality || ''} ${p.province || ''} ${p.contact_value || ''} ${p.description || ''}`.toLowerCase()
                if (!hay.includes(q)) return false
            }
            return true
        })
    }, [pets, search, statusFilter, typeFilter])

    const openEdit = (pet) => {
        setEditing(pet)
        setPhoto(null)
        setForm({
            pet_name: pet.pet_name || '',
            species: pet.species || '',
            breed: pet.breed || '',
            report_type: pet.report_type || 'lost',
            description: pet.description || '',
            province: pet.province || '',
            locality: pet.locality || '',
            incident_date: pet.incident_date || '',
            contact_type: pet.contact_type || 'phone',
            contact_value: pet.contact_value || '',
        })
    }

    const change = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

    const saveEdit = async (e) => {
        e.preventDefault()
        if (!editing) return
        if (!form.description.trim() || !form.province.trim() || !form.locality.trim() || !form.contact_value.trim()) {
            alert('Completá descripción, provincia, localidad y contacto.')
            return
        }
        setSaving(true)
        try {
            const fd = new FormData()
            Object.entries(form).forEach(([key, value]) => fd.append(key, value ?? ''))
            if (photo) fd.append('photo', photo)
            await api.patch(`/lost-pets/admin/${editing.id}/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
            setEditing(null)
            await fetchPets()
        } catch {
            alert('No se pudo guardar la publicación. Revisá los campos e intentá de nuevo.')
        } finally {
            setSaving(false)
        }
    }

    const expirePet = async (pet) => {
        if (!window.confirm(`¿Ocultar la publicación de ${pet.pet_name || 'esta mascota'}? Va a dejar de verse públicamente.`)) return
        try {
            await api.post(`/lost-pets/admin/${pet.id}/expire/`)
            await fetchPets()
        } catch { alert('No se pudo ocultar la publicación.') }
    }

    const renewPet = async (pet) => {
        if (!window.confirm(`¿Reactivar la publicación de ${pet.pet_name || 'esta mascota'} por 10 días?`)) return
        try {
            await api.post(`/lost-pets/admin/${pet.id}/renew/`)
            await fetchPets()
        } catch { alert('No se pudo reactivar la publicación.') }
    }

    const deletePet = async (pet) => {
        if (!window.confirm(`¿Eliminar definitivamente la publicación de ${pet.pet_name || 'esta mascota'}? Esta acción no se puede deshacer.`)) return
        try {
            await api.delete(`/lost-pets/admin/${pet.id}/delete/`)
            await fetchPets()
        } catch { alert('No se pudo eliminar la publicación.') }
    }

    const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: `1px solid ${BORDER}`, background: '#0f1923', color: '#fff', fontFamily: FONT, outline: 'none' }
    const labelStyle = { fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800, marginBottom: 6, display: 'block' }

    if (loading) {
        return <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 28, color: MUTED }}>Cargando publicaciones...</div>
    }

    return (
        <div style={{ display: 'grid', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                <div>
                    <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 900, margin: 0, fontFamily: FONT }}>🔍 Mascotas perdidas y encontradas</h2>
                    <p style={{ color: MUTED, fontSize: 13, margin: '6px 0 0' }}>Controlá, editá, ocultá o eliminá las publicaciones realizadas por usuarios.</p>
                </div>
                <button onClick={fetchPets} style={{ border: 'none', borderRadius: 12, padding: '10px 18px', background: `linear-gradient(135deg, ${G1}, ${O1})`, color: '#fff', fontWeight: 900, cursor: 'pointer', fontFamily: FONT }}>🔄 Actualizar</button>
            </div>

            {error && <div style={{ background: 'rgba(255,107,107,0.12)', border: '1px solid rgba(255,107,107,0.3)', color: '#ffb0b0', borderRadius: 12, padding: 14, fontWeight: 700 }}>{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                {[
                    ['📌 Total', stats.total, '#fff'],
                    ['✅ Activas', stats.active, G1],
                    ['⏳ Vencidas/ocultas', stats.expired, O1],
                    ['🔍 Perdidas', stats.lost, '#ffd93d'],
                    ['📍 Encontradas', stats.found, BLUE],
                ].map(([label, value, color]) => (
                    <div key={label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16 }}>
                        <div style={{ color, fontSize: 24, fontWeight: 900 }}>{value}</div>
                        <div style={{ color: MUTED, fontSize: 12, fontWeight: 700 }}>{label}</div>
                    </div>
                ))}
            </div>

            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 14, display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 170px 170px', gap: 10 }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por mascota, dueño, zona, contacto..." style={inputStyle} />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inputStyle}>
                    <option value="all">Todas</option>
                    <option value="active">Solo activas</option>
                    <option value="expired">Ocultas/vencidas</option>
                </select>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={inputStyle}>
                    <option value="all">Todos los tipos</option>
                    <option value="lost">Perdidas</option>
                    <option value="found">Encontradas</option>
                </select>
            </div>

            {filtered.length === 0 ? (
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 38, textAlign: 'center', color: MUTED }}>
                    <div style={{ fontSize: 42, marginBottom: 10 }}>✅</div>
                    No hay publicaciones para esos filtros.
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                    {filtered.map(p => {
                        const active = isActivePost(p)
                        return (
                            <div key={p.id} style={{ background: CARD, border: `1px solid ${active ? 'rgba(76,175,80,0.22)' : 'rgba(255,152,0,0.28)'}`, borderRadius: 18, overflow: 'hidden' }}>
                                <div style={{ height: 170, background: CARD2, position: 'relative' }}>
                                    {p.photo_url ? <img src={p.photo_url} alt={p.pet_name || 'Mascota'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'grid', placeItems: 'center', fontSize: 48 }}>🐾</div>}
                                    <span style={{ position: 'absolute', top: 10, left: 10, padding: '5px 10px', borderRadius: 999, color: '#fff', fontSize: 11, fontWeight: 900, background: p.report_type === 'lost' ? O1 : G1 }}>{p.report_type === 'lost' ? '🔍 Perdida' : '📍 Encontrada'}</span>
                                    <span style={{ position: 'absolute', top: 10, right: 10, padding: '5px 10px', borderRadius: 999, color: active ? G1 : O1, fontSize: 11, fontWeight: 900, background: 'rgba(0,0,0,0.62)', border: `1px solid ${active ? 'rgba(76,175,80,.35)' : 'rgba(255,152,0,.35)'}` }}>{active ? 'Activa' : 'Oculta/vencida'}</span>
                                </div>
                                <div style={{ padding: 16 }}>
                                    <h3 style={{ color: '#fff', margin: 0, fontSize: 18, fontWeight: 900 }}>{p.pet_name || 'Mascota sin nombre'}</h3>
                                    <p style={{ color: MUTED, fontSize: 12, margin: '4px 0 8px' }}>{p.species_display || 'Sin especie'}{p.breed ? ` · ${p.breed}` : ''}</p>
                                    <p style={{ color: 'rgba(255,255,255,.72)', fontSize: 13, lineHeight: 1.45, minHeight: 38, margin: 0 }}>{(p.description || '').slice(0, 130)}{(p.description || '').length > 130 ? '...' : ''}</p>
                                    <div style={{ marginTop: 12, display: 'grid', gap: 5, color: MUTED, fontSize: 12 }}>
                                        <span>📍 {[p.locality, p.province].filter(Boolean).join(', ') || 'Sin ubicación'}</span>
                                        <span>👤 {p.owner_name || p.owner_username || 'Sin usuario'} {p.owner_email ? `· ${p.owner_email}` : ''}</span>
                                        <span>☎️ {p.contact_type_display || p.contact_type}: {p.contact_value || '—'}</span>
                                        <span>📅 Publicada: {fmtDateTime(p.created_at)} · Incidente: {fmtDate(p.incident_date)}</span>
                                        <span>🚩 Reportes: {p.report_count || 0} · Expira: {fmtDateTime(p.expires_at)}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                                        <button onClick={() => openEdit(p)} style={{ border: `1px solid rgba(107,202,255,.45)`, background: 'rgba(107,202,255,.10)', color: BLUE, borderRadius: 10, padding: '8px 12px', fontWeight: 800, cursor: 'pointer' }}>✏️ Editar</button>
                                        {active ? (
                                            <button onClick={() => expirePet(p)} style={{ border: `1px solid rgba(255,152,0,.45)`, background: 'rgba(255,152,0,.10)', color: O1, borderRadius: 10, padding: '8px 12px', fontWeight: 800, cursor: 'pointer' }}>🙈 Ocultar</button>
                                        ) : (
                                            <button onClick={() => renewPet(p)} style={{ border: `1px solid rgba(76,175,80,.45)`, background: 'rgba(76,175,80,.10)', color: G1, borderRadius: 10, padding: '8px 12px', fontWeight: 800, cursor: 'pointer' }}>✅ Reactivar</button>
                                        )}
                                        <button onClick={() => deletePet(p)} style={{ border: `1px solid rgba(255,107,107,.45)`, background: 'rgba(255,107,107,.10)', color: RED, borderRadius: 10, padding: '8px 12px', fontWeight: 800, cursor: 'pointer' }}>🗑 Eliminar</button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {editing && (
                <div onClick={() => setEditing(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.76)', zIndex: 9999, display: 'grid', placeItems: 'center', padding: 20 }}>
                    <form onSubmit={saveEdit} onClick={e => e.stopPropagation()} style={{ width: 'min(760px, 100%)', maxHeight: '90vh', overflow: 'auto', background: '#101c2b', border: `1px solid rgba(76,175,80,.35)`, borderRadius: 20, padding: 22, boxShadow: '0 30px 80px rgba(0,0,0,.55)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 18 }}>
                            <div>
                                <h3 style={{ color: '#fff', fontSize: 22, fontWeight: 900, margin: 0 }}>✏️ Editar publicación</h3>
                                <p style={{ color: MUTED, margin: '4px 0 0', fontSize: 12 }}>Los cambios impactan en la publicación pública.</p>
                            </div>
                            <button type="button" onClick={() => setEditing(null)} style={{ background: CARD, color: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10, width: 38, height: 38, cursor: 'pointer' }}>✕</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
                            <div><label style={labelStyle}>Nombre</label><input style={inputStyle} value={form.pet_name} onChange={e => change('pet_name', e.target.value)} /></div>
                            <div><label style={labelStyle}>Raza</label><input style={inputStyle} value={form.breed} onChange={e => change('breed', e.target.value)} /></div>
                            <div><label style={labelStyle}>Tipo</label><select style={inputStyle} value={form.report_type} onChange={e => change('report_type', e.target.value)}>{reportOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                            <div><label style={labelStyle}>Especie</label><select style={inputStyle} value={form.species} onChange={e => change('species', e.target.value)}>{speciesOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                            <div><label style={labelStyle}>Provincia</label><input style={inputStyle} value={form.province} onChange={e => change('province', e.target.value)} /></div>
                            <div><label style={labelStyle}>Localidad</label><input style={inputStyle} value={form.locality} onChange={e => change('locality', e.target.value)} /></div>
                            <div><label style={labelStyle}>Fecha incidente</label><input type="date" style={inputStyle} value={form.incident_date || ''} onChange={e => change('incident_date', e.target.value)} /></div>
                            <div><label style={labelStyle}>Tipo contacto</label><select style={inputStyle} value={form.contact_type} onChange={e => change('contact_type', e.target.value)}>{contactOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                            <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Contacto</label><input style={inputStyle} value={form.contact_value} onChange={e => change('contact_value', e.target.value)} /></div>
                            <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Descripción</label><textarea style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }} value={form.description} onChange={e => change('description', e.target.value)} /></div>
                            <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Cambiar foto (opcional)</label><input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] || null)} style={inputStyle} /></div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
                            <button type="button" onClick={() => setEditing(null)} style={{ border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, borderRadius: 11, padding: '10px 16px', fontWeight: 800, cursor: 'pointer' }}>Cancelar</button>
                            <button type="submit" disabled={saving} style={{ border: 'none', background: `linear-gradient(135deg, ${G1}, ${O1})`, color: '#fff', borderRadius: 11, padding: '10px 20px', fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer' }}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
