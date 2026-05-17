import { Link } from 'react-router-dom'

const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif"
const G1 = '#4CAF50'
const O1 = '#FF9800'

export default function Blog() {
    return (
        <div style={{ minHeight: '100vh', background: '#0f1923', fontFamily: FONT, color: '#fff', display: 'flex', flexDirection: 'column' }}>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

            <div style={{ background: 'linear-gradient(135deg, #0a1520, #162032)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '48px 40px 40px', textAlign: 'center' }}>
                <Link to="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>← Volver al inicio</Link>
                <div style={{ marginBottom: 16 }}>
                    <img src="/logo_vetpaw.png" alt="VetPaw" style={{ height: 80, width: 'auto' }} />
                </div>
                <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12, background: `linear-gradient(135deg, ${G1}, ${O1})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Blog VetPaw
                </h1>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 40px' }}>
                <div style={{ textAlign: 'center', maxWidth: 480 }}>
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
            </div>
        </div>
    )
}
