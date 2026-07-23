import { useState } from 'react'
import { Link } from 'react-router-dom'
import './AdminInteractionStats.css'

const METRICS = {
    posts: { label: 'Publicaciones', short: 'Posts', icon: '📝', color: '#6bcaff' },
    paws: { label: 'Patitas', short: 'Patitas', icon: '🐾', color: '#ffb84d' },
    comments: { label: 'Comentarios', short: 'Comentarios', icon: '💬', color: '#bd93ff' },
    follows: { label: 'Seguimientos', short: 'Seguidos', icon: '👥', color: '#6bffb8' },
    messages: { label: 'Mensajes', short: 'Mensajes', icon: '✉️', color: '#ff7f9c' },
}

const PROFILE_META = {
    pet: { label: 'Mascota', icon: '🐾', color: '#ffb84d' },
    clinic: { label: 'Veterinaria', icon: '🏥', color: '#6bcaff' },
    business: { label: 'Negocio', icon: '🛍️', color: '#6bffb8' },
    shelter: { label: 'Refugio', icon: '🏠', color: '#ffd36b' },
}

const POST_TYPE_LABELS = {
    normal: 'Publicación',
    birthday: 'Cumpleaños',
    lost: 'Mascota perdida',
    clinic: 'Veterinaria',
    business: 'Negocio',
    shelter: 'Refugio',
    adoption: 'Adopción',
}

const ADOPTION_ANIMAL_STATUS = {
    available: 'Disponibles',
    recovery: 'En recuperación',
    foster: 'Necesitan tránsito',
    urgent: 'Urgentes',
    reserved: 'Reservados',
    adopted: 'Adoptados',
}

const ADOPTION_APPLICATION_STATUS = {
    new: 'Nuevas',
    review: 'En revisión',
    approved: 'Aprobadas',
    rejected: 'Rechazadas',
    completed: 'Concretadas',
}

const INQUIRY_STATUS = {
    new: 'Nuevas',
    replied: 'Respondidas',
    closed: 'Cerradas',
}

const RESERVATION_STATUS = {
    pending: 'Pendientes',
    confirmed: 'Confirmadas',
    rejected: 'Rechazadas',
    rescheduled: 'Reprogramadas',
    completed: 'Completadas',
    cancelled: 'Canceladas',
}

const APPOINTMENT_STATUS = {
    pending: 'Pendientes',
    confirmed: 'Confirmados',
    cancelled: 'Cancelados',
    completed: 'Realizados',
    no_show: 'Ausentes',
}

const PLAN_STATUS = {
    inactive: 'Sin plan',
    trial: 'Prueba gratis',
    active: 'Plan activo',
    grace: 'En gracia',
    expired: 'Vencido',
    suspended: 'Suspendido',
}

const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0
const compact = (value) => new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(number(value))
const fullDate = (value) => value
    ? new Date(value).toLocaleString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

function MetricCard({ icon, label, total, week, month, accent }) {
    return (
        <article className="admin-interaction-metric" style={{ '--metric-accent': accent }}>
            <div className="admin-interaction-metric__icon">{icon}</div>
            <div className="admin-interaction-metric__copy">
                <span>{label}</span>
                <strong title={number(total).toLocaleString('es-AR')}>{compact(total)}</strong>
                <div>
                    <small><b>+{number(week).toLocaleString('es-AR')}</b> 7 días</small>
                    <small><b>+{number(month).toLocaleString('es-AR')}</b> 30 días</small>
                </div>
            </div>
        </article>
    )
}

function SummaryCard({ icon, label, value, detail, accent = '#6bffb8' }) {
    return (
        <article className="admin-interaction-summary-card" style={{ '--summary-accent': accent }}>
            <span className="admin-interaction-summary-card__icon">{icon}</span>
            <div>
                <strong>{number(value).toLocaleString('es-AR')}</strong>
                <span>{label}</span>
                {detail && <small>{detail}</small>}
            </div>
        </article>
    )
}

