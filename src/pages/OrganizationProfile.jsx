import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getBusinessProfile, getShelterProfile, toggleProfileFollow } from '../services/api'
import PostCard from '../components/community/PostCard'
import ProfileShareButton from '../components/community/ProfileShareButton'
import SocialConnectionsModal from '../components/community/SocialConnectionsModal'
import VetPawLoader from '../components/VetPawLoader'
import './Community.css'
import './SocialProfile.css'

const speciesLabels = {
  dog: '🐶 Perros', cat: '🐱 Gatos', rabbit: '🐰 Conejos', bird: '🦜 Aves',
  horse: '🐴 Caballos', rodent: '🐹 Roedores', reptile: '🦎 Reptiles', farm: '🐮 Granja', other: '🐾 Otros',
}

const serviceLabels = {
  grooming: '✂️ Peluquería', bathing: '🛁 Baño', food: '🥣 Alimentos', accessories: '🦴 Accesorios',
  daycare: '🌞 Guardería', boarding: '🛏️ Hospedaje', walking: '🦮 Paseos', training: '🎓 Adiestramiento',
  transport: '🚐 Traslados', home_service: '🏠 A domicilio', delivery: '📦 Envíos', other: '🐾 Otro',
  rescue: '🚨 Rescate', foster: '🏠 Tránsito', adoption: '🐾 Adopción', neutering: '🩺 Castraciones',
  vaccination: '💉 Vacunación', recovery: '❤️ Recuperación', lost_search: '🔎 Perdidos', education: '📣 Concientización',
}

const paymentLabels = {
  cash: 'Efectivo', transfer: 'Transferencia', debit: 'Débito', credit: 'Crédito', mercadopago: 'Mercado Pago', other: 'Otro',
}

const yesNo = (value) => value ? 'Sí' : 'No'

