import { useCallback, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getPushConfig,
  markCommunityNotificationRead,
  registerPushSubscription,
} from '../services/api'
import {
  detectDeviceName,
  getCurrentPushSubscription,
  supportsWebPush,
} from '../utils/pushNotifications'

export default function PushNotificationHandler() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const syncExistingSubscription = useCallback(async () => {
    if (!user || !supportsWebPush()) return
    try {
      const config = await getPushConfig()
      if (!config.enabled) return
      const subscription = await getCurrentPushSubscription()
      if (!subscription) return
      const payload = subscription.toJSON()
      await registerPushSubscription({
        endpoint: payload.endpoint,
        keys: payload.keys,
        device_name: detectDeviceName(),
        user_agent: navigator.userAgent || '',
      })
      localStorage.setItem('vetpaw_push_endpoint', payload.endpoint)
    } catch {
      // La sincronización silenciosa no debe bloquear el uso de VetPaw.
    }
  }, [user])

  useEffect(() => {
    syncExistingSubscription()
  }, [syncExistingSubscription])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined
    const handler = (event) => {
      if (event.data?.type === 'VETPAW_PUSH_SUBSCRIPTION_CHANGED') {
        syncExistingSubscription()
      }
    }
    navigator.serviceWorker.addEventListener('message', handler)
    return () => navigator.serviceWorker.removeEventListener('message', handler)
  }, [syncExistingSubscription])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const notificationId = params.get('notificacion')
    if (!notificationId || !user) return

    markCommunityNotificationRead(notificationId)
      .catch(() => {})
      .finally(() => {
        params.delete('notificacion')
        const nextSearch = params.toString()
        navigate(`${location.pathname}${nextSearch ? `?${nextSearch}` : ''}${location.hash}`, { replace: true })
        window.dispatchEvent(new CustomEvent('vetpaw:notifications-updated'))
      })
  }, [location.hash, location.pathname, location.search, navigate, user])

  return null
}
