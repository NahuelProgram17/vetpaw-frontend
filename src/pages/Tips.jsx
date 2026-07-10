import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const categorias = ['Todos', 'Perros', 'Gatos', 'Conejos', 'Aves', 'Caballos', 'Reptiles', 'Emergencias', 'Cuidados']

const COLORES_CAT = {
    'Perros': '#ff6b6b', 'Gatos': '#6bcaff', 'Conejos': '#ffd93d',
    'Aves': '#6bffb8', 'Caballos': '#c084fc', 'Reptiles': '#4ade80',
    'Emergencias': '#ff4a4a', 'Cuidados': '#fb923c', 'Todos': '#fff',
}
const ICONOS_CAT = {
    'Perros': '🐕', 'Gatos': '🐈', 'Conejos': '🐇', 'Aves': '🦜',
    'Caballos': '🐴', 'Reptiles': '🦎', 'Emergencias': '🚨', 'Cuidados': '💚', 'Todos': '🐾',
}
const BG_CAT = {
    'Perros': '#3d1010', 'Gatos': '#0d1f3d', 'Conejos': '#2d2000',
    'Aves': '#0d2d1a', 'Caballos': '#1f0d3d', 'Reptiles': '#0a2010', 'Emergencias': '#3d0a0a',
}

const datosCuriosos = [
    { id: 1,  categoria: 'Perros',   img: '/tips/perro1.jpg',      titulo: 'El olfato canino es 40 veces más poderoso que el humano',     icono: '🐕', contenido: 'Los perros tienen entre 125 y 300 millones de receptores olfativos en su nariz, mientras que los humanos solo tenemos 5 millones. Por eso son usados en detección de drogas, explosivos, enfermedades como el cáncer y hasta estados emocionales.' },
    { id: 2,  categoria: 'Perros',   img: '/tips/perro2.jpg',      titulo: 'Los perros sueñan igual que los humanos',                     icono: '🐕', contenido: 'Durante la fase REM del sueño, los perros experimentan sueños similares a los nuestros. Podés notarlo cuando mueven las patas, emiten sonidos o contraen el hocico mientras duermen. Los cachorros y perros viejos sueñan con más frecuencia.' },
    { id: 3,  categoria: 'Gatos',    img: '/tips/gato1.jpg',       titulo: 'Los gatos ronronean tanto de felicidad como de estrés',       icono: '🐈', contenido: 'El ronroneo ocurre entre 25 y 150 Hz. Esa frecuencia favorece la regeneración de huesos y tejidos. Los gatos también ronronean cuando están heridos o asustados, como mecanismo de autoconsuelo y curación.' },
    { id: 4,  categoria: 'Gatos',    img: '/tips/gato2.jpg',       titulo: 'Los gatos pasan el 70% de su vida durmiendo',                icono: '🐈', contenido: 'Un gato adulto duerme entre 12 y 16 horas diarias. Son depredadores crepusculares: su pico de actividad es al amanecer y al atardecer. Este patrón de sueño es instintivo y viene de sus ancestros salvajes que conservaban energía para cazar.' },
    { id: 5,  categoria: 'Conejos',  img: '/tips/conejo1.jpg',     titulo: 'Los conejos no pueden vomitar',                              icono: '🐇', contenido: 'Su sistema digestivo es unidireccional: la comida solo puede ir hacia adelante. Esto los hace extremadamente vulnerables a las obstrucciones intestinales. Una mala dieta, poco heno o ingerir pelo puede ser fatal en pocas horas.' },
    { id: 6,  categoria: 'Conejos',  img: '/tips/conejo2.jpg',     titulo: 'Los conejos tienen visión casi de 360 grados',               icono: '🐇', contenido: 'Sus ojos están ubicados a los lados de la cabeza, lo que les permite ver casi todo su entorno sin mover la cabeza. Esto es una adaptación evolutiva como presa: pueden detectar depredadores que se acercan desde casi cualquier ángulo.' },
    { id: 7,  categoria: 'Aves',     img: '/tips/loro1.jpg',       titulo: 'Los loros pueden aprender cientos de palabras',              icono: '🦜', contenido: 'Los loros grises africanos tienen capacidad cognitiva similar a un niño de 5 años. Pueden aprender más de 1000 palabras, entender conceptos abstractos como colores y cantidades, y hasta usar el lenguaje en contexto apropiado.' },
    { id: 8,  categoria: 'Aves',     img: '/tips/pajaro1.jpg',     titulo: 'Las aves tienen huesos huecos para volar',                   icono: '🐦', contenido: 'Los huesos de las aves están llenos de aire en lugar de médula, lo que los hace más ligeros sin perder resistencia. Algunos huesos están conectados directamente al sistema respiratorio, lo que hace que su esqueleto sea único en el reino animal.' },
    { id: 9,  categoria: 'Caballos', img: '/tips/caballo1.jpg',    titulo: 'Los caballos duermen de pie',                                icono: '🐴', contenido: 'Los caballos tienen un mecanismo de bloqueo en las patas llamado "aparato de suspensión" que les permite descansar sin caerse. Sin embargo, para el sueño REM profundo necesitan acostarse. Un caballo que nunca se acuesta puede estar sufriendo dolor o estrés.' },
    { id: 10, categoria: 'Caballos', img: '/tips/caballo2.jpg',    titulo: 'Los caballos tienen memoria excepcional',                    icono: '🐴', contenido: 'Los caballos pueden recordar a personas y otros caballos durante años. Estudios muestran que reconocen expresiones faciales humanas y recuerdan si una persona les trató bien o mal. También pueden resolver problemas simples y aprender por observación.' },
    { id: 11, categoria: 'Reptiles', img: '/tips/iguana1.jpg',     titulo: 'Los reptiles son de sangre fría pero no les gusta el frío',  icono: '🦎', contenido: 'Los reptiles son ectotermos: regulan su temperatura corporal mediante el entorno. Necesitan zonas de calor y zonas frescas en su hábitat. Sin la temperatura adecuada, su metabolismo se ralentiza, no pueden digerir bien y su sistema inmune se debilita.' },
    { id: 12, categoria: 'Reptiles', img: '/tips/serpiente1.jpg',  titulo: 'Las serpientes "huelen" con la lengua',                     icono: '🐍', contenido: 'Las serpientes usan su lengua bífida para capturar partículas del aire y llevarlas al órgano de Jacobson, ubicado en el paladar. Esto les permite detectar presas, parejas y depredadores con una precisión asombrosa, incluso en la oscuridad total.' },
]

const cuidados = [
    { id: 101, categoria: 'Perros',   img: '/tips/perro_corre.jpg',   titulo: 'Cuánto ejercicio necesita tu perro',          icono: '🏃', contenido: 'Razas pequeñas (chihuahua, poodle): 20-30 min diarios. Razas medianas (beagle, cocker): 45-60 min. Razas grandes (labrador, golden): 1-2 horas. Razas de trabajo (border collie, husky): 2+ horas. El ejercicio insuficiente causa ansiedad y obesidad.' },
    { id: 102, categoria: 'Perros',   img: '/tips/perro1.jpg',        titulo: 'Calendario de vacunas para perros',           icono: '💉', contenido: 'Cachorros: a los 45 días primera vacuna polivalente, refuerzo a los 21 días, antirrábica a los 3 meses. Adultos: refuerzo polivalente anual, antirrábica según normativa local. Las vacunas previenen distemper, parvovirus, hepatitis y leptospirosis.' },
    { id: 103, categoria: 'Gatos',    img: '/tips/gato_come.jpg',     titulo: 'Alimentación correcta para gatos',            icono: '🥩', contenido: 'Los gatos son carnívoros estrictos: necesitan proteína animal. Evitá alimentos con mucho cereal o vegetal. La alimentación húmeda (lata) ayuda a la hidratación y salud renal. El agua siempre debe estar disponible y fresca. Los mayores de 7 años necesitan dietas específicas.' },
    { id: 104, categoria: 'Conejos',  img: '/tips/conejo_heno.jpg',   titulo: 'Cuidados básicos del conejo doméstico',       icono: '🥬', contenido: 'El heno debe ser el 80% de su dieta — es fundamental para su digestión y desgaste dental. Complementar con verduras frescas y muy poca fruta. Necesitan espacio para correr y explorar. Visita veterinaria anual y esterilización recomendada para prolongar su vida.' },
    { id: 105, categoria: 'Aves',     img: '/tips/ave_jaula.jpg',     titulo: 'Cómo cuidar a tu ave en casa',                icono: '🦜', contenido: 'La jaula debe ser amplia — el ave necesita poder extender las alas completamente. Ofrecé variedad de alimentos: semillas, frutas, verduras y pellets. Necesitan luz solar o luz UV artificial. La estimulación mental es vital: juguetes, interacción diaria, música.' },
    { id: 106, categoria: 'Caballos', img: '/tips/caballa_c.jpg',     titulo: 'Cuidados esenciales del caballo',             icono: '🐴', contenido: 'Los caballos necesitan agua limpia todo el día (50-60 litros diarios). Su dieta debe ser heno de calidad, pasto y complemento mineral. El casco debe ser revisado por un herrador cada 6-8 semanas. Necesitan vacunación anual y desparasitación cada 6 meses.' },
    { id: 107, categoria: 'Reptiles', img: '/tips/reptil_c.jpg',      titulo: 'Hábitat ideal para tu reptil',                icono: '🦎', contenido: 'El terrario debe tener zonas de temperatura diferente: una cálida (30-35°C) y una fresca (22-26°C). La luz UVB es esencial para la síntesis de vitamina D3 y metabolismo del calcio. La humedad varía según la especie: los camaleones necesitan más que los lagartos del desierto.' },
]

