import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    return (
        <nav className="bg-[#1a1a2e] px-6 h-14 flex items-center justify-between sticky top-0 z-50 border-b border-white/5">
            <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#ff6b6b] rounded-lg flex items-center justify-center text-white font-bold text-sm">V</div>
                <span className="text-white font-medium text-lg">VetPaw</span>
            </Link>

            <div className="flex items-center gap-2">
                {!user ? (
                    <>
                        <Link to="/clinics" className="text-white/70 text-sm px-3 py-1.5 hover:text-white transition">
                            Veterinarias
                        </Link>
                        <Link to="/login" className="text-white text-sm border border-white/30 px-4 py-1.5 rounded-lg hover:bg-white/10 transition">
                            Ingresar
                        </Link>
                        <Link to="/register" className="bg-[#ff6b6b] text-white text-sm px-4 py-1.5 rounded-lg hover:bg-[#ff5252] transition">
                            Registrarme
                        </Link>
                        
                    </>
                ) : user.role === 'vet' ? (
                    <>
                        <Link to="/vet/dashboard" className="text-white/70 text-sm px-3 py-1.5 hover:text-white transition">
                            Panel
                        </Link>
                        <span className="text-white/50 text-sm">|</span>
                        <span className="text-white/70 text-sm">{user.first_name || user.username}</span>
                        <button onClick={handleLogout} className="text-white/50 text-sm px-3 py-1.5 hover:text-white transition">
                            Salir
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/dashboard" className="text-white/70 text-sm px-3 py-1.5 hover:text-white transition">
                            Mi panel
                        </Link>
                        <Link to="/pets" className="text-white/70 text-sm px-3 py-1.5 hover:text-white transition">
                            Mascotas
                        </Link>
                        <Link to="/appointments" className="text-white/70 text-sm px-3 py-1.5 hover:text-white transition">
                            Turnos
                        </Link>
                        <Link to="/history" className="text-white/70 text-sm px-3 py-1.5 hover:text-white transition">
                            Historial
                        </Link>
                        <Link to="/clinics" className="text-white/70 text-sm px-3 py-1.5 hover:text-white transition">
                            Veterinarias
                        </Link>
                        <Link to="/profile" className="text-white/70 text-sm px-3 py-1.5 hover:text-white transition">
                            Mi perfil
                        </Link>
                        <span className="text-white/50 text-sm">|</span>
                        <span className="text-white/70 text-sm">{user.first_name || user.username}</span>
                        <button onClick={handleLogout} className="text-white/50 text-sm px-3 py-1.5 hover:text-white transition">
                            Salir
                        </button>
                    </>
                )}
            </div>
        </nav>
    )
}