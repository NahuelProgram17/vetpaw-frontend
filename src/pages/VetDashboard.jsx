// VetDashboard.jsx
import { useState, useEffect } from "react";
import { getAppointments, confirmAppointment, cancelAppointment, createVisit, markNoShow } from "../services/api";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const STATUS_LABEL = {
    pending:   { label: "Pendiente",  color: "#ffd93d" },
    confirmed: { label: "Confirmado", color: "#6bcaff" },
    cancelled: { label: "Cancelado",  color: "#ff6b6b" },
    completed: { label: "Realizado",  color: "#6bffb8" },
    no_show:   { label: "Ausente",    color: "#ff9500" },
};

const EMPTY_VISIT = {
    pet: "", clinic: "", date: "", reason: "",
    diagnosis: "", treatment: "", observations: "",
    next_visit: "", vet_name: "", vet_lastname: "", vet_license: "",
};

const EMPTY_VACCINE = {
    pet: "", name: "", date_applied: "", next_dose: "",
    batch: "", notes: "", vet_first_name: "", vet_last_name: "", vet_license: "",
};

const SPECIES_ICON = {
    dog: "🐶", cat: "🐱", rabbit: "🐰", bird: "🦜",
    hamster: "🐹", reptile: "🦎", fish: "🐠", other: "🐾",
};

