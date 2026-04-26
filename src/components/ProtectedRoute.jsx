import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, role }) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh', background: '#1a1a2e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '3rem'
            }}>
                🐾
            </div>
        )
    }

    if (!user) return <Navigate to="/login" replace />

    if (role && user.role !== role) {
        return <Navigate to={user.role === 'vet' ? '/vet/dashboard' : '/dashboard'} replace />
    }

    return children
}