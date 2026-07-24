export const PROFESSIONAL_ROLE_META = Object.freeze({
    clinic: { label: 'Veterinaria', icon: '🏥' },
    business: { label: 'Negocio', icon: '🛍️' },
    shelter: { label: 'Refugio o rescatista', icon: '🏠' },
})

export const PROFESSIONAL_STATUS_META = Object.freeze({
    pending: { label: 'Pendiente', className: 'is-pending', icon: '⏳' },
    in_review: { label: 'En revisión', className: 'is-review', icon: '🔎' },
    corrections: { label: 'Requiere correcciones', className: 'is-corrections', icon: '✏️' },
    verified: { label: 'Verificada', className: 'is-verified', icon: '✅' },
    rejected: { label: 'Rechazada', className: 'is-rejected', icon: '✕' },
    withdrawn: { label: 'Verificación retirada', className: 'is-withdrawn', icon: '↩️' },
})

export const PROFESSIONAL_ACTION_OPTIONS = Object.freeze([
    { value: 'review', label: 'Pasar a revisión', targetStatus: 'in_review' },
    { value: 'request_corrections', label: 'Pedir correcciones', targetStatus: 'corrections' },
    { value: 'verify', label: 'Verificar perfil', targetStatus: 'verified' },
    { value: 'reject', label: 'Rechazar verificación', targetStatus: 'rejected' },
    { value: 'withdraw', label: 'Retirar insignia', targetStatus: 'withdrawn' },
    { value: 'pending', label: 'Volver a pendiente', targetStatus: 'pending' },
])

const ACTIONS_REQUIRING_PUBLIC_NOTE = new Set(['request_corrections', 'reject', 'withdraw'])

export const requiresProfessionalPublicNote = (action) =>
    ACTIONS_REQUIRING_PUBLIC_NOTE.has(action)

export const canVerifyProfessionalProfile = (profile) => Boolean(profile?.is_approved)

export function getDefaultProfessionalAction(profile = {}) {
    if (profile.status === 'pending') return 'review'
    if (profile.status === 'in_review' || profile.status === 'corrections') {
        return canVerifyProfessionalProfile(profile) ? 'verify' : 'review'
    }
    if (profile.status === 'verified') return 'withdraw'
    return 'review'
}

export function getProfessionalProfileUrl(profile = {}) {
    if (!profile.profile_slug) return ''
    if (profile.role === 'clinic') return `/clinicas/${profile.profile_slug}`
    if (profile.role === 'business') return `/negocios/${profile.profile_slug}`
    if (profile.role === 'shelter') return `/refugios/${profile.profile_slug}`
    return ''
}
