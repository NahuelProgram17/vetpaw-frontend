import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  addCommunityComment,
  deleteCommunityComment,
  deleteCommunityPost,
  getCommunityComments,
  toggleBlockedCommunityUser,
  toggleCommunityReaction,
  toggleProfileFollow,
  toggleSavedCommunityPost,
} from '../../services/api'
import ReportModal from './ReportModal'

const typeMeta = {
  birthday: ['birthday', '🎂 Cumpleaños'],
  lost: ['lost', '🚨 Perdidos y encontrados'],
  clinic: ['clinic', '✅ Veterinaria'],
  business: ['business', '🛍️ Negocio de mascotas'],
  shelter: ['shelter', '🏠 Refugio o rescatista'],
  adoption: ['', '🏡 Adopción'],
}

const relativeTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return 'recién'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days} d`
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

const fallbackAvatar = (actor) => actor?.type === 'clinic' ? '🏥' : actor?.type === 'business' ? '🛍️' : actor?.type === 'shelter' ? '🏠' : actor?.type === 'lost' ? '🔎' : '🐾'


const renderTextWithHashtags = (value, onHashtagClick) => {
  if (!value) return null
  const pieces = value.split(/(#[\p{L}\p{N}_-]{2,50})/gu)
  return pieces.map((piece, index) => {
    if (!piece.startsWith('#')) return piece
    const tag = piece.slice(1)
    return (
      <button
        type="button"
        className="post-hashtag"
        key={`${piece}-${index}`}
        onClick={() => onHashtagClick?.(tag)}
      >
        {piece}
      </button>
    )
  })
}

export default function PostCard({ initialPost, user, targetCommentId, onDeleted, onChanged, onHashtagClick }) {
  const navigate = useNavigate()
  const [post, setPost] = useState(initialPost)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState(initialPost.comments_preview || [])
  const [comment, setComment] = useState('')
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentSaving, setCommentSaving] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [reportTarget, setReportTarget] = useState(null)
  const [highlightedCommentId, setHighlightedCommentId] = useState(null)
  const focusedCommentRef = useRef(null)
  const actor = post.actor || {}

  useEffect(() => {
    if (!targetCommentId) return undefined

    let cancelled = false
    focusedCommentRef.current = null
    setCommentsOpen(true)
    setCommentsLoading(true)

    getCommunityComments(post.id)
      .then((rows) => {
        if (!cancelled) setComments(Array.isArray(rows) ? rows : [])
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setCommentsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [post.id, targetCommentId])

  useEffect(() => {
    const normalizedTarget = String(targetCommentId || '')
    if (!normalizedTarget || commentsLoading || focusedCommentRef.current === normalizedTarget) return undefined
    if (!comments.some((item) => String(item.id) === normalizedTarget)) return undefined

    const focusTimer = window.setTimeout(() => {
      const element = document.getElementById(`comment-${normalizedTarget}`)
      if (!element) return
      focusedCommentRef.current = normalizedTarget
      setHighlightedCommentId(normalizedTarget)
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 220)

    const clearTimer = window.setTimeout(() => {
      setHighlightedCommentId((current) => current === normalizedTarget ? null : current)
    }, 3800)

    return () => {
      window.clearTimeout(focusTimer)
      window.clearTimeout(clearTimer)
    }
  }, [comments, commentsLoading, targetCommentId])

  const requireLogin = () => {
    if (!user) { navigate('/login'); return false }
    return true
  }

  const react = async () => {
    if (!requireLogin()) return
    const old = post
    setPost((p) => ({ ...p, reacted_by_me: !p.reacted_by_me, reactions_count: p.reactions_count + (p.reacted_by_me ? -1 : 1) }))
    try {
      const data = await toggleCommunityReaction(post.id)
      setPost((p) => ({ ...p, reacted_by_me: data.reacted, reactions_count: data.reactions_count }))
    } catch { setPost(old) }
  }

  const save = async () => {
    if (!requireLogin()) return
    const old = post.saved_by_me
    setPost((p) => ({ ...p, saved_by_me: !old }))
    try {
      const data = await toggleSavedCommunityPost(post.id)
      setPost((p) => ({ ...p, saved_by_me: data.saved }))
    } catch { setPost((p) => ({ ...p, saved_by_me: old })) }
  }

  const follow = async () => {
    const followable = ['pet', 'clinic', 'business', 'shelter'].includes(actor.type)
    if (!requireLogin() || !followable) return
    const old = post.following_actor
    setPost((p) => ({ ...p, following_actor: !old }))
    try {
      const data = await toggleProfileFollow(actor.type, actor.identifier || actor.id)
      setPost((p) => ({ ...p, following_actor: data.following }))
      onChanged?.()
    } catch { setPost((p) => ({ ...p, following_actor: old })) }
  }

  const openComments = async () => {
    const next = !commentsOpen
    setCommentsOpen(next)
    if (next && post.comments_count > comments.length) {
      setCommentsLoading(true)
      try { setComments(await getCommunityComments(post.id)) } finally { setCommentsLoading(false) }
    }
  }

  const addComment = async (e) => {
    e.preventDefault()
    if (!requireLogin() || !comment.trim()) return
    setCommentSaving(true)
    try {
      const created = await addCommunityComment(post.id, comment.trim())
      setComments((rows) => [...rows, created])
      setPost((p) => ({ ...p, comments_count: p.comments_count + 1 }))
      setComment('')
      setCommentsOpen(true)
    } finally { setCommentSaving(false) }
  }

  const removeComment = async (id) => {
    if (!window.confirm('¿Eliminar este comentario?')) return
    await deleteCommunityComment(id)
    setComments((rows) => rows.filter((item) => item.id !== id))
    setPost((p) => ({ ...p, comments_count: Math.max(0, p.comments_count - 1) }))
  }

  const removePost = async () => {
    setMenuOpen(false)
    if (!window.confirm('¿Eliminar esta publicación?')) return
    await deleteCommunityPost(post.id)
    onDeleted?.(post.id)
  }

  const blockUser = async () => {
    setMenuOpen(false)
    if (!actor.owner_user_id || !window.confirm(`¿Bloquear a ${actor.name}? Ya no verás su contenido.`)) return
    await toggleBlockedCommunityUser(actor.owner_user_id)
    onDeleted?.(post.id, true, actor.owner_user_id)
  }

  const share = async () => {
    const url = `${window.location.origin}/comunidad?publicacion=${post.id}`
    const data = { title: `${actor.name} en VetPaw`, text: post.text || 'Mirá esta publicación de VetPaw', url }
    try {
      if (navigator.share) await navigator.share(data)
      else { await navigator.clipboard.writeText(url); alert('Enlace copiado.') }
    } catch { /* cancelado */ }
  }

  const badge = typeMeta[post.post_type]

  return (
    <article className="post-card community-card" id={`post-${post.id}`}>
      <div className="post-head">
        {actor.photo ? <img className="post-avatar" src={actor.photo} alt={actor.name} /> : <div className="post-avatar">{fallbackAvatar(actor)}</div>}
        <div className="post-author">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <Link to={actor.profile_url || '#'}>{actor.name || 'VetPaw'}</Link>
            {actor.verified && <span title="Perfil verificado" style={{ color: '#5ecfff', fontSize: 12 }}>●</span>}
            {['pet', 'clinic', 'business', 'shelter'].includes(actor.type) && user && actor.owner_user_id !== user.id && (
              <button type="button" className={`mini-follow ${post.following_actor ? 'following' : ''}`} onClick={follow}>{post.following_actor ? 'Siguiendo' : 'Seguir'}</button>
            )}
          </div>
          <div className="post-meta">{actor.subtitle}{post.locality ? `${actor.subtitle ? ' · ' : ''}${post.locality}` : ''} · {relativeTime(post.created_at)}</div>
        </div>
        <div className="post-menu">
          <button className="post-menu-button" onClick={() => setMenuOpen((v) => !v)}>⋯</button>
          {menuOpen && (
            <div className="post-menu-panel">
              <button onClick={() => { setMenuOpen(false); share() }}>↗ Compartir</button>
              {user && !post.can_delete && <button onClick={() => { setMenuOpen(false); setReportTarget({ post: post.id }) }}>⚑ Reportar publicación</button>}
              {user && !post.can_delete && actor.owner_user_id && <button onClick={blockUser}>⊘ Bloquear usuario</button>}
              {post.can_delete && <button className="danger" onClick={removePost}>🗑 Eliminar publicación</button>}
            </div>
          )}
        </div>
      </div>

      <div className="post-copy">
        {badge && <div><span className={`post-type-badge ${badge[0]}`}>{badge[1]}</span></div>}
        {renderTextWithHashtags(post.text, onHashtagClick)}
      </div>

      {post.lost_pet && (
        <div className="lost-info">
          <strong>{post.lost_pet.report_type_display}: {post.lost_pet.pet_name || 'Mascota'}</strong>
          <span>📍 {post.lost_pet.locality || 'Sin localidad'}, {post.lost_pet.province || 'Argentina'}</span>
          {post.lost_pet.incident_date && <span>📅 Fecha: {new Date(`${post.lost_pet.incident_date}T12:00:00`).toLocaleDateString('es-AR')}</span>}
          <span>☎ {post.lost_pet.contact_value}</span>
          <Link to="/mascotas-perdidas" style={{ color: '#ffb3a8', fontWeight: 800, marginTop: 3 }}>Ver aviso completo →</Link>
        </div>
      )}

      {post.image_url && <div className="post-image-wrap"><img className="post-image" src={post.image_url} alt={`Publicación de ${actor.name}`} loading="lazy" /></div>}

      <div className="post-stats"><span>🐾 {post.reactions_count} patitas</span><span>{post.comments_count} comentarios</span></div>
      <div className="post-actions">
        <button className={`post-action ${post.reacted_by_me ? 'active' : ''}`} onClick={react}><span>🐾</span> {post.reacted_by_me ? 'Te gusta' : 'Patita'}</button>
        <button className="post-action" onClick={openComments}><span>💬</span> Comentar</button>
        <button className="post-action" onClick={share}><span>↗</span> Compartir</button>
        <button className={`post-action ${post.saved_by_me ? 'active' : ''}`} onClick={save}><span>🔖</span> {post.saved_by_me ? 'Guardado' : 'Guardar'}</button>
      </div>

      {(commentsOpen || comments.length > 0) && (
        <div className="comments-area">
          {commentsLoading && <div className="composer-sub">Cargando comentarios...</div>}
          {comments.map((item) => (
            <div
              id={`comment-${item.id}`}
              className={`comment-item ${String(item.id) === highlightedCommentId ? 'comment-target-highlight' : ''}`}
              key={item.id}
            >
              {item.author.avatar ? <img className="comment-avatar" src={item.author.avatar} alt="" /> : <div className="comment-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>}
              <div className="comment-bubble"><strong>{item.author.display_name}</strong>{item.text}</div>
              {item.can_delete ? <button className="comment-delete" onClick={() => removeComment(item.id)}>✕</button> : user ? <button className="comment-delete" onClick={() => setReportTarget({ comment: item.id })}>⚑</button> : null}
            </div>
          ))}
          <form className="comment-form" onSubmit={addComment}>
            <input className="community-input" value={comment} onChange={(e) => setComment(e.target.value)} placeholder={user ? 'Escribí un comentario...' : 'Iniciá sesión para comentar'} disabled={!user || commentSaving} maxLength={1000} />
            <button className="community-button" disabled={!user || commentSaving || !comment.trim()}>{commentSaving ? '...' : 'Enviar'}</button>
          </form>
        </div>
      )}
      {reportTarget && <ReportModal target={reportTarget} onClose={() => setReportTarget(null)} />}
    </article>
  )
}
