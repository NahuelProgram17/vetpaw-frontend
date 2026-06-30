import { Link } from 'react-router-dom'

const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif"
const G1 = '#4CAF50'
const O1 = '#FF9800'

export default function Privacidad() {
    return (
        <div style={{ minHeight: '100vh', background: '#0f1923', fontFamily: FONT, color: '#fff' }}>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #0a1520, #162032)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '48px 40px 40px', textAlign: 'center' }}>
                <Link to="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>← Volver al inicio</Link>
                <div style={{ marginBottom: 16 }}>
                    <img src="/logo_vetpaw.png" alt="VetPaw" style={{ height: 80, width: 'auto' }} />
                </div>
                <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12, background: `linear-gradient(135deg, ${G1}, ${O1})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Política de Privacidad
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>Última actualización: 30 de junio de 2026</p>
            </div>

            {/* Contenido */}
            <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 40px 80px' }}>

                <div style={{ background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.2)', borderRadius: 14, padding: '18px 22px', marginBottom: 40 }}>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
                        VetPaw se compromete a proteger tu privacidad. Esta política describe cómo recopilamos, usamos y protegemos tu información personal, en cumplimiento de la <strong>Ley 25.326 de Protección de Datos Personales de Argentina</strong>.
                    </p>
                </div>

                {[
                    {
                        num: '1.', titulo: 'Responsable del tratamiento de datos',
                        contenido: `• Titular: Nahuel Pedreyra\n• Email: vetpawapp@gmail.com\n• País: Argentina`
                    },
                    {
                        num: '2.', titulo: 'Datos que recopilamos',
                        contenido: `Recopilamos los siguientes datos personales:\n\n• Datos de registro: nombre, apellido, correo electrónico, nombre de usuario y contraseña\n• Datos de perfil: teléfono, provincia, localidad\n• Datos de mascotas: nombre, especie, raza, fecha de nacimiento, peso, foto, historial médico\n• Datos de turnos: fecha, motivo, clínica\n• Datos de ubicación: solo con tu autorización expresa, para mostrarte veterinarias cercanas\n• Imágenes subidas por el usuario a la plataforma`
                    },
                    {
                        num: '3.', titulo: 'Finalidad del tratamiento',
                        contenido: `Usamos tus datos para:\n\n• Brindarte el servicio de gestión de historial clínico de tu mascota\n• Coordinar turnos con veterinarias\n• Enviarte recordatorios de turnos por email\n• Mejorar la experiencia de la plataforma\n• Comunicarnos con vos ante consultas o soporte\n• Cumplir con obligaciones legales`
                    },
                    {
                        num: '4.', titulo: 'Almacenamiento y seguridad',
                        contenido: `Tus datos se almacenan en servidores seguros de Railway (PostgreSQL) ubicados en la nube. Las imágenes se almacenan en Cloudinary.\n\nImplementamos medidas técnicas y organizativas para proteger tu información contra acceso no autorizado, pérdida o destrucción. Las contraseñas se almacenan con hash seguro y nunca en texto plano.`
                    },
                    {
                        num: '5.', titulo: 'Compartición de datos con terceros',
                        contenido: `No vendemos ni compartimos tus datos personales con terceros con fines comerciales.\n\nCompartimos datos únicamente con:\n• Las veterinarias que vos elegís asociar a tu perfil (solo el historial de tus mascotas)\n• Proveedores de infraestructura técnica (Railway, Cloudinary, Resend) bajo acuerdos de confidencialidad\n• Autoridades competentes cuando la ley lo requiera`
                    },
                    {
                        num: '6.', titulo: 'Tus derechos (Ley 25.326)',
                        contenido: `Como titular de tus datos, tenés derecho a:\n\n• Acceder a tus datos personales almacenados\n• Rectificar datos incorrectos o desactualizados\n• Suprimir tus datos ("derecho al olvido")\n• Oponerte al tratamiento de tus datos\n\nPara ejercer estos derechos escribinos a vetpawapp@gmail.com. Responderemos dentro de los 5 días hábiles.\n\nLa Dirección Nacional de Protección de Datos Personales es el organismo de control en Argentina.`
                    },
                    {
                        num: '7.', titulo: 'Cookies',
                        contenido: `VetPaw utiliza únicamente cookies técnicas necesarias para el funcionamiento de la plataforma (autenticación mediante JWT). No utilizamos cookies de rastreo ni publicitarias de terceros.`
                    },
                    {
                        num: '8.', titulo: 'Retención de datos',
                        contenido: `Conservamos tus datos mientras tu cuenta esté activa. Si eliminás tu cuenta, tus datos serán eliminados dentro de los 30 días siguientes, salvo obligación legal de conservación.`
                    },
                    {
                        num: '9.', titulo: 'Menores de edad',
                        contenido: `VetPaw no está dirigido a menores de 18 años. No recopilamos intencionalmente datos de menores. Si sos padre o tutor y creés que tu hijo registró datos, contactanos para eliminarlos.`
                    },
                    {
                        num: '10.', titulo: 'Cambios en esta política',
                        contenido: `Podemos actualizar esta Política de Privacidad. Te notificaremos de cambios significativos por email o mediante un aviso en la plataforma.`
                    },
                    {
                        num: '11.', titulo: 'Contacto',
                        contenido: `Para consultas sobre privacidad y protección de datos:\n• Email: vetpawapp@gmail.com`
                    },
                ].map((s, i) => (
                    <div key={i} style={{ marginBottom: 36 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ background: `linear-gradient(135deg, ${G1}, ${O1})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 22 }}>{s.num}</span>
                            {s.titulo}
                        </h2>
                        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, lineHeight: 1.8, borderLeft: `3px solid rgba(76,175,80,0.3)`, paddingLeft: 20, whiteSpace: 'pre-line' }}>
                            {s.contenido}
                        </div>
                    </div>
                ))}

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 32, textAlign: 'center' }}>
                    <Link to="/" style={{ background: `linear-gradient(135deg, ${G1}, ${O1})`, color: '#fff', fontWeight: 800, fontSize: 14, padding: '12px 28px', borderRadius: 12, textDecoration: 'none' }}>
                        Volver al inicio
                    </Link>
                </div>
            </div>
        </div>
    )
}
