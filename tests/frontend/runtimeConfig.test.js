import test from 'node:test'
import assert from 'node:assert/strict'

import {
  DEVELOPMENT_API_FALLBACK,
  PRODUCTION_API_FALLBACK,
  buildRuntimeConfig,
  normalizeApiOrigin,
  resolveApiOrigin,
} from '../../src/config/runtime.js'

test('normaliza la URL configurada y elimina barras finales', () => {
  assert.equal(
    normalizeApiOrigin(' https://api.vetpaw.com.ar/ '),
    'https://api.vetpaw.com.ar',
  )
})

test('acepta una variable que por error termina en /api sin duplicarla', () => {
  assert.equal(
    normalizeApiOrigin('https://api.vetpaw.com.ar/api/'),
    'https://api.vetpaw.com.ar',
  )
})

test('rechaza protocolos que no sean HTTP o HTTPS', () => {
  assert.equal(normalizeApiOrigin('javascript:alert(1)'), '')
  assert.equal(normalizeApiOrigin('ftp://vetpaw.com.ar'), '')
})

test('producción nunca cae en localhost cuando falta la variable', () => {
  assert.equal(resolveApiOrigin({ production: true }), PRODUCTION_API_FALLBACK)
})

test('desarrollo conserva el servidor local como alternativa', () => {
  assert.equal(resolveApiOrigin({ production: false }), DEVELOPMENT_API_FALLBACK)
})

test('la configuración construye una única base para API y salud', () => {
  const result = buildRuntimeConfig({
    PROD: true,
    MODE: 'production',
    VITE_API_URL: 'https://backend.example.com/api',
    VITE_APP_VERSION: '2026.07.24',
  })

  assert.equal(result.apiOrigin, 'https://backend.example.com')
  assert.equal(result.apiBaseUrl, 'https://backend.example.com/api')
  assert.equal(result.healthUrl, 'https://backend.example.com/api/health/')
  assert.equal(result.appVersion, '2026.07.24')
})
