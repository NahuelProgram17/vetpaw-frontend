import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPublicPetProfile, togglePetFollow, updatePublicPetProfile } from '../services/api'
import PostCard from '../components/community/PostCard'
import ProfileShareButton from '../components/community/ProfileShareButton'
import SocialConnectionsModal from '../components/community/SocialConnectionsModal'
import { prepareImageForUpload, replaceObjectUrl, revokeObjectUrl } from '../utils/imageUpload'
import './Community.css'
import './SocialProfile.css'

const ageLabel = (birthDate) => {
  if (!birthDate) return ''
  const birth = new Date(`${birthDate}T12:00:00`)
  const today = new Date()
  let years = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) years -= 1
  if (years > 0) return `${years} año${years === 1 ? '' : 's'}`
  const months = Math.max(0, (today.getFullYear() - birth.getFullYear()) * 12 + today.getMonth() - birth.getMonth())
  return `${months} mes${months === 1 ? '' : 'es'}`
}

const dateLabel = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('es-AR') : ''

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
  const [coverPreview, setCoverPreview] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('posts')
  const [connections, setConnections] = useState(null)
  const [lightbox, setLightbox] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getPublicPetProfile(id)
      setProfile(data)
      setBio(data.bio || '')
      setIsPublic(data.is_public)
    } catch {
      setError('Este perfil no está disponible.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])
  useEffect(() => () => revokeObjectUrl(coverPreview), [coverPreview])
  useEffect(() => {
    if (!lightbox) return undefined
    const onKey = (event) => { if (event.key === 'Escape') setLightbox(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  const identifier = profile?.slug || profile?.id || id
  const profilePath = profile?.profile_url || `/mascotas/${identifier}`
  const closeConnections = useCallback(() => setConnections(null), [])

  const follow = async () => {
    if (!user) { navigate('/login'); return }
    const data = await togglePetFollow(identifier)
    setProfile((current) => ({ ...current, following: data.following, follow_request_pending: Boolean(data.requested), followers_count: data.followers_count }))
  }

  const chooseCover = async (file) => {
    if (!file) return
    setFormError('')
    try {
      const prepared = await prepareImageForUpload(file, { maxMB: 5, maxDimension: 2400, label: 'La portada' })
      setCover(prepared)
      setCoverPreview((current) => replaceObjectUrl(current, prepared))
    } catch (imageError) {
      setFormError(imageError.message || 'No pudimos preparar la portada.')
    }
  }

  const cancelEdit = () => {
    setEditing(false)
    setCover(null)
    revokeObjectUrl(coverPreview)
    setCoverPreview('')
    setFormError('')
    setBio(profile?.bio || '')
    setIsPublic(profile?.is_public ?? true)
  }

  const saveProfile = async () => {
    setSaving(true)
    setFormError('')
    try {
      const data = await updatePublicPetProfile(identifier, { bio, is_public: isPublic, ...(cover ? { cover } : {}) })
      setProfile(data)
      setEditing(false)
      setCover(null)
      revokeObjectUrl(coverPreview)
      setCoverPreview('')
    } catch (saveError) {
      const data = saveError.response?.data
      setFormError(data?.cover?.[0] || data?.detail || 'No se pudo guardar el perfil social.')
    } finally {
      setSaving(false)
    }
  }

  const gallery = useMemo(() => profile?.gallery || [], [profile])

  if (loading) return <main className="social-profile-page"><div className="social-profile-shell social-empty">🐾 Cargando perfil...</div></main>
  if (error || !profile) return <main className="social-profile-page"><div className="social-profile-shell social-card social-empty"><h2>{error}</h2><button className="social-action secondary" onClick={() => navigate('/comunidad')}>Volver a la comunidad</button></div></main>

  const visibleCover = coverPreview || profile.cover_url

  return (
    <main className="social-profile-page">
      <div className="social-profile-shell">
        <section className="social-profile-hero">
          <div className="social-cover">{visibleCover ? <img src={visibleCover} alt={`Portada de ${profile.name}`} /> : <span className="social-cover-fallback">🐾</span>}</div>
          <div className="social-profile-head">
            <div className="social-avatar">{profile.photo ? <img src={profile.photo} alt={profile.name} /> : '🐾'}</div>
            <div className="social-title">
              <h1>{profile.name}</h1>
              <p className="social-subtitle">{profile.species_display}{profile.breed ? ` · ${profile.breed}` : ''}{profile.locality ? ` · ${profile.locality}` : ''}</p>
              <div className="social-badges"><span className="social-badge">🐾 Mascota VetPaw</span>{(profile.age || profile.birth_date) && <span className="social-badge orange">🎂 {profile.age !== null && profile.age !== undefined ? `${profile.age} año${profile.age === 1 ? '' : 's'}` : ageLabel(profile.birth_date)}</span>}</div>
            </div>
            <div className="social-actions">
              {profile.is_owner ? <>
                <button className="social-action" onClick={() => navigate(`/comunidad?mascota=${profile.id}`)}>＋ Publicar como {profile.name}</button>
                <button className="social-action secondary" onClick={() => setEditing((value) => !value)}>✏️ Editar perfil</button>
              </> : <button className={`social-action ${profile.following ? 'following' : ''}`} onClick={follow}>{profile.following ? '✓ Siguiendo' : profile.follow_request_pending ? '⏳ Solicitud enviada' : profile.is_public ? '＋ Seguir' : '🔒 Solicitar seguir'}</button>}
              <ProfileShareButton title={`${profile.name} en VetPaw`} text={`Conocé a ${profile.name} en VetPaw`} path={profilePath} />
            </div>
          </div>
          <div className="social-stats">
            <div className="social-stat"><strong>{profile.posts_count ?? '—'}</strong><span>Publicaciones</span></div>
            <div className="social-stat">{profile.followers_count === null ? <><strong>—</strong><span>Seguidores privados</span></> : <button onClick={() => setConnections('followers')}><strong>{profile.followers_count || 0}</strong><span>Seguidores</span></button>}</div>
            <div className="social-stat">{profile.following_count === null ? <><strong>—</strong><span>Seguidos privados</span></> : <button onClick={() => setConnections('following')}><strong>{profile.following_count || 0}</strong><span>Siguiendo</span></button>}</div>
            <div className="social-stat"><strong>{profile.paws_count ?? '—'}</strong><span>Patitas recibidas</span></div>
          </div>
        </section>

        {!profile.access_granted && !profile.is_owner && (
          <section className="social-card private-profile-lock">
            <div className="lock-icon">🔒</div>
            <h2>Este perfil es privado</h2>
            <p>Podés ver la presentación básica de {profile.name}. Para ver publicaciones, galería y actividad, enviá una solicitud y esperá que su familia la acepte.</p>
            <button className={`social-action ${profile.follow_request_pending ? 'following' : ''}`} onClick={follow}>{profile.follow_request_pending ? 'Cancelar solicitud' : 'Solicitar seguir'}</button>
          </section>
        )}

        {editing && <section className="social-card social-edit-card">
          <h2>Editar perfil público</h2>
          <p>El historial médico, vacunas, alergias y demás información privada nunca se muestran acá.</p>
          <textarea value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Contá cómo es, qué le gusta y alguna curiosidad..." maxLength={500} />
          <label className="file-button" style={{ marginTop: 12 }}>🖼️ Cambiar portada<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => chooseCover(event.target.files?.[0])} /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, color: 'rgba(255,255,255,.72)', fontSize: 11 }}><input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} /> Perfil visible en la comunidad</label>
          {formError && <div className="social-edit-error">{formError}</div>}
          <div className="social-edit-actions"><button className="social-action secondary" onClick={cancelEdit}>Cancelar</button><button className="social-action" disabled={saving} onClick={saveProfile}>{saving ? 'Guardando...' : 'Guardar cambios'}</button></div>
        </section>}

        {(profile.access_granted || profile.is_owner) && <>
        <div className="social-profile-grid">
          <section className="social-card"><h2>Sobre {profile.name}</h2><p>{profile.bio || 'Su familia todavía no escribió su presentación.'}</p></section>
          <aside className="social-card"><h2>Información</h2><div className="social-details">
            <Detail label="Especie" value={profile.species_display} />
            <Detail label="Raza" value={profile.breed} />
            <Detail label="Personalidad" value={profile.temperament_display} />
            <Detail label="Fecha de nacimiento" value={dateLabel(profile.birth_date)} />
            <Detail label="Edad" value={profile.age !== null && profile.age !== undefined ? `${profile.age} año${profile.age === 1 ? '' : 's'}` : ageLabel(profile.birth_date)} />
            <Detail label="Zona" value={[profile.locality, profile.province].filter(Boolean).join(', ')} />
            <Detail label="Familia" value={profile.owner_display_name} />
          </div></aside>
        </div>

        <div className="social-tabs">
          <button className={tab === 'posts' ? 'active' : ''} onClick={() => setTab('posts')}>📸 Publicaciones</button>
          <button className={tab === 'gallery' ? 'active' : ''} onClick={() => setTab('gallery')}>🖼️ Galería</button>
        </div>

        {tab === 'posts' ? <section className="social-post-list">
          {profile.recent_posts?.length ? profile.recent_posts.map((post) => <PostCard key={post.id} initialPost={post} user={user} onDeleted={(postId) => setProfile((current) => ({ ...current, recent_posts: current.recent_posts.filter((item) => item.id !== postId), posts_count: Math.max(0, current.posts_count - 1), gallery: current.gallery.filter((item) => item.post_id !== postId) }))} />) : <div className="social-card social-empty">📷 Cuando {profile.name} comparta una aventura, aparecerá acá.</div>}
        </section> : <section className="social-card">
          {gallery.length ? <div className="social-gallery">{gallery.map((item) => <button type="button" className="social-gallery-item" key={item.post_id} onClick={() => setLightbox(item)}><img src={item.image_url} alt={item.text || `Foto de ${profile.name}`} /><span>{item.text || 'Publicación de VetPaw'}</span></button>)}</div> : <div className="social-empty">Todavía no hay fotos en la galería.</div>}
        </section>}
        </>}
      </div>

      <SocialConnectionsModal open={Boolean(connections)} onClose={closeConnections} profileType="pet" identifier={identifier} initialKind={connections || 'followers'} profileName={profile.name} />
      {lightbox && <div className="social-lightbox" onClick={() => setLightbox(null)}><button onClick={() => setLightbox(null)}>✕</button><img src={lightbox.image_url} alt={lightbox.text || profile.name} onClick={(event) => event.stopPropagation()} /></div>}
    </main>
  )
}

function Detail({ label, value }) { return value ? <div className="social-detail"><span>{label}</span><b>{value}</b></div> : null }
