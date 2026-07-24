import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api from '../services/api'
import { SERVICE_RECOVERED_EVENT } from '../utils/serviceErrors'

const AuthContext = createContext()

const clearAuthTokens = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [authError, setAuthError] = useState('')

    const loadProfile = useCallback(async () => {
        const token = localStorage.getItem('access_token')
        if (!token) {
            setUser(null)
            setAuthError('')
            setLoading(false)
            return null
        }

        setLoading(true)
        setAuthError('')
        try {
            const response = await api.get('/users/profile/')
            setUser(response.data)
            return response.data
        } catch (error) {
            const status = error.response?.status
            if (status === 401 || status === 403) {
                clearAuthTokens()
                setUser(null)
                setAuthError('')
            } else {
                // Una caída temporal de internet o Railway no debe cerrar la sesión.
                setAuthError(error.userMessage || 'No pudimos verificar tu sesión. Tus datos siguen seguros; reintentá cuando vuelva la conexión.')
            }
            return null
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadProfile()
    }, [loadProfile])

    useEffect(() => {
        const retrySession = () => {
            if (localStorage.getItem('access_token')) loadProfile()
        }
        window.addEventListener(SERVICE_RECOVERED_EVENT, retrySession)
        return () => {
            window.removeEventListener(SERVICE_RECOVERED_EVENT, retrySession)
        }
    }, [loadProfile])

    const login = async (username, password) => {
        const response = await api.post('/users/login/', { username, password })
        localStorage.setItem('access_token', response.data.access)
        localStorage.setItem('refresh_token', response.data.refresh)
        const profile = await api.get('/users/profile/')
        setUser(profile.data)
        setAuthError('')
        return profile.data
    }

    const logout = () => {
        const endpoint = localStorage.getItem('vetpaw_push_endpoint')
        const accessToken = localStorage.getItem('access_token')
        if (endpoint && accessToken) {
            api.post(
                '/community/push/unsubscribe/',
                { endpoint },
                { headers: { Authorization: `Bearer ${accessToken}` } },
            ).catch(() => {})
        }
        localStorage.clear()
        setUser(null)
        setAuthError('')
    }

    return (
        <AuthContext.Provider value={{ user, loading, authError, retryAuth: loadProfile, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

// Hook compartido: se exporta junto al provider de forma intencional.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
