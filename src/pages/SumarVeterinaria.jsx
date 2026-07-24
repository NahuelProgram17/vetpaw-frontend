import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif"
const G1 = '#4CAF50'
const O1 = '#FF9800'

export default function SumarVeterinaria() {
    const [form, setForm] = useState({ nombre_clinica: '', nombre_contacto: '', email: '', telefono: '', direccion: '', localidad: '', provincia: '', servicios: '', mensaje: '' })
    const [enviando, setEnviando] = useState(false)
    const [enviado, setEnviado] = useState(false)
    const [error, setError] = useState('')

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (!form.nombre_clinica || !form.email || !form.telefono) {
            setError('Por favor completá los campos obligatorios.')
            return
        }
        setEnviando(true)
        try {
            await api.post('/contact/veterinaria/', form)
            setEnviado(true)
        } catch {
            setError('Hubo un error. Escribinos directamente a vetpawapp@gmail.com')
        } finally {
            setEnviando(false)
        }
    }

    const inputStyle = {
        width: '100%', padding: '12px 14px',
        background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)',
        borderRadius: 10, color: '#fff', fontSize: 14, fontFamily: FONT,
        outline: 'none', boxSizing: 'border-box',
    }
    const labelStyle = { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }

    return (
        <div style={{ minHeight: '100vh', background: '#0f1923', fontFamily: FONT, color: '#fff' }}>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

            <div style={{ background: 'linear-gradient(135deg, #0a1520, #162032)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(28px, 6vw, 48px) clamp(14px, 5vw, 40px) clamp(28px, 5vw, 40px)', textAlign: 'center' }}>
                <Link to="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>← Volver al inicio</Link>
                <div style={{ marginBottom: 16 }}>
                    <img src="/logo_vetpaw.png" alt="VetPaw" style={{ height: 80, width: 'auto' }} />
                </div>
                <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12, background: `linear-gradient(135deg, ${G1}, ${O1})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Sumar mi veterinaria
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, maxWidth: 520, margin: '0 auto' }}>
                    Unite a VetPaw y gestioná turnos, historiales clínicos y comunicación con tus clientes desde un solo lugar.
                </p>
            </div>

            <div style={{ maxWidth: 780, margin: '0 auto', padding: 'clamp(28px, 6vw, 48px) clamp(14px, 5vw, 40px) clamp(48px, 8vw, 80px)' }}>

                {/* Beneficios */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 40 }}>
                    {[
                        { icon: '📅', titulo: 'Turnos online', texto: 'Recibí turnos sin llamadas' },
                        { icon: '📋', titulo: 'Historial digital', texto: 'Todo el historial en un lugar' },
                        { icon: '💬', titulo: 'Mensajería', texto: 'Comunicación directa con dueños' },
                    ].map((b, i) => (
                        <div key={i} style={{ background: 'rgba(76,175,80,0.06)', border: '1px solid rgba(76,175,80,0.15)', borderRadius: 14, padding: '20px', textAlign: 'center' }}>
                            <div style={{ fontSize: 32, marginBottom: 10 }}>{b.icon}</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{b.titulo}</div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{b.texto}</div>
                        </div>
                    ))}
                </div>

                {enviado ? (
                    <div style={{ background: 'rgba(76,175,80,0.1)', border: '1.5px solid rgba(76,175,80,0.3)', borderRadius: 20, padding: '48px', textAlign: 'center' }}>
                        <div style={{ fontSize: 56, marginBottom: 16 }}>🏥</div>
                        <h3 style={{ fontSize: 22, fontWeight: 900, color: G1, marginBottom: 10 }}>¡Solicitud enviada!</h3>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, marginBottom: 24 }}>Recibimos los datos de tu clínica. Te contactaremos en las próximas 48hs hábiles.</p>
                        <Link to="/" style={{ background: `linear-gradient(135deg, ${G1}, ${O1})`, color: '#fff', fontWeight: 800, fontSize: 14, padding: '12px 28px', borderRadius: 12, textDecoration: 'none' }}>
                            Volver al inicio
                        </Link>
                    </div>
                ) : (
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '36px' }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>Datos de tu clínica</h2>

                        {error && (
                            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#f87171', fontSize: 14 }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={labelStyle}>Nombre de la clínica *</label>
                                    <input name="nombre_clinica" value={form.nombre_clinica} onChange={handleChange} placeholder="Ej: Clínica Vida Animal" style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = G1} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Nombre del contacto</label>
                                    <input name="nombre_contacto" value={form.nombre_contacto} onChange={handleChange} placeholder="Tu nombre" style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = G1} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={labelStyle}>Email *</label>
                                    <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="clinica@email.com" style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = G1} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Teléfono *</label>
                                    <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="11 1234-5678" style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = G1} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Dirección</label>
                                <input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Av. Corrientes 1234" style={inputStyle}
                                    onFocus={e => e.target.style.borderColor = G1} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={labelStyle}>Localidad</label>
                                    <input name="localidad" value={form.localidad} onChange={handleChange} placeholder="Palermo" style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = G1} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Provincia</label>
                                    <input name="provincia" value={form.provincia} onChange={handleChange} placeholder="Buenos Aires" style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = G1} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Servicios que ofrecen</label>
                                <input name="servicios" value={form.servicios} onChange={handleChange} placeholder="Ej: Cirugía, urgencias 24hs, peluquería..." style={inputStyle}
                                    onFocus={e => e.target.style.borderColor = G1} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                            </div>
                            <div>
                                <label style={labelStyle}>Mensaje adicional</label>
                                <textarea name="mensaje" value={form.mensaje} onChange={handleChange} rows={3} placeholder="Contanos algo más sobre tu clínica..."
                                    style={{ ...inputStyle, resize: 'vertical' }}
                                    onFocus={e => e.target.style.borderColor = G1} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                            </div>
                            <button type="submit" disabled={enviando} style={{
                                background: enviando ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${G1}, ${O1})`,
                                color: '#fff', fontWeight: 800, fontSize: 15, padding: '14px', borderRadius: 12,
                                border: 'none', cursor: enviando ? 'not-allowed' : 'pointer',
                                fontFamily: FONT, boxShadow: enviando ? 'none' : `0 6px 24px rgba(76,175,80,0.3)`,
                            }}>
                                {enviando ? 'Enviando...' : '🏥 Quiero sumar mi veterinaria'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}
