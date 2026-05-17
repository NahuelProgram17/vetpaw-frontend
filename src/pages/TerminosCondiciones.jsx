import { Link } from 'react-router-dom'

const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif"
const G1 = '#4CAF50'
const O1 = '#FF9800'

export default function TerminosCondiciones() {
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
                    Términos y Condiciones
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>Última actualización: 17 de mayo de 2026</p>
            </div>

            {/* Contenido */}
            <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 40px 80px' }}>

                <div style={{ background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.2)', borderRadius: 14, padding: '18px 22px', marginBottom: 40 }}>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
                        Al utilizar VetPaw, aceptás estos Términos y Condiciones. Si no estás de acuerdo con alguno de ellos, por favor no uses la plataforma.
                    </p>
                </div>

                {[
                    {
                        num: '1.', titulo: 'Datos del titular',
                        contenido: `VetPaw es un emprendimiento unipersonal operado bajo nombre de fantasía por:\n\n• Titular: Nahuel Pedreyra\n• DNI: 34.320.396\n• CUIL: 23-34320396-9\n• Correo electrónico: vetpawapp@gmail.com\n• País: Argentina`
                    },
                    {
                        num: '2.', titulo: 'Descripción del servicio',
                        contenido: `VetPaw es una plataforma digital que permite a los dueños de mascotas gestionar el historial clínico de sus animales, coordinar turnos con veterinarias y acceder a información útil sobre el cuidado de sus mascotas.\n\nEl servicio es gratuito para los dueños de mascotas. Las veterinarias y clínicas pueden acceder a funcionalidades adicionales mediante planes de suscripción.`
                    },
                    {
                        num: '3.', titulo: 'Registro y cuenta de usuario',
                        contenido: `Para utilizar VetPaw debés registrarte con información verídica y actualizada. Sos responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran bajo tu cuenta.\n\nVetPaw se reserva el derecho de suspender o cancelar cuentas que:\n• Proporcionen información falsa\n• Utilicen la plataforma de manera abusiva\n• Violen estos términos`
                    },
                    {
                        num: '4.', titulo: 'Uso aceptable',
                        contenido: `Al usar VetPaw te comprometés a:\n• No publicar contenido falso, engañoso o inapropiado\n• No subir imágenes que no sean de animales en la sección de mascotas perdidas\n• No intentar acceder a cuentas ajenas\n• No usar la plataforma para actividades ilegales\n• Respetar la privacidad de otros usuarios`
                    },
                    {
                        num: '5.', titulo: 'Contenido del usuario',
                        contenido: `Al subir fotos, descripciones u otro contenido a VetPaw, otorgás una licencia no exclusiva para mostrar ese contenido en la plataforma. Sos responsable del contenido que publicás.\n\nVetPaw puede eliminar contenido que considere inapropiado, sin necesidad de notificación previa.`
                    },
                    {
                        num: '6.', titulo: 'Responsabilidad médica',
                        contenido: `VetPaw NO brinda servicios veterinarios ni asesoramiento médico para animales. La información de la plataforma es de carácter informativo y educativo.\n\nSiempre consultá con un veterinario matriculado ante cualquier problema de salud de tu mascota. VetPaw no se responsabiliza por decisiones tomadas en base a la información de la plataforma.`
                    },
                    {
                        num: '7.', titulo: 'Publicidad en VetPaw',
                        contenido: `VetPaw puede mostrar publicidad de terceros en la plataforma. Los anunciantes son responsables del contenido de sus avisos. VetPaw no garantiza ni avala los productos o servicios anunciados por terceros.`
                    },
                    {
                        num: '8.', titulo: 'Modificaciones al servicio',
                        contenido: `VetPaw puede modificar, suspender o discontinuar cualquier aspecto del servicio en cualquier momento. También podemos actualizar estos Términos y Condiciones. Te notificaremos de cambios importantes a través de la plataforma o por correo electrónico.`
                    },
                    {
                        num: '9.', titulo: 'Limitación de responsabilidad',
                        contenido: `En la máxima medida permitida por la ley argentina, VetPaw no será responsable por daños indirectos, incidentales o consecuentes derivados del uso o imposibilidad de uso de la plataforma.`
                    },
                    {
                        num: '10.', titulo: 'Ley aplicable',
                        contenido: `Estos Términos se rigen por las leyes de la República Argentina. Cualquier disputa será sometida a la jurisdicción de los tribunales ordinarios de la provincia de Buenos Aires.`
                    },
                    {
                        num: '11.', titulo: 'Contacto',
                        contenido: `Para consultas sobre estos Términos y Condiciones podés contactarnos en:\n• Email: vetpawapp@gmail.com`
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
