const SHELL_CACHE = 'vetpaw-shell-v5'
const STATIC_CACHE = 'vetpaw-static-v5'
const APP_SHELL_URL = '/'
const OFFLINE_URL = '/offline.html'
const MAX_STATIC_ENTRIES = 160
const CORE_ASSETS = ['/', OFFLINE_URL, '/manifest.json', '/logo_vetpaw.png', '/icon-192.png', '/favicon-32x32.png']


const trimCache = async (cacheName, maxEntries) => {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  const extra = keys.length - maxEntries
  if (extra <= 0) return
  await Promise.all(keys.slice(0, extra).map((key) => cache.delete(key)))
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(async (cache) => {
        await Promise.all(CORE_ASSETS.map(async (url) => {
          try {
            const response = await fetch(new Request(url, { cache: 'reload' }))
            if (response.ok) await cache.put(url, response)
          } catch (error) {
            console.warn(`No se pudo guardar ${url} para uso sin conexión.`, error)
          }
        }))
      })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  const currentCaches = new Set([SHELL_CACHE, STATIC_CACHE])
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('vetpaw-') && !currentCaches.has(key))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  )
})

const offlineDocument = () => new Response(
  "<!doctype html><html lang='es'><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><meta name='theme-color' content='#4CAF50'><title>VetPaw sin conexión</title><body style='margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box;font-family:system-ui;background:#071422;color:white;text-align:center'><main style='max-width:480px;padding:36px 28px;border:1px solid rgba(255,255,255,.12);border-radius:24px;background:#122033'><div style='font-size:56px'>📡</div><h1>VetPaw está sin conexión</h1><p style='color:rgba(255,255,255,.7);line-height:1.55'>La aplicación volverá a conectarse cuando recuperes internet. Las pantallas que ya abriste pueden seguir disponibles.</p><button onclick='location.reload()' style='border:0;border-radius:12px;padding:12px 18px;background:linear-gradient(135deg,#4CAF50,#FF9800);color:white;font-weight:800;cursor:pointer'>Reintentar</button></main></body></html>",
  { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }
)

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(SHELL_CACHE).then((cache) => {
              cache.put(request, copy.clone())
              cache.put(APP_SHELL_URL, copy)
            })
          }
          return response
        })
        .catch(async () => {
          return (await caches.match(request))
            || (await caches.match(APP_SHELL_URL))
            || (await caches.match(OFFLINE_URL))
            || offlineDocument()
        })
    )
    return
  }

  const cacheableDestination = ['script', 'style', 'font', 'image'].includes(request.destination)
  if (!cacheableDestination) return

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(STATIC_CACHE).then(async (cache) => {
              await cache.put(request, response.clone())
              await trimCache(STATIC_CACHE, MAX_STATIC_ENTRIES)
            })
          }
          return response
        })
        .catch(() => cached || Response.error())

      return cached || network
    })
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
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
