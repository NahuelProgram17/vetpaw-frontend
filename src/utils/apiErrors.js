export function normalizeRateLimitResponse(data = {}) {
    const waitSeconds = Number(data?.available_in || data?.wait || 0)
    const safeWaitSeconds = Number.isFinite(waitSeconds) && waitSeconds > 0 ? waitSeconds : 0
    const waitMinutes = safeWaitSeconds > 0 ? Math.max(1, Math.ceil(safeWaitSeconds / 60)) : 0
    const waitText = waitMinutes > 0
        ? ` Esperá ${waitMinutes} minuto(s) antes de volver a intentarlo.`
        : ''

    return {
        ...data,
        detail: `Hiciste demasiadas acciones en poco tiempo.${waitText} VetPaw bloqueó solo esta acción para proteger la Comunidad.`,
        code: data?.code || 'rate_limited',
    }
}
