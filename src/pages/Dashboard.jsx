import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getPets, getAppointments, getClinics, getVaccines, markNotificationsSeen } from "../services/api";
import ownerBg from "../assets/vetpaw-owner-bg.png";

// ───────────────────────── Tokens de diseño
const BG = "#0a121d";
const CARD = "#16212f";
const CARD2 = "#1b2a3d";
const BORDER = "rgba(255,255,255,0.08)";
const TEXT = "#fff";
const MUTED = "rgba(255,255,255,0.5)";
const MUTED2 = "rgba(255,255,255,0.65)";
const MUTED3 = "rgba(255,255,255,0.4)";
const G1 = "#4CAF50";
const G2 = "#66BB6A";
const O1 = "#FF9800";
const O2 = "#FFB74D";
const B1 = "#6bcaff";
const V1 = "#a78bfa";
const PINK = "#ff8fa3";
const RED = "#ff6b6b";
const YELLOW = "#ffd93d";
const GRAD = `linear-gradient(135deg, ${G1}, ${O1})`;
const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif";
const TITLE_FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif";

// ───────────────────────── Helpers
const SPECIES_EMOJI = { dog: "🐶", perro: "🐶", cat: "🐱", gato: "🐱", bird: "🦜", pajaro: "🦜", pájaro: "🦜", rabbit: "🐰", conejo: "🐰", fish: "🐟", pez: "🐟" };
const petEmoji = (s) => SPECIES_EMOJI[(s || "").toLowerCase()] || "🐕";

const calcAge = (bd) => {
    if (!bd) return null;
    const today = new Date();
    const birth = new Date(bd);
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    if (today.getDate() < birth.getDate()) months--;
    if (months < 0) { years--; months += 12; }
    if (years < 1) return months <= 1 ? "Recién nacido" : `${months} meses`;
    return `${years} ${years === 1 ? "año" : "años"}`;
};

const daysUntil = (d) => {
    if (!d) return null;
    const ms = new Date(d) - new Date();
    return Math.ceil(ms / 86400000);
};

const relTime = (d) => {
    if (!d) return "—";
    const days = -daysUntil(d);
    if (days < 0) return "—";
    if (days === 0) return "hoy";
    if (days === 1) return "ayer";
    if (days < 7) return `hace ${days} días`;
    if (days < 30) return `hace ${Math.floor(days / 7)} sem.`;
    if (days < 365) {
        const m = Math.floor(days / 30);
        return `hace ${m} ${m === 1 ? "mes" : "meses"}`;
    }
    const y = Math.floor(days / 365);
    return `hace ${y} ${y === 1 ? "año" : "años"}`;
};

const fmtLong = (d) => d ? new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }) : "—";
const fmtShort = (d) => d ? new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) : "";
const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
const weekday = (d) => d ? capitalize(new Date(d).toLocaleDateString("es-AR", { weekday: "long" })) : "";

const FEEDING_LABEL = { balanced: "Balanceada", homemade: "Casera", mixed: "Mixta" };
const HABITAT_LABEL = { apartment: "Departamento", house: "Casa con patio", field: "Campo" };

