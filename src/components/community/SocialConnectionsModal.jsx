import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProfileConnections } from '../../services/api'

const fallback = (type) => type === 'clinic' ? '🏥' : type === 'business' ? '🛍️' : type === 'shelter' ? '🏠' : type === 'user' ? '👤' : '🐾'

export default function SocialConnectionsModal({ open, onClose, profileType, identifier, initialKind = 'followers', profileName = '' }) {
  const [kind, setKind] = useState(initialKind)
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(1)
  const [next, setNext] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return undefined
    setKind(initialKind)
    setRows([])
    setPage(1)
    setNext(null)
    setError('')
    const onKey = (event) => { if (event.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, initialKind, onClose])

  useEffect(() => {
    if (!open || !profileType || !identifier) return undefined
    let active = true
    setLoading(true)
    setError('')
    getProfileConnections(profileType, identifier, kind, page)
      .then((data) => {
        if (!active) return
        setRows((current) => page === 1 ? data.results || [] : [...current, ...(data.results || [])])
        setNext(data.next)
      })
      .catch(() => active && setError('No pudimos cargar esta lista.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [open, profileType, identifier, kind, page])

  if (!open) return null

  const changeKind = (value) => {
    if (value === kind) return
    setKind(value)
    setRows([])
    setPage(1)
    setNext(null)
  }

  return (
    <div className="social-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.() }}>
      <section className="social-modal" role="dialog" aria-modal="true" aria-label={`Conexiones de ${profileName}`}>
        <header className="social-modal-head">
          <div><h2>{profileName}</h2><p>Perfiles conectados dentro de VetPaw</p></div>
          <button type="button" onClick={onClose} aria-label="Cerrar">✕</button>
        </header>
        <div className="social-modal-tabs">
          <button type="button" className={kind === 'followers' ? 'active' : ''} onClick={() => changeKind('followers')}>Seguidores</button>
          <button type="button" className={kind === 'following' ? 'active' : ''} onClick={() => changeKind('following')}>Siguiendo</button>
        </div>
        <div className="social-connection-list">
          {rows.map((item) => {
            const content = (
              <>
                {item.photo ? <img src={item.photo} alt="" loading="lazy" decoding="async" /> : <span className="social-connection-avatar">{fallback(item.type)}</span>}
                <span className="social-connection-copy"><strong>{item.name}</strong><small>{item.subtitle || 'Perfil de VetPaw'}</small></span>
                {item.verified && <span className="social-verified" title="Perfil verificado">✓</span>}
              </>
            )
            return item.profile_url
              ? <Link to={item.profile_url} onClick={onClose} className="social-connection-row" key={`${item.type}-${item.id}`}>{content}</Link>
              : <div className="social-connection-row" key={`${item.type}-${item.id}`}>{content}</div>
          })}
          {!loading && !rows.length && !error && <div className="social-modal-empty">Todavía no hay perfiles para mostrar.</div>}
          {error && <div className="social-modal-empty error">{error}</div>}
          {loading && <div className="social-modal-empty">Cargando...</div>}
        </div>
        {next && !loading && <button type="button" className="social-load-more" onClick={() => setPage(next)}>Ver más</button>}
      </section>
    </div>
  )
}