export default function OrganizationProfile({ kind }) {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isBusiness = kind === 'business'
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('posts')
  const [connections, setConnections] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const [followingBusy, setFollowingBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = isBusiness ? await getBusinessProfile(slug) : await getShelterProfile(slug)
      setProfile(data)
    } catch {
      setError('No encontramos este perfil o todavía no está disponible.')
    } finally {
      setLoading(false)
    }
  }, [isBusiness, slug])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!lightbox) return undefined
    const onKey = (event) => { if (event.key === 'Escape') setLightbox(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  const follow = async () => {
    if (!user) { navigate('/login'); return }
    if (!profile || followingBusy) return
    setFollowingBusy(true)
    try {
      const data = await toggleProfileFollow(kind, profile.slug || profile.id)
      setProfile((current) => ({ ...current, following: data.following, followers_count: data.followers_count }))
    } finally {
      setFollowingBusy(false)
    }
  }

  const gallery = useMemo(() => profile?.gallery || [], [profile])

  if (loading) return <VetPawLoader message="Cargando perfil..." subText={isBusiness ? 'Preparando el negocio' : 'Preparando el refugio'} />
  if (error || !profile) return <main className="social-profile-page"><div className="social-profile-shell social-card social-empty"><h2>{error}</h2><Link className="social-action secondary" to="/explorar">Volver a Explorar</Link></div></main>

  const icon = isBusiness ? '🛍️' : '🏠'
  const typeDisplay = isBusiness ? profile.business_type_display : profile.shelter_type_display
  const tags = isBusiness ? profile.services : profile.activities
  const profilePath = profile.profile_url || `/${isBusiness ? 'negocios' : 'refugios'}/${profile.slug}`
  const whatsapp = String(profile.whatsapp || profile.phone || '').replace(/\D/g, '')
  const canFollow = !profile.can_edit && (!user || user.id !== profile.owner_user_id)

  return (
    <main className="social-profile-page">
      <div className="social-profile-shell">
        <section className="social-profile-hero">
          <div className="social-cover">{profile.cover_url ? <img src={profile.cover_url} alt={`Portada de ${profile.name}`} /> : <span className="social-cover-fallback">{icon}🐾</span>}</div>
          <div className="social-profile-head">
            <div className="social-avatar">{profile.logo_url ? <img src={profile.logo_url} alt={profile.name} /> : icon}</div>
            <div className="social-title">
              <h1>{profile.name}</h1>
              <p className="social-subtitle">{typeDisplay}{profile.locality ? ` · ${profile.locality}` : ''}{profile.province ? `, ${profile.province}` : ''}</p>
              <div className="social-badges">
                <span className="social-badge">{isBusiness ? '🛍️ Negocio VetPaw' : '🏠 Refugio VetPaw'}</span>
                {profile.is_verified && <span className="social-badge blue">✓ Perfil verificado</span>}
                {isBusiness && profile.is_24h && <span className="social-badge orange">🕐 Atención 24 horas</span>}
                {!isBusiness && <span className="social-badge orange">{profile.capacity_status_display}</span>}
              </div>
            </div>
            <div className="social-actions">
              {profile.can_edit ? <>
                <button type="button" className="social-action" onClick={() => navigate('/comunidad')}>＋ Publicar</button>
                <Link className="social-action secondary" to={isBusiness ? '/business/dashboard' : '/shelter/dashboard'}>✏️ Editar perfil</Link>
                <Link className="social-action secondary" to="/configuracion/privacidad">🛡️ Privacidad</Link>
              </> : canFollow && <button type="button" disabled={followingBusy} className={`social-action ${profile.following ? 'following' : ''}`} onClick={follow}>{followingBusy ? 'Guardando...' : profile.following ? '✓ Siguiendo' : '＋ Seguir'}</button>}
              <ProfileShareButton title={`${profile.name} en VetPaw`} text={`Conocé ${isBusiness ? 'este negocio' : 'este refugio'} dentro de VetPaw`} path={profilePath} />
            </div>
          </div>
          <div className="social-stats">
            <div className="social-stat"><strong>{profile.posts_count || 0}</strong><span>Publicaciones</span></div>
            <div className="social-stat"><button type="button" onClick={() => setConnections('followers')}><strong>{profile.followers_count || 0}</strong><span>Seguidores</span></button></div>
            <div className="social-stat"><button type="button" onClick={() => setConnections('following')}><strong>{profile.following_count || 0}</strong><span>Siguiendo</span></button></div>
            <div className="social-stat"><strong>{profile.paws_count || 0}</strong><span>Patitas recibidas</span></div>
          </div>
        </section>

        <div className="social-profile-grid">
          <div>
            <section className="social-card"><h2>{isBusiness ? 'Sobre el negocio' : 'Nuestra historia'}</h2><p>{profile.description || 'Este perfil todavía no agregó una presentación.'}</p></section>
            <section className="social-card" style={{ marginTop: 18 }}><h2>{isBusiness ? 'Servicios' : 'Actividades'}</h2><div className="social-tags">{tags?.length ? tags.map((item) => <span className="social-tag" key={item}>{serviceLabels[item] || item}</span>) : <span className="social-tag">Sin completar</span>}</div></section>
            {!isBusiness && profile.adoption_requirements && <section className="social-card" style={{ marginTop: 18 }}><h2>🐾 Requisitos de adopción</h2><p>{profile.adoption_requirements}</p></section>}
            {!isBusiness && profile.donation_needs && <section className="social-card" style={{ marginTop: 18 }}><h2>🤝 Cómo colaborar</h2><p>{profile.donation_needs}</p>{profile.accepts_donations && profile.donation_alias && <div className="social-status" style={{ marginTop: 12 }}>{profile.is_verified ? 'Alias verificado' : 'Alias informado'}: {profile.donation_alias}</div>}</section>}
            {isBusiness && profile.promotions && <section className="social-card" style={{ marginTop: 18 }}><h2>🎁 Promociones</h2><p>{profile.promotions}</p></section>}
          </div>

          <aside className="social-card">
            <h2>Información</h2>
            <div className="social-details">
              <Detail label="Responsable" value={profile.responsible_name} />
              <Detail label="Ubicación" value={[profile.locality, profile.province].filter(Boolean).join(', ')} />
              <Detail label="Dirección pública" value={profile.public_address} />
              <Detail label="Animales" value={(profile.species || []).map((item) => speciesLabels[item] || item).join(', ') || 'Sin completar'} />
              {isBusiness ? <>
                <Detail label="Atención" value={profile.appointment_required ? 'Con turno' : 'Consultar disponibilidad'} />
                <Detail label="A domicilio" value={yesNo(profile.home_service)} />
                <Detail label="Envíos" value={yesNo(profile.delivery)} />
                <Detail label="Venta online" value={yesNo(profile.online_sales)} />
                <Detail label="Rango de precios" value={profile.price_range} />
                <Detail label="Medios de pago" value={(profile.payment_methods || []).map((item) => paymentLabels[item] || item).join(', ')} />
              </> : <>
                <Detail label="Año de creación" value={profile.founded_year} />
                <Detail label="Zona de trabajo" value={profile.work_area || profile.locality} />
                <Detail label="Zona de adopción" value={profile.adoption_area || 'Consultar'} />
                <Detail label="Recibe animales" value={yesNo(profile.accepting_animals)} />
                <Detail label="Busca voluntarios" value={yesNo(profile.needs_volunteers)} />
                <Detail label="Busca tránsito" value={yesNo(profile.needs_foster_homes)} />
              </>}
            </div>
            {!isBusiness && <div className={`social-status ${profile.capacity_status === 'full' ? 'warning' : ''}`} style={{ marginTop: 16 }}>{profile.capacity_status_display}</div>}
            <div className="social-contact-stack">
              {whatsapp && <a className="social-action" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">💬 WhatsApp</a>}
              {profile.phone && <a className="social-action secondary" href={`tel:${profile.phone}`}>📞 Llamar</a>}
            </div>
          </aside>
        </div>

        <div className="social-tabs">
          <button type="button" className={tab === 'posts' ? 'active' : ''} onClick={() => setTab('posts')}>📸 Publicaciones</button>
          <button type="button" className={tab === 'gallery' ? 'active' : ''} onClick={() => setTab('gallery')}>🖼️ Galería</button>
        </div>

        {tab === 'posts' ? <section className="social-post-list">
          {profile.recent_posts?.length ? profile.recent_posts.map((post) => <PostCard key={post.id} initialPost={post} user={user} onDeleted={(postId) => setProfile((current) => ({ ...current, recent_posts: current.recent_posts.filter((item) => item.id !== postId), posts_count: Math.max(0, current.posts_count - 1), gallery: current.gallery.filter((item) => item.post_id !== postId) }))} />) : <div className="social-card social-empty">📷 Las publicaciones de {profile.name} aparecerán acá.</div>}
        </section> : <section className="social-card">
          {gallery.length ? <div className="social-gallery">{gallery.map((item) => <button type="button" className="social-gallery-item" key={item.post_id} onClick={() => setLightbox(item)}><img src={item.image_url} alt={item.text || profile.name} /><span>{item.text || 'Publicación de VetPaw'}</span></button>)}</div> : <div className="social-empty">Todavía no hay fotos en la galería.</div>}
        </section>}
      </div>

      <SocialConnectionsModal open={Boolean(connections)} onClose={() => setConnections(null)} profileType={kind} identifier={profile.slug || profile.id} initialKind={connections || 'followers'} profileName={profile.name} />
      {lightbox && <div className="social-lightbox" onClick={() => setLightbox(null)}><button type="button" onClick={() => setLightbox(null)}>✕</button><img src={lightbox.image_url} alt={lightbox.text || profile.name} onClick={(event) => event.stopPropagation()} /></div>}
    </main>
  )
}

function Detail({ label, value }) { return value !== undefined && value !== null && value !== '' ? <div className="social-detail"><span>{label}</span><b>{String(value)}</b></div> : null }
