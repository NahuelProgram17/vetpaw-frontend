import { useEffect, useMemo, useRef, useState } from 'react'
import { getCommunityMentionSuggestions } from '../../services/api'

const mentionAtCursor = (value, cursor) => {
  const before = String(value || '').slice(0, cursor ?? String(value || '').length)
  const match = before.match(/(^|\s)@([\w.+-]{2,80})$/u)
  if (!match) return null
  return {
    query: match[2],
    start: before.length - match[2].length - 1,
    end: before.length,
  }
}

export default function MentionTextarea({
  value,
  onChange,
  multiline = false,
  className = '',
  placeholder = '',
  disabled = false,
  maxLength = 1000,
  autoFocus = false,
  onKeyDown,
}) {
  const inputRef = useRef(null)
  const [cursor, setCursor] = useState(0)
  const [rows, setRows] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const activeMention = useMemo(() => mentionAtCursor(value, cursor), [value, cursor])

  useEffect(() => {
    if (!activeMention?.query || disabled) {
      setRows([])
      setOpen(false)
      return undefined
    }
    let cancelled = false
    const timer = window.setTimeout(async () => {
      setLoading(true)
      try {
        const data = await getCommunityMentionSuggestions(activeMention.query)
        if (!cancelled) {
          setRows(Array.isArray(data) ? data : [])
          setOpen(true)
        }
      } catch {
        if (!cancelled) setRows([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 220)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [activeMention?.query, disabled])

  const syncCursor = (event) => setCursor(event.currentTarget.selectionStart ?? 0)

  const choose = (item) => {
    if (!activeMention) return
    const next = `${value.slice(0, activeMention.start)}@${item.username} ${value.slice(activeMention.end)}`
    onChange(next)
    setRows([])
    setOpen(false)
    const nextCursor = activeMention.start + item.username.length + 2
    window.setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange?.(nextCursor, nextCursor)
      setCursor(nextCursor)
    }, 0)
  }

  const common = {
    ref: inputRef,
    value,
    className,
    placeholder,
    disabled,
    maxLength,
    autoFocus,
    onChange: (event) => {
      onChange(event.target.value)
      setCursor(event.target.selectionStart ?? event.target.value.length)
    },
    onClick: syncCursor,
    onKeyUp: syncCursor,
    onKeyDown,
    autoComplete: 'off',
  }

  return (
    <div className="mention-field">
      {multiline ? <textarea {...common} /> : <input {...common} />}
      {open && (
        <div className="mention-suggestions" role="listbox">
          {loading && <div className="mention-empty">Buscando perfiles...</div>}
          {!loading && !rows.length && <div className="mention-empty">No encontramos perfiles con ese nombre.</div>}
          {!loading && rows.map((item) => (
            <button type="button" key={item.username} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(item)}>
              {item.avatar ? <img src={item.avatar} alt="" loading="lazy" decoding="async" /> : <span className="mention-avatar">🐾</span>}
              <span><strong>{item.display_name}</strong><small>@{item.username}</small></span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
