import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getVisits, getPets, getAppointments } from "../services/api";
import api from "../services/api";

const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif";
const G1 = "#4CAF50";
const G2 = "#66BB6A";
const O1 = "#FF9800";
const O2 = "#FFB74D";
const CARD = "#131a24";
const CARD2 = "#0f1620";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED = "rgba(255,255,255,0.45)";

/* ---------- helpers ---------- */
const fmtShort = (d) => d ? new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function ageFrom(birth) {
    if (!birth) return null;
    const b = new Date(birth);
    const now = new Date();
    let years = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) years--;
    return { years, year: b.getFullYear() };
}
function daysUntil(d) {
    if (!d) return null;
    const diff = new Date(d).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
    return Math.round(diff / 86400000);
}

const SPECIES_EMOJI = { dog: "🐶", cat: "🐱", rabbit: "🐰", bird: "🐦", hamster: "🐹", reptile: "🦎", fish: "🐟", other: "🐾" };

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
            api.get(`/clinical-photos/list/?pet=${selectedId}`)
                .then((res) => setClinicalPhotos(res.data))
                .catch(() => setClinicalPhotos([]));
            setTab("consultas");
        }
    }, [selectedId]);

    const pet = useMemo(() => pets.find((p) => p.id === selectedId) || null, [pets, selectedId]);

    /* ----- datos derivados de la mascota seleccionada ----- */
    const vaccines = pet?.vaccines ?? [];
    const treatments = pet?.treatments ?? [];
    const petVisits = useMemo(() => visits.filter((v) => v.pet === selectedId).sort((a, b) => new Date(b.date) - new Date(a.date)), [visits, selectedId]);
    const petAppointments = useMemo(() => appointments.filter((a) => a.pet === selectedId), [appointments, selectedId]);

    const lastVisit = petVisits[0] || null;
    const lastTreatment = [...treatments].sort((a, b) => new Date(b.date_applied) - new Date(a.date_applied))[0] || null;

    const nextAppointment = useMemo(() => {
        const today = new Date().setHours(0, 0, 0, 0);
        return petAppointments
            .filter((a) => new Date(a.requested_date).getTime() >= today && ["pending", "confirmed"].includes(a.status))
            .sort((a, b) => new Date(a.requested_date) - new Date(b.requested_date))[0] || null;
    }, [petAppointments]);

    const upcomingVaccines = useMemo(() => {
        const today = new Date().setHours(0, 0, 0, 0);
        return vaccines
            .filter((v) => v.next_dose && new Date(v.next_dose).getTime() >= today)
            .sort((a, b) => new Date(a.next_dose) - new Date(b.next_dose));
    }, [vaccines]);

    // Resumen de salud honesto
    const health = useMemo(() => {
        const hasVac = vaccines.length > 0;
        const hasTreat = treatments.length > 0;
        if (hasVac && hasTreat) return { label: "Al día", color: G1, desc: "Vacunas y antiparasitarios cargados." };
        if (hasVac || hasTreat) return { label: "Casi completo", color: O1, desc: "Te falta cargar algunos datos." };
        return { label: "Sin datos aún", color: MUTED, desc: "Cargá vacunas y controles para empezar." };
    }, [vaccines, treatments]);

    // Recordatorios derivados (próxima dosis de vacunas + próximo turno)
    const reminders = useMemo(() => {
        const items = [];
        upcomingVaccines.forEach((v) => items.push({ label: `Vacuna: ${v.name}`, date: v.next_dose }));
        if (nextAppointment) items.push({ label: `Turno: ${nextAppointment.appointment_type_display || nextAppointment.reason || "Control"}`, date: nextAppointment.requested_date });
        return items.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);
    }, [upcomingVaccines, nextAppointment]);

    /* ---------- estilos reutilizables ---------- */
    const cardStyle = { background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: 18 };
    const labelStyle = { fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: MUTED };

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", background: "#0a0e14", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: FONT }}>
                <div>Cargando historial… 🐾</div>
            </div>
        );
    }

    if (!pets.length) {
        return (
            <div style={{ minHeight: "100vh", background: "#0a0e14", fontFamily: FONT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                <div style={{ textAlign: "center", maxWidth: 420 }}>
                    <div style={{ fontSize: 54, marginBottom: 16 }}>🐾</div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Todavía no tenés mascotas</h2>
                    <p style={{ color: MUTED, marginBottom: 24, lineHeight: 1.6 }}>Cargá tu primera mascota para empezar a llevar su historial médico.</p>
                    <Link to="/pets/new" style={{ display: "inline-block", background: `linear-gradient(135deg, ${G1}, ${O1})`, color: "#fff", fontWeight: 800, padding: "13px 28px", borderRadius: 12, textDecoration: "none" }}>+ Cargar mi primera mascota</Link>
                </div>
            </div>
        );
    }

    const age = ageFrom(pet?.birth_date);

    return (
        <div style={{ minHeight: "100vh", background: "#0a0e14", fontFamily: FONT, color: "#fff", padding: "28px 24px 60px" }}>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
            <style>{`
                .mh-wrap { max-width: 1200px; margin: 0 auto; }
                .mh-grid { display: grid; grid-template-columns: 1fr 320px; gap: 20px; }
                .mh-cards { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; }
                .mh-tab { padding: 8px 16px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; background: transparent; color: ${MUTED}; font-family: ${FONT}; }
                .mh-tab.active { background: rgba(76,175,80,0.15); color: ${G2}; }
                @media (max-width: 980px) {
                    .mh-grid { grid-template-columns: 1fr; }
                    .mh-cards { grid-template-columns: repeat(2, 1fr); }
                }
                @media (max-width: 560px) {
                    .mh-cards { grid-template-columns: 1fr; }
                    .mh-profile { flex-direction: column !important; text-align: center; }
                }
            `}</style>

            <div className="mh-wrap">

                {/* ====== SELECTOR DE MASCOTA (si hay más de una) ====== */}
                {pets.length > 1 && (
                    <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                        {pets.map((p) => (
                            <button key={p.id} onClick={() => setSelectedId(p.id)} style={{
                                display: "flex", alignItems: "center", gap: 10, padding: "8px 14px 8px 8px", borderRadius: 14, cursor: "pointer", fontFamily: FONT,
                                border: p.id === selectedId ? `1.5px solid ${G1}` : `1.5px solid ${BORDER}`,
                                background: p.id === selectedId ? "rgba(76,175,80,0.1)" : CARD, color: "#fff",
                            }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, overflow: "hidden", background: CARD2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                                    {p.photo ? <img src={p.photo} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (SPECIES_EMOJI[p.species] || "🐾")}
                                </div>
                                <div style={{ textAlign: "left" }}>
                                    <div style={{ fontSize: 13, fontWeight: 800 }}>{p.name}</div>
                                    <div style={{ fontSize: 11, color: MUTED }}>{p.species_display}</div>
                                </div>
                            </button>
                        ))}
                        <Link to="/pets/new" style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 16px", borderRadius: 14, border: `1.5px dashed ${BORDER}`, color: MUTED, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>+ Agregar</Link>
                    </div>
                )}

                {/* ====== PERFIL ====== */}
                <div className="mh-profile" style={{ ...cardStyle, display: "flex", gap: 22, padding: 22, marginBottom: 20, alignItems: "center" }}>
                    <div style={{ width: 130, height: 130, borderRadius: 18, overflow: "hidden", flexShrink: 0, background: CARD2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50, border: `1px solid ${BORDER}` }}>
                        {pet?.photo ? <img src={pet.photo} alt={pet.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (SPECIES_EMOJI[pet?.species] || "🐾")}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                            <h1 style={{ fontSize: 28, fontWeight: 900 }}>{pet?.name}</h1>
                            {pet?.is_neutered && <span style={{ fontSize: 11, fontWeight: 700, color: G2, background: "rgba(76,175,80,0.12)", padding: "3px 10px", borderRadius: 99 }}>Castrado/a</span>}
                        </div>
                        <p style={{ color: MUTED, marginBottom: 16, fontSize: 15 }}>{pet?.species_display}{pet?.breed ? ` · ${pet.breed}` : ""}</p>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            {[
                                { ic: pet?.sex === "female" ? "♀" : "♂", txt: pet?.sex === "female" ? "Hembra" : "Macho" },
                                { ic: "🎂", txt: age ? `${age.years} años (${age.year})` : "Edad —" },
                                { ic: "⚖️", txt: pet?.weight ? `${pet.weight} kg` : "Peso —" },
                                { ic: "🎨", txt: pet?.color || "Color —" },
                            ].map((chip, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, background: CARD2, border: `1px solid ${BORDER}`, padding: "8px 14px", borderRadius: 12, fontSize: 13, fontWeight: 600 }}>
                                    <span style={{ opacity: 0.8 }}>{chip.ic}</span>{chip.txt}
                                </div>
                            ))}
                        </div>
                        {pet?.allergies && (
                            <div style={{ marginTop: 12, fontSize: 13, color: "#fca5a5", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", padding: "8px 14px", borderRadius: 10, display: "inline-block" }}>
                                ⚠️ Alergias: {pet.allergies}
                            </div>
                        )}
                    </div>
                    <Link to="/pets" style={{ alignSelf: "flex-start", flexShrink: 0, background: CARD2, border: `1px solid ${BORDER}`, color: "#fff", fontSize: 13, fontWeight: 700, padding: "10px 16px", borderRadius: 10, textDecoration: "none" }}>✏️ Editar</Link>
                </div>

                {/* ====== TARJETAS RESUMEN ====== */}
                <div className="mh-cards" style={{ marginBottom: 20 }}>
                    {/* Resumen de salud */}
                    <div style={{ ...cardStyle, padding: 18 }}>
                        <div style={labelStyle}>❤️ Resumen de salud</div>
                        <div style={{ fontSize: 19, fontWeight: 900, color: health.color, marginTop: 12 }}>{health.label}</div>
                        <p style={{ fontSize: 11.5, color: MUTED, marginTop: 6, lineHeight: 1.5 }}>{health.desc}</p>
                    </div>
                    {/* Última consulta */}
                    <div style={{ ...cardStyle, padding: 18 }}>
                        <div style={labelStyle}>🩺 Última consulta</div>
                        {lastVisit ? (
                            <>
                                <div style={{ fontSize: 15, fontWeight: 800, marginTop: 12 }}>{lastVisit.reason || "Control"}</div>
                                <p style={{ fontSize: 11.5, color: MUTED, marginTop: 6 }}>{fmtShort(lastVisit.date)}<br />{lastVisit.vet_first_name ? `Dr/a. ${lastVisit.vet_first_name} ${lastVisit.vet_last_name}` : ""}</p>
                            </>
                        ) : <div style={{ fontSize: 14, color: MUTED, marginTop: 14 }}>Sin consultas aún</div>}
                    </div>
                    {/* Vacunas */}
                    <div style={{ ...cardStyle, padding: 18 }}>
                        <div style={labelStyle}>💉 Vacunas</div>
                        {vaccines.length ? (
                            <>
                                <div style={{ fontSize: 24, fontWeight: 900, marginTop: 10, color: G2 }}>{vaccines.length}</div>
                                <p style={{ fontSize: 11.5, color: MUTED, marginTop: 2 }}>{vaccines.length === 1 ? "vacuna registrada" : "vacunas registradas"}</p>
                            </>
                        ) : <div style={{ fontSize: 14, color: MUTED, marginTop: 14 }}>Todavía no</div>}
                    </div>
                    {/* Próximo turno */}
                    <div style={{ ...cardStyle, padding: 18 }}>
                        <div style={labelStyle}>📅 Próximo turno</div>
                        {nextAppointment ? (
                            <>
                                <div style={{ fontSize: 15, fontWeight: 800, marginTop: 12 }}>{fmtShort(nextAppointment.requested_date)}</div>
                                <p style={{ fontSize: 11.5, color: MUTED, marginTop: 6 }}>{nextAppointment.appointment_type_display || nextAppointment.reason || "Control"}</p>
                            </>
                        ) : (
                            <div style={{ marginTop: 12 }}>
                                <div style={{ fontSize: 14, color: MUTED, marginBottom: 8 }}>Sin turnos</div>
                                <Link to="/appointments/new" style={{ fontSize: 12, color: G2, fontWeight: 700, textDecoration: "none" }}>Sacar turno →</Link>
                            </div>
                        )}
                    </div>
                    {/* Antiparasitarios */}
                    <div style={{ ...cardStyle, padding: 18 }}>
                        <div style={labelStyle}>💊 Antiparasitarios</div>
                        {lastTreatment ? (
                            <>
                                <div style={{ fontSize: 15, fontWeight: 800, marginTop: 12, color: G2 }}>{lastTreatment.treatment_type_display}</div>
                                <p style={{ fontSize: 11.5, color: MUTED, marginTop: 6 }}>Último: {fmtShort(lastTreatment.date_applied)}</p>
                            </>
                        ) : (
                            <div style={{ marginTop: 12 }}>
                                <div style={{ fontSize: 14, color: MUTED, marginBottom: 8 }}>Todavía no</div>
                                <Link to="/pets" style={{ fontSize: 12, color: G2, fontWeight: 700, textDecoration: "none" }}>Registrar →</Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* ====== CUERPO: historial + sidebar ====== */}
                <div className="mh-grid">

                    {/* ----- Columna principal: Historial médico con tabs ----- */}
                    <div style={{ ...cardStyle, padding: 22 }}>
                        <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 16 }}>📋 Historial médico</h2>
                        <div style={{ display: "flex", gap: 6, marginBottom: 20, background: CARD2, padding: 5, borderRadius: 12, width: "fit-content", flexWrap: "wrap" }}>
                            <button className={`mh-tab ${tab === "consultas" ? "active" : ""}`} onClick={() => setTab("consultas")}>Consultas</button>
                            <button className={`mh-tab ${tab === "libreta" ? "active" : ""}`} onClick={() => setTab("libreta")}>Libreta sanitaria</button>
                            <button className={`mh-tab ${tab === "fotos" ? "active" : ""}`} onClick={() => setTab("fotos")}>Fotos y documentos</button>
                        </div>

                        {/* Tab Consultas */}
                        {tab === "consultas" && (
                            petVisits.length ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                    {petVisits.map((v) => (
                                        <div key={v.id} style={{ display: "flex", gap: 14, padding: 16, background: CARD2, borderRadius: 14, border: `1px solid ${BORDER}` }}>
                                            <div style={{ textAlign: "center", flexShrink: 0, minWidth: 48 }}>
                                                <div style={{ fontSize: 20, fontWeight: 900, color: G2, lineHeight: 1 }}>{new Date(v.date).getDate()}</div>
                                                <div style={{ fontSize: 10, color: MUTED, textTransform: "uppercase" }}>{new Date(v.date).toLocaleDateString("es-AR", { month: "short" })}</div>
                                                <div style={{ fontSize: 10, color: MUTED }}>{new Date(v.date).getFullYear()}</div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 3 }}>{v.reason || "Consulta"}</div>
                                                {v.diagnosis && <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>{v.diagnosis}</p>}
                                                <p style={{ fontSize: 11.5, color: MUTED }}>{v.vet_first_name ? `🩺 Dr/a. ${v.vet_first_name} ${v.vet_last_name}` : ""}{v.vet_license ? ` · Mat. ${v.vet_license}` : ""}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <EmptyState icon="🩺" text="Todavía no hay consultas cargadas. Las cargará tu veterinaria en cada visita." />
                        )}

                        {/* Tab Libreta sanitaria */}
                        {tab === "libreta" && (
                            vaccines.length ? (
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                        <thead>
                                            <tr style={{ color: MUTED, textAlign: "left", fontSize: 11, textTransform: "uppercase" }}>
                                                <th style={{ padding: "8px 10px" }}>Vacuna</th>
                                                <th style={{ padding: "8px 10px" }}>Fecha</th>
                                                <th style={{ padding: "8px 10px" }}>Próx. dosis</th>
                                                <th style={{ padding: "8px 10px" }}>Veterinario</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {vaccines.map((v) => (
                                                <tr key={v.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                                                    <td style={{ padding: "12px 10px", fontWeight: 700 }}>{v.name}</td>
                                                    <td style={{ padding: "12px 10px", color: "rgba(255,255,255,0.7)" }}>{fmtShort(v.date_applied)}</td>
                                                    <td style={{ padding: "12px 10px" }}>{v.next_dose ? <span style={{ color: G2, background: "rgba(76,175,80,0.12)", padding: "3px 9px", borderRadius: 8, fontSize: 12 }}>{fmtShort(v.next_dose)}</span> : <span style={{ color: MUTED }}>—</span>}</td>
                                                    <td style={{ padding: "12px 10px", color: "rgba(255,255,255,0.7)" }}>{v.vet_first_name ? `${v.vet_first_name} ${v.vet_last_name}` : (v.clinic_name || "—")}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <p style={{ fontSize: 12, color: MUTED, marginTop: 14 }}>🐾 {vaccines.length} {vaccines.length === 1 ? "vacuna registrada" : "vacunas registradas"} en total</p>
                                </div>
                            ) : <EmptyState icon="💉" text="La libreta está vacía. En la primera visita, tu veterinaria carga las vacunas validadas con su matrícula." />
                        )}

                        {/* Tab Fotos */}
                        {tab === "fotos" && (
                            clinicalPhotos.length ? (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12 }}>
                                    {clinicalPhotos.map((ph) => (
                                        <a key={ph.id} href={ph.image_url} target="_blank" rel="noreferrer" style={{ display: "block", borderRadius: 12, overflow: "hidden", border: `1px solid ${BORDER}` }}>
                                            <img src={ph.image_url} alt={ph.caption || "foto clínica"} style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }} />
                                            {ph.caption && <div style={{ fontSize: 11, padding: "6px 8px", color: MUTED }}>{ph.caption}</div>}
                                        </a>
                                    ))}
                                </div>
                            ) : <EmptyState icon="📷" text="No hay fotos ni documentos clínicos cargados todavía." />
                        )}
                    </div>

                    {/* ----- Sidebar derecha ----- */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                        {/* Próximas vacunas */}
                        <div style={{ ...cardStyle, padding: 20 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>💉 Próximas vacunas</h3>
                            {upcomingVaccines.length ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    {upcomingVaccines.slice(0, 4).map((v) => {
                                        const d = daysUntil(v.next_dose);
                                        return (
                                            <div key={v.id} style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "12px 14px" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                                                    <span style={{ fontSize: 13, fontWeight: 700 }}>{v.name}</span>
                                                    <span style={{ fontSize: 10.5, fontWeight: 700, color: O2, background: "rgba(255,152,0,0.12)", padding: "3px 8px", borderRadius: 8, whiteSpace: "nowrap" }}>{fmtShort(v.next_dose)}</span>
                                                </div>
                                                <p style={{ fontSize: 11, color: MUTED, marginTop: 5 }}>{d > 0 ? `Quedan ${d} días` : d === 0 ? "Es hoy" : `Vencida hace ${Math.abs(d)} días`}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : <EmptyMini text="No hay próximas dosis programadas." />}
                        </div>

                        {/* Recordatorios */}
                        <div style={{ ...cardStyle, padding: 20 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>🔔 Recordatorios</h3>
                            {reminders.length ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    {reminders.map((r, i) => (
                                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                                            <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.75)" }}>✅ {r.label}</span>
                                            <span style={{ fontSize: 11, color: MUTED, whiteSpace: "nowrap" }}>{fmtShort(r.date)}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : <EmptyMini text="No tenés recordatorios pendientes." />}
                        </div>
                    </div>
                </div>

                {/* ====== BARRA DE ACCIONES ====== */}
                <div style={{ ...cardStyle, padding: 20, marginTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 800 }}>💚 Cuidamos su bienestar todos los días</div>
                        <p style={{ fontSize: 12.5, color: MUTED, marginTop: 4 }}>Mantené al día los controles, vacunas y prevención.</p>
                    </div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <Link to="/appointments/new" style={{ background: `linear-gradient(135deg, ${G1}, ${O1})`, color: "#fff", fontWeight: 800, fontSize: 13, padding: "12px 22px", borderRadius: 12, textDecoration: "none" }}>📅 Sacar turno</Link>
                        <Link to="/pets" style={{ background: CARD2, border: `1px solid ${BORDER}`, color: "#fff", fontWeight: 800, fontSize: 13, padding: "12px 22px", borderRadius: 12, textDecoration: "none" }}>💊 Antiparasitarios</Link>
                        <Link to="/blog" style={{ background: CARD2, border: `1px solid ${BORDER}`, color: "#fff", fontWeight: 800, fontSize: 13, padding: "12px 22px", borderRadius: 12, textDecoration: "none" }}>📖 Consejos de salud</Link>
                    </div>
                </div>

            </div>
        </div>
    );
}

function EmptyState({ icon, text }) {
    return (
        <div style={{ textAlign: "center", padding: "40px 20px", color: MUTED }}>
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.6 }}>{icon}</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, maxWidth: 360, margin: "0 auto" }}>{text}</p>
        </div>
    );
}
function EmptyMini({ text }) {
    return <p style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>{text}</p>;
}