const STATUS_LABEL = {
    pending: { label: "Pendiente", color: O2, bg: "rgba(255,152,0,0.15)" },
    confirmed: { label: "Confirmado", color: G2, bg: "rgba(76,175,80,0.15)" },
    cancelled: { label: "Cancelado", color: PINK, bg: "rgba(255,107,107,0.15)" },
    completed: { label: "Realizado", color: V1, bg: "rgba(167,139,250,0.15)" },
    no_show: { label: "Ausente", color: YELLOW, bg: "rgba(255,217,61,0.15)" },
};

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [pets, setPets] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [clinics, setClinics] = useState([]);
    const [vaccines, setVaccines] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAll = () => {
        Promise.all([getPets(), getAppointments(), getClinics(), getVaccines()])
            .then(([p, a, c, v]) => {
                setPets(p.results ?? p);
                setAppointments(a.results ?? a);
                setClinics(c.results ?? c);
                setVaccines(v.results ?? v);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };
    useEffect(() => { fetchAll(); }, []);

    // ───────────── Derived data
    const firstName = user?.first_name || user?.username || "Usuario";
    const isAdmin = user?.username === "jaime17";

    const now = new Date();

    const upcoming = appointments
        .filter(a => new Date(a.requested_date) >= now && a.status !== "cancelled")
        .sort((a, b) => new Date(a.requested_date) - new Date(b.requested_date));
    const nextAppt = upcoming[0];
    const daysUntilNext = nextAppt ? daysUntil(nextAppt.requested_date) : null;

    const mainPet = pets[0] || null;

    // Vacunas al día - calculado honesto
    const vaccineStatus = (() => {
        if (vaccines.length === 0) return { kind: "none", count: 0 };
        const expired = vaccines.filter(v => v.next_dose && new Date(v.next_dose) < now);
        if (expired.length > 0) return { kind: "expired", count: expired.length };
        return { kind: "ok", count: vaccines.length };
    })();

    // Antiparasitarios: priorizar PRÓXIMO si hay next_dose futuro; sino mostrar último
    const allTreatments = pets.flatMap(p => (p.treatments || []).map(t => ({ ...t, pet_name: p.name })));
    const lastTreatment = allTreatments
        .filter(t => t.date_applied)
        .sort((a, b) => new Date(b.date_applied) - new Date(a.date_applied))[0] || null;
    // Próximo antiparasitario: el next_dose futuro más cercano
    const nextTreatment = allTreatments
        .filter(t => t.next_dose && new Date(t.next_dose) >= now)
        .sort((a, b) => new Date(a.next_dose) - new Date(b.next_dose))[0] || null;
    const daysToNextTreatment = nextTreatment ? daysUntil(nextTreatment.next_dose) : null;

    // Actividad reciente - mix de appts + vacs + treatments
    const recentActivity = (() => {
        const events = [];
        appointments.forEach(a => {
            const isCancelled = a.status === "cancelled";
            const isConfirmed = a.status === "confirmed";
            const isCompleted = a.status === "completed";
            events.push({
                id: `a-${a.id}`,
                date: a.requested_date,
                title: isCancelled ? "Turno cancelado" : isConfirmed ? "Turno confirmado" : isCompleted ? "Turno realizado" : "Turno creado",
                meta: [a.clinic_name, a.reason || a.appointment_type_display].filter(Boolean).join(" · "),
                color: isCancelled ? PINK : isConfirmed ? G2 : isCompleted ? V1 : O2,
                icon: "📅",
            });
        });
        vaccines.forEach(v => {
            events.push({
                id: `v-${v.id}`,
                date: v.date_applied,
                title: `Vacuna registrada${v.name ? `: ${v.name}` : ""}`,
                meta: [v.vet_first_name && `${v.vet_first_name} ${v.vet_last_name || ""}`.trim(), v.clinic_name].filter(Boolean).join(" · "),
                color: G2,
                icon: "💉",
            });
        });
        allTreatments.forEach(t => {
            events.push({
                id: `t-${t.id}`,
                date: t.date_applied,
                title: `Antiparasitario${t.product ? `: ${t.product}` : t.treatment_type_display ? `: ${t.treatment_type_display}` : ""}`,
                meta: t.pet_name,
                color: O2,
                icon: "🛡️",
            });
        });
        return events
            .filter(e => e.date)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
    })();

    // Notificaciones (igual que antes)
    const notifications = appointments.filter(a => !a.seen_by_owner && a.status !== "pending");

    // Aviso libreta (igual que antes)
    const apptsPendientes = appointments.filter(a => a.status === "pending" || a.status === "confirmed");
    const apptsSinVacunas = apptsPendientes.filter(appt => !vaccines.some(v => v.pet === appt.pet));
    const mascotasSinVacunas = [...new Set(apptsSinVacunas.map(a => a.pet_name))].filter(Boolean);
    const clinicasSinVacunas = [...new Set(apptsSinVacunas.map(a => a.clinic_name))].filter(Boolean);
    const mostrarAvisoLibreta = apptsSinVacunas.length > 0;

    const handleMarkSeen = async () => {
        await markNotificationsSeen();
        fetchAll();
    };

    // ───────────── Loading
    if (loading) {
        return (
            <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: FONT, color: MUTED }}>
                <span className="paw-runner">🐕</span>
                <p>Cargando tu espacio…</p>
                <style>{`
.owner-gradient-title,
.dash-title-modern,
.pets-title,
.appts-title,
.hero-title,
.history-main-title,
.history-title-main {
    background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 38%, #FFB300 72%, #FF9800 100%) !important;
    -webkit-background-clip: text !important;
    background-clip: text !important;
    color: transparent !important;
    text-shadow: 0 0 24px rgba(76,175,80,.12);
}
.paw-runner {
    font-size: 3rem;
    display: inline-block;
    animation: pawRun 1.35s ease-in-out infinite;
    transform-origin: center bottom;
}
@keyframes pawRun {
    0% { transform: translateX(-22px) translateY(0) rotate(-7deg); opacity: .55; }
    25% { transform: translateX(-8px) translateY(-5px) rotate(4deg); opacity: 1; }
    50% { transform: translateX(10px) translateY(0) rotate(-3deg); opacity: 1; }
    75% { transform: translateX(24px) translateY(-5px) rotate(5deg); opacity: .9; }
    100% { transform: translateX(42px) translateY(0) rotate(-6deg); opacity: .55; }
}
`}</style>
            </div>
        );
    }

    // ───────────── Estilos comunes
    const cardSt = { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 22, color: TEXT, display: "flex", flexDirection: "column" };
    const cardHeader = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 10 };
    const cardTitle = { display: "flex", alignItems: "center", gap: 10, fontSize: "1.05rem", fontWeight: 900, fontFamily: FONT, margin: 0, background: `linear-gradient(135deg, ${G1}, ${O2})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", textShadow: "0 0 18px rgba(76,175,80,0.10)" };
    const linkSt = (color) => ({ background: "transparent", border: "none", color, fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", fontFamily: FONT, whiteSpace: "nowrap" });

    return (
        <div className="owner-cosmic-bg dash-page" style={{ minHeight: "100vh", background: 'transparent', fontFamily: FONT, color: TEXT, paddingBottom: 200, position: "relative" }}>
            <div className="dash-inner" style={{ maxWidth: 1400, margin: "0 auto", padding: "90px 24px 32px", display: "flex", flexDirection: "column", gap: 20 }}>

                {/* ────────── Header ────────── */}
                <header className="dash-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
                    <div>
                        <p style={{ fontSize: "0.92rem", color: MUTED, marginBottom: 4, fontWeight: 600 }}>¡Hola, {firstName}! 👋</p>
                        <h1 className="dash-title-modern owner-gradient-title" style={{ fontFamily: TITLE_FONT, fontSize: "2.4rem", fontWeight: 900, fontStyle: "normal", letterSpacing: "-1.5px", margin: 0 }}>Tu panel VetPaw</h1>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {isAdmin && (
                            <a href="/admin-panel" style={{
                                display: "inline-flex", alignItems: "center", gap: 8,
                                background: "rgba(255,107,107,0.12)", border: "1px solid rgba(255,107,107,0.35)",
                                color: RED, borderRadius: 12, padding: "11px 20px",
                                fontFamily: FONT, fontWeight: 700, fontSize: "0.92rem", textDecoration: "none", whiteSpace: "nowrap",
                            }}>🔐 Panel Admin</a>
                        )}
                        <button onClick={() => navigate("/appointments/new")} style={{
                            background: GRAD, color: "#fff", border: "none", borderRadius: 12,
                            padding: "11px 22px", fontFamily: FONT, fontWeight: 800, fontSize: "0.92rem",
                            cursor: "pointer", boxShadow: "0 6px 20px rgba(76,175,80,0.30)", whiteSpace: "nowrap",
                        }}>+ Nuevo turno</button>
                    </div>
                </header>

                {/* ────────── Stats grid (4 cards) ────────── */}
                <section className="dash-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                    {[
                        { icon: "🐕", color: G2, ringBg: "rgba(76,175,80,0.12)", num: pets.length, label: "Mascotas", link: "Ver todas →", to: "/pets" },
                        { icon: "📅", color: O2, ringBg: "rgba(255,152,0,0.12)", num: appointments.length, label: "Turnos totales", link: "Ver historial →", to: "/appointments" },
                        { icon: "⏳", color: V1, ringBg: "rgba(167,139,250,0.12)", num: daysUntilNext ?? "—", label: nextAppt ? "Próximo turno" : "Sin próximo turno", sub: nextAppt ? `${daysUntilNext === 1 ? "día" : "días"} • ${fmtShort(nextAppt.requested_date)}` : null, link: nextAppt ? "Ver mis turnos →" : "Sacar turno →", to: nextAppt ? "/appointments" : "/appointments/new" },
                        { icon: "💉", color: B1, ringBg: "rgba(107,202,255,0.12)", num: vaccines.length, label: "Vacunas registradas", link: "Ver historial →", to: "/history" },
                    ].map((s, i) => (
                        <div key={i} className="dash-stat" style={{ ...cardSt, padding: 18, gap: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                <div style={{ width: 54, height: 54, borderRadius: "50%", background: s.ringBg, border: `1.5px solid ${s.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 }}>{s.icon}</div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: "2.2rem", fontWeight: 900, color: s.color, lineHeight: 1, fontFamily: FONT }}>{s.num}</div>
                                    <div style={{ fontSize: "0.82rem", color: MUTED2, marginTop: 4, fontWeight: 600 }}>{s.label}</div>
                                    {s.sub && <div style={{ fontSize: "0.72rem", color: MUTED3, marginTop: 2 }}>{s.sub}</div>}
                                </div>
                            </div>
                            <button onClick={() => navigate(s.to)} style={{ ...linkSt(s.color), textAlign: "left", padding: 0, marginTop: "auto" }}>{s.link}</button>
                        </div>
                    ))}
                </section>

                {/* ────────── Aviso libreta sanitaria ────────── */}
                {mostrarAvisoLibreta && (
                    <div style={{ background: "rgba(255,217,61,0.08)", border: "1px solid rgba(255,217,61,0.25)", borderRadius: 16, padding: 18, display: "flex", gap: 14, alignItems: "flex-start" }}>
                        <span style={{ fontSize: "1.8rem", flexShrink: 0 }}>📋</span>
                        <div>
                            <p style={{ color: YELLOW, fontWeight: 800, margin: 0, marginBottom: 4 }}>¿Primera vez en {clinicasSinVacunas.join(", ")}?</p>
                            <p style={{ color: MUTED2, fontSize: "0.9rem", lineHeight: 1.5, margin: 0 }}>
                                Te recomendamos llevar la <strong style={{ color: TEXT }}>libreta sanitaria física</strong> de <strong style={{ color: TEXT }}>{mascotasSinVacunas.join(", ")}</strong> a tu próxima visita. El veterinario podrá digitalizar su historial de vacunas en VetPaw.
                            </p>
                        </div>
                    </div>
                )}

                {/* ────────── Notificaciones ────────── */}
                {notifications.length > 0 && (
                    <section style={cardSt}>
                        <div style={cardHeader}>
                            <h2 style={cardTitle}>
                                🔔 Novedades de tus turnos
                                <span style={{ background: GRAD, color: "#fff", borderRadius: 999, padding: "2px 10px", fontSize: "0.78rem", fontWeight: 800 }}>{notifications.length}</span>
                            </h2>
                            <button onClick={handleMarkSeen} style={linkSt(G2)}>Marcar como visto</button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {notifications.slice(0, 3).map(a => {
                                const st = STATUS_LABEL[a.status] || STATUS_LABEL.pending;
                                return (
                                    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: CARD2, borderRadius: 12 }}>
                                        <span style={{ fontSize: "1.3rem" }}>📅</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: "0.92rem", fontWeight: 700, color: TEXT, margin: 0 }}>{a.reason || a.appointment_type_display || "Consulta"}</p>
                                            <p style={{ fontSize: "0.78rem", color: MUTED, margin: 0, marginTop: 2 }}>{fmtShort(a.requested_date)} · {fmtTime(a.requested_date)}{a.clinic_name ? ` · ${a.clinic_name}` : ""}</p>
                                        </div>
                                        <span style={{ background: st.bg, color: st.color, padding: "4px 10px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 700, whiteSpace: "nowrap" }}>{st.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ────────── Grid 3 columnas: Mascota + Próximo turno + Recordatorios ────────── */}
                <section className="dash-grid-3" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 16 }}>

                    {/* ─── Mi mascota principal ─── */}
                    <div style={cardSt}>
                        <div style={cardHeader}>
                            <h2 style={cardTitle}>🐕 Mi mascota principal</h2>
                            {pets.length > 1 && <button onClick={() => navigate("/pets")} style={linkSt(G2)}>Ver todas →</button>}
                        </div>
                        {!mainPet ? (
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px 12px", textAlign: "center", gap: 12 }}>
                                <span style={{ fontSize: "3rem" }}>🐕</span>
                                <p style={{ color: MUTED, fontSize: "0.92rem", margin: 0 }}>Todavía no registraste ninguna mascota.</p>
                                <button onClick={() => navigate("/pets")} style={{ background: GRAD, color: "#fff", border: "none", borderRadius: 11, padding: "10px 18px", fontWeight: 800, cursor: "pointer", fontFamily: FONT }}>Registrá tu primera mascota</button>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
                                    {mainPet.photo ? (
                                        <img src={mainPet.photo} alt={mainPet.name} style={{ width: 110, height: 110, borderRadius: 14, objectFit: "cover", background: CARD2, border: `1px solid ${BORDER}`, flexShrink: 0 }} />
                                    ) : (
                                        <div style={{ width: 110, height: 110, borderRadius: 14, background: CARD2, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", flexShrink: 0 }}>{petEmoji(mainPet.species)}</div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                            <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: TEXT, margin: 0, lineHeight: 1.1 }}>{mainPet.name}</h3>
                                            <span style={{ background: "rgba(76,175,80,0.15)", color: G2, border: `1px solid ${G2}50`, borderRadius: 999, padding: "2px 9px", fontSize: "0.7rem", fontWeight: 700 }}>✓ Activo</span>
                                        </div>
                                        <p style={{ fontSize: "0.85rem", color: MUTED2, margin: 0, textTransform: "capitalize" }}>
                                            {mainPet.species_display || mainPet.species || "—"}
                                            {mainPet.sex && <> · {mainPet.sex === "male" ? "♂ Macho" : "♀ Hembra"}</>}
                                        </p>
                                        {mainPet.breed && <p style={{ fontSize: "0.82rem", color: MUTED3, margin: 0, textTransform: "capitalize" }}>{mainPet.breed}</p>}
                                    </div>
                                </div>

                                {/* 3 stat boxes mini */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
                                    {[
                                        { ic: "🎂", val: calcAge(mainPet.birth_date) || "—", lab: "Edad" },
                                        { ic: "⚖️", val: mainPet.weight ? `${mainPet.weight} kg` : "—", lab: "Peso" },
                                        { ic: "🎨", val: mainPet.color ? capitalize(mainPet.color) : "—", lab: "Color" },
                                    ].map((b, i) => (
                                        <div key={i} style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 11, padding: "9px 10px", display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                                            <span style={{ fontSize: "1rem", flexShrink: 0 }}>{b.ic}</span>
                                            <div style={{ minWidth: 0, overflow: "hidden" }}>
                                                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.val}</div>
                                                <div style={{ fontSize: "0.66rem", color: MUTED3 }}>{b.lab}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Chips reales (sólo las que tienen valor) */}
                                {(mainPet.feeding || mainPet.habitat || mainPet.lives_with_animals || mainPet.microchip) && (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                                        {mainPet.feeding && <span style={chip(B1)}>🥣 {FEEDING_LABEL[mainPet.feeding] || mainPet.feeding}</span>}
                                        {mainPet.habitat && <span style={chip(O2)}>🏠 {HABITAT_LABEL[mainPet.habitat] || mainPet.habitat}</span>}
                                        {mainPet.lives_with_animals && <span style={chip(V1)}>🐕 Convive</span>}
                                        {mainPet.microchip && <span style={chip(G2)} title={`Chip: ${mainPet.microchip}`}>🔖 Chip</span>}
                                    </div>
                                )}

                                {/* Botones de acción */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: "auto" }}>
                                    <button onClick={() => navigate("/pets")} style={ghostBtn()}>Ver perfil</button>
                                    <button onClick={() => navigate(`/appointments/new?pet=${mainPet.id}`)} style={gradBtn()}>🗓️ Sacar turno</button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* ─── Próximo turno ─── */}
                    <div style={cardSt}>
                        <div style={cardHeader}>
                            <h2 style={cardTitle}>🗓️ Próximo turno</h2>
                            {nextAppt && daysUntilNext !== null && (
                                <span style={{ background: "rgba(255,152,0,0.15)", color: O2, border: `1px solid ${O2}50`, borderRadius: 999, padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                                    {daysUntilNext === 0 ? "Hoy" : daysUntilNext === 1 ? "Mañana" : `Faltan ${daysUntilNext} días`}
                                </span>
                            )}
                        </div>
                        {!nextAppt ? (
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px 12px", textAlign: "center", gap: 12 }}>
                                <span style={{ fontSize: "3rem" }}>📭</span>
                                <p style={{ color: MUTED, fontSize: "0.92rem", margin: 0 }}>No tenés turnos próximos.</p>
                                <button onClick={() => navigate("/appointments/new")} style={gradBtn()}>Sacar turno</button>
                            </div>
                        ) : (
                            <>
                                {nextAppt.clinic_name && (
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, background: CARD2, borderRadius: 12, marginBottom: 12 }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(107,202,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.05rem", flexShrink: 0 }}>🏥</div>
                                        <div style={{ minWidth: 0, overflow: "hidden" }}>
                                            <p style={{ fontSize: "0.88rem", fontWeight: 700, color: TEXT, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nextAppt.clinic_name}</p>
                                            {nextAppt.pet_name && <p style={{ fontSize: "0.74rem", color: MUTED, margin: 0 }}>{nextAppt.pet_name}</p>}
                                        </div>
                                    </div>
                                )}
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                    <span style={{ fontSize: "1rem" }}>📆</span>
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ fontSize: "0.92rem", fontWeight: 700, color: TEXT, margin: 0 }}>{fmtLong(nextAppt.requested_date)}</p>
                                        <p style={{ fontSize: "0.74rem", color: MUTED3, margin: 0, textTransform: "capitalize" }}>{weekday(nextAppt.requested_date)}</p>
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                                    <span style={{ fontSize: "1rem" }}>🕐</span>
                                    <p style={{ fontSize: "1rem", fontWeight: 800, color: TEXT, margin: 0 }}>{fmtTime(nextAppt.requested_date)} hs</p>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: "auto" }}>
                                    {(() => {
                                        const st = STATUS_LABEL[nextAppt.status] || STATUS_LABEL.pending;
                                        return <span style={{ background: st.bg, color: st.color, padding: "5px 11px", borderRadius: 999, fontSize: "0.78rem", fontWeight: 700 }}>{st.label}</span>;
                                    })()}
                                    {(nextAppt.reason || nextAppt.appointment_type_display) && <span style={{ fontSize: "0.78rem", color: MUTED }}>· {nextAppt.reason || nextAppt.appointment_type_display}</span>}
                                </div>
                                <button onClick={() => navigate("/appointments")} style={{ ...ghostBtn(), marginTop: 14 }}>Ver todos mis turnos</button>
                            </>
                        )}
                    </div>

                    {/* ─── Recordatorios ─── */}
                    <div style={cardSt}>
                        <div style={cardHeader}>
                            <h2 style={cardTitle}>🔔 Recordatorios</h2>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {/* Vacunas al día */}
                            <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ width: 38, height: 38, borderRadius: "50%", background: vaccineStatus.kind === "ok" ? "rgba(76,175,80,0.15)" : vaccineStatus.kind === "expired" ? "rgba(255,152,0,0.15)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>
                                    {vaccineStatus.kind === "ok" ? "🛡️" : vaccineStatus.kind === "expired" ? "⚠️" : "💉"}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: "0.88rem", fontWeight: 700, color: TEXT, margin: 0 }}>
                                        {vaccineStatus.kind === "ok" && "Vacunas al día"}
                                        {vaccineStatus.kind === "expired" && `${vaccineStatus.count} vacuna${vaccineStatus.count > 1 ? "s" : ""} vencida${vaccineStatus.count > 1 ? "s" : ""}`}
                                        {vaccineStatus.kind === "none" && "Sin vacunas registradas"}
                                    </p>
                                    <p style={{ fontSize: "0.74rem", color: MUTED, margin: 0, marginTop: 2 }}>
                                        {vaccineStatus.kind === "ok" && `${vaccineStatus.count} vacuna${vaccineStatus.count > 1 ? "s" : ""} registrada${vaccineStatus.count > 1 ? "s" : ""}`}
                                        {vaccineStatus.kind === "expired" && "Revisalas con tu veterinario"}
                                        {vaccineStatus.kind === "none" && "Las carga tu veterinario en cada visita"}
                                    </p>
                                </div>
                                {vaccineStatus.kind === "ok" && <span style={{ width: 28, height: 28, borderRadius: "50%", background: G2, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 800, flexShrink: 0 }}>✓</span>}
                            </div>

                            {/* Antiparasitario: muestra PRÓXIMO si hay next_dose futuro, sino ÚLTIMO aplicado */}
                            <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ width: 38, height: 38, borderRadius: "50%", background: nextTreatment ? "rgba(76,175,80,0.15)" : lastTreatment ? "rgba(255,152,0,0.15)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>🛡️</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: "0.88rem", fontWeight: 700, color: TEXT, margin: 0 }}>
                                        {nextTreatment
                                            ? (daysToNextTreatment === 0 ? "Antiparasitario hoy" : daysToNextTreatment === 1 ? "Antiparasitario mañana" : `Próximo antiparasitario en ${daysToNextTreatment} días`)
                                            : lastTreatment ? "Último antiparasitario" : "Sin antiparasitarios"}
                                    </p>
                                    <p style={{ fontSize: "0.74rem", color: MUTED, margin: 0, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {nextTreatment
                                            ? `${nextTreatment.product || nextTreatment.treatment_type_display || "Aplicación"} · ${nextTreatment.pet_name}`
                                            : lastTreatment
                                                ? `${relTime(lastTreatment.date_applied)} · ${lastTreatment.product || lastTreatment.treatment_type_display || "Aplicado"}`
                                                : "Cargá el próximo desde Mascotas"}
                                    </p>
                                </div>
                                {nextTreatment && daysToNextTreatment <= 7 && <span style={{ width: 28, height: 28, borderRadius: "50%", background: O2, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 800, flexShrink: 0 }}>!</span>}
                            </div>

                            <button onClick={() => navigate("/pets")} style={{ ...linkSt(G2), textAlign: "left", padding: "4px 0", marginTop: 2 }}>Gestionar desde Mascotas →</button>
                        </div>
                    </div>
                </section>

                {/* ────────── Grid 2 columnas: Clínicas + Actividad ────────── */}
                <section className="dash-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

                    {/* ─── Clínicas disponibles ─── */}
                    <div style={cardSt}>
                        <div style={cardHeader}>
                            <h2 style={cardTitle}>🏥 Clínicas disponibles</h2>
                            <button onClick={() => navigate("/clinics")} style={linkSt(G2)}>Ver todas →</button>
                        </div>
                        {clinics.length === 0 ? (
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px 12px", textAlign: "center", gap: 10 }}>
                                <span style={{ fontSize: "2.5rem" }}>🏥</span>
                                <p style={{ color: MUTED, fontSize: "0.9rem", margin: 0 }}>No hay clínicas registradas todavía.</p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {clinics.slice(0, 3).map(c => (
                                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: CARD2, borderRadius: 12 }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(76,175,80,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.05rem", flexShrink: 0 }}>🏥</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: "0.9rem", fontWeight: 700, color: TEXT, margin: 0, textTransform: "capitalize", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</p>
                                            <p style={{ fontSize: "0.75rem", color: MUTED, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.address || c.locality || "Sin dirección"}</p>
                                        </div>
                                        {c.phone && <span style={{ fontSize: "0.74rem", color: G2, fontWeight: 700, whiteSpace: "nowrap" }}>📞 {c.phone}</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ─── Actividad reciente (timeline mezclado) ─── */}
                    <div style={cardSt}>
                        <div style={cardHeader}>
                            <h2 style={cardTitle}>📋 Actividad reciente</h2>
                        </div>
                        {recentActivity.length === 0 ? (
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px 12px", textAlign: "center", gap: 10 }}>
                                <span style={{ fontSize: "2.5rem" }}>📋</span>
                                <p style={{ color: MUTED, fontSize: "0.9rem", margin: 0 }}>Aún no hay actividad registrada.</p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {recentActivity.map(ev => (
                                    <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 4px" }}>
                                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: ev.color, flexShrink: 0, boxShadow: `0 0 8px ${ev.color}80` }} />
                                        <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{ev.icon}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: "0.88rem", fontWeight: 700, color: TEXT, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</p>
                                            {ev.meta && <p style={{ fontSize: "0.74rem", color: MUTED, margin: 0, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.meta}</p>}
                                        </div>
                                        <span style={{ fontSize: "0.72rem", color: MUTED3, whiteSpace: "nowrap" }}>{relTime(ev.date)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* ────────── CTA Cuidado que se nota ────────── */}
                <section style={{ background: `linear-gradient(135deg, ${CARD}, ${CARD2})`, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap", position: "relative", overflow: "hidden" }}>
                    <div style={{ flex: "1 1 280px", display: "flex", alignItems: "center", gap: 16, zIndex: 1 }}>
                        <div style={{ width: 60, height: 60, borderRadius: "50%", background: GRAD, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", flexShrink: 0, boxShadow: "0 6px 18px rgba(76,175,80,0.30)" }}>🐕</div>
                        <div>
                            <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: TEXT, margin: 0, marginBottom: 4 }}>Cuidado que se nota</h3>
                            <p style={{ fontSize: "0.88rem", color: MUTED2, margin: 0, lineHeight: 1.5 }}>Llevá un control al día de la salud de tu mascota y disfrutá más momentos juntos.</p>
                        </div>
                    </div>
                    <button onClick={() => navigate("/tips")} style={{ ...gradBtn(), padding: "13px 24px", fontSize: "0.95rem", zIndex: 1 }}>Ver consejos de cuidado</button>
                    {/* Decoración sutil */}
                    <span style={{ position: "absolute", right: -30, bottom: -40, fontSize: "10rem", opacity: 0.06, pointerEvents: "none" }}>🐕</span>
                </section>

            </div>

            {/* ── FAB ── */}
            <button onClick={() => navigate("/appointments/new")} title="Nuevo turno" aria-label="Nuevo turno" style={{
                position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: "50%",
                background: GRAD, color: "#fff", border: "none", fontSize: "1.8rem", fontWeight: 300,
                cursor: "pointer", boxShadow: "0 8px 24px rgba(76,175,80,0.45)", zIndex: 50,
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>+</button>

            {/* Responsive */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

/* ───────────────── VetPaw dueño visual refresh v2 ───────────────── */
.owner-cosmic-bg,
.dash-page,
.pets-page,
.appts-page,
.clinics-page,
.lostpets-page,
.history-page {
    background:
        linear-gradient(180deg, rgba(3, 10, 20, .72) 0%, rgba(5, 12, 28, .78) 42%, rgba(4, 9, 20, .86) 100%),
        url(${ownerBg}) center top / cover fixed no-repeat !important;
    position: relative;
    isolation: isolate;
}
.owner-cosmic-bg::before,
.dash-page::before,
.pets-page::before,
.appts-page::before,
.clinics-page::before,
.lostpets-page::before,
.history-page::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background:
        radial-gradient(circle at 15% 10%, rgba(54, 116, 255, .10), transparent 28%),
        radial-gradient(circle at 76% 88%, rgba(31, 95, 255, .15), transparent 32%),
        radial-gradient(circle at 92% 32%, rgba(76, 175, 80, .07), transparent 26%);
    opacity: .75;
}
.owner-cosmic-bg::after,
.dash-page::after,
.pets-page::after,
.appts-page::after,
.clinics-page::after,
.lostpets-page::after,
.history-page::after {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.025), transparent);
    opacity: .45;
}
.owner-title,
.dash-title-modern,
.pets-title,
.appts-title,
.hero-title,
.history-title {
    font-family: 'Plus Jakarta Sans', 'Nunito', sans-serif !important;
    font-style: normal !important;
    font-weight: 900 !important;
    letter-spacing: -1.3px !important;
    text-shadow: 0 10px 34px rgba(0,0,0,.25);
}
.owner-icon-badge {
    width: 52px;
    height: 52px;
    border-radius: 18px;
    display: inline-grid;
    place-items: center;
    background: linear-gradient(135deg, rgba(76,175,80,.16), rgba(255,152,0,.15));
    border: 1px solid rgba(255,255,255,.10);
    box-shadow: inset 0 0 26px rgba(255,255,255,.04), 0 12px 30px rgba(0,0,0,.25);
    color: #fff;
    vertical-align: middle;
}
.owner-icon-badge svg { width: 30px; height: 30px; display: block; }
.owner-hero-title-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }

.owner-gradient-title,
.dash-title-modern,
.pets-title,
.appts-title,
.hero-title,
.history-main-title,
.history-title-main {
    background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 38%, #FFB300 72%, #FF9800 100%) !important;
    -webkit-background-clip: text !important;
    background-clip: text !important;
    color: transparent !important;
    text-shadow: 0 0 24px rgba(76,175,80,.12);
}
.paw-runner {
    font-size: 3rem;
    display: inline-block;
    animation: pawRun 1.35s ease-in-out infinite;
    transform-origin: center bottom;
}
@keyframes pawRun {
    0% { transform: translateX(-22px) translateY(0) rotate(-7deg); opacity: .55; }
    25% { transform: translateX(-8px) translateY(-5px) rotate(4deg); opacity: 1; }
    50% { transform: translateX(10px) translateY(0) rotate(-3deg); opacity: 1; }
    75% { transform: translateX(24px) translateY(-5px) rotate(5deg); opacity: .9; }
    100% { transform: translateX(42px) translateY(0) rotate(-6deg); opacity: .55; }
}


                @media (max-width: 1024px) {
                    .dash-stats { grid-template-columns: repeat(2, 1fr) !important; }
                    .dash-grid-3 { grid-template-columns: 1fr 1fr !important; }
                    .dash-grid-3 > div:first-child { grid-column: 1 / -1; }
                }
                @media (max-width: 720px) {
                    .dash-inner { padding: 76px 14px 32px !important; }
                    .dash-stats { grid-template-columns: 1fr 1fr !important; }
                    .dash-grid-3 { grid-template-columns: 1fr !important; }
                    .dash-grid-2 { grid-template-columns: 1fr !important; }
                    .dash-grid-2 > div, .dash-grid-3 > div, .dash-grid-2 *, .dash-grid-3 * { min-width: 0; overflow-wrap: break-word; word-wrap: break-word; }
                    .dash-header h1 { font-size: 1.6rem !important; }
                }
                @media (max-width: 380px) {
                    .dash-inner { padding: 72px 10px 32px !important; }
                    .dash-stats { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    );
}

// ──────────────── helpers de estilo
function chip(color) {
    return {
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${color}40`,
        color,
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: "0.74rem",
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
    };
}
function ghostBtn() {
    return {
        background: "transparent",
        border: `1.5px solid ${G2}80`,
        color: G2,
        borderRadius: 11,
        padding: "10px 14px",
        fontWeight: 700,
        fontSize: "0.85rem",
        cursor: "pointer",
        fontFamily: FONT,
    };
}
function gradBtn() {
    return {
        background: GRAD,
        border: "none",
        color: "#fff",
        borderRadius: 11,
        padding: "10px 14px",
        fontWeight: 800,
        fontSize: "0.85rem",
        cursor: "pointer",
        boxShadow: "0 4px 14px rgba(76,175,80,0.25)",
        fontFamily: FONT,
    };
}
