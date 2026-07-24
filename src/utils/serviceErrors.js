export const SERVICE_STATUS_EVENT = 'vetpaw:service-status'
export const SERVICE_RECOVERED_EVENT = 'vetpaw:service-recovered'

const readHeader = (headers, name) => {
  if (!headers) return ''
  if (typeof headers.get === 'function') return headers.get(name) || ''

  const normalized = String(name).toLowerCase()
  const entry = Object.entries(headers).find(([key]) => String(key).toLowerCase() === normalized)
  return entry ? String(entry[1] ?? '') : ''
}

const safeDetail = (data) => {
  if (typeof data?.detail === 'string' && data.detail.trim()) return data.detail.trim()
  if (typeof data?.message === 'string' && data.message.trim()) return data.message.trim()
  return ''
}

export function normalizeApiFailure({
  status = 0,
  data = {},
  headers = {},
  code = '',
  online = true,
} = {}) {
  const requestId = readHeader(headers, 'x-request-id')
  const retryAfterValue = Number(readHeader(headers, 'retry-after'))
  const retryAfter = Number.isFinite(retryAfterValue) && retryAfterValue > 0
    ? Math.ceil(retryAfterValue)
    : 30

  if (!online) {
    return {
      kind: 'offline',
      message: 'No tenés conexión a internet. VetPaw conservará esta pantalla y podrás reintentar cuando vuelva la señal.',
      requestId,
      retryAfter,
      retryable: true,
      global: true,
    }
  }

  if (status === 503) {
    return {
      kind: 'unavailable',
      message: safeDetail(data) || 'VetPaw está temporalmente ocupado. Tus datos siguen seguros; probá nuevamente en unos segundos.',
      requestId,
      retryAfter,
      retryable: true,
      global: true,
    }
  }

  if (!status && ['ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT'].includes(String(code).toUpperCase())) {
    return {
      kind: 'connection',
      message: 'No pudimos comunicarnos con VetPaw. Revisá tu conexión y volvé a intentar.',
      requestId,
      retryAfter,
      retryable: true,
      global: true,
    }
  }

  if (status >= 500) {
    return {
      kind: 'server',
      message: safeDetail(data) || 'VetPaw tuvo un inconveniente al procesar esta acción. Volvé a intentar en unos instantes.',
      requestId,
      retryAfter,
      retryable: true,
      global: false,
    }
  }

  return {
    kind: 'request',
    message: safeDetail(data) || 'No pudimos completar esta acción. Revisá los datos e intentá nuevamente.',
    requestId,
    retryAfter,
    retryable: false,
    global: false,
  }
}

export function buildServiceStatusDetail(failure = {}) {
  return {
    kind: failure.kind || 'connection',
    message: failure.message || 'No pudimos comunicarnos con VetPaw.',
    requestId: failure.requestId || '',
    retryAfter: Number.isFinite(Number(failure.retryAfter)) ? Number(failure.retryAfter) : 30,
  }
}
