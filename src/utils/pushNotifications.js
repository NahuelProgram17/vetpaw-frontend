export const isIosDevice = () => {
  const ua = navigator.userAgent || ''
  const platform = navigator.platform || ''
  return /iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export const isStandaloneApp = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true

export const supportsWebPush = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

export const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const normalized = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(normalized)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

export const getPushRegistration = async () => {
  if (!supportsWebPush()) return null
  return navigator.serviceWorker.ready
}

export const getCurrentPushSubscription = async () => {
  const registration = await getPushRegistration()
  return registration ? registration.pushManager.getSubscription() : null
}

export const createPushSubscription = async (publicKey) => {
  const registration = await getPushRegistration()
  if (!registration) throw new Error('Este navegador no admite notificaciones push.')
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  })
}

export const unsubscribePushSubscription = async (subscription) => {
  if (!subscription) return false
  return subscription.unsubscribe()
}

export const detectDeviceName = () => {
  const ua = navigator.userAgent || ''
  if (isIosDevice()) return 'iPhone o iPad'
  if (/Android/i.test(ua)) return 'Android'
  if (/Windows/i.test(ua)) return 'Windows'
  if (/Macintosh|Mac OS X/i.test(ua)) return 'Mac'
  return 'Navegador web'
}
