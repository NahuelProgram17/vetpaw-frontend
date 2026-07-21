import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main style={{
      minHeight: 'calc(100vh - 68px)',
      display: 'grid',
      placeItems: 'center',
      padding: '32px 20px',
      background: 'radial-gradient(circle at 20% 15%, rgba(76,175,80,.16), transparent 32%), radial-gradient(circle at 85% 75%, rgba(255,152,0,.14), transparent 30%), #07111d',
      color: '#fff',
      fontFamily: "'Plus Jakarta Sans', 'Nunito', sans-serif",
    }}>
      <section style={{
        width: 'min(620px, 100%)',
        textAlign: 'center',
        borderRadius: 28,
        padding: '48px 28px',
        background: 'rgba(12, 27, 43, .86)',
        border: '1px solid rgba(255,255,255,.09)',
        boxShadow: '0 26px 80px rgba(0,0,0,.35)',
      }}>
        <div aria-hidden="true" style={{ fontSize: 72, marginBottom: 12 }}>🐾</div>
        <p style={{ margin: 0, color: '#6edb74', fontWeight: 900, letterSpacing: 2 }}>ERROR 404</p>
        <h1 style={{ margin: '12px 0 10px', fontSize: 'clamp(2rem, 6vw, 3.5rem)', lineHeight: 1.05 }}>Esta página salió a pasear</h1>
        <p style={{ margin: '0 auto 26px', maxWidth: 480, color: 'rgba(255,255,255,.62)', fontSize: 17, lineHeight: 1.6 }}>
          El enlace no existe o cambió de lugar. Volvé a la comunidad para seguir viendo historias de mascotas.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/" style={{
            textDecoration: 'none', color: '#fff', fontWeight: 900, padding: '13px 22px', borderRadius: 13,
            background: 'linear-gradient(135deg, #4CAF50, #FF9800)',
          }}>Volver a Comunidad</Link>
          <Link to="/inicio-vetpaw" style={{
            textDecoration: 'none', color: 'rgba(255,255,255,.8)', fontWeight: 800, padding: '13px 22px', borderRadius: 13,
            border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.04)',
          }}>Conocer VetPaw</Link>
        </div>
      </section>
    </main>
  )
}
