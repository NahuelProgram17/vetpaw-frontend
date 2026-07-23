import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    getAccountModerationHistory,
    getModerationAccounts,
    moderateAccount,
} from '../services/api'
import './AdminAccountModeration.css'

const ROLE_META = {
    owner: { label: 'Dueño', icon: '🐾' },
    clinic: { label: 'Veterinaria', icon: '🏥' },
    business: { label: 'Negocio', icon: '🛍️' },
    shelter: { label: 'Refugio', icon: '🏠' },
}

const STATUS_META = {
    active: { label: 'Activa', className: 'is-active' },
    suspended: { label: 'Suspendida', className: 'is-suspended' },
    banned: { label: 'Expulsada', className: 'is-banned' },
    expired: { label: 'Vencida', className: 'is-expired' },
    revoked: { label: 'Revocada', className: 'is-revoked' },
}

const initialActionForm = {
    action: 'suspend',
    duration: '7',
    customEnd: '',
    reason: '',
    internalNote: '',
    sourceReportId: '',
    revocationNote: '',
}

const formatDate = (value, fallback = '—') => {
    if (!value) return fallback
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return fallback
    return parsed.toLocaleString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

const extractError = (error) => {
    const data = error?.response?.data
    if (!data) return 'No se pudo completar la acción.'
    if (typeof data === 'string') return data
    if (data.error || data.detail) {
        return typeof (data.error || data.detail) === 'string'
            ? (data.error || data.detail)
            : 'No se pudo completar la acción.'
    }
    const first = Object.values(data).flat().find(Boolean)
    return typeof first === 'string' ? first : 'No se pudo completar la acción.'
}

function SummaryCard({ icon, value, label, tone = '' }) {
    return (
        <div className={`account-moderation-summary-card ${tone}`}>
            <span className="account-moderation-summary-icon">{icon}</span>
            <div>
                <strong>{value ?? 0}</strong>
                <span>{label}</span>
            </div>
        </div>
    )
}

function Pagination({ page, next, previous, onChange }) {
    if (!next && !previous) return null
    return (
        <div className="account-moderation-pagination">
            <button type="button" disabled={!previous} onClick={() => onChange(previous)}>← Anterior</button>
            <span>Página {page}</span>
            <button type="button" disabled={!next} onClick={() => onChange(next)}>Siguiente →</button>
        </div>
    )
}

export default function AdminAccountModeration({ currentUserId }) {
    const [section, setSection] = useState('accounts')
    const [searchInput, setSearchInput] = useState('')
    const [filters, setFilters] = useState({ search: '', role: '', status: 'all', page: 1 })
    const [accountsData, setAccountsData] = useState({ summary: {}, results: [], page: 1 })
    const [historyFilters, setHistoryFilters] = useState({ kind: '', status: '', page: 1 })
    const [historyData, setHistoryData] = useState({ results: [], page: 1 })
    const [loading, setLoading] = useState(true)
    const [historyLoading, setHistoryLoading] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [selectedAccount, setSelectedAccount] = useState(null)
    const [form, setForm] = useState(initialActionForm)
    const [saving, setSaving] = useState(false)

    const loadAccounts = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const data = await getModerationAccounts({
                search: filters.search || undefined,
                role: filters.role || undefined,
                status: filters.status === 'all' ? undefined : filters.status,
                page: filters.page,
                page_size: 20,
            })
            setAccountsData(data)
        } catch (requestError) {
            setError(extractError(requestError))
        } finally {
            setLoading(false)
        }
    }, [filters])

    const loadHistory = useCallback(async () => {
        setHistoryLoading(true)
        setError('')
        try {
            const data = await getAccountModerationHistory({
                kind: historyFilters.kind || undefined,
                status: historyFilters.status || undefined,
                page: historyFilters.page,
                page_size: 20,
            })
            setHistoryData(data)
        } catch (requestError) {
            setError(extractError(requestError))
        } finally {
            setHistoryLoading(false)
        }
    }, [historyFilters])

    useEffect(() => {
        loadAccounts()
    }, [loadAccounts])

    useEffect(() => {
        if (section === 'history') loadHistory()
    }, [section, loadHistory])

    const summary = accountsData.summary || {}
    const accounts = accountsData.results || []
    const history = historyData.results || []

    const selectedStatus = selectedAccount?.account_status || 'active'
    const modalTitle = useMemo(() => {
        if (!selectedAccount) return ''
        if (form.action === 'reactivate') return `Reactivar a ${selectedAccount.username}`
        if (form.action === 'ban') return `Expulsar a ${selectedAccount.username}`
        return `Suspender a ${selectedAccount.username}`
    }, [selectedAccount, form.action])

    const submitSearch = (event) => {
        event.preventDefault()
        setFilters((current) => ({ ...current, search: searchInput.trim(), page: 1 }))
    }

    const openAction = (account, action) => {
        setSelectedAccount(account)
        setMessage('')
        setError('')
        setForm({ ...initialActionForm, action })
    }

    const closeModal = () => {
        if (saving) return
        setSelectedAccount(null)
        setForm(initialActionForm)
    }

    const submitAction = async (event) => {
        event.preventDefault()
        if (!selectedAccount) return

        const payload = { action: form.action }
        if (form.action === 'reactivate') {
            payload.revocation_note = form.revocationNote.trim()
        } else {
            if (!form.reason.trim()) {
                setError('El motivo visible para el usuario es obligatorio.')
                return
            }
            payload.reason = form.reason.trim()
            payload.internal_note = form.internalNote.trim()
            if (form.sourceReportId.trim()) payload.source_report_id = Number(form.sourceReportId)
            if (form.action === 'suspend') {
                if (form.duration === 'custom') {
                    if (!form.customEnd) {
                        setError('Elegí la fecha de finalización de la suspensión.')
                        return
                    }
                    const end = new Date(form.customEnd)
                    if (Number.isNaN(end.getTime())) {
                        setError('La fecha personalizada no es válida.')
                        return
                    }
                    payload.ends_at = end.toISOString()
                } else {
                    payload.days = Number(form.duration)
                }
            }
        }

        const confirmation = form.action === 'ban'
            ? `¿Expulsar permanentemente la cuenta “${selectedAccount.username}”? La cuenta quedará bloqueada hasta que la reactives manualmente.`
            : form.action === 'reactivate'
                ? `¿Reactivar la cuenta “${selectedAccount.username}”?`
                : `¿Suspender temporalmente la cuenta “${selectedAccount.username}”?`
        if (!window.confirm(confirmation)) return

        setSaving(true)
        setError('')
        try {
            const result = await moderateAccount(selectedAccount.id, payload)
            setMessage(result.message || 'La medida se aplicó correctamente.')
            setSelectedAccount(null)
            setForm(initialActionForm)
            await loadAccounts()
            if (section === 'history') await loadHistory()
        } catch (requestError) {
            setError(extractError(requestError))
        } finally {
            setSaving(false)
        }
    }

    return (
        <section className="account-moderation-panel">
            <div className="account-moderation-hero">
                <div>
                    <span className="account-moderation-kicker">Seguridad de VetPaw</span>
                    <h2>Moderación profesional de cuentas</h2>
                    <p>Suspensiones temporales, expulsiones permanentes, reactivaciones e historial completo sin eliminar los datos de ninguna mascota o perfil.</p>
                </div>
                <div className="account-moderation-hero-icon">🛡️</div>
            </div>

            <div className="account-moderation-summary">
                <SummaryCard icon="👥" value={summary.total_accounts} label="Cuentas registradas" />
                <SummaryCard icon="⏳" value={summary.active_suspensions} label="Suspensiones activas" tone="warning" />
                <SummaryCard icon="⛔" value={summary.permanent_bans} label="Expulsiones activas" tone="danger" />
                <SummaryCard icon="⌛" value={summary.expired_sanctions} label="Suspensiones vencidas" tone="muted" />
                <SummaryCard icon="✅" value={summary.revoked_sanctions} label="Medidas revocadas" tone="success" />
            </div>

            <div className="account-moderation-tabs" role="tablist" aria-label="Moderación de cuentas">
                <button type="button" className={section === 'accounts' ? 'active' : ''} onClick={() => setSection('accounts')}>👤 Cuentas</button>
                <button type="button" className={section === 'history' ? 'active' : ''} onClick={() => setSection('history')}>📚 Historial de sanciones</button>
            </div>

            {message && <div className="account-moderation-alert success">✅ {message}</div>}
            {error && <div className="account-moderation-alert error">⚠️ {error}</div>}

            {section === 'accounts' && (
                <>
                    <form className="account-moderation-filters" onSubmit={submitSearch}>
                        <label className="account-moderation-search">
                            <span>Buscar cuenta</span>
                            <div>
                                <input
                                    type="search"
                                    value={searchInput}
                                    onChange={(event) => setSearchInput(event.target.value)}
                                    placeholder="Usuario, email o nombre"
                                />
                                <button type="submit">Buscar</button>
                            </div>
                        </label>
                        <label>
                            <span>Tipo de cuenta</span>
                            <select value={filters.role} onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value, page: 1 }))}>
                                <option value="">Todos</option>
                                <option value="owner">Dueños</option>
                                <option value="clinic">Veterinarias</option>
                                <option value="business">Negocios</option>
                                <option value="shelter">Refugios</option>
                            </select>
                        </label>
                        <label>
                            <span>Estado</span>
                            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}>
                                <option value="all">Todas</option>
                                <option value="active">Activas</option>
                                <option value="suspended">Suspendidas</option>
                                <option value="banned">Expulsadas</option>
                            </select>
                        </label>
                    </form>

                    {loading ? (
                        <div className="account-moderation-empty"><span>🐾</span><h3>Cargando cuentas...</h3></div>
                    ) : accounts.length === 0 ? (
                        <div className="account-moderation-empty"><span>🔎</span><h3>No encontramos cuentas</h3><p>Probá con otros filtros o una búsqueda diferente.</p></div>
                    ) : (
                        <div className="account-moderation-account-list">
                            {accounts.map((account) => {
                                const role = ROLE_META[account.role] || { label: account.role_display || account.role, icon: '👤' }
                                const status = STATUS_META[account.account_status] || STATUS_META.active
                                const isSelf = Number(account.id) === Number(currentUserId)
                                return (
                                    <article className="account-moderation-account-card" key={account.id}>
                                        <div className="account-moderation-account-main">
                                            <div className="account-moderation-avatar">{role.icon}</div>
                                            <div className="account-moderation-account-copy">
                                                <div className="account-moderation-account-heading">
                                                    <h3>{account.profile_name || account.username}</h3>
                                                    <span className={`account-status-badge ${status.className}`}>{status.label}</span>
                                                </div>
                                                <p><strong>@{account.username}</strong> · {account.email || 'Sin email'}</p>
                                                <div className="account-moderation-account-meta">
                                                    <span>{role.icon} {role.label}</span>
                                                    <span>📅 Alta: {formatDate(account.date_joined)}</span>
                                                    <span>🗂️ {account.sanctions_count || 0} medidas registradas</span>
                                                </div>
                                                {account.active_sanction && (
                                                    <div className="account-moderation-current-sanction">
                                                        <strong>{account.active_sanction.kind_display}</strong>
                                                        <span>{account.active_sanction.reason}</span>
                                                        {account.active_sanction.ends_at && <small>Finaliza: {formatDate(account.active_sanction.ends_at)}</small>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="account-moderation-actions">
                                            {isSelf ? (
                                                <span className="account-moderation-self-note">Tu cuenta administradora está protegida.</span>
                                            ) : account.account_status === 'active' ? (
                                                <>
                                                    <button type="button" className="moderation-action suspend" onClick={() => openAction(account, 'suspend')}>⏳ Suspender</button>
                                                    <button type="button" className="moderation-action ban" onClick={() => openAction(account, 'ban')}>⛔ Expulsar</button>
                                                </>
                                            ) : (
                                                <>
                                                    {account.account_status === 'suspended' && <button type="button" className="moderation-action ban" onClick={() => openAction(account, 'ban')}>⛔ Expulsar</button>}
                                                    <button type="button" className="moderation-action reactivate" onClick={() => openAction(account, 'reactivate')}>✅ Reactivar</button>
                                                </>
                                            )}
                                        </div>
                                    </article>
                                )
                            })}
                        </div>
                    )}

                    <Pagination
                        page={accountsData.page || 1}
                        next={accountsData.next}
                        previous={accountsData.previous}
                        onChange={(page) => setFilters((current) => ({ ...current, page }))}
                    />
                </>
            )}

            {section === 'history' && (
                <>
                    <div className="account-moderation-filters history-filters">
                        <label>
                            <span>Tipo de medida</span>
                            <select value={historyFilters.kind} onChange={(event) => setHistoryFilters((current) => ({ ...current, kind: event.target.value, page: 1 }))}>
                                <option value="">Todas</option>
                                <option value="suspension">Suspensiones</option>
                                <option value="permanent_ban">Expulsiones permanentes</option>
                            </select>
                        </label>
                        <label>
                            <span>Estado de la medida</span>
                            <select value={historyFilters.status} onChange={(event) => setHistoryFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}>
                                <option value="">Todos</option>
                                <option value="active">Activas</option>
                                <option value="expired">Vencidas</option>
                                <option value="revoked">Revocadas</option>
                            </select>
                        </label>
                    </div>

                    {historyLoading ? (
                        <div className="account-moderation-empty"><span>📚</span><h3>Cargando historial...</h3></div>
                    ) : history.length === 0 ? (
                        <div className="account-moderation-empty"><span>✅</span><h3>No hay sanciones registradas</h3><p>Las decisiones de moderación aparecerán aquí.</p></div>
                    ) : (
                        <div className="account-moderation-history-list">
                            {history.map((sanction) => {
                                const status = STATUS_META[sanction.status] || STATUS_META.active
                                const role = ROLE_META[sanction.role] || { label: sanction.role_display || sanction.role, icon: '👤' }
                                return (
                                    <article className="account-moderation-history-card" key={sanction.id}>
                                        <div className="account-moderation-history-top">
                                            <div>
                                                <span className="history-kind">{sanction.kind === 'permanent_ban' ? '⛔' : '⏳'} {sanction.kind_display}</span>
                                                <h3>{role.icon} {sanction.username}</h3>
                                                <p>{sanction.email || 'Sin email'} · {role.label}</p>
                                            </div>
                                            <span className={`account-status-badge ${status.className}`}>{sanction.status_display}</span>
                                        </div>
                                        <div className="account-moderation-history-grid">
                                            <div><span>Motivo visible</span><strong>{sanction.reason}</strong></div>
                                            <div><span>Aplicada por</span><strong>{sanction.applied_by || 'Administrador'}</strong></div>
                                            <div><span>Inicio</span><strong>{formatDate(sanction.starts_at)}</strong></div>
                                            <div><span>Finalización</span><strong>{sanction.ends_at ? formatDate(sanction.ends_at) : 'Permanente'}</strong></div>
                                        </div>
                                        {sanction.internal_note && <p className="history-note"><strong>Nota interna:</strong> {sanction.internal_note}</p>}
                                        {sanction.source_report_id && <p className="history-report">🚩 Asociada al reporte #{sanction.source_report_id}</p>}
                                        {sanction.revoked_at && (
                                            <div className="history-revocation">
                                                <strong>Revocada por {sanction.revoked_by || 'Administrador'} el {formatDate(sanction.revoked_at)}</strong>
                                                {sanction.revocation_note && <span>{sanction.revocation_note}</span>}
                                            </div>
                                        )}
                                    </article>
                                )
                            })}
                        </div>
                    )}

                    <Pagination
                        page={historyData.page || 1}
                        next={historyData.next}
                        previous={historyData.previous}
                        onChange={(page) => setHistoryFilters((current) => ({ ...current, page }))}
                    />
                </>
            )}

            {selectedAccount && (
                <div className="account-moderation-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal() }}>
                    <div className={`account-moderation-modal ${form.action === 'ban' ? 'danger' : ''}`} role="dialog" aria-modal="true" aria-labelledby="account-moderation-title">
                        <button type="button" className="account-moderation-modal-close" onClick={closeModal} aria-label="Cerrar">×</button>
                        <div className="account-moderation-modal-icon">{form.action === 'reactivate' ? '✅' : form.action === 'ban' ? '⛔' : '⏳'}</div>
                        <h3 id="account-moderation-title">{modalTitle}</h3>
                        <p className="account-moderation-modal-subtitle">
                            {form.action === 'reactivate'
                                ? 'La persona recuperará el acceso a VetPaw inmediatamente.'
                                : form.action === 'ban'
                                    ? 'La cuenta quedará bloqueada permanentemente, pero sus datos no serán eliminados.'
                                    : 'La cuenta no podrá iniciar sesión hasta que finalice el período o la reactives.'}
                        </p>

                        <form onSubmit={submitAction}>
                            {form.action === 'suspend' && (
                                <label>
                                    <span>Duración de la suspensión</span>
                                    <select value={form.duration} onChange={(event) => setForm((current) => ({ ...current, duration: event.target.value }))}>
                                        <option value="1">1 día</option>
                                        <option value="3">3 días</option>
                                        <option value="7">7 días</option>
                                        <option value="15">15 días</option>
                                        <option value="30">30 días</option>
                                        <option value="custom">Fecha personalizada</option>
                                    </select>
                                </label>
                            )}

                            {form.action === 'suspend' && form.duration === 'custom' && (
                                <label>
                                    <span>Finaliza el</span>
                                    <input type="datetime-local" value={form.customEnd} onChange={(event) => setForm((current) => ({ ...current, customEnd: event.target.value }))} required />
                                </label>
                            )}

                            {form.action !== 'reactivate' ? (
                                <>
                                    <label>
                                        <span>Motivo visible para el usuario *</span>
                                        <textarea value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} maxLength={1000} rows={3} placeholder="Explicá claramente por qué se aplica esta medida." required />
                                    </label>
                                    <label>
                                        <span>Nota interna del administrador</span>
                                        <textarea value={form.internalNote} onChange={(event) => setForm((current) => ({ ...current, internalNote: event.target.value }))} maxLength={2000} rows={3} placeholder="Información privada para futuras revisiones." />
                                    </label>
                                    <label>
                                        <span>ID de reporte relacionado (opcional)</span>
                                        <input type="number" min="1" value={form.sourceReportId} onChange={(event) => setForm((current) => ({ ...current, sourceReportId: event.target.value }))} placeholder="Ejemplo: 27" />
                                        <small>Al asociarlo, ese reporte quedará marcado como resuelto.</small>
                                    </label>
                                </>
                            ) : (
                                <label>
                                    <span>Motivo de la reactivación</span>
                                    <textarea value={form.revocationNote} onChange={(event) => setForm((current) => ({ ...current, revocationNote: event.target.value }))} maxLength={1000} rows={3} placeholder="Ejemplo: Se revisó el caso y se levantó la medida." />
                                </label>
                            )}

                            {error && <div className="account-moderation-modal-error">⚠️ {error}</div>}
                            <div className="account-moderation-modal-actions">
                                <button type="button" className="cancel" onClick={closeModal} disabled={saving}>Cancelar</button>
                                <button type="submit" className={`confirm ${form.action}`} disabled={saving}>
                                    {saving ? 'Guardando...' : form.action === 'reactivate' ? 'Reactivar cuenta' : form.action === 'ban' ? 'Expulsar permanentemente' : 'Aplicar suspensión'}
                                </button>
                            </div>
                        </form>
                        {selectedStatus !== 'active' && form.action !== 'reactivate' && <p className="account-moderation-replace-note">La nueva medida reemplazará la sanción activa anterior y quedará registrada en el historial.</p>}
                    </div>
                </div>
            )}
        </section>
    )
}
