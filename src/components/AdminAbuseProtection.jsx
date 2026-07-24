import { useCallback, useEffect, useState } from 'react'
import {
    getAbuseAccounts,
    getAbuseSignals,
    moderateAccount,
    reviewAbuseSignal,
} from '../services/api'
import './AdminAbuseProtection.css'

const CATEGORY_META = {
    rate_limit: { label: 'Límite de acciones', icon: '⏱️' },
    duplicate_content: { label: 'Contenido repetido', icon: '📄' },
    repeated_link: { label: 'Enlace repetido', icon: '🔗' },
    mass_follow: { label: 'Seguimientos masivos', icon: '👥' },
    false_report: { label: 'Reportes reiterados', icon: '🚩' },
    registration_burst: { label: 'Registros acelerados', icon: '⚡' },
    account_risk: { label: 'Cuenta sospechosa', icon: '🕵️' },
}

const SEVERITY_META = {
    info: { label: 'Informativa', className: 'is-info' },
    warning: { label: 'En observación', className: 'is-warning' },
    high: { label: 'Riesgo alto', className: 'is-high' },
}

const SIGNAL_STATUS_META = {
    pending: { label: 'Pendiente', className: 'is-pending' },
    reviewed: { label: 'Revisada', className: 'is-reviewed' },
    dismissed: { label: 'Descartada', className: 'is-dismissed' },
    actioned: { label: 'Se tomó una medida', className: 'is-actioned' },
}

const RISK_META = {
    normal: { label: 'Normal', icon: '✅', className: 'is-normal' },
    watch: { label: 'En observación', icon: '👀', className: 'is-watch' },
    high_risk: { label: 'Riesgo alto', icon: '⚠️', className: 'is-high' },
    temporarily_blocked: { label: 'Bloqueada temporalmente', icon: '⏳', className: 'is-blocked' },
    banned: { label: 'Expulsada', icon: '⛔', className: 'is-banned' },
}

const ROLE_META = {
    owner: { label: 'Dueño', icon: '🐾' },
    clinic: { label: 'Veterinaria', icon: '🏥' },
    business: { label: 'Negocio', icon: '🛍️' },
    shelter: { label: 'Refugio', icon: '🏠' },
}

const initialSanctionForm = {
    action: 'suspend',
    duration: '7',
    customEnd: '',
    reason: '',
    internalNote: '',
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
    if (typeof data.error === 'string') return data.error
    if (typeof data.detail === 'string') return data.detail
    const first = Object.values(data).flat().find(Boolean)
    return typeof first === 'string' ? first : 'No se pudo completar la acción.'
}

function SummaryCard({ icon, value, label, tone = '' }) {
    return (
        <div className={`abuse-summary-card ${tone}`}>
            <span>{icon}</span>
            <div>
                <strong>{value ?? 0}</strong>
                <small>{label}</small>
            </div>
        </div>
    )
}

function Pagination({ page, next, previous, onChange }) {
    if (!next && !previous) return null
    return (
        <div className="abuse-pagination">
            <button type="button" disabled={!previous} onClick={() => onChange(previous)}>← Anterior</button>
            <span>Página {page}</span>
            <button type="button" disabled={!next} onClick={() => onChange(next)}>Siguiente →</button>
        </div>
    )
}

function SignalBadge({ type, value }) {
    const meta = type === 'severity' ? SEVERITY_META[value] : SIGNAL_STATUS_META[value]
    if (!meta) return null
    return <span className={`abuse-badge ${meta.className}`}>{meta.label}</span>
}