function StatusGrid({ values = {}, labels, emptyText = 'Sin movimientos todavía' }) {
    const rows = Object.entries(labels).map(([key, label]) => ({ key, label, value: number(values?.[key]) }))
    const total = rows.reduce((sum, row) => sum + row.value, 0)

    if (!total) return <div className="admin-interaction-empty compact">{emptyText}</div>

    return (
        <div className="admin-interaction-status-grid">
            {rows.map((row) => (
                <div key={row.key} className="admin-interaction-status-row">
                    <div><span>{row.label}</span><b>{row.value.toLocaleString('es-AR')}</b></div>
                    <div className="admin-interaction-progress"><span style={{ width: `${Math.max((row.value / total) * 100, row.value ? 4 : 0)}%` }} /></div>
                </div>
            ))}
        </div>
    )
}

function EngagementChart({ rows = [] }) {
    const [metric, setMetric] = useState('posts')
    const selected = METRICS[metric]
    const maxValue = Math.max(...rows.map((row) => number(row[metric])), 1)
    const total = rows.reduce((sum, row) => sum + number(row[metric]), 0)

    return (
        <section className="admin-interaction-panel admin-interaction-chart-panel">
            <div className="admin-interaction-panel__head split">
                <div>
                    <span className="admin-interaction-kicker">Actividad diaria</span>
                    <h3>Interacción de los últimos 14 días</h3>
                    <p>Elegí una métrica para ver si la comunidad está creciendo o perdiendo movimiento.</p>
                </div>
                <div className="admin-interaction-chart-total" style={{ '--chart-accent': selected.color }}>
                    <span>{selected.icon}</span>
                    <strong>{total.toLocaleString('es-AR')}</strong>
                    <small>{selected.label.toLowerCase()}</small>
                </div>
            </div>

            <div className="admin-interaction-metric-tabs" role="tablist" aria-label="Métrica del gráfico">
                {Object.entries(METRICS).map(([key, item]) => (
                    <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={metric === key}
                        className={metric === key ? 'active' : ''}
                        style={{ '--tab-accent': item.color }}
                        onClick={() => setMetric(key)}
                    >
                        <span>{item.icon}</span>{item.short}
                    </button>
                ))}
            </div>

            <div className="admin-interaction-chart" aria-label={`Gráfico de ${selected.label.toLowerCase()} de los últimos 14 días`}>
                {rows.map((row) => {
                    const value = number(row[metric])
                    const height = value ? Math.max((value / maxValue) * 150, 8) : 3
                    return (
                        <div key={`${metric}-${row.date}`} className="admin-interaction-chart__column">
                            <span className="admin-interaction-chart__value">{value}</span>
                            <div
                                className="admin-interaction-chart__bar"
                                title={`${row.date}: ${value} ${selected.label.toLowerCase()}`}
                                style={{ height: `${height}px`, '--bar-accent': selected.color }}
                            />
                            <small>{row.date}</small>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}

function RankingTable({ headers, children, emptyText }) {
    return (
        <div className="admin-interaction-table-wrap">
            <table className="admin-interaction-table">
                <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
                <tbody>{children}</tbody>
            </table>
            {!children && <div className="admin-interaction-empty compact">{emptyText}</div>}
        </div>
    )
}

export default function AdminInteractionStats({ stats }) {
    const community = stats?.community || {}
    const adoptions = stats?.adoptions || {}
    const businesses = stats?.businesses || {}
    const veterinary = stats?.veterinary || {}
    const engagementRows = stats?.engagement_by_day || []
    const topPosts = stats?.top_community_posts || []
    const topProfiles = stats?.top_profiles || []
    const topBusinesses = stats?.top_businesses || []
    const topShelters = stats?.top_shelters || []

    const totalCommunityActions = (
        number(community.posts_30_days)
        + number(community.paws_30_days)
        + number(community.comments_30_days)
        + number(community.follows_30_days)
        + number(community.messages_30_days)
    )

    if (!stats) {
        return (
            <div className="admin-interaction-empty">
                <span>📊</span>
                <h2>Las estadísticas todavía no están disponibles</h2>
                <p>Actualizá el panel cuando Railway tenga desplegada la Etapa 10.2.</p>
            </div>
        )
    }

    return (
        <div className="admin-interaction">
            <section className="admin-interaction-hero">
                <div>
                    <span className="admin-interaction-kicker">Etapa 10.2 · Medición real</span>
                    <h2>Actividad e interacción de VetPaw</h2>
                    <p>Acá ves si dueños, mascotas, veterinarias, negocios y refugios realmente están usando la plataforma. Los mensajes se cuentan, pero su contenido privado no se muestra.</p>
                </div>
                <div className="admin-interaction-hero__badge">
                    <span>📈</span>
                    <strong>{totalCommunityActions.toLocaleString('es-AR')}</strong>
                    <small>acciones sociales en 30 días</small>
                </div>
            </section>

            <div className="admin-interaction-summary-grid">
                <SummaryCard icon="🟢" label="Usuarios activos" value={community.active_users_week} detail="en los últimos 7 días" accent="#6bffb8" />
                <SummaryCard icon="📆" label="Usuarios activos" value={community.active_users_30_days} detail="en los últimos 30 días" accent="#6bcaff" />
                <SummaryCard icon="🏠" label="Refugios activos" value={adoptions.active_shelters_30_days} detail="con actividad en 30 días" accent="#ffd36b" />
                <SummaryCard icon="🏥" label="Clínicas recibiendo turnos" value={veterinary.clinics_receiving_appointments} detail={`${number(veterinary.clinics_with_schedule)} con agenda configurada`} accent="#ff9a6b" />
            </div>

            <section className="admin-interaction-section">
                <div className="admin-interaction-section__head">
                    <div><span className="admin-interaction-kicker">Comunidad</span><h3>Movimiento social</h3></div>
                    <p>Totales históricos y actividad reciente.</p>
                </div>
                <div className="admin-interaction-metric-grid">
                    <MetricCard icon="📝" label="Publicaciones" total={community.posts_published} week={community.posts_week} month={community.posts_30_days} accent="#6bcaff" />
                    <MetricCard icon="🐾" label="Patitas" total={community.paws_total} week={community.paws_week} month={community.paws_30_days} accent="#ffb84d" />
                    <MetricCard icon="💬" label="Comentarios" total={community.comments_total} week={community.comments_week} month={community.comments_30_days} accent="#bd93ff" />
                    <MetricCard icon="↩️" label="Respuestas" total={community.replies_total} week={community.replies_week} month={community.replies_30_days} accent="#9b8cff" />
                    <MetricCard icon="👥" label="Seguimientos" total={community.follows_total} week={community.follows_week} month={community.follows_30_days} accent="#6bffb8" />
                    <MetricCard icon="✉️" label="Mensajes enviados" total={community.messages_total} week={community.messages_week} month={community.messages_30_days} accent="#ff7f9c" />
                </div>
            </section>

            <EngagementChart rows={engagementRows} />

            <div className="admin-interaction-domain-grid">
                <section className="admin-interaction-panel">
                    <div className="admin-interaction-panel__head"><span className="admin-interaction-kicker">Adopciones</span><h3>Animales y solicitudes</h3></div>
                    <div className="admin-interaction-mini-grid">
                        <SummaryCard icon="🐶" label="Animales publicados" value={adoptions.animals_published} detail={`${number(adoptions.animals_total)} cargados`} accent="#ffb84d" />
                        <SummaryCard icon="📨" label="Solicitudes" value={adoptions.applications_total} detail={`+${number(adoptions.applications_30_days)} en 30 días`} accent="#6bcaff" />
                        <SummaryCard icon="🤝" label="Ofrecimientos de ayuda" value={adoptions.help_offers_total} detail={`+${number(adoptions.help_offers_30_days)} en 30 días`} accent="#6bffb8" />
                    </div>
                    <div className="admin-interaction-status-columns">
                        <div><h4>Animales por estado</h4><StatusGrid values={adoptions.animals_by_status} labels={ADOPTION_ANIMAL_STATUS} emptyText="Todavía no hay animales cargados" /></div>
                        <div><h4>Solicitudes por estado</h4><StatusGrid values={adoptions.applications_by_status} labels={ADOPTION_APPLICATION_STATUS} emptyText="Todavía no hay solicitudes" /></div>
                    </div>
                </section>

                <section className="admin-interaction-panel">
                    <div className="admin-interaction-panel__head"><span className="admin-interaction-kicker">Negocios</span><h3>Interés comercial</h3></div>
                    <div className="admin-interaction-mini-grid">
                        <SummaryCard icon="👁️" label="Visitas a perfiles" value={businesses.profile_views_total} detail={`+${number(businesses.profile_views_30_days)} en 30 días`} accent="#6bcaff" />
                        <SummaryCard icon="💬" label="Consultas" value={businesses.inquiries_total} detail={`+${number(businesses.inquiries_30_days)} en 30 días`} accent="#6bffb8" />
                        <SummaryCard icon="📅" label="Reservas" value={businesses.reservations_total} detail={`+${number(businesses.reservations_30_days)} en 30 días`} accent="#ffb84d" />
                    </div>
                    <div className="admin-interaction-status-columns">
                        <div><h4>Consultas por estado</h4><StatusGrid values={businesses.inquiries_by_status} labels={INQUIRY_STATUS} emptyText="Todavía no hay consultas" /></div>
                        <div><h4>Reservas por estado</h4><StatusGrid values={businesses.reservations_by_status} labels={RESERVATION_STATUS} emptyText="Todavía no hay reservas" /></div>
                    </div>
                </section>

                <section className="admin-interaction-panel admin-interaction-panel--wide">
                    <div className="admin-interaction-panel__head"><span className="admin-interaction-kicker">Veterinarias</span><h3>Turnos, agendas y planes</h3></div>
                    <div className="admin-interaction-mini-grid four">
                        <SummaryCard icon="📅" label="Turnos totales" value={veterinary.appointments_total} detail={`+${number(veterinary.appointments_30_days)} en 30 días`} accent="#6bcaff" />
                        <SummaryCard icon="🗓️" label="Agendas configuradas" value={veterinary.clinics_with_schedule} detail="veterinarias listas para organizarse" accent="#6bffb8" />
                        <SummaryCard icon="✅" label="Reciben turnos" value={veterinary.clinics_receiving_appointments} detail="con plan, agenda y solicitudes activas" accent="#ffb84d" />
                        <SummaryCard icon="🆕" label="Turnos recientes" value={veterinary.appointments_week} detail="en los últimos 7 días" accent="#ff7f9c" />
                    </div>
                    <div className="admin-interaction-status-columns">
                        <div><h4>Turnos por estado</h4><StatusGrid values={veterinary.appointments_by_status} labels={APPOINTMENT_STATUS} emptyText="Todavía no hay turnos" /></div>
                        <div><h4>Veterinarias por plan</h4><StatusGrid values={veterinary.clinics_by_plan_status} labels={PLAN_STATUS} emptyText="Todavía no hay veterinarias" /></div>
                    </div>
                </section>
            </div>

            <section className="admin-interaction-section">
                <div className="admin-interaction-section__head"><div><span className="admin-interaction-kicker">Rankings</span><h3>Contenido y perfiles con más movimiento</h3></div><p>Sirve para detectar qué está generando interés real.</p></div>
                <div className="admin-interaction-ranking-grid">
                    <article className="admin-interaction-panel">
                        <div className="admin-interaction-panel__head"><h3>🔥 Publicaciones con más interacción</h3></div>
                        {topPosts.length ? (
                            <RankingTable headers={['Publicación', 'Interacción', 'Fecha']}>
                                {topPosts.map((post) => (
                                    <tr key={post.id}>
                                        <td>
                                            <Link className="admin-interaction-primary-link" to={`/comunidad?publicacion=${post.id}`}>{post.actor_name}</Link>
                                            <small>{POST_TYPE_LABELS[post.post_type] || 'Publicación'} · {post.text || 'Sin texto'}</small>
                                        </td>
                                        <td><b>{number(post.score)}</b><small>🐾 {number(post.paws)} · 💬 {number(post.comments)} · ↗ {number(post.shares)}</small></td>
                                        <td>{fullDate(post.created_at)}</td>
                                    </tr>
                                ))}
                            </RankingTable>
                        ) : <div className="admin-interaction-empty compact">Todavía no hay publicaciones con interacción.</div>}
                    </article>

                    <article className="admin-interaction-panel">
                        <div className="admin-interaction-panel__head"><h3>⭐ Perfiles destacados</h3></div>
                        {topProfiles.length ? (
                            <RankingTable headers={['Perfil', 'Actividad', 'Puntaje']}>
                                {topProfiles.map((profile) => {
                                    const meta = PROFILE_META[profile.profile_type] || PROFILE_META.pet
                                    const name = profile.profile_type === 'pet'
                                        ? <Link className="admin-interaction-primary-link" to={`/mascotas/${profile.profile_id}`}>{profile.name}</Link>
                                        : <strong>{profile.name}</strong>
                                    return (
                                        <tr key={`${profile.profile_type}-${profile.profile_id}`}>
                                            <td>{name}<small style={{ color: meta.color }}>{meta.icon} {meta.label}</small></td>
                                            <td><b>📝 {number(profile.posts)}</b><small>🐾 {number(profile.paws)} · 💬 {number(profile.comments)} · 👥 {number(profile.followers)}</small></td>
                                            <td><span className="admin-interaction-score">{number(profile.score)}</span></td>
                                        </tr>
                                    )
                                })}
                            </RankingTable>
                        ) : <div className="admin-interaction-empty compact">Todavía no hay perfiles con interacción.</div>}
                    </article>

                    <article className="admin-interaction-panel">
                        <div className="admin-interaction-panel__head"><h3>🛍️ Negocios con más actividad</h3></div>
                        {topBusinesses.length ? (
                            <RankingTable headers={['Negocio', 'Contactos', 'Alcance']}>
                                {topBusinesses.map((business) => (
                                    <tr key={business.id}>
                                        <td><strong>{business.name}</strong><small>{business.locality || '—'}, {business.province || '—'}</small></td>
                                        <td><b>💬 {number(business.inquiries)}</b><small>📅 {number(business.reservations)} reservas</small></td>
                                        <td><b>👁️ {number(business.views)}</b><small>👥 {number(business.followers)} seguidores</small></td>
                                    </tr>
                                ))}
                            </RankingTable>
                        ) : <div className="admin-interaction-empty compact">Todavía no hay actividad comercial para comparar.</div>}
                    </article>

                    <article className="admin-interaction-panel">
                        <div className="admin-interaction-panel__head"><h3>🏠 Refugios con más movimiento</h3></div>
                        {topShelters.length ? (
                            <RankingTable headers={['Refugio', 'Solicitudes', 'Resultados']}>
                                {topShelters.map((shelter) => (
                                    <tr key={shelter.id}>
                                        <td><strong>{shelter.name}</strong><small>{shelter.locality || '—'}, {shelter.province || '—'}</small></td>
                                        <td><b>📨 {number(shelter.applications)}</b><small>🤝 {number(shelter.help_offers)} ayudas</small></td>
                                        <td><b>🏡 {number(shelter.adopted)}</b><small>🐾 {number(shelter.animals)} animales</small></td>
                                    </tr>
                                ))}
                            </RankingTable>
                        ) : <div className="admin-interaction-empty compact">Todavía no hay actividad de refugios para comparar.</div>}
                    </article>
                </div>
            </section>
        </div>
    )
}
