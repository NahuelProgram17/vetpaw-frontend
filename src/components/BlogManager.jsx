import { useState, useEffect, useRef } from 'react'
import { getPosts, createPost, updatePost, deletePost } from '../services/api'
import { prepareImageForUpload, replaceObjectUrl, revokeObjectUrl } from '../utils/imageUpload'

const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif"
const G1 = '#4CAF50'
const O1 = '#FF9800'
const DARK2 = '#162032'
const CARD = '#1a2535'

const emptyForm = { id: null, title: '', excerpt: '', content: '', is_published: true }

export default function BlogManager() {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState(emptyForm)
    const [coverFile, setCoverFile] = useState(null)
    const [coverPreview, setCoverPreview] = useState(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const fileRef = useRef()

    useEffect(() => { fetchPosts() }, [])

    const fetchPosts = async () => {
        setLoading(true)
        try {
            const data = await getPosts()
            setPosts(Array.isArray(data) ? data : (data.results || []))
        } catch (e) {
            console.error(e)
            setError('No se pudieron cargar las notas.')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setForm(emptyForm)
        setCoverFile(null)
        setCoverPreview((current) => { revokeObjectUrl(current); return null })
        setError('')
        if (fileRef.current) fileRef.current.value = ''
    }

    const handleCover = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setError('')
        try {
            const prepared = await prepareImageForUpload(file, { maxMB: 5, maxDimension: 2200, label: 'La portada' })
            setCoverFile(prepared)
            setCoverPreview((current) => replaceObjectUrl(current, prepared))
        } catch (imageError) {
            setError(imageError.message || 'No pudimos preparar la portada.')
            e.target.value = ''
        }
    }

    const editPost = (p) => {
        setForm({
            id: p.id,
            title: p.title || '',
            excerpt: p.excerpt || '',
            content: p.content || '',
            is_published: p.is_published,
        })
        setCoverFile(null)
        setCoverPreview(p.cover_url || null)
        setError('')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (!form.title.trim()) { setError('Poné un título.'); return }
        if (!form.content.trim()) { setError('Escribí el contenido de la nota.'); return }
        setSaving(true)
        try {
            const payload = {
                title: form.title.trim(),
                excerpt: form.excerpt.trim(),
                content: form.content,
                is_published: form.is_published,
            }
            if (coverFile) payload.cover = coverFile
            if (form.id) {
                await updatePost(form.id, payload)
            } else {
                await createPost(payload)
            }
            await fetchPosts()
            resetForm()
        } catch (err) {
            console.error(err)
            setError('No se pudo guardar. Revisá los datos e intentá de nuevo.')
        } finally {
            setSaving(false)
        }
    }

    const handleTogglePublish = async (p) => {
        try {
            await updatePost(p.id, { is_published: !p.is_published })
            await fetchPosts()
        } catch (e) { console.error(e) }
    }

    const handleDelete = async (p) => {
        if (!window.confirm(`¿Eliminar la nota "${p.title}"? No se puede deshacer.`)) return
        try {
            await deletePost(p.id)
            await fetchPosts()
        } catch (e) { console.error(e) }
    }

    const fmt = (d) => {
        if (!d) return ''
        const dt = new Date(d)
        return dt.toLocaleDateString('es-AR')
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
                    {form.id ? '✏️ Editar nota' : '➕ Nueva nota'}
                </h3>

                {error && <div style={{ background: 'rgba(255,107,107,0.12)', border: '1px solid rgba(255,107,107,0.3)', color: '#ff6b6b', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={labelStyle}>Título *</label>
                        <input style={inputStyle} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ej: Cómo viajar con tu mascota al exterior" />
                    </div>

                    <div>
                        <label style={labelStyle}>Bajada / resumen (se ve en la lista)</label>
                        <input style={inputStyle} value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} placeholder="Un resumen corto de la nota" maxLength={300} />
                    </div>

                    <div>
                        <label style={labelStyle}>Contenido * <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>(podés pegar texto con formato Markdown: ## títulos, **negrita**, - listas)</span></label>
                        <textarea style={{ ...inputStyle, minHeight: 260, resize: 'vertical', lineHeight: 1.6, fontFamily: 'monospace' }} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Escribí o pegá el contenido de la nota acá..." />
                    </div>

                    <div>
                        <label style={labelStyle}>Imagen de portada {form.id ? '(dejá vacío para no cambiarla)' : '(opcional)'}</label>
                        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCover} style={{ ...inputStyle, padding: '9px 14px' }} />
                        {coverPreview && (
                            <img src={coverPreview} alt="preview" style={{ marginTop: 10, width: '100%', maxWidth: 360, borderRadius: 12, display: 'block', border: '1px solid rgba(255,255,255,0.1)' }} />
                        )}
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: FONT }}>
                        <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                        Publicada (visible en el blog). Destildá para guardarla como borrador.
                    </label>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button type="submit" disabled={saving}
                            style={{ background: saving ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${G1}, ${O1})`, color: '#fff', fontWeight: 800, fontSize: 14, padding: '12px 24px', borderRadius: 12, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONT }}>
                            {saving ? 'Guardando...' : form.id ? '💾 Actualizar nota' : '➕ Crear nota'}
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

            {/* ── Lista de notas ── */}
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14, fontFamily: FONT }}>
                📝 Notas ({posts.length})
            </h3>

            {loading ? (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Cargando...</p>
            ) : posts.length === 0 ? (
                <div style={{ background: CARD, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                    Todavía no escribiste ninguna nota.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {posts.map(p => (
                        <div key={p.id} style={{ background: CARD, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                            <img src={p.cover_url || 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22130%22 height=%2270%22></svg>'} alt="" style={{ width: 130, height: 70, objectFit: 'cover', borderRadius: 8, flexShrink: 0, background: DARK2 }} />
                            <div style={{ flex: 1, minWidth: 180 }}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontFamily: FONT }}>{p.title}</div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>/blog/{p.slug} · {fmt(p.created_at)}</div>
                                <div style={{ marginTop: 6 }}>
                                    <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 6, background: p.is_published ? 'rgba(107,255,184,0.15)' : 'rgba(255,255,255,0.06)', color: p.is_published ? '#6bffb8' : 'rgba(255,255,255,0.4)', border: `1px solid ${p.is_published ? 'rgba(107,255,184,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
                                        {p.is_published ? '🟢 PUBLICADA' : '⚪ BORRADOR'}
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <button onClick={() => handleTogglePublish(p)}
                                    style={{ background: p.is_published ? 'rgba(255,217,61,0.12)' : 'rgba(107,255,184,0.12)', border: `1px solid ${p.is_published ? 'rgba(255,217,61,0.3)' : 'rgba(107,255,184,0.3)'}`, color: p.is_published ? '#ffd93d' : '#6bffb8', borderRadius: 9, padding: '8px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: FONT }}>
                                    {p.is_published ? '⏸️ Despublicar' : '▶️ Publicar'}
                                </button>
                                <button onClick={() => editPost(p)}
                                    style={{ background: 'rgba(107,202,255,0.12)', border: '1px solid rgba(107,202,255,0.3)', color: '#6bcaff', borderRadius: 9, padding: '8px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: FONT }}>
                                    ✏️ Editar
                                </button>
                                <button onClick={() => handleDelete(p)}
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
