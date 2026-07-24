import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    getProfessionalVerificationHistory,
    getProfessionalVerifications,
    updateProfessionalVerification,
} from '../services/api'
import './AdminProfessionalVerification.css'
import {
    PROFESSIONAL_ACTION_OPTIONS,
    PROFESSIONAL_ROLE_META,
    PROFESSIONAL_STATUS_META,
    canVerifyProfessionalProfile,
    getDefaultProfessionalAction,
    getProfessionalProfileUrl,
    requiresProfessionalPublicNote,
} from '../utils/professionalVerification'

const initialForm = {
    action: 'review',
    publicNote: '',
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

function StatusBadge({ status }) {
    const meta = PROFESSIONAL_STATUS_META[status] || PROFESSIONAL_STATUS_META.pending
    return <span className={`professional-verification-badge ${meta.className}`}>{meta.icon} {meta.label}</span>
}

function SummaryCard({ status, value }) {
    const meta = PROFESSIONAL_STATUS_META[status]
    if (!meta) return null
    return (
        <div className={`professional-verification-summary-card ${meta.className}`}>
            <span>{meta.icon}</span>
            <div>
                <strong>{value ?? 0}</strong>
                <small>{meta.label}</small>
            </div>
        </div>
    )
}

function Pagination({ page, next, previous, onChange }) {
    if (!next && !previous) return null
    return (
        <div className="professional-verification-pagination">
            <button type="button" disabled={!previous} onClick={() => onChange(previous)}>← Anterior</button>
            <span>Página {page}</span>
            <button type="button" disabled={!next} onClick={() => onChange(next)}>Siguiente →</button>
        </div>
    )
}

export default function AdminProfessionalVerification() {
    const [section, setSection] = useState('profiles')
    const [searchInput, setSearchInput] = useState('')
    const [filters, setFilters] = useState({ search: '', role: '', status: '', approved: '', page: 1 })
    const [historyFilters, setHistoryFilters] = useState({ user_id: '', status: '', page: 1 })
    const [profilesData, setProfilesData] = useState({ summary: {}, results: [], page: 1 })
    const [historyData, setHistoryData] = useState({ results: [], page: 1 })
    const [loading, setLoading] = useState(true)
    const [historyLoading, setHistoryLoading] = useState(false)
    const [selectedProfile, setSelectedProfile] = useState(null)
    const [form, setForm] = useState(initialForm)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const loadProfiles = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const data = await getProfessionalVerifications({
                search: filters.search || undefined,
                role: filters.role || undefined,
                status: filters.status || undefined,
                approved: filters.approved || undefined,
                page: filters.page,
                page_size: 20,
            })
            setProfilesData(data)
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
            const data = await getProfessionalVerificationHistory({
                user_id: historyFilters.user_id || undefined,
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
        loadProfiles()
    }, [loadProfiles])

    useEffect(() => {
        if (section === 'history') loadHistory()
    }, [section, loadHistory])

    const profiles = profilesData.results || []
    const history = historyData.results || []
    const summary = profilesData.summary || {}
    const selectedAction = useMemo(
        () => PROFESSIONAL_ACTION_OPTIONS.find((option) => option.value === form.action) || PROFESSIONAL_ACTION_OPTIONS[0],
        [form.action],
    )
    const requiresPublicNote = requiresProfessionalPublicNote(form.action)

    const submitSearch = (event) => {
        event.preventDefault()
        setFilters((current) => ({ ...current, search: searchInput.trim(), page: 1 }))
    }

    const openAction = (row, preferredAction = '') => {
        let action = preferredAction
        if (!action) action = getDefaultProfessionalAction(row)
        setSelectedProfile(row)
        setForm({
            action,
            publicNote: row.public_note || '',
            internalNote: row.latest_internal_note || '',
        })
        setMessage('')
        setError('')
    }

    const submitAction = async (event) => {
        event.preventDefault()
        if (!selectedProfile) return
        if (form.action === 'verify' && !canVerifyProfessionalProfile(selectedProfile)) {
            setError('Primero tenés que aprobar la cuenta profesional antes de verificarla.')
            return
        }
        if (requiresPublicNote && !form.publicNote.trim()) {
            setError('Escribí el motivo visible para la cuenta profesional.')
            return
        }
        const targetLabel = selectedAction.label.toLowerCase()
        if (!window.confirm(`¿Confirmar la acción “${targetLabel}” para ${selectedProfile.profile_name || selectedProfile.username}?`)) return

        setSaving(true)
        setError('')
        try {
            const result = await updateProfessionalVerification(selectedProfile.user_id, {
                action: form.action,
                public_note: form.publicNote.trim(),
                internal_note: form.internalNote.trim(),
            })
            setMessage(result.message || 'La verificación fue actualizada.')
            setSelectedProfile(null)
            setForm(initialForm)
            await loadProfiles()
            if (section === 'history') await loadHistory()
        } catch (requestError) {
            setError(extractError(requestError))
        } finally {
            setSaving(false)
        }
    }

    const openHistoryFor = (row) => {
        setHistoryFilters({ user_id: String(row.user_id), status: '', page: 1 })
        setSection('history')
    }

    return (
        <section className="professional-verification-panel">
            <div className="professional-verification-hero">
                <div>
                    <span className="professional-verification-kicker">Confianza pública</span>
                    <h2>Verificación profesional</h2>
                    <p>Revisá veterinarias, negocios y refugios. La insignia es independiente de la aprobación de la cuenta, los planes y los turnos.</p>
                </div>
                <div className="professional-verification-hero-icon">✅</div>
            </div>

            <div className="professional-verification-summary">
                {['pending', 'in_review', 'corrections', 'verified', 'rejected', 'withdrawn'].map((status) => (
                    <SummaryCard key={status} status={status} value={summary[status]} />
                ))}
            </div>

            <div className="professional-verification-section-tabs">
                <button type="button" className={section === 'profiles' ? 'active' : ''} onClick={() => setSection('profiles')}>Perfiles profesionales</button>
                <button type="button" className={section === 'history' ? 'active' : ''} onClick={() => setSection('history')}>Historial de decisiones</button>
            </div>

            {message && <div className="professional-verification-message success">{message}</div>}
            {error && <div className="professional-verification-message error">{error}</div>}

            {section === 'profiles' ? (
                <>
                    <form className="professional-verification-filters" onSubmit={submitSearch}>
                        <input
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="Buscar por nombre, usuario o email"
                        />
                        <select value={filters.role} onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value, page: 1 }))}>
                            <option value="">Todos los perfiles</option>
                            <option value="clinic">Veterinarias</option>
                            <option value="business">Negocios</option>
                            <option value="shelter">Refugios</option>
                        </select>
                        <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}>
                            <option value="">Todos los estados</option>
                            {Object.entries(PROFESSIONAL_STATUS_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
                        </select>
                        <select value={filters.approved} onChange={(event) => setFilters((current) => ({ ...current, approved: event.target.value, page: 1 }))}>
                            <option value="">Aprobadas y pendientes</option>
                            <option value="true">Cuenta aprobada</option>
                            <option value="false">Cuenta sin aprobar</option>
                        </select>
                        <button type="submit">Buscar</button>
                    </form>

                    {loading ? (
                        <div className="professional-verification-empty">Cargando verificaciones...</div>
                    ) : profiles.length === 0 ? (
                        <div className="professional-verification-empty">No encontramos perfiles con esos filtros.</div>
                    ) : (
                        <div className="professional-verification-list">
                            {profiles.map((row) => {
                                const role = PROFESSIONAL_ROLE_META[row.role] || PROFESSIONAL_ROLE_META.business
                                const url = getProfessionalProfileUrl(row)
                                return (
                                    <article key={row.user_id} className="professional-verification-card">
                                        <div className="professional-verification-card-main">
                                            <div className="professional-verification-avatar">{role.icon}</div>
                                            <div className="professional-verification-copy">
                                                <div className="professional-verification-card-title">
                                                    <div>
                                                        <h3>{row.profile_name || row.username}</h3>
                                                        <p>{role.label} · @{row.username}</p>
                                                    </div>
                                                    <StatusBadge status={row.status} />
                                                </div>
                                                <div className="professional-verification-meta">
                                                    <span>✉️ {row.email}</span>
                                                    <span>{row.is_approved ? '✅ Cuenta aprobada' : '⏳ Cuenta pendiente de aprobación'}</span>
                                                    <span>Decisiones: {row.decisions_count || 0}</span>
                                                    <span>Actualizada: {formatDate(row.verification_updated_at || row.date_joined)}</span>
                                                </div>
                                                {row.public_note && <div className="professional-verification-public-note"><strong>Mensaje visible:</strong> {row.public_note}</div>}
                                                {row.latest_internal_note && <div className="professional-verification-internal-note"><strong>Nota interna:</strong> {row.latest_internal_note}</div>}
                                            </div>
                                        </div>
                                        <div className="professional-verification-actions">
                                            {url && <Link to={url} target="_blank" rel="noreferrer">Ver perfil público</Link>}
                                            <button type="button" className="secondary" onClick={() => openHistoryFor(row)}>Historial</button>
                                            <button type="button" onClick={() => openAction(row)}>Gestionar</button>
                                        </div>
                                    </article>
                                )
                            })}
                        </div>
                    )}
                    <Pagination
                        page={profilesData.page || filters.page}
                        next={profilesData.next}
                        previous={profilesData.previous}
                        onChange={(page) => setFilters((current) => ({ ...current, page }))}
                    />
                </>
            ) : (
                <>
                    <div className="professional-verification-history-filters">
                        <input
                            inputMode="numeric"
                            value={historyFilters.user_id}
                            onChange={(event) => setHistoryFilters((current) => ({ ...current, user_id: event.target.value.replace(/\D/g, ''), page: 1 }))}
                            placeholder="ID de cuenta (opcional)"
                        />
                        <select value={historyFilters.status} onChange={(event) => setHistoryFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}>
                            <option value="">Todos los resultados</option>
                            {Object.entries(PROFESSIONAL_STATUS_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
                        </select>
                        {(historyFilters.user_id || historyFilters.status) && (
                            <button type="button" onClick={() => setHistoryFilters({ user_id: '', status: '', page: 1 })}>Limpiar filtros</button>
                        )}
                    </div>
                    {historyLoading ? (
                        <div className="professional-verification-empty">Cargando historial...</div>
                    ) : history.length === 0 ? (
                        <div className="professional-verification-empty">Todavía no hay decisiones registradas con esos filtros.</div>
                    ) : (
                        <div className="professional-verification-history-list">
                            {history.map((decision) => (
                                <article key={decision.id} className="professional-verification-history-card">
                                    <div className="professional-verification-history-flow">
                                        <StatusBadge status={decision.from_status} />
                                        <span>→</span>
                                        <StatusBadge status={decision.to_status} />
                                    </div>
                                    <div className="professional-verification-history-copy">
                                        <strong>Cuenta #{decision.user_id}</strong>
                                        <span>{formatDate(decision.created_at)}</span>
                                        {decision.public_note && <p><b>Mensaje visible:</b> {decision.public_note}</p>}
                                        {decision.internal_note && <p><b>Nota interna:</b> {decision.internal_note}</p>}
                                        <small>Decidió: {decision.decided_by?.username || 'Sistema'}</small>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                    <Pagination
                        page={historyData.page || historyFilters.page}
                        next={historyData.next}
                        previous={historyData.previous}
                        onChange={(page) => setHistoryFilters((current) => ({ ...current, page }))}
                    />
                </>
            )}

            {selectedProfile && (
                <div className="professional-verification-modal-backdrop" role="presentation" onMouseDown={(event) => {
                    if (event.target === event.currentTarget && !saving) setSelectedProfile(null)
                }}>
                    <form className="professional-verification-modal" onSubmit={submitAction}>
                        <div className="professional-verification-modal-head">
                            <div>
                                <span>{(PROFESSIONAL_ROLE_META[selectedProfile.role] || PROFESSIONAL_ROLE_META.business).icon} Gestionar verificación</span>
                                <h3>{selectedProfile.profile_name || selectedProfile.username}</h3>
                            </div>
                            <button type="button" disabled={saving} onClick={() => setSelectedProfile(null)}>✕</button>
                        </div>

                        <label>
                            Acción
                            <select value={form.action} onChange={(event) => setForm((current) => ({ ...current, action: event.target.value }))}>
                                {PROFESSIONAL_ACTION_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value} disabled={option.value === 'verify' && !selectedProfile.is_approved}>
                                        {option.label}{option.value === 'verify' && !selectedProfile.is_approved ? ' — requiere aprobación' : ''}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className={`professional-verification-target-preview ${(PROFESSIONAL_STATUS_META[selectedAction.targetStatus] || PROFESSIONAL_STATUS_META.pending).className}`}>
                            El perfil quedará como: <strong>{(PROFESSIONAL_STATUS_META[selectedAction.targetStatus] || PROFESSIONAL_STATUS_META.pending).label}</strong>
                        </div>

                        <label>
                            Mensaje visible para la cuenta {requiresPublicNote ? '*' : '(opcional)'}
                            <textarea
                                maxLength={1200}
                                value={form.publicNote}
                                onChange={(event) => setForm((current) => ({ ...current, publicNote: event.target.value }))}
                                placeholder="Explicá el motivo o las correcciones necesarias."
                            />
                            <small>{form.publicNote.length}/1200</small>
                        </label>

                        <label>
                            Nota interna (solo administradores)
                            <textarea
                                maxLength={2000}
                                value={form.internalNote}
                                onChange={(event) => setForm((current) => ({ ...current, internalNote: event.target.value }))}
                                placeholder="Documentación revisada, observaciones o contexto interno."
                            />
                            <small>{form.internalNote.length}/2000</small>
                        </label>

                        {!selectedProfile.is_approved && (
                            <div className="professional-verification-warning">La cuenta todavía no está aprobada. Podés revisarla o pedir correcciones, pero para verificarla primero debe aprobarse.</div>
                        )}

                        <div className="professional-verification-modal-actions">
                            <button type="button" className="secondary" disabled={saving} onClick={() => setSelectedProfile(null)}>Cancelar</button>
                            <button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Confirmar acción'}</button>
                        </div>
                    </form>
                </div>
            )}
        </section>
    )
}
