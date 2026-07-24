# 🐾 VetPaw — Frontend

Frontend oficial de **VetPaw**, la red social de las mascotas. Reúne comunidad, perfiles públicos, adopciones, mascotas perdidas, veterinarias, negocios, turnos, historial médico y mensajería.

- Producción: https://www.vetpaw.com.ar
- Backend: Django REST Framework en Railway
- Frontend: React 19 + Vite 8 en Vercel
- Versión estable: **1.0.0**

## Funciones principales

- Comunidad con publicaciones, patitas, comentarios, seguidores y perfiles públicos.
- Perfiles para dueños, veterinarias, negocios y refugios.
- Adopciones, ayuda a refugios y seguimiento de solicitudes.
- Mascotas perdidas y encontradas.
- Turnos veterinarios, libreta sanitaria e historial médico.
- Mensajería, notificaciones web push y PWA instalable.
- Catálogos, promociones y favoritos de negocios.
- Moderación, protección anti-spam y verificación profesional.
- Recuperación ante caídas de red y funcionamiento parcial sin conexión.

## Stack

- React 19
- React Router 7
- Axios
- Vite 8
- CSS personalizado y Tailwind CSS
- Service Worker propio
- Vercel

## Instalación local

```powershell
git clone https://github.com/NahuelProgram17/vetpaw-frontend.git
cd vetpaw-frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Para desarrollo local, cambiar en `.env`:

```env
VITE_API_URL=http://127.0.0.1:8000
VITE_APP_VERSION=dev
```

No agregar `/api` al final de `VITE_API_URL`. Aunque el código lo corrige de forma segura, mantener la variable limpia evita confusiones.

## Validación antes de cada deploy

```powershell
npm test
npm run lint
npm run build
npm run audit:production
```

También puede ejecutarse todo junto:

```powershell
npm run check:final
```

## Deploy

Vercel despliega automáticamente cada push a `main`.

Variables recomendadas en Vercel:

```env
VITE_API_URL=https://web-production-eaeb4.up.railway.app
VITE_APP_VERSION=1.0.0
```

Después de un deploy que modifique `public/sw.js`, hacer `Ctrl + F5` y cerrar/volver a abrir la PWA instalada para tomar la versión nueva.

## Documentación operativa

- `docs/VARIABLES_Y_VERCEL.md`
- `docs/PRODUCCION_PWA_Y_RECUPERACION.md`
- `docs/CHECKLIST_FINAL_FRONTEND.md`

## Seguridad

- No guardar tokens, contraseñas o claves privadas en el repositorio.
- Todas las variables expuestas con prefijo `VITE_` son públicas dentro del navegador.
- La URL del backend no es un secreto; VAPID privada, Cloudinary y Resend pertenecen al backend.

## Autor

**Nahuel Pedreyra**  
Correo: vetpaw.app@gmail.com  
GitHub: https://github.com/NahuelProgram17
