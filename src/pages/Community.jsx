import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getCommunityDiscover, getCommunityPost, getCommunityPosts } from '../services/api'
import PostComposer from '../components/community/PostComposer'
import PostCard from '../components/community/PostCard'
import CommunityRightRail from '../components/community/CommunityRightRail'
import communityHeroPets from '../assets/community/community-hero-pets.webp'
import './Community.css'
import { canModerateCommunity } from '../utils/permissions'

const FILTERS = [
  ['all', '✨ Para vos'],
  ['following', '🐾 Siguiendo'],
  ['birthday', '🎂 Cumpleaños'],
  ['lost', '🚨 Perdidos'],
  ['clinic', '🏥 Veterinarias'],
  ['business', '🛍️ Negocios'],
  ['shelter', '🏠 Refugios'],
  ['saved', '🔖 Guardados'],
]

export default function Community() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const searchParams = new URLSearchParams(location.search)
  const defaultPetId = searchParams.get('mascota')
  const targetPostId = searchParams.get('publicacion')
  const targetCommentId = searchParams.get('comentario')
  const hashtag = (searchParams.get('hashtag') || '').replace(/^#/, '').trim()
  const [posts, setPosts] = useState([])
  const [discover, setDiscover] = useState({ suggested_pets: [], clinics: [], businesses: [], shelters: [], lost_pets: [], birthdays: [] })
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [moreLoading, setMoreLoading] = useState(false)
  const [error, setError] = useState('')

  const paramsFor = useCallback((selected, selectedPage = 1) => {
    const params = { page: selectedPage }
    if (hashtag) params.hashtag = hashtag
    if (selected === 'following' || selected === 'saved') params.feed = selected
    else if (selected !== 'all') params.type = selected
    return params
  }, [hashtag])

  const fetchFeed = useCallback(async (selected, selectedPage = 1, append = false) => {
    append ? setMoreLoading(true) : setLoading(true)
    setError('')
    try {
      const data = await getCommunityPosts(paramsFor(selected, selectedPage))
      const rows = data.results ?? data
      let nextRows = Array.isArray(rows) ? rows : []

      if (!append && targetPostId && !nextRows.some((post) => String(post.id) === String(targetPostId))) {
        try {
          const targetPost = await getCommunityPost(targetPostId)
          nextRows = [targetPost, ...nextRows]
        } catch {
          // Si la publicación ya no existe o no es visible, mantenemos el muro normal.
        }
      }

      setPosts((current) => append ? [...current, ...nextRows] : nextRows)
      setHasMore(Boolean(data.next))
      setPage(selectedPage)
    } catch (e) {
      setError(e.response?.data?.detail || 'No pudimos cargar la comunidad. Intentá nuevamente.')
    } finally {
      setLoading(false)
      setMoreLoading(false)
    }
  }, [paramsFor, targetPostId])

  const fetchDiscover = useCallback(async () => {
    try { setDiscover(await getCommunityDiscover()) } catch { /* la columna lateral no bloquea el muro */ }
  }, [])

  useEffect(() => {
    fetchFeed(filter, 1, false)
  }, [filter, fetchFeed])
  useEffect(() => {
    fetchDiscover()
  }, [user, fetchDiscover])

  useEffect(() => {
    if (!targetPostId || targetCommentId || loading) return undefined
    const timer = window.setTimeout(() => {
      document.getElementById(`post-${targetPostId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 180)
    return () => window.clearTimeout(timer)
  }, [loading, posts, targetCommentId, targetPostId])

  const openHashtag = (tag) => {
    const clean = String(tag || '').replace(/^#/, '').trim()
    if (!clean) return
    navigate(`/comunidad?hashtag=${encodeURIComponent(clean)}`)
  }

  const clearHashtag = () => navigate('/comunidad')

  const changeFilter = (value) => {
    if (!user && ['following', 'saved'].includes(value)) return
    setFilter(value)
  }

  const removePost = (id, blocked = false, blockedUserId = null) => {
    setPosts((rows) => blocked && blockedUserId
      ? rows.filter((post) => post.actor?.owner_user_id !== blockedUserId)
      : rows.filter((post) => post.id !== id))
    if (blocked) fetchDiscover()
  }

  return (
    <main className="community-page">
      <div className="community-shell">
        <section className="community-center">
          <div className="community-hero community-card">
            <div className="community-hero-visual" aria-hidden="true">
              <img src={communityHeroPets} alt="" />
            </div>
            <div className="community-hero-copy">
              <div className="community-kicker"><span>🐾</span> VetPaw Comunidad</div>
              <h1>La red social donde <span className="hero-green">cada</span> <span className="hero-orange">mascota</span> tiene su historia.</h1>
              <p>Compartí aventuras, dejá patitas, conocé otras mascotas y conectate con veterinarias. Los datos médicos y privados siguen siempre separados y protegidos.</p>
              <div className="community-hero-chips">
                <span>🛡️ Segura y privada</span>
                <span>🐾 Comunidad de mascotas</span>
              </div>
            </div>
          </div>

          <PostComposer user={user} defaultPetId={defaultPetId} onCreated={(created) => { setPosts((rows) => [created, ...rows]); fetchDiscover() }} />

          {hashtag && (
            <div className="hashtag-filter-banner community-card">
              <div><span>Viendo publicaciones con</span><strong>#{hashtag}</strong></div>
              <button type="button" onClick={clearHashtag}>Ver todo ✕</button>
            </div>
          )}

          <div className="community-toolbar community-card">
            {FILTERS.map(([value, label]) => (
              <button key={value} className={`filter-pill ${filter === value ? 'active' : ''}`} onClick={() => changeFilter(value)} title={!user && ['following', 'saved'].includes(value) ? 'Iniciá sesión para usar este filtro' : ''}>{label}</button>
            ))}
            {canModerateCommunity(user) && (
              <Link className="filter-pill moderation-shortcut" to="/comunidad/moderacion">🛡️ Moderación</Link>
            )}
          </div>

          {error && <div className="community-error">{error}</div>}
          {loading ? (
            <div className="empty-feed community-card"><div className="icon">🐾</div><h3>Cargando la comunidad...</h3><p>Estamos reuniendo las últimas historias.</p></div>
          ) : posts.length ? (
            posts.map((post) => (
              <PostCard
                key={post.id}
                initialPost={post}
                user={user}
                targetCommentId={String(post.id) === String(targetPostId) ? targetCommentId : null}
                onDeleted={removePost}
                onChanged={fetchDiscover}
                onHashtagClick={openHashtag}
              />
            ))
          ) : (
            <div className="empty-feed community-card"><div className="icon">🐶</div><h3>Todavía no hay publicaciones acá</h3><p>{filter === 'following' ? 'Seguí mascotas para armar tu muro personalizado.' : filter === 'saved' ? 'Guardá publicaciones para encontrarlas fácilmente.' : 'Sé el primero en compartir algo con la comunidad VetPaw.'}</p></div>
          )}

          {hasMore && <div className="load-more-wrap"><button className="community-button-secondary" disabled={moreLoading} onClick={() => fetchFeed(filter, page + 1, true)}>{moreLoading ? 'Cargando...' : 'Ver más publicaciones'}</button></div>}
        </section>

        <CommunityRightRail discover={discover} user={user} onRefresh={fetchDiscover} />
      </div>
    </main>
  )
}
