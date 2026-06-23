import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPostBySlug } from '../services/api'
import Markdown from '../components/Markdown'

const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif"
const G1 = '#4CAF50'
const O1 = '#FF9800'

export default function BlogPost() {
    const { slug } = useParams()
    const [post, setPost] = useState(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        setLoading(true)
        setNotFound(false)
        getPostBySlug(slug)
            .then(data => {
                setPost(data)
                if (data && data.title) document.title = `${data.title} — Blog VetPaw`
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false))
    }, [slug])

    const fmt = (d) => d ? new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

    return (
        <div style={{ minHeight: '100vh', background: '#0f1923', fontFamily: FONT, color: '#fff' }}>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

            <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px 80px' }}>
                <Link to="/blog" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textDecoration: 'none', display: 'inline-block', marginBottom: 28 }}>← Volver al blog</Link>

                {loading ? (
                    <p style={{ color: 'rgba(255,255,255,0.4)' }}>Cargando...</p>
                ) : notFound || !post ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div style={{ fontSize: 60, marginBottom: 16 }}>🔍</div>
                        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>No encontramos esta nota</h1>
                        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>Puede que se haya movido o despublicado.</p>
                        <Link to="/blog" style={{ background: `linear-gradient(135deg, ${G1}, ${O1})`, color: '#fff', fontWeight: 800, fontSize: 14, padding: '12px 24px', borderRadius: 12, textDecoration: 'none' }}>
                            Ver todas las notas
                        </Link>
                    </div>
                ) : (
                    <article>
                        {post.cover_url && (
                            <img src={post.cover_url} alt={post.title} style={{ width: '100%', borderRadius: 18, marginBottom: 28, display: 'block' }} />
                        )}
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>{fmt(post.created_at)}</p>
                        <h1 style={{ fontSize: 34, fontWeight: 900, lineHeight: 1.2, marginBottom: 24 }}>{post.title}</h1>

                        <Markdown text={post.content} />

                        {/* CTA al final */}
                        <div style={{ marginTop: 40, padding: '24px', background: 'linear-gradient(135deg, rgba(76,175,80,0.1), rgba(255,152,0,0.1))', border: '1px solid rgba(76,175,80,0.25)', borderRadius: 16, textAlign: 'center' }}>
                            <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>🐾 Cuidá a tu mascota con VetPaw</p>
                            <Link to="/register" style={{ background: `linear-gradient(135deg, ${G1}, ${O1})`, color: '#fff', fontWeight: 800, fontSize: 14, padding: '12px 26px', borderRadius: 12, textDecoration: 'none', display: 'inline-block' }}>
                                Crear mi cuenta gratis
                            </Link>
                        </div>
                    </article>
                )}
            </div>
        </div>
    )
}
