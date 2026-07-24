import test from 'node:test'
import assert from 'node:assert/strict'

import { normalizeRateLimitResponse } from '../../src/utils/apiErrors.js'

test('el límite anti-spam muestra un mensaje claro sin tiempo informado', () => {
    const result = normalizeRateLimitResponse({})
    assert.equal(result.code, 'rate_limited')
    assert.match(result.detail, /VetPaw bloqueó solo esta acción/)
    assert.doesNotMatch(result.detail, /Esperá/)
})

test('el límite anti-spam redondea la espera hacia arriba', () => {
    assert.match(normalizeRateLimitResponse({ available_in: 1 }).detail, /Esperá 1 minuto/)
    assert.match(normalizeRateLimitResponse({ available_in: 61 }).detail, /Esperá 2 minuto/)
})

test('el límite anti-spam conserva el código específico del backend', () => {
    const result = normalizeRateLimitResponse({ code: 'message_rate_limited', wait: 120, extra: 'dato' })
    assert.equal(result.code, 'message_rate_limited')
    assert.equal(result.extra, 'dato')
    assert.match(result.detail, /Esperá 2 minuto/)
})

test('un tiempo inválido no genera NaN en el mensaje', () => {
    const result = normalizeRateLimitResponse({ wait: 'no-numérico' })
    assert.doesNotMatch(result.detail, /NaN/)
})
