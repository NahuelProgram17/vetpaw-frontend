import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { createCommunityPost, getPets } from '../../services/api'

export default function PostComposer({ user, onCreated, defaultPetId = null }) {
  const [pets, setPets] = useState([])
  const [pet, setPet] = useState('')
  const [text, setText] = useState('')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)
  const cameraRef = useRef(null)

  useEffect(() => {
    if (user?.role === 'owner') {
      getPets().then((data) => {
        const rows = data.results ?? data
        setPets(Array.isArray(rows) ? rows : [])
        if (defaultPetId && rows?.some((item) => String(item.id) === String(defaultPetId))) setPet(String(defaultPetId))
        else if (rows?.[0]) setPet(String(rows[0].id))
      }).catch(() => setPets([]))
    }
  }, [user, defaultPetId])

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  if (!user) {
    return (
      <div className="community-composer community-card">
        <div className="composer-header">
          <div className="composer-avatar">🐾</div>
          <div><div className="composer-title">Sumate a la conversación</div><div className="composer-sub">Registrate gratis para publicar, dejar patitas y seguir mascotas.</div></div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link className="community-button" style={{ textDecoration: 'none' }} to="/register">Crear cuenta gratis</Link>
          <Link className="community-button-secondary" style={{ textDecoration: 'none' }} to="/login">Ya tengo cuenta</Link>
        </div>
      </div>
    )
  }

  const chooseImage = (file) => {
    setError('')
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('La foto no puede superar los 5 MB.'); return }
    if (preview) URL.revokeObjectURL(preview)
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const submit = async () => {
    if (user.role === 'owner' && !pet) { setError('Primero elegí una mascota.'); return }
    if (!text.trim() && !image) { setError('Escribí algo o agregá una foto.'); return }
    setSaving(true)
    setError('')
    try {
      const created = await createCommunityPost({ text: text.trim(), image, pet: user.role === 'owner' ? pet : null })
      setText('')
      setImage(null)
      if (preview) URL.revokeObjectURL(preview)
      setPreview('')
      if (fileRef.current) fileRef.current.value = ''
      if (cameraRef.current) cameraRef.current.value = ''
      onCreated?.(created)
    } catch (e) {
      const data = e.response?.data
      setError(data?.pet?.[0] || data?.image?.[0] || data?.non_field_errors?.[0] || data?.detail || 'No se pudo publicar.')
    } finally {
      setSaving(false)
    }
  }

  const addHashtag = (tag) => {
    const cleanTag = tag.startsWith('#') ? tag : `#${tag}`
    setText((current) => {
      if (current.toLowerCase().includes(cleanTag.toLowerCase())) return current
      return `${current}${current.trim() ? ' ' : ''}${cleanTag}`
    })
  }

  const actorPhoto = user.role === 'owner' ? pets.find((p) => String(p.id) === pet)?.photo : user.avatar
  const actorName = user.role === 'owner' ? pets.find((p) => String(p.id) === pet)?.name : 'Tu veterinaria'

  return (
    <div className="community-composer community-card">
      <div className="composer-header">
        {actorPhoto ? <img className="composer-avatar" src={actorPhoto} alt="" /> : <div className="composer-avatar">{user.role === 'clinic' ? '🏥' : '🐾'}</div>}
        <div><div className="composer-title">¿Qué querés compartir hoy?</div><div className="composer-sub">Publicás como {actorName || 'tu mascota'}.</div></div>
      </div>
      {error && <div className="community-error">{error}</div>}
      <div className="composer-row">
        {user.role === 'owner' ? (
          pets.length ? (
            <select className="community-select" value={pet} onChange={(e) => setPet(e.target.value)}>
              {pets.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          ) : (
            <Link to="/pets/new" className="community-button-secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+ Crear mascota</Link>
          )
        ) : <div className="community-select" style={{ display: 'flex', alignItems: 'center' }}>🏥 Perfil veterinario</div>}
        <textarea className="community-textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder={user.role === 'clinic' ? 'Compartí un consejo, una novedad o una campaña... Podés usar #hashtags' : 'Una aventura, una foto, una anécdota... Podés usar #hashtags'} maxLength={3000} />
      </div>
      <div className="hashtag-suggestions" aria-label="Hashtags sugeridos">
        <span>Hashtags:</span>
        {['#MiMascota', '#Perros', '#Gatos', '#Adopción', '#Perdidos'].map((tag) => (
          <button type="button" className="hashtag-chip" key={tag} onClick={() => addHashtag(tag)}>{tag}</button>
        ))}
      </div>
      {preview && <div className="composer-preview"><img src={preview} alt="Vista previa" /><button onClick={() => { setImage(null); setPreview(''); if (fileRef.current) fileRef.current.value = ''; if (cameraRef.current) cameraRef.current.value = '' }}>✕</button></div>}
      <div className="composer-actions">
        <div className="composer-media-actions">
          <label className="file-button">🖼️ Elegir foto<input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => chooseImage(e.target.files?.[0])} /></label>
          <label className="file-button camera-button">📸 Sacar foto<input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => chooseImage(e.target.files?.[0])} /></label>
          <Link className="file-button lost-report-button" to="/mascotas-perdidas">🚨 Reportar perdido/encontrado</Link>
        </div>
        <button className="community-button" disabled={saving || (user.role === 'owner' && !pets.length)} onClick={submit}>{saving ? 'Publicando...' : 'Publicar'}</button>
      </div>
    </div>
  )
}
