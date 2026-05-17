import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif"
const G1 = '#4CAF50'
const O1 = '#FF9800'

export default function Contacto() {
    const [form, setForm] = useState({ nombre: '', email: '', asunto: '', mensaje: '' })
    const [enviando, setEnviando] = useState(false)
    const [enviado, setEnviado] = useState(false)
    const [error, setError] = useState('')

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (!form.nombre || !form.email || !form.mensaje) {
            setError('Por favor completá todos los campos obligatorios.')
            return
        }
        setEnviando(true)
        try {
            await api.post('/contact/', form)
            setEnviado(true)
        } catch (e) {
            setError('Hubo un error al enviar el mensaje. Intentá de nuevo o escribinos directamente a vetpawapp@gmail.com')
        } finally {
            setEnviando(false)
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: '#0f1923', fontFamily: FONT, color: '#fff' }}>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

            <div style={{ background: 'linear-gradient(135deg, #0a1520, #162032)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '48px 40px 40px', textAlign: 'center' }}>
                <Link to="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>← Volver al inicio</Link>
                <div style={{ marginBottom: 16 }}>
                    <img src="/logo_vetpaw.png" alt="VetPaw" style={{ height: 80, width: 'auto' }} />
                </div>
                <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12, background: `linear-gradient(135deg, ${G1}, ${O1})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Contacto
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, maxWidth: 480, margin: '0 auto' }}>
                    ¿Tenés alguna consulta, sugerencia o problema? Escribinos y te respondemos a la brevedad.
                </p>
            </div>

            <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 40px 80px' }}>

                {/* Info de contacto */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 40 }}>
                    {[
                        { icon: '✉️', label: 'Email', value: 'vetpawapp@gmail.com' },
                        { icon: '📍', label: 'País', value: 'Argentina' },
                        { icon: '⏱️', label: 'Respuesta', value: 'En 24-48hs hábiles' },
                    ].map((item, i) => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px', textAlign: 'center' }}>
                            <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{item.label}</div>
                            <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{item.value}</div>
                        </div>
                    ))}
                </div>

                {enviado ? (
                    <div style={{ background: 'rgba(76,175,80,0.1)', border: '1.5px solid rgba(76,175,80,0.3)', borderRadius: 20, padding: '48px', textAlign: 'center' }}>
                        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
                        <h3 style={{ fontSize: 22, fontWeight: 900, color: G1, marginBottom: 10 }}>¡Mensaje enviado!</h3>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, marginBottom: 24 }}>Gracias por contactarnos. Te responderemos a la brevedad en {form.email}.</p>
                        <Link to="/" style={{ background: `linear-gradient(135deg, ${G1}, ${O1})`, color: '#fff', fontWeight: 800, fontSize: 14, padding: '12px 28px', borderRadius: 12, textDecoration: 'none' }}>
                            Volver al inicio
                        </Link>
                    </div>
                ) : (
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '36px' }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>Envianos un mensaje</h2>

                        {error && (
                            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#f87171', fontSize: 14 }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Nombre *</label>
                                    <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Tu nombre"
                                        style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 14, fontFamily: FONT, outline: 'none', boxSizing: 'border-box' }}
                                        onFocus={e => e.target.style.borderColor = G1}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Email *</label>
                                    <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="tu@email.com"
                                        style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 14, fontFamily: FONT, outline: 'none', boxSizing: 'border-box' }}
                                        onFocus={e => e.target.style.borderColor = G1}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Asunto</label>
                                <input name="asunto" value={form.asunto} onChange={handleChange} placeholder="¿En qué podemos ayudarte?"
                                    style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 14, fontFamily: FONT, outline: 'none', boxSizing: 'border-box' }}
                                    onFocus={e => e.target.style.borderColor = G1}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Mensaje *</label>
                                <textarea name="mensaje" value={form.mensaje} onChange={handleChange} rows={5} placeholder="Escribí tu mensaje..."
                                    style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 14, fontFamily: FONT, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                                    onFocus={e => e.target.style.borderColor = G1}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                            </div>
                            <button type="submit" disabled={enviando} style={{
                                background: enviando ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${G1}, ${O1})`,
                                color: '#fff', fontWeight: 800, fontSize: 15, padding: '14px', borderRadius: 12,
                                border: 'none', cursor: enviando ? 'not-allowed' : 'pointer',
                                fontFamily: FONT, boxShadow: enviando ? 'none' : `0 6px 24px rgba(76,175,80,0.3)`,
                            }}>
                                {enviando ? 'Enviando...' : '✉️ Enviar mensaje'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}
