// Appointments.jsx
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { getAppointments, createAppointment, updateAppointment, cancelAppointment, getPets, getClinics } from "../services/api";
import api from "../services/api";
import ownerBg from "../assets/vetpaw-owner-bg.png";
import dashboardAppointmentsIcon from "../assets/vetpaw-dashboard-icons/dashboard-appointments.png";
import appointmentUpcomingIcon from "../assets/vetpaw-appointment-icons/appointment-upcoming.png";
import appointmentPastIcon from "../assets/vetpaw-appointment-icons/appointment-past.png";
import appointmentConfirmedIcon from "../assets/vetpaw-appointment-icons/appointment-confirmed.png";
import appointmentCancelledIcon from "../assets/vetpaw-appointment-icons/appointment-cancelled.png";

const STATUS_LABEL = {
    pending:   { label: "Pendiente",  color: "#ffd93d" },
    confirmed: { label: "Confirmado", color: "#6bcaff" },
    cancelled: { label: "Cancelado",  color: "#ff6b6b" },
    completed: { label: "Realizado",  color: "#6bffb8" },
    no_show:   { label: "Ausente",    color: "#ff9500" },
};

const EMPTY_FORM = { pet: "", clinic: "", requested_date: "", reason: "", appointment_type: "control" };



function OwnerPawIcon() {
    return (
        <span className="owner-icon-badge" aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="none">
                <path d="M22 34c3-5 6-7 10-7s7 2 10 7l5 8c3 5 0 11-6 11H23c-6 0-9-6-6-11l5-8Z" fill="url(#pawBody)" stroke="rgba(255,255,255,.48)" strokeWidth="2"/>
                <circle cx="18" cy="24" r="6" fill="#FF9800"/><circle cx="30" cy="17" r="6" fill="#4CAF50"/><circle cx="44" cy="24" r="6" fill="#6bcaff"/><circle cx="50" cy="36" r="5" fill="#FFB74D"/>
                <defs><linearGradient id="pawBody" x1="16" y1="25" x2="49" y2="54"><stop stopColor="#4CAF50"/><stop offset="1" stopColor="#FF9800"/></linearGradient></defs>
            </svg>
        </span>
    );
}
function OwnerCalendarIcon() {
    return (
        <span className="owner-icon-badge owner-icon-badge--image" aria-hidden="true">
            <img src={dashboardAppointmentsIcon} alt="" className="owner-title-icon-img" />
        </span>
    );
}
function OwnerVetIcon() {
    return (
        <span className="owner-icon-badge" aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="none">
                <path d="M13 51V25l19-13 19 13v26" stroke="#6bcaff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M25 51V37h14v14" stroke="#4CAF50" strokeWidth="2.4" strokeLinecap="round"/>
                <path d="M32 23v12M26 29h12" stroke="#FF9800" strokeWidth="4" strokeLinecap="round"/>
            </svg>
        </span>
    );
}
function OwnerAlertPetIcon() {
    return (
        <span className="owner-icon-badge" aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="none">
                <path d="M32 11 55 52H9L32 11Z" fill="rgba(255,152,0,.15)" stroke="#FF9800" strokeWidth="2.5"/>
                <path d="M24 39c2.4-4 4.8-5.8 8-5.8S37.6 35 40 39l2.2 3.5c1.8 2.8-.2 6.5-3.6 6.5H25.4c-3.4 0-5.4-3.7-3.6-6.5L24 39Z" fill="#4CAF50"/>
                <circle cx="23" cy="31" r="3.5" fill="#FFB74D"/><circle cx="30" cy="26" r="3.5" fill="#6bcaff"/><circle cx="38" cy="31" r="3.5" fill="#FF9800"/>
            </svg>
        </span>
    );
}

