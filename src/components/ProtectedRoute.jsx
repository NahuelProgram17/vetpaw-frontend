import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import VetPawLoader from './VetPawLoader'
import { getProtectedRouteDecision } from '../utils/authFlow'

export default function ProtectedRoute({ children, role, permission }) {
    const { user, loading } = useAuth()
    const decision = getProtectedRouteDecision({ user, loading, role, permission })

    if (decision.kind === 'loading') {
        return <VetPawLoader message="Cargando VetPaw..." subText="Verificando tu sesión" />
    }

    if (decision.kind === 'redirect') {
        return <Navigate to={decision.to} replace />
    }

    if (decision.kind === 'pending_approval') {
        return (
            <div style={{
                minHeight: '100vh', background: '#1a1a2e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Nunito', sans-serif", padding: '24px',
            }}>
                <div style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '24px', padding: '48px 40px', maxWidth: '480px', textAlign: 'center',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px'
                }}>
                    <span style={{ fontSize: '4rem' }}>{decision.role === 'clinic' ? '🏥' : decision.role === 'business' ? '🛍️' : '🏠'}</span>
                    <h1 style={{
                        fontFamily: "'Fraunces', serif", fontSize: '1.8rem', fontWeight: 700,
                        fontStyle: 'italic', color: '#fff', letterSpacing: '-1px'
                    }}>
                        Cuenta pendiente de aprobación
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', lineHeight: 1.6 }}>
                        Tu {decision.role === 'clinic' ? 'veterinaria' : decision.role === 'business' ? 'negocio' : 'refugio'} está siendo verificado por el equipo de VetPaw.
                        Te avisaremos por email cuando esté habilitada.
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
                        ¿Tenés dudas? Escribinos a <span style={{ color: '#4CAF50' }}>vetpaw.app@gmail.com</span>
                    </p>
                    <a href="/login" style={{
                        marginTop: '8px', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem',
                        textDecoration: 'none'
                    }}>← Volver al inicio</a>
                </div>
            </div>
        )
    }

    return children
}
