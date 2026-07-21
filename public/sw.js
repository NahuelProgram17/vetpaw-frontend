const CACHE_NAME = "vetpaw-shell-v2";
const APP_SHELL_URL = "/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        try {
          const response = await fetch(new Request(APP_SHELL_URL, { cache: "reload" }));
          if (response.ok) await cache.put(APP_SHELL_URL, response);
        } catch (error) {
          console.warn("No se pudo guardar la portada de VetPaw para uso sin conexión.", error);
        }
      })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(APP_SHELL_URL, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(APP_SHELL_URL);
        if (cached) return cached;

        return new Response(
          "<!doctype html><html lang='es'><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>VetPaw sin conexión</title><body style='font-family:system-ui;background:#0a1520;color:white;text-align:center;padding:48px'><h1>VetPaw</h1><p>No hay conexión en este momento. Volvé a intentarlo cuando recuperes internet.</p></body></html>",
          { headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      })
  );
});