export default function ClinicDashboard() {
    const { user } = useAuth();
    const [tab, setTab] = useState("turnos");
    const [appointments, setAppointments] = useState([]);
    const [pets, setPets] = useState([]);
    const [visits, setVisits] = useState([]);
    const [vaccines, setVaccines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("pending");

    const [showVisitModal, setShowVisitModal] = useState(false);
    const [selectedAppt, setSelectedAppt] = useState(null);
    const [visitForm, setVisitForm] = useState(EMPTY_VISIT);

    const [showVaccineModal, setShowVaccineModal] = useState(false);
    const [vaccineForm, setVaccineForm] = useState(EMPTY_VACCINE);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [selectedPet, setSelectedPet] = useState(null);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [apptData, petData, visitData, vaccineData] = await Promise.all([
                getAppointments(),
                api.get("/pets/"),
                api.get("/visits/"),
                api.get("/vaccines/"),
            ]);
            setAppointments(apptData.results ?? apptData);
            setPets(petData.data.results ?? petData.data);
            setVisits(visitData.data.results ?? visitData.data);
            setVaccines(vaccineData.data.results ?? vaccineData.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleConfirm = async (id) => {
        try {
            await confirmAppointment(id);
            await fetchAll();
            setSuccess("Turno confirmado.");
            setTimeout(() => setSuccess(""), 3000);
        } catch (e) { console.error(e); }
    };

    const handleCancel = async (id) => {
        try { await cancelAppointment(id); await fetchAll(); } catch (e) { console.error(e); }
    };

    const handleNoShow = async (id) => {
        try {
            await markNoShow(id);
            await fetchAll();
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

    const openVaccineModal = (pet) => {
        setVaccineForm({
            ...EMPTY_VACCINE,
            pet: pet.id,
            date_applied: new Date().toISOString().slice(0, 10),
        });
        setError("");
        setShowVaccineModal(true);
    };

    const handleVisitChange = (e) =>
        setVisitForm({ ...visitForm, [e.target.name]: e.target.value });

    const handleVaccineChange = (e) =>
        setVaccineForm({ ...vaccineForm, [e.target.name]: e.target.value });

    const handleVisitSubmit = async (e) => {
        e.preventDefault();
        if (!visitForm.vet_name || !visitForm.vet_lastname || !visitForm.vet_license) {
            setError("Nombre, apellido y matrícula del veterinario son obligatorios.");
            return;
        }
        if (!visitForm.diagnosis) { setError("El diagnóstico es obligatorio."); return; }
        setSaving(true); setError("");
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
            setSuccess("Visita registrada en el historial.");
            setTimeout(() => setSuccess(""), 4000);
            await fetchAll();
        } catch (err) {
            const data = err.response?.data;
            setError(data ? Object.values(data).flat().join(" ") : "Error al guardar.");
        } finally { setSaving(false); }
    };

    const handleVaccineSubmit = async (e) => {
        e.preventDefault();
        if (!vaccineForm.vet_first_name || !vaccineForm.vet_last_name || !vaccineForm.vet_license) {
            setError("Nombre, apellido y matrícula del veterinario son obligatorios.");
            return;
        }
        if (!vaccineForm.name) { setError("El nombre de la vacuna es obligatorio."); return; }
        setSaving(true); setError("");
        try {
            await api.post("/vaccines/", {
                pet: vaccineForm.pet,
                name: vaccineForm.name,
                date_applied: vaccineForm.date_applied,
                next_dose: vaccineForm.next_dose || null,
                batch: vaccineForm.batch,
                notes: vaccineForm.notes,
                vet_first_name: vaccineForm.vet_first_name,
                vet_last_name: vaccineForm.vet_last_name,
                vet_license: vaccineForm.vet_license,
            });
            setShowVaccineModal(false);
            setSuccess("Vacuna registrada en la libreta sanitaria.");
            setTimeout(() => setSuccess(""), 4000);
            await fetchAll();
        } catch (err) {
            const data = err.response?.data;
            setError(data ? Object.values(data).flat().join(" ") : "Error al guardar.");
        } finally { setSaving(false); }
    };

    const filtered = filter === "all" ? appointments : appointments.filter((a) => a.status === filter);
    const pending   = appointments.filter((a) => a.status === "pending").length;
    const confirmed = appointments.filter((a) => a.status === "confirmed").length;
    const completed = appointments.filter((a) => a.status === "completed").length;
    const noShow    = appointments.filter((a) => a.status === "no_show").length;

    const formatDate = (d) => {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("es-AR", {
            weekday: "short", day: "2-digit", month: "short", year: "numeric",
        });
    };
    const formatDateShort = (d) => {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("es-AR", {
            day: "2-digit", month: "short", year: "numeric",
        });
    };
    const formatTime = (d) => {
        if (!d) return "";
        return new Date(d).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    };

    const petVisits   = selectedPet ? visits.filter(v => v.pet === selectedPet.id) : visits;
    const petVaccines = selectedPet ? vaccines.filter(v => v.pet === selectedPet.id) : vaccines;

    return (
        <div className="vet-page">
            <div className="blob b1" /><div className="blob b2" />
            <div className="vet-inner">

                <header className="vet-header">
                    <div>
                        <p className="vet-greeting">🏥 Panel de clínica</p>
                        <h1 className="vet-title">Bienvenido/a, {user?.username}</h1>
                    </div>
                    {success && <div className="success-toast">✅ {success}</div>}
                </header>

                <div className="tabs">
                    {[
                        { id: "turnos",    label: "📅 Turnos" },
                        { id: "pacientes", label: "🐾 Mis pacientes" },
                        { id: "historial", label: "📋 Historial clínico" },
                        { id: "vacunas",   label: "💉 Libreta sanitaria" },
                    ].map((t) => (
                        <button
                            key={t.id}
                            className={`tab-btn ${tab === t.id ? "active" : ""}`}
                            onClick={() => setTab(t.id)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {loading && (
                    <div className="loading-state">
                        <span className="paw-spin">🐾</span>
                        <p>Cargando...</p>
                    </div>
                )}

                {/* ── TAB TURNOS ── */}
                {!loading && tab === "turnos" && (
                    <>
                        <div className="vet-stats">
                            <div className="vet-stat"><span className="stat-icon">⏳</span><div><p className="stat-num">{pending}</p><p className="stat-label">Pendientes</p></div></div>
                            <div className="vet-stat"><span className="stat-icon">✅</span><div><p className="stat-num">{confirmed}</p><p className="stat-label">Confirmados</p></div></div>
                            <div className="vet-stat"><span className="stat-icon">📋</span><div><p className="stat-num">{completed}</p><p className="stat-label">Realizados</p></div></div>
                            <div className="vet-stat"><span className="stat-icon">❌</span><div><p className="stat-num">{noShow}</p><p className="stat-label">Ausentes</p></div></div>
                        </div>

                        <div className="filters">
                            {["pending", "confirmed", "completed", "cancelled", "no_show", "all"].map((f) => (
                                <button
                                    key={f}
                                    className={`filter-btn ${filter === f ? "active" : ""}`}
                                    onClick={() => setFilter(f)}
                                >
                                    {f === "all" ? "Todos" : STATUS_LABEL[f]?.label}
                                </button>
                            ))}
                        </div>

                        {filtered.length === 0 ? (
                            <div className="empty-state">
                                <span>📭</span>
                                <p>No hay turnos {filter !== "all" ? `con estado "${STATUS_LABEL[filter]?.label}"` : ""}.</p>
                            </div>
                        ) : (
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
                                                    <span
                                                        className="appt-status-badge"
                                                        style={{
                                                            color: status.color,
                                                            background: `${status.color}18`,
                                                            borderColor: `${status.color}30`,
                                                        }}
                                                    >
                                                        {status.label}
                                                    </span>
                                                </div>
                                                <div className="appt-meta">
                                                    {appt.pet_name  && <span>🐾 {appt.pet_name}</span>}
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
                                                {appt.status === "no_show"   && <span className="noshow-label">❌ Ausente</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* ── TAB PACIENTES ── */}
                {!loading && tab === "pacientes" && (
                    <div className="patients-section">
                        {pets.length === 0 ? (
                            <div className="empty-state">
                                <span>🐾</span>
                                <p>No hay mascotas vinculadas a tu clínica todavía.</p>
                            </div>
                        ) : (
                            <div className="pets-grid">
                                {pets.map((pet) => (
                                    <div
                                        key={pet.id}
                                        className="pet-card"
                                        onClick={() => { setSelectedPet(pet); setTab("historial"); }}
                                    >
                                        <div className="pet-avatar">
                                            {pet.photo
                                                ? <img src={pet.photo} alt={pet.name} />
                                                : <span>{SPECIES_ICON[pet.species] || "🐾"}</span>
                                            }
                                        </div>
                                        <div className="pet-info">
                                            <h3 className="pet-name">{pet.name}</h3>
                                            <p className="pet-species">{pet.species_display}</p>
                                            {pet.breed && <p className="pet-breed">{pet.breed}</p>}
                                            <p className="pet-owner">👤 {pet.owner_name || "—"}</p>
                                        </div>
                                        <div className="pet-details">
                                            {pet.weight   && <span>⚖️ {pet.weight} kg</span>}
                                            {pet.is_neutered && <span>✂️ Castrado/a</span>}
                                            {pet.allergies && <span>⚠️ Alergias</span>}
                                        </div>
                                        <button className="btn-view-history">Ver historial →</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB HISTORIAL ── */}
                {!loading && tab === "historial" && (
                    <div className="history-section">
                        <div className="pet-selector">
                            <p className="selector-label">Seleccioná una mascota:</p>
                            <div className="pet-chips">
                                <button
                                    className={`pet-chip ${!selectedPet ? "active" : ""}`}
                                    onClick={() => setSelectedPet(null)}
                                >
                                    Todas
                                </button>
                                {pets.map((pet) => (
                                    <button
                                        key={pet.id}
                                        className={`pet-chip ${selectedPet?.id === pet.id ? "active" : ""}`}
                                        onClick={() => setSelectedPet(pet)}
                                    >
                                        {SPECIES_ICON[pet.species]} {pet.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedPet && (
                            <div className="pet-summary">
                                <div className="summary-avatar">{SPECIES_ICON[selectedPet.species] || "🐾"}</div>
                                <div>
                                    <h3>{selectedPet.name}</h3>
                                    <p>{selectedPet.species_display} · {selectedPet.breed || "Sin raza"} · {selectedPet.sex === "male" ? "Macho" : "Hembra"}</p>
                                    <p>👤 Dueño: {selectedPet.owner_name || "—"}</p>
                                    {selectedPet.allergies && <p>⚠️ Alergias: {selectedPet.allergies}</p>}
                                </div>
                            </div>
                        )}

                        {petVisits.length === 0 ? (
                            <div className="empty-state">
                                <span>📋</span>
                                <p>No hay visitas registradas{selectedPet ? ` para ${selectedPet.name}` : ""}.</p>
                            </div>
                        ) : (
                            <div className="visits-list">
                                {petVisits.map((visit) => (
                                    <div key={visit.id} className="visit-card">
                                        <div className="visit-date-box">
                                            <span className="visit-day">{new Date(visit.date).getDate()}</span>
                                            <span className="visit-month">{new Date(visit.date).toLocaleString("es-AR", { month: "short" })}</span>
                                            <span className="visit-year">{new Date(visit.date).getFullYear()}</span>
                                        </div>
                                        <div className="visit-info">
                                            <div className="visit-top">
                                                <h3 className="visit-reason">{visit.reason}</h3>
                                                <span className="visit-vet">
                                                    🩺 Dr/a. {visit.vet_first_name} {visit.vet_last_name} · Mat. {visit.vet_license}
                                                </span>
                                            </div>
                                            {visit.diagnosis    && <p className="visit-field"><span>Diagnóstico:</span> {visit.diagnosis}</p>}
                                            {visit.treatment    && <p className="visit-field"><span>Tratamiento:</span> {visit.treatment}</p>}
                                            {visit.observations && <p className="visit-field"><span>Observaciones:</span> {visit.observations}</p>}
                                            {visit.next_visit   && <p className="visit-next">📅 Próxima visita: {formatDate(visit.next_visit)}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB VACUNAS ── */}
                {!loading && tab === "vacunas" && (
                    <div className="vaccines-section">
                        <div className="pet-selector">
                            <p className="selector-label">Seleccioná una mascota:</p>
                            <div className="pet-chips">
                                <button
                                    className={`pet-chip ${!selectedPet ? "active" : ""}`}
                                    onClick={() => setSelectedPet(null)}
                                >
                                    Todas
                                </button>
                                {pets.map((pet) => (
                                    <button
                                        key={pet.id}
                                        className={`pet-chip ${selectedPet?.id === pet.id ? "active" : ""}`}
                                        onClick={() => setSelectedPet(pet)}
                                    >
                                        {SPECIES_ICON[pet.species]} {pet.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedPet && (
                            <div className="vaccines-header-row">
                                <div className="pet-summary" style={{ flex: 1, marginBottom: 0 }}>
                                    <div className="summary-avatar">{SPECIES_ICON[selectedPet.species] || "🐾"}</div>
                                    <div>
                                        <h3>{selectedPet.name}</h3>
                                        <p>{selectedPet.species_display} · {selectedPet.owner_name || "—"}</p>
                                    </div>
                                </div>
                                <button
                                    className="btn-add-vaccine"
                                    onClick={() => openVaccineModal(selectedPet)}
                                >
                                    + Registrar vacuna
                                </button>
                            </div>
                        )}

                        {petVaccines.length === 0 ? (
                            <div className="empty-state">
                                <span>💉</span>
                                <p>No hay vacunas registradas{selectedPet ? ` para ${selectedPet.name}` : ""}.</p>
                                {selectedPet && (
                                    <button className="btn-sm-vaccine" onClick={() => openVaccineModal(selectedPet)}>
                                        + Registrar primera vacuna
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="vaccine-table-wrap">
                                <table className="vaccine-table">
                                    <thead>
                                        <tr>
                                            <th>Vacuna</th>
                                            {!selectedPet && <th>Mascota</th>}
                                            <th>Fecha</th>
                                            <th>Próx. dosis</th>
                                            <th>Lote</th>
                                            <th>Veterinario</th>
                                            <th>Matrícula</th>
                                            <th>Notas</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {petVaccines.map((v) => {
                                            const petObj = pets.find(p => p.id === v.pet);
                                            const nextDate = v.next_dose ? new Date(v.next_dose) : null;
                                            const isOverdue = nextDate && nextDate < new Date();
                                            return (
                                                <tr key={v.id}>
                                                    <td className="vaccine-name">{v.name}</td>
                                                    {!selectedPet && (
                                                        <td>{petObj ? `${SPECIES_ICON[petObj.species]} ${petObj.name}` : "—"}</td>
                                                    )}
                                                    <td>{formatDateShort(v.date_applied)}</td>
                                                    <td>
                                                        {v.next_dose ? (
                                                            <span className={isOverdue ? "overdue-badge" : "nextdose-badge"}>
                                                                {isOverdue ? "⚠️ " : "📅 "}{formatDateShort(v.next_dose)}
                                                            </span>
                                                        ) : "—"}
                                                    </td>
                                                    <td className="td-muted">{v.batch || "—"}</td>
                                                    <td>Dr/a. {v.vet_first_name} {v.vet_last_name}</td>
                                                    <td className="td-muted">{v.vet_license}</td>
                                                    <td className="td-muted">{v.notes || "—"}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* ── Modal visita ── */}
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
                                    <div className="form-group">
                                        <label>Nombre *</label>
                                        <input name="vet_name" placeholder="Marcos" value={visitForm.vet_name} onChange={handleVisitChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Apellido *</label>
                                        <input name="vet_lastname" placeholder="García" value={visitForm.vet_lastname} onChange={handleVisitChange} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Matrícula *</label>
                                    <input name="vet_license" placeholder="Mat. 12345" value={visitForm.vet_license} onChange={handleVisitChange} />
                                </div>
                            </div>
                            <div className="form-section">
                                <h3 className="section-title">📝 Datos de la consulta</h3>
                                <div className="form-group">
                                    <label>Fecha y hora</label>
                                    <input name="date" type="datetime-local" value={visitForm.date} onChange={handleVisitChange} />
                                </div>
                                <div className="form-group">
                                    <label>Motivo</label>
                                    <input name="reason" value={visitForm.reason} onChange={handleVisitChange} />
                                </div>
                                <div className="form-group">
                                    <label>Diagnóstico *</label>
                                    <textarea name="diagnosis" rows={2} placeholder="Diagnóstico..." value={visitForm.diagnosis} onChange={handleVisitChange} />
                                </div>
                                <div className="form-group">
                                    <label>Tratamiento</label>
                                    <textarea name="treatment" rows={2} placeholder="Medicación, indicaciones..." value={visitForm.treatment} onChange={handleVisitChange} />
                                </div>
                                <div className="form-group">
                                    <label>Observaciones</label>
                                    <textarea name="observations" rows={2} placeholder="Notas extra..." value={visitForm.observations} onChange={handleVisitChange} />
                                </div>
                                <div className="form-group">
                                    <label>Próxima visita</label>
                                    <input name="next_visit" type="date" value={visitForm.next_visit} onChange={handleVisitChange} />
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-ghost" onClick={() => setShowVisitModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? "Guardando..." : "Guardar en historial 📋"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Modal vacuna ── */}
            {showVaccineModal && (
                <div className="modal-overlay" onClick={() => setShowVaccineModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>💉 Registrar vacuna</h2>
                            <button className="modal-close" onClick={() => setShowVaccineModal(false)}>✕</button>
                        </div>
                        {error && <div className="form-error">⚠️ {error}</div>}
                        <form onSubmit={handleVaccineSubmit} className="visit-form">
                            <div className="form-section">
                                <h3 className="section-title">🩺 Datos del veterinario</h3>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Nombre *</label>
                                        <input name="vet_first_name" placeholder="Marcos" value={vaccineForm.vet_first_name} onChange={handleVaccineChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Apellido *</label>
                                        <input name="vet_last_name" placeholder="García" value={vaccineForm.vet_last_name} onChange={handleVaccineChange} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Matrícula *</label>
                                    <input name="vet_license" placeholder="Mat. 12345" value={vaccineForm.vet_license} onChange={handleVaccineChange} />
                                </div>
                            </div>
                            <div className="form-section">
                                <h3 className="section-title">💉 Datos de la vacuna</h3>
                                <div className="form-group">
                                    <label>Nombre de la vacuna *</label>
                                    <input name="name" placeholder="Ej: Antirrábica, Sextuple..." value={vaccineForm.name} onChange={handleVaccineChange} />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Fecha de aplicación</label>
                                        <input name="date_applied" type="date" value={vaccineForm.date_applied} onChange={handleVaccineChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Próxima dosis</label>
                                        <input name="next_dose" type="date" value={vaccineForm.next_dose} onChange={handleVaccineChange} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Lote</label>
                                    <input name="batch" placeholder="Nº de lote" value={vaccineForm.batch} onChange={handleVaccineChange} />
                                </div>
                                <div className="form-group">
                                    <label>Notas</label>
                                    <textarea name="notes" rows={2} placeholder="Observaciones..." value={vaccineForm.notes} onChange={handleVaccineChange} />
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-ghost" onClick={() => setShowVaccineModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? "Guardando..." : "Guardar en libreta 💉"}
                                </button>
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
                .vet-inner { max-width: 960px; margin: 0 auto; padding: 32px 24px; position: relative; z-index: 1; }
                .vet-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
                .vet-greeting { font-size: 0.9rem; color: rgba(255,255,255,0.45); font-weight: 600; margin-bottom: 4px; }
                .vet-title { font-family: 'Fraunces', serif; font-size: 2rem; font-weight: 700; font-style: italic; color: #fff; letter-spacing: -1px; }
                .success-toast { background: rgba(107,255,184,0.12); border: 1px solid rgba(107,255,184,0.3); color: #6bffb8; padding: 10px 16px; border-radius: 10px; font-size: 0.88rem; font-weight: 700; }
                .tabs { display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0; flex-wrap: wrap; }
                .tab-btn { background: transparent; border: none; border-bottom: 2px solid transparent; color: rgba(255,255,255,0.4); font-family: 'Nunito', sans-serif; font-size: 0.92rem; font-weight: 700; padding: 10px 18px; cursor: pointer; transition: all 0.2s; margin-bottom: -1px; }
                .tab-btn:hover { color: rgba(255,255,255,0.7); }
                .tab-btn.active { color: #6bffb8; border-bottom-color: #6bffb8; }
                .loading-state, .empty-state { text-align: center; padding: 60px 20px; display: flex; flex-direction: column; align-items: center; gap: 14px; }
                .paw-spin { font-size: 3rem; animation: spin 1s linear infinite; display: block; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .loading-state p, .empty-state p { color: rgba(255,255,255,0.4); }
                .empty-state span { font-size: 3rem; }
                .vet-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
                .vet-stat { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px; display: flex; align-items: center; gap: 12px; }
                .stat-icon { font-size: 1.8rem; }
                .stat-num { font-size: 1.6rem; font-weight: 900; color: #fff; line-height: 1; }
                .stat-label { font-size: 0.72rem; color: rgba(255,255,255,0.4); font-weight: 600; margin-top: 2px; }
                .filters { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
                .filter-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.10); color: rgba(255,255,255,0.5); border-radius: 10px; padding: 7px 16px; font-family: 'Nunito', sans-serif; font-size: 0.84rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
                .filter-btn.active { background: rgba(107,255,184,0.12); border-color: rgba(107,255,184,0.35); color: #6bffb8; }
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
                .btn-confirm { background: rgba(107,255,184,0.12); border: 1px solid rgba(107,255,184,0.3); color: #6bffb8; border-radius: 8px; padding: 7px 14px; font-family: 'Nunito', sans-serif; font-size: 0.82rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
                .btn-visit { background: rgba(107,202,255,0.12); border: 1px solid rgba(107,202,255,0.3); color: #6bcaff; border-radius: 8px; padding: 7px 14px; font-family: 'Nunito', sans-serif; font-size: 0.82rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
                .btn-noshow { background: rgba(255,149,0,0.12); border: 1px solid rgba(255,149,0,0.3); color: #ff9500; border-radius: 8px; padding: 7px 14px; font-family: 'Nunito', sans-serif; font-size: 0.82rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
                .btn-cancel-sm { background: rgba(255,107,107,0.08); border: 1px solid rgba(255,107,107,0.2); color: rgba(255,107,107,0.7); border-radius: 8px; padding: 6px 14px; font-family: 'Nunito', sans-serif; font-size: 0.78rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
                .done-label { font-size: 0.78rem; color: #6bffb8; font-weight: 700; }
                .cancelled-label { font-size: 0.78rem; color: rgba(255,107,107,0.6); font-weight: 700; }
                .noshow-label { font-size: 0.78rem; color: #ff9500; font-weight: 700; }
                .pets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
                .pet-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 10px; cursor: pointer; transition: all 0.2s; }
                .pet-card:hover { border-color: rgba(107,255,184,0.3); transform: translateY(-2px); }
                .pet-avatar { width: 56px; height: 56px; border-radius: 50%; background: rgba(107,255,184,0.1); display: flex; align-items: center; justify-content: center; font-size: 2rem; overflow: hidden; }
                .pet-avatar img { width: 100%; height: 100%; object-fit: cover; }
                .pet-name { font-size: 1.1rem; font-weight: 900; color: #fff; }
                .pet-species { font-size: 0.8rem; color: #6bffb8; font-weight: 700; }
                .pet-breed { font-size: 0.78rem; color: rgba(255,255,255,0.4); }
                .pet-owner { font-size: 0.78rem; color: rgba(255,255,255,0.4); }
                .pet-details { display: flex; gap: 8px; flex-wrap: wrap; }
                .pet-details span { font-size: 0.75rem; color: rgba(255,255,255,0.45); background: rgba(255,255,255,0.05); border-radius: 6px; padding: 3px 8px; }
                .btn-view-history { background: rgba(107,202,255,0.1); border: 1px solid rgba(107,202,255,0.25); color: #6bcaff; border-radius: 8px; padding: 8px 14px; font-family: 'Nunito', sans-serif; font-size: 0.82rem; font-weight: 700; cursor: pointer; align-self: flex-start; }
                .pet-selector { margin-bottom: 20px; }
                .selector-label { font-size: 0.8rem; color: rgba(255,255,255,0.45); font-weight: 700; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.06em; }
                .pet-chips { display: flex; gap: 8px; flex-wrap: wrap; }
                .pet-chip { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.10); color: rgba(255,255,255,0.5); border-radius: 20px; padding: 6px 14px; font-family: 'Nunito', sans-serif; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
                .pet-chip.active { background: rgba(107,255,184,0.12); border-color: rgba(107,255,184,0.35); color: #6bffb8; }
                .pet-summary { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px 20px; display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
                .summary-avatar { font-size: 2.5rem; }
                .pet-summary h3 { font-size: 1.1rem; font-weight: 900; color: #fff; margin-bottom: 4px; }
                .pet-summary p { font-size: 0.8rem; color: rgba(255,255,255,0.45); margin-top: 2px; }
                .visits-list { display: flex; flex-direction: column; gap: 14px; }
                .visit-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 18px 20px; display: flex; gap: 18px; }
                .visit-date-box { display: flex; flex-direction: column; align-items: center; background: rgba(107,202,255,0.10); border-radius: 10px; padding: 8px 12px; min-width: 52px; flex-shrink: 0; }
                .visit-day { font-size: 1.4rem; font-weight: 900; color: #6bcaff; line-height: 1; }
                .visit-month { font-size: 0.6rem; color: rgba(107,202,255,0.7); text-transform: uppercase; font-weight: 700; }
                .visit-year { font-size: 0.6rem; color: rgba(255,255,255,0.3); margin-top: 2px; }
                .visit-info { flex: 1; display: flex; flex-direction: column; gap: 6px; }
                .visit-top { display: flex; flex-direction: column; gap: 4px; margin-bottom: 6px; }
                .visit-reason { font-size: 1rem; font-weight: 900; color: #fff; }
                .visit-vet { font-size: 0.78rem; color: #6bcaff; font-weight: 700; }
                .visit-field { font-size: 0.85rem; color: rgba(255,255,255,0.6); line-height: 1.5; }
                .visit-field span { font-weight: 700; color: rgba(255,255,255,0.8); }
                .visit-next { font-size: 0.8rem; color: #ffd93d; font-weight: 700; margin-top: 4px; }
                /* Vacunas */
                .vaccines-section { display: flex; flex-direction: column; gap: 20px; }
                .vaccines-header-row { display: flex; align-items: center; gap: 16px; margin-bottom: 4px; }
                .btn-add-vaccine { background: rgba(107,255,184,0.12); border: 1px solid rgba(107,255,184,0.3); color: #6bffb8; border-radius: 10px; padding: 10px 18px; font-family: 'Nunito', sans-serif; font-size: 0.88rem; font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
                .btn-sm-vaccine { background: rgba(107,255,184,0.1); border: 1px solid rgba(107,255,184,0.25); color: #6bffb8; border-radius: 8px; padding: 8px 16px; font-family: 'Nunito', sans-serif; font-size: 0.84rem; font-weight: 700; cursor: pointer; }
                .vaccine-table-wrap { overflow-x: auto; border-radius: 14px; border: 1px solid rgba(255,255,255,0.08); }
                .vaccine-table { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
                .vaccine-table thead tr { background: rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.08); }
                .vaccine-table th { padding: 12px 16px; text-align: left; font-size: 0.72rem; font-weight: 900; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap; }
                .vaccine-table td { padding: 12px 16px; color: rgba(255,255,255,0.75); border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: middle; }
                .vaccine-table tbody tr:last-child td { border-bottom: none; }
                .vaccine-table tbody tr:hover td { background: rgba(255,255,255,0.02); }
                .vaccine-name { font-weight: 900; color: #fff; }
                .td-muted { color: rgba(255,255,255,0.4) !important; font-size: 0.8rem; }
                .nextdose-badge { background: rgba(107,255,184,0.1); color: #6bffb8; border-radius: 6px; padding: 2px 8px; font-size: 0.78rem; font-weight: 700; white-space: nowrap; }
                .overdue-badge { background: rgba(255,149,0,0.12); color: #ff9500; border-radius: 6px; padding: 2px 8px; font-size: 0.78rem; font-weight: 700; white-space: nowrap; }
                /* Modales */
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(6px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .modal { background: #1e1e35; border: 1px solid rgba(255,255,255,0.10); border-radius: 24px; padding: 32px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; animation: modalIn 0.3s cubic-bezier(.22,.68,0,1.2) both; }
                @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .modal-header h2 { font-family: 'Fraunces', serif; font-size: 1.4rem; font-style: italic; color: #fff; }
                .modal-close { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); border-radius: 8px; padding: 6px 10px; cursor: pointer; }
                .form-error { background: rgba(255,107,107,0.15); border: 1px solid rgba(255,107,107,0.4); color: #ff9999; padding: 10px 14px; border-radius: 10px; font-size: 0.86rem; margin-bottom: 16px; }
                .visit-form { display: flex; flex-direction: column; gap: 20px; }
                .form-section { display: flex; flex-direction: column; gap: 12px; }
                .section-title { font-size: 0.85rem; font-weight: 900; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.06em; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.06); }
                .form-row { display: flex; gap: 12px; }
                .form-group { display: flex; flex-direction: column; gap: 6px; flex: 1; }
                .form-group label { font-size: 0.76rem; font-weight: 700; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.06em; }
                .form-group input, .form-group textarea { background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.10); border-radius: 10px; color: #fff; padding: 10px 14px; font-family: 'Nunito', sans-serif; font-size: 0.9rem; outline: none; transition: border-color 0.2s; }
                .form-group input:focus, .form-group textarea:focus { border-color: #6bffb8; box-shadow: 0 0 0 3px rgba(107,255,184,0.10); }
                .form-group textarea { resize: vertical; }
                .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }
                .btn-ghost { background: transparent; border: 1.5px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.5); border-radius: 10px; padding: 11px 20px; font-family: 'Nunito', sans-serif; font-weight: 700; cursor: pointer; }
                .btn-primary { background: linear-gradient(135deg, #6bffb8, #3de09a); color: #1a1a2e; border: none; border-radius: 10px; padding: 11px 22px; font-family: 'Nunito', sans-serif; font-size: 0.95rem; font-weight: 900; cursor: pointer; }
                .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
                @media (max-width: 700px) { .vet-stats { grid-template-columns: repeat(2, 1fr); } .appt-card { flex-direction: column; align-items: flex-start; } .form-row { flex-direction: column; } .vet-inner { padding: 20px 16px; } .pets-grid { grid-template-columns: 1fr; } .vaccines-header-row { flex-direction: column; align-items: flex-start; } }
            `}</style>
        </div>
    );
}