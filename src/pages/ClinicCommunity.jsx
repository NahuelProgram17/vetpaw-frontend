import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createClinicCampaign,
  deleteClinicCampaign,
  getClinicCampaigns,
  getClinicCommunityStats,
  publishClinicCampaign,
  updateClinicCampaign,
} from '../services/api'
import VetPawLoader from '../components/VetPawLoader'
import './ClinicCommunity.css'

const EMPTY = {
  campaign_type: 'vaccination',
  title: '',
  description: '',
  starts_at: '',
  ends_at: '',
  location: '',
  capacity: '',
  species: [],
  price: '',
  is_free: true,
  is_active: true,
  image: null,
}

const speciesOptions = [
  ['dogs', 'Perros'], ['cats', 'Gatos'], ['rabbits', 'Conejos'],
  ['birds', 'Aves'], ['horses', 'Caballos'], ['exotic', 'Exóticos'],
]

const dateTimeLocal = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

const formatDate = (value) => new Date(value).toLocaleString('es-AR', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
})

export default function ClinicCommunity() {
  const [campaigns, setCampaigns] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('campaigns')
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [campaignData, statsData] = await Promise.all([
        getClinicCampaigns({ mine: true }),
        getClinicCommunityStats(),
      ])
      setCampaigns(campaignData.results ?? campaignData ?? [])
      setStats(statsData)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No pudimos cargar las herramientas de comunidad.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const upcoming = useMemo(() => campaigns.filter((item) => new Date(item.starts_at) >= new Date() && item.is_active), [campaigns])

  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const toggleSpecies = (value) => change('species', form.species.includes(value) ? form.species.filter((item) => item !== value) : [...form.species, value])

  const reset = () => {
    setForm(EMPTY)
    setEditingId(null)
    setError('')
  }

  const edit = (item) => {
    setEditingId(item.id)
    setForm({
      campaign_type: item.campaign_type,
      title: item.title,
      description: item.description,
      starts_at: dateTimeLocal(item.starts_at),
      ends_at: dateTimeLocal(item.ends_at),
      location: item.location || '',
      capacity: item.capacity ?? '',
      species: item.species || [],
      price: item.price ?? '',
      is_free: item.is_free,
      is_active: item.is_active,
      image: null,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.description.trim() || !form.starts_at) {
      setError('Título, descripción y fecha de inicio son obligatorios.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        capacity: form.capacity === '' ? null : Number(form.capacity),
        price: form.is_free || form.price === '' ? null : form.price,
      }
      if (editingId) await updateClinicCampaign(editingId, payload)
      else await createClinicCampaign(payload)
      setSuccess(editingId ? 'Campaña actualizada.' : 'Campaña creada. Ahora podés publicarla en la Comunidad.')
      reset()
      await load()
    } catch (requestError) {
      const data = requestError.response?.data
      setError(data ? Object.values(data).flat().join(' ') : 'No se pudo guardar la campaña.')
    } finally {
      setSaving(false)
    }
  }

  const publish = async (item) => {
    setBusyId(`publish-${item.id}`)
    setError('')
    try {
      await publishClinicCampaign(item.id)
      setSuccess(item.post_id ? 'Publicación actualizada.' : 'Campaña publicada en la Comunidad.')
      await load()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'No se pudo publicar la campaña.')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (item) => {
    if (!window.confirm(`¿Eliminar “${item.title}”?`)) return
    setBusyId(`delete-${item.id}`)
    try {
      await deleteClinicCampaign(item.id)
      setCampaigns((rows) => rows.filter((row) => row.id !== item.id))
      setSuccess('Campaña eliminada.')
    } catch {
      setError('No se pudo eliminar la campaña.')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <VetPawLoader message="Cargando comunidad veterinaria..." subText="Preparando campañas y estadísticas" />

  return (
    <main className="clinic-community-page">
      <div className="clinic-community-shell">
        <header className="clinic-community-hero">
          <div>
            <span className="clinic-community-kicker">🏥 Comunidad profesional VetPaw</span>
            <h1>Campañas, consejos e información desde tu veterinaria</h1>
            <p>Publicá contenido verificado y medí su alcance. La Comunidad es informativa: los turnos se gestionan desde la agenda normal de VetPaw.</p>
          </div>
          <div className="clinic-community-summary">
            <strong>{upcoming.length}</strong><span>campañas próximas</span>
          </div>
        </header>

        <nav className="clinic-community-tabs">
          <button className={tab === 'campaigns' ? 'active' : ''} onClick={() => setTab('campaigns')}>Campañas</button>
          <button className={tab === 'stats' ? 'active' : ''} onClick={() => setTab('stats')}>Estadísticas sociales</button>
        </nav>

        {error && <div className="clinic-community-message error">⚠️ {error}</div>}
        {success && <div className="clinic-community-message success">✓ {success}</div>}

        {tab === 'campaigns' ? (
          <div className="clinic-community-layout">
            <form className="clinic-campaign-form" onSubmit={submit}>
              <div className="clinic-section-title">
                <div><span>{editingId ? '✏️' : '＋'}</span><div><h2>{editingId ? 'Editar campaña' : 'Nueva campaña o evento'}</h2><p>La dirección exacta solo se muestra si tu perfil lo permite.</p></div></div>
                {editingId && <button type="button" onClick={reset}>Cancelar edición</button>}
              </div>

              <div className="clinic-form-grid">
                <label><span>Tipo</span><select value={form.campaign_type} onChange={(event) => change('campaign_type', event.target.value)}>
                  <option value="vaccination">Campaña de vacunación</option>
                  <option value="castration">Campaña de castración</option>
                  <option value="checkup">Jornada de controles</option>
                  <option value="event">Evento veterinario</option>
                  <option value="guard">Guardia especial</option>
                  <option value="other">Otra actividad</option>
                </select></label>
                <label><span>Título</span><input value={form.title} maxLength={180} onChange={(event) => change('title', event.target.value)} placeholder="Ej: Vacunación antirrábica" /></label>
                <label className="wide"><span>Descripción</span><textarea value={form.description} maxLength={3000} onChange={(event) => change('description', event.target.value)} placeholder="Explicá cómo será la actividad, quiénes pueden asistir y qué deben llevar." /></label>
                <label><span>Comienza</span><input type="datetime-local" value={form.starts_at} onChange={(event) => change('starts_at', event.target.value)} /></label>
                <label><span>Finaliza (opcional)</span><input type="datetime-local" value={form.ends_at} onChange={(event) => change('ends_at', event.target.value)} /></label>
                <label><span>Lugar</span><input value={form.location} onChange={(event) => change('location', event.target.value)} placeholder="Sede, salón o zona" /></label>
                <label><span>Cupos</span><input type="number" min="1" value={form.capacity} onChange={(event) => change('capacity', event.target.value)} placeholder="Sin límite" /></label>
                <label><span>Precio</span><input type="number" min="0" step="0.01" disabled={form.is_free} value={form.price} onChange={(event) => change('price', event.target.value)} placeholder="0" /></label>
                <label className="file-label"><span>Imagen</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => change('image', event.target.files?.[0] || null)} /></label>
              </div>

              <div className="clinic-species-box">
                <span>Animales</span>
                <div>{speciesOptions.map(([value, label]) => <button type="button" key={value} className={form.species.includes(value) ? 'active' : ''} onClick={() => toggleSpecies(value)}>{label}</button>)}</div>
              </div>

              <div className="clinic-community-info">ℹ️ El cupo es informativo. Para pedir un turno, los dueños deben ingresar al perfil de la veterinaria o a la sección Mis turnos.</div>

              <div className="clinic-checks">
                <label><input type="checkbox" checked={form.is_free} onChange={(event) => change('is_free', event.target.checked)} /> Actividad gratuita</label>
                <label><input type="checkbox" checked={form.is_active} onChange={(event) => change('is_active', event.target.checked)} /> Visible públicamente</label>
              </div>

              <button className="clinic-primary-button" disabled={saving}>{saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear campaña'}</button>
            </form>

            <section className="clinic-campaign-list">
              <div className="clinic-section-title"><div><span>📅</span><div><h2>Tus campañas</h2><p>Publicalas en el muro como información para la Comunidad.</p></div></div></div>
              {campaigns.length === 0 ? <div className="clinic-empty">Todavía no creaste campañas.</div> : campaigns.map((item) => (
                <article className="clinic-campaign-row" key={item.id}>
                  {item.image_url ? <img src={item.image_url} alt="" /> : <div className="clinic-campaign-fallback">🏥</div>}
                  <div className="clinic-campaign-copy">
                    <div><span className="clinic-campaign-type">{item.campaign_type_display}</span>{!item.is_active && <span className="clinic-campaign-paused">Pausada</span>}</div>
                    <h3>{item.title}</h3>
                    <p>📅 {formatDate(item.starts_at)}{item.location ? ` · 📍 ${item.location}` : ''}</p>
                    <small>{item.capacity ? `Cupo informado: ${item.capacity}` : 'Sin cupo informado'} · {item.is_free ? 'Gratis' : item.price ? `$${Number(item.price).toLocaleString('es-AR')}` : 'Consultar'}</small>
                  </div>
                  <div className="clinic-campaign-actions">
                    <button onClick={() => publish(item)} disabled={busyId === `publish-${item.id}`}>{item.post_id ? 'Actualizar publicación' : 'Publicar en Comunidad'}</button>
                    <button onClick={() => edit(item)}>Editar</button>
                    <button className="danger" onClick={() => remove(item)} disabled={busyId === `delete-${item.id}`}>Eliminar</button>
                  </div>
                </article>
              ))}
            </section>
          </div>
        ) : (
          <section className="clinic-stats-grid">
            {[
              ['👥', 'Seguidores', stats?.profile_followers || 0],
              ['📝', 'Publicaciones', stats?.posts || 0],
              ['🐾', 'Patitas', stats?.reactions || 0],
              ['💬', 'Comentarios', stats?.comments || 0],
              ['↗', 'Compartidas', stats?.shares || 0],
              ['🏥', 'Campañas activas', stats?.active_campaigns || 0],
            ].map(([icon, label, value]) => <article key={label}><span>{icon}</span><strong>{value}</strong><p>{label}</p></article>)}
            <div className="clinic-stats-note">Estas estadísticas solo cuentan actividad pública de Comunidad. Las campañas son informativas y no crean turnos ni reservas. Los historiales médicos y datos de pacientes siguen completamente privados.</div>
          </section>
        )}
      </div>
    </main>
  )
}
