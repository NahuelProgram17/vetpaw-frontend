import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getMyBusinessProfile,
  getMyShelterProfile,
  updateMyBusinessProfile,
  updateMyShelterProfile,
} from '../services/api'
import VetPawLoader from '../components/VetPawLoader'
import './OrganizationProfile.css'

const DAYS = [
  ['0', 'Lunes'], ['1', 'Martes'], ['2', 'Miércoles'], ['3', 'Jueves'],
  ['4', 'Viernes'], ['5', 'Sábado'], ['6', 'Domingo'],
]
const SPECIES = [
  ['dog', '🐶 Perros'], ['cat', '🐱 Gatos'], ['rabbit', '🐰 Conejos'], ['bird', '🦜 Aves'],
  ['horse', '🐴 Caballos'], ['rodent', '🐹 Roedores'], ['reptile', '🦎 Reptiles'], ['farm', '🐮 Granja'], ['other', '🐾 Otros'],
]
const BUSINESS_TYPES = [
  ['grooming', 'Peluquería canina o felina'], ['petshop', 'Petshop'], ['food', 'Alimentos y accesorios'],
  ['daycare', 'Guardería'], ['boarding', 'Hospedaje'], ['walker', 'Paseador'], ['training', 'Adiestramiento'],
  ['transport', 'Transporte'], ['pharmacy', 'Farmacia veterinaria'], ['photography', 'Fotografía'], ['funeral', 'Servicios funerarios'], ['other', 'Otro'],
]
const SHELTER_TYPES = [
  ['shelter', 'Refugio'], ['association', 'Asociación protectora'], ['rescue', 'Organización de rescate'],
  ['foster', 'Hogar de tránsito'], ['independent', 'Rescatista independiente'], ['sanctuary', 'Santuario'], ['other', 'Otro'],
]
const BUSINESS_SERVICES = [
  ['grooming', '✂️ Peluquería'], ['bathing', '🛁 Baño'], ['food', '🥣 Alimentos'], ['accessories', '🦴 Accesorios'],
  ['daycare', '🌞 Guardería'], ['boarding', '🛏️ Hospedaje'], ['walking', '🦮 Paseos'], ['training', '🎓 Adiestramiento'],
  ['transport', '🚐 Traslados'], ['home_service', '🏠 A domicilio'], ['delivery', '📦 Envíos'], ['other', '🐾 Otro'],
]
const SHELTER_ACTIVITIES = [
  ['rescue', '🚨 Rescate'], ['foster', '🏠 Tránsito'], ['adoption', '🐾 Adopción'], ['neutering', '🩺 Castraciones'],
  ['vaccination', '💉 Vacunación'], ['recovery', '❤️ Recuperación'], ['lost_search', '🔎 Búsqueda de perdidos'], ['education', '📣 Concientización'],
]
const PAYMENT_METHODS = [['cash', 'Efectivo'], ['transfer', 'Transferencia'], ['debit', 'Débito'], ['credit', 'Crédito'], ['wallet', 'Billetera virtual']]

const initialSchedule = () => Object.fromEntries(DAYS.map(([id]) => [id, { open: '09:00', close: '18:00', closed: id === '6' }]))

