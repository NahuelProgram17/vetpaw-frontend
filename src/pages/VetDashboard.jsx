import { useState, useEffect } from "react";
import { getAppointments, confirmAppointment, cancelAppointment, createVisit, markNoShow } from "../services/api";
import { useAuth } from "../context/AuthContext";

const STATUS_LABEL = {
    pending: { label: "Pendiente", color: "#ffd93d" },
    confirmed: { label: "Confirmado", color: "#6bcaff" },
    cancelled: { label: "Cancelado", color: "#ff6b6b" },
    completed: { label: "Realizado", color: "#6bffb8" },
    no_show: { label: "Ausente", color: "#ff9500" },
};

const EMPTY_VISIT = {
    pet: "", clinic: "", date: "", reason: "",
    diagnosis: "", treatment: "", observations: "",
    next_visit: "", vet_name: "", vet_lastname: "", vet_license: "",
};

export default function VetDashboard() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("pending");
    const [showVisitModal, setShowVisitModal] = useState(false);
    const [selectedAppt, setSelectedAppt] = useState(null);
    const [visitForm, setVisitForm] = useState(EMPTY_VISIT);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => { fetchAppointments(); }, []);

    const fetchAppointments = async () => {
        try {
            const data = await getAppointments();
            setAppointments(data.results ?? data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleConfirm = async (id) => {
        try {
            await confirmAppointment(id);
            await fetchAppointments();
            setSuccess("Turno confirmado exitosamente.");
            setTimeout(() => setSuccess(""), 3000);
        } catch (e) { console.error(e); }
    };

    const handleCancel = async (id) => {
        try {
            await cancelAppointment(id);
            await fetchAppointments();
        } catch (e) { console.error(e); }
    };

    const handleNoShow = async (id) => {
        try {
            await markNoShow(id);
            await fetchAppointments();
            setSuccess("Turno marcado como ausente.");
            setTimeout(() => setSuccess(""), 3000);
        } catch (e) { console.error(e); }
    };

    const openVisitModal = (appt) => {
        setSelectedAppt(appt);
        setVisitForm({
            ...EMPTY_VISIT,
            pet: appt.pet || "",
            clinic: appt.clinic || "",
            date: new Date().toISOString().slice(0, 16),
            reason: appt.reason || "",
        });
        setError("");
        setShowVisitModal(true);
    };

    const handleVisitChange = (e) =>
        setVisitForm({ ...visitForm, [e.target.name]: e.target.value });

    const handleVisitSubmit = async (e) => {
        e.preventDefault();
        if (!visitForm.vet_name || !visitForm.vet_lastname || !visitForm.vet_license) {
            setError("Nombre, apellido y matrícula del veterinario son obligatorios.");
            return;
        }
        if (!visitForm.diagnosis) {
            setError("El diagnóstico es obligatorio.");
            return;
        }
        setSaving(true);
        setError("");
        try {
            await createVisit({
                pet: visitForm.pet,
                clinic: visitForm.clinic,
                date: visitForm.date,
                reason: visitForm.reason,
                diagnosis: visitForm.diagnosis,
                treatment: visitForm.treatment,
                observations: visitForm.observations,
                next_visit: visitForm.next_visit || null,
                vet_first_name: visitForm.vet_name,
                vet_last_name: visitForm.vet_lastname,
                vet_license: visitForm.vet_license,
            });
            setShowVisitModal(false);
            setSuccess("Visita registrada y agregada al historial de la mascota.");
            setTimeout(() => setSuccess(""), 4000);
            await fetchAppointments();
        } catch (err) {
            const data = err.response?.data;
            setError(data ? Object.values(data).flat().join(" ") : "Error al guardar la visita.");
        } finally { setSaving(false); }
    };

    const filtered = filter === "all"
        ? appointments
        : appointments.filter((a) => a.status === filter);

    const pending = appointments.filter((a) => a.status === "pending").length;
    const confirmed = appointments.filter((a) => a.status === "confirmed").length;
    const completed = appointments.filter((a) => a.status === "completed").length;
    const noShow = appointments.filter((a) => a.status === "no_show").length;

    const formatDate = (d) => {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("es-AR", {
            weekday: "short", day: "2-digit", month: "short", year: "numeric",
        });
    };
    const formatTime = (d) => {
        if (!d) return "";
        return new Date(d).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div className="vet-page">
            <div className="blob b1" /><div className="blob b2" />
            <div className="vet-inner">
                <header className="vet-header">
                    <div>
                        <p className="vet-greeting">Panel veterinario 🩺</p>
                        <h1 className="vet-title">Gestión de turnos</h1>
                    </div>
                    {success && <div className="success-toast">✅ {success}</div>}
                </header>

                <div className="vet-stats">
                    <div className="vet-stat"><span className="stat-icon">⏳</span><div><p className="stat-num">{pending}</p><p className="stat-label">Pendientes</p></div></div>
                    <div className="vet-stat"><span className="stat-icon">✅</span><div><p className="stat-num">{confirmed}</p><p className="stat-label">Confirmados</p></div></div>
                    <div className="vet-stat"><span className="stat-icon">📋</span><div><p className="stat-num">{completed}</p><p className="stat-label">Realizados</p></div></div>
                    <div className="vet-stat"><span className="stat-icon">❌</span><div><p className="stat-num">{noShow}</p><p className="stat-label">Ausentes</p></div></div>
                </div>

                <div className="filters">
                    {["pending", "confirmed", "completed", "cancelled", "no_show", "all"].map((f) => (
                        <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                            {f === "all" ? "Todos" : STATUS_LABEL[f]?.label}
                        </button>
                    ))}
                </div>

                {loading && <div className="loading-state"><span className="paw-spin">🐾</span><p>Cargando turnos...</p></div>}

                {!loading && filtered.length === 0 && (
                    <div className="empty-state">
                        <span>📭</span>
                        <p>No hay turnos {filter !== "all" ? `con estado "${STATUS_LABEL[filter]?.label}"` : ""}.</p>
                    </div>
                )}

                {!loading && filtered.length > 0 && (
                    <div className="appts-list">
                        {filtered.map((appt) => {
                            const status = STATUS_LABEL[appt.status] || STATUS_LABEL.pending;
                            return (
                                <div key={appt.id} className="appt-card">
                                    <div className="appt-date-box">
                                        <span className="appt-day">{new Date(appt.requested_date).getDate()}</span>
                                        <span className="appt-month">{new Date(appt.requested_date).toLocaleString("es-AR", { month: "short" })}</span>
                                        <span className="appt-time">{formatTime(appt.requested_date)}</span>
                                    </div>
                                    <div className="appt-info">
                                        <div className="appt-top">
                                            <h3 className="appt-reason">{appt.reason || "Consulta"}</h3>
                                            <span className="appt-status-badge" style={{ color: status.color, background: `${status.color}18`, borderColor: `${status.color}30` }}>
                                                {status.label}
                                            </span>
                                        </div>
                                        <div className="appt-meta">
                                            {appt.pet_name && <span>🐾 {appt.pet_name}</span>}
                                            {appt.owner_name && <span>👤 {appt.owner_name}</span>}
                                            <span>📆 {formatDate(appt.requested_date)}</span>
                                        </div>
                                    </div>
                                    <div className="appt-actions">
                                        {appt.status === "pending" && (
                                            <>
                                                <button className="btn-confirm" onClick={() => handleConfirm(appt.id)}>✅ Confirmar</button>
                                                <button className="btn-cancel-sm" onClick={() => handleCancel(appt.id)}>✕ Cancelar</button>
                                            </>
                                        )}
                                        {appt.status === "confirmed" && (
                                            <>
                                                <button className="btn-visit" onClick={() => openVisitModal(appt)}>📋 Cargar visita</button>
                                                <button className="btn-noshow" onClick={() => handleNoShow(appt.id)}>❌ Ausente</button>
                                                <button className="btn-cancel-sm" onClick={() => handleCancel(appt.id)}>✕ Cancelar</button>
                                            </>
                                        )}
                                        {appt.status === "completed" && <span className="done-label">✅ Visita registrada</span>}
                                        {appt.status === "cancelled" && <span className="cancelled-label">✕ Cancelado</span>}
                                        {appt.status === "no_show" && <span className="noshow-label">❌ Ausente</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {showVisitModal && (
                <div className="modal-overlay" onClick={() => setShowVisitModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📋 Registrar visita</h2>
                            <button className="modal-close" onClick={() => setShowVisitModal(false)}>✕</button>
                        </div>
                        {error && <div className="form-error">⚠️ {error}</div>}
                        <form onSubmit={handleVisitSubmit} className="visit-form">
                            <div className="form-section">
                                <h3 className="section-title">🩺 Datos del veterinario</h3>
                                <div className="form-row">
                                    <div className="form-group"><label>Nombre *</label><input name="vet_name" placeholder="Marcos" value={visitForm.vet_name} onChange={handleVisitChange} /></div>
                                    <div className="form-group"><label>Apellido *</label><input name="vet_lastname" placeholder="García" value={visitForm.vet_lastname} onChange={handleVisitChange} /></div>
                                </div>
                                <div className="form-group"><label>Matrícula *</label><input name="vet_license" placeholder="Mat. 12345" value={visitForm.vet_license} onChange={handleVisitChange} /></div>
                            </div>
                            <div className="form-section">
                                <h3 className="section-title">📝 Datos de la consulta</h3>
                                <div className="form-group"><label>Fecha y hora</label><input name="date" type="datetime-local" value={visitForm.date} onChange={handleVisitChange} /></div>
                                <div className="form-group"><label>Motivo</label><input name="reason" value={visitForm.reason} onChange={handleVisitChange} /></div>
                                <div className="form-group"><label>Diagnóstico *</label><textarea name="diagnosis" rows={2} placeholder="Diagnóstico de la consulta..." value={visitForm.diagnosis} onChange={handleVisitChange} /></div>
                                <div className="form-group"><label>Tratamiento</label><textarea name="treatment" rows={2} placeholder="Medicación, indicaciones..." value={visitForm.treatment} onChange={handleVisitChange} /></div>
                                <div className="form-group"><label>Observaciones adicionales</label><textarea name="observations" rows={2} placeholder="Notas extra..." value={visitForm.observations} onChange={handleVisitChange} /></div>
                                <div className="form-group"><label>Próxima visita</label><input name="next_visit" type="date" value={visitForm.next_visit} onChange={handleVisitChange} /></div>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-ghost" onClick={() => setShowVisitModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Guardando..." : "Guardar en historial 📋"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Fraunces:ital,opsz,wght@1,9..144,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .vet-page { min-height: 100vh; background: #1a1a2e; font-family: 'Nunito', sans-serif; position: relative; overflow-x: hidden; padding-bottom: 60px; }
        .blob { position: fixed; border-radius: 50%; filter: blur(90px); opacity: 0.08; pointer-events: none; }
        .b1 { width: 500px; height: 500px; background: #6bffb8; top: -100px; left: -100px; }
        .b2 { width: 400px; height: 400px; background: #6bcaff; bottom: -100px; right: -100px; }
        .vet-inner { max-width: 900px; margin: 0 auto; padding: 32px 24px; position: relative; z-index: 1; }
        .vet-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
        .vet-greeting { font-size: 0.9rem; color: rgba(255,255,255,0.45); font-weight: 600; margin-bottom: 4px; }
        .vet-title { font-family: 'Fraunces', serif; font-size: 2rem; font-weight: 700; font-style: italic; color: #fff; letter-spacing: -1px; }
        .success-toast { background: rgba(107,255,184,0.12); border: 1px solid rgba(107,255,184,0.3); color: #6bffb8; padding: 10px 16px; border-radius: 10px; font-size: 0.88rem; font-weight: 700; animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .vet-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
        .vet-stat { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px; display: flex; align-items: center; gap: 12px; backdrop-filter: blur(10px); }
        .stat-icon { font-size: 1.8rem; }
        .stat-num { font-size: 1.6rem; font-weight: 900; color: #fff; line-height: 1; }
        .stat-label { font-size: 0.72rem; color: rgba(255,255,255,0.4); font-weight: 600; margin-top: 2px; }
        .filters { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .filter-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.10); color: rgba(255,255,255,0.5); border-radius: 10px; padding: 7px 16px; font-family: 'Nunito', sans-serif; font-size: 0.84rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .filter-btn:hover { border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.8); }
        .filter-btn.active { background: rgba(107,255,184,0.12); border-color: rgba(107,255,184,0.35); color: #6bffb8; }
        .loading-state, .empty-state { text-align: center; padding: 60px 20px; display: flex; flex-direction: column; align-items: center; gap: 14px; }
        .paw-spin { font-size: 3rem; animation: spin 1s linear infinite; display: block; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-state p, .empty-state p { color: rgba(255,255,255,0.4); }
        .empty-state span { font-size: 3rem; }
        .appts-list { display: flex; flex-direction: column; gap: 12px; }
        .appt-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 18px 20px; display: flex; align-items: center; gap: 18px; backdrop-filter: blur(10px); transition: border-color 0.2s; }
        .appt-card:hover { border-color: rgba(107,255,184,0.2); }
        .appt-date-box { display: flex; flex-direction: column; align-items: center; background: rgba(107,255,184,0.10); border-radius: 10px; padding: 8px 12px; min-width: 52px; flex-shrink: 0; }
        .appt-day { font-size: 1.4rem; font-weight: 900; color: #6bffb8; line-height: 1; }
        .appt-month { font-size: 0.6rem; color: rgba(107,255,184,0.7); text-transform: uppercase; font-weight: 700; }
        .appt-time { font-size: 0.65rem; color: rgba(255,255,255,0.4); margin-top: 3px; font-weight: 600; }
        .appt-info { flex: 1; display: flex; flex-direction: column; gap: 5px; }
        .appt-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .appt-reason { font-size: 0.98rem; font-weight: 900; color: #fff; }
        .appt-status-badge { font-size: 0.7rem; font-weight: 700; border-radius: 6px; padding: 3px 9px; border: 1px solid; }
        .appt-meta { display: flex; gap: 14px; flex-wrap: wrap; }
        .appt-meta span { font-size: 0.78rem; color: rgba(255,255,255,0.45); }
        .appt-actions { display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
        .btn-confirm { background: rgba(107,255,184,0.12); border: 1px solid rgba(107,255,184,0.3); color: #6bffb8; border-radius: 8px; padding: 7px 14px; font-family: 'Nunito', sans-serif; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: background 0.2s; white-space: nowrap; }
        .btn-confirm:hover { background: rgba(107,255,184,0.2); }
        .btn-visit { background: rgba(107,202,255,0.12); border: 1px solid rgba(107,202,255,0.3); color: #6bcaff; border-radius: 8px; padding: 7px 14px; font-family: 'Nunito', sans-serif; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: background 0.2s; white-space: nowrap; }
        .btn-visit:hover { background: rgba(107,202,255,0.2); }
        .btn-noshow { background: rgba(255,149,0,0.12); border: 1px solid rgba(255,149,0,0.3); color: #ff9500; border-radius: 8px; padding: 7px 14px; font-family: 'Nunito', sans-serif; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: background 0.2s; white-space: nowrap; }
        .btn-noshow:hover { background: rgba(255,149,0,0.2); }
        .btn-cancel-sm { background: rgba(255,107,107,0.08); border: 1px solid rgba(255,107,107,0.2); color: rgba(255,107,107,0.7); border-radius: 8px; padding: 6px 14px; font-family: 'Nunito', sans-serif; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: background 0.2s; white-space: nowrap; }
        .btn-cancel-sm:hover { background: rgba(255,107,107,0.15); }
        .done-label { font-size: 0.78rem; color: #6bffb8; font-weight: 700; }
        .cancelled-label { font-size: 0.78rem; color: rgba(255,107,107,0.6); font-weight: 700; }
        .noshow-label { font-size: 0.78rem; color: #ff9500; font-weight: 700; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(6px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal { background: #1e1e35; border: 1px solid rgba(255,255,255,0.10); border-radius: 24px; padding: 32px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; animation: modalIn 0.3s cubic-bezier(.22,.68,0,1.2) both; }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .modal-header h2 { font-family: 'Fraunces', serif; font-size: 1.4rem; font-style: italic; color: #fff; }
        .modal-close { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); border-radius: 8px; padding: 6px 10px; cursor: pointer; transition: background 0.2s; }
        .modal-close:hover { background: rgba(255,107,107,0.15); color: #ff6b6b; }
        .form-error { background: rgba(255,107,107,0.15); border: 1px solid rgba(255,107,107,0.4); color: #ff9999; padding: 10px 14px; border-radius: 10px; font-size: 0.86rem; margin-bottom: 16px; }
        .visit-form { display: flex; flex-direction: column; gap: 20px; }
        .form-section { display: flex; flex-direction: column; gap: 12px; }
        .section-title { font-size: 0.85rem; font-weight: 900; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.06em; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .form-row { display: flex; gap: 12px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .form-group label { font-size: 0.76rem; font-weight: 700; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.06em; }
        .form-group input, .form-group textarea { background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.10); border-radius: 10px; color: #fff; padding: 10px 14px; font-family: 'Nunito', sans-serif; font-size: 0.9rem; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        .form-group input::placeholder, .form-group textarea::placeholder { color: rgba(255,255,255,0.2); }
        .form-group input:focus, .form-group textarea:focus { border-color: #6bffb8; box-shadow: 0 0 0 3px rgba(107,255,184,0.10); }
        .form-group textarea { resize: vertical; }
        .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }
        .btn-ghost { background: transparent; border: 1.5px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.5); border-radius: 10px; padding: 11px 20px; font-family: 'Nunito', sans-serif; font-weight: 700; cursor: pointer; }
        .btn-primary { background: linear-gradient(135deg, #6bffb8, #3de09a); color: #1a1a2e; border: none; border-radius: 10px; padding: 11px 22px; font-family: 'Nunito', sans-serif; font-size: 0.95rem; font-weight: 900; cursor: pointer; transition: transform 0.15s, opacity 0.15s; }
        .btn-primary:hover:not(:disabled) { transform: translateY(-2px); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        @media (max-width: 700px) { .vet-stats { grid-template-columns: repeat(2, 1fr); } .appt-card { flex-direction: column; align-items: flex-start; } .form-row { flex-direction: column; } .vet-inner { padding: 20px 16px; } }
    `}</style>
        </div>
    );
}