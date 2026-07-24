export const PRODUCTION_API_FALLBACK = 'https://web-production-eaeb4.up.railway.app'
export const DEVELOPMENT_API_FALLBACK = 'http://127.0.0.1:8000'

const stripApiSuffix = (value) => value.replace(/\/api\/?$/i, '')

export const normalizeApiOrigin = (value) => {
  const candidate = String(value || '').trim()
  if (!candidate) return ''

  try {
    const parsed = new URL(candidate)
    if (!['http:', 'https:'].includes(parsed.protocol)) return ''
    parsed.hash = ''
    parsed.search = ''
    parsed.pathname = stripApiSuffix(parsed.pathname).replace(/\/$/, '') || ''
    return parsed.toString().replace(/\/$/, '')
  } catch {
    return ''
  }
}

export const resolveApiOrigin = ({ configuredUrl = '', production = false } = {}) => {
  const configured = normalizeApiOrigin(configuredUrl)
  if (configured) return configured
  return production ? PRODUCTION_API_FALLBACK : DEVELOPMENT_API_FALLBACK
}

export const buildRuntimeConfig = (env = {}) => {
  const production = Boolean(env.PROD || env.MODE === 'production')
  const apiOrigin = resolveApiOrigin({
    configuredUrl: env.VITE_API_URL,
    production,
  })

  return Object.freeze({
    production,
    mode: env.MODE || (production ? 'production' : 'development'),
    appVersion: String(env.VITE_APP_VERSION || '11.5').trim() || '11.5',
    apiOrigin,
    apiBaseUrl: `${apiOrigin}/api`,
    healthUrl: `${apiOrigin}/api/health/`,
  })
}

export const runtimeConfig = buildRuntimeConfig(import.meta.env || {})
