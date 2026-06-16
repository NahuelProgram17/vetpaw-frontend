# 🐾 VetPaw — Frontend

**Interfaz web de VetPaw**, la plataforma que conecta veterinarias con dueños de mascotas.

🌐 **App en producción:** [www.vetpaw.com.ar](https://www.vetpaw.com.ar)
📂 **Backend repo:** [vetpaw](https://github.com/NahuelProgram17/vetpaw)

---

## Stack

- **React 18** con **Vite**
- **React Router** para navegación SPA
- **CSS** personalizado con diseño responsive
- **JWT** para autenticación (tokens almacenados en el cliente)
- **Vercel** para deploy
- **Dominio propio:** vetpaw.com.ar

## Funcionalidades

- Landing page con información de la plataforma y mascotas perdidas
- Registro con selección de veterinaria y login
- Dashboard diferenciado por rol (dueño / veterinario / clínica)
- Gestión de mascotas: agregar, editar, ver ficha con foto
- Sistema de turnos: solicitar, ver estado, cancelar
- Reportes de mascotas perdidas con foto y ubicación
- Mensajería interna en tiempo real
- Sección de tips y consejos veterinarios
- Perfil de usuario editable
- Páginas legales (términos, privacidad, contacto)
- Formulario para sumar nuevas veterinarias
- Diseño mobile-first responsive

## Páginas principales

```
src/pages/
├── Home.jsx              # Landing page
├── Login.jsx             # Inicio de sesión
├── Register.jsx          # Registro de usuario
├── Dashboard.jsx         # Panel del dueño
├── VetDashboard.jsx      # Panel del veterinario
├── Pets.jsx              # Listado de mascotas
├── Appointments.jsx      # Gestión de turnos
├── Messages.jsx          # Mensajería
├── Profile.jsx           # Perfil del usuario
├── Clinics.jsx           # Directorio de clínicas
├── Tips.jsx              # Consejos veterinarios
├── LostPets.jsx          # Mascotas perdidas
├── Contacto.jsx          # Formulario de contacto
├── SumarVeterinaria.jsx  # Solicitud para veterinarias
├── TerminosCondiciones.jsx
└── Privacidad.jsx
```

## Instalación local

```bash
# Clonar el repositorio
git clone https://github.com/NahuelProgram17/vetpaw-frontend.git
cd vetpaw-frontend

# Instalar dependencias
npm install

# Configurar la URL del backend en .env
# VITE_API_URL=https://web-production-eaeb4.up.railway.app

# Iniciar en modo desarrollo
npm run dev
```

## Deploy

El frontend corre en **Vercel** con dominio personalizado `vetpaw.com.ar`.
Configurado con `vercel.json` para soportar React Router (SPA rewrites).

## Paleta de colores

| Color | Hex | Uso |
|-------|-----|-----|
| Verde principal | `#4CAF50` | Botones, acentos, hover |
| Verde claro | `#66BB6A` | Degradados |
| Naranja | `#FF9800` | CTAs, degradados |
| Naranja claro | `#FFB74D` | Acentos secundarios |
| Fondo oscuro | `#0f1923` | Background principal |

**Tipografía:** Plus Jakarta Sans, Nunito

## Autor

**Nahuel Pedreyra**
📧 vetpaw.app@gmail.com
🔗 [LinkedIn](https://www.linkedin.com/in/nahuelprogram17/)
💻 [GitHub](https://github.com/NahuelProgram17)
