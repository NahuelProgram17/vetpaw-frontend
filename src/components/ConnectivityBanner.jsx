import { useCallback, useEffect, useRef, useState } from 'react'
import { SERVICE_RECOVERED_EVENT, SERVICE_STATUS_EVENT } from '../utils/serviceErrors'

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
const HEALTH_URL = `${API_ORIGIN}/api/health/`

const initialState = () => (
  typeof navigator !== 'undefined' && navigator.onLine === false
    ? { kind: 'offline', message: 'No tenés conexión a internet. VetPaw volverá a conectarse automáticamente.', requestId: '', retryAfter: 30 }
    : { kind: 'hidden', message: '', requestId: '', retryAfter: 30 }
)

export default function ConnectivityBanner() {
  const [status, setStatus] = useState(initialState)
  const recoveredTimerRef = useRef(null)

  const clearRecoveredTimer = () => {
    if (recoveredTimerRef.current) window.clearTimeout(recoveredTimerRef.current)
    recoveredTimerRef.current = null
  }

  const markRecovered = useCallback(() => {
    clearRecoveredTimer()
    window.dispatchEvent(new CustomEvent(SERVICE_RECOVERED_EVENT))
    setStatus({ kind: 'recovered', message: 'Conexión restablecida. VetPaw ya está actualizado.', requestId: '', retryAfter: 30 })
    recoveredTimerRef.current = window.setTimeout(() => {
      setStatus({ kind: 'hidden', message: '', requestId: '', retryAfter: 30 })
    }, 3500)
  }, [])

  const checkHealth = useCallback(async () => {
    if (navigator.onLine === false) {
      setStatus({ kind: 'offline', message: 'No tenés conexión a internet. VetPaw volverá a conectarse automáticamente.', requestId: '', retryAfter: 30 })
      return false
    }

    clearRecoveredTimer()
    setStatus((current) => ({ ...current, kind: 'checking', message: 'Comprobando la conexión con VetPaw…' }))

    try {
      const response = await fetch(HEALTH_URL, { cache: 'no-store', headers: { Accept: 'application/json' } })
      if (!response.ok) throw new Error('Servicio temporalmente no disponible')
      markRecovered()
      return true
    } catch {
      setStatus({
        kind: 'unavailable',
        message: 'VetPaw está temporalmente ocupado. Tus datos siguen seguros; probá nuevamente en unos segundos.',
        requestId: '',
        retryAfter: 30,
      })
      return false
    }
  }, [markRecovered])

  useEffect(() => {
    const handleOffline = () => {
      clearRecoveredTimer()
      setStatus({ kind: 'offline', message: 'No tenés conexión a internet. VetPaw volverá a conectarse automáticamente.', requestId: '', retryAfter: 30 })
    }
    const handleOnline = () => { checkHealth() }
    const handleServiceStatus = (event) => {
      const detail = event.detail || {}
      clearRecoveredTimer()
      setStatus({
        kind: detail.kind || 'unavailable',
        message: detail.message || 'No pudimos comunicarnos con VetPaw.',
        requestId: detail.requestId || '',
        retryAfter: Number(detail.retryAfter) || 30,
      })
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    window.addEventListener(SERVICE_STATUS_EVENT, handleServiceStatus)
    return () => {
      clearRecoveredTimer()
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener(SERVICE_STATUS_EVENT, handleServiceStatus)
    }
  }, [checkHealth])

  useEffect(() => {
    if (!['unavailable', 'connection'].includes(status.kind)) return undefined
    const timer = window.setTimeout(checkHealth, Math.max(10, status.retryAfter || 30) * 1000)
    return () => window.clearTimeout(timer)
  }, [status.kind, status.retryAfter, checkHealth])

  if (status.kind === 'hidden') return null

  const isPositive = status.kind === 'recovered'
  const isChecking = status.kind === 'checking'

  return (
    <aside
      className={`vp-connectivity-banner is-${status.kind}`}
      role={isPositive || isChecking ? 'status' : 'alert'}
      aria-live={isPositive || isChecking ? 'polite' : 'assertive'}
    >
      <span className="vp-connectivity-icon" aria-hidden="true">
        {isPositive ? '✓' : isChecking ? '↻' : status.kind === 'offline' ? '📡' : '⚠️'}
      </span>
      <div className="vp-connectivity-copy">
        <strong>{isPositive ? 'Todo listo' : isChecking ? 'Reconectando' : status.kind === 'offline' ? 'Estás sin conexión' : 'Conexión temporalmente interrumpida'}</strong>
        <span>{status.message}</span>
        {status.requestId && <small>Código de soporte: {status.requestId}</small>}
      </div>
      {!isPositive && !isChecking && (
        <button type="button" onClick={checkHealth}>Reintentar</button>
      )}
    </aside>
  )
}
