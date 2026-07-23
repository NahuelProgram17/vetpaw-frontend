import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api, { toggleProfileFollow, updateClinicSocialProfile } from '../services/api'
import PostCard from '../components/community/PostCard'
import ProfileShareButton from '../components/community/ProfileShareButton'
import SocialConnectionsModal from '../components/community/SocialConnectionsModal'
import VetPawLoader from '../components/VetPawLoader'
import { prepareImageForUpload, replaceObjectUrl, revokeObjectUrl } from '../utils/imageUpload'
import './Community.css'
import './SocialProfile.css'
import './ClinicCommunity.css'

const serviceLabels = {
  dogs: '🐶 Perros', cats: '🐱 Gatos', rabbits: '🐰 Conejos', birds: '🦜 Aves', horses: '🐴 Caballos', exotic: '🦎 Exóticos',
  surgery: '🔪 Cirugías', internment: '🏥 Internación', emergency: '🚨 Urgencias 24 h', grooming: '✂️ Peluquería',
  xray: '🩻 Radiografías', lab: '🧪 Laboratorio',
}

const formatDate = (value) => value ? new Date(value).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
const stars = (rating) => [1, 2, 3, 4, 5].map((number) => <span key={number} className={number <= Math.round(rating || 0) ? 'active' : ''}>★</span>)