const emergencias = [
    { id: 201, img: '/tips/emerg1.jpg', titulo: '¿Qué hacer si tu mascota se atraganta?', icono: '🚨', contenido: '1. Revisá la boca con cuidado — si ves el objeto y podés sacarlo sin riesgo, hacelo. 2. Para perros: parate detrás, rodeá su cintura y hacé presión abdominal hacia arriba. 3. Para gatos: sostenélos boca abajo y dales golpes suaves entre los omóplatos. 4. Si no lográs desobstruir en 1-2 minutos, llevá a la veterinaria DE INMEDIATO.' },
    { id: 202, img: '/tips/emerg2.jpg', titulo: '¿Qué hacer ante una convulsión?',        icono: '⚡', contenido: '1. Mantené la calma — las convulsiones rara vez son fatales. 2. Alejá objetos peligrosos que pueda golpear. 3. NO le metas nada en la boca. 4. Cronometrá la duración. 5. Después de que pase, mantenélo tranquilo en un lugar oscuro. 6. Si dura más de 5 minutos o se repite, es EMERGENCIA veterinaria.' },
    { id: 203, img: '/tips/emerg3.jpg', titulo: 'Golpe de calor: síntomas y acción',      icono: '🌡️', contenido: 'Síntomas: jadeo excesivo, babeo, encías rojas o azuladas, vómitos, pérdida de equilibrio. Llevá a la mascota a un lugar fresco, mojale las patas y el cuello con agua fría (NO helada), ofrecele agua en pequeñas cantidades y llevala al veterinario urgente. NUNCA la dejes en un auto cerrado.' },
    { id: 204, img: '/tips/emerg4.jpg', titulo: 'Intoxicación: alimentos prohibidos',     icono: '☠️', contenido: 'NUNCA darles: chocolate, uvas y pasas, cebolla y ajo, xilitol (endulzante artificial), aguacate, alcohol, macadamia, cafeína. Síntomas: vómitos, diarrea, temblores, dificultad respiratoria. Ante cualquier sospecha, llamá al veterinario de inmediato y llevá el envase del producto ingerido.' },
]

