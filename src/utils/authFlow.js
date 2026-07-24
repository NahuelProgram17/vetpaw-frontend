import { canAccessAdmin, canModerateCommunity } from './permissions.js'

export const ROLE_HOME_PATHS = Object.freeze({
    owner: '/dashboard',
    clinic: '/clinic/dashboard',
    business: '/business/dashboard',
    shelter: '/shelter/dashboard',
})

const PROFESSIONAL_ROLES = new Set(['clinic', 'business', 'shelter'])
const SANCTION_CODES = new Set(['account_suspended', 'account_banned'])

export const getHomeForRole = (role, fallback = '/comunidad') =>
    ROLE_HOME_PATHS[role] || fallback

export const isPendingProfessional = (user) => Boolean(
    user && PROFESSIONAL_ROLES.has(user.role) && !user.is_approved
)

export function getProtectedRouteDecision({ user, loading = false, role = '', permission = '' } = {}) {
    if (loading) return { kind: 'loading' }
    if (!user) return { kind: 'redirect', to: '/login' }
    if (isPendingProfessional(user)) return { kind: 'pending_approval', role: user.role }

    if (permission === 'admin' && !canAccessAdmin(user)) {
        return { kind: 'redirect', to: '/' }
    }

    if (permission === 'moderator' && !canModerateCommunity(user)) {
        return { kind: 'redirect', to: '/' }
    }

    if (role && user.role !== role) {
        return { kind: 'redirect', to: getHomeForRole(user.role, '/') }
    }

    return { kind: 'allow' }
}

export const isAccountSanctionCode = (code) => SANCTION_CODES.has(code)

export function buildAccountSanction(data = {}) {
    if (!isAccountSanctionCode(data?.code)) return null
    return {
        code: data.code,
        detail: data.detail,
        sanction: data.account_sanction || null,
    }
}

export function parseLoginFailure(data = {}) {
    const sanction = buildAccountSanction(data)
    if (sanction) return { sanction, error: '' }

    return {
        sanction: null,
        error: typeof data?.detail === 'string'
            ? data.detail
            : 'Credenciales incorrectas. Intentá de nuevo.',
    }
}

export function formatSanctionDate(value, locale = 'es-AR') {
    if (!value) return ''
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return ''
    return parsed.toLocaleString(locale, {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}
