import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

// ───────── Tokens de diseño
const BG = "#0a121d";
const CARD = "#16212f";
const CARD2 = "#1b2a3d";
const BORDER = "rgba(255,255,255,0.08)";
const TEXT = "#fff";
const MUTED2 = "rgba(255,255,255,0.65)";
const MUTED3 = "rgba(255,255,255,0.4)";
const G1 = "#4CAF50";
const G2 = "#66BB6A";
const O1 = "#FF9800";
const O2 = "#FFB74D";
const RED = "#ff6b6b";
const GRAD = `linear-gradient(135deg, ${G1}, ${O1})`;
const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif";
const TITLE_FONT = "'Fraunces', serif";

export default function Configuracion() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [pwdSending, setPwdSending] = useState(false);
    const [pwdMessage, setPwdMessage] = useState("");
    const [pwdError, setPwdError] = useState("");
    const [logoutConfirm, setLogoutConfirm] = useState(false);

    const handlePasswordReset = async () => {
        if (!user?.email) {
            setPwdError("No encontramos un email asociado a tu cuenta.");
            return;
        }
        setPwdSending(true);
        setPwdMessage("");
        setPwdError("");
        try {
            await api.post("/users/password-reset/", { email: user.email });
            setPwdMessage(`Te mandamos un mail a ${user.email} con el link para cambiar tu contraseña. Puede tardar unos minutos en llegar.`);
        } catch {
            setPwdError("No pudimos enviar el mail. Intentá de nuevo en un rato.");
        } finally {
            setPwdSending(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    // ── Estilos comunes
    const cardSt = { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 22, color: TEXT };
    const sectionTitle = { display: "flex", alignItems: "center", gap: 10, fontSize: "1.05rem", fontWeight: 800, color: TEXT, margin: 0, marginBottom: 16, fontFamily: FONT };
    const fieldRow = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, marginBottom: 8, gap: 12, flexWrap: "wrap" };
    const fieldLabel = { fontSize: 13, color: MUTED2, fontWeight: 600 };
    const fieldValue = { fontSize: 14, color: TEXT, fontWeight: 600, textAlign: "right", wordBreak: "break-word" };
    const gradBtn = { background: GRAD, border: "none", color: "#fff", borderRadius: 12, padding: "12px 18px", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: FONT, boxShadow: "0 4px 14px rgba(76,175,80,0.25)" };
    const ghostBtn = { background: "transparent", border: `1.5px solid ${G2}60`, color: G2, borderRadius: 12, padding: "12px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: FONT };
    const dangerBtn = { background: "transparent", border: `1.5px solid ${RED}50`, color: RED, borderRadius: 12, padding: "12px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: FONT };

    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username || "—";

    return (
        <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: FONT, paddingBottom: 60 }}>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Fraunces:ital,opsz,wght@1,9..144,700&display=swap" rel="stylesheet" />

            <div className="cfg-shell" style={{ maxWidth: 1400, margin: "0 auto", padding: "90px 24px 32px", display: "flex", flexDirection: "column", gap: 20 }}>

                {/* ── Header ── */}
                <header>
                    <h1 style={{ fontFamily: TITLE_FONT, fontSize: "2rem", fontWeight: 700, fontStyle: "italic", color: TEXT, letterSpacing: "-0.5px", margin: 0, marginBottom: 6 }}>
                        Configuración ⚙️
                    </h1>
                    <p style={{ fontSize: "0.95rem", color: MUTED2, margin: 0 }}>
                        Gestioná los datos básicos de tu cuenta y tu sesión.
                    </p>
                </header>

                {/* ── Grid 2 columnas ── */}
                <div className="cfg-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

                    {/* ═══ COL 1 ═══ */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>

                        {/* ─── Cuenta ─── */}
                        <section style={cardSt}>
                            <h2 style={sectionTitle}>
                                <span style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(102,187,106,0.12)", border: `1px solid ${G2}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>👤</span>
                                Cuenta
                            </h2>

                            <div style={fieldRow}>
                                <span style={fieldLabel}>Nombre</span>
                                <span style={fieldValue}>{fullName}</span>
                            </div>
                            <div style={fieldRow}>
                                <span style={fieldLabel}>Email</span>
                                <span style={fieldValue}>{user?.email || "—"}</span>
                            </div>
                            <div style={fieldRow}>
                                <span style={fieldLabel}>Teléfono</span>
                                <span style={fieldValue}>{user?.phone || "—"}</span>
                            </div>
                            <div style={fieldRow}>
                                <span style={fieldLabel}>Usuario</span>
                                <span style={fieldValue}>@{user?.username || "—"}</span>
                            </div>

                            <button onClick={() => navigate("/profile")} style={{ ...gradBtn, width: "100%", marginTop: 8 }}>
                                ✏️ Editar perfil
                            </button>
                        </section>

                        {/* ─── Privacidad de Comunidad ─── */}
                        <section style={cardSt}>
                            <h2 style={sectionTitle}>
                                <span style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(76,175,80,0.12)", border: `1px solid ${G2}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🛡️</span>
                                Privacidad y seguridad
                            </h2>
                            <p style={{ fontSize: 13, color: MUTED2, lineHeight: 1.6, margin: 0, marginBottom: 14 }}>
                                Administrá perfiles privados, solicitudes, comentarios, bloqueos, silencios y contenido oculto.
                            </p>
                            <button onClick={() => navigate("/configuracion/privacidad")} style={{ ...gradBtn, width: "100%" }}>
                                🔒 Abrir privacidad de Comunidad
                            </button>
                        </section>

                        {/* ─── Seguridad ─── */}
                        <section style={cardSt}>
                            <h2 style={sectionTitle}>
                                <span style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(255,152,0,0.12)", border: `1px solid ${O2}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🔐</span>
                                Seguridad
                            </h2>

                            <p style={{ fontSize: 13, color: MUTED2, lineHeight: 1.6, margin: 0, marginBottom: 14 }}>
                                Para cambiar tu contraseña te enviamos un mail con un link seguro. Es la forma más segura de hacerlo.
                            </p>

                            {pwdMessage && (
                                <div style={{ background: "rgba(76,175,80,0.08)", border: `1px solid ${G2}40`, borderRadius: 12, padding: "12px 14px", marginBottom: 12, fontSize: 13, color: G2, lineHeight: 1.5 }}>
                                    ✅ {pwdMessage}
                                </div>
                            )}
                            {pwdError && (
                                <div style={{ background: "rgba(255,107,107,0.08)", border: `1px solid ${RED}40`, borderRadius: 12, padding: "12px 14px", marginBottom: 12, fontSize: 13, color: RED, lineHeight: 1.5 }}>
                                    ⚠️ {pwdError}
                                </div>
                            )}

                            <button onClick={handlePasswordReset} disabled={pwdSending} style={{ ...ghostBtn, width: "100%", opacity: pwdSending ? 0.6 : 1, cursor: pwdSending ? "not-allowed" : "pointer" }}>
                                {pwdSending ? "Enviando..." : "📧 Enviarme link para cambiar contraseña"}
                            </button>
                        </section>
                    </div>

                    {/* ═══ COL 2 ═══ */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>

                        {/* ─── Sesión ─── */}
                        <section style={cardSt}>
                            <h2 style={sectionTitle}>
                                <span style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(107,202,255,0.12)", border: `1px solid rgba(107,202,255,0.4)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🚪</span>
                                Sesión
                            </h2>

                            <p style={{ fontSize: 13, color: MUTED2, lineHeight: 1.6, margin: 0, marginBottom: 14 }}>
                                Cerrá la sesión en este dispositivo. Vas a tener que volver a iniciar sesión la próxima vez.
                            </p>

                            {!logoutConfirm ? (
                                <button onClick={() => setLogoutConfirm(true)} style={{ ...ghostBtn, width: "100%" }}>
                                    🚪 Cerrar sesión
                                </button>
                            ) : (
                                <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14 }}>
                                    <p style={{ fontSize: 13, color: TEXT, margin: 0, marginBottom: 12, fontWeight: 600 }}>
                                        ¿Seguro que querés cerrar sesión?
                                    </p>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button onClick={() => setLogoutConfirm(false)} style={{ flex: 1, background: "transparent", border: `1px solid ${BORDER}`, color: MUTED2, borderRadius: 10, padding: "10px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: FONT }}>
                                            Cancelar
                                        </button>
                                        <button onClick={handleLogout} style={{ flex: 1, ...dangerBtn, padding: "10px 14px" }}>
                                            Sí, cerrar sesión
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* ─── Zona de peligro ─── */}
                        <section style={{ ...cardSt, background: "rgba(255,107,107,0.04)", border: `1px solid rgba(255,107,107,0.2)` }}>
                            <h2 style={sectionTitle}>
                                <span style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(255,107,107,0.12)", border: `1px solid ${RED}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚠️</span>
                                Zona de peligro
                            </h2>

                            <p style={{ fontSize: 13, color: MUTED2, lineHeight: 1.6, margin: 0, marginBottom: 14 }}>
                                Si querés desactivar tu cuenta o eliminar tus datos, escribinos. Te respondemos personalmente y resolvemos tu pedido siguiendo las normas de privacidad.
                            </p>

                            <button onClick={() => navigate("/contacto")} style={{ ...dangerBtn, width: "100%" }}>
                                ✉️ Contactanos para desactivar
                            </button>
                        </section>
                    </div>
                </div>

                {/* ── Footer info ── */}
                <div style={{ marginTop: 8, textAlign: "center", fontSize: 12, color: MUTED3 }}>
                    Tu privacidad de Comunidad se administra desde una pantalla centralizada y protegida.
                </div>
            </div>

            {/* Responsive */}
            <style>{`
                @media (max-width: 800px) {
                    .cfg-grid { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 600px) {
                    .cfg-shell { padding: 76px 14px 32px !important; }
                }
                @media (max-width: 380px) {
                    .cfg-shell { padding: 72px 10px 32px !important; }
                }
            `}</style>
        </div>
    );
}
