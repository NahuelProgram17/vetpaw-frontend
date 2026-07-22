import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  acceptCommunityFollowRequest,
  cancelCommunityFollowRequest,
  getBlockedCommunityUsers,
  getCommunityFollowRequests,
  getCommunityPrivacy,
  getHiddenCommunityPosts,
  getMutedCommunityUsers,
  getPetCommunityFollowers,
  rejectCommunityFollowRequest,
  removePetCommunityFollower,
  restoreHiddenCommunityPost,
  toggleBlockedCommunityUser,
  toggleMutedCommunityUser,
  updateCommunityPrivacy,
  updatePetCommunityVisibility,
} from '../services/api'
import './CommunityPrivacy.css'

const normalizeRows = (data) => data?.results ?? data ?? []

const privacyGroups = [
  {
    title: 'Datos del perfil',
    icon: '👁️',
    fields: [
      ['show_location', 'Mostrar provincia y localidad', 'Nunca se muestra tu dirección exacta.'],
      ['show_birth_date', 'Mostrar fecha de nacimiento', 'La fecha exacta de tu mascota.'],
      ['show_age', 'Mostrar edad', 'Puede mostrarse aunque ocultes la fecha exacta.'],
      ['show_followers', 'Mostrar seguidores', 'Permite abrir la lista de seguidores.'],
      ['show_following', 'Mostrar perfiles seguidos', 'Permite abrir la lista de seguidos.'],
      ['show_paws', 'Mostrar patitas recibidas', 'Oculta o muestra el contador social.'],
      ['show_activity', 'Mostrar actividad reciente', 'Incluye publicaciones y galería del perfil.'],
    ],
  },
  {
    title: 'Contacto profesional',
    icon: '💬',
    professional: true,
    fields: [
      ['show_phone', 'Mostrar teléfono', 'Solo se aplica a veterinarias, negocios y refugios.'],
      ['show_whatsapp', 'Mostrar WhatsApp', 'Podés seguir recibiendo mensajes internos.'],
      ['show_responsible_name', 'Mostrar responsable', 'Útil para refugios y negocios.'],
      ['show_donation_info', 'Mostrar datos para donaciones', 'Solo se aplica a refugios.'],
      ['allow_internal_messages', 'Permitir mensajes internos', 'Otros usuarios podrán contactarte dentro de VetPaw.'],
      ['allow_appointment_requests', 'Permitir solicitudes de turno', 'Disponible para perfiles que trabajan con turnos.'],
    ],
  },
  {
    title: 'Notificaciones sociales',
    icon: '🔔',
    fields: [
      ['social_notifications_enabled', 'Notificaciones dentro de VetPaw', 'Patitas, comentarios, respuestas, menciones y seguidores.'],
      ['push_notifications_enabled', 'Notificaciones en el teléfono o PC', 'Respeta también los permisos del dispositivo.'],
    ],
  },
]

