import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getCommunityReports, moderateCommunityReport } from '../services/api'
import './Community.css'

const filters = ['pending', 'reviewed', 'actioned', 'dismissed']

export default function CommunityModeration() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState('pending')
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  const allowed = user && (user.is_staff || user.is_superuser || user.username === 'jaime17')
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getCommunityReports(status)
      setReports(data.results ?? data)
    } finally { setLoading(false) }
  }, [status])

  useEffect(() => {
    if (authLoading) return
    if (!allowed) { navigate('/'); return }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [authLoading, allowed, navigate, load])

  const decide = async (id, decision) => {
    const notes = window.prompt('Nota de moderación (opcional):', '') ?? ''
    await moderateCommunityReport(id, decision, notes)
    await load()
  }

  if (!allowed) return null
  return (
    <main className="moderation-page">
      <div className="moderation-shell">
        <div className="community-hero community-card"><div className="community-kicker">Administración VetPaw</div><h1>Moderación de la <span>comunidad</span></h1><p>Revisá reportes, ocultá contenido y dejá registro de cada decisión.</p></div>
        <div className="community-toolbar community-card">{filters.map((item) => <button key={item} className={`filter-pill ${status === item ? 'active' : ''}`} onClick={() => setStatus(item)}>{item}</button>)}</div>
        {loading ? <div className="empty-feed community-card"><div className="icon">🛡️</div><h3>Cargando reportes...</h3></div> : reports.length ? reports.map((report) => (
          <div className="report-card community-card" key={report.id}>
            <div><h3>#{report.id} · {report.reason_display}</h3><p>Reportado por <strong>{report.reporter_name}</strong> · {new Date(report.created_at).toLocaleString('es-AR')}</p><p><strong>Contenido:</strong> {report.target_preview?.text || 'Sin vista previa'}</p>{report.details && <p><strong>Detalle:</strong> {report.details}</p>}{report.moderator_notes && <p><strong>Nota:</strong> {report.moderator_notes}</p>}</div>
            {status === 'pending' && <div className="report-actions"><button className="community-button-secondary" onClick={() => decide(report.id, 'dismiss')}>Descartar</button><button className="community-button-secondary" onClick={() => decide(report.id, 'review')}>Revisado</button><button className="community-button" onClick={() => decide(report.id, 'hide')}>Ocultar</button><button className="community-button" style={{ background: '#d9534f' }} onClick={() => decide(report.id, 'remove')}>Eliminar</button></div>}
          </div>
        )) : <div className="empty-feed community-card"><div className="icon">✅</div><h3>No hay reportes en esta sección</h3><p>La comunidad está al día.</p></div>}
      </div>
    </main>
  )
}
