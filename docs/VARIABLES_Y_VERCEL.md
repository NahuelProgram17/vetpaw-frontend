# Variables y configuración de Vercel

## Variables del frontend

### `VITE_API_URL`

URL pública del backend, sin `/api` al final.

```env
VITE_API_URL=https://web-production-eaeb4.up.railway.app
```

El frontend normaliza barras finales y también corrige una URL que termine accidentalmente en `/api`. En producción, si Vercel pierde esta variable, existe una alternativa segura hacia el backend oficial y nunca se usa `localhost`.

### `VITE_APP_VERSION`

Identificador visible únicamente en pantallas de diagnóstico.

```env
VITE_APP_VERSION=1.0.0
```

## Cómo revisar variables en Vercel

1. Abrir el proyecto de VetPaw en Vercel.
2. Entrar en **Settings → Environment Variables**.
3. Confirmar las dos variables para **Production**.
4. No usar comillas ni espacios al final.
5. Después de modificar una variable, realizar un nuevo deployment.

## Información que nunca debe ir en Vercel Frontend

No agregar:

- `SECRET_KEY` de Django.
- contraseña o URL privada de PostgreSQL.
- clave privada VAPID.
- credenciales de Resend.
- secretos de Cloudinary.
- contraseñas administrativas.

Todo valor con prefijo `VITE_` queda incorporado al JavaScript público y puede ser visto por cualquier visitante.

## Dominio

Dominio canónico:

```text
https://www.vetpaw.com.ar
```

Revisar en **Settings → Domains** que el dominio aparezca como válido y que HTTPS esté activo.
