import { useState } from 'react'
import { reportCommunityContent } from '../../services/api'

const REASONS = [
  ['spam', 'Spam o publicidad engañosa'],
  ['scam', 'Estafa o información falsa'],
  ['abuse', 'Maltrato, acoso o violencia'],
  ['privacy', 'Datos personales o privacidad'],
  ['animal_sale', 'Venta irresponsable de animales'],
  ['inappropriate', 'Contenido inapropiado'],
  ['other', 'Otro motivo'],
]

export default function ReportModal({ target, onClose }) {
  const [reason, setReason] = useState('spam')
  const [details, setDetails] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setSaving(true)
    setError('')
    try {
      await reportCommunityContent({ ...target, reason, details })
      setDone(true)
    } catch (e) {
      setError(e.response?.data?.detail || e.response?.data?.error || 'No pudimos enviar el reporte.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="community-modal-backdrop" onMouseDown={onClose}>
      <div className="community-modal community-card" onMouseDown={(e) => e.stopPropagation()}>
        {done ? (
          <>
            <h3>✅ Reporte recibido</h3>
            <p>Gracias por cuidar la comunidad. El contenido quedó enviado para revisión.</p>
            <div className="community-modal-actions"><button className="community-button" onClick={onClose}>Listo</button></div>
          </>
        ) : (
          <>
            <h3>Reportar contenido</h3>
            <p>Elegí el motivo. El reporte es privado y será revisado desde el panel de moderación de VetPaw.</p>
            {error && <div className="community-error">{error}</div>}
            <select className="community-select" value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
            <textarea className="community-textarea" style={{ marginTop: 10, minHeight: 80 }} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Contanos un poco más (opcional)" maxLength={1000} />
            <div className="community-modal-actions">
              <button className="community-button-secondary" onClick={onClose}>Cancelar</button>
              <button className="community-button" disabled={saving} onClick={submit}>{saving ? 'Enviando...' : 'Enviar reporte'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
