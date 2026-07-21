const CACHE_NAME = 'vetpaw-shell-v3'
const APP_SHELL_URL = '/'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        try {
          const response = await fetch(new Request(APP_SHELL_URL, { cache: 'reload' }))
          if (response.ok) await cache.put(APP_SHELL_URL, response)
        } catch (error) {
          console.warn('No se pudo guardar la portada de VetPaw para uso sin conexión.', error)
        }
      })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.mode !== 'navigate') return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(APP_SHELL_URL, copy))
        }
        return response
      })
      .catch(async () => {
        const cached = await caches.match(APP_SHELL_URL)
        if (cached) return cached

        return new Response(
          "<!doctype html><html lang='es'><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>VetPaw sin conexión</title><body style='font-family:system-ui;background:#0a1520;color:white;text-align:center;padding:48px'><h1>VetPaw</h1><p>No hay conexión en este momento. Volvé a intentarlo cuando recuperes internet.</p></body></html>",
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        )
      })
  )
})

self.addEventListener('push', (event) => {
  let payload
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = {
      title: 'VetPaw 🐾',
      body: event.data ? event.data.text() : 'Tenés una nueva notificación.',
    }
  }

  const title = payload.title || 'VetPaw 🐾'
  const options = {
    body: payload.body || 'Tenés una nueva actividad en VetPaw.',
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    tag: payload.tag || `vetpaw-${Date.now()}`,
    renotify: true,
    data: {
      url: payload.url || '/notifications',
      notificationId: payload.notification_id || null,
      notificationType: payload.notification_type || 'general',
    },
    vibrate: [120, 60, 120],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data || {}
  const target = new URL(data.url || '/notifications', self.location.origin)
  if (target.origin !== self.location.origin) {
    target.href = `${self.location.origin}/notifications`
  }
  if (data.notificationId) {
    target.searchParams.set('notificacion', data.notificationId)
  }

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of windows) {
      if ('navigate' in client) await client.navigate(target.href)
      if ('focus' in client) return client.focus()
    }
    return self.clients.openWindow ? self.clients.openWindow(target.href) : undefined
  })())
})

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    windows.forEach((client) => client.postMessage({ type: 'VETPAW_PUSH_SUBSCRIPTION_CHANGED' }))
  })())
})
