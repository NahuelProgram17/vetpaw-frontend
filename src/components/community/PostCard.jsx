import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../../pages/ClinicCommunity.css'
import {
  addCommunityComment,
  deleteCommunityComment,
  deleteCommunityPost,
  getCommunityComments,
  hideCommunityComment,
  hideCommunityPost,
  registerCommunityShare,
  toggleBlockedCommunityUser,
  toggleMutedCommunityUser,
  toggleCommunityCommentReaction,
  toggleCommunityReaction,
  toggleProfileFollow,
  toggleSavedCommunityPost,
  updateCommunityComment,
  updateCommunityPost,
} from '../../services/api'
import MentionTextarea from './MentionTextarea'
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

const flattenComments = (rows) => rows.flatMap((item) => [item, ...(item.replies || [])])

const updateCommentTree = (rows, id, updater) => rows.map((item) => {
  if (String(item.id) === String(id)) return updater(item)
  const replies = (item.replies || []).map((reply) => String(reply.id) === String(id) ? updater(reply) : reply)
  return replies === item.replies ? item : { ...item, replies }
})

const findComment = (rows, id) => flattenComments(rows).find((item) => String(item.id) === String(id))

const renderRichText = (value, onHashtagClick, onMentionClick) => {
  if (!value) return null
  const pieces = value.split(/(#[\p{L}\p{N}_-]{2,50}|@[\w.+-]{3,150})/gu)
  return pieces.map((piece, index) => {
    if (piece.startsWith('#')) {
      return (
        <button type="button" className="post-hashtag" key={`${piece}-${index}`} onClick={() => onHashtagClick?.(piece.slice(1))}>
          {piece}
        </button>
      )
    }
    if (piece.startsWith('@')) {
      return (
        <button type="button" className="post-mention" key={`${piece}-${index}`} onClick={() => onMentionClick?.(piece.slice(1))}>
          {piece}
        </button>
      )
    }
    return piece
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
  const [editingPost, setEditingPost] = useState(false)
  const [editPostText, setEditPostText] = useState(initialPost.text || '')
  const [editPostPermission, setEditPostPermission] = useState(initialPost.comment_permission || 'everyone')
  const [postSaving, setPostSaving] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editCommentText, setEditCommentText] = useState('')
  const [commentActionBusy, setCommentActionBusy] = useState(null)
  const focusedCommentRef = useRef(null)
  const actor = post.actor || {}
  const clinicContent = post.clinic_content
  const allComments = useMemo(() => flattenComments(comments), [comments])

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

    return () => { cancelled = true }
  }, [post.id, targetCommentId])

  useEffect(() => {
    const normalizedTarget = String(targetCommentId || '')
    if (!normalizedTarget || commentsLoading || focusedCommentRef.current === normalizedTarget) return undefined
    if (!allComments.some((item) => String(item.id) === normalizedTarget)) return undefined

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
  }, [allComments, commentsLoading, targetCommentId])

  const requireLogin = () => {
    if (!user) { navigate('/login'); return false }
    return true
  }

  const react = async () => {
    if (!requireLogin()) return
    const old = post
    setPost((current) => ({ ...current, reacted_by_me: !current.reacted_by_me, reactions_count: current.reactions_count + (current.reacted_by_me ? -1 : 1) }))
    try {
      const data = await toggleCommunityReaction(post.id)
      setPost((current) => ({ ...current, reacted_by_me: data.reacted, reactions_count: data.reactions_count }))
    } catch { setPost(old) }
  }

  const save = async () => {
    if (!requireLogin()) return
    const old = post.saved_by_me
    setPost((current) => ({ ...current, saved_by_me: !old }))
    try {
      const data = await toggleSavedCommunityPost(post.id)
      setPost((current) => ({ ...current, saved_by_me: data.saved }))
    } catch { setPost((current) => ({ ...current, saved_by_me: old })) }
  }

  const follow = async () => {
    const followable = ['pet', 'clinic', 'business', 'shelter'].includes(actor.type)
    if (!requireLogin() || !followable) return
    const old = post.following_actor
    setPost((current) => ({ ...current, following_actor: !old }))
    try {
      const data = await toggleProfileFollow(actor.type, actor.identifier || actor.id)
      setPost((current) => ({ ...current, following_actor: data.following, follow_request_pending: Boolean(data.requested) }))
      onChanged?.()
    } catch { setPost((current) => ({ ...current, following_actor: old })) }
  }

  const openComments = async () => {
    const next = !commentsOpen
    setCommentsOpen(next)
    if (next && post.comments_count > allComments.length) {
      setCommentsLoading(true)
      try { setComments(await getCommunityComments(post.id)) } finally { setCommentsLoading(false) }
    }
  }

  const addComment = async (event) => {
    event.preventDefault()
    if (!requireLogin() || !comment.trim()) return
    setCommentSaving(true)
    try {
      const created = await addCommunityComment(post.id, comment.trim())
      setComments((rows) => [...rows, created])
      setPost((current) => ({ ...current, comments_count: current.comments_count + 1 }))
      setComment('')
      setCommentsOpen(true)
    } finally { setCommentSaving(false) }
  }

  const startReply = (item) => {
    if (!requireLogin()) return
    setReplyingTo(item.id)
    setReplyText('')
    setEditingCommentId(null)
  }

  const submitReply = async (event, parentId) => {
    event.preventDefault()
    if (!replyText.trim()) return
    setCommentActionBusy(`reply-${parentId}`)
    try {
      const created = await addCommunityComment(post.id, replyText.trim(), parentId)
      setComments((rows) => rows.map((item) => String(item.id) === String(parentId)
        ? { ...item, replies: [...(item.replies || []), created], replies_count: (item.replies_count || 0) + 1 }
        : item))
      setPost((current) => ({ ...current, comments_count: current.comments_count + 1 }))
      setReplyingTo(null)
      setReplyText('')
    } finally { setCommentActionBusy(null) }
  }

  const startCommentEdit = (item) => {
    setEditingCommentId(item.id)
    setEditCommentText(item.text)
    setReplyingTo(null)
  }

  const submitCommentEdit = async (event, id) => {
    event.preventDefault()
    if (!editCommentText.trim()) return
    setCommentActionBusy(`edit-${id}`)
    try {
      const updated = await updateCommunityComment(id, editCommentText.trim())
      setComments((rows) => updateCommentTree(rows, id, (current) => ({ ...current, ...updated, replies: updated.replies ?? current.replies })))
      setEditingCommentId(null)
      setEditCommentText('')
    } finally { setCommentActionBusy(null) }
  }

  const reactComment = async (item) => {
    if (!requireLogin()) return
    const old = item
    setComments((rows) => updateCommentTree(rows, item.id, (current) => ({
      ...current,
      reacted_by_me: !current.reacted_by_me,
      reactions_count: current.reactions_count + (current.reacted_by_me ? -1 : 1),
    })))
    try {
      const data = await toggleCommunityCommentReaction(item.id)
      setComments((rows) => updateCommentTree(rows, item.id, (current) => ({ ...current, reacted_by_me: data.reacted, reactions_count: data.reactions_count })))
    } catch {
      setComments((rows) => updateCommentTree(rows, item.id, () => old))
    }
  }

  const removeComment = async (id) => {
    const target = findComment(comments, id)
    if (!target || !window.confirm('¿Eliminar este comentario?')) return
    await deleteCommunityComment(id)
    const removedCount = 1 + (target.parent ? 0 : (target.replies?.length || 0))
    setComments((rows) => rows
      .filter((item) => String(item.id) !== String(id))
      .map((item) => ({ ...item, replies: (item.replies || []).filter((reply) => String(reply.id) !== String(id)) })))
    setPost((current) => ({ ...current, comments_count: Math.max(0, current.comments_count - removedCount) }))
  }

  const startPostEdit = () => {
    setMenuOpen(false)
    setEditPostText(post.text || '')
    setEditPostPermission(post.comment_permission || 'everyone')
    setEditingPost(true)
  }

  const submitPostEdit = async (event) => {
    event.preventDefault()
    if (!editPostText.trim() && !post.image_url) return
    setPostSaving(true)
    try {
      const updated = await updateCommunityPost(post.id, { text: editPostText.trim(), commentPermission: editPostPermission })
      setPost(updated)
      setEditingPost(false)
    } finally { setPostSaving(false) }
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

  const muteUser = async () => {
    setMenuOpen(false)
    if (!actor.owner_user_id) return
    await toggleMutedCommunityUser(actor.owner_user_id)
    onDeleted?.(post.id, true, actor.owner_user_id)
  }

  const hidePost = async (reason = 'hidden') => {
    setMenuOpen(false)
    await hideCommunityPost(post.id, reason)
    onDeleted?.(post.id)
  }

  const hideComment = async (id) => {
    if (!window.confirm('¿Ocultar este comentario de tu publicación?')) return
    await hideCommunityComment(id)
    const target = findComment(comments, id)
    const removedCount = 1 + (target?.parent ? 0 : (target?.replies?.length || 0))
    setComments((rows) => rows
      .filter((item) => String(item.id) !== String(id))
      .map((item) => ({ ...item, replies: (item.replies || []).filter((reply) => String(reply.id) !== String(id)) })))
    setPost((current) => ({ ...current, comments_count: Math.max(0, current.comments_count - removedCount) }))
  }

  const share = async () => {
    const url = `${window.location.origin}/comunidad?publicacion=${post.id}`
    const data = { title: `${actor.name} en VetPaw`, text: post.text || 'Mirá esta publicación de VetPaw', url }
    try {
      if (navigator.share) await navigator.share(data)
      else {
        await navigator.clipboard.writeText(url)
        window.alert('Enlace copiado.')
      }
      const result = await registerCommunityShare(post.id)
      setPost((current) => ({ ...current, shares_count: result.shares_count }))
    } catch { /* compartir cancelado o portapapeles no disponible */ }
  }

  const openMention = (username) => navigate(`/explorar?q=${encodeURIComponent(username)}`)
  const badge = typeMeta[post.post_type]

  const renderComment = (item, isReply = false) => (
    <div className={`comment-thread ${isReply ? 'comment-reply-thread' : ''}`} key={item.id}>
      <div
        id={`comment-${item.id}`}
        className={`comment-item ${isReply ? 'comment-reply' : ''} ${String(item.id) === highlightedCommentId ? 'comment-target-highlight' : ''}`}
      >
        {item.author.avatar ? <img className="comment-avatar" src={item.author.avatar} alt="" /> : <div className="comment-avatar comment-avatar-fallback">👤</div>}
        <div className="comment-main">
          {editingCommentId === item.id ? (
            <form className="comment-edit-form" onSubmit={(event) => submitCommentEdit(event, item.id)}>
              <MentionTextarea multiline value={editCommentText} onChange={setEditCommentText} className="community-textarea comment-edit-input" maxLength={1000} autoFocus />
              <div className="comment-inline-actions">
                <button type="button" onClick={() => setEditingCommentId(null)}>Cancelar</button>
                <button type="submit" disabled={commentActionBusy === `edit-${item.id}` || !editCommentText.trim()}>Guardar</button>
              </div>
            </form>
          ) : (
            <>
              <div className="comment-bubble">
                <strong>{item.author.display_name}</strong>{item.is_professional_answer && <span className="clinic-answer-badge">✓ Respuesta veterinaria</span>}
                <span>{renderRichText(item.text, onHashtagClick, openMention)}</span>
              </div>
              <div className="comment-tools">
                <span>{relativeTime(item.created_at)}{item.is_edited ? ' · Editado' : ''}</span>
                <button type="button" className={item.reacted_by_me ? 'active' : ''} onClick={() => reactComment(item)}>🐾 {item.reactions_count || ''}</button>
                {!isReply && <button type="button" onClick={() => startReply(item)}>Responder</button>}
                {item.can_edit && <button type="button" onClick={() => startCommentEdit(item)}>Editar</button>}
                {item.can_hide && !item.can_edit && <button type="button" className="moderate" onClick={() => hideComment(item.id)}>Ocultar</button>}
                {item.can_delete && (item.can_edit || !item.can_hide) ? <button type="button" onClick={() => removeComment(item.id)}>Eliminar</button> : user && !item.can_hide ? <button type="button" onClick={() => setReportTarget({ comment: item.id })}>Reportar</button> : null}
              </div>
            </>
          )}
        </div>
      </div>

      {!isReply && (item.replies || []).map((reply) => renderComment(reply, true))}

      {!isReply && replyingTo === item.id && (
        <form className="reply-form" onSubmit={(event) => submitReply(event, item.id)}>
          <MentionTextarea value={replyText} onChange={setReplyText} className="community-input" placeholder={`Responder a ${item.author.display_name}...`} maxLength={1000} autoFocus />
          <div className="comment-inline-actions">
            <button type="button" onClick={() => { setReplyingTo(null); setReplyText('') }}>Cancelar</button>
            <button type="submit" disabled={commentActionBusy === `reply-${item.id}` || !replyText.trim()}>Responder</button>
          </div>
        </form>
      )}
    </div>
  )

  return (
    <article className="post-card community-card" id={`post-${post.id}`}>
      <div className="post-head">
        {actor.photo ? <img className="post-avatar" src={actor.photo} alt={actor.name} /> : <div className="post-avatar">{fallbackAvatar(actor)}</div>}
        <div className="post-author">
          <div className="post-author-line">
            <Link to={actor.profile_url || '#'}>{actor.name || 'VetPaw'}</Link>
            {actor.verified && <span title="Perfil verificado" className="verified-dot">●</span>}
            {['pet', 'clinic', 'business', 'shelter'].includes(actor.type) && user && actor.owner_user_id !== user.id && (
              <button type="button" className={`mini-follow ${post.following_actor ? 'following' : ''}`} onClick={follow}>{post.following_actor ? 'Siguiendo' : post.follow_request_pending ? 'Solicitud enviada' : 'Seguir'}</button>
            )}
          </div>
          <div className="post-meta">{actor.subtitle}{post.locality ? `${actor.subtitle ? ' · ' : ''}${post.locality}` : ''} · {relativeTime(post.created_at)}{post.is_edited ? ' · Editado' : ''}</div>
        </div>
        <div className="post-menu">
          <button className="post-menu-button" onClick={() => setMenuOpen((value) => !value)}>⋯</button>
          {menuOpen && (
            <div className="post-menu-panel">
              <button onClick={() => { setMenuOpen(false); share() }}>↗ Compartir</button>
              {post.can_edit && <button onClick={startPostEdit}>✏️ Editar publicación</button>}
              {user && !post.can_delete && <button onClick={() => hidePost('hidden')}>🙈 Ocultar publicación</button>}
              {user && !post.can_delete && <button className="warning" onClick={() => hidePost('not_interested')}>✦ No me interesa</button>}
              {user && !post.can_delete && actor.owner_user_id && <button onClick={muteUser}>🔇 Silenciar usuario</button>}
              {user && !post.can_delete && <button onClick={() => { setMenuOpen(false); setReportTarget({ post: post.id }) }}>⚑ Reportar publicación</button>}
              {user && !post.can_delete && actor.owner_user_id && <button onClick={blockUser}>⊘ Bloquear usuario</button>}
              {post.can_delete && <button className="danger" onClick={removePost}>🗑 Eliminar publicación</button>}
            </div>
          )}
        </div>
      </div>

      {editingPost ? (
        <form className="post-edit-panel" onSubmit={submitPostEdit}>
          <MentionTextarea multiline value={editPostText} onChange={setEditPostText} className="community-textarea" maxLength={3000} autoFocus />
          <select className="post-privacy-select" value={editPostPermission} onChange={(event) => setEditPostPermission(event.target.value)}>
            <option value="everyone">Todos pueden comentar</option>
            <option value="followers">Solo seguidores</option>
            <option value="none">Comentarios desactivados</option>
          </select>
          <div className="community-modal-actions">
            <button type="button" className="community-button-secondary" onClick={() => setEditingPost(false)}>Cancelar</button>
            <button type="submit" className="community-button" disabled={postSaving || (!editPostText.trim() && !post.image_url)}>{postSaving ? 'Guardando...' : 'Guardar cambios'}</button>
          </div>
        </form>
      ) : (
        <div className="post-copy">
          {badge && <div><span className={`post-type-badge ${badge[0]}`}>{badge[1]}</span></div>}
          {renderRichText(post.text, onHashtagClick, openMention)}
        </div>
      )}

      {post.lost_pet && (
        <div className="lost-info">
          <strong>{post.lost_pet.report_type_display}: {post.lost_pet.pet_name || 'Mascota'}</strong>
          <span>📍 {post.lost_pet.locality || 'Sin localidad'}, {post.lost_pet.province || 'Argentina'}</span>
          {post.lost_pet.incident_date && <span>📅 Fecha: {new Date(`${post.lost_pet.incident_date}T12:00:00`).toLocaleDateString('es-AR')}</span>}
          <span>☎ {post.lost_pet.contact_value}</span>
          <Link to="/mascotas-perdidas" className="lost-link">Ver aviso completo →</Link>
        </div>
      )}

      {clinicContent && (
        <div className="clinic-post-panel">
          <span className="clinic-post-label">🏥 {clinicContent.label}{clinicContent.verified ? ' · Información verificada' : ''}</span>
          {clinicContent.campaign && (
            <>
              <h4>{clinicContent.campaign.title}</h4>
              <p>📅 {new Date(clinicContent.campaign.starts_at).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              {clinicContent.campaign.location && <p>📍 {clinicContent.campaign.location}</p>}
              <p>{clinicContent.campaign.is_free ? 'Actividad gratuita' : clinicContent.campaign.price ? `$${Number(clinicContent.campaign.price).toLocaleString('es-AR')}` : 'Consultar valor'}{clinicContent.campaign.remaining_slots !== null ? ` · ${clinicContent.campaign.remaining_slots} cupos disponibles` : ''}</p>
            </>
          )}
          {clinicContent.can_request_appointment && (
            <button type="button" className="clinic-post-cta" onClick={() => {
              if (!user) { navigate('/login'); return }
              if (user.role !== 'owner') { navigate(`/clinicas/${clinicContent.clinic_slug}`); return }
              const params = new URLSearchParams({ clinic: String(clinicContent.clinic_id), source_post: String(post.id), reason: clinicContent.campaign?.title || post.text?.slice(0, 120) || 'Consulta desde la Comunidad' })
              if (clinicContent.campaign?.id) params.set('campaign', String(clinicContent.campaign.id))
              navigate(`/appointments/new?${params.toString()}`)
            }}>{clinicContent.campaign ? '📅 Reservar lugar' : '📅 Solicitar turno'}</button>
          )}
        </div>
      )}

      {post.commerce_link && <button type="button" className="post-commerce-link" onClick={() => navigate(post.commerce_link.url)}><span>🛍️</span><div><b>{post.commerce_link.title}</b><small>{post.commerce_link.action}</small></div><strong>→</strong></button>}
      {post.image_url && <div className="post-image-wrap"><img className="post-image" src={post.image_url} alt={`Publicación de ${actor.name}`} loading="lazy" /></div>}

      <div className="post-stats">
        <span>🐾 {post.reactions_count} patitas</span>
        <span>{post.comments_count} comentarios</span>
        <span>↗ {post.shares_count || 0} compartidas</span>
      </div>
      <div className="post-actions">
        <button className={`post-action ${post.reacted_by_me ? 'active' : ''}`} onClick={react}><span>🐾</span> {post.reacted_by_me ? 'Te gusta' : 'Patita'}</button>
        <button className="post-action" onClick={openComments} disabled={!post.comments_enabled}><span>💬</span> {post.comments_enabled ? 'Comentar' : 'Comentarios cerrados'}</button>
        <button className="post-action" onClick={share}><span>↗</span> Compartir</button>
        <button className={`post-action ${post.saved_by_me ? 'active' : ''}`} onClick={save}><span>🔖</span> {post.saved_by_me ? 'Guardado' : 'Guardar'}</button>
      </div>

      {(commentsOpen || comments.length > 0) && (
        <div className="comments-area">
          {commentsLoading && <div className="composer-sub">Cargando comentarios...</div>}
          {comments.map((item) => renderComment(item))}
          {post.comments_enabled ? (
            <form className="comment-form" onSubmit={addComment}>
              <MentionTextarea value={comment} onChange={setComment} className="community-input" placeholder={user ? 'Escribí un comentario... Usá @ para mencionar' : 'Iniciá sesión para comentar'} disabled={!user || commentSaving} maxLength={1000} />
              <button className="community-button" disabled={!user || commentSaving || !comment.trim()}>{commentSaving ? '...' : 'Enviar'}</button>
            </form>
          ) : <div className="post-comments-disabled">🔒 El autor desactivó los comentarios en esta publicación.</div>}
        </div>
      )}
      {reportTarget && <ReportModal target={reportTarget} onClose={() => setReportTarget(null)} />}
    </article>
  )
}
