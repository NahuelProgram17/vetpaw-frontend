import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from '../services/api'

const SPECIES = [
  ['dog', '🐶 Perros'], ['cat', '🐱 Gatos'], ['rabbit', '🐰 Conejos'],
  ['bird', '🦜 Aves'], ['horse', '🐴 Caballos'], ['rodent', '🐹 Roedores'],
  ['reptile', '🦎 Reptiles'], ['farm', '🐮 Animales de granja'], ['other', '🐾 Otros'],
]

const BUSINESS_TYPES = [
  ['grooming', 'Peluquería canina o felina'], ['petshop', 'Petshop'],
  ['food', 'Alimentos y accesorios'], ['daycare', 'Guardería'],
  ['boarding', 'Hospedaje'], ['walker', 'Paseador'], ['training', 'Adiestramiento'],
  ['transport', 'Transporte de mascotas'], ['pharmacy', 'Farmacia veterinaria'],
  ['photography', 'Fotografía de mascotas'], ['funeral', 'Servicios funerarios'], ['other', 'Otro servicio'],
]

const SHELTER_TYPES = [
  ['shelter', 'Refugio'], ['association', 'Asociación protectora'],
  ['rescue', 'Organización de rescate'], ['foster', 'Hogar de tránsito'],
  ['independent', 'Rescatista independiente'], ['sanctuary', 'Santuario'], ['other', 'Otro'],
]

const BUSINESS_SERVICES = [
  ['grooming', '✂️ Peluquería'], ['bathing', '🛁 Baño'], ['food', '🥣 Alimentos'],
  ['accessories', '🦴 Accesorios'], ['daycare', '🌞 Guardería'], ['boarding', '🛏️ Hospedaje'],
  ['walking', '🦮 Paseos'], ['training', '🎓 Adiestramiento'], ['transport', '🚐 Traslados'],
  ['home_service', '🏠 A domicilio'], ['delivery', '📦 Envíos'], ['other', '🐾 Otro'],
]

const SHELTER_ACTIVITIES = [
  ['rescue', '🚨 Rescate'], ['foster', '🏠 Tránsito'], ['adoption', '🐾 Adopción'],
  ['neutering', '🩺 Castraciones'], ['vaccination', '💉 Vacunación'],
  ['recovery', '❤️ Recuperación'], ['lost_search', '🔎 Búsqueda de perdidos'],
  ['education', '📣 Concientización'],
]

export default function RegisterOrganization() {
  const location = useLocation()
  const navigate = useNavigate()
  const role = location.pathname.includes('/shelter') ? 'shelter' : 'business'
  const isBusiness = role === 'business'
  const meta = useMemo(() => isBusiness ? {
    icon: '🛍️', title: 'Registrá tu negocio', noun: 'negocio', color: '#45c7a4',
    types: BUSINESS_TYPES, items: BUSINESS_SERVICES,
  } : {
    icon: '🏠', title: 'Registrá tu refugio', noun: 'refugio', color: '#ffb84d',
    types: SHELTER_TYPES, items: SHELTER_ACTIVITIES,
  }, [isBusiness])

  const [step, setStep] = useState(0)
  const [account, setAccount] = useState({ username: '', email: '', password: '', password2: '' })
  const [profile, setProfile] = useState({
    name: '', type: '', responsible_name: '', phone: '', whatsapp: '',
    province: '', locality: '', address: '', description: '', species: [], items: [],
    accepting_animals: false,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const setAccountField = (event) => setAccount((current) => ({ ...current, [event.target.name]: event.target.value }))
  const setProfileField = (event) => setProfile((current) => ({ ...current, [event.target.name]: event.target.value }))
  const toggleArray = (field, value) => setProfile((current) => ({
    ...current,
    [field]: current[field].includes(value) ? current[field].filter((item) => item !== value) : [...current[field], value],
  }))

  const validateAccount = () => {
    if (!account.username || !account.email || !account.password || !account.password2) return 'Completá todos los datos de la cuenta.'
    if (account.password !== account.password2) return 'Las contraseñas no coinciden.'
    if (account.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
    return ''
  }

  const validateProfile = () => {
    if (!profile.name || !profile.type || !profile.responsible_name || !profile.province || !profile.locality) {
      return `Completá nombre, tipo de ${meta.noun}, responsable, provincia y localidad.`
    }
    if (!profile.whatsapp && !profile.phone) return 'Agregá un teléfono o WhatsApp de contacto.'
    if (!profile.species.length) return 'Seleccioná al menos un tipo de animal.'
    return ''
  }

  const next = () => {
    const message = validateAccount()
    if (message) return setError(message)
    setError('')
    setStep(1)
  }

  const submit = async () => {
    const message = validateProfile()
    if (message) return setError(message)
    setLoading(true)
    setError('')
    try {
      const endpoint = isBusiness ? '/users/register-business/' : '/users/register-shelter/'
      const payload = isBusiness ? {
        ...account,
        business_name: profile.name,
        business_type: profile.type,
        responsible_name: profile.responsible_name,
        business_phone: profile.phone,
        business_whatsapp: profile.whatsapp,
        business_province: profile.province,
        business_locality: profile.locality,
        business_address: profile.address,
        business_description: profile.description,
        business_species: profile.species,
        business_services: profile.items,
      } : {
        ...account,
        shelter_name: profile.name,
        shelter_type: profile.type,
        responsible_name: profile.responsible_name,
        shelter_phone: profile.phone,
        shelter_whatsapp: profile.whatsapp,
        shelter_province: profile.province,
        shelter_locality: profile.locality,
        shelter_description: profile.description,
        shelter_species: profile.species,
        shelter_activities: profile.items,
        accepting_animals: profile.accepting_animals,
      }
      await api.post(endpoint, payload)
      setStep(2)
    } catch (requestError) {
      const data = requestError.response?.data
      setError(data ? Object.values(data).flat().join(' ') : (requestError.userMessage || 'No pudimos completar el registro.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="org-register-page" style={{ '--org-accent': meta.color }}>
      <div className="org-register-glow one" /><div className="org-register-glow two" />
      <section className="org-register-card">
        <header><span>{meta.icon}</span><div><h1>VetPaw</h1><p>{meta.title}</p></div></header>

        {step < 2 && <div className="org-steps">
          <div className={step === 0 ? 'active' : 'done'}><b>{step > 0 ? '✓' : '1'}</b><span>Cuenta</span></div>
          <i />
          <div className={step === 1 ? 'active' : ''}><b>2</b><span>{isBusiness ? 'Negocio' : 'Refugio'}</span></div>
        </div>}

        {error && <div className="org-error" role="alert" aria-live="assertive">⚠️ {error}</div>}

        {step === 0 && <div className="org-form">
          <Field label="Usuario" icon="👤"><input name="username" value={account.username} onChange={setAccountField} placeholder={isBusiness ? 'mi_petshop' : 'refugio_amigos'} /></Field>
          <Field label="Correo electrónico" icon="✉️"><input name="email" type="email" value={account.email} onChange={setAccountField} placeholder="contacto@ejemplo.com" /></Field>
          <div className="org-two">
            <Field label="Contraseña" icon="🔒"><input name="password" type="password" value={account.password} onChange={setAccountField} placeholder="Mínimo 8 caracteres" /></Field>
            <Field label="Repetir contraseña" icon="🔒"><input name="password2" type="password" value={account.password2} onChange={setAccountField} placeholder="••••••••" /></Field>
          </div>
          <div className="org-actions"><button className="ghost" onClick={() => navigate('/register')}>← Volver</button><button onClick={next}>Continuar →</button></div>
        </div>}

        {step === 1 && <div className="org-form">
          <Field label={`Nombre del ${meta.noun}`} icon={meta.icon}><input name="name" value={profile.name} onChange={setProfileField} placeholder={isBusiness ? 'Mundo Animal' : 'Patitas al Rescate'} /></Field>
          <div className="org-two">
            <Field label={`Tipo de ${meta.noun}`}><select name="type" value={profile.type} onChange={setProfileField}><option value="">Elegir...</option>{meta.types.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></Field>
            <Field label="Responsable" icon="👤"><input name="responsible_name" value={profile.responsible_name} onChange={setProfileField} placeholder="Nombre y apellido" /></Field>
          </div>
          <div className="org-two">
            <Field label="Teléfono" icon="📞"><input name="phone" value={profile.phone} onChange={setProfileField} placeholder="11 0000 0000" /></Field>
            <Field label="WhatsApp" icon="💬"><input name="whatsapp" value={profile.whatsapp} onChange={setProfileField} placeholder="11 0000 0000" /></Field>
          </div>
          <div className="org-two">
            <Field label="Provincia" icon="🗺️"><input name="province" value={profile.province} onChange={setProfileField} placeholder="Buenos Aires" /></Field>
            <Field label="Localidad" icon="📍"><input name="locality" value={profile.locality} onChange={setProfileField} placeholder="Moreno" /></Field>
          </div>
          {isBusiness && <Field label="Dirección (queda privada hasta que decidas mostrarla)" icon="🏪"><input name="address" value={profile.address} onChange={setProfileField} placeholder="Calle y número" /></Field>}
          <Field label="Descripción"><textarea name="description" value={profile.description} onChange={setProfileField} placeholder={isBusiness ? 'Contá qué ofrece tu negocio...' : 'Contá la historia y el trabajo del refugio...'} /></Field>

          <ChipGroup title="Animales" options={SPECIES} selected={profile.species} onToggle={(value) => toggleArray('species', value)} />
          <ChipGroup title={isBusiness ? 'Servicios principales' : 'Actividades'} options={meta.items} selected={profile.items} onToggle={(value) => toggleArray('items', value)} />
          {!isBusiness && <label className="org-checkbox"><input type="checkbox" checked={profile.accepting_animals} onChange={(event) => setProfile((current) => ({ ...current, accepting_animals: event.target.checked }))} /> Actualmente puede recibir animales</label>}

          <div className="org-actions"><button className="ghost" onClick={() => setStep(0)}>← Volver</button><button disabled={loading} onClick={submit}>{loading ? 'Registrando...' : `Registrar ${meta.noun} ${meta.icon}`}</button></div>
        </div>}

        {step === 2 && <div className="org-success">
          <span>{meta.icon}</span><h2>¡Solicitud enviada!</h2>
          <p>Tu {meta.noun} quedó registrado y pendiente de aprobación. Cuando esté habilitado vas a poder completar el perfil, publicar y formar parte de la comunidad VetPaw.</p>
          <button onClick={() => navigate('/login')}>Ir a iniciar sesión</button>
        </div>}

        {step < 2 && <p className="org-switch">¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link></p>}
      </section>
      <style>{styles}</style>
    </main>
  )
}

function Field({ label, icon, children }) {
  return <label className="org-field"><span>{label}</span><div>{icon && <i>{icon}</i>}{children}</div></label>
}

function ChipGroup({ title, options, selected, onToggle }) {
  return <div className="org-chip-group"><b>{title}</b><div>{options.map(([value, label]) => <button type="button" className={selected.includes(value) ? 'selected' : ''} onClick={() => onToggle(value)} key={value}>{label}</button>)}</div></div>
}

const styles = `
*{box-sizing:border-box}.org-register-page{min-height:100vh;padding:105px 16px 50px;background:#08131f;color:#fff;font-family:'Nunito','Plus Jakarta Sans',sans-serif;position:relative;overflow:hidden}.org-register-glow{position:fixed;width:420px;height:420px;border-radius:50%;filter:blur(95px);opacity:.16;pointer-events:none}.org-register-glow.one{background:var(--org-accent);top:-150px;right:-130px}.org-register-glow.two{background:#4caf50;bottom:-180px;left:-140px}.org-register-card{position:relative;z-index:1;width:min(720px,100%);margin:auto;padding:32px;border:1px solid rgba(255,255,255,.1);border-radius:28px;background:rgba(16,31,47,.94);box-shadow:0 30px 90px rgba(0,0,0,.38)}.org-register-card header{display:flex;align-items:center;gap:13px}.org-register-card header>span{width:55px;height:55px;display:grid;place-items:center;border-radius:18px;background:color-mix(in srgb,var(--org-accent) 18%,transparent);font-size:29px}.org-register-card h1{font-family:'Baloo 2','Nunito',sans-serif;font-size:31px;color:var(--org-accent);line-height:1}.org-register-card header p{margin-top:4px;color:rgba(255,255,255,.48);font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.8px}.org-steps{display:flex;align-items:center;margin:25px 0}.org-steps>div{display:flex;align-items:center;gap:8px;color:rgba(255,255,255,.35);font-size:12px;font-weight:900;text-transform:uppercase}.org-steps b{width:29px;height:29px;display:grid;place-items:center;border:2px solid rgba(255,255,255,.15);border-radius:50%}.org-steps .active{color:var(--org-accent)}.org-steps .active b{border-color:var(--org-accent);box-shadow:0 0 0 4px color-mix(in srgb,var(--org-accent) 15%,transparent)}.org-steps .done b{background:#4caf50;border-color:#4caf50;color:#07131f}.org-steps i{height:2px;flex:1;margin:0 12px;background:rgba(255,255,255,.08)}.org-error{margin:0 0 16px;padding:11px 13px;border:1px solid rgba(255,105,105,.35);border-radius:12px;background:rgba(255,105,105,.1);color:#ffaaaa;font-size:13px}.org-form{display:grid;gap:14px}.org-two{display:grid;grid-template-columns:1fr 1fr;gap:12px}.org-field{display:grid;gap:6px}.org-field>span,.org-chip-group>b{color:rgba(255,255,255,.55);font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.6px}.org-field>div{position:relative}.org-field i{position:absolute;left:13px;top:50%;transform:translateY(-50%);font-style:normal}.org-field input,.org-field select,.org-field textarea{width:100%;border:1.5px solid rgba(255,255,255,.1);border-radius:12px;background:rgba(255,255,255,.055);color:#fff;padding:13px 14px;font:700 14px inherit;outline:none}.org-field i+input{padding-left:42px}.org-field select option{color:#111}.org-field textarea{min-height:88px;resize:vertical}.org-field input:focus,.org-field select:focus,.org-field textarea:focus{border-color:var(--org-accent);box-shadow:0 0 0 4px color-mix(in srgb,var(--org-accent) 10%,transparent)}.org-chip-group{display:grid;gap:8px}.org-chip-group>div{display:flex;flex-wrap:wrap;gap:7px}.org-chip-group button{border:1px solid rgba(255,255,255,.11);border-radius:999px;background:rgba(255,255,255,.04);color:rgba(255,255,255,.62);padding:7px 11px;font:800 11px inherit;cursor:pointer}.org-chip-group button.selected{border-color:var(--org-accent);background:color-mix(in srgb,var(--org-accent) 15%,transparent);color:#fff}.org-checkbox{display:flex;align-items:center;gap:9px;color:rgba(255,255,255,.65);font-size:13px;font-weight:800}.org-checkbox input{accent-color:#4caf50}.org-actions{display:flex;gap:10px;margin-top:5px}.org-actions button,.org-success button{flex:2;border:0;border-radius:12px;padding:13px 18px;background:linear-gradient(135deg,#4caf50,var(--org-accent));color:#07131f;font:900 14px inherit;cursor:pointer}.org-actions button.ghost{flex:1;border:1px solid rgba(255,255,255,.12);background:transparent;color:rgba(255,255,255,.55)}.org-actions button:disabled{opacity:.55}.org-switch{text-align:center;margin-top:19px;color:rgba(255,255,255,.38);font-size:13px}.org-switch a{color:var(--org-accent);font-weight:900;text-decoration:none}.org-success{text-align:center;padding:28px 5px 8px}.org-success>span{font-size:68px}.org-success h2{margin:10px 0;color:var(--org-accent);font:900 30px 'Baloo 2','Nunito',sans-serif}.org-success p{max-width:560px;margin:0 auto 23px;color:rgba(255,255,255,.56);line-height:1.65}.org-success button{max-width:300px;width:100%}@media(max-width:620px){.org-register-page{padding:88px 10px 35px}.org-register-card{padding:23px 16px;border-radius:22px}.org-two{grid-template-columns:1fr}.org-actions{flex-direction:column}.org-actions button{width:100%}}
`
