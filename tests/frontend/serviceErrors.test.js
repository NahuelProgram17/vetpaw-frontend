import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildServiceStatusDetail,
  normalizeApiFailure,
  SERVICE_RECOVERED_EVENT,
  SERVICE_STATUS_EVENT,
} from '../../src/utils/serviceErrors.js'

test('el evento global de conectividad conserva un nombre estable', () => {
  assert.equal(SERVICE_STATUS_EVENT, 'vetpaw:service-status')
  assert.equal(SERVICE_RECOVERED_EVENT, 'vetpaw:service-recovered')
})

test('sin internet se informa un estado recuperable sin perder datos', () => {
  const result = normalizeApiFailure({ online: false })
  assert.equal(result.kind, 'offline')
  assert.equal(result.retryable, true)
  assert.equal(result.global, true)
  assert.match(result.message, /No tenés conexión/)
})

test('un 503 conserva el identificador de Railway y Retry-After', () => {
  const result = normalizeApiFailure({
    status: 503,
    data: { detail: 'Servicio temporalmente no disponible.' },
    headers: { 'X-Request-ID': 'req-123', 'Retry-After': '45' },
  })
  assert.equal(result.kind, 'unavailable')
  assert.equal(result.requestId, 'req-123')
  assert.equal(result.retryAfter, 45)
  assert.equal(result.message, 'Servicio temporalmente no disponible.')
})

test('un error de red con internet activo se diferencia del modo offline', () => {
  const result = normalizeApiFailure({ code: 'ERR_NETWORK', online: true })
  assert.equal(result.kind, 'connection')
  assert.equal(result.global, true)
  assert.match(result.message, /comunicarnos con VetPaw/)
})

test('un error interno muestra un mensaje seguro y no activa una caída global', () => {
  const result = normalizeApiFailure({ status: 500, data: {} })
  assert.equal(result.kind, 'server')
  assert.equal(result.global, false)
  assert.equal(result.retryable, true)
  assert.doesNotMatch(result.message, /traceback|database|password/i)
})

test('los errores normales conservan el mensaje claro del backend', () => {
  const result = normalizeApiFailure({ status: 400, data: { detail: 'Revisá el email ingresado.' } })
  assert.equal(result.kind, 'request')
  assert.equal(result.message, 'Revisá el email ingresado.')
  assert.equal(result.retryable, false)
})

test('el detalle del banner aplica valores seguros por defecto', () => {
  assert.deepEqual(buildServiceStatusDetail({}), {
    kind: 'connection',
    message: 'No pudimos comunicarnos con VetPaw.',
    requestId: '',
    retryAfter: 30,
  })
})
