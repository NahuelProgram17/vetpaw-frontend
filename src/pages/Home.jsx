import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const curiosidades = [
    {
        animal: '🐕', tag: 'Perros', tagColor: 'bg-red-100 text-red-800', bg: 'bg-red-50',
        title: 'El olfato canino es 40 veces más poderoso que el humano',
        text: 'Tienen 300 millones de receptores olfativos. Por eso los usan en detección médica.',
    },
    {
        animal: '🐈', tag: 'Gatos', tagColor: 'bg-indigo-100 text-indigo-800', bg: 'bg-indigo-50',
        title: 'Los gatos ronronean tanto de felicidad como de estrés',
        text: 'La frecuencia del ronroneo (25-150 Hz) ayuda a regenerar tejidos óseos.',
    },
    {
        animal: '🐇', tag: 'Conejos', tagColor: 'bg-amber-100 text-amber-800', bg: 'bg-amber-50',
        title: 'Los conejos no pueden vomitar',
        text: 'Su digestión es unidireccional. Una mala dieta puede ser fatal en pocas horas.',
    },
]

const marcas = [
    { nombre: 'PipetaPlus', categoria: 'Antiparasitarios', emoji: '💊', color: '#ff6b6b', desc: 'Protección total contra pulgas y garrapatas' },
    { nombre: 'NutriPet', categoria: 'Alimentos premium', emoji: '🥩', color: '#ffd93d', desc: 'Nutrición balanceada para cada etapa de vida' },
    { nombre: 'VetCare', categoria: 'Suplementos', emoji: '🌿', color: '#6bffb8', desc: 'Vitaminas y minerales para mascotas activas' },
    { nombre: 'PetShop BA', categoria: 'Tienda online', emoji: '🛍️', color: '#6bcaff', desc: 'Todo lo que necesita tu mascota, en un click' },
]

const veterinariasDestacadas = [
    { nombre: 'Clínica Vida Animal', localidad: 'Palermo, CABA', especialidad: 'Clínica general · Cirugía', emoji: '🏥', destacada: true },
    { nombre: 'VetSur 24hs', localidad: 'Lomas de Zamora, GBA', especialidad: 'Urgencias · Guardia permanente', emoji: '🚑', destacada: true },
    { nombre: 'Centro Veterinario del Norte', localidad: 'San Isidro, GBA', especialidad: 'Dermatología · Odontología', emoji: '🏥', destacada: false },
]

