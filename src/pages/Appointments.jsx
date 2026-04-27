import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getAppointments, createAppointment, updateAppointment, cancelAppointment, getPets, getClinics } from "../services/api";

const STATUS_LABEL = {
    pending: { label: "Pendiente", color: "#ffd93d" },
    confirmed: { label: "Confirmado", color: "#6bcaff" },
    cancelled: { label: "Cancelado", color: "#ff6b6b" },
    completed: { label: "Realizado", color: "#6bffb8" },
    no_show: { label: "Ausente", color: "#ff9500" },
};

const EMPTY_FORM = {
    pet: "", clinic: "", requested_date: "", reason: "",
};

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

    useEffect(() => {
        fetchAll();
        const petId = searchParams.get("pet");
        if (petId) {
            setForm({ ...EMPTY_FORM, pet: parseInt(petId) });
            setShowModal(true);
        }
    }, []);

    const fetchAll = async () => {
        try {
            const [a, p, c] = await Promise.all([getAppointments(), getPets(), getClinics()]);
            setAppointments(a.results ?? a);
            setPets(p.results ?? p);
            setClinics(c.results ?? c);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openNew = () => {
        setEditingAppt(null);
        setForm(EMPTY_FORM);
        setError("");
        setShowModal(true);
    };

    const openEdit = (appt) => {
        setEditingAppt(appt);
        setForm({
            pet: appt.pet || "",
            clinic: appt.clinic || "",
            requested_date: appt.requested_date ? appt.requested_date.slice(0, 16) : "",
            reason: appt.reason || "",
        });
        setError("");
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingAppt(null);
        setError("");
    };

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.pet || !form.requested_date || !form.reason || !form.clinic) {
            setError("Mascota, clínica, fecha y motivo son obligatorios.");
            return;
        }
        setSaving(true);
        setError("");
        try {
            if (editingAppt) {
                await updateAppointment(editingAppt.id, form);
            } else {
                await createAppointment(form);
            }
            await fetchAll();
            closeModal();
        } catch (err) {
            const data = err.response?.data;
            setError(data ? Object.values(data).flat().join(" ") : "Error al guardar.");
        } finally { setSaving(false); }
    };

    const canCancel = (appt) => {
        const apptDate = new Date(appt.requested_date);
        const now = new Date();
        const hoursUntil = (apptDate - now) / (1000 * 60 * 60);
        return hoursUntil >= 24;
    };

    const handleCancelClick = (appt) => {
        if (!canCancel(appt)) {
            setCancelError(appt.id);
            return;
        }
        setCancelConfirm(appt.id);
        setCancelError("");
    };

    const handleCancel = async (id) => {
        try {
            await cancelAppointment(id);
            await fetchAll();
            setCancelConfirm(null);
        } catch (e) { console.error(e); }
    };

    const getPetName = (id) => pets.find((p) => p.id === id)?.name || "—";
    const getClinicName = (id) => clinics.find((c) => c.id === id)?.name || "—";

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

    const filtered = filter === "all"
        ? appointments
        : appointments.filter((a) => a.status === filter);

    const upcoming = appointments.filter((a) => new Date(a.requested_date) >= new Date() && a.status !== "cancelled");
    const past = appointments.filter((a) => new Date(a.requested_date) < new Date() || a.status === "cancelled");

    return (
        <div className="appts-page">
            <div className="blob b1" /><div className="blob b2" />

            <div className="appts-inner">
                <header className="appts-header">
                    <div>
                        <h1 className="appts-title">📅 Mis turnos</h1>
                        <p className="appts-subtitle">
                            {appointments.length === 0
                                ? "No tenés turnos registrados."
                                : `${upcoming.length} próximo${upcoming.length !== 1 ? "s" : ""} · ${past.length} pasado${past.length !== 1 ? "s" : ""}`}
                        </p>
                    </div>
                    <button className="btn-primary" onClick={openNew}>+ Nuevo turno</button>
                </header>

                {appointments.length > 0 && (
                    <div className="filters">
                        {["all", "pending", "confirmed", "completed", "cancelled", "no_show"].map((f) => (
                            <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                                {f === "all" ? "Todos" : STATUS_LABEL[f]?.label}
                            </button>
                        ))}
                    </div>
                )}

                {loading && <div className="loading-state"><span className="paw-spin">🐾</span><p>Cargando turnos...</p></div>}

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
                        {filtered.map((appt) => {
                            const status = STATUS_LABEL[appt.status] || STATUS_LABEL.pending;
                            const isPast = new Date(appt.requested_date) < new Date();
                            const canCancelThis = canCancel(appt);
                            return (
                                <div key={appt.id} className={`appt-card ${isPast ? "past" : ""}`}>
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
                                            {appt.pet && <span>🐾 {getPetName(appt.pet)}</span>}
                                            {appt.clinic && <span>🏥 {getClinicName(appt.clinic)}</span>}
                                            <span>📆 {formatDate(appt.requested_date)}</span>
                                        </div>
                                        {cancelError === appt.id && (
                                            <p className="cancel-warning">⚠️ No podés cancelar con menos de 24hs de anticipación. Contactá a la clínica directamente.</p>
                                        )}
                                    </div>

                                    <div className="appt-actions">
                                        {appt.status !== "cancelled" && appt.status !== "completed" && appt.status !== "no_show" && (
                                            <>
                                                <button className="btn-icon" onClick={() => openEdit(appt)} title="Editar">✏️</button>
                                                <button
                                                    className={`btn-icon ${canCancelThis ? "danger" : "locked"}`}
                                                    onClick={() => handleCancelClick(appt)}
                                                    title={canCancelThis ? "Cancelar" : "No se puede cancelar con menos de 24hs"}
                                                >
                                                    {canCancelThis ? "✕" : "🔒"}
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {cancelConfirm === appt.id && (
                                        <div className="cancel-overlay">
                                            <p>¿Cancelar este turno?</p>
                                            <p className="cancel-policy">Recordá que las cancelaciones con menos de 24hs no están permitidas.</p>
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
                    <div className="empty-state">
                        <span className="empty-emoji">🔍</span>
                        <p>No hay turnos con ese filtro.</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingAppt ? "Editar turno" : "Nuevo turno"}</h2>
                            <button className="modal-close" onClick={closeModal}>✕</button>
                        </div>
                        {error && <div className="form-error">⚠️ {error}</div>}
                        <form onSubmit={handleSubmit} className="appt-form">
                            <div className="form-group">
                                <label>Mascota *</label>
                                <select name="pet" value={form.pet} onChange={(e) => setForm({ ...form, pet: parseInt(e.target.value) || "" })}>
                                    <option value="">Seleccioná una mascota</option>
                                    {pets.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.species_display || p.species})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Clínica *</label>
                                <select name="clinic" value={form.clinic} onChange={(e) => setForm({ ...form, clinic: parseInt(e.target.value) || "" })}>
                                    <option value="">Seleccioná una clínica</option>
                                    {clinics.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Fecha y hora *</label>
                                <input name="requested_date" type="datetime-local" value={form.requested_date} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Motivo *</label>
                                <input name="reason" type="text" placeholder="Ej: Vacunación anual, control de rutina..." value={form.reason} onChange={handleChange} />
                            </div>
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

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Fraunces:ital,opsz,wght@1,9..144,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .appts-page { min-height: 100vh; background: #1a1a2e; font-family: 'Nunito', sans-serif; position: relative; overflow-x: hidden; padding-bottom: 60px; }
        .blob { position: fixed; border-radius: 50%; filter: blur(90px); opacity: 0.08; pointer-events: none; }
        .b1 { width: 500px; height: 500px; background: #ffd93d; top: -100px; left: -100px; }
        .b2 { width: 400px; height: 400px; background: #ff6b6b; bottom: -100px; right: -100px; }
        .appts-inner { max-width: 860px; margin: 0 auto; padding: 32px 24px; position: relative; z-index: 1; }
        .appts-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
        .appts-title { font-family: 'Fraunces', serif; font-size: 2rem; font-weight: 700; font-style: italic; color: #fff; letter-spacing: -1px; }
        .appts-subtitle { color: rgba(255,255,255,0.45); font-size: 0.9rem; margin-top: 4px; }
        .btn-primary { background: linear-gradient(135deg, #ff6b6b, #ff4a4a); color: #fff; border: none; border-radius: 12px; padding: 12px 22px; font-family: 'Nunito', sans-serif; font-size: 0.95rem; font-weight: 900; cursor: pointer; box-shadow: 0 6px 20px rgba(255,107,107,0.35); transition: transform 0.15s, box-shadow 0.15s; }
        .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(255,107,107,0.5); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .filters { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
        .filter-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.10); color: rgba(255,255,255,0.5); border-radius: 10px; padding: 7px 16px; font-family: 'Nunito', sans-serif; font-size: 0.84rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .filter-btn:hover { border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.8); }
        .filter-btn.active { background: rgba(255,107,107,0.15); border-color: rgba(255,107,107,0.4); color: #ff6b6b; }
        .loading-state, .empty-state { text-align: center; padding: 80px 20px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .paw-spin { font-size: 3rem; animation: spin 1s linear infinite; display: block; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-state p, .empty-state p { color: rgba(255,255,255,0.4); }
        .empty-emoji { font-size: 5rem; }
        .empty-state h2 { font-family: 'Fraunces', serif; font-size: 1.6rem; font-style: italic; color: #fff; }
        .appts-list { display: flex; flex-direction: column; gap: 14px; }
        .appt-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 20px; display: flex; align-items: center; gap: 20px; backdrop-filter: blur(10px); transition: border-color 0.2s, transform 0.2s; position: relative; overflow: hidden; }
        .appt-card:hover { border-color: rgba(255,107,107,0.2); transform: translateY(-2px); }
        .appt-card.past { opacity: 0.65; }
        .appt-date-box { display: flex; flex-direction: column; align-items: center; background: rgba(255,107,107,0.12); border-radius: 12px; padding: 10px 14px; min-width: 56px; flex-shrink: 0; }
        .appt-day { font-size: 1.6rem; font-weight: 900; color: #ff6b6b; line-height: 1; }
        .appt-month { font-size: 0.65rem; color: rgba(255,107,107,0.7); text-transform: uppercase; font-weight: 700; }
        .appt-time { font-size: 0.7rem; color: rgba(255,255,255,0.4); margin-top: 4px; font-weight: 600; }
        .appt-info { flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .appt-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .appt-reason { font-size: 1rem; font-weight: 900; color: #fff; }
        .appt-status-badge { font-size: 0.72rem; font-weight: 700; border-radius: 6px; padding: 3px 10px; border: 1px solid; }
        .appt-meta { display: flex; gap: 14px; flex-wrap: wrap; }
        .appt-meta span { font-size: 0.8rem; color: rgba(255,255,255,0.45); }
        .cancel-warning { font-size: 0.78rem; color: #ff9500; background: rgba(255,149,0,0.1); border: 1px solid rgba(255,149,0,0.25); border-radius: 8px; padding: 6px 10px; }
        .appt-actions { display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
        .btn-icon { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.10); border-radius: 8px; padding: 7px 9px; cursor: pointer; font-size: 0.9rem; transition: background 0.2s; }
        .btn-icon:hover { background: rgba(255,255,255,0.12); }
        .btn-icon.danger:hover { background: rgba(255,107,107,0.15); }
        .btn-icon.locked { opacity: 0.5; cursor: not-allowed; }
        .cancel-overlay { position: absolute; inset: 0; border-radius: 18px; background: rgba(26,26,46,0.95); backdrop-filter: blur(8px); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 20px; }
        .cancel-overlay p { color: #fff; font-size: 0.95rem; font-weight: 700; text-align: center; }
        .cancel-policy { font-size: 0.78rem !important; color: rgba(255,255,255,0.4) !important; font-weight: 400 !important; }
        .cancel-btns { display: flex; gap: 10px; }
        .btn-ghost-sm { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.6); border-radius: 8px; padding: 7px 16px; font-family: 'Nunito', sans-serif; font-weight: 700; cursor: pointer; font-size: 0.88rem; }
        .btn-danger-sm { background: linear-gradient(135deg, #ff6b6b, #ff4a4a); border: none; color: #fff; border-radius: 8px; padding: 7px 16px; font-family: 'Nunito', sans-serif; font-weight: 700; cursor: pointer; font-size: 0.88rem; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal { background: #1e1e35; border: 1px solid rgba(255,255,255,0.10); border-radius: 24px; padding: 32px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; animation: modalIn 0.3s cubic-bezier(.22,.68,0,1.2) both; }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .modal-header h2 { font-family: 'Fraunces', serif; font-size: 1.4rem; font-style: italic; color: #fff; }
        .modal-close { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); border-radius: 8px; padding: 6px 10px; cursor: pointer; transition: background 0.2s; }
        .modal-close:hover { background: rgba(255,107,107,0.15); color: #ff6b6b; }
        .form-error { background: rgba(255,107,107,0.15); border: 1px solid rgba(255,107,107,0.4); color: #ff9999; padding: 10px 14px; border-radius: 10px; font-size: 0.86rem; margin-bottom: 16px; }
        .appt-form { display: flex; flex-direction: column; gap: 14px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 0.78rem; font-weight: 700; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.06em; }
        .form-group input, .form-group select, .form-group textarea { background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.10); border-radius: 10px; color: #fff; padding: 11px 14px; font-family: 'Nunito', sans-serif; font-size: 0.92rem; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        .form-group select { cursor: pointer; appearance: none; }
        .form-group select option { background: #1a1a2e; }
        .form-group input::placeholder, .form-group textarea::placeholder { color: rgba(255,255,255,0.2); }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #ff6b6b; box-shadow: 0 0 0 3px rgba(255,107,107,0.12); }
        .form-group textarea { resize: vertical; }
        .form-actions { display: flex; gap: 10px; margin-top: 8px; justify-content: flex-end; }
        .btn-ghost { background: transparent; border: 1.5px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.5); border-radius: 10px; padding: 11px 20px; font-family: 'Nunito', sans-serif; font-weight: 700; cursor: pointer; transition: border-color 0.2s; }
        .btn-ghost:hover { border-color: rgba(255,255,255,0.25); }
        @media (max-width: 600px) { .appt-card { flex-direction: column; align-items: flex-start; } .appts-inner { padding: 20px 16px; } }
    `}</style>
        </div>
    );
}