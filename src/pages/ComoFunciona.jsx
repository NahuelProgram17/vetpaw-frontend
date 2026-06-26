import { useState } from 'react'
import { Link } from 'react-router-dom'

const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif"
const G1 = '#4CAF50'
const G2 = '#66BB6A'
const O1 = '#FF9800'
const O2 = '#FFB74D'
const DARK2 = '#162032'

const pasosDueno = [
    { n: '1', title: 'Creá tu cuenta gratis', text: 'Registrate en un minuto, sin costo y sin tarjeta.' },
    { n: '2', title: 'Cargá tu mascota', text: 'Armá su ficha con foto, datos y todo lo importante.' },
    { n: '3', title: 'Usá todas las funciones', text: 'Antiparasitarios, mascotas perdidas, turnos y más.' },
]

const funcionesDueno = [
    { icon: '🐾', accent: '#ef4444', title: 'Mascotas perdidas', text: 'Publicá o buscá mascotas perdidas y encontradas. Lo ve toda la comunidad de tu zona, gratis.' },
    { icon: '💊', accent: G1, title: 'Antiparasitarios', text: 'Llevá el control de desparasitaciones, pulgas y pipetas. No se te pasa ninguna aplicación.' },
    { icon: '📋', accent: '#6bcaff', title: 'Expediente digital', text: 'Vacunas, alergias e historia clínica de tu mascota, siempre a mano y en un lugar seguro.' },
    { icon: '✈️', accent: O1, title: 'Viajar con tu mascota', text: 'Accedé directo al trámite oficial de SENASA para viajar dentro del país o al exterior.' },
    { icon: '📅', accent: '#a78bfa', title: 'Turnos online', text: 'Pedí turno con tu veterinaria sin llamar, en cualquier momento del día.' },
    { icon: '🔒', accent: G2, title: 'Vos controlás todo', text: 'Solo las veterinarias que vos elegís pueden ver el historial de tu mascota.' },
]

const pasosClinica = [
    { n: '1', title: 'Sumá tu veterinaria', text: 'Registrá tu clínica y completá su perfil en VetPaw.' },
    { n: '2', title: 'Recibí turnos online', text: 'Los dueños piden turno desde la app, sin llamados.' },
    { n: '3', title: 'Gestioná tus pacientes', text: 'Cargá historiales, vacunas y seguí a cada paciente.' },
]

const beneficiosClinica = [
    { icon: '📅', accent: G1, title: 'Turnos sin llamadas', text: 'Recibí solicitudes de turno organizadas, sin saturar el teléfono de la clínica.' },
    { icon: '🐶', accent: O1, title: 'Ficha de pacientes', text: 'Cargá vacunas (con lote y dosis), tratamientos e historia clínica de cada paciente.' },
    { icon: '⭐', accent: '#ffd93d', title: 'Más visibilidad', text: 'Aparecé ante los dueños de mascotas de tu zona que buscan una veterinaria de confianza.' },
    { icon: '📣', accent: '#6bcaff', title: 'Publicidad', text: 'Mostrá tu clínica o tus promociones a toda la comunidad de dueños de VetPaw.' },
]

export default function ComoFunciona() {
    const [tab, setTab] = useState('dueno')

    const tabBtn = (key, label) => (
        <button onClick={() => setTab(key)}
            style={{
                flex: 1, maxWidth: 240, padding: '14px 20px', borderRadius: 14, cursor: 'pointer',
                fontFamily: FONT, fontWeight: 800, fontSize: 15,
                border: tab === key ? 'none' : '1.5px solid rgba(255,255,255,0.15)',
                background: tab === key ? `linear-gradient(135deg, ${G1}, ${O1})` : 'rgba(255,255,255,0.04)',
                color: tab === key ? '#fff' : 'rgba(255,255,255,0.6)',
                transition: 'all .2s',
            }}>
            {label}
        </button>
    )

    return (
        <div style={{ minHeight: '100vh', background: '#0f1923', fontFamily: FONT, color: '#fff' }}>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #0a1520, #162032)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '48px 24px 40px', textAlign: 'center' }}>
                <Link to="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>← Volver al inicio</Link>
                <div style={{ marginBottom: 16 }}>
                    <img src="/logo_vetpaw.png" alt="VetPaw" style={{ height: 80, width: 'auto' }} />
                </div>
                <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12, background: `linear-gradient(135deg, ${G1}, ${O1})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Cómo funciona VetPaw
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, maxWidth: 560, margin: '0 auto' }}>
                    La app que conecta a los dueños de mascotas con las veterinarias. Elegí tu caso y mirá cómo te sirve.
                </p>
            </div>

            {/* Selector de público */}
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 0' }}>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    {tabBtn('dueno', '🐾 Soy dueño')}
                    {tabBtn('clinica', '🏥 Soy veterinaria')}
                </div>
            </div>

            {/* Contenido */}
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 24px 80px' }}>

                {tab === 'dueno' && (
                    <div>
                        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, textAlign: 'center', marginBottom: 36, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
                            VetPaw es tu mano derecha para cuidar a tu mascota: llevás todo ordenado, no te olvidás de nada y tenés ayuda cuando más la necesitás. <strong>Gratis.</strong>
                        </p>

                        {/* Pasos */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 44 }}>
                            {pasosDueno.map((p) => (
                                <div key={p.n} style={{ background: DARK2, border: '1.5px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '24px 22px', textAlign: 'center' }}>
                                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${G1}, ${O1})`, color: '#fff', fontSize: 22, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>{p.n}</div>
                                    <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{p.title}</h3>
                                    <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{p.text}</p>
                                </div>
                            ))}
                        </div>

                        {/* Funciones */}
                        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 18, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center' }}>Todo lo que podés hacer</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 44 }}>
                            {funcionesDueno.map((f, i) => (
                                <div key={i} style={{ background: DARK2, border: '1.5px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '22px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                                    <div style={{ width: 50, height: 50, borderRadius: 14, background: `${f.accent}22`, border: `1px solid ${f.accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{f.icon}</div>
                                    <div>
                                        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>{f.title}</h3>
                                        <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{f.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <div style={{ textAlign: 'center', background: 'linear-gradient(135deg, rgba(76,175,80,0.1), rgba(255,152,0,0.1))', border: '1px solid rgba(76,175,80,0.25)', borderRadius: 20, padding: '32px 24px' }}>
                            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>🐾 Empezá a cuidar a tu mascota hoy</h3>
                            <Link to="/register" style={{ display: 'inline-block', background: `linear-gradient(135deg, ${G1}, ${O1})`, color: '#fff', fontWeight: 800, fontSize: 15, padding: '14px 32px', borderRadius: 14, textDecoration: 'none' }}>
                                Crear mi cuenta gratis
                            </Link>
                        </div>
                    </div>
                )}

                {tab === 'clinica' && (
                    <div>
                        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, textAlign: 'center', marginBottom: 36, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
                            VetPaw acerca tu veterinaria a los dueños de mascotas de tu zona: recibís turnos online, gestionás a tus pacientes y ganás visibilidad, todo desde un solo lugar.
                        </p>

                        {/* Pasos */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 44 }}>
                            {pasosClinica.map((p) => (
                                <div key={p.n} style={{ background: DARK2, border: '1.5px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '24px 22px', textAlign: 'center' }}>
                                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${O1}, ${G1})`, color: '#fff', fontSize: 22, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>{p.n}</div>
                                    <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{p.title}</h3>
                                    <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{p.text}</p>
                                </div>
                            ))}
                        </div>

                        {/* Beneficios */}
                        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 18, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center' }}>Beneficios para tu clínica</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 44 }}>
                            {beneficiosClinica.map((f, i) => (
                                <div key={i} style={{ background: DARK2, border: '1.5px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '22px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                                    <div style={{ width: 50, height: 50, borderRadius: 14, background: `${f.accent}22`, border: `1px solid ${f.accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{f.icon}</div>
                                    <div>
                                        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>{f.title}</h3>
                                        <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{f.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <div style={{ textAlign: 'center', background: 'linear-gradient(135deg, rgba(255,152,0,0.1), rgba(76,175,80,0.1))', border: '1px solid rgba(255,152,0,0.25)', borderRadius: 20, padding: '32px 24px' }}>
                            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>🏥 Sumá tu veterinaria a VetPaw</h3>
                            <Link to="/sumar-veterinaria" style={{ display: 'inline-block', background: `linear-gradient(135deg, ${O1}, ${G1})`, color: '#fff', fontWeight: 800, fontSize: 15, padding: '14px 32px', borderRadius: 14, textDecoration: 'none' }}>
                                Sumar mi veterinaria
                            </Link>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}
