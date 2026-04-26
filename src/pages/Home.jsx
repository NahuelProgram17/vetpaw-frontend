import { Link } from 'react-router-dom'

const curiosidades = [
    {
        animal: '🐕',
        tag: 'Perros',
        tagColor: 'bg-red-100 text-red-800',
        bg: 'bg-red-50',
        title: 'El olfato canino es 40 veces más poderoso que el humano',
        text: 'Tienen 300 millones de receptores olfativos. Por eso los usan en detección médica.',
    },
    {
        animal: '🐈',
        tag: 'Gatos',
        tagColor: 'bg-indigo-100 text-indigo-800',
        bg: 'bg-indigo-50',
        title: 'Los gatos ronronean tanto de felicidad como de estrés',
        text: 'La frecuencia del ronroneo (25-150 Hz) ayuda a regenerar tejidos óseos.',
    },
    {
        animal: '🐇',
        tag: 'Conejos',
        tagColor: 'bg-amber-100 text-amber-800',
        bg: 'bg-amber-50',
        title: 'Los conejos no pueden vomitar',
        text: 'Su digestión es unidireccional. Una mala dieta puede ser fatal en pocas horas.',
    },
]

export default function Home() {
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
                        <Link to="/register" className="bg-[#ffd93d] text-[#1a1a2e] font-medium text-sm px-5 py-2.5 rounded-xl hover:bg-[#ffc800] transition">
                            Crear cuenta gratis
                        </Link>
                        <Link to="/register?role=vet" className="bg-white/10 text-white text-sm px-5 py-2.5 rounded-xl border border-white/20 hover:bg-white/20 transition">
                            Soy veterinario/a
                        </Link>
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

            {/* FEATURES */}
            <div className="px-8 py-8">
                <h2 className="text-base font-medium text-[#1a1a2e] mb-4">¿Qué podés hacer?</h2>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { bg: 'bg-red-50', accent: 'bg-red-100', icon: '📋', title: 'Expediente digital', text: 'Vacunas, alergias y toda la historia clínica en un lugar.' },
                        { bg: 'bg-yellow-50', accent: 'bg-yellow-100', icon: '📅', title: 'Turnos online', text: 'Pedí turno con tu veterinaria sin llamar.' },
                        { bg: 'bg-green-50', accent: 'bg-green-100', icon: '🔒', title: 'Vos controlás todo', text: 'Solo las veterinarias que elegís ven el historial.' },
                    ].map((f, i) => (
                        <div key={i} className={`${f.bg} rounded-2xl p-5 relative overflow-hidden`}>
                            <div className={`${f.accent} w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3`}>{f.icon}</div>
                            <h3 className="text-sm font-medium text-[#1a1a2e] mb-1">{f.title}</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">{f.text}</p>
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

            {/* CTA LOCALIDAD */}
            <div className="px-8 py-6">
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
            <footer className="bg-[#1a1a2e] px-8 py-4 flex justify-between items-center mt-4">
                <p className="text-white/40 text-xs">© 2026 VetPaw · Tu mascota merece lo mejor</p>
                <div className="flex gap-4">
                    {['Términos', 'Privacidad', 'Sumar mi veterinaria', 'Contacto'].map(l => (
                        <span key={l} className="text-white/40 text-xs cursor-pointer hover:text-white/70 transition">{l}</span>
                    ))}
                </div>
            </footer>
        </div>
    )
}