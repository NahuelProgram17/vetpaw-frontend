import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif"
const G1 = '#4CAF50'
const O1 = '#FF9800'

export default function AnunciarVetPaw() {
    const [form, setForm] = useState({ empresa: '', nombre: '', email: '', telefono: '', producto: '', presupuesto: '', mensaje: '' })
    const [enviando, setEnviando] = useState(false)
    const [enviado, setEnviado] = useState(false)
    const [error, setError] = useState('')

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (!form.empresa || !form.email || !form.producto) {
            setError('Por favor completá los campos obligatorios.')
            return
        }
        setEnviando(true)
        try {
            await api.post('/contact/anunciante/', form)
            setEnviado(true)
        } catch (e) {
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
                    Anunciar en VetPaw
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, maxWidth: 520, margin: '0 auto' }}>
                    Llegá a miles de dueños de mascotas que buscan lo mejor para sus animales. Audiencia 100% target.
                </p>
            </div>

            <div style={{ maxWidth: 780, margin: '0 auto', padding: 'clamp(28px, 6vw, 48px) clamp(14px, 5vw, 40px) clamp(48px, 8vw, 80px)' }}>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 40 }}>
                    {[
                        { n: '+5.000', l: 'Usuarios activos', c: G1 },
                        { n: '+200', l: 'Veterinarias', c: O1 },
                        { n: '100%', l: 'Audiencia target', c: G1 },
                        { n: 'ARG', l: 'Mercado local', c: O1 },
                    ].map((s, i) => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px', textAlign: 'center' }}>
                            <div style={{ fontSize: 22, fontWeight: 900, color: s.c, marginBottom: 4 }}>{s.n}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{s.l}</div>
                        </div>
                    ))}
                </div>

                {/* Formatos */}
                <div style={{ background: 'rgba(255,152,0,0.06)', border: '1px solid rgba(255,152,0,0.15)', borderRadius: 14, padding: '20px 24px', marginBottom: 32 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: O1, marginBottom: 12 }}>📣 Formatos disponibles</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {['Banner en Home', 'Destacado en listado de veterinarias', 'Email a usuarios', 'Contenido patrocinado'].map((f, i) => (
                            <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: O1 }}>✓</span> {f}
                            </div>
                        ))}
                    </div>
                </div>

                {enviado ? (
                    <div style={{ background: 'rgba(76,175,80,0.1)', border: '1.5px solid rgba(76,175,80,0.3)', borderRadius: 20, padding: '48px', textAlign: 'center' }}>
                        <div style={{ fontSize: 56, marginBottom: 16 }}>📣</div>
                        <h3 style={{ fontSize: 22, fontWeight: 900, color: G1, marginBottom: 10 }}>¡Solicitud recibida!</h3>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, marginBottom: 24 }}>Nos contactaremos con vos en las próximas 48hs para enviarte una propuesta personalizada.</p>
                        <Link to="/" style={{ background: `linear-gradient(135deg, ${G1}, ${O1})`, color: '#fff', fontWeight: 800, fontSize: 14, padding: '12px 28px', borderRadius: 12, textDecoration: 'none' }}>
                            Volver al inicio
                        </Link>
                    </div>
                ) : (
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '36px' }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>Contanos sobre tu marca</h2>

                        {error && (
                            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#f87171', fontSize: 14 }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={labelStyle}>Empresa/Marca *</label>
                                    <input name="empresa" value={form.empresa} onChange={handleChange} placeholder="Ej: PipetaPlus" style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = G1} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Nombre de contacto</label>
                                    <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Tu nombre" style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = G1} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={labelStyle}>Email *</label>
                                    <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="contacto@empresa.com" style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = G1} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Teléfono</label>
                                    <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="11 1234-5678" style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = G1} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Producto/Servicio a anunciar *</label>
                                <input name="producto" value={form.producto} onChange={handleChange} placeholder="Ej: Antiparasitario para perros y gatos" style={inputStyle}
                                    onFocus={e => e.target.style.borderColor = G1} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                            </div>
                            <div>
                                <label style={labelStyle}>Presupuesto estimado mensual</label>
                                <select name="presupuesto" value={form.presupuesto} onChange={handleChange}
                                    style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}>
                                    <option value="" style={{ background: '#0f1923' }}>— Seleccioná un rango —</option>
                                    <option value="menos-50k" style={{ background: '#0f1923' }}>Menos de $50.000</option>
                                    <option value="50k-100k" style={{ background: '#0f1923' }}>$50.000 - $100.000</option>
                                    <option value="100k-300k" style={{ background: '#0f1923' }}>$100.000 - $300.000</option>
                                    <option value="mas-300k" style={{ background: '#0f1923' }}>Más de $300.000</option>
                                    <option value="a-definir" style={{ background: '#0f1923' }}>A definir</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Mensaje adicional</label>
                                <textarea name="mensaje" value={form.mensaje} onChange={handleChange} rows={3} placeholder="Contanos más sobre tu campaña..."
                                    style={{ ...inputStyle, resize: 'vertical' }}
                                    onFocus={e => e.target.style.borderColor = G1} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                            </div>
                            <button type="submit" disabled={enviando} style={{
                                background: enviando ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${G1}, ${O1})`,
                                color: '#fff', fontWeight: 800, fontSize: 15, padding: '14px', borderRadius: 12,
                                border: 'none', cursor: enviando ? 'not-allowed' : 'pointer',
                                fontFamily: FONT, boxShadow: enviando ? 'none' : `0 6px 24px rgba(76,175,80,0.3)`,
                            }}>
                                {enviando ? 'Enviando...' : '📣 Quiero anunciar en VetPaw'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}
