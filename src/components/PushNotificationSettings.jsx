import { useCallback, useEffect, useState } from 'react'
import {
  disablePushSubscription,
  getPushConfig,
  registerPushSubscription,
  sendPushTest,
} from '../services/api'
import {
  createPushSubscription,
  detectDeviceName,
  getCurrentPushSubscription,
  isIosDevice,
  isStandaloneApp,
  supportsWebPush,
  unsubscribePushSubscription,
} from '../utils/pushNotifications'

const FONT = "'Plus Jakarta Sans','Nunito',sans-serif"

const permissionLabel = () => {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export default function PushNotificationSettings() {
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [config, setConfig] = useState({ enabled: false, public_key: '' })
  const [subscription, setSubscription] = useState(null)
  const [permission, setPermission] = useState(permissionLabel())
  const [feedback, setFeedback] = useState('')
  const supported = supportsWebPush()
  const iosNeedsInstall = isIosDevice() && !isStandaloneApp()

  const syncSubscription = useCallback(async (current) => {
    if (!current) return
    const payload = current.toJSON()
    await registerPushSubscription({
      endpoint: payload.endpoint,
      keys: payload.keys,
      device_name: detectDeviceName(),
      user_agent: navigator.userAgent || '',
    })
    localStorage.setItem('vetpaw_push_endpoint', payload.endpoint)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const serverConfig = await getPushConfig()
      setConfig(serverConfig)
      if (supported) {
        const current = await getCurrentPushSubscription()
        setSubscription(current)
        setPermission(permissionLabel())
        if (current && serverConfig.enabled) {
          await syncSubscription(current).catch(() => {})
        }
      }
    } catch (error) {
      console.error(error)
      setFeedback('No pudimos revisar las notificaciones del dispositivo.')
    } finally {
      setLoading(false)
    }
  }, [supported, syncSubscription])

  useEffect(() => {
    load()
  }, [load])

  const activate = async () => {
    setBusy(true)
    setFeedback('')
    try {
      if (!config.enabled || !config.public_key) {
        throw new Error('El servidor todavía no tiene las claves de notificaciones configuradas.')
      }
      if (iosNeedsInstall) {
        throw new Error('En iPhone primero agregá VetPaw a la pantalla de inicio y abrila desde su icono.')
      }
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result !== 'granted') {
        throw new Error(result === 'denied'
          ? 'El permiso quedó bloqueado. Habilitalo desde los ajustes del navegador o del teléfono.'
          : 'Necesitamos tu permiso para mostrar notificaciones.')
      }
      const current = await getCurrentPushSubscription()
      const created = current || await createPushSubscription(config.public_key)
      await syncSubscription(created)
      setSubscription(created)
      setFeedback('¡Listo! VetPaw ya puede avisarte aunque la app esté cerrada.')
      window.dispatchEvent(new CustomEvent('vetpaw:push-updated'))
    } catch (error) {
      setFeedback(error?.message || 'No pudimos activar las notificaciones.')
    } finally {
      setBusy(false)
    }
  }

  const deactivate = async () => {
    if (!subscription) return
    setBusy(true)
    setFeedback('')
    try {
      const endpoint = subscription.endpoint
      await disablePushSubscription(endpoint).catch(() => {})
      await unsubscribePushSubscription(subscription)
      localStorage.removeItem('vetpaw_push_endpoint')
      setSubscription(null)
      setFeedback('Notificaciones desactivadas en este dispositivo.')
      window.dispatchEvent(new CustomEvent('vetpaw:push-updated'))
    } catch {
      setFeedback('No pudimos desactivar la suscripción. Probá nuevamente.')
    } finally {
      setBusy(false)
    }
  }

  const sendTest = async () => {
    if (!subscription) return
    setBusy(true)
    setFeedback('Enviando una notificación de prueba…')
    try {
      await sendPushTest(subscription.endpoint)
      setFeedback('Prueba enviada. Debería aparecer en unos segundos.')
    } catch (error) {
      setFeedback(error.response?.data?.error || 'No pudimos enviar la prueba.')
    } finally {
      setBusy(false)
    }
  }

  const active = Boolean(subscription && permission === 'granted')

  return (
    <section className="push-settings-card">
      <div className="push-settings-icon">🔔</div>
      <div className="push-settings-copy">
        <div className="push-settings-title-row">
          <div>
            <span className="push-settings-kicker">Avisos al teléfono</span>
            <h2>Notificaciones push</h2>
          </div>
          <span className={`push-status ${active ? 'active' : 'inactive'}`}>
            {loading ? 'Revisando…' : active ? 'Activadas' : 'Desactivadas'}
          </span>
        </div>

        <p>
          Recibí patitas, comentarios y nuevos seguidores en la pantalla del celular,
          incluso cuando VetPaw esté cerrada.
        </p>

        {!supported && !loading && (
          <div className="push-note warning">Este navegador no admite notificaciones Web Push.</div>
        )}
        {iosNeedsInstall && !active && (
          <div className="push-note iphone">
            En iPhone: abrí VetPaw en Safari, tocá Compartir → Agregar a inicio y después
            abrila desde el icono antes de activar los avisos.
          </div>
        )}
        {permission === 'denied' && (
          <div className="push-note warning">
            El permiso está bloqueado. Habilitá VetPaw desde Ajustes → Notificaciones
            o desde la configuración del navegador.
          </div>
        )}
        {!config.enabled && !loading && (
          <div className="push-note warning">El servidor todavía no tiene configuradas las claves VAPID.</div>
        )}

        <div className="push-actions">
          {!active ? (
            <button
              className="push-primary"
              onClick={activate}
              disabled={busy || loading || !supported || !config.enabled || iosNeedsInstall}
            >
              {busy ? 'Activando…' : '🔔 Activar notificaciones'}
            </button>
          ) : (
            <>
              <button className="push-primary" onClick={sendTest} disabled={busy}>
                {busy ? 'Procesando…' : '📲 Enviar prueba'}
              </button>
              <button className="push-secondary" onClick={deactivate} disabled={busy}>
                Desactivar en este dispositivo
              </button>
            </>
          )}
        </div>
        {feedback && <p className="push-feedback">{feedback}</p>}
      </div>

      <style>{`
        .push-settings-card { display:grid; grid-template-columns:72px 1fr; gap:18px; align-items:start; padding:22px; margin:18px 0; border-radius:24px; border:1px solid rgba(76,175,80,.25); background:linear-gradient(145deg,rgba(20,43,57,.96),rgba(12,28,41,.97)); box-shadow:0 18px 48px rgba(0,0,0,.24); font-family:${FONT}; color:#fff; }
        .push-settings-icon { width:66px; height:66px; display:grid; place-items:center; border-radius:20px; font-size:31px; background:linear-gradient(135deg,rgba(76,175,80,.25),rgba(255,152,0,.2)); border:1px solid rgba(255,255,255,.1); }
        .push-settings-title-row { display:flex; justify-content:space-between; align-items:flex-start; gap:15px; }
        .push-settings-kicker { color:#91e49a; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:.8px; }
        .push-settings-copy h2 { margin:3px 0 7px; font-size:22px; }
        .push-settings-copy > p { color:rgba(255,255,255,.6); line-height:1.55; font-size:13px; max-width:760px; }
        .push-status { flex-shrink:0; padding:6px 10px; border-radius:999px; font-size:11px; font-weight:900; }
        .push-status.active { color:#9ff0a7; background:rgba(76,175,80,.14); border:1px solid rgba(76,175,80,.3); }
        .push-status.inactive { color:#ffd08a; background:rgba(255,152,0,.1); border:1px solid rgba(255,152,0,.25); }
        .push-note { margin-top:12px; padding:11px 13px; border-radius:12px; font-size:12px; line-height:1.5; }
        .push-note.iphone { color:#c9e7ff; background:rgba(58,139,253,.1); border:1px solid rgba(58,139,253,.23); }
        .push-note.warning { color:#ffd08a; background:rgba(255,152,0,.09); border:1px solid rgba(255,152,0,.23); }
        .push-actions { display:flex; gap:9px; flex-wrap:wrap; margin-top:15px; }
        .push-actions button { border-radius:12px; padding:10px 14px; font:800 12px ${FONT}; cursor:pointer; }
        .push-actions button:disabled { opacity:.5; cursor:not-allowed; }
        .push-primary { border:0; color:#fff; background:linear-gradient(135deg,#4CAF50,#FF9800); }
        .push-secondary { color:#fff; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.055); }
        .push-feedback { margin-top:11px!important; color:#9eeaa6!important; font-weight:800; font-size:12px!important; }
        @media (max-width:650px) { .push-settings-card { grid-template-columns:1fr; padding:17px; border-radius:19px; } .push-settings-icon { width:54px; height:54px; border-radius:16px; } .push-settings-title-row { align-items:flex-start; } .push-status { margin-top:1px; } }
      `}</style>
    </section>
  )
}
