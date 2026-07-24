# Producción, PWA y recuperación

## Deploy normal

1. Ejecutar `npm run check:final`.
2. Revisar `git status`.
3. Hacer commit y push a `main`.
4. Esperar que Vercel muestre **Ready**.
5. Abrir `https://www.vetpaw.com.ar` y hacer `Ctrl + F5`.

## Service Worker

La versión final utiliza:

```text
vetpaw-shell-v5
vetpaw-static-v5
```

Características:

- shell básico disponible sin conexión;
- pantalla `offline.html` accesible;
- actualización del Service Worker sin caché del navegador;
- caché de recursos estáticos limitada a 160 elementos;
- conservación de notificaciones push;
- eliminación automática de cachés antiguas.

Después de actualizar `public/sw.js`, cerrar y volver a abrir la PWA instalada. En casos extremos, desde DevTools se puede usar **Application → Service Workers → Unregister** y recargar.

## Si el frontend abre pero no carga datos

1. Abrir directamente el estado del backend:
   `https://web-production-eaeb4.up.railway.app/api/health/`
2. Debe responder `status: ok` y `database: ok`.
3. Revisar el aviso de conexión de VetPaw.
4. Copiar el `X-Request-ID` si aparece.
5. Revisar Railway con ese identificador.
6. Confirmar `VITE_API_URL` en Vercel.

## Si aparece una versión vieja

1. Hacer `Ctrl + F5`.
2. Cerrar todas las pestañas de VetPaw.
3. Cerrar y abrir nuevamente la PWA.
4. Revisar que `/sw.js` responda sin caché.
5. Como último recurso, borrar únicamente los datos del sitio VetPaw en el navegador.

No indicar al usuario que borre todos los datos del navegador, porque podría afectar otros sitios.

## Si Vercel falla

- Revisar el log del build.
- Confirmar que `npm run build` funciona localmente.
- No ejecutar `npm install` para solucionar un error sin revisar primero la causa.
- Revertir el último commit únicamente si el deployment anterior estaba estable.

## Recuperación del repositorio

El código fuente se recupera desde GitHub. Los datos de usuarios no viven en Vercel: se encuentran en PostgreSQL y Cloudinary mediante el backend.