export default function OrganizationDashboard({ kind }) {
  const isBusiness = kind === 'business'
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState(null)
  const [logo, setLogo] = useState(null)
  const [cover, setCover] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [coverPreview, setCoverPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const getter = isBusiness ? getMyBusinessProfile : getMyShelterProfile
    getter().then((data) => {
      setProfile(data)
      setForm({ ...data, opening_hours: data.opening_hours && Object.keys(data.opening_hours).length ? data.opening_hours : initialSchedule() })
      setLogoPreview(data.logo_url || '')
      setCoverPreview(data.cover_url || '')
    }).catch(() => setError('No encontramos el perfil asociado a esta cuenta.')).finally(() => setLoading(false))
  }, [isBusiness])

  useEffect(() => () => {
    if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview)
    if (coverPreview?.startsWith('blob:')) URL.revokeObjectURL(coverPreview)
  }, [logoPreview, coverPreview])

  const meta = useMemo(() => isBusiness ? {
    icon: '🛍️', title: 'Panel del negocio', typeField: 'business_type', typeOptions: BUSINESS_TYPES,
    itemsField: 'services', itemOptions: BUSINESS_SERVICES, publicUrl: profile ? `/negocios/${profile.slug}` : '#',
  } : {
    icon: '🏠', title: 'Panel del refugio', typeField: 'shelter_type', typeOptions: SHELTER_TYPES,
    itemsField: 'activities', itemOptions: SHELTER_ACTIVITIES, publicUrl: profile ? `/refugios/${profile.slug}` : '#',
  }, [isBusiness, profile])

  if (loading) return <VetPawLoader message="Cargando tu perfil..." subText="Preparando el panel" />
  if (error || !form) return <main className="org-page"><div className="org-shell org-empty">{error}</div></main>

  const set = (name, value) => setForm((current) => ({ ...current, [name]: value }))
  const toggle = (field, value) => set(field, (form[field] || []).includes(value) ? form[field].filter((item) => item !== value) : [...(form[field] || []), value])
  const updateSchedule = (day, field, value) => set('opening_hours', { ...form.opening_hours, [day]: { ...form.opening_hours[day], [field]: value } })

  const chooseImage = (event, type) => {
    const file = event.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    if (type === 'logo') { setLogo(file); setLogoPreview(url) } else { setCover(file); setCoverPreview(url) }
  }

  const save = async () => {
    setSaving(true); setMessage(''); setError('')
    try {
      const payload = { ...form }
      ;['id', 'slug', 'logo_url', 'cover_url', 'profile_url', 'completion_percentage', 'can_edit', 'created_at', 'updated_at', 'is_verified', 'is_active', 'business_type_display', 'shelter_type_display', 'capacity_status_display', 'public_address'].forEach((key) => delete payload[key])
      if (logo) payload.logo = logo
      if (cover) payload.cover = cover
      const updater = isBusiness ? updateMyBusinessProfile : updateMyShelterProfile
      const updated = await updater(payload)
      setProfile(updated)
      setForm({ ...updated, opening_hours: updated.opening_hours && Object.keys(updated.opening_hours).length ? updated.opening_hours : initialSchedule() })
      setLogoPreview(updated.logo_url || logoPreview)
      setCoverPreview(updated.cover_url || coverPreview)
      setLogo(null); setCover(null)
      setMessage('Perfil guardado correctamente.')
    } catch (requestError) {
      const data = requestError.response?.data
      setError(data ? Object.values(data).flat().join(' ') : 'No pudimos guardar los cambios.')
    } finally { setSaving(false) }
  }

  return <main className="org-page"><div className="org-shell">
    <header className="org-dashboard-head"><div><h1>{meta.icon} {meta.title}</h1><p>Completá tu espacio dentro de VetPaw. No necesitás enlazar ninguna red social externa.</p></div><div className="org-progress"><strong>Perfil {form.completion_percentage || 0}% completo</strong><div><i style={{ width: `${form.completion_percentage || 0}%` }} /></div></div></header>

    <section className="org-form-card"><h2>Identidad visual</h2><div className="org-images">
      <label><div className="org-preview-logo">{logoPreview ? <img src={logoPreview} alt="" /> : meta.icon}</div><input hidden type="file" accept="image/*" onChange={(event) => chooseImage(event, 'logo')} /><span className="org-tag" style={{ display: 'inline-block', marginTop: 8, cursor: 'pointer' }}>Cambiar logo</span></label>
      <label><div className="org-preview-cover">{coverPreview ? <img src={coverPreview} alt="" /> : '🐾'}</div><input hidden type="file" accept="image/*" onChange={(event) => chooseImage(event, 'cover')} /><span className="org-tag" style={{ display: 'inline-block', marginTop: 8, cursor: 'pointer' }}>Cambiar portada</span></label>
    </div></section>

    <section className="org-form-card"><h2>Información principal</h2><div className="org-form-grid">
      <Field label="Nombre"><input value={form.name || ''} onChange={(e) => set('name', e.target.value)} /></Field>
      <Field label="Responsable"><input value={form.responsible_name || ''} onChange={(e) => set('responsible_name', e.target.value)} /></Field>
      <Field label={isBusiness ? 'Tipo de negocio' : 'Tipo de refugio'}><select value={form[meta.typeField] || ''} onChange={(e) => set(meta.typeField, e.target.value)}>{meta.typeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
      <Field label="WhatsApp"><input value={form.whatsapp || ''} onChange={(e) => set('whatsapp', e.target.value)} /></Field>
      <Field label="Teléfono"><input value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field>
      <Field label="Provincia"><input value={form.province || ''} onChange={(e) => set('province', e.target.value)} /></Field>
      <Field label="Localidad"><input value={form.locality || ''} onChange={(e) => set('locality', e.target.value)} /></Field>
      <Field label="Dirección privada"><input value={form.address || ''} onChange={(e) => set('address', e.target.value)} /></Field>
      <Field label="Descripción" full><textarea value={form.description || ''} onChange={(e) => set('description', e.target.value)} /></Field>
    </div><div className="org-checks" style={{ marginTop: 13 }}><Check label="Mostrar dirección públicamente" checked={Boolean(form.show_public_address)} onChange={(value) => set('show_public_address', value)} /></div></section>

    <ChoiceSection title="Animales con los que trabaja" options={SPECIES} selected={form.species || []} onToggle={(value) => toggle('species', value)} />
    <ChoiceSection title={isBusiness ? 'Servicios ofrecidos' : 'Actividades del refugio'} options={meta.itemOptions} selected={form[meta.itemsField] || []} onToggle={(value) => toggle(meta.itemsField, value)} />

    {isBusiness ? <>
      <section className="org-form-card"><h2>Forma de atención</h2><div className="org-checks">
        <Check label="Atención a domicilio" checked={form.home_service} onChange={(v) => set('home_service', v)} />
        <Check label="Envíos" checked={form.delivery} onChange={(v) => set('delivery', v)} />
        <Check label="Venta online dentro de VetPaw" checked={form.online_sales} onChange={(v) => set('online_sales', v)} />
        <Check label="Atención con turno" checked={form.appointment_required} onChange={(v) => set('appointment_required', v)} />
        <Check label="Recibir reservas dentro de VetPaw" checked={Boolean(form.accepts_reservations)} onChange={(v) => set('accepts_reservations', v)} />
        <Check label="Atención 24 horas" checked={form.is_24h} onChange={(v) => set('is_24h', v)} />
      </div><div className="org-form-grid" style={{ marginTop: 14 }}><Field label="Rango de precios"><input value={form.price_range || ''} onChange={(e) => set('price_range', e.target.value)} placeholder="Ej: Económico / Medio" /></Field><Field label="Promociones" full><textarea value={form.promotions || ''} onChange={(e) => set('promotions', e.target.value)} /></Field></div></section>
      <ChoiceSection title="Métodos de pago" options={PAYMENT_METHODS} selected={form.payment_methods || []} onToggle={(value) => toggle('payment_methods', value)} />
      <section className="org-form-card"><h2>Horarios</h2><div className="org-schedule">{DAYS.map(([id, label]) => <div className="org-schedule-row" key={id}><b>{label}</b><input type="time" disabled={form.opening_hours?.[id]?.closed} value={form.opening_hours?.[id]?.open || '09:00'} onChange={(e) => updateSchedule(id, 'open', e.target.value)} /><input type="time" disabled={form.opening_hours?.[id]?.closed} value={form.opening_hours?.[id]?.close || '18:00'} onChange={(e) => updateSchedule(id, 'close', e.target.value)} /><label><input type="checkbox" checked={Boolean(form.opening_hours?.[id]?.closed)} onChange={(e) => updateSchedule(id, 'closed', e.target.checked)} /> Cerrado</label></div>)}</div></section>
      <section className="org-form-card"><h2>Datos privados para verificación</h2><div className="org-form-grid"><Field label="Razón social"><input value={form.legal_name || ''} onChange={(e) => set('legal_name', e.target.value)} /></Field><Field label="CUIT"><input value={form.tax_id || ''} onChange={(e) => set('tax_id', e.target.value)} /></Field></div></section>
    </> : <>
      <section className="org-form-card"><h2>Capacidad y adopciones</h2><div className="org-form-grid">
        <Field label="Estado de capacidad"><select value={form.capacity_status || 'limited'} onChange={(e) => set('capacity_status', e.target.value)}><option value="available">Puede recibir animales</option><option value="limited">Cupos limitados</option><option value="full">Capacidad completa</option><option value="emergency">Solo urgencias</option></select></Field>
        <Field label="Zona de trabajo"><input value={form.work_area || ''} onChange={(e) => set('work_area', e.target.value)} /></Field>
        <Field label="Año de creación"><input type="number" value={form.founded_year || ''} onChange={(e) => set('founded_year', e.target.value || null)} /></Field>
        <Field label="Zona de adopción"><input value={form.adoption_area || ''} onChange={(e) => set('adoption_area', e.target.value)} /></Field>
        <Field label="Requisitos de adopción" full><textarea value={form.adoption_requirements || ''} onChange={(e) => set('adoption_requirements', e.target.value)} /></Field>
      </div><div className="org-checks" style={{ marginTop: 14 }}>
        <Check label="Puede recibir animales" checked={form.accepting_animals} onChange={(v) => set('accepting_animals', v)} />
        <Check label="Entrevista previa" checked={form.adoption_interview} onChange={(v) => set('adoption_interview', v)} />
        <Check label="Seguimiento posterior" checked={form.adoption_follow_up} onChange={(v) => set('adoption_follow_up', v)} />
        <Check label="Compromiso de castración" checked={form.adoption_castration_commitment} onChange={(v) => set('adoption_castration_commitment', v)} />
        <Check label="Hogar seguro" checked={form.adoption_safe_home_required} onChange={(v) => set('adoption_safe_home_required', v)} />
        <Check label="Adopciones fuera de provincia" checked={form.adoption_outside_province} onChange={(v) => set('adoption_outside_province', v)} />
      </div></section>
      <section className="org-form-card"><h2>Formas de colaboración</h2><div className="org-checks">
        <Check label="Necesita voluntarios" checked={form.needs_volunteers} onChange={(v) => set('needs_volunteers', v)} />
        <Check label="Necesita hogares de tránsito" checked={form.needs_foster_homes} onChange={(v) => set('needs_foster_homes', v)} />
        <Check label="Acepta donaciones" checked={form.accepts_donations} onChange={(v) => set('accepts_donations', v)} />
        <Check label="Acepta alimento" checked={form.accepts_food} onChange={(v) => set('accepts_food', v)} />
        <Check label="Acepta medicamentos" checked={form.accepts_medicine} onChange={(v) => set('accepts_medicine', v)} />
        <Check label="Necesita traslados" checked={form.needs_transport} onChange={(v) => set('needs_transport', v)} />
        <Check label="Necesita ayuda veterinaria" checked={form.needs_vet_help} onChange={(v) => set('needs_vet_help', v)} />
        <Check label="Necesita difusión" checked={form.needs_sharing} onChange={(v) => set('needs_sharing', v)} />
      </div><div className="org-form-grid" style={{ marginTop: 14 }}><Field label="Alias para donaciones"><input value={form.donation_alias || ''} onChange={(e) => set('donation_alias', e.target.value)} /></Field><Field label="CBU/CVU privado"><input value={form.donation_cbu || ''} onChange={(e) => set('donation_cbu', e.target.value)} /></Field><Field label="Qué necesita el refugio" full><textarea value={form.donation_needs || ''} onChange={(e) => set('donation_needs', e.target.value)} /></Field></div></section>
      <section className="org-form-card"><h2>Datos privados para verificación</h2><div className="org-form-grid"><Field label="Personería o estado legal"><input value={form.legal_status || ''} onChange={(e) => set('legal_status', e.target.value)} /></Field><Field label="CUIT"><input value={form.tax_id || ''} onChange={(e) => set('tax_id', e.target.value)} /></Field><Field label="Número de registro"><input value={form.registration_number || ''} onChange={(e) => set('registration_number', e.target.value)} /></Field></div></section>
    </>}

    <div className="org-save-bar"><span>{message || error}</span><div style={{ display: 'flex', gap: 8 }}><Link className="org-tag" to={meta.publicUrl} style={{ textDecoration: 'none' }}>Ver perfil público</Link><button disabled={saving} onClick={save}>{saving ? 'Guardando...' : 'Guardar cambios'}</button></div></div>
  </div></main>
}

function Field({ label, children, full = false }) { return <label className={`org-form-field ${full ? 'full' : ''}`}><span>{label}</span>{children}</label> }
function Check({ label, checked, onChange }) { return <label className="org-check"><input type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} />{label}</label> }
function ChoiceSection({ title, options, selected, onToggle }) { return <section className="org-form-card"><h2>{title}</h2><div className="org-checks">{options.map(([value, label]) => <Check key={value} label={label} checked={selected.includes(value)} onChange={() => onToggle(value)} />)}</div></section> }