export default function Appointments() {
    const [searchParams] = useSearchParams();
    const [appointments, setAppointments] = useState([]);
    const [pets, setPets] = useState([]);
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAppt, setEditingAppt] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [cancelConfirm, setCancelConfirm] = useState(null);
    const [cancelError, setCancelError] = useState("");
    const [filter, setFilter] = useState("all");

    const [slots, setSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [clinicHasSchedule, setClinicHasSchedule] = useState(false);

    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewAppt, setReviewAppt] = useState(null);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewHover, setReviewHover] = useState(0);
    const [reviewComment, setReviewComment] = useState("");
    const [reviewSaving, setReviewSaving] = useState(false);
    const [reviewError, setReviewError] = useState("");
    const [reviewSuccess, setReviewSuccess] = useState("");
    const [reviewedAppts, setReviewedAppts] = useState(new Set());

    const fetchAll = useCallback(async () => {
        try {
            const [a, p, c] = await Promise.all([getAppointments(), getPets(), getClinics()]);
            const appts = a.results ?? a;
            setAppointments(appts);
            setPets(p.results ?? p);
            setClinics(c.results ?? c);
            const reviews = await api.get('/reviews/');
            const reviewed = new Set((reviews.data.results ?? reviews.data).map(r => r.appointment));
            setReviewedAppts(reviewed);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    const petIdFromQuery = searchParams.get("pet");

    useEffect(() => {
        fetchAll();
        if (petIdFromQuery) {
            setForm({ ...EMPTY_FORM, pet: parseInt(petIdFromQuery, 10) });
            setShowModal(true);
        }
    }, [fetchAll, petIdFromQuery]);

    const fetchSlots = async (clinicId, date, type) => {
        if (!clinicId || !date || !type) return;
        setSlotsLoading(true);
        setSlots([]);
        setSelectedSlot(null);
        try {
            const res = await api.get(`/clinics/${clinicId}/slots/?date=${date}&type=${type}`);
            setSlots(res.data.slots || []);
            setClinicHasSchedule(true);
        } catch {
            setClinicHasSchedule(false);
            setSlots([]);
        } finally { setSlotsLoading(false); }
    };

    const openNew = () => {
        setEditingAppt(null);
        setForm(EMPTY_FORM);
        setSlots([]);
        setSelectedSlot(null);
        setSelectedDate("");
        setClinicHasSchedule(false);
        setError("");
        setShowModal(true);
    };
    const openEdit = (appt) => {
        setEditingAppt(appt);
        setForm({
            pet: appt.pet || "", clinic: appt.clinic || "",
            requested_date: appt.requested_date ? appt.requested_date.slice(0, 16) : "",
            reason: appt.reason || "",
            appointment_type: appt.appointment_type || "control",
        });
        setSlots([]); setSelectedSlot(null); setSelectedDate(""); setClinicHasSchedule(false);
        setError(""); setShowModal(true);
    };
    const closeModal = () => { setShowModal(false); setEditingAppt(null); setError(""); };

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.pet || !form.clinic || !form.reason || !form.appointment_type) {
            setError("Mascota, clínica, tipo y motivo son obligatorios."); return;
        }
        if (clinicHasSchedule && !selectedSlot) {
            setError("Seleccioná un horario disponible."); return;
        }
        if (!clinicHasSchedule && !form.requested_date) {
            setError("La fecha y hora son obligatorias."); return;
        }
        setSaving(true); setError("");
        try {
            const payload = {
                ...form,
                requested_date: clinicHasSchedule ? selectedSlot : form.requested_date,
            };
            if (editingAppt) await updateAppointment(editingAppt.id, payload);
            else await createAppointment(payload);
            await fetchAll(); closeModal();
        } catch (err) {
            const data = err.response?.data;
            setError(data ? Object.values(data).flat().join(" ") : "Error al guardar.");
        } finally { setSaving(false); }
    };

    const canCancel = (appt) => {
        const hoursUntil = (new Date(appt.requested_date) - new Date()) / (1000 * 60 * 60);
        return hoursUntil >= 4;
    };
    const handleCancelClick = (appt) => {
        if (!canCancel(appt)) { setCancelError(appt.id); return; }
        setCancelConfirm(appt.id); setCancelError("");
    };
    const handleCancel = async (id) => {
        try { await cancelAppointment(id); await fetchAll(); setCancelConfirm(null); }
        catch (e) { console.error(e); }
    };

    const openReviewModal = (appt) => {
        setReviewAppt(appt);
        setReviewRating(0); setReviewHover(0);
        setReviewComment(""); setReviewError("");
        setShowReviewModal(true);
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!reviewRating) { setReviewError("Seleccioná un puntaje."); return; }
        setReviewSaving(true); setReviewError("");
        try {
            await api.post('/reviews/', {
                appointment: reviewAppt.id,
                rating: reviewRating,
                comment: reviewComment,
            });
            setShowReviewModal(false);
            setReviewSuccess(`¡Gracias por tu reseña de ${getClinicName(reviewAppt.clinic)}!`);
            setTimeout(() => setReviewSuccess(""), 4000);
            setReviewedAppts(prev => new Set([...prev, reviewAppt.id]));
        } catch (err) {
            const data = err.response?.data;
            setReviewError(data ? Object.values(data).flat().join(" ") : "Error al guardar.");
        } finally { setReviewSaving(false); }
    };

    const getPetName    = (id) => pets.find(p => p.id === id)?.name || "—";
    const getClinicName = (id) => clinics.find(c => c.id === id)?.name || "—";

    const formatDate = (d) => {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
    };
    const formatTime = (d) => {
        if (!d) return "";
        return new Date(d).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    };

    const filtered  = filter === "all" ? appointments : appointments.filter(a => a.status === filter);
    const upcoming  = appointments.filter(a => new Date(a.requested_date) >= new Date() && a.status !== "cancelled");
    const past      = appointments.filter(a => new Date(a.requested_date) < new Date() || a.status === "cancelled");
    const cConfirmed = appointments.filter(a => a.status === "confirmed").length;
    const cCompleted = appointments.filter(a => a.status === "completed").length;
    const cCancelled = appointments.filter(a => a.status === "cancelled").length;
    const cPending   = appointments.filter(a => a.status === "pending").length;
    const nextAppt   = upcoming.slice().sort((a, b) => new Date(a.requested_date) - new Date(b.requested_date))[0] || null;
    const nextDays   = nextAppt ? Math.round((new Date(nextAppt.requested_date).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000) : null;
    const ringSegs = [
        { label: "Confirmados", val: cConfirmed, color: "#4CAF50" },
        { label: "Realizados",  val: cCompleted, color: "#6bcaff" },
        { label: "Cancelados",  val: cCancelled, color: "#ff6b6b" },
        { label: "Pendientes",  val: cPending,   color: "#9aa4b2" },
    ];
    const ringTotal = ringSegs.reduce((a, s) => a + s.val, 0) || 1;
    let _acc = 0;
    const ringCss = "conic-gradient(" + ringSegs.map(s => {
        const a = (_acc / ringTotal) * 360; _acc += s.val; const b = (_acc / ringTotal) * 360;
        return s.color + " " + a + "deg " + b + "deg";
    }).join(", ") + ")";

    return (
        <div className="appts-page">
            <div className="blob b1" /><div className="blob b2" />
            <div className="appts-inner">

                <header className="appts-header">
                    <div>
                        <div className="owner-hero-title-row"><OwnerCalendarIcon /><h1 className="appts-title owner-gradient-title">Mis turnos</h1></div>
                        <p className="appts-subtitle">Gestioná y seguí tus citas veterinarias</p>
                    </div>
                    <button className="btn-primary" onClick={openNew}>+ Nuevo turno</button>
                </header>

                {reviewSuccess && <div className="review-toast">⭐ {reviewSuccess}</div>}

                {appointments.length > 0 && (
                    <div className="appts-stats">
                        {[
                            { icon: appointmentUpcomingIcon, c: "#4CAF50", val: upcoming.length, t: "Próximos", s: "Turnos futuros" },
                            { icon: appointmentPastIcon, c: "#6bcaff", val: past.length, t: "Pasados", s: "Turnos anteriores" },
                            { icon: appointmentConfirmedIcon, c: "#4CAF50", val: cConfirmed, t: "Confirmados", s: "Turnos confirmados" },
                            { icon: appointmentCancelledIcon, c: "#ff6b6b", val: cCancelled, t: "Cancelados", s: "Turnos cancelados" },
                        ].map((x, i) => (
                            <div key={i} className="appt-scard appt-scard--icon">
                                <div className="appt-stat-icon-shell" style={{ background: `${x.c}18`, borderColor: `${x.c}55` }}>
                                    <img src={x.icon} alt="" className="appt-stat-icon-img" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{x.val}</div>
                                    <div style={{ fontSize: 13, fontWeight: 800, marginTop: 3 }}>{x.t}</div>
                                    <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)" }}>{x.s}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="appts-layout">
                  <div className="appts-main">

                {appointments.length > 0 && (
                    <div className="filters">
                        {["all", "pending", "confirmed", "completed", "cancelled", "no_show"].map(f => (
                            <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                                {f === "all" ? "Todos" : STATUS_LABEL[f]?.label}
                            </button>
                        ))}
                    </div>
                )}

                {loading && <div className="loading-state"><span className="paw-runner">🐕</span><p>Cargando turnos...</p></div>}

                {!loading && appointments.length === 0 && (
                    <div className="empty-state">
                        <span className="empty-emoji">📭</span>
                        <h2>¡Sin turnos por ahora!</h2>
                        <p>Sacá tu primer turno para empezar a gestionar la salud de tu mascota.</p>
                        <button className="btn-primary" onClick={openNew}>+ Nuevo turno</button>
                    </div>
                )}

                {!loading && filtered.length > 0 && (
                    <div className="appts-list">
                        {filtered.map(appt => {
                            const status = STATUS_LABEL[appt.status] || STATUS_LABEL.pending;
                            const isPast = new Date(appt.requested_date) < new Date();
                            const canCancelThis = canCancel(appt);
                            const alreadyReviewed = reviewedAppts.has(appt.id);
                            return (
                                <div key={appt.id} className={`appt-card ${isPast ? "past" : ""}`}>
                                    <div className="appt-date-col">
                                        <div className="appt-date-box">
                                            <span className="appt-day">{new Date(appt.requested_date).getDate()}</span>
                                            <span className="appt-month">{new Date(appt.requested_date).toLocaleString("es-AR", { month: "short" })}</span>
                                            <span className="appt-time">{formatTime(appt.requested_date)}</span>
                                        </div>
                                    </div>
                                    <div className="appt-info">
                                        <div className="appt-top">
                                            <h3 className="appt-reason">{appt.reason || "Consulta"}</h3>
                                            <span className="appt-status-badge" style={{ color: status.color, background: `${status.color}18`, borderColor: `${status.color}30` }}>
                                                {status.label}
                                            </span>
                                            {appt.appointment_type_display && (
                                                <span className="appt-type-badge">{appt.appointment_type_display}</span>
                                            )}
                                        </div>
                                        <div className="appt-meta">
                                            {appt.pet    && <span>🐕 {getPetName(appt.pet)}</span>}
                                            {appt.clinic && <span>🏥 {getClinicName(appt.clinic)}</span>}
                                            <span>📆 {formatDate(appt.requested_date)}</span>
                                        </div>
                                        {cancelError === appt.id && (
                                            <p className="cancel-warning">⚠️ No podés cancelar con menos de 4hs de anticipación.</p>
                                        )}
                                        {appt.status === "completed" && (
                                            <div className="review-row">
                                                {alreadyReviewed ? (
                                                    <span className="review-done">⭐ Ya calificaste esta visita</span>
                                                ) : (
                                                    <button className="btn-review" onClick={() => openReviewModal(appt)}>
                                                        ⭐ Calificar visita
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {appt.status === "pending" && (
                                        <div className="appt-actions">
                                            <button className="btn-icon" onClick={() => openEdit(appt)} title="Editar">✏️</button>
                                            <button
                                                className={`btn-icon ${canCancelThis ? "danger" : "locked"}`}
                                                onClick={() => handleCancelClick(appt)}
                                                title={canCancelThis ? "Cancelar" : "No se puede cancelar con menos de 4hs"}
                                            >
                                                {canCancelThis ? "✕" : "🔒"}
                                            </button>
                                        </div>
                                    )}
                                    {appt.status === "confirmed" && (
                                        <div className="appt-actions">
                                            <button
                                                className={`btn-icon ${canCancelThis ? "danger" : "locked"}`}
                                                onClick={() => handleCancelClick(appt)}
                                                title={canCancelThis ? "Cancelar" : "No se puede cancelar con menos de 4hs"}
                                            >
                                                {canCancelThis ? "✕" : "🔒"}
                                            </button>
                                        </div>
                                    )}
                                    {cancelConfirm === appt.id && (
                                        <div className="cancel-overlay">
                                            <p>¿Cancelar este turno?</p>
                                            <p className="cancel-policy">Recordá que las cancelaciones con menos de 4hs no están permitidas.</p>
                                            <div className="cancel-btns">
                                                <button className="btn-ghost-sm" onClick={() => setCancelConfirm(null)}>No</button>
                                                <button className="btn-danger-sm" onClick={() => handleCancel(appt.id)}>Sí, cancelar</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {!loading && filtered.length === 0 && appointments.length > 0 && (
                    <div className="empty-state"><span className="empty-emoji">🔍</span><p>No hay turnos con ese filtro.</p></div>
                )}
                  </div>{/* /appts-main */}

                  <aside className="appts-side">
                    {/* Próximo recordatorio */}
                    <div className="appt-scard" style={{ border: "1.5px solid rgba(76,175,80,0.3)", background: "linear-gradient(135deg, rgba(76,175,80,0.09), rgba(255,152,0,0.05))" }}>
                        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>🔔 Próximo recordatorio</div>
                        {nextAppt ? (
                            <div>
                                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>Tu próximo turno es en</p>
                                <div style={{ fontSize: 22, fontWeight: 900, color: "#4CAF50", margin: "2px 0 12px" }}>{nextDays === 0 ? "hoy" : nextDays === 1 ? "1 día" : `${nextDays} días`}</div>
                                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>{nextAppt.reason || "Control"}</div>
                                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 3 }}>📅 {new Date(nextAppt.requested_date).toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })} • {formatTime(nextAppt.requested_date)}</p>
                                {nextAppt.clinic_name && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 14 }}>🏥 {nextAppt.clinic_name}</p>}
                                <button onClick={() => openEdit(nextAppt)} style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontWeight: 700, fontSize: 13, padding: "10px 0", borderRadius: 10, cursor: "pointer" }}>Ver detalle del turno</button>
                            </div>
                        ) : <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.45)" }}>No tenés turnos próximos.</p>}
                    </div>

                    {/* Estado de tus turnos */}
                    <div className="appt-scard">
                        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>📊 Estado de tus turnos</div>
                        {appointments.length ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                <div style={{ width: 92, height: 92, borderRadius: "50%", background: ringCss, position: "relative", flexShrink: 0 }}>
                                    <div style={{ position: "absolute", inset: 13, borderRadius: "50%", background: "#16212f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📅</div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    {ringSegs.map((sg, i) => (
                                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, marginBottom: 6 }}>
                                            <span style={{ width: 9, height: 9, borderRadius: "50%", background: sg.color, flexShrink: 0 }} />
                                            <span style={{ flex: 1, color: "rgba(255,255,255,0.7)" }}>{sg.label}</span>
                                            <span style={{ fontWeight: 800 }}>{sg.val}</span>
                                            <span style={{ color: "rgba(255,255,255,0.4)", width: 32, textAlign: "right" }}>{Math.round((sg.val / ringTotal) * 100)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.45)" }}>Todavía no hay turnos.</p>}
                    </div>

                    {/* Consejos */}
                    <div className="appt-scard">
                        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>💡 Consejos antes de la consulta</div>
                        {["No alimentes a tu mascota 6 horas antes de estudios que lo requieran.", "Llevá su libreta sanitaria y estudios previos (si los tiene).", "Llegá 10 minutos antes para completar la recepción."].map((t, i) => (
                            <div key={i} style={{ display: "flex", gap: 9, fontSize: 12, color: "rgba(255,255,255,0.65)", marginBottom: 11, lineHeight: 1.5 }}>
                                <span style={{ color: "#4CAF50", flexShrink: 0 }}>✓</span><span>{t}</span>
                            </div>
                        ))}
                    </div>
                  </aside>
                </div>{/* /appts-layout */}
            </div>

            {/* ── Modal turno ── */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingAppt ? "Editar turno" : "Nuevo turno"}</h2>
                            <button className="modal-close" onClick={closeModal}>✕</button>
                        </div>
                        {error && <div className="form-error">⚠️ {error}</div>}
                        <form onSubmit={handleSubmit} className="appt-form">
                            <div className="form-group">
                                <label>Mascota *</label>
                                <select name="pet" value={form.pet} onChange={e => setForm({ ...form, pet: parseInt(e.target.value) || "" })}>
                                    <option value="">Seleccioná una mascota</option>
                                    {pets.map(p => <option key={p.id} value={p.id}>{p.name} ({p.species_display || p.species})</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Clínica *</label>
                                <select name="clinic" value={form.clinic} onChange={e => {
                                    const id = parseInt(e.target.value) || "";
                                    setForm({ ...form, clinic: id });
                                    setSlots([]); setSelectedSlot(null); setClinicHasSchedule(false);
                                    if (id && selectedDate && form.appointment_type) fetchSlots(id, selectedDate, form.appointment_type);
                                }}>
                                    <option value="">Seleccioná una clínica</option>
                                    {clinics.map(c => <option key={c.id} value={c.id}>{c.name} {c.has_schedule ? "🗓" : ""}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Tipo de consulta *</label>
                                <select name="appointment_type" value={form.appointment_type} onChange={e => {
                                    const type = e.target.value;
                                    setForm({ ...form, appointment_type: type });
                                    setSlots([]); setSelectedSlot(null);
                                    if (form.clinic && selectedDate) fetchSlots(form.clinic, selectedDate, type);
                                }}>
                                    <option value="control">🩺 Control general</option>
                                    <option value="vaccine">💉 Vacunación</option>
                                    <option value="surgery">🔪 Cirugía</option>
                                    <option value="other">📋 Otro</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Motivo *</label>
                                <input name="reason" type="text" placeholder="Ej: Control anual, castración..." value={form.reason} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Fecha *</label>
                                <input type="date"
                                    min={new Date().toISOString().slice(0, 10)}
                                    value={selectedDate}
                                    onChange={e => {
                                        setSelectedDate(e.target.value);
                                        setSelectedSlot(null);
                                        setSlots([]);
                                        if (form.clinic && form.appointment_type) fetchSlots(form.clinic, e.target.value, form.appointment_type);
                                    }}
                                />
                            </div>

                            {/* Slots disponibles si la clínica tiene agenda */}
                            {selectedDate && clinicHasSchedule && (
                                <div className="form-group">
                                    <label>Horario disponible *</label>
                                    {slotsLoading ? (
                                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>⏳ Buscando horarios...</p>
                                    ) : slots.length === 0 ? (
                                        <p style={{ color: '#ff9500', fontSize: '0.85rem' }}>⚠️ No hay horarios disponibles para ese día.</p>
                                    ) : (
                                        <div className="slots-grid">
                                            {slots.map(slot => (
                                                <button key={slot.datetime} type="button"
                                                    className={`slot-btn ${selectedSlot === slot.datetime ? 'selected' : ''}`}
                                                    onClick={() => setSelectedSlot(slot.datetime)}>
                                                    {slot.time}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Hora manual si no tiene agenda */}
                            {selectedDate && !clinicHasSchedule && (
                                <div className="form-group">
                                    <label>Hora *</label>
                                    <input type="time"
                                        value={form.requested_date?.slice(11, 16) || ""}
                                        onChange={e => setForm({ ...form, requested_date: `${selectedDate}T${e.target.value}` })}
                                    />
                                </div>
                            )}

                            {!editingAppt && form.clinic && form.pet && (
                                <div className="consent-box">
                                    <span className="consent-icon">🔒</span>
                                    <p>Al confirmar este turno, el historial clínico de <strong>{pets.find(p => p.id === form.pet)?.name || "tu mascota"}</strong> será compartido con <strong>{clinics.find(c => c.id === form.clinic)?.name || "la clínica"}</strong> durante 9 meses.</p>
                                </div>
                            )}
                            <div className="form-actions">
                                <button type="button" className="btn-ghost" onClick={closeModal}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? "Guardando..." : editingAppt ? "Guardar cambios" : "Crear turno 📅"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Modal reseña ── */}
            {showReviewModal && reviewAppt && (
                <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>⭐ Calificar visita</h2>
                            <button className="modal-close" onClick={() => setShowReviewModal(false)}>✕</button>
                        </div>
                        <div className="review-clinic-info">
                            <p className="review-clinic-name">🏥 {getClinicName(reviewAppt.clinic)}</p>
                            <p className="review-appt-detail">🐕 {getPetName(reviewAppt.pet)} · {formatDate(reviewAppt.requested_date)}</p>
                        </div>
                        {reviewError && <div className="form-error">⚠️ {reviewError}</div>}
                        <form onSubmit={handleReviewSubmit} className="review-form">
                            <div className="stars-section">
                                <p className="stars-label">¿Cómo fue tu experiencia?</p>
                                <div className="stars-row">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button key={star} type="button"
                                            className={`star-btn ${star <= (reviewHover || reviewRating) ? "active" : ""}`}
                                            onMouseEnter={() => setReviewHover(star)}
                                            onMouseLeave={() => setReviewHover(0)}
                                            onClick={() => setReviewRating(star)}>
                                            ★
                                        </button>
                                    ))}
                                </div>
                                {(reviewHover || reviewRating) > 0 && (
                                    <p className="stars-text">
                                        {["", "Muy mala 😞", "Mala 😕", "Regular 😐", "Buena 😊", "Excelente 🤩"][reviewHover || reviewRating]}
                                    </p>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Comentario (opcional)</label>
                                <textarea rows={3} placeholder="Contanos tu experiencia..."
                                    value={reviewComment} onChange={e => setReviewComment(e.target.value)} />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-ghost" onClick={() => setShowReviewModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={reviewSaving || !reviewRating}>
                                    {reviewSaving ? "Guardando..." : "Publicar reseña ⭐"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700;900&family=Fraunces:ital,opsz,wght@1,9..144,700&display=swap');

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
.owner-icon-badge--image { overflow: hidden; }
.owner-title-icon-img { width: 38px; height: 38px; object-fit: contain; display: block; filter: drop-shadow(0 8px 16px rgba(0,0,0,.28)); }
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
    -webkit-text-fill-color: transparent !important;
    filter:
        drop-shadow(1px 0 0 rgba(0,0,0,.82))
        drop-shadow(-1px 0 0 rgba(0,0,0,.82))
        drop-shadow(0 1px 0 rgba(0,0,0,.82))
        drop-shadow(0 -1px 0 rgba(0,0,0,.82))
        drop-shadow(0 3px 5px rgba(0,0,0,.36));
    text-shadow: none !important;
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


                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                .appts-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 13px; margin-bottom: 20px; }
                .appts-layout { display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: start; }
                .appts-side { display: flex; flex-direction: column; gap: 16px; }
                .appt-scard { background: #16212f; border: 1.5px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 18px; color: #fff; }
                .appt-scard--icon { display:flex; align-items:center; gap:14px; }
                .appt-stat-icon-shell { width:56px; height:56px; border-radius:16px; border:1px solid; display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:hidden; box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 10px 24px rgba(0,0,0,.18); }
                .appt-stat-icon-img { width:52px; height:52px; object-fit:contain; display:block; filter: drop-shadow(0 5px 9px rgba(0,0,0,.38)); }
                @media (max-width: 1000px) { .appts-layout { grid-template-columns: 1fr; } .appts-stats { grid-template-columns: repeat(2, 1fr); } }
                @media (max-width: 520px) { .appts-stats { grid-template-columns: 1fr; } }

                .appts-page { min-height: 100vh; background: transparent; font-family: 'Nunito', sans-serif; position: relative; overflow-x: hidden; padding-bottom: 60px; width: 100%; max-width: 100vw; box-sizing: border-box; }
                .appts-page * { box-sizing: border-box; }
                .blob { position: fixed; border-radius: 50%; filter: blur(90px); opacity: 0.04; pointer-events: none; z-index:0; }
                .b1 { width: 500px; height: 500px; background: #ffd93d; top: -100px; left: -100px; }
                .b2 { width: 400px; height: 400px; background: #ff6b6b; bottom: -100px; right: -100px; }
                .appts-inner { max-width: 1400px; margin: 0 auto; padding: 32px 24px; position: relative; z-index: 1; width: 100%; box-sizing: border-box; }

                .appts-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
                .appts-title { font-family: 'Baloo 2', 'Nunito', sans-serif; font-size: 2.7rem; font-weight: 900; font-style: normal; color: #fff; letter-spacing: -1.5px; margin:0; line-height:1; }
                .appts-subtitle { color: rgba(255,255,255,0.45); font-size: 0.9rem; margin-top: 4px; }
                .btn-primary { background: linear-gradient(135deg, #4CAF50, #FF9800); color: #fff; border: none; border-radius: 12px; padding: 12px 22px; font-family: 'Nunito', sans-serif; font-size: 0.95rem; font-weight: 900; cursor: pointer; box-shadow: 0 4px 14px rgba(76,175,80,0.3); transition: transform 0.15s, box-shadow 0.15s; white-space: nowrap; }
                .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(76,175,80,0.5); }
                .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

                .review-toast { background: rgba(255,217,61,0.12); border: 1px solid rgba(255,217,61,0.3); color: #ffd93d; padding: 12px 16px; border-radius: 12px; font-size: 0.9rem; font-weight: 700; margin-bottom: 16px; }

                .filters { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
                .filter-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.10); color: rgba(255,255,255,0.5); border-radius: 10px; padding: 7px 14px; font-family: 'Nunito', sans-serif; font-size: 0.84rem; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
                .filter-btn:hover { border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.8); }
                .filter-btn.active { background: rgba(76,175,80,0.15); border-color: rgba(76,175,80,0.4); color: #4CAF50; }

                .loading-state, .empty-state { text-align: center; padding: 80px 20px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
                .paw-spin { font-size: 3rem; display: block; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .loading-state p, .empty-state p { color: rgba(255,255,255,0.4); }
                .empty-emoji { font-size: 5rem; }
                .empty-state h2 { font-family: 'Fraunces', serif; font-size: 1.6rem; font-style: italic; color: #fff; }

                .appts-list { display: flex; flex-direction: column; gap: 14px; }
                .appt-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 20px; display: flex; align-items: center; gap: 20px; backdrop-filter: blur(10px); transition: border-color 0.2s, transform 0.2s; position: relative; overflow: hidden; }
                .appt-card:hover { border-color: rgba(255,107,107,0.2); transform: translateY(-2px); }
                .appt-card.past { opacity: 0.65; }

                .appt-date-col { flex-shrink: 0; }
                .appt-date-box { display: flex; flex-direction: column; align-items: center; background: rgba(76,175,80,0.12); border-radius: 12px; padding: 10px 14px; min-width: 52px; }
                .appt-day { font-size: 1.5rem; font-weight: 900; color: #4CAF50; line-height: 1; }
                .appt-month { font-size: 0.65rem; color: rgba(76,175,80,0.7); text-transform: uppercase; font-weight: 700; }
                .appt-time { font-size: 0.7rem; color: rgba(255,255,255,0.4); margin-top: 4px; font-weight: 600; }

                .appt-info { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
                .appt-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
                .appt-reason { font-size: 1rem; font-weight: 900; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
                .appt-status-badge { font-size: 0.72rem; font-weight: 700; border-radius: 6px; padding: 3px 10px; border: 1px solid; white-space: nowrap; flex-shrink: 0; }
                .appt-type-badge { font-size: 0.7rem; font-weight: 700; border-radius: 6px; padding: 3px 8px; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.10); white-space: nowrap; flex-shrink: 0; }
                .appt-meta { display: flex; gap: 10px; flex-wrap: wrap; }
                .appt-meta span { font-size: 0.8rem; color: rgba(255,255,255,0.45); }
                .cancel-warning { font-size: 0.78rem; color: #ff9500; background: rgba(255,149,0,0.1); border: 1px solid rgba(255,149,0,0.25); border-radius: 8px; padding: 6px 10px; }

                .review-row { margin-top: 4px; }
                .btn-review { background: rgba(255,217,61,0.10); border: 1px solid rgba(255,217,61,0.25); color: #ffd93d; border-radius: 8px; padding: 6px 14px; font-family: 'Nunito', sans-serif; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: background 0.2s; }
                .btn-review:hover { background: rgba(255,217,61,0.18); }
                .review-done { font-size: 0.78rem; color: rgba(255,217,61,0.6); font-weight: 700; }

                .appt-actions { display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
                .btn-icon { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.10); border-radius: 8px; padding: 7px 9px; cursor: pointer; font-size: 0.9rem; transition: background 0.2s; min-width: 36px; min-height: 36px; display: flex; align-items: center; justify-content: center; }
                .btn-icon:hover { background: rgba(255,255,255,0.12); }
                .btn-icon.danger:hover { background: rgba(255,107,107,0.15); }
                .btn-icon.locked { opacity: 0.5; cursor: not-allowed; }

                .cancel-overlay { position: absolute; inset: 0; border-radius: 18px; background: rgba(26,26,46,0.95); backdrop-filter: blur(8px); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 20px; z-index: 2; }
                .cancel-overlay p { color: #fff; font-size: 0.95rem; font-weight: 700; text-align: center; }
                .cancel-policy { font-size: 0.78rem !important; color: rgba(255,255,255,0.4) !important; font-weight: 400 !important; }
                .cancel-btns { display: flex; gap: 10px; }
                .btn-ghost-sm { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.6); border-radius: 8px; padding: 7px 16px; font-family: 'Nunito', sans-serif; font-weight: 700; cursor: pointer; font-size: 0.88rem; }
                .btn-danger-sm { background: linear-gradient(135deg, #ff6b6b, #ff4a4a); border: none; color: #fff; border-radius: 8px; padding: 7px 16px; font-family: 'Nunito', sans-serif; font-weight: 700; cursor: pointer; font-size: 0.88rem; }

                /* Slots */
                .slots-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
                .slot-btn { background: rgba(107,202,255,0.08); border: 1.5px solid rgba(107,202,255,0.2); color: #6bcaff; border-radius: 8px; padding: 8px 14px; font-family: 'Nunito', sans-serif; font-size: 0.88rem; font-weight: 700; cursor: pointer; transition: all 0.15s; }
                .slot-btn:hover { background: rgba(107,202,255,0.15); border-color: rgba(107,202,255,0.4); }
                .slot-btn.selected { background: rgba(107,202,255,0.25); border-color: #6bcaff; color: #fff; box-shadow: 0 0 0 2px rgba(107,202,255,0.3); }

                /* Modal */
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; }
                .modal { background: #1e1e35; border: 1px solid rgba(255,255,255,0.10); border-radius: 24px; padding: 28px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; animation: modalIn 0.3s cubic-bezier(.22,.68,0,1.2) both; }
                @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 10px; }
                .modal-header h2 { font-family: 'Fraunces', serif; font-size: 1.4rem; font-style: italic; color: #fff; flex: 1; min-width: 0; }
                .modal-close { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); border-radius: 8px; padding: 6px 10px; cursor: pointer; transition: background 0.2s; flex-shrink: 0; min-width: 36px; min-height: 36px; display: flex; align-items: center; justify-content: center; }
                .modal-close:hover { background: rgba(255,107,107,0.15); color: #ff6b6b; }
                .form-error { background: rgba(255,107,107,0.15); border: 1px solid rgba(255,107,107,0.4); color: #ff9999; padding: 10px 14px; border-radius: 10px; font-size: 0.86rem; margin-bottom: 16px; }

                .review-clinic-info { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; }
                .review-clinic-name { font-size: 1rem; font-weight: 900; color: #fff; margin-bottom: 4px; }
                .review-appt-detail { font-size: 0.8rem; color: rgba(255,255,255,0.45); }

                .review-form { display: flex; flex-direction: column; gap: 16px; }
                .stars-section { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 10px 0; }
                .stars-label { font-size: 0.85rem; color: rgba(255,255,255,0.6); font-weight: 700; }
                .stars-row { display: flex; gap: 6px; }
                .star-btn { background: none; border: none; font-size: 2.4rem; cursor: pointer; color: rgba(255,255,255,0.15); transition: color 0.15s, transform 0.15s; line-height: 1; padding: 0 2px; }
                .star-btn.active { color: #ffd93d; }
                .star-btn:hover { transform: scale(1.15); }
                .stars-text { font-size: 0.85rem; color: #ffd93d; font-weight: 700; }

                .appt-form { display: flex; flex-direction: column; gap: 14px; }
                .form-group { display: flex; flex-direction: column; gap: 6px; }
                .form-group label { font-size: 0.78rem; font-weight: 700; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.06em; }
                .form-group input, .form-group select, .form-group textarea { background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.10); border-radius: 10px; color: #fff; padding: 11px 14px; font-family: 'Nunito', sans-serif; font-size: 0.92rem; outline: none; transition: border-color 0.2s, box-shadow 0.2s; width: 100%; }
                .form-group select { cursor: pointer; appearance: none; }
                .form-group select option { background: #1a1a2e; }
                .form-group input::placeholder, .form-group textarea::placeholder { color: rgba(255,255,255,0.2); }
                .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #4CAF50; box-shadow: 0 0 0 3px rgba(76,175,80,0.12); }
                .form-group textarea { resize: vertical; }
                .form-actions { display: flex; gap: 10px; margin-top: 8px; justify-content: flex-end; }
                .btn-ghost { background: transparent; border: 1.5px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.5); border-radius: 10px; padding: 11px 20px; font-family: 'Nunito', sans-serif; font-weight: 700; cursor: pointer; transition: border-color 0.2s; }
                .btn-ghost:hover { border-color: rgba(255,255,255,0.25); }
                .consent-box { background: rgba(76,175,80,0.08); border: 1px solid rgba(76,175,80,0.25); border-radius: 12px; padding: 12px 16px; display: flex; gap: 10px; align-items: flex-start; }
                .consent-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }
                .consent-box p { font-size: 0.82rem; color: rgba(255,255,255,0.6); line-height: 1.5; }
                .consent-box strong { color: #4CAF50; }

                @media (max-width: 600px) {
                    .appts-inner { padding: 16px 14px; }
                    .appts-header { flex-direction: column; align-items: flex-start; margin-bottom: 16px; }
                    .appts-title { font-size: 1.5rem; }
                    .appts-header .btn-primary { width: 100%; text-align: center; }
                    .filters { flex-wrap: wrap; gap: 6px; padding-bottom: 4px; }
                    .filters::-webkit-scrollbar { display: none; }
                    .filter-btn { flex-shrink: 0; padding: 6px 12px; font-size: 0.8rem; }
                    .appt-card { flex-direction: column; align-items: flex-start; gap: 12px; padding: 16px 14px; border-radius: 16px; }
                    .appt-date-col { width: 100%; }
                    .appt-date-box { flex-direction: row; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 10px; min-width: unset; width: 100%; justify-content: flex-start; }
                    .appt-day { font-size: 1.3rem; }
                    .appt-month { font-size: 0.72rem; }
                    .appt-time { font-size: 0.72rem; margin-top: 0; margin-left: auto; }
                    .appt-scard p { white-space: normal !important; }
                    .appt-card *, .appt-scard *, .appts-inner * { min-width: 0; max-width: 100%; }
                    .appt-info { width: 100%; }
                    .appt-actions { flex-direction: row; width: 100%; justify-content: flex-end; }
                    .empty-state { padding: 48px 16px; }
                    .empty-emoji { font-size: 3.5rem; }
                    .empty-state h2 { font-size: 1.3rem; }
                    .modal-overlay { padding: 0; align-items: flex-end; }
                    .modal { border-radius: 24px 24px 0 0; padding: 24px 18px; max-height: 92vh; border-bottom: none; }
                    .modal-header h2 { font-size: 1.15rem; }
                    .form-actions { flex-direction: column-reverse; gap: 8px; }
                    .form-actions .btn-ghost, .form-actions .btn-primary { width: 100%; text-align: center; padding: 13px; }
                    .star-btn { font-size: 2.8rem; }
                    .slots-grid { gap: 6px; }
                    .slot-btn { padding: 7px 11px; font-size: 0.82rem; }
                    .appt-scard { padding: 16px 14px; max-width: 100%; box-sizing: border-box; }
                    .appt-scard div, .appt-scard p, .appt-scard span { word-wrap: break-word; overflow-wrap: break-word; word-break: break-word; }
                    .appt-scard p { white-space: normal !important; }
                }

                @media (max-width: 380px) {
                    .appts-inner { padding: 12px 10px; }
                    .appts-title { font-size: 1.3rem; }
                    .appt-card { padding: 14px 12px; }
                    .appt-scard { padding: 14px 12px; }
                }
            `}</style>
        </div>
    );
}