export default function AdminAbuseProtection({ currentUserId }) {
    const [section, setSection] = useState('signals')
    const [searchInput, setSearchInput] = useState('')
    const [signalFilters, setSignalFilters] = useState({ search: '', status: 'pending', category: '', severity: '', user_id: '', page: 1 })
    const [accountFilters, setAccountFilters] = useState({ search: '', role: '', risk: '', page: 1 })
    const [accountSearchInput, setAccountSearchInput] = useState('')
    const [signalsData, setSignalsData] = useState({ summary: {}, results: [], page: 1 })
    const [accountsData, setAccountsData] = useState({ results: [], page: 1 })
    const [loadingSignals, setLoadingSignals] = useState(true)
    const [loadingAccounts, setLoadingAccounts] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [reviewModal, setReviewModal] = useState(null)
    const [reviewNotes, setReviewNotes] = useState('')
    const [sanctionModal, setSanctionModal] = useState(null)
    const [sanctionForm, setSanctionForm] = useState(initialSanctionForm)
    const [saving, setSaving] = useState(false)

    const loadSignals = useCallback(async () => {
        setLoadingSignals(true)
        setError('')
        try {
            const data = await getAbuseSignals({
                search: signalFilters.search || undefined,
                status: signalFilters.status || undefined,
                category: signalFilters.category || undefined,
                severity: signalFilters.severity || undefined,
                user_id: signalFilters.user_id || undefined,
                page: signalFilters.page,
                page_size: 20,
            })
            setSignalsData(data)
        } catch (requestError) {
            setError(extractError(requestError))
        } finally {
            setLoadingSignals(false)
        }
    }, [signalFilters])

    const loadAccounts = useCallback(async () => {
        setLoadingAccounts(true)
        setError('')
        try {
            const data = await getAbuseAccounts({
                search: accountFilters.search || undefined,
                role: accountFilters.role || undefined,
                risk: accountFilters.risk || undefined,
                page: accountFilters.page,
                page_size: 20,
            })
            setAccountsData(data)
        } catch (requestError) {
            setError(extractError(requestError))
        } finally {
            setLoadingAccounts(false)
        }
    }, [accountFilters])

    useEffect(() => {
        loadSignals()
    }, [loadSignals])

    useEffect(() => {
        if (section === 'accounts') loadAccounts()
    }, [section, loadAccounts])

    const signals = signalsData.results || []
    const accounts = accountsData.results || []
    const summary = signalsData.summary || {}

    const activeFilterAccount = signalFilters.user_id
        ? accounts.find((row) => String(row.user_id) === String(signalFilters.user_id))
        : null
    const activeFilterLabel = signalFilters.user_id
        ? (activeFilterAccount ? `Señales de ${activeFilterAccount.username}` : `Señales de la cuenta #${signalFilters.user_id}`)
        : ''

    const submitSignalSearch = (event) => {
        event.preventDefault()
        setSignalFilters((current) => ({ ...current, search: searchInput.trim(), page: 1 }))
    }

    const submitAccountSearch = (event) => {
        event.preventDefault()
        setAccountFilters((current) => ({ ...current, search: accountSearchInput.trim(), page: 1 }))
    }

    const openReview = (signal, decision) => {
        setReviewModal({ signal, decision })
        setReviewNotes(signal.moderator_notes || '')
        setError('')
        setMessage('')
    }

    const submitReview = async (event) => {
        event.preventDefault()
        if (!reviewModal) return
        setSaving(true)
        setError('')
        try {
            const result = await reviewAbuseSignal(reviewModal.signal.id, {
                decision: reviewModal.decision,
                notes: reviewNotes.trim(),
            })
            setMessage(result.message || 'La señal fue actualizada.')
            setReviewModal(null)
            setReviewNotes('')
            await loadSignals()
            if (section === 'accounts') await loadAccounts()
        } catch (requestError) {
            setError(extractError(requestError))
        } finally {
            setSaving(false)
        }
    }

    const openSanction = ({ userId, username, signal = null, action = 'suspend' }) => {
        setSanctionModal({ userId, username, signal })
        setSanctionForm({ ...initialSanctionForm, action })
        setError('')
        setMessage('')
    }

    const submitSanction = async (event) => {
        event.preventDefault()
        if (!sanctionModal) return
        if (!sanctionForm.reason.trim()) {
            setError('El motivo visible para la persona es obligatorio.')
            return
        }

        const payload = {
            action: sanctionForm.action,
            reason: sanctionForm.reason.trim(),
            internal_note: sanctionForm.internalNote.trim(),
        }
        if (sanctionModal.signal?.id) payload.source_abuse_signal_id = sanctionModal.signal.id
        if (sanctionForm.action === 'suspend') {
            if (sanctionForm.duration === 'custom') {
                if (!sanctionForm.customEnd) {
                    setError('Elegí la fecha de finalización de la suspensión.')
                    return
                }
                const end = new Date(sanctionForm.customEnd)
                if (Number.isNaN(end.getTime())) {
                    setError('La fecha personalizada no es válida.')
                    return
                }
                payload.ends_at = end.toISOString()
            } else {
                payload.days = Number(sanctionForm.duration)
            }
        }

        const confirmation = sanctionForm.action === 'ban'
            ? `¿Expulsar permanentemente a “${sanctionModal.username}”?`
            : `¿Suspender temporalmente a “${sanctionModal.username}”?`
        if (!window.confirm(confirmation)) return

        setSaving(true)
        setError('')
        try {
            const result = await moderateAccount(sanctionModal.userId, payload)
            setMessage(result.message || 'La medida se aplicó correctamente.')
            setSanctionModal(null)
            setSanctionForm(initialSanctionForm)
            await loadSignals()
            await loadAccounts()
        } catch (requestError) {
            setError(extractError(requestError))
        } finally {
            setSaving(false)
        }
    }

    const viewAccountSignals = (account) => {
        setSection('signals')
        setSignalFilters({ search: '', status: '', category: '', severity: '', user_id: String(account.user_id), page: 1 })
        setSearchInput('')
    }

    return (
        <section className="abuse-protection-panel">
            <div className="abuse-hero">
                <div>
                    <span className="abuse-kicker">Protección automática</span>
                    <h2>Abuso, spam y cuentas sospechosas</h2>
                    <p>VetPaw frena ráfagas y repeticiones, registra las señales y deja la decisión final de sancionar siempre en tus manos.</p>
                </div>
                <div className="abuse-hero-icon">🚨</div>
            </div>

            <div className="abuse-summary">
                <SummaryCard icon="📥" value={summary.pending} label="Señales pendientes" tone="warning" />
                <SummaryCard icon="⚠️" value={summary.high_risk_pending} label="Riesgo alto pendiente" tone="danger" />
                <SummaryCard icon="🕐" value={summary.last_24_hours} label="Detectadas en 24 horas" />
                <SummaryCard icon="👤" value={summary.accounts_flagged} label="Cuentas señaladas" />
                <SummaryCard icon="🌐" value={summary.origins_without_account} label="Orígenes sin cuenta" tone="muted" />
            </div>

            <div className="abuse-tabs" role="tablist" aria-label="Protección contra abuso">
                <button type="button" className={section === 'signals' ? 'active' : ''} onClick={() => setSection('signals')}>🚨 Señales detectadas</button>
                <button type="button" className={section === 'accounts' ? 'active' : ''} onClick={() => setSection('accounts')}>🕵️ Cuentas en observación</button>
            </div>

            {message && <div className="abuse-alert success">✅ {message}</div>}
            {error && <div className="abuse-alert error">⚠️ {error}</div>}

            {section === 'signals' && (
                <>
                    {activeFilterLabel && (
                        <div className="abuse-account-filter-note">
                            <span>🔎 {activeFilterLabel}</span>
                            <button type="button" onClick={() => setSignalFilters((current) => ({ ...current, user_id: '', page: 1 }))}>Ver todas</button>
                        </div>
                    )}
                    <form className="abuse-filters" onSubmit={submitSignalSearch}>
                        <label className="abuse-search">
                            <span>Buscar</span>
                            <div>
                                <input type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Usuario, email, contenido o IP" />
                                <button type="submit">Buscar</button>
                            </div>
                        </label>
                        <label>
                            <span>Estado</span>
                            <select value={signalFilters.status} onChange={(event) => setSignalFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}>
                                <option value="">Todos</option>
                                <option value="pending">Pendientes</option>
                                <option value="reviewed">Revisadas</option>
                                <option value="dismissed">Descartadas</option>
                                <option value="actioned">Con medida tomada</option>
                            </select>
                        </label>
                        <label>
                            <span>Categoría</span>
                            <select value={signalFilters.category} onChange={(event) => setSignalFilters((current) => ({ ...current, category: event.target.value, page: 1 }))}>
                                <option value="">Todas</option>
                                {Object.entries(CATEGORY_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
                            </select>
                        </label>
                        <label>
                            <span>Riesgo</span>
                            <select value={signalFilters.severity} onChange={(event) => setSignalFilters((current) => ({ ...current, severity: event.target.value, page: 1 }))}>
                                <option value="">Todos</option>
                                <option value="info">Informativa</option>
                                <option value="warning">En observación</option>
                                <option value="high">Riesgo alto</option>
                            </select>
                        </label>
                    </form>

                    {loadingSignals ? (
                        <div className="abuse-empty"><span>🐾</span><h3>Cargando señales...</h3></div>
                    ) : signals.length === 0 ? (
                        <div className="abuse-empty"><span>✅</span><h3>No hay señales con estos filtros</h3><p>VetPaw no encontró actividad pendiente para mostrar.</p></div>
                    ) : (
                        <div className="abuse-signal-list">
                            {signals.map((signal) => {
                                const category = CATEGORY_META[signal.category] || { label: signal.category_display, icon: '🚨' }
                                const role = ROLE_META[signal.role] || { label: signal.role_display || 'Cuenta', icon: '👤' }
                                const canSanction = Boolean(signal.user_id) && Number(signal.user_id) !== Number(currentUserId)
                                return (
                                    <article className={`abuse-signal-card severity-${signal.severity}`} key={signal.id}>
                                        <div className="abuse-signal-top">
                                            <div className="abuse-signal-title">
                                                <span className="abuse-signal-icon">{category.icon}</span>
                                                <div>
                                                    <div className="abuse-signal-heading-row">
                                                        <h3>{category.label}</h3>
                                                        <SignalBadge type="severity" value={signal.severity} />
                                                        <SignalBadge type="status" value={signal.status} />
                                                    </div>
                                                    <p>
                                                        {signal.user_id ? `${role.icon} ${signal.profile_name || signal.username} · @${signal.username}` : '🌐 Origen sin cuenta'}
                                                        {signal.ip_address ? ` · IP ${signal.ip_address}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="abuse-occurrences"><strong>{signal.occurrences}</strong><span>repeticiones</span></div>
                                        </div>

                                        {signal.content_excerpt && <blockquote>{signal.content_excerpt}</blockquote>}

                                        <div className="abuse-signal-grid">
                                            <div><span>Primera detección</span><strong>{formatDate(signal.first_seen_at)}</strong></div>
                                            <div><span>Última detección</span><strong>{formatDate(signal.last_seen_at)}</strong></div>
                                            <div><span>Acción detectada</span><strong>{signal.action_key || '—'}</strong></div>
                                            <div><span>Tipo de cuenta</span><strong>{signal.user_id ? role.label : 'Sin cuenta'}</strong></div>
                                        </div>

                                        {signal.moderator_notes && (
                                            <div className="abuse-review-note">
                                                <strong>Nota de moderación</strong>
                                                <span>{signal.moderator_notes}</span>
                                                <small>{signal.reviewed_by ? `Por ${signal.reviewed_by} · ${formatDate(signal.reviewed_at)}` : formatDate(signal.reviewed_at)}</small>
                                            </div>
                                        )}

                                        <div className="abuse-signal-actions">
                                            <button type="button" className="review" onClick={() => openReview(signal, 'review')}>👁️ Marcar revisada</button>
                                            <button type="button" className="dismiss" onClick={() => openReview(signal, 'dismiss')}>✅ Descartar</button>
                                            <button type="button" className="actioned" onClick={() => openReview(signal, 'action')}>📌 Medida externa</button>
                                            {canSanction && (
                                                <>
                                                    <button type="button" className="suspend" onClick={() => openSanction({ userId: signal.user_id, username: signal.username, signal, action: 'suspend' })}>⏳ Suspender</button>
                                                    <button type="button" className="ban" onClick={() => openSanction({ userId: signal.user_id, username: signal.username, signal, action: 'ban' })}>⛔ Expulsar</button>
                                                </>
                                            )}
                                        </div>
                                    </article>
                                )
                            })}
                        </div>
                    )}
                    <Pagination page={signalsData.page} next={signalsData.next} previous={signalsData.previous} onChange={(page) => setSignalFilters((current) => ({ ...current, page }))} />
                </>
            )}

            {section === 'accounts' && (
                <>
                    <form className="abuse-account-filters" onSubmit={submitAccountSearch}>
                        <label className="abuse-search">
                            <span>Buscar cuenta</span>
                            <div>
                                <input type="search" value={accountSearchInput} onChange={(event) => setAccountSearchInput(event.target.value)} placeholder="Usuario, email o nombre" />
                                <button type="submit">Buscar</button>
                            </div>
                        </label>
                        <label>
                            <span>Tipo de cuenta</span>
                            <select value={accountFilters.role} onChange={(event) => setAccountFilters((current) => ({ ...current, role: event.target.value, page: 1 }))}>
                                <option value="">Todos</option>
                                <option value="owner">Dueños</option>
                                <option value="clinic">Veterinarias</option>
                                <option value="business">Negocios</option>
                                <option value="shelter">Refugios</option>
                            </select>
                        </label>
                        <label>
                            <span>Nivel de riesgo</span>
                            <select value={accountFilters.risk} onChange={(event) => setAccountFilters((current) => ({ ...current, risk: event.target.value, page: 1 }))}>
                                <option value="">Todos</option>
                                <option value="normal">Normal</option>
                                <option value="watch">En observación</option>
                                <option value="high_risk">Riesgo alto</option>
                                <option value="temporarily_blocked">Bloqueada temporalmente</option>
                                <option value="banned">Expulsada</option>
                            </select>
                        </label>
                    </form>

                    {loadingAccounts ? (
                        <div className="abuse-empty"><span>🐾</span><h3>Calculando niveles de riesgo...</h3></div>
                    ) : accounts.length === 0 ? (
                        <div className="abuse-empty"><span>✅</span><h3>No hay cuentas con estos filtros</h3><p>Las cuentas sin señales recientes no aparecen en esta sección.</p></div>
                    ) : (
                        <div className="abuse-account-list">
                            {accounts.map((account) => {
                                const risk = RISK_META[account.risk_status] || { label: account.risk_status_display, icon: '👤', className: '' }
                                const role = ROLE_META[account.role] || { label: account.role_display || account.role, icon: '👤' }
                                const canSanction = Number(account.user_id) !== Number(currentUserId)
                                return (
                                    <article className="abuse-account-card" key={account.user_id}>
                                        <div className="abuse-account-main">
                                            <span className="abuse-account-avatar">{role.icon}</span>
                                            <div>
                                                <div className="abuse-account-heading">
                                                    <h3>{account.profile_name || account.username}</h3>
                                                    <span className={`abuse-risk-badge ${risk.className}`}>{risk.icon} {risk.label}</span>
                                                </div>
                                                <p>@{account.username} · {account.email} · {role.label}</p>
                                                <div className="abuse-account-metrics">
                                                    <span><strong>{account.risk_score}</strong> puntaje</span>
                                                    <span><strong>{account.pending_signals}</strong> pendientes</span>
                                                    <span><strong>{account.high_signals}</strong> de riesgo alto</span>
                                                    <span><strong>{account.occurrences}</strong> repeticiones</span>
                                                    <span>Última: <strong>{formatDate(account.last_signal_at)}</strong></span>
                                                </div>
                                                {account.active_sanction && (
                                                    <div className="abuse-active-sanction">
                                                        <strong>{account.active_sanction.kind_display}</strong>
                                                        <span>{account.active_sanction.reason}</span>
                                                        <small>{account.active_sanction.ends_at ? `Hasta ${formatDate(account.active_sanction.ends_at)}` : 'Sin fecha de finalización'}</small>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="abuse-account-actions">
                                            <button type="button" className="signals" onClick={() => viewAccountSignals(account)}>🚨 Ver señales</button>
                                            {canSanction && !account.active_sanction && (
                                                <>
                                                    <button type="button" className="suspend" onClick={() => openSanction({ userId: account.user_id, username: account.username, action: 'suspend' })}>⏳ Suspender</button>
                                                    <button type="button" className="ban" onClick={() => openSanction({ userId: account.user_id, username: account.username, action: 'ban' })}>⛔ Expulsar</button>
                                                </>
                                            )}
                                        </div>
                                    </article>
                                )
                            })}
                        </div>
                    )}
                    <Pagination page={accountsData.page} next={accountsData.next} previous={accountsData.previous} onChange={(page) => setAccountFilters((current) => ({ ...current, page }))} />
                </>
            )}

            {reviewModal && (
                <div className="abuse-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setReviewModal(null) }}>
                    <div className="abuse-modal" role="dialog" aria-modal="true" aria-labelledby="abuse-review-title">
                        <button type="button" className="abuse-modal-close" onClick={() => setReviewModal(null)} disabled={saving}>×</button>
                        <div className="abuse-modal-icon">{reviewModal.decision === 'dismiss' ? '✅' : reviewModal.decision === 'action' ? '📌' : '👁️'}</div>
                        <h3 id="abuse-review-title">Actualizar señal</h3>
                        <p>Esta decisión quedará guardada con tu usuario y la fecha de revisión.</p>
                        <form onSubmit={submitReview}>
                            <label>
                                <span>Nota de moderación</span>
                                <textarea value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} rows="5" maxLength="2000" placeholder="Explicá brevemente qué revisaste o por qué la descartás." />
                            </label>
                            <div className="abuse-modal-actions">
                                <button type="button" className="cancel" onClick={() => setReviewModal(null)} disabled={saving}>Cancelar</button>
                                <button type="submit" className="confirm" disabled={saving}>{saving ? 'Guardando...' : 'Confirmar decisión'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {sanctionModal && (
                <div className="abuse-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setSanctionModal(null) }}>
                    <div className={`abuse-modal ${sanctionForm.action === 'ban' ? 'danger' : ''}`} role="dialog" aria-modal="true" aria-labelledby="abuse-sanction-title">
                        <button type="button" className="abuse-modal-close" onClick={() => setSanctionModal(null)} disabled={saving}>×</button>
                        <div className="abuse-modal-icon">{sanctionForm.action === 'ban' ? '⛔' : '⏳'}</div>
                        <h3 id="abuse-sanction-title">{sanctionForm.action === 'ban' ? `Expulsar a ${sanctionModal.username}` : `Suspender a ${sanctionModal.username}`}</h3>
                        <p>{sanctionModal.signal ? `La medida quedará vinculada a la señal #${sanctionModal.signal.id}.` : 'La medida quedará registrada en el historial de moderación.'}</p>
                        <form onSubmit={submitSanction}>
                            <label>
                                <span>Tipo de medida</span>
                                <select value={sanctionForm.action} onChange={(event) => setSanctionForm((current) => ({ ...current, action: event.target.value }))}>
                                    <option value="suspend">Suspensión temporal</option>
                                    <option value="ban">Expulsión permanente</option>
                                </select>
                            </label>
                            {sanctionForm.action === 'suspend' && (
                                <label>
                                    <span>Duración</span>
                                    <select value={sanctionForm.duration} onChange={(event) => setSanctionForm((current) => ({ ...current, duration: event.target.value }))}>
                                        <option value="1">1 día</option>
                                        <option value="3">3 días</option>
                                        <option value="7">7 días</option>
                                        <option value="15">15 días</option>
                                        <option value="30">30 días</option>
                                        <option value="custom">Fecha personalizada</option>
                                    </select>
                                </label>
                            )}
                            {sanctionForm.action === 'suspend' && sanctionForm.duration === 'custom' && (
                                <label>
                                    <span>Finaliza el</span>
                                    <input type="datetime-local" value={sanctionForm.customEnd} onChange={(event) => setSanctionForm((current) => ({ ...current, customEnd: event.target.value }))} />
                                </label>
                            )}
                            <label>
                                <span>Motivo visible para la persona *</span>
                                <textarea value={sanctionForm.reason} onChange={(event) => setSanctionForm((current) => ({ ...current, reason: event.target.value }))} rows="4" maxLength="1000" required placeholder="Explicá por qué se aplica la medida." />
                            </label>
                            <label>
                                <span>Nota interna</span>
                                <textarea value={sanctionForm.internalNote} onChange={(event) => setSanctionForm((current) => ({ ...current, internalNote: event.target.value }))} rows="3" maxLength="2000" placeholder="Solo la administración puede ver esta nota." />
                            </label>
                            <div className="abuse-modal-actions">
                                <button type="button" className="cancel" onClick={() => setSanctionModal(null)} disabled={saving}>Cancelar</button>
                                <button type="submit" className={`confirm ${sanctionForm.action === 'ban' ? 'ban' : ''}`} disabled={saving}>{saving ? 'Aplicando...' : sanctionForm.action === 'ban' ? 'Expulsar cuenta' : 'Suspender cuenta'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    )
}