export default function CommunityPrivacy() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [data, setData] = useState(null)
  const [settings, setSettings] = useState(null)
  const [requests, setRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [blocked, setBlocked] = useState([])
  const [muted, setMuted] = useState([])
  const [hiddenPosts, setHiddenPosts] = useState([])
  const [followers, setFollowers] = useState([])
  const [selectedPet, setSelectedPet] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const initialSection = searchParams.get('seccion') || 'perfil'
  const [section, setSection] = useState(initialSection)

  const isProfessional = ['clinic', 'business', 'shelter'].includes(user?.role)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [privacy, received, sent, blocks, mutes, hidden] = await Promise.all([
        getCommunityPrivacy(),
        getCommunityFollowRequests('received'),
        getCommunityFollowRequests('sent'),
        getBlockedCommunityUsers(),
        getMutedCommunityUsers(),
        getHiddenCommunityPosts(),
      ])
      setData(privacy)
      setSettings(privacy.settings)
      const pets = privacy.pets || []
      setSelectedPet((current) => current || (pets[0] ? String(pets[0].id) : ''))
      setRequests(normalizeRows(received))
      setSentRequests(normalizeRows(sent))
      setBlocked(normalizeRows(blocks))
      setMuted(normalizeRows(mutes))
      setHiddenPosts(normalizeRows(hidden))
    } catch (loadError) {
      setError(loadError.response?.data?.detail || 'No pudimos cargar tu privacidad.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!selectedPet) { setFollowers([]); return }
    getPetCommunityFollowers(selectedPet).then(setFollowers).catch(() => setFollowers([]))
  }, [selectedPet])

  const flash = (text) => {
    setMessage(text)
    window.setTimeout(() => setMessage(''), 2600)
  }

  const changeSetting = async (key, value) => {
    const previous = settings
    setSettings((current) => ({ ...current, [key]: value }))
    setSavingKey(key)
    setError('')
    try {
      const updated = await updateCommunityPrivacy({ [key]: value })
      setSettings(updated)
      flash('Cambio guardado.')
    } catch (saveError) {
      setSettings(previous)
      setError(saveError.response?.data?.detail || 'No se pudo guardar el cambio.')
    } finally {
      setSavingKey('')
    }
  }

  const changePetVisibility = async (petId, value) => {
    setSavingKey(`pet-${petId}`)
    try {
      await updatePetCommunityVisibility(petId, value)
      setData((current) => ({
        ...current,
        pets: current.pets.map((pet) => String(pet.id) === String(petId) ? { ...pet, is_public: value, pending_requests: value ? 0 : pet.pending_requests } : pet),
      }))
      if (value) setRequests((rows) => rows.filter((request) => String(request.pet_id) !== String(petId)))
      flash(value ? 'El perfil ahora es público.' : 'El perfil ahora es privado.')
    } catch (saveError) {
      setError(saveError.response?.data?.error || 'No se pudo cambiar la privacidad de la mascota.')
    } finally {
      setSavingKey('')
    }
  }

  const resolveRequest = async (requestId, action) => {
    setSavingKey(`request-${requestId}`)
    try {
      if (action === 'accept') await acceptCommunityFollowRequest(requestId)
      else await rejectCommunityFollowRequest(requestId)
      setRequests((rows) => rows.filter((row) => row.id !== requestId))
      if (selectedPet) setFollowers(await getPetCommunityFollowers(selectedPet))
      flash(action === 'accept' ? 'Solicitud aceptada.' : 'Solicitud rechazada.')
    } finally { setSavingKey('') }
  }

  const cancelRequest = async (id) => {
    setSavingKey(`sent-${id}`)
    try {
      await cancelCommunityFollowRequest(id)
      setSentRequests((rows) => rows.filter((row) => row.id !== id))
      flash('Solicitud cancelada.')
    } finally { setSavingKey('') }
  }

  const removeFollower = async (row) => {
    const identity = row.identity || {}
    if (!selectedPet || !window.confirm(`¿Quitar a ${identity.name || identity.display_name || 'este perfil'} de los seguidores?`)) return
    setSavingKey(`follower-${row.follower_id}`)
    try {
      await removePetCommunityFollower(selectedPet, row.follower_id)
      setFollowers((rows) => rows.filter((item) => item.follow_id !== row.follow_id))
      flash('Seguidor eliminado.')
    } finally { setSavingKey('') }
  }

  const unmute = async (row) => {
    await toggleMutedCommunityUser(row.muted.id)
    setMuted((rows) => rows.filter((item) => item.id !== row.id))
    flash('Usuario reactivado.')
  }

  const unblock = async (row) => {
    await toggleBlockedCommunityUser(row.blocked.id)
    setBlocked((rows) => rows.filter((item) => item.id !== row.id))
    flash('Usuario desbloqueado.')
  }

  const restorePost = async (row) => {
    await restoreHiddenCommunityPost(row.id)
    setHiddenPosts((rows) => rows.filter((item) => item.id !== row.id))
    flash('Publicación recuperada.')
  }

  const selectedPetData = useMemo(() => data?.pets?.find((pet) => String(pet.id) === String(selectedPet)), [data, selectedPet])

  if (loading) return <main className="privacy-page"><div className="privacy-shell privacy-loading">🔒 Cargando privacidad...</div></main>

  return (
    <main className="privacy-page">
      <div className="privacy-shell">
        <header className="privacy-header">
          <div><span className="privacy-kicker">Tu espacio, tus reglas</span><h1>Privacidad <em>y seguridad</em></h1><p>Elegí qué mostrar, quién puede seguirte y qué contenido querés ver.</p></div>
          <Link to="/comunidad" className="privacy-back">← Volver a la Comunidad</Link>
        </header>

        {message && <div className="privacy-message success">✓ {message}</div>}
        {error && <div className="privacy-message error">⚠ {error}</div>}

        <nav className="privacy-tabs" aria-label="Secciones de privacidad">
          <button className={section === 'perfil' ? 'active' : ''} onClick={() => setSection('perfil')}>👁️ Perfil</button>
          <button className={section === 'solicitudes' ? 'active' : ''} onClick={() => setSection('solicitudes')}>👥 Solicitudes {requests.length > 0 && <b>{requests.length}</b>}</button>
          <button className={section === 'control' ? 'active' : ''} onClick={() => setSection('control')}>🛡️ Control</button>
          <button className={section === 'contenido' ? 'active' : ''} onClick={() => setSection('contenido')}>🙈 Contenido oculto</button>
        </nav>

        {section === 'perfil' && settings && (
          <div className="privacy-grid">
            {user?.role === 'owner' && (
              <section className="privacy-card privacy-card-wide">
                <div className="privacy-card-title"><span>🐾</span><div><h2>Privacidad de tus mascotas</h2><p>Un perfil privado necesita tu aprobación antes de mostrar publicaciones.</p></div></div>
                <div className="privacy-pets">
                  {(data?.pets || []).map((pet) => (
                    <div className="privacy-pet" key={pet.id}>
                      <div className="privacy-person"><Avatar src={pet.photo} fallback="🐾" /><div><strong>{pet.name}</strong><span>{pet.is_public ? 'Perfil público' : `Perfil privado${pet.pending_requests ? ` · ${pet.pending_requests} pendiente${pet.pending_requests === 1 ? '' : 's'}` : ''}`}</span></div></div>
                      <Toggle checked={pet.is_public} disabled={savingKey === `pet-${pet.id}`} onChange={(value) => changePetVisibility(pet.id, value)} label={pet.is_public ? 'Público' : 'Privado'} />
                    </div>
                  ))}
                  {!data?.pets?.length && <Empty text="Todavía no tenés mascotas para configurar." />}
                </div>
              </section>
            )}

            <section className="privacy-card">
              <div className="privacy-card-title"><span>💬</span><div><h2>Comentarios</h2><p>Esta opción se usa por defecto al crear una publicación.</p></div></div>
              <label className="privacy-select-label">Quién puede comentar
                <select value={settings.default_comment_permission} onChange={(event) => changeSetting('default_comment_permission', event.target.value)} disabled={savingKey === 'default_comment_permission'}>
                  <option value="everyone">Todos</option>
                  <option value="followers">Solo seguidores</option>
                  <option value="none">Nadie</option>
                </select>
              </label>
            </section>

            {user?.role === 'owner' && (
              <section className="privacy-card">
                <div className="privacy-card-title"><span>🎂</span><div><h2>Cumpleaños</h2><p>Decidí cómo celebrar los cumpleaños de tus mascotas.</p></div></div>
                <label className="privacy-select-label">Visibilidad
                  <select value={settings.birthday_visibility} onChange={(event) => changeSetting('birthday_visibility', event.target.value)} disabled={savingKey === 'birthday_visibility'}>
                    <option value="community">Publicar en Comunidad</option>
                    <option value="account">Mostrar solo en mi cuenta</option>
                    <option value="off">No mostrar cumpleaños</option>
                  </select>
                </label>
              </section>
            )}

            {privacyGroups.map((group) => {
              if (group.professional && !isProfessional) return null
              return (
                <section className="privacy-card" key={group.title}>
                  <div className="privacy-card-title"><span>{group.icon}</span><div><h2>{group.title}</h2></div></div>
                  <div className="privacy-options">
                    {group.fields.map(([key, label, description]) => (
                      <div className="privacy-option" key={key}>
                        <div><strong>{label}</strong><span>{description}</span></div>
                        <Toggle checked={Boolean(settings[key])} disabled={savingKey === key} onChange={(value) => changeSetting(key, value)} />
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        {section === 'solicitudes' && (
          <div className="privacy-grid">
            <section className="privacy-card privacy-card-wide">
              <div className="privacy-card-title"><span>📥</span><div><h2>Solicitudes recibidas</h2><p>Solo aparecen cuando una de tus mascotas tiene perfil privado.</p></div></div>
              <div className="privacy-list">
                {requests.map((row) => (
                  <div className="privacy-list-row" key={row.id}>
                    <div className="privacy-person"><Avatar src={row.follower?.avatar} fallback="👤" /><div><strong>{row.follower?.display_name}</strong><span>Quiere seguir a {row.pet_name}</span></div></div>
                    <div className="privacy-row-actions"><button className="accept" disabled={savingKey === `request-${row.id}`} onClick={() => resolveRequest(row.id, 'accept')}>Aceptar</button><button disabled={savingKey === `request-${row.id}`} onClick={() => resolveRequest(row.id, 'reject')}>Rechazar</button></div>
                  </div>
                ))}
                {!requests.length && <Empty text="No tenés solicitudes pendientes." />}
              </div>
            </section>

            <section className="privacy-card">
              <div className="privacy-card-title"><span>📤</span><div><h2>Solicitudes enviadas</h2></div></div>
              <div className="privacy-list">
                {sentRequests.map((row) => <div className="privacy-list-row compact" key={row.id}><div className="privacy-person"><Avatar src={row.pet_photo} fallback="🐾" /><div><strong>{row.pet_name}</strong><span>Esperando respuesta</span></div></div><button onClick={() => cancelRequest(row.id)} disabled={savingKey === `sent-${row.id}`}>Cancelar</button></div>)}
                {!sentRequests.length && <Empty text="No enviaste solicitudes." />}
              </div>
            </section>

            {user?.role === 'owner' && data?.pets?.length > 0 && (
              <section className="privacy-card">
                <div className="privacy-card-title"><span>👥</span><div><h2>Administrar seguidores</h2><p>Podés quitar seguidores sin bloquearlos.</p></div></div>
                <label className="privacy-select-label">Mascota
                  <select value={selectedPet} onChange={(event) => setSelectedPet(event.target.value)}>{data.pets.map((pet) => <option key={pet.id} value={pet.id}>{pet.name}</option>)}</select>
                </label>
                <div className="privacy-list">
                  {followers.map((row) => <div className="privacy-list-row compact" key={row.follow_id}><div className="privacy-person"><Avatar src={row.identity?.photo} fallback="👤" /><div><strong>{row.identity?.name || row.identity?.display_name}</strong><span>Seguidor de {selectedPetData?.name}</span></div></div><button onClick={() => removeFollower(row)} disabled={savingKey === `follower-${row.follower_id}`}>Quitar</button></div>)}
                  {!followers.length && <Empty text="Esta mascota todavía no tiene seguidores." />}
                </div>
              </section>
            )}
          </div>
        )}

        {section === 'control' && (
          <div className="privacy-grid">
            <section className="privacy-card">
              <div className="privacy-card-title"><span>🔇</span><div><h2>Usuarios silenciados</h2><p>No ves sus publicaciones ni recibís sus notificaciones. No se les avisa.</p></div></div>
              <div className="privacy-list">{muted.map((row) => <ControlRow key={row.id} identity={row.muted} action="Dejar de silenciar" onAction={() => unmute(row)} />)}{!muted.length && <Empty text="No silenciaste a nadie." />}</div>
            </section>
            <section className="privacy-card">
              <div className="privacy-card-title"><span>⛔</span><div><h2>Usuarios bloqueados</h2><p>No pueden verte, seguirte, comentarte ni contactarte.</p></div></div>
              <div className="privacy-list">{blocked.map((row) => <ControlRow key={row.id} identity={row.blocked} action="Desbloquear" onAction={() => unblock(row)} />)}{!blocked.length && <Empty text="No bloqueaste a nadie." />}</div>
            </section>
          </div>
        )}

        {section === 'contenido' && (
          <section className="privacy-card">
            <div className="privacy-card-title"><span>🙈</span><div><h2>Publicaciones ocultas</h2><p>Podés recuperar cualquier publicación que ocultaste o marcaste como “No me interesa”.</p></div></div>
            <div className="hidden-post-grid">
              {hiddenPosts.map((row) => <article className="hidden-post" key={row.id}>{row.post?.image_url && <img src={row.post.image_url} alt="" />}<div><strong>{row.post?.actor?.name || 'Publicación'}</strong><p>{row.post?.text || 'Publicación con imagen'}</p><span>{row.reason_display}</span><button onClick={() => restorePost(row)}>Volver a mostrar</button></div></article>)}
              {!hiddenPosts.length && <Empty text="No tenés publicaciones ocultas." />}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

function Toggle({ checked, disabled, onChange, label }) {
  return <label className={`privacy-toggle ${checked ? 'on' : ''} ${disabled ? 'disabled' : ''}`}><input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} /><span /><em>{label}</em></label>
}

function Avatar({ src, fallback }) { return src ? <img className="privacy-avatar" src={src} alt="" /> : <span className="privacy-avatar fallback">{fallback}</span> }
function Empty({ text }) { return <div className="privacy-empty">{text}</div> }
function ControlRow({ identity, action, onAction }) { return <div className="privacy-list-row compact"><div className="privacy-person"><Avatar src={identity?.avatar || identity?.photo} fallback="👤" /><div><strong>{identity?.display_name || identity?.name || identity?.username}</strong><span>{identity?.username ? `@${identity.username}` : 'Perfil de VetPaw'}</span></div></div><button onClick={onAction}>{action}</button></div> }