export default function Home() {
    const { user } = useAuth()

    return (
        <div className="min-h-screen bg-[#fafaf8]">

            {/* HERO */}
            <div className="bg-[#1a1a2e] px-8 pt-16 pb-0 relative overflow-hidden min-h-[380px] flex items-center">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff6b6b]/20 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-[#ffd93d]/10 rounded-full translate-y-1/2 blur-2xl" />
                <div className="relative z-10 max-w-md">
                    <div className="inline-flex items-center gap-2 bg-[#ff6b6b]/20 border border-[#ff6b6b]/40 text-[#ff9e9e] text-xs px-3 py-1.5 rounded-full mb-4">
                        <span className="w-1.5 h-1.5 bg-[#ff6b6b] rounded-full" />
                        La app veterinaria de Argentina
                    </div>
                    <h1 className="text-4xl font-medium text-white leading-tight mb-3">
                        El historial de tu{' '}
                        <em className="not-italic text-[#ffd93d]">mascota</em>,
                        <br />siempre con vos
                    </h1>
                    <p className="text-white/60 text-sm leading-relaxed mb-6">
                        Expediente digital, turnos online y tu veterinaria de confianza.
                        Sin papeles, sin llamadas.
                    </p>
                    <div className="flex gap-3">
                        {user ? (
                            <Link to={user.role === 'vet' ? '/vet/dashboard' : '/dashboard'}
                                className="bg-[#ffd93d] text-[#1a1a2e] font-medium text-sm px-5 py-2.5 rounded-xl hover:bg-[#ffc800] transition">
                                Ir a mi panel →
                            </Link>
                        ) : (
                            <>
                                <Link to="/register" className="bg-[#ffd93d] text-[#1a1a2e] font-medium text-sm px-5 py-2.5 rounded-xl hover:bg-[#ffc800] transition">
                                    Crear cuenta gratis
                                </Link>
                                <Link to="/register?role=vet" className="bg-white/10 text-white text-sm px-5 py-2.5 rounded-xl border border-white/20 hover:bg-white/20 transition">
                                    Soy veterinario/a
                                </Link>
                            </>
                        )}
                    </div>
                </div>
                <div className="absolute right-8 bottom-0 top-8 flex items-end gap-3">
                    {[
                        { emoji: '🐕', bg: 'bg-[#ff6b6b]/20', h: 'h-36' },
                        { emoji: '🐈', bg: 'bg-[#ffd93d]/20', h: 'h-28' },
                        { emoji: '🐇', bg: 'bg-green-500/20', h: 'h-32' },
                        { emoji: '🐦', bg: 'bg-purple-500/20', h: 'h-24' },
                    ].map((item, i) => (
                        <div key={i} className={`${item.bg} ${item.h} w-20 rounded-2xl flex items-center justify-center text-4xl`}>
                            {item.emoji}
                        </div>
                    ))}
                </div>
            </div>

            {/* STATS */}
            <div className="bg-white grid grid-cols-4 border-b border-gray-100">
                {[
                    { n: '+200', l: 'Veterinarias' },
                    { n: '+5.000', l: 'Mascotas registradas' },
                    { n: '24/7', l: 'Acceso al historial' },
                    { n: '100%', l: 'Gratis para dueños' },
                ].map((s, i) => (
                    <div key={i} className="py-4 text-center border-r border-gray-100 last:border-none">
                        <div className="text-xl font-medium text-[#1a1a2e]">{s.n}</div>
                        <div className="text-xs text-gray-500 mt-1">{s.l}</div>
                    </div>
                ))}
            </div>

            {/* BANNER PUBLICITARIO PRINCIPAL */}
            <div className="px-8 py-6">
                <div className="relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 100%)' }}>
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 80% 50%, rgba(255,107,107,0.2) 0%, transparent 60%)' }} />
                    <div className="relative z-10 px-8 py-6 flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-[#ff6b6b] uppercase tracking-widest">Publicidad destacada</span>
                            <h3 className="text-white text-xl font-bold mt-1">PipetaPlus Pro — Protección total</h3>
                            <p className="text-white/60 text-sm mt-1">La pipeta antiparasitaria #1 en Argentina. Efecto hasta 3 meses.</p>
                            <button className="mt-3 bg-[#ff6b6b] text-white text-sm font-bold px-5 py-2 rounded-xl hover:bg-[#ff5252] transition">
                                Ver producto →
                            </button>
                        </div>
                        <div className="text-8xl opacity-80">💊</div>
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">Publicidad · VetPaw Ads</p>
            </div>

            {/* FEATURES */}
            <div className="px-8 py-4">
                <h2 className="text-base font-medium text-[#1a1a2e] mb-4">¿Qué podés hacer?</h2>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { bg: 'bg-red-50', accent: 'bg-red-100', icon: '📋', title: 'Expediente digital', text: 'Vacunas, alergias y toda la historia clínica en un lugar.' },
                        { bg: 'bg-yellow-50', accent: 'bg-yellow-100', icon: '📅', title: 'Turnos online', text: 'Pedí turno con tu veterinaria sin llamar.' },
                        { bg: 'bg-green-50', accent: 'bg-green-100', icon: '🔒', title: 'Vos controlás todo', text: 'Solo las veterinarias que elegís ven el historial.' },
                    ].map((f, i) => (
                        <div key={i} className={`${f.bg} rounded-2xl p-5`}>
                            <div className={`${f.accent} w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3`}>{f.icon}</div>
                            <h3 className="text-sm font-medium text-[#1a1a2e] mb-1">{f.title}</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">{f.text}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* MARCAS / ADS GRID */}
            <div className="px-8 py-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-base font-medium text-[#1a1a2e]">🛍️ Productos y marcas para tu mascota</h2>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Publicidad</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                    {marcas.map((m, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-gray-200 hover:shadow-sm transition cursor-pointer">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3"
                                style={{ background: `${m.color}15` }}>
                                {m.emoji}
                            </div>
                            <span className="text-xs font-bold" style={{ color: m.color }}>{m.categoria}</span>
                            <h4 className="text-sm font-bold text-[#1a1a2e] mt-1">{m.nombre}</h4>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{m.desc}</p>
                            <button className="mt-3 text-xs font-bold text-[#1a1a2e] border border-gray-200 px-3 py-1.5 rounded-lg w-full hover:bg-gray-50 transition">
                                Ver más →
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* VETERINARIAS DESTACADAS */}
            <div className="px-8 py-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-base font-medium text-[#1a1a2e]">🏥 Veterinarias destacadas</h2>
                    <Link to="/clinics" className="text-xs text-[#ff6b6b] font-medium">Ver todas →</Link>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {veterinariasDestacadas.map((v, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-[#ff6b6b]/30 transition cursor-pointer relative">
                            {v.destacada && (
                                <span className="absolute top-3 right-3 text-xs font-bold text-[#ff6b6b] bg-red-50 px-2 py-0.5 rounded-full">⭐ Destacada</span>
                            )}
                            <div className="text-3xl mb-3">{v.emoji}</div>
                            <h4 className="text-sm font-bold text-[#1a1a2e]">{v.nombre}</h4>
                            <p className="text-xs text-gray-500 mt-1">📍 {v.localidad}</p>
                            <p className="text-xs text-gray-400 mt-1">{v.especialidad}</p>
                            <Link to="/register" className="mt-3 block text-center text-xs font-bold text-white bg-[#1a1a2e] px-3 py-1.5 rounded-lg hover:bg-[#2d2d4e] transition">
                                Sacar turno →
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            {/* CURIOSIDADES */}
            <div className="px-8 py-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-base font-medium text-[#1a1a2e]">Sabías que...</h2>
                    <button className="text-xs text-[#ff6b6b]">Ver más →</button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {curiosidades.map((c, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden cursor-pointer hover:border-[#ff6b6b]/40 transition">
                            <div className={`${c.bg} h-20 flex items-center justify-center text-5xl`}>{c.animal}</div>
                            <div className="p-3">
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${c.tagColor} inline-block mb-2`}>{c.tag}</span>
                                <h4 className="text-xs font-medium text-[#1a1a2e] leading-snug mb-1">{c.title}</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">{c.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* BANNER ANUNCIANTES */}
            <div className="px-8 py-6">
                <div className="bg-gradient-to-r from-[#ffd93d] to-[#ffb800] rounded-2xl p-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-[#1a1a2e] font-bold text-lg">¿Tenés una marca de productos para mascotas?</h3>
                        <p className="text-[#1a1a2e]/70 text-sm mt-1">Llegá a miles de dueños de mascotas en toda Argentina. Publicite en VetPaw.</p>
                        <div className="flex gap-4 mt-3">
                            <div className="text-center">
                                <p className="text-[#1a1a2e] font-bold text-lg">+5.000</p>
                                <p className="text-[#1a1a2e]/60 text-xs">usuarios activos</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[#1a1a2e] font-bold text-lg">+200</p>
                                <p className="text-[#1a1a2e]/60 text-xs">veterinarias</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[#1a1a2e] font-bold text-lg">100%</p>
                                <p className="text-[#1a1a2e]/60 text-xs">audiencia target</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-6xl mb-3">📣</p>
                        <button className="bg-[#1a1a2e] text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#2d2d4e] transition">
                            Quiero anunciar →
                        </button>
                    </div>
                </div>
            </div>

            {/* CTA LOCALIDAD */}
            <div className="px-8 py-4">
                <div className="bg-[#1a1a2e] rounded-2xl p-6 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-48 h-48 bg-[#ff6b6b]/15 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
                    <div className="relative z-10">
                        <h3 className="text-white font-medium text-base mb-1">¿Querés ver veterinarias cerca tuyo?</h3>
                        <p className="text-white/50 text-xs">Registrate gratis y poné tu localidad para verlas al instante</p>
                    </div>
                    <Link to="/register" className="relative z-10 bg-[#ffd93d] text-[#1a1a2e] font-medium text-sm px-5 py-2.5 rounded-xl whitespace-nowrap hover:bg-[#ffc800] transition">
                        Registrarme →
                    </Link>
                </div>
            </div>

            {/* FOOTER */}
            <footer className="bg-[#1a1a2e] px-8 py-6 mt-4">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-[#ff6b6b] rounded-md flex items-center justify-center text-white text-xs font-bold">V</div>
                            <span className="text-white font-medium">VetPaw</span>
                        </div>
                        <p className="text-white/40 text-xs max-w-xs">La app veterinaria de Argentina. Tu mascota merece lo mejor.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-2">
                        {['Términos', 'Privacidad', 'Sumar mi veterinaria', 'Anunciar en VetPaw', 'Contacto', 'Blog'].map(l => (
                            <span key={l} className="text-white/40 text-xs cursor-pointer hover:text-white/70 transition">{l}</span>
                        ))}
                    </div>
                </div>
                <div className="border-t border-white/10 pt-4">
                    <p className="text-white/30 text-xs text-center">© 2026 VetPaw · Todos los derechos reservados</p>
                </div>
            </footer>
        </div>
    )
}