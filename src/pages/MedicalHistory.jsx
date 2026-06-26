import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getVisits, getPets, getAppointments } from "../services/api";
import api from "../services/api";

const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif";
const G1 = "#4CAF50";
const G2 = "#66BB6A";
const O1 = "#FF9800";
const O2 = "#FFB74D";
const BLUE = "#6bcaff";
const PURPLE = "#a78bfa";
const CARD = "#16212f";
const CARD2 = "#1b2a3d";
const BORDER = "rgba(255,255,255,0.08)";
const MUTED = "rgba(255,255,255,0.45)";
const MUTED2 = "rgba(255,255,255,0.6)";

/* ---------- helpers ---------- */
const fmtShort = (d) => d ? new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtFull = (d) => d ? new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" }) : "—";

function ageFrom(birth) {
    if (!birth) return null;
    const b = new Date(birth), now = new Date();
    let years = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) years--;
    return { years, year: b.getFullYear() };
}
function daysUntil(d) {
    if (!d) return null;
    return Math.round((new Date(d).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
}
function scrollToId(id, cb) {
    if (cb) cb();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

const SPECIES_EMOJI = { dog: "🐶", cat: "🐱", rabbit: "🐰", bird: "🐦", hamster: "🐹", reptile: "🦎", fish: "🐟", other: "🐾" };
const VISIT_ICONS = ["🩺", "🌡️", "📋", "🐾", "💊", "🦷"];
const VISIT_COLORS = [G1, O1, BLUE, PURPLE, G2, O2];

export default function MedicalHistory() {
    const [pets, setPets] = useState([]);
    const [visits, setVisits] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [clinicalPhotos, setClinicalPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null);
    const [tab, setTab] = useState("consultas");

    useEffect(() => {
        Promise.all([getPets(), getVisits(), getAppointments()])
            .then(([p, v, a]) => {
                const plist = p.results ?? p;
                setPets(plist);
                setVisits(v.results ?? v);
                setAppointments(a.results ?? a);
                if (plist.length) setSelectedId(plist[0].id);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (selectedId) {
            api.get(`/clinical-photos/list/?pet=${selectedId}`).then((r) => setClinicalPhotos(r.data)).catch(() => setClinicalPhotos([]));
            setTab("consultas");
        }
    }, [selectedId]);

    const pet = useMemo(() => pets.find((p) => p.id === selectedId) || null, [pets, selectedId]);
    const vaccines = pet?.vaccines ?? [];
    const treatments = pet?.treatments ?? [];
    const petVisits = useMemo(() => visits.filter((v) => v.pet === selectedId).sort((a, b) => new Date(b.date) - new Date(a.date)), [visits, selectedId]);
    const petAppointments = useMemo(() => appointments.filter((a) => a.pet === selectedId), [appointments, selectedId]);

    const lastVisit = petVisits[0] || null;
    const lastTreatment = [...treatments].sort((a, b) => new Date(b.date_applied) - new Date(a.date_applied))[0] || null;

    const nextAppointment = useMemo(() => {
        const today = new Date().setHours(0, 0, 0, 0);
        return petAppointments.filter((a) => new Date(a.requested_date).getTime() >= today && ["pending", "confirmed"].includes(a.status))
            .sort((a, b) => new Date(a.requested_date) - new Date(b.requested_date))[0] || null;
    }, [petAppointments]);

    const upcomingVaccines = useMemo(() => {
        const today = new Date().setHours(0, 0, 0, 0);
        return vaccines.filter((v) => v.next_dose && new Date(v.next_dose).getTime() >= today).sort((a, b) => new Date(a.next_dose) - new Date(b.next_dose));
    }, [vaccines]);

    const health = useMemo(() => {
        const hasVac = vaccines.length > 0, hasTreat = treatments.length > 0;
        if (hasVac && hasTreat) return { label: "Al día", color: G1, desc: "Vacunas y antiparasitarios cargados." };
        if (hasVac || hasTreat) return { label: "Casi completo", color: O1, desc: "Te falta cargar algunos datos." };
        return { label: "Sin datos aún", color: MUTED, desc: "Cargá vacunas y controles para empezar." };
    }, [vaccines, treatments]);

    const reminders = useMemo(() => {
        const items = [];
        upcomingVaccines.forEach((v) => items.push({ label: `Vacuna: ${v.name}`, date: v.next_dose }));
        if (nextAppointment) items.push({ label: `Turno: ${nextAppointment.appointment_type_display || nextAppointment.reason || "Control"}`, date: nextAppointment.requested_date });
        return items.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);
    }, [upcomingVaccines, nextAppointment]);

    const card = { background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: 18 };

    if (loading) return <div style={{ minHeight: "100vh", background: "#0a121d", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: FONT }}>Cargando historial… 🐾</div>;

    if (!pets.length) return (
        <div style={{ minHeight: "100vh", background: "#0a121d", fontFamily: FONT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ textAlign: "center", maxWidth: 420 }}>
                <div style={{ fontSize: 54, marginBottom: 16 }}>🐾</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Todavía no tenés mascotas</h2>
                <p style={{ color: MUTED, marginBottom: 24, lineHeight: 1.6 }}>Cargá tu primera mascota para empezar a llevar su historial médico.</p>
                <Link to="/pets/new" style={{ display: "inline-block", background: `linear-gradient(135deg, ${G1}, ${O1})`, color: "#fff", fontWeight: 800, padding: "13px 28px", borderRadius: 12, textDecoration: "none" }}>+ Cargar mi primera mascota</Link>
            </div>
        </div>
    );

    const age = ageFrom(pet?.birth_date);
    const profileComplete = pet?.photo && pet?.breed && pet?.weight && pet?.birth_date;

    /* tarjeta de resumen reutilizable */
    const SummaryCard = ({ accent, icon, title, children, btn }) => (
        <div style={{ ...card, padding: 18, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${accent}22`, border: `1px solid ${accent}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{icon}</div>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: MUTED2 }}>{title}</span>
            </div>
            <div style={{ flex: 1 }}>{children}</div>
            {btn && <div style={{ marginTop: 14 }}>{btn}</div>}
        </div>
    );
    const GRAD = `linear-gradient(135deg, ${G1}, ${O1})`;
    const ghostBtn = (txt, onClick, to) => to
        ? <Link to={to} style={{ display: "block", textAlign: "center", background: GRAD, border: "none", color: "#fff", fontSize: 12.5, fontWeight: 800, padding: "10px 0", borderRadius: 10, textDecoration: "none" }}>{txt}</Link>
        : <button onClick={onClick} style={{ width: "100%", background: GRAD, border: "none", color: "#fff", fontSize: 12.5, fontWeight: 800, padding: "10px 0", borderRadius: 10, cursor: "pointer", fontFamily: FONT }}>{txt}</button>;
    const fillBtn = (txt, to) => <Link to={to} style={{ display: "block", textAlign: "center", background: `linear-gradient(135deg, ${G1}, ${O1})`, color: "#fff", fontSize: 12.5, fontWeight: 800, padding: "9px 0", borderRadius: 10, textDecoration: "none" }}>{txt}</Link>;

    return (
        <div style={{ minHeight: "100vh", background: "#0a121d", fontFamily: FONT, color: "#fff", padding: "26px 22px 56px" }}>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
            <style>{`
                .mh-wrap { max-width: 1240px; margin: 0 auto; }
                .mh-top { display: grid; grid-template-columns: 1fr 300px; gap: 18px; align-items: start; }
                .mh-cards { display: grid; grid-template-columns: repeat(5, 1fr); gap: 13px; margin-top: 18px; }
                .mh-body { display: grid; grid-template-columns: 1fr 300px; gap: 18px; margin-top: 18px; align-items: start; }
                .mh-body-left { display: grid; grid-template-columns: 0.85fr 1.15fr; gap: 18px; align-items: start; }
                .mh-tab { padding: 8px 15px; border-radius: 9px; font-size: 12.5px; font-weight: 700; cursor: pointer; border: none; background: transparent; color: ${MUTED}; font-family: ${FONT}; }
                .mh-tab.active { background: rgba(76,175,80,0.16); color: ${G2}; }
                @media (max-width: 1100px) {
                    .mh-top { grid-template-columns: 1fr; }
                    .mh-body { grid-template-columns: 1fr; }
                    .mh-cards { grid-template-columns: repeat(3, 1fr); }
                }
                @media (max-width: 820px) {
                    .mh-body-left { grid-template-columns: 1fr; }
                }
                @media (max-width: 640px) {
                    .mh-cards { grid-template-columns: repeat(2, 1fr); }
                    .mh-profile { flex-direction: column !important; text-align: center; align-items: center !important; }
                }
                @media (max-width: 420px) { .mh-cards { grid-template-columns: 1fr; } }
            `}</style>

            <div className="mh-wrap">

                {/* ===== FILA SUPERIOR: perfil + Mis mascotas ===== */}
                <div className="mh-top">
                    {/* Perfil */}
                    <div className="mh-profile" style={{ ...card, display: "flex", gap: 22, padding: 22, alignItems: "center" }}>
                        <div style={{ width: 140, height: 140, borderRadius: 18, overflow: "hidden", flexShrink: 0, background: CARD2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 54, border: `1px solid ${BORDER}` }}>
                            {pet?.photo ? <img src={pet.photo} alt={pet.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (SPECIES_EMOJI[pet?.species] || "🐾")}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 3, flexWrap: "wrap" }}>
                                <h1 style={{ fontSize: 27, fontWeight: 900 }}>{pet?.name}</h1>
                                {profileComplete && <span title="Perfil completo" style={{ width: 20, height: 20, borderRadius: "50%", background: G1, color: "#fff", fontSize: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>✓</span>}
                            </div>
                            <p style={{ color: MUTED2, marginBottom: 15, fontSize: 14.5 }}>{pet?.species_display}{pet?.breed ? ` · ${pet.breed}` : ""}</p>
                            <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                                {[
                                    { ic: pet?.sex === "female" ? "♀️" : "♂️", c: BLUE, txt: pet?.sex === "female" ? "Hembra" : "Macho" },
                                    { ic: "🎂", c: O1, txt: age ? `${age.years} años (${age.year})` : "Edad —" },
                                    { ic: "⚖️", c: G1, txt: pet?.weight ? `${pet.weight} kg` : "Peso —" },
                                    { ic: "🎨", c: PURPLE, txt: pet?.color || "Color —" },
                                ].map((chip, i) => (
                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: CARD2, border: `1px solid ${BORDER}`, padding: "9px 15px", borderRadius: 12, fontSize: 13, fontWeight: 600 }}>
                                        <span style={{ width: 22, height: 22, borderRadius: 7, background: `${chip.c}22`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>{chip.ic}</span>{chip.txt}
                                    </div>
                                ))}
                            </div>
                            {pet?.allergies && <div style={{ marginTop: 12, fontSize: 13, color: "#fca5a5", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", padding: "8px 14px", borderRadius: 10, display: "inline-block" }}>⚠️ Alergias: {pet.allergies}</div>}
                        </div>
                        <Link to="/pets" style={{ alignSelf: "flex-start", flexShrink: 0, background: CARD2, border: `1px solid ${BORDER}`, color: "#fff", fontSize: 13, fontWeight: 700, padding: "10px 16px", borderRadius: 10, textDecoration: "none" }}>✏️ Editar perfil</Link>
                    </div>

                    {/* Mis mascotas */}
                    <div style={{ ...card, padding: 18 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 800 }}>Mis mascotas</h3>
                            <Link to="/pets" style={{ fontSize: 12, color: G2, fontWeight: 700, textDecoration: "none" }}>Ver todas</Link>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {pets.map((p) => {
                                const pa = ageFrom(p.birth_date);
                                const sel = p.id === selectedId;
                                return (
                                    <button key={p.id} onClick={() => setSelectedId(p.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: 10, borderRadius: 14, cursor: "pointer", textAlign: "left", fontFamily: FONT, border: sel ? `1.5px solid ${G1}` : `1.5px solid ${BORDER}`, background: sel ? "rgba(76,175,80,0.08)" : CARD2, color: "#fff", width: "100%" }}>
                                        <div style={{ width: 46, height: 46, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "#0a121b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                                            {p.photo ? <img src={p.photo} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (SPECIES_EMOJI[p.species] || "🐾")}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 13.5, fontWeight: 800 }}>{p.name}</div>
                                            <div style={{ fontSize: 11, color: MUTED, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.species_display}{pa ? ` · ${pa.years} años` : ""}</div>
                                            {p.weight && <div style={{ fontSize: 11, color: MUTED }}>{p.weight} kg</div>}
                                        </div>
                                    </button>
                                );
                            })}
                            <Link to="/pets/new" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "12px 0", borderRadius: 12, border: `1.5px dashed ${BORDER}`, color: G2, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>+ Agregar mascota</Link>
                        </div>
                    </div>
                </div>

                {/* ===== TARJETAS RESUMEN ===== */}
                <div className="mh-cards">
                    <SummaryCard accent={G1} icon="❤️" title="Resumen de salud" btn={ghostBtn("Ver detalles", () => scrollToId("mh-historial"))}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: health.color }}>{health.label}</div>
                        <p style={{ fontSize: 11.5, color: MUTED, marginTop: 6, lineHeight: 1.45 }}>{health.desc}</p>
                    </SummaryCard>

                    <SummaryCard accent={BLUE} icon="🩺" title="Última consulta" btn={ghostBtn("Ver consulta", () => scrollToId("mh-historial", () => setTab("consultas")))}>
                        {lastVisit ? (<>
                            <div style={{ fontSize: 14.5, fontWeight: 800 }}>{lastVisit.reason || "Control"}</div>
                            <p style={{ fontSize: 11.5, color: MUTED, marginTop: 6 }}>{fmtShort(lastVisit.date)}{lastVisit.vet_first_name ? <><br />Dr/a. {lastVisit.vet_first_name} {lastVisit.vet_last_name}</> : ""}</p>
                        </>) : <div style={{ fontSize: 13.5, color: MUTED }}>Sin consultas aún</div>}
                    </SummaryCard>

                    <SummaryCard accent={G2} icon="💉" title="Vacunas" btn={ghostBtn("Ver libreta", () => scrollToId("mh-libreta"))}>
                        {vaccines.length ? (<>
                            <div style={{ fontSize: 26, fontWeight: 900, color: G2 }}>{vaccines.length}</div>
                            <p style={{ fontSize: 11.5, color: MUTED }}>{vaccines.length === 1 ? "vacuna registrada" : "vacunas registradas"}</p>
                        </>) : <div style={{ fontSize: 13.5, color: MUTED }}>Todavía no</div>}
                    </SummaryCard>

                    <SummaryCard accent={O1} icon="📅" title="Próximo turno" btn={nextAppointment ? fillBtn("Ver turno", "/appointments") : ghostBtn("Sacar turno", null, "/appointments/new")}>
                        {nextAppointment ? (<>
                            <div style={{ fontSize: 14.5, fontWeight: 800 }}>{fmtFull(nextAppointment.requested_date)}</div>
                            <p style={{ fontSize: 11.5, color: MUTED, marginTop: 6 }}>{nextAppointment.appointment_type_display || nextAppointment.reason || "Control"}</p>
                        </>) : <div style={{ fontSize: 13.5, color: MUTED }}>Sin turnos</div>}
                    </SummaryCard>

                    <SummaryCard accent={O2} icon="💊" title="Antiparasitarios" btn={lastTreatment ? fillBtn("Ver plan", "/pets") : ghostBtn("Registrar", null, "/pets")}>
                        {lastTreatment ? (<>
                            <div style={{ fontSize: 14.5, fontWeight: 800, color: G2 }}>{lastTreatment.treatment_type_display}</div>
                            <p style={{ fontSize: 11.5, color: MUTED, marginTop: 6 }}>Último: {fmtShort(lastTreatment.date_applied)}</p>
                        </>) : <div style={{ fontSize: 13.5, color: MUTED }}>Todavía no</div>}
                    </SummaryCard>
                </div>

                {/* ===== CUERPO: historial + libreta + sidebar ===== */}
                <div className="mh-body">
                    <div className="mh-body-left">

                        {/* Historial médico */}
                        <div id="mh-historial" style={{ ...card, padding: 20 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>📋 Historial médico</h2>
                            <div style={{ display: "flex", gap: 5, marginBottom: 18, background: CARD2, padding: 5, borderRadius: 11, flexWrap: "wrap" }}>
                                <button className={`mh-tab ${tab === "consultas" ? "active" : ""}`} onClick={() => setTab("consultas")}>Consultas</button>
                                <button className={`mh-tab ${tab === "fotos" ? "active" : ""}`} onClick={() => setTab("fotos")}>Fotos y documentos</button>
                            </div>

                            {tab === "consultas" && (petVisits.length ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    {petVisits.map((v, idx) => {
                                        const hasInfo = v.diagnosis || v.treatment || v.observations;
                                        return (
                                            <div key={v.id} style={{ display: "flex", gap: 13, padding: 14, background: CARD2, borderRadius: 14, border: `1px solid ${BORDER}` }}>
                                                <div style={{ textAlign: "center", flexShrink: 0, minWidth: 42 }}>
                                                    <div style={{ fontSize: 19, fontWeight: 900, color: G2, lineHeight: 1 }}>{new Date(v.date).getDate()}</div>
                                                    <div style={{ fontSize: 9.5, color: MUTED, textTransform: "uppercase" }}>{new Date(v.date).toLocaleDateString("es-AR", { month: "short" })}</div>
                                                    <div style={{ fontSize: 9.5, color: MUTED }}>{new Date(v.date).getFullYear()}</div>
                                                </div>
                                                <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: `${VISIT_COLORS[idx % 6]}22`, border: `1px solid ${VISIT_COLORS[idx % 6]}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{VISIT_ICONS[idx % 6]}</div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 2 }}>{v.reason || "Consulta"}</div>
                                                    {v.diagnosis && <p style={{ fontSize: 12, color: MUTED2, marginBottom: 3 }}>{v.diagnosis}</p>}
                                                    <p style={{ fontSize: 11, color: MUTED }}>{v.vet_first_name ? `🩺 Dr/a. ${v.vet_first_name} ${v.vet_last_name}` : ""}{v.vet_license ? ` · Mat. ${v.vet_license}` : ""}</p>
                                                </div>
                                                <span style={{ alignSelf: "flex-start", flexShrink: 0, fontSize: 10.5, fontWeight: 700, padding: "4px 10px", borderRadius: 8, color: hasInfo ? G2 : MUTED, background: hasInfo ? "rgba(76,175,80,0.12)" : "rgba(255,255,255,0.05)" }}>{hasInfo ? "Registrado" : "Control"}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : <EmptyState icon="🩺" text="Todavía no hay consultas cargadas. Las cargará tu veterinaria en cada visita." />)}

                            {tab === "fotos" && (clinicalPhotos.length ? (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 11 }}>
                                    {clinicalPhotos.map((ph) => (
                                        <a key={ph.id} href={ph.image_url} target="_blank" rel="noreferrer" style={{ display: "block", borderRadius: 12, overflow: "hidden", border: `1px solid ${BORDER}` }}>
                                            <img src={ph.image_url} alt={ph.caption || "foto"} style={{ width: "100%", height: 100, objectFit: "cover", display: "block" }} />
                                            {ph.caption && <div style={{ fontSize: 10.5, padding: "5px 7px", color: MUTED }}>{ph.caption}</div>}
                                        </a>
                                    ))}
                                </div>
                            ) : <EmptyState icon="📷" text="No hay fotos ni documentos clínicos cargados todavía." />)}
                        </div>

                        {/* Libreta sanitaria */}
                        <div id="mh-libreta" style={{ ...card, padding: 20 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>📖 Libreta sanitaria</h2>
                            {vaccines.length ? (
                                <div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                        {vaccines.map((v) => (
                                            <div key={v.id} style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "13px 15px" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                                                    <span style={{ fontSize: 14, fontWeight: 800 }}>💉 {v.name}</span>
                                                    {v.next_dose
                                                        ? <span style={{ color: G2, background: "rgba(76,175,80,0.12)", padding: "3px 10px", borderRadius: 8, fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap" }}>Próx: {fmtShort(v.next_dose)}</span>
                                                        : <span style={{ color: MUTED, fontSize: 11.5 }}>Sin próxima dosis</span>}
                                                </div>
                                                <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 11.5, color: MUTED }}>
                                                    <span>📅 Aplicada: <span style={{ color: MUTED2 }}>{fmtShort(v.date_applied)}</span></span>
                                                    <span>🩺 <span style={{ color: MUTED2 }}>{v.vet_first_name ? `${v.vet_first_name} ${v.vet_last_name}` : (v.clinic_name || "—")}</span></span>
                                                    {v.batch && <span>🏷️ Lote: <span style={{ color: MUTED2 }}>{v.batch}</span></span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p style={{ fontSize: 11.5, color: MUTED, marginTop: 14 }}>🐾 {vaccines.length} {vaccines.length === 1 ? "vacuna registrada" : "vacunas registradas"} en total</p>
                                </div>
                            ) : <EmptyState icon="💉" text="La libreta está vacía. En la primera visita, tu veterinaria carga las vacunas validadas con su matrícula." />}
                        </div>
                    </div>

                    {/* Sidebar derecha */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                        <div style={{ ...card, padding: 18 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>💉 Próximas vacunas</h3>
                            {upcomingVaccines.length ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    {upcomingVaccines.slice(0, 4).map((v) => {
                                        const d = daysUntil(v.next_dose);
                                        return (
                                            <div key={v.id} style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "11px 13px" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                                                    <span style={{ fontSize: 12.5, fontWeight: 700 }}>{v.name}</span>
                                                    <span style={{ fontSize: 10, fontWeight: 700, color: O2, background: "rgba(255,152,0,0.12)", padding: "3px 8px", borderRadius: 8, whiteSpace: "nowrap" }}>{fmtShort(v.next_dose)}</span>
                                                </div>
                                                <p style={{ fontSize: 10.5, color: MUTED, marginTop: 5 }}>{d > 0 ? `Quedan ${d} días` : d === 0 ? "Es hoy" : `Vencida hace ${Math.abs(d)} días`}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : <EmptyMini text="No hay próximas dosis programadas." />}
                        </div>

                        <div style={{ ...card, padding: 18 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>🔔 Recordatorios</h3>
                            {reminders.length ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                                    {reminders.map((r, i) => (
                                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                                            <span style={{ fontSize: 12, color: MUTED2 }}>✅ {r.label}</span>
                                            <span style={{ fontSize: 10.5, color: MUTED, whiteSpace: "nowrap" }}>{fmtShort(r.date)}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : <EmptyMini text="No tenés recordatorios pendientes." />}
                        </div>
                    </div>
                </div>

                {/* ===== BARRA DE ACCIONES ===== */}
                <div style={{ ...card, padding: 20, marginTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 800 }}>💚 Cuidamos su bienestar todos los días</div>
                        <p style={{ fontSize: 12.5, color: MUTED, marginTop: 4 }}>Mantené al día los controles, vacunas y prevención.</p>
                    </div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <Link to="/appointments/new" style={{ background: `linear-gradient(135deg, ${G1}, ${O1})`, color: "#fff", fontWeight: 800, fontSize: 13, padding: "12px 22px", borderRadius: 12, textDecoration: "none" }}>📅 Sacar turno</Link>
                        <Link to="/pets" style={{ background: `linear-gradient(135deg, ${G1}, ${O1})`, color: "#fff", fontWeight: 800, fontSize: 13, padding: "12px 22px", borderRadius: 12, textDecoration: "none" }}>💊 Antiparasitarios</Link>
                        <Link to="/blog" style={{ background: `linear-gradient(135deg, ${G1}, ${O1})`, color: "#fff", fontWeight: 800, fontSize: 13, padding: "12px 22px", borderRadius: 12, textDecoration: "none" }}>📖 Ver consejos de salud</Link>
                    </div>
                </div>

            </div>
        </div>
    );
}

function EmptyState({ icon, text }) {
    return (
        <div style={{ textAlign: "center", padding: "36px 18px", color: MUTED }}>
            <div style={{ fontSize: 34, marginBottom: 11, opacity: 0.6 }}>{icon}</div>
            <p style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 340, margin: "0 auto" }}>{text}</p>
        </div>
    );
}
function EmptyMini({ text }) {
    return <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{text}</p>;
}
