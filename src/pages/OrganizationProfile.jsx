import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getBusinessProfile, getCommunityPosts, getShelterProfile } from '../services/api'
import PostCard from '../components/community/PostCard'
import VetPawLoader from '../components/VetPawLoader'
import { useAuth } from '../context/AuthContext'
import './OrganizationProfile.css'

const labels = {
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

export default function OrganizationProfile({ kind }) {
  const { slug } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const isBusiness = kind === 'business'

  useEffect(() => {
    let active = true
    Promise.all([
      isBusiness ? getBusinessProfile(slug) : getShelterProfile(slug),
    ]).then(async ([data]) => {
      if (!active) return
      setProfile(data)
      const response = await getCommunityPosts(isBusiness ? { business: data.id, page_size: 12 } : { shelter: data.id, page_size: 12 })
      if (active) setPosts(response.results ?? response)
    }).catch(() => active && setError('No encontramos este perfil.')).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [slug, isBusiness])

  if (loading) return <VetPawLoader message="Cargando perfil..." subText="Preparando la información" />
  if (error || !profile) return <main className="org-page"><div className="org-shell org-empty"><h2>{error}</h2><Link to="/explorar">Volver a Explorar</Link></div></main>

  const icon = isBusiness ? '🛍️' : '🏠'
  const typeDisplay = isBusiness ? profile.business_type_display : profile.shelter_type_display
  const tags = isBusiness ? profile.services : profile.activities
  const whatsapp = String(profile.whatsapp || profile.phone || '').replace(/\D/g, '')

  return <main className="org-page"><div className="org-shell">
    <section className="org-public-hero">
      <div className="org-cover">{profile.cover_url ? <img src={profile.cover_url} alt="" /> : <span>{icon}🐾</span>}</div>
      <div className="org-head">
        <div className="org-logo">{profile.logo_url ? <img src={profile.logo_url} alt={profile.name} /> : icon}</div>
        <div className="org-title"><h1>{profile.name}</h1><p>{typeDisplay} · {profile.locality}, {profile.province}</p><div className="org-badges">
          <span className="org-badge">{isBusiness ? '🛍️ Negocio VetPaw' : '🏠 Refugio VetPaw'}</span>
          {profile.is_verified && <span className="org-badge blue">✓ Perfil verificado</span>}
          {isBusiness && profile.is_24h && <span className="org-badge orange">🕐 Atención 24 horas</span>}
          {!isBusiness && <span className="org-badge orange">{profile.capacity_status_display}</span>}
        </div></div>
        <div className="org-contact">
          {whatsapp && <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">💬 WhatsApp</a>}
          {profile.phone && <a className="secondary" href={`tel:${profile.phone}`}>📞 Llamar</a>}
          {profile.can_edit && <Link className="secondary" to={isBusiness ? '/business/dashboard' : '/shelter/dashboard'}>✏️ Editar</Link>}
        </div>
      </div>
    </section>

    <div className="org-grid">
      <div>
        <section className="org-card"><h2>{isBusiness ? 'Sobre el negocio' : 'Nuestra historia'}</h2><p>{profile.description || 'Este perfil todavía no agregó una descripción.'}</p></section>
        <section className="org-card" style={{ marginTop: 18 }}><h2>{isBusiness ? 'Servicios' : 'Actividades'}</h2><div className="org-tags">{(tags || []).length ? tags.map((item) => <span className="org-tag" key={item}>{serviceLabels[item] || item}</span>) : <span className="org-tag">Sin completar</span>}</div></section>
        {!isBusiness && profile.adoption_requirements && <section className="org-card" style={{ marginTop: 18 }}><h2>🐾 Requisitos de adopción</h2><p>{profile.adoption_requirements}</p></section>}
        {!isBusiness && profile.donation_needs && <section className="org-card" style={{ marginTop: 18 }}><h2>🤝 Cómo ayudar</h2><p>{profile.donation_needs}</p>{profile.accepts_donations && profile.donation_alias && <div className="org-status" style={{ marginTop: 12 }}>{profile.is_verified ? 'Alias del refugio verificado' : 'Alias informado por el refugio'}: {profile.donation_alias}</div>}</section>}
      </div>
      <aside className="org-card"><h2>Información</h2><div className="org-details">
        <Detail label="Responsable" value={profile.responsible_name} />
        <Detail label="Ubicación" value={`${profile.locality}, ${profile.province}`} />
        {profile.public_address && <Detail label="Dirección" value={profile.public_address} />}
        <Detail label="Animales" value={(profile.species || []).map((item) => labels[item] || item).join(', ') || 'Sin completar'} />
        {isBusiness ? <><Detail label="Atención" value={profile.appointment_required ? 'Con turno' : 'Consultar disponibilidad'} />{profile.home_service && <Detail label="A domicilio" value="Sí" />}{profile.delivery && <Detail label="Envíos" value="Sí" />}</> : <><Detail label="Zona de trabajo" value={profile.work_area || profile.locality} /><Detail label="Adopciones" value={profile.adoption_area || 'Consultar'} /></>}
      </div>{!isBusiness && <div className={`org-status ${profile.capacity_status === 'full' ? 'full' : ''}`} style={{ marginTop: 16 }}>{profile.capacity_status_display}</div>}</aside>
    </div>

    <section className="org-posts"><div className="org-card"><h2>Publicaciones en VetPaw</h2>{posts.length ? posts.map((post) => <PostCard key={post.id} initialPost={post} user={user} />) : <div className="org-empty">Todavía no hay publicaciones.</div>}</div></section>
  </div></main>
}

function Detail({ label, value }) { return value ? <div className="org-detail"><span>{label}</span><b>{value}</b></div> : null }