export default function ClinicProfile() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [clinic, setClinic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('posts')
  const [connections, setConnections] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const [followingBusy, setFollowingBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [description, setDescription] = useState('')
  const [showPublicAddress, setShowPublicAddress] = useState(true)
  const [cover, setCover] = useState(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get(`/clinics/perfil/${slug}/`)
      setClinic(response.data)
      setDescription(response.data.description || '')
      setShowPublicAddress(response.data.show_public_address !== false)
    } catch {
      setError('No encontramos esta veterinaria o el perfil ya no está disponible.')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])
  useEffect(() => () => revokeObjectUrl(coverPreview), [coverPreview])
  useEffect(() => {
    if (!lightbox) return undefined
    const onKey = (event) => { if (event.key === 'Escape') setLightbox(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  const follow = async () => {
    if (!user) { navigate('/login'); return }
    if (followingBusy) return
    setFollowingBusy(true)
    try {
      const data = await toggleProfileFollow('clinic', clinic.slug || clinic.id)
      setClinic((current) => ({ ...current, following: data.following, followers_count: data.followers_count }))
    } finally {
      setFollowingBusy(false)
    }
  }

  const chooseCover = async (file) => {
    if (!file) return
    setFormError('')
    try {
      const prepared = await prepareImageForUpload(file, { maxMB: 6, maxDimension: 2400, label: 'La portada' })
      setCover(prepared)
      setCoverPreview((current) => replaceObjectUrl(current, prepared))
    } catch (imageError) {
      setFormError(imageError.message || 'No pudimos preparar la portada.')
    }
  }

  const cancelEdit = () => {
    setEditing(false)
    setDescription(clinic?.description || '')
    setShowPublicAddress(clinic?.show_public_address !== false)
    setCover(null)
    revokeObjectUrl(coverPreview)
    setCoverPreview('')
    setFormError('')
  }

  const saveProfile = async () => {
    setSaving(true)
    setFormError('')
    try {
      const data = await updateClinicSocialProfile(clinic.slug, { description, show_public_address: showPublicAddress, ...(cover ? { cover } : {}) })
      setClinic(data)
      setDescription(data.description || '')
      setShowPublicAddress(data.show_public_address !== false)
      setEditing(false)
      setCover(null)
      revokeObjectUrl(coverPreview)
      setCoverPreview('')
    } catch (saveError) {
      const data = saveError.response?.data
      setFormError(data?.cover?.[0] || data?.description?.[0] || data?.detail || 'No se pudo guardar el perfil.')
    } finally {
      setSaving(false)
    }
  }

  const gallery = useMemo(() => clinic?.gallery || [], [clinic])

  if (loading) return <VetPawLoader message="Cargando perfil..." subText="Preparando la veterinaria" />
  if (error || !clinic) return <main className="social-profile-page"><div className="social-profile-shell social-card social-empty"><h2>{error}</h2><button type="button" className="social-action secondary" onClick={() => navigate('/clinics')}>Ver veterinarias</button></div></main>

  const coverUrl = coverPreview || clinic.cover_url
  const logoUrl = clinic.logo_url || clinic.logo
  const canFollow = !clinic.can_edit && (!user || user.id !== clinic.owner_user_id)
  const profilePath = clinic.profile_url || `/clinicas/${clinic.slug}`

  return (
    <main className="social-profile-page">
      <div className="social-profile-shell">
        <section className="social-profile-hero">
          <div className="social-cover">{coverUrl ? <img src={coverUrl} alt={`Portada de ${clinic.name}`} /> : <span className="social-cover-fallback">🏥🐾</span>}</div>
          <div className="social-profile-head">
            <div className="social-avatar">{logoUrl ? <img src={logoUrl} alt={clinic.name} /> : '🏥'}</div>
            <div className="social-title">
              <h1>{clinic.name}</h1>
              <p className="social-subtitle">Veterinaria · {[clinic.locality, clinic.province].filter(Boolean).join(', ')}</p>
              <div className="social-badges">
                <span className="social-badge blue">✓ Veterinaria VetPaw</span>
                {clinic.is_24h && <span className="social-badge orange">🕐 Atención 24 horas</span>}
                {clinic.can_request_appointment && <span className="social-badge">📅 Agenda y turnos disponibles</span>}
              </div>
              <div className="clinic-rating">{clinic.rating_avg ? <>{stars(clinic.rating_avg)} <b>{clinic.rating_avg}</b><span>({clinic.reviews_count} reseñas)</span></> : <span>Sin reseñas todavía</span>}</div>
            </div>
            <div className="social-actions">
              {clinic.can_edit ? <>
                <button type="button" className="social-action" onClick={() => navigate('/comunidad')}>＋ Publicar</button>
                <button type="button" className="social-action secondary" onClick={() => navigate('/clinic/comunidad')}>🏥 Comunidad profesional</button>
                <button type="button" className="social-action secondary" onClick={() => setEditing((value) => !value)}>✏️ Editar perfil</button>
              </> : canFollow && <button type="button" disabled={followingBusy} className={`social-action ${clinic.following ? 'following' : ''}`} onClick={follow}>{followingBusy ? 'Guardando...' : clinic.following ? '✓ Siguiendo' : '＋ Seguir'}</button>}
              <ProfileShareButton title={`${clinic.name} en VetPaw`} text={`Conocé esta veterinaria dentro de VetPaw`} path={profilePath} />
              {clinic.can_request_appointment && <button type="button" className="social-action" onClick={() => user ? navigate(`/appointments/new?clinic=${clinic.id}`) : navigate('/login')}>📅 Sacar turno</button>}
            </div>
          </div>
          <div className="social-stats">
            <div className="social-stat"><strong>{clinic.posts_count || 0}</strong><span>Publicaciones</span></div>
            <div className="social-stat"><button type="button" onClick={() => setConnections('followers')}><strong>{clinic.followers_count || 0}</strong><span>Seguidores</span></button></div>
            <div className="social-stat"><button type="button" onClick={() => setConnections('following')}><strong>{clinic.following_count || 0}</strong><span>Siguiendo</span></button></div>
            <div className="social-stat"><strong>{clinic.paws_count || 0}</strong><span>Patitas recibidas</span></div>
          </div>
        </section>

        {editing && <section className="social-card social-edit-card">
          <h2>Editar presentación pública</h2>
          <p>Estos cambios modifican únicamente lo que ve la comunidad. Los pacientes y datos médicos permanecen privados.</p>
          <textarea value={description} onChange={(event) => setDescription(event.target.value.slice(0, 3000))} placeholder="Contá qué distingue a la veterinaria, su equipo y forma de atención..." />
          <label className="file-button" style={{ marginTop: 12 }}>🖼️ Cambiar portada<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => chooseCover(event.target.files?.[0])} /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, color: 'rgba(255,255,255,.72)', fontSize: 12 }}><input type="checkbox" checked={showPublicAddress} onChange={(event) => setShowPublicAddress(event.target.checked)} /> Mostrar la dirección exacta en el perfil público</label>
          <button type="button" className="social-action secondary" style={{ marginTop: 10 }} onClick={() => navigate('/configuracion/privacidad')}>🛡️ Más opciones de privacidad</button>
          {formError && <div className="social-edit-error">{formError}</div>}
          <div className="social-edit-actions"><button type="button" className="social-action secondary" onClick={cancelEdit}>Cancelar</button><button type="button" className="social-action" disabled={saving} onClick={saveProfile}>{saving ? 'Guardando...' : 'Guardar cambios'}</button></div>
        </section>}

        <div className="social-profile-grid">
          <div>
            <section className="social-card"><h2>Sobre la veterinaria</h2><p>{clinic.description || 'Esta veterinaria todavía no agregó una presentación.'}</p></section>
            {clinic.services?.length > 0 && <section className="social-card" style={{ marginTop: 18 }}><h2>🩺 Servicios y animales atendidos</h2><div className="social-tags">{clinic.services.map((service) => <span className="social-tag" key={service}>{serviceLabels[service] || service}</span>)}</div></section>}
          </div>
          <aside className="social-card">
            <h2>Información</h2>
            <div className="social-details">
              <Detail label="Ubicación" value={[clinic.address, clinic.locality, clinic.province].filter(Boolean).join(', ')} />
              <Detail label="Teléfono" value={clinic.phone} />
              <Detail label="Correo" value={clinic.email} />
              <Detail label="Miembros registrados" value={clinic.members_count ? String(clinic.members_count) : ''} />
              <Detail label="Atención 24 horas" value={clinic.is_24h ? 'Sí' : 'No'} />
              <Detail label="Agenda VetPaw" value={clinic.can_request_appointment ? 'Recibe turnos' : 'No disponible'} />
            </div>
            <div className="social-contact-stack">
              {clinic.phone && <a className="social-action secondary" href={`tel:${clinic.phone}`}>📞 Llamar</a>}
              {clinic.can_request_appointment && <button type="button" className="social-action" onClick={() => user ? navigate(`/appointments/new?clinic=${clinic.id}`) : navigate('/login')}>📅 Solicitar turno</button>}
              {!clinic.can_request_appointment && <div className="clinic-appointment-unavailable">{clinic.appointment_unavailable_reason || 'Esta veterinaria no está recibiendo turnos en este momento.'}</div>}
            </div>
          </aside>
        </div>

        <div className="social-tabs">
          <button type="button" className={tab === 'posts' ? 'active' : ''} onClick={() => setTab('posts')}>📸 Publicaciones</button>
          <button type="button" className={tab === 'campaigns' ? 'active' : ''} onClick={() => setTab('campaigns')}>📅 Campañas</button>
          <button type="button" className={tab === 'gallery' ? 'active' : ''} onClick={() => setTab('gallery')}>🖼️ Galería social</button>
          <button type="button" className={tab === 'clinic-photos' ? 'active' : ''} onClick={() => setTab('clinic-photos')}>🏥 Fotos del local</button>
          <button type="button" className={tab === 'reviews' ? 'active' : ''} onClick={() => setTab('reviews')}>⭐ Reseñas</button>
        </div>

        {tab === 'posts' && <section className="social-post-list">{clinic.recent_posts?.length ? clinic.recent_posts.map((post) => <PostCard key={post.id} initialPost={post} user={user} onDeleted={(postId) => setClinic((current) => ({ ...current, recent_posts: current.recent_posts.filter((item) => item.id !== postId), posts_count: Math.max(0, current.posts_count - 1), gallery: current.gallery.filter((item) => item.post_id !== postId) }))} />) : <div className="social-card social-empty">📷 Las publicaciones de {clinic.name} aparecerán acá.</div>}</section>}

        {tab === 'campaigns' && (
          <section className="social-card">
            {clinic.upcoming_campaigns?.length ? (
              <>
                <div className="clinic-community-info">ℹ️ Las campañas son informativas. Para solicitar atención usá el botón “Sacar turno” del perfil.</div>
                <div className="clinic-profile-campaigns">
                  {clinic.upcoming_campaigns.map((campaign) => (
                    <article className="clinic-profile-campaign-card" key={campaign.id}>
                      {campaign.image_url && <img src={campaign.image_url} alt={campaign.title} />}
                      <div>
                        <small>{campaign.campaign_type_display}</small>
                        <h3>{campaign.title}</h3>
                        <p>📅 {new Date(campaign.starts_at).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        {campaign.location && <p>📍 {campaign.location}</p>}
                        {campaign.species?.length > 0 && <p>🐾 Especies: {campaign.species.map((species) => serviceLabels[species] || species).join(', ')}</p>}
                        <p>{campaign.is_free ? 'Actividad gratuita' : campaign.price ? `$${Number(campaign.price).toLocaleString('es-AR')}` : 'Consultar valor'}{campaign.capacity ? ` · Cupo informado: ${campaign.capacity}` : ''}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : <div className="social-empty">No hay campañas próximas publicadas.</div>}
          </section>
        )}

        {tab === 'gallery' && <section className="social-card">{gallery.length ? <div className="social-gallery">{gallery.map((item) => <button type="button" className="social-gallery-item" key={item.post_id} onClick={() => setLightbox({ image_url: item.image_url, text: item.text })}><img src={item.image_url} alt={item.text || clinic.name} /><span>{item.text || 'Publicación de VetPaw'}</span></button>)}</div> : <div className="social-empty">Todavía no hay fotos en la galería social.</div>}</section>}

        {tab === 'clinic-photos' && <section className="social-card">{clinic.photos?.length ? <div className="clinic-profile-photos">{clinic.photos.map((photo) => <button type="button" key={photo.id} onClick={() => setLightbox({ image_url: photo.image, text: photo.caption })}><img src={photo.image} alt={photo.caption || clinic.name} /></button>)}</div> : <div className="social-empty">Todavía no se cargaron fotos del local.</div>}</section>}

        {tab === 'reviews' && <section className="social-card">{clinic.reviews?.length ? <div className="clinic-review-list">{clinic.reviews.map((review) => <article className="clinic-review" key={review.id}><div><span className="clinic-review-stars">{stars(review.rating)}</span><strong>{review.owner_name}</strong><time>{formatDate(review.created_at)}</time></div>{review.comment && <p>“{review.comment}”</p>}</article>)}</div> : <div className="social-empty">Esta veterinaria todavía no recibió reseñas.</div>}</section>}
      </div>

      <SocialConnectionsModal open={Boolean(connections)} onClose={() => setConnections(null)} profileType="clinic" identifier={clinic.slug || clinic.id} initialKind={connections || 'followers'} profileName={clinic.name} />
      {lightbox && <div className="social-lightbox" onClick={() => setLightbox(null)}><button type="button" onClick={() => setLightbox(null)}>✕</button><img src={lightbox.image_url} alt={lightbox.text || clinic.name} onClick={(event) => event.stopPropagation()} /></div>}
    </main>
  )
}

function Detail({ label, value }) { return value ? <div className="social-detail"><span>{label}</span><b>{value}</b></div> : null }
