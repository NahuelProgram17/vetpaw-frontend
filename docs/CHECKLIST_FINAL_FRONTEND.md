# Checklist final del frontend

## Antes del push

- [ ] `npm test` muestra 45 pruebas aprobadas.
- [ ] `npm run lint` termina sin errores ni advertencias.
- [ ] `npm run build` termina con `✓ built`.
- [ ] `npm run audit:production` termina en `RESULTADO: OK`.
- [ ] `git status` contiene únicamente los archivos esperados.
- [ ] No existen `.env`, tokens o secretos preparados para commit.

## Vercel

- [ ] Deployment en estado **Ready**.
- [ ] `www.vetpaw.com.ar` abre con HTTPS.
- [ ] `VITE_API_URL` apunta a Railway.
- [ ] `VITE_APP_VERSION` coincide con la versión desplegada.
- [ ] Navegación directa a `/comunidad`, `/adopciones` y `/login` funciona.
- [ ] `/robots.txt` y `/sitemap.xml` responden correctamente.

## PWA y conexión

- [ ] La instalación de VetPaw sigue disponible.
- [ ] Notificaciones push siguen funcionando.
- [ ] Al desconectarse aparece el aviso sin cerrar la sesión.
- [ ] Al volver internet aparece “Conexión restablecida”.
- [ ] Una pantalla visitada puede recuperarse sin conexión.
- [ ] La pantalla `/offline.html` se ve correctamente.

## Flujo rápido de usuarios

- [ ] Dueño: login, mascota, publicación, comentario y turno.
- [ ] Veterinaria: panel, agenda, perfil y publicación profesional.
- [ ] Negocio: catálogo, promoción y reserva.
- [ ] Refugio: adopción, solicitud y actualización de estado.
- [ ] Administrador: moderación, verificación y estadísticas.

## Cierre

Cuando todos los puntos estén correctos, VetPaw queda en versión estable **1.0.0**. Las mejoras futuras deben desarrollarse en etapas nuevas y siempre conservar tests, lint, build y auditoría de producción.
