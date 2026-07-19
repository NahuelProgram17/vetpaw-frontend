import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPublicPetProfile, togglePetFollow, updatePublicPetProfile } from '../services/api'
import PostCard from '../components/community/PostCard'
import './Community.css'

export default function PublicPetProfile() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [cover, setCover] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getPublicPetProfile(id)
      setProfile(data)
      setBio(data.bio || '')
      setIsPublic(data.is_public)
    } catch { setError('Este perfil no está disponible.') }
    finally { setLoading(false) }
  }, [id])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const follow = async () => {
    if (!user) { navigate('/login'); return }
    const data = await togglePetFollow(id)
    setProfile((p) => ({ ...p, following: data.following, followers_count: data.followers_count }))
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const data = await updatePublicPetProfile(id, { bio, is_public: isPublic, ...(cover ? { cover } : {}) })
      setProfile(data)
      setEditing(false)
      setCover(null)
    } finally { setSaving(false) }
  }

  if (loading) return <div className="pet-public-page"><div className="empty-feed community-card pet-public-shell"><div className="icon">🐾</div><h3>Cargando perfil...</h3></div></div>
  if (error || !profile) return <div className="pet-public-page"><div className="empty-feed community-card pet-public-shell"><div className="icon">🔒</div><h3>{error}</h3><button className="community-button-secondary" onClick={() => navigate('/comunidad')}>Volver a la comunidad</button></div></div>

  const coverStyle = profile.cover_url ? { backgroundImage: `url(${profile.cover_url})` } : {}
  return (
    <main className="pet-public-page">
      <div className="pet-public-shell">
        <div className="pet-cover" style={coverStyle} />
        <div className="pet-profile-head">
          {profile.photo ? <img className="pet-profile-photo" src={profile.photo} alt={profile.name} /> : <div className="pet-profile-photo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🐾</div>}
          <div className="pet-profile-main">
            <h1>{profile.name}</h1>
            <p>{profile.species_display}{profile.breed ? ` · ${profile.breed}` : ''}{profile.locality ? ` · ${profile.locality}` : ''}</p>
            <div className="pet-profile-stats">
              <div className="pet-profile-stat"><strong>{profile.posts_count}</strong><span>Publicaciones</span></div>
              <div className="pet-profile-stat"><strong>{profile.followers_count}</strong><span>Seguidores</span></div>
            </div>
          </div>
          {profile.is_owner ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="community-button" onClick={() => navigate(`/comunidad?mascota=${profile.id}`)}>✚ Publicar como {profile.name}</button>
              <button className="community-button-secondary" onClick={() => setEditing((v) => !v)}>✏️ Editar perfil social</button>
            </div>
          ) : <button className="community-button" onClick={follow}>{profile.following ? 'Siguiendo' : 'Seguir mascota'}</button>}
        </div>

        {editing && (
          <div className="community-card" style={{ padding: 18, marginBottom: 18 }}>
            <h3 style={{ marginTop: 0 }}>Editar perfil público</h3>
            <p className="composer-sub">Esto no modifica ni muestra el historial médico, vacunas, alergias ni datos privados.</p>
            <textarea className="community-textarea" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Contá cómo es, qué le gusta y alguna curiosidad..." maxLength={500} />
            <label className="file-button" style={{ marginTop: 10 }}>🖼️ Cambiar portada<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => setCover(e.target.files?.[0] || null)} /></label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, color: 'rgba(255,255,255,.72)', fontSize: 11 }}><input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} /> Perfil visible en la comunidad</label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}><button className="community-button-secondary" onClick={() => setEditing(false)}>Cancelar</button><button className="community-button" disabled={saving} onClick={saveProfile}>{saving ? 'Guardando...' : 'Guardar cambios'}</button></div>
          </div>
        )}

        <div className="pet-profile-body">
          <aside className="pet-about community-card">
            <h3>Sobre {profile.name}</h3>
            <p>{profile.bio || 'Su familia todavía no escribió su presentación.'}</p>
            <div className="pet-fact"><span>Especie</span><strong>{profile.species_display}</strong></div>
            {profile.breed && <div className="pet-fact"><span>Raza</span><strong>{profile.breed}</strong></div>}
            {profile.temperament_display && <div className="pet-fact"><span>Personalidad</span><strong>{profile.temperament_display}</strong></div>}
            {(profile.locality || profile.province) && <div className="pet-fact"><span>Zona</span><strong>{[profile.locality, profile.province].filter(Boolean).join(', ')}</strong></div>}
            <div className="pet-fact"><span>Familia</span><strong>{profile.owner_display_name}</strong></div>
          </aside>
          <section>
            {profile.recent_posts?.length ? profile.recent_posts.map((post) => <PostCard key={post.id} initialPost={post} user={user} onDeleted={(postId) => setProfile((p) => ({ ...p, recent_posts: p.recent_posts.filter((x) => x.id !== postId), posts_count: Math.max(0, p.posts_count - 1) }))} />) : <div className="empty-feed community-card"><div className="icon">📷</div><h3>Sin publicaciones todavía</h3><p>Cuando {profile.name} comparta una aventura, aparecerá acá.</p></div>}
          </section>
        </div>
      </div>
    </main>
  )
}
