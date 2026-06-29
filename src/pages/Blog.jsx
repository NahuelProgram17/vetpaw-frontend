import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPublishedPosts } from '../services/api'

const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif"
const G1 = '#4CAF50'
const O1 = '#FF9800'

export default function Blog() {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getPublishedPosts()
            .then(data => setPosts(Array.isArray(data) ? data : (data.results || [])))
            .catch(e => console.error('Error cargando notas', e))
            .finally(() => setLoading(false))
    }, [])

    const fmt = (d) => d ? new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

    return (
        <div style={{ minHeight: '100vh', background: '#0f1923', fontFamily: FONT, color: '#fff' }}>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #0a1520, #162032)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(28px, 6vw, 48px) clamp(14px, 5vw, 40px) clamp(28px, 5vw, 40px)', textAlign: 'center' }}>
                <Link to="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>← Volver al inicio</Link>
                <div style={{ marginBottom: 16 }}>
                    <img src="/logo_vetpaw.png" alt="VetPaw" style={{ height: 80, width: 'auto' }} />
                </div>
                <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12, background: `linear-gradient(135deg, ${G1}, ${O1})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Blog VetPaw
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>Guías y consejos para cuidar mejor a tu mascota.</p>
            </div>

            {/* Contenido */}
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px 80px' }}>
                {loading ? (
                    <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Cargando notas...</p>
                ) : posts.length === 0 ? (
                    // Respaldo: si no hay notas publicadas, mostramos el "Próximamente"
                    <div style={{ textAlign: 'center', maxWidth: 480, margin: '40px auto' }}>
                        <div style={{ fontSize: 80, marginBottom: 24 }}>📝</div>
                        <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>¡Próximamente!</h2>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
                            Estamos preparando artículos, guías y consejos sobre el cuidado de tus mascotas. Volvé pronto.
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link to="/tips" style={{ background: `linear-gradient(135deg, ${G1}, ${O1})`, color: '#fff', fontWeight: 800, fontSize: 14, padding: '12px 24px', borderRadius: 12, textDecoration: 'none' }}>
                                Ver Tips & Curiosidades
                            </Link>
                            <Link to="/" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px 24px', borderRadius: 12, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.15)' }}>
                                Volver al inicio
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                        {posts.map(p => (
                            <Link key={p.id} to={`/blog/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <article style={{ background: '#162032', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform .2s, border-color .2s' }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(76,175,80,0.4)' }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}>
                                    {p.cover_url && (
                                        <div style={{ height: 170, overflow: 'hidden' }}>
                                            <img src={p.cover_url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    )}
                                    <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, lineHeight: 1.35 }}>{p.title}</h2>
                                        {p.excerpt && <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 14, flex: 1 }}>{p.excerpt}</p>}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{fmt(p.created_at)}</span>
                                            <span style={{ fontSize: 13, fontWeight: 800, color: G1 }}>Leer →</span>
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
