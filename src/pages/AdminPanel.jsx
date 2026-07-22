import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import AdsManager from '../components/AdsManager'
import BlogManager from '../components/BlogManager'
import AdminLostPetsManager from '../components/AdminLostPetsManager'
import { canAccessAdmin } from '../utils/permissions'

const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif"
const G1 = '#4CAF50'
const O1 = '#FF9800'
const DARK = '#0f1923'
const DARK2 = '#162032'
const CARD = '#1a2535'

export default function AdminPanel() {
    const { user, loading: authLoading } = useAuth()
    const navigate = useNavigate()
    const [data, setData] = useState(null)
    const [dataLoading, setDataLoading] = useState(true)
    const [error, setError] = useState('')
    const [lastUpdate, setLastUpdate] = useState(null)
    const [tab, setTab] = useState('dashboard')

    const fetchData = useCallback(async () => {
        setDataLoading(true)
        try {
            const res = await api.get('/users/admin-panel/')
            setData(res.data)
            setLastUpdate(new Date().toLocaleTimeString('es-AR'))
        } catch (e) {
            setError('Error cargando datos.')
        } finally {
            setDataLoading(false)
        }
    }, [])

    useEffect(() => {
        if (authLoading) return
        if (!user) { navigate('/login'); return }
        if (!canAccessAdmin(user)) { navigate('/'); return }
        fetchData()
    }, [user, authLoading, navigate, fetchData])

    if (authLoading || dataLoading) return (
        <div style={{ minHeight: '100vh', background: DARK, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🐾</div>
                <p style={{ color: 'rgba(255,255,255,0.4)' }}>Cargando panel...</p>
            </div>
        </div>
    )

    if (error) return (
        <div style={{ minHeight: '100vh', background: DARK, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
            <p style={{ color: '#ff6b6b' }}>{error}</p>
        </div>
    )

    if (!data) return null

    const { global: g, new_users_by_day, appts_by_day, appts_by_status, top_clinics, last_users, security, pending_clinics = [], pending_profiles = [] } = data
    const pendingCount = pending_clinics.length + pending_profiles.length

    const StatCard = ({ icon, label, value, sub, color = G1 }) => (
        <div style={{ background: CARD, border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 32, flexShrink: 0 }}>{icon}</div>
            <div>
                <div style={{ fontSize: 28, fontWeight: 900, color, fontFamily: FONT, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{label}</div>
                {sub && <div style={{ fontSize: 11, color, marginTop: 2, fontWeight: 700 }}>{sub}</div>}
            </div>
        </div>
    )

    const SectionTitle = ({ children }) => (
        <h2 style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14, fontFamily: FONT }}>
            {children}
        </h2>
    )

    const Table = ({ headers, rows }) => (
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: FONT }}>
                <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                        {headers.map((h, i) => (
                            <th key={i} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                            {row.map((cell, j) => (
                                <td key={j} style={{ padding: '10px 16px', color: j === 0 ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: j === 0 ? 700 : 400 }}>{cell}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )

    const maxAppts = Math.max(...appts_by_day.map(d => d.count), 1)
    const maxUsers = Math.max(...new_users_by_day.map(d => d.count), 1)

    const handleApprove = async (userId, name, role = 'clinic') => {
        const labels = { clinic: 'veterinaria', business: 'negocio', shelter: 'refugio' }
        if (!window.confirm(`¿Aprobar ${labels[role] || 'el perfil'} "${name}"? Va a poder iniciar sesión inmediatamente.`)) return
        try {
            await api.post(`/users/admin/approve-profile/${userId}/`)
            await fetchData()
        } catch {
            alert('No se pudo aprobar. Intentá de nuevo.')
        }
    }

    const handleReject = async (userId, name, role = 'clinic') => {
        const labels = { clinic: 'la veterinaria', business: 'el negocio', shelter: 'el refugio' }
        if (!window.confirm(`¿Rechazar y ELIMINAR ${labels[role] || 'el perfil'} "${name}"? Esta acción no se puede deshacer.`)) return
        try {
            await api.post(`/users/admin/reject-profile/${userId}/`)
            await fetchData()
        } catch {
            alert('No se pudo rechazar. Intentá de nuevo.')
        }
    }

    const roleMeta = {
        owner: { label: 'Dueño', icon: '🐾', color: G1 },
        clinic: { label: 'Clínica', icon: '🏥', color: '#6bcaff' },
        business: { label: 'Negocio', icon: '🛍️', color: '#45c7a4' },
        shelter: { label: 'Refugio', icon: '🏠', color: '#ffb84d' },
    }

    return (
        <div style={{ minHeight: '100vh', background: DARK, fontFamily: FONT, paddingBottom: 60 }}>
            <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>🔐 Solo vos podés ver esto</div>
                        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', fontFamily: FONT }}>🐾 VetPaw — Panel de control</h1>
                        {lastUpdate && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Última actualización: {lastUpdate}</p>}
                    </div>
                    <button onClick={fetchData} style={{ background: `linear-gradient(135deg, ${G1}, ${O1})`, border: 'none', color: '#fff', borderRadius: 12, padding: '10px 20px', fontFamily: FONT, fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                        🔄 Actualizar
                    </button>
                </div>

                {/* Pestañas */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap' }}>
                    {[
                        { k: 'dashboard', l: '📊 Dashboard' },
                        { k: 'pending',   l: `✅ Pendientes${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
                        { k: 'lostPets',  l: `🔍 Mascotas perdidas${g.total_lost_active > 0 ? ` (${g.total_lost_active})` : ''}` },
                        { k: 'ads',       l: '📢 Anuncios' },
                        { k: 'blog',      l: '📝 Blog' },
                    ].map(t => (
                        <button key={t.k} onClick={() => setTab(t.k)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontWeight: 800, fontSize: 14, padding: '10px 4px', color: tab === t.k ? '#fff' : 'rgba(255,255,255,0.4)', borderBottom: `3px solid ${tab === t.k ? G1 : 'transparent'}`, marginBottom: -1, position: 'relative' }}>
                            {t.l}
                            {t.k === 'pending' && pendingCount > 0 && tab !== 'pending' && (
                                <span style={{ position: 'absolute', top: 4, right: -6, width: 8, height: 8, borderRadius: '50%', background: '#ff6b6b' }} />
                            )}
                        </button>
                    ))}
                </div>

                {tab === 'ads' && <AdsManager />}

                {tab === 'blog' && <BlogManager />}

                {tab === 'lostPets' && <AdminLostPetsManager />}

                {tab === 'pending' && (<>
                    <SectionTitle>✅ Perfiles profesionales pendientes de aprobación</SectionTitle>
                    {pendingCount === 0 ? (
                        <div style={{ background: CARD, border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 16, padding: '40px 24px', textAlign: 'center' }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', fontWeight: 700, marginBottom: 6 }}>No hay solicitudes pendientes</p>
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Cuando una veterinaria, negocio o refugio se registre va a aparecer acá para aprobarlo o rechazarlo.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: 14 }}>
                            {pending_clinics.map(c => (
                                <div key={c.user_id} style={{ background: CARD, border: `1px solid rgba(255,217,61,0.25)`, borderRadius: 16, padding: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                                        <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                <span style={{ fontSize: 11, fontWeight: 800, color: '#ffd93d', background: 'rgba(255,217,61,0.12)', padding: '3px 10px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Pendiente</span>
                                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{c.date_joined}</span>
                                            </div>
                                            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{c.clinic_name}</h3>
                                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 2 }}>👤 {c.username} · ✉️ {c.email}</p>
                                            {c.clinic_phone && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 2 }}>📞 {c.clinic_phone}</p>}
                                            {c.clinic_address && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>📍 {c.clinic_address}, {c.clinic_locality}, {c.clinic_province}</p>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                        <button onClick={() => handleReject(c.user_id, c.clinic_name, 'clinic')}
                                            style={{ background: 'transparent', border: '1.5px solid rgba(255,107,107,0.4)', color: '#ff6b6b', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>
                                            ✕ Rechazar
                                        </button>
                                        <button onClick={() => handleApprove(c.user_id, c.clinic_name, 'clinic')}
                                            style={{ background: `linear-gradient(135deg, ${G1}, #66BB6A)`, border: 'none', color: '#fff', borderRadius: 10, padding: '9px 22px', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: FONT, boxShadow: '0 4px 14px rgba(76,175,80,0.25)' }}>
                                            ✓ Aprobar
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {pending_profiles.map((item) => (
                                <div key={item.user_id} style={{ background: CARD, border: `1px solid ${item.role === 'business' ? 'rgba(69,199,164,.3)' : 'rgba(255,184,77,.3)'}`, borderRadius: 16, padding: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                                        <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: 11, fontWeight: 800, color: item.role === 'business' ? '#72e1c2' : '#ffd07a', background: item.role === 'business' ? 'rgba(69,199,164,.12)' : 'rgba(255,184,77,.12)', padding: '3px 10px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{item.role === 'business' ? '🛍️ Negocio' : '🏠 Refugio'}</span>
                                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{item.date_joined}</span>
                                            </div>
                                            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{item.name}</h3>
                                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 5 }}>{item.profile_type}</p>
                                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 2 }}>👤 {item.username} · ✉️ {item.email}</p>
                                            {(item.whatsapp || item.phone) && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 2 }}>💬 {item.whatsapp || item.phone}</p>}
                                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>📍 {item.locality || '—'}, {item.province || '—'}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                        <button onClick={() => handleReject(item.user_id, item.name, item.role)} style={{ background: 'transparent', border: '1.5px solid rgba(255,107,107,0.4)', color: '#ff6b6b', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>✕ Rechazar</button>
                                        <button onClick={() => handleApprove(item.user_id, item.name, item.role)} style={{ background: `linear-gradient(135deg, ${G1}, #66BB6A)`, border: 'none', color: '#fff', borderRadius: 10, padding: '9px 22px', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>✓ Aprobar</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>)}

                {tab === 'dashboard' && (<>
                {/* Stats globales */}
                <SectionTitle>📊 Métricas globales</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 32 }}>
                    <StatCard icon="👤" label="Dueños totales" value={g.total_owners} sub={`+${g.new_owners_week} esta semana`} color={G1} />
                    <StatCard icon="🏥" label="Clínicas totales" value={g.total_clinics} sub={`+${g.new_clinics_week} esta semana`} color="#6bcaff" />
                    <StatCard icon="🛍️" label="Negocios" value={g.total_businesses || 0} sub={`+${g.new_businesses_week || 0} esta semana`} color="#45c7a4" />
                    <StatCard icon="🏠" label="Refugios" value={g.total_shelters || 0} sub={`+${g.new_shelters_week || 0} esta semana`} color="#ffb84d" />
                    <StatCard icon="🐾" label="Mascotas" value={g.total_pets} color={O1} />
                    <StatCard icon="📅" label="Turnos totales" value={g.total_appts} sub={`+${g.new_appts_week} esta semana`} color="#6bffb8" />
                    <StatCard icon="🔍" label="Mascotas perdidas activas" value={g.total_lost_active} color="#ff6b6b" />
                </div>

                {/* Turnos por estado */}
                <SectionTitle>📋 Turnos esta semana por estado</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 32 }}>
                    {[
                        { label: 'Pendientes',  value: appts_by_status.pending,   color: '#ffd93d' },
                        { label: 'Confirmados', value: appts_by_status.confirmed,  color: '#6bcaff' },
                        { label: 'Realizados',  value: appts_by_status.completed,  color: '#6bffb8' },
                        { label: 'Cancelados',  value: appts_by_status.cancelled,  color: '#ff6b6b' },
                        { label: 'Ausentes',    value: appts_by_status.no_show,    color: '#ff9500' },
                    ].map((s, i) => (
                        <div key={i} style={{ background: CARD, border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                            <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Turnos por día */}
                <SectionTitle>📅 Turnos por día — últimos 7 días</SectionTitle>
                <div style={{ background: CARD, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 24px', marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
                        {appts_by_day.map((d, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                                <div style={{ fontSize: 11, color: '#6bffb8', fontWeight: 700 }}>{d.count}</div>
                                <div style={{ width: '100%', background: `linear-gradient(180deg, #6bffb8, rgba(107,255,184,0.3))`, borderRadius: '4px 4px 0 0', height: `${Math.max((d.count / maxAppts) * 80, d.count > 0 ? 8 : 2)}px`, transition: 'height 0.3s' }} />
                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{d.date}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Usuarios por día */}
                <SectionTitle>👤 Usuarios nuevos — últimos 7 días</SectionTitle>
                <div style={{ background: CARD, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 24px', marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
                        {new_users_by_day.map((d, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                                <div style={{ fontSize: 11, color: G1, fontWeight: 700 }}>{d.count}</div>
                                <div style={{ width: '100%', background: `linear-gradient(180deg, ${G1}, rgba(76,175,80,0.3))`, borderRadius: '4px 4px 0 0', height: `${Math.max((d.count / maxUsers) * 80, d.count > 0 ? 8 : 2)}px`, transition: 'height 0.3s' }} />
                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{d.date}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ranking clínicas */}
                <SectionTitle>🏥 Ranking de clínicas por turnos</SectionTitle>
                <div style={{ marginBottom: 32 }}>
                    <Table
                        headers={['Clínica', 'Localidad', 'Provincia', 'Turnos semana', 'Turnos total']}
                        rows={top_clinics.map(c => [
                            c.name,
                            c.locality || '—',
                            c.province || '—',
                            <span style={{ color: '#6bffb8', fontWeight: 900 }}>{c.appts_week}</span>,
                            c.appts_total,
                        ])}
                    />
                </div>

                {/* Últimos usuarios */}
                <SectionTitle>🆕 Últimos usuarios registrados</SectionTitle>
                <div style={{ marginBottom: 32 }}>
                    <Table
                        headers={['Username', 'Email', 'Rol', 'Fecha registro']}
                        rows={last_users.map(u => [
                            u.username,
                            u.email,
                            <span style={{ color: (roleMeta[u.role] || roleMeta.owner).color, fontWeight: 700 }}>
                                {(roleMeta[u.role] || roleMeta.owner).icon} {(roleMeta[u.role] || roleMeta.owner).label}
                            </span>,
                            u.date_joined,
                        ])}
                    />
                </div>

                {/* Seguridad */}
                <SectionTitle>🔐 Seguridad — intentos de login fallidos</SectionTitle>
                {security.length === 0 ? (
                    <div style={{ background: CARD, border: '1px solid rgba(107,255,184,0.2)', borderRadius: 16, padding: '20px 24px', color: '#6bffb8', fontWeight: 700, marginBottom: 32 }}>
                        ✅ Sin intentos fallidos registrados
                    </div>
                ) : (
                    <div style={{ marginBottom: 32 }}>
                        <Table
                            headers={['IP', 'Usuario intentado', 'Intentos', 'Último intento', 'Estado']}
                            rows={security.map(s => [
                                s.ip || '—',
                                s.username || '—',
                                <span style={{ color: s.locked ? '#ff6b6b' : '#ffd93d', fontWeight: 900 }}>{s.attempts}</span>,
                                s.last_attempt,
                                s.locked
                                    ? <span style={{ color: '#ff6b6b', fontWeight: 700 }}>🔒 Bloqueado</span>
                                    : <span style={{ color: '#ffd93d', fontWeight: 700 }}>⚠️ Advertencia</span>,
                            ])}
                        />
                    </div>
                )}
                </>)}

            </div>
        </div>
    )
}