export default function Tips() {
    const [categoriaActiva, setCategoriaActiva] = useState('Todos')
    const [busqueda, setBusqueda] = useState('')
    const [expandido, setExpandido] = useState(null)
    useEffect(() => { window.scrollTo(0, 0); }, []);

    const filtrar = (items) => items.filter(t => {
        const matchCat = categoriaActiva === 'Todos' || categoriaActiva === 'Emergencias' || categoriaActiva === 'Cuidados'
            ? true : t.categoria === categoriaActiva
        const matchQ = t.titulo.toLowerCase().includes(busqueda.toLowerCase()) || t.contenido.toLowerCase().includes(busqueda.toLowerCase())
        return matchCat && matchQ
    })

    const mostrarEmerg = categoriaActiva === 'Todos' || categoriaActiva === 'Emergencias'
    const mostrarResto = categoriaActiva !== 'Emergencias'
    const curiososFilt = mostrarResto ? filtrar(datosCuriosos) : []
    const cuidadosFilt = mostrarResto ? filtrar(cuidados) : []

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #080808 0%, #0b1a0b 35%, #0f0a00 100%)', fontFamily: "'Nunito', sans-serif" }}>
            <style>{`
                @media (max-width: 600px) {
                    .tips-header { padding: 32px 16px 32px !important; }
                    .tips-header h1 { font-size: 34px !important; }
                    .tips-header img { height: 110px !important; }
                    .tips-header p { font-size: 14px !important; }
                    .tips-filters { padding: 0 14px 28px !important; }
                    .tips-grid-wrap { padding: 0 14px 80px !important; }
                    .tips-section h2 { font-size: 24px !important; }
                }
                @media (max-width: 380px) {
                    .tips-header h1 { font-size: 28px !important; }
                    .tips-header img { height: 90px !important; }
                    .tips-section h2 { font-size: 21px !important; }
                }
            `}</style>

            <div style={{ height: 4, background: 'linear-gradient(90deg, #ff6b35 0%, #ffd93d 25%, #4ade80 50%, #6bcaff 75%, #c084fc 100%)' }} />

            {/* HEADER */}
            <div className="tips-header" style={{ padding: '52px 40px 48px', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
                <div style={{ position: 'absolute', top: -120, right: -120, width: 400, height: 400, background: 'radial-gradient(circle, rgba(255,107,53,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: -80, left: -60, width: 300, height: 300, background: 'radial-gradient(circle, rgba(74,222,128,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

                <Link to="/" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>
                    ← Volver al inicio
                </Link>
                <div style={{ marginBottom: 18, filter: 'drop-shadow(0 0 24px rgba(76,175,80,0.6))', display: 'flex', justifyContent: 'center' }}>
                    <img src="/logo_vetpaw.png" alt="VetPaw" style={{ height: 180, width: 'auto' }} />
                </div>
                <h1 style={{ fontSize: 50, fontWeight: 900, marginBottom: 14, letterSpacing: -2, background: 'linear-gradient(135deg, #ff6b35 0%, #ffd93d 45%, #4ade80 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    Tips & Curiosidades
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 17, lineHeight: 1.7, maxWidth: 520, margin: '0 auto 36px' }}>
                    Todo lo que necesitás saber para cuidar mejor a tu mascota. Datos curiosos, consejos y guías de emergencia.
                </p>
                <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto' }}>
                    <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', fontSize: 20 }}>🔍</span>
                    <input type="text" placeholder="Buscar tips y curiosidades..."
                        value={busqueda} onChange={e => setBusqueda(e.target.value)}
                        style={{ width: '100%', padding: '16px 20px 16px 52px', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 16, color: '#fff', fontSize: 16, fontFamily: "'Nunito', sans-serif", outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => { e.target.style.borderColor = 'rgba(74,222,128,0.5)'; e.target.style.background = 'rgba(255,255,255,0.09)' }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.06)' }}
                    />
                </div>
            </div>

            {/* FILTROS EN CHIPS */}
            <div className="tips-filters" style={{ padding: '0 40px 40px', maxWidth: 1400, margin: '0 auto' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                    {categorias.map(cat => {
                        const activo = categoriaActiva === cat
                        const color = COLORES_CAT[cat]
                        return (
                            <button key={cat} onClick={() => setCategoriaActiva(cat)} style={{
                                padding: '10px 20px',
                                background: activo ? `${color}20` : 'rgba(255,255,255,0.05)',
                                border: `1.5px solid ${activo ? color : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: 99, color: activo ? color : 'rgba(255,255,255,0.45)',
                                fontWeight: activo ? 900 : 600, fontSize: 14, cursor: 'pointer',
                                fontFamily: "'Nunito', sans-serif", transition: 'all .2s',
                                display: 'flex', alignItems: 'center', gap: 6,
                                boxShadow: activo ? `0 0 20px ${color}30` : 'none',
                            }}>
                                <span>{ICONOS_CAT[cat]}</span> {cat}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* CONTENIDO */}
            <div className="tips-grid-wrap" style={{ maxWidth: 1400, margin: '0 auto', padding: '0 40px 100px' }}>

                {mostrarEmerg && (
                    <Seccion badge="🚨 Primeros auxilios" badgeColor="#ff6b6b" badgeBg="rgba(255,107,107,0.12)" badgeBorder="rgba(255,107,107,0.3)" titulo="Guías de emergencia" subtitulo="Leé esto antes de que lo necesites. En una emergencia, cada segundo cuenta.">
                        {emergencias.map(e => <EmergCard key={e.id} item={e} expandido={expandido} setExpandido={setExpandido} />)}
                    </Seccion>
                )}

                {mostrarResto && curiososFilt.length > 0 && (
                    <Seccion badge="🌟 Sabías que..." badgeColor="#ffd93d" badgeBg="rgba(255,217,61,0.1)" badgeBorder="rgba(255,217,61,0.25)" titulo="Datos curiosos" subtitulo="Cosas sorprendentes que quizás no sabías de tus animales favoritos.">
                        {curiososFilt.map(t => <TipCard key={t.id} tip={t} expandido={expandido} setExpandido={setExpandido} />)}
                    </Seccion>
                )}

                {mostrarResto && cuidadosFilt.length > 0 && (
                    <Seccion badge="💚 Bienestar animal" badgeColor="#4ade80" badgeBg="rgba(74,222,128,0.1)" badgeBorder="rgba(74,222,128,0.25)" titulo="Cuidados esenciales" subtitulo="Todo lo que necesitás para mantener a tu mascota sana y feliz.">
                        {cuidadosFilt.map(t => <TipCard key={t.id} tip={t} expandido={expandido} setExpandido={setExpandido} />)}
                    </Seccion>
                )}

                {curiososFilt.length === 0 && cuidadosFilt.length === 0 && !mostrarEmerg && (
                    <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                        <div style={{ fontSize: 70, marginBottom: 20 }}>🐾</div>
                        <h3 style={{ color: '#fff', fontSize: 24, fontWeight: 900, marginBottom: 10 }}>Sin resultados</h3>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>Probá con otra búsqueda o categoría.</p>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
                @keyframes pulseRed { 0%,100% { box-shadow:0 0 0 0 rgba(255,74,74,0.5); } 50% { box-shadow:0 0 0 10px rgba(255,74,74,0); } }
            `}</style>
        </div>
    )
}

function Seccion({ badge, badgeColor, badgeBg, badgeBorder, titulo, subtitulo, children }) {
    return (
        <div className="tips-section" style={{ marginBottom: 80 }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <span style={{ display: 'inline-block', background: badgeBg, border: `1px solid ${badgeBorder}`, color: badgeColor, fontSize: 12, fontWeight: 900, letterSpacing: 2, padding: '8px 20px', borderRadius: 99, textTransform: 'uppercase', marginBottom: 16 }}>{badge}</span>
                <h2 style={{ fontSize: 34, fontWeight: 900, color: '#fff', marginBottom: 10, letterSpacing: -1 }}>{titulo}</h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>{subtitulo}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 22 }}>
                {children}
            </div>
        </div>
    )
}

function TipCard({ tip, expandido, setExpandido }) {
    const abierto = expandido === tip.id
    const color = COLORES_CAT[tip.categoria]
    const [imgError, setImgError] = useState(false)

    return (
        <div onClick={() => setExpandido(abierto ? null : tip.id)} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 22, overflow: 'hidden', cursor: 'pointer',
            transition: 'transform .28s cubic-bezier(.34,1.56,.64,1), border-color .25s, box-shadow .25s',
            animation: 'fadeUp .4s ease both',
        }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.borderColor = color + '55'; e.currentTarget.style.boxShadow = `0 16px 48px ${color}18` }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none' }}
        >
            <div style={{ height: 200, overflow: 'hidden', position: 'relative', background: BG_CAT[tip.categoria] || '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {!imgError ? (
                    <img src={tip.img} alt={tip.titulo}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', transition: 'transform .5s ease' }}
                        onError={() => setImgError(true)}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.07)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    />
                ) : (
                    <span style={{ fontSize: 80 }}>{tip.icono}</span>
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 35%, rgba(0,0,0,0.75))' }} />
                <span style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', color, fontSize: 12, fontWeight: 900, padding: '6px 14px', borderRadius: 99, border: `1px solid ${color}50` }}>
                    {ICONOS_CAT[tip.categoria]} {tip.categoria}
                </span>
                <span style={{ position: 'absolute', bottom: 14, right: 16, fontSize: 26 }}>{tip.icono}</span>
            </div>
            <div style={{ padding: '20px 22px 22px' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.4, marginBottom: 12, color: '#fff' }}>{tip.titulo}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.75, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>
                    {abierto ? tip.contenido : tip.contenido.substring(0, 115) + '...'}
                </p>
                <span style={{ fontSize: 13, fontWeight: 800, color }}>{abierto ? '▲ Ver menos' : '▼ Leer más'}</span>
            </div>
        </div>
    )
}

function EmergCard({ item, expandido, setExpandido }) {
    const abierto = expandido === item.id
    const [imgError, setImgError] = useState(false)

    return (
        <div onClick={() => setExpandido(abierto ? null : item.id)} style={{
            background: 'rgba(255,74,74,0.05)', border: '1px solid rgba(255,74,74,0.2)',
            borderRadius: 22, overflow: 'hidden', cursor: 'pointer',
            transition: 'transform .28s cubic-bezier(.34,1.56,.64,1), box-shadow .25s',
            animation: 'fadeUp .4s ease both',
        }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(255,74,74,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
        >
            <div style={{ height: 180, overflow: 'hidden', position: 'relative', background: '#2a0808', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {!imgError ? (
                    <img src={item.img} alt={item.titulo}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .5s ease' }}
                        onError={() => setImgError(true)}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.07)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    />
                ) : (
                    <span style={{ fontSize: 80 }}>{item.icono}</span>
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,74,74,0.2) 0%, rgba(0,0,0,0.75) 100%)' }} />
                <span style={{ position: 'absolute', top: 14, left: 14, background: '#ff4a4a', color: '#fff', fontSize: 11, fontWeight: 900, padding: '6px 14px', borderRadius: 99, letterSpacing: 1.5, animation: 'pulseRed 2s infinite' }}>
                    🚨 EMERGENCIA
                </span>
                <span style={{ position: 'absolute', bottom: 14, right: 16, fontSize: 28 }}>{item.icono}</span>
            </div>
            <div style={{ padding: '20px 22px 22px' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.4, marginBottom: 12, color: '#fff' }}>{item.titulo}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.75, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>
                    {abierto ? item.contenido : item.contenido.substring(0, 115) + '...'}
                </p>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#ff9e9e' }}>{abierto ? '▲ Ver menos' : '▼ Leer más'}</span>
            </div>
        </div>
    )
}
