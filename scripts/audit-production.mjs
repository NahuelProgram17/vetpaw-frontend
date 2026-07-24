import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const errors = []
const warnings = []
const ok = []

const read = (path) => readFileSync(resolve(root, path), 'utf8')
const requireFile = (path) => {
  if (!existsSync(resolve(root, path))) errors.push(`Falta ${path}`)
  else ok.push(path)
}

[
  '.env.example',
  'index.html',
  'vercel.json',
  'public/manifest.json',
  'public/sw.js',
  'public/offline.html',
  'public/robots.txt',
  'public/sitemap.xml',
].forEach(requireFile)

if (errors.length === 0) {
  const vercel = JSON.parse(read('vercel.json'))
  const manifest = JSON.parse(read('public/manifest.json'))
  const index = read('index.html')
  const sw = read('public/sw.js')
  const envExample = read('.env.example')

  if (!vercel.rewrites?.some((item) => item.destination === '/index.html')) {
    errors.push('Vercel no conserva la navegación SPA hacia index.html.')
  }
  if (!JSON.stringify(vercel.headers || []).includes('no-cache, no-store, must-revalidate')) {
    errors.push('El Service Worker no tiene encabezado no-cache.')
  }
  if (!JSON.stringify(vercel.headers || []).includes('X-Content-Type-Options')) {
    errors.push('Faltan encabezados básicos de seguridad en Vercel.')
  }
  if (manifest.start_url !== '/' || manifest.scope !== '/' || manifest.display !== 'standalone') {
    errors.push('El manifest no está listo para instalar VetPaw como PWA.')
  }
  if (!index.includes('https://www.vetpaw.com.ar/')) {
    errors.push('El dominio canónico final no está definido en index.html.')
  }
  if (!sw.includes("vetpaw-shell-v5") || !sw.includes("/offline.html")) {
    errors.push('El Service Worker final v5 o la pantalla offline no están activos.')
  }
  if (!envExample.includes('VITE_API_URL=https://')) {
    errors.push('.env.example no documenta una API HTTPS.')
  }
}

const configuredApi = String(process.env.VITE_API_URL || '').trim()
if (configuredApi && !configuredApi.startsWith('https://')) {
  errors.push('VITE_API_URL debe usar HTTPS para una auditoría de producción.')
} else if (!configuredApi) {
  warnings.push('VITE_API_URL no está cargada en esta terminal; se validó el valor documentado en .env.example.')
}

console.log('\nVetPaw — auditoría final del frontend')
console.log(`Archivos y controles correctos: ${ok.length}`)
warnings.forEach((item) => console.warn(`ADVERTENCIA: ${item}`))

if (errors.length) {
  errors.forEach((item) => console.error(`ERROR: ${item}`))
  process.exitCode = 1
} else {
  console.log('RESULTADO: OK — configuración lista para producción.')
}
