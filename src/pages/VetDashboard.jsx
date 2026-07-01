// VetDashboard.jsx
import { useState, useEffect, useRef } from "react";
import { getAppointments, confirmAppointment, cancelAppointment, createVisit, markNoShow } from "../services/api";
import api from "../services/api";
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
    next_visit: "", vet_name: "", vet_lastname: "", vet_license: "", vet_clinic_name: "",
};

const EMPTY_VACCINE = {
    pet: "", name: "", date_applied: "", next_dose: "",
    batch: "", notes: "", vet_first_name: "", vet_last_name: "", vet_license: "", vet_clinic_name: "",
};

const SPECIES_ICON = {
    dog: "🐶", cat: "🐱", rabbit: "🐰", bird: "🦜",
    hamster: "🐹", reptile: "🦎", fish: "🐠", other: "🐾",
};

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function ClinicDashboard() {
    const { user } = useAuth();
    const [tab, setTab] = useState("turnos");
    const [showAllVisits, setShowAllVisits] = useState(false);
    const [appointments, setAppointments] = useState([]);
    const [pets, setPets] = useState([]);
    const [visits, setVisits] = useState([]);
    const [vaccines, setVaccines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("pending");
    const [agendaDate, setAgendaDate] = useState(new Date());
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 700);

    const [showVisitModal, setShowVisitModal] = useState(false);
    const [visitForm, setVisitForm] = useState(EMPTY_VISIT);
    const [showVaccineModal, setShowVaccineModal] = useState(false);
    const [vaccineForm, setVaccineForm] = useState(EMPTY_VACCINE);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [clinicalPhotos, setClinicalPhotos] = useState([]);
    const [clinicalPhotoUploading, setClinicalPhotoUploading] = useState(false);
    const [clinicalPhotoError, setClinicalPhotoError] = useState("");
    const [clinicalPhotoCaption, setClinicalPhotoCaption] = useState("");
    const clinicalFileInputRef = useRef(null);
    const [selectedPet, setSelectedPet] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPetFicha, setSelectedPetFicha] = useState(null);
    const [highlightedAppt, setHighlightedAppt] = useState(null);

    // ── Fotos state ──
    const [photos, setPhotos] = useState([]);
    const [photosLoading, setPhotosLoading] = useState(false);
    const [photoUploading, setPhotoUploading] = useState(false);
    const [photoError, setPhotoError] = useState("");
    const [photoCaption, setPhotoCaption] = useState("");
    const fileInputRef = useRef(null);

    // ── Agenda state ──
    const [schedule, setSchedule] = useState(null);
    const [scheduleLoading, setScheduleLoading] = useState(false);
    const [scheduleSaving, setScheduleSaving] = useState(false);
    const [scheduleError, setScheduleError] = useState("");
    const [scheduleSuccess, setScheduleSuccess] = useState("");
    const [externalForm, setExternalForm] = useState({ requested_date: "", appointment_type: "control", external_label: "" });
    const [externalSaving, setExternalSaving] = useState(false);

    useEffect(() => {
        fetchAll();
        const onResize = () => setIsMobile(window.innerWidth <= 700);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        if (tab === "fotos") fetchPhotos();
        if (tab === "mi-agenda") fetchSchedule();
    }, [tab]);

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

    const fetchClinicalPhotos = async (petId) => {
        try {
            const res = await api.get(`/clinical-photos/list/?pet=${petId}`);
            setClinicalPhotos(res.data);
        } catch (e) { console.error(e); }
    };

    const handleClinicalPhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { setClinicalPhotoError("La foto no puede superar los 5MB."); return; }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setClinicalPhotoError("Solo JPG, PNG o WebP."); return; }
        setClinicalPhotoError(""); setClinicalPhotoUploading(true);
        const formData = new FormData();
        formData.append("image", file);
        formData.append("pet", selectedPetFicha.id);
        if (clinicalPhotoCaption) formData.append("caption", clinicalPhotoCaption);
        try {
            await api.post("/clinical-photos/upload/", formData, { headers: { "Content-Type": "multipart/form-data" } });
            setClinicalPhotoCaption("");
            if (clinicalFileInputRef.current) clinicalFileInputRef.current.value = "";
            await fetchClinicalPhotos(selectedPetFicha.id);
            setSuccess("Foto clínica subida."); setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setClinicalPhotoError(err.response?.data?.error || "Error al subir la foto.");
        } finally { setClinicalPhotoUploading(false); }
    };

    const handleClinicalPhotoDelete = async (id) => {
        if (!confirm("¿Eliminás esta foto clínica?")) return;
        try {
            await api.delete(`/clinical-photos/${id}/delete/`);
            await fetchClinicalPhotos(selectedPetFicha.id);
            setSuccess("Foto eliminada."); setTimeout(() => setSuccess(""), 3000);
        } catch (e) { console.error(e); }
    };

    const fetchPhotos = async () => {
        setPhotosLoading(true);
        try {
            const res = await api.get("/clinic-photos/list/");
            setPhotos(res.data);
        } catch (e) { console.error(e); }
        finally { setPhotosLoading(false); }
    };

    const fetchSchedule = async () => {
        setScheduleLoading(true);
        try {
            const res = await api.get("/clinic-schedule/me/");
            const data = res.data;
            // Si day_hours está vacío, inicializarlo con defaults para cada día activo
            if (!data.day_hours || Object.keys(data.day_hours).length === 0) {
                const defaultHours = {};
                (data.working_days || []).forEach(day => {
                    defaultHours[String(day)] = { open: "09:00", close: "18:00" };
                });
                data.day_hours = defaultHours;
            }
            setSchedule(data);
        } catch {
            setSchedule({
                working_days: [], day_hours: {},
                duration_control: 30, duration_vaccine: 20,
                duration_surgery: 90, duration_other: 30,
                interval_minutes: 10, cancel_limit_hours: 4,
            });
        } finally { setScheduleLoading(false); }
    };

    const saveSchedule = async () => {
        setScheduleSaving(true); setScheduleError("");
        try {
            // Convertir claves de day_hours a strings
            const scheduleToSend = {
                ...schedule,
                day_hours: Object.fromEntries(
                    Object.entries(schedule.day_hours || {}).map(([k, v]) => [String(k), v])
                )
            };
            await api.post("/clinic-schedule/configurar/", scheduleToSend);
            setScheduleSuccess("Agenda guardada correctamente.");
            setTimeout(() => setScheduleSuccess(""), 3000);
            await fetchSchedule();
        } catch (err) {
            setScheduleError(err.response?.data ? Object.values(err.response.data).flat().join(" ") : "Error al guardar.");
        } finally { setScheduleSaving(false); }
    };

    const handleExternalSubmit = async (e) => {
        e.preventDefault();
        if (!externalForm.requested_date || !externalForm.external_label) {
            setScheduleError("Fecha y descripción son obligatorias."); return;
        }
        setExternalSaving(true); setScheduleError("");
        try {
            await api.post("/clinic-schedule/turno-externo/", externalForm);
            setScheduleSuccess("Turno externo agregado.");
            setTimeout(() => setScheduleSuccess(""), 3000);
            setExternalForm({ requested_date: "", appointment_type: "control", external_label: "" });
            await fetchAll();
        } catch (err) {
            setScheduleError(err.response?.data?.error || "Error al guardar.");
        } finally { setExternalSaving(false); }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 3 * 1024 * 1024) { setPhotoError("La foto no puede superar los 3MB."); return; }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setPhotoError("Solo se permiten imágenes JPG, PNG o WebP."); return; }
        setPhotoError(""); setPhotoUploading(true);
        const formData = new FormData();
        formData.append("image", file);
        if (photoCaption) formData.append("caption", photoCaption);
        try {
            await api.post("/clinic-photos/upload/", formData, { headers: { "Content-Type": "multipart/form-data" } });
            setPhotoCaption("");
            if (fileInputRef.current) fileInputRef.current.value = "";
            await fetchPhotos();
            setSuccess("Foto subida exitosamente.");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setPhotoError(err.response?.data?.image?.[0] || err.response?.data?.error || "Error al subir la foto.");
        } finally { setPhotoUploading(false); }
    };

    const handlePhotoDelete = async (id) => {
        if (!confirm("¿Eliminás esta foto?")) return;
        try {
            await api.delete(`/clinic-photos/${id}/delete/`);
            await fetchPhotos();
            setSuccess("Foto eliminada."); setTimeout(() => setSuccess(""), 3000);
        } catch (e) { console.error(e); }
    };

    const handleConfirm = async (id) => {
        try { await confirmAppointment(id); await fetchAll(); setSuccess("Turno confirmado."); setTimeout(() => setSuccess(""), 3000); }
        catch (e) { console.error(e); }
    };
    const handleCancel = async (id) => {
        try { await cancelAppointment(id); await fetchAll(); } catch (e) { console.error(e); }
    };
    const handleNoShow = async (id) => {
        try { await markNoShow(id); await fetchAll(); setSuccess("Turno marcado como ausente."); setTimeout(() => setSuccess(""), 3000); }
        catch (e) { console.error(e); }
    };
    const handleDownloadPDF = async (petId, petName) => {
        try {
            const response = await api.get(`/pets/${petId}/pdf/`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url; link.setAttribute('download', `historial_${petName}.pdf`);
            document.body.appendChild(link); link.click(); link.remove();
            window.URL.revokeObjectURL(url);
        } catch (e) { console.error(e); setError('Error al generar el PDF.'); }
    };

    const openVisitModal = (appt) => {
        setVisitForm({ ...EMPTY_VISIT, pet: appt.pet || "", clinic: appt.clinic || "", date: new Date().toISOString().slice(0, 16), reason: appt.reason || "" });
        setError(""); setShowVisitModal(true);
    };
    const openVaccineModal = (pet) => {
        setVaccineForm({ ...EMPTY_VACCINE, pet: pet.id, date_applied: new Date().toISOString().slice(0, 10) });
        setError(""); setShowVaccineModal(true);
    };

    const handleVisitChange = (e) => setVisitForm({ ...visitForm, [e.target.name]: e.target.value });
    const handleVaccineChange = (e) => setVaccineForm({ ...vaccineForm, [e.target.name]: e.target.value });

    const handleVisitSubmit = async (e) => {
        e.preventDefault();
        if (!visitForm.vet_name || !visitForm.vet_lastname || !visitForm.vet_license) { setError("Nombre, apellido y matrícula son obligatorios."); return; }
        if (!visitForm.diagnosis) { setError("El diagnóstico es obligatorio."); return; }
        setSaving(true); setError("");
        try {
            await createVisit({ pet: visitForm.pet, clinic: visitForm.clinic, date: visitForm.date, reason: visitForm.reason, diagnosis: visitForm.diagnosis, treatment: visitForm.treatment, observations: visitForm.observations, next_visit: visitForm.next_visit || null, vet_first_name: visitForm.vet_name, vet_last_name: visitForm.vet_lastname, vet_license: visitForm.vet_license, vet_clinic_name: visitForm.vet_clinic_name });
            setShowVisitModal(false); setSuccess("Atención registrada."); setTimeout(() => setSuccess(""), 4000);
            await fetchAll(); setShowVisitModal(false);
        } catch (err) { const data = err.response?.data; setError(data ? Object.values(data).flat().join(" ") : "Error al guardar."); }
        finally { setSaving(false); }
    };

    const handleVaccineSubmit = async (e) => {
        e.preventDefault();
        if (!vaccineForm.vet_first_name || !vaccineForm.vet_last_name || !vaccineForm.vet_license) { setError("Nombre, apellido y matrícula son obligatorios."); return; }
        if (!vaccineForm.name) { setError("El nombre de la vacuna es obligatorio."); return; }
        setSaving(true); setError("");
        try {
            await api.post("/vaccines/", { pet: vaccineForm.pet, name: vaccineForm.name, date_applied: vaccineForm.date_applied, next_dose: vaccineForm.next_dose || null, batch: vaccineForm.batch, notes: vaccineForm.notes, vet_first_name: vaccineForm.vet_first_name, vet_last_name: vaccineForm.vet_last_name, vet_license: vaccineForm.vet_license, vet_clinic_name: vaccineForm.vet_clinic_name });
            setShowVaccineModal(false); setSuccess("Vacuna registrada."); setTimeout(() => setSuccess(""), 4000);
            await fetchAll();
        } catch (err) { const data = err.response?.data; setError(data ? Object.values(data).flat().join(" ") : "Error al guardar."); }
        finally { setSaving(false); }
    };

    const filtered = filter === "all" ? appointments : appointments.filter(a => a.status === filter);
    const pending = appointments.filter(a => a.status === "pending").length;
    const confirmed = appointments.filter(a => a.status === "confirmed").length;
    const completed = appointments.filter(a => a.status === "completed").length;
    const noShow = appointments.filter(a => a.status === "no_show").length;

    const formatDate = (d) => { if (!d) return "—"; return new Date(d).toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }); };
    const formatDateShort = (d) => { if (!d) return "—"; return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }); };
    const formatTime = (d) => { if (!d) return ""; return new Date(d).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }); };

    const agendaTurnos = appointments
        .filter(a => { const d = new Date(a.requested_date); return d.getFullYear() === agendaDate.getFullYear() && d.getMonth() === agendaDate.getMonth() && d.getDate() === agendaDate.getDate(); })
        .filter(a => a.status !== 'cancelled')
        .sort((a, b) => new Date(a.requested_date) - new Date(b.requested_date));

    const agendaLabel = agendaDate.toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "long" });
    const isToday = new Date().toDateString() === agendaDate.toDateString();
    const petVisits = selectedPet ? visits.filter(v => v.pet === selectedPet.id) : visits;
    const petVaccines = selectedPet ? vaccines.filter(v => v.pet === selectedPet.id) : vaccines;

    const TABS_DESKTOP = [
        { id: "turnos", icon: "📅", label: "Turnos" },
        { id: "pacientes", icon: "🐾", label: "Pacientes" },
        { id: "fotos", icon: "📷", label: "Fotos" },
        { id: "mi-agenda", icon: "🗓", label: "Mi Agenda" },
    ];
    const TABS_MOBILE = [
        { id: "turnos", icon: "📅", label: "Turnos" },
        { id: "agenda", icon: "🗓", label: "Agenda" },
        { id: "pacientes", icon: "🐾", label: "Pacientes" },
        { id: "fotos", icon: "📷", label: "Fotos" },
        { id: "mi-agenda", icon: "⚙️", label: "Mi Agenda" },
    ];
    const TABS = isMobile ? TABS_MOBILE : TABS_DESKTOP;

    const AgendaContent = ({ compact = false }) => (
        <div className={compact ? "" : "agenda-panel agenda-desktop"}>
            <div className="agenda-header">
                <button className="agenda-nav" onClick={() => { const d = new Date(agendaDate); d.setDate(d.getDate() - 1); setAgendaDate(d); }}>‹</button>
                <div className="agenda-title-wrap">
                    <span className="agenda-day-label">{isToday ? "Hoy" : agendaLabel}</span>
                    {!isToday && <button className="agenda-today-btn" onClick={() => setAgendaDate(new Date())}>Hoy</button>}
                </div>
                <button className="agenda-nav" onClick={() => { const d = new Date(agendaDate); d.setDate(d.getDate() + 1); setAgendaDate(d); }}>›</button>
            </div>
            <div className="agenda-date-full">{agendaLabel}</div>
            <button className="btn-agenda-pdf" onClick={async () => {
                try {
                    const dateStr = agendaDate.toISOString().slice(0, 10);
                    const response = await api.get(`/appointments/agenda_pdf/?date=${dateStr}`, { responseType: 'blob' });
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a'); link.href = url;
                    link.setAttribute('download', `agenda_${dateStr}.pdf`);
                    document.body.appendChild(link); link.click(); link.remove();
                    window.URL.revokeObjectURL(url);
                } catch (e) { console.error(e); }
            }}>📄 Descargar agenda</button>
            {agendaTurnos.length === 0 ? (
                <div className="agenda-empty-v2">
                    <div className="agenda-empty-icon">📅</div>
                    <p>Sin turnos este día</p>
                </div>
            ) : (
                <div className="agenda-list">
                    {agendaTurnos.map(appt => {
                        const status = STATUS_LABEL[appt.status] || STATUS_LABEL.pending;
                        return (
                            <div key={appt.id} className="agenda-item" style={{ borderLeftColor: status.color, cursor: 'pointer' }}
                                onClick={() => {
                                    setHighlightedAppt(appt.id); setFilter("all"); setTab("turnos");
                                    setTimeout(() => { const el = document.getElementById(`appt-${appt.id}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 150);
                                }}>
                                <div className="agenda-item-time">{formatTime(appt.requested_date)}</div>
                                <div className="agenda-item-info">
                                    <div className="agenda-item-pet">{appt.is_external ? `📞 ${appt.external_label}` : (appt.pet_name || "—")}</div>
                                    <div className="agenda-item-owner">{appt.is_external ? "Turno externo" : (appt.owner_name || "—")}</div>
                                    <div className="agenda-item-reason">{appt.reason || "Consulta"}</div>
                                </div>
                                <span className="agenda-item-badge" style={{ color: status.color, background: `${status.color}18` }}>{status.label}</span>
                            </div>
                        );
                    })}
                </div>
            )}
            <div className="agenda-count">{agendaTurnos.length} turno{agendaTurnos.length !== 1 ? "s" : ""} este día</div>
        </div>
    );

    return (
        <div className="vet-page">
            <StarsBackground />
            <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
            <div className="vet-inner">

                <header className="vet-header">
                    <div className="vet-header-left">
                        <p className="vet-eyebrow"><span>🏥</span> Panel de clínica</p>
                        <h1 className="vet-title">¡Bienvenido, <span className="vet-name">{user?.username}</span> <span className="vet-wave">👋</span></h1>
                        <p className="vet-subtitle">Gestioná tus turnos, pacientes y agenda desde aquí.</p>
                    </div>
                    <div className="vet-header-right">
                        {success && <div className="success-toast">✅ {success}</div>}
                        <a href="/clinic/estadisticas" className="vet-stats-link">
                            <span className="vet-stats-icon">📊</span>
                            <div className="vet-stats-text">
                                <span className="vet-stats-title">Estadísticas</span>
                                <span className="vet-stats-sub">Ver reportes y métricas</span>
                            </div>
                        </a>
                    </div>
                </header>

                <div className="tabs">
                    {TABS.map(t => (
                        <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
                            <span className="tab-icon">{t.icon}</span>
                            <span>{t.label}</span>
                        </button>
                    ))}
                </div>

                {loading && <div className="loading-state"><span className="paw-spin">🐾</span><p>Cargando...</p></div>}

                {/* ══ TAB TURNOS ══ */}
                {!loading && tab === "turnos" && (
                    <>
                        <div className="vet-stats">
                            <div className="vet-stat stat-pending">
                                <div className="stat-icon-wrap"><span className="stat-icon">📅</span></div>
                                <div className="stat-content">
                                    <p className="stat-num">{pending}</p>
                                    <p className="stat-label">Pendientes</p>
                                </div>
                                <div className="stat-deco" aria-hidden="true">📅</div>
                            </div>
                            <div className="vet-stat stat-confirmed">
                                <div className="stat-icon-wrap"><span className="stat-icon">✅</span></div>
                                <div className="stat-content">
                                    <p className="stat-num">{confirmed}</p>
                                    <p className="stat-label">Confirmados</p>
                                </div>
                                <div className="stat-deco" aria-hidden="true">✅</div>
                            </div>
                            <div className="vet-stat stat-completed">
                                <div className="stat-icon-wrap"><span className="stat-icon">📋</span></div>
                                <div className="stat-content">
                                    <p className="stat-num">{completed}</p>
                                    <p className="stat-label">Realizados</p>
                                </div>
                                <div className="stat-deco" aria-hidden="true">📋</div>
                            </div>
                            <div className="vet-stat stat-noshow">
                                <div className="stat-icon-wrap"><span className="stat-icon">❌</span></div>
                                <div className="stat-content">
                                    <p className="stat-num">{noShow}</p>
                                    <p className="stat-label">Ausentes</p>
                                </div>
                                <div className="stat-deco" aria-hidden="true">👤</div>
                            </div>
                        </div>
                        <div className="filters">
                            {["pending", "confirmed", "completed", "cancelled", "no_show", "all"].map(f => (
                                <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                                    {f === "all" ? "Todos" : STATUS_LABEL[f]?.label}
                                </button>
                            ))}
                        </div>
                        <div className="turnos-layout">
                            <div className="turnos-main">
                                {filtered.length === 0 ? (
                                    <div className="empty-state empty-turnos-v2">
                                        <div className="empty-icon-big">📅</div>
                                        <h3 className="empty-title">Sin turnos pendientes</h3>
                                        <p>{filter !== "all" ? `No hay turnos con estado "${STATUS_LABEL[filter]?.label}".` : "Todavía no hay turnos registrados."}</p>
                                    </div>
                                ) : (
                                    <div className="appts-list">
                                        {filtered.map(appt => {
                                            const status = STATUS_LABEL[appt.status] || STATUS_LABEL.pending;
                                            return (
                                                <div key={appt.id} className={`appt-card ${highlightedAppt === appt.id ? "appt-highlighted" : ""}`} id={`appt-${appt.id}`}>
                                                    <div className="appt-date-box">
                                                        <span className="appt-day">{new Date(appt.requested_date).getDate()}</span>
                                                        <span className="appt-month">{new Date(appt.requested_date).toLocaleString("es-AR", { month: "short" })}</span>
                                                        <span className="appt-time">{formatTime(appt.requested_date)}</span>
                                                    </div>
                                                    <div className="appt-info">
                                                        <div className="appt-top">
                                                            <h3 className="appt-reason">
                                                                {appt.is_external ? `📞 ${appt.external_label}` : (appt.reason || "Consulta")}
                                                            </h3>
                                                            <span className="appt-status-badge" style={{ color: status.color, background: `${status.color}18`, borderColor: `${status.color}30` }}>{status.label}</span>
                                                            {appt.appointment_type_display && !appt.is_external && (
                                                                <span className="appt-type-badge">{appt.appointment_type_display}</span>
                                                            )}
                                                            {appt.is_external && <span className="appt-external-badge">Externo</span>}
                                                        </div>
                                                        <div className="appt-meta">
                                                            {!appt.is_external && appt.pet_name && <span>🐾 {appt.pet_name}</span>}
                                                            {!appt.is_external && appt.owner_name && <span>👤 {appt.owner_name}</span>}
                                                            <span>📆 {formatDate(appt.requested_date)}</span>
                                                        </div>
                                                        <div className="appt-actions">
                                                            {appt.status === "pending" && (<><button className="btn-confirm" onClick={() => handleConfirm(appt.id)}>✅ Confirmar</button><button className="btn-cancel-sm" onClick={() => handleCancel(appt.id)}>✕ Cancelar</button></>)}
                                                            {appt.status === "confirmed" && !appt.is_external && (<><button className="btn-visit" onClick={() => openVisitModal(appt)}>📋 Cargar visita</button><button className="btn-noshow" onClick={() => handleNoShow(appt.id)}>❌ Ausente</button><button className="btn-cancel-sm" onClick={() => handleCancel(appt.id)}>✕ Cancelar</button></>)}
                                                            {appt.status === "confirmed" && appt.is_external && (<><button className="btn-cancel-sm" onClick={() => handleCancel(appt.id)}>✕ Cancelar</button></>)}
                                                            {appt.status === "completed" && <span className="done-label">✅ Visita registrada</span>}
                                                            {appt.status === "cancelled" && <span className="cancelled-label">✕ Cancelado</span>}
                                                            {appt.status === "no_show" && <span className="noshow-label">❌ Ausente</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            {!isMobile && <AgendaContent />}
                        </div>
                    </>
                )}

                {/* ══ TAB AGENDA (solo mobile) ══ */}
                {!loading && tab === "agenda" && (
                    <div className="agenda-mobile-tab"><AgendaContent compact /></div>
                )}

                {/* ══ TAB PACIENTES ══ */}
                {!loading && tab === "pacientes" && (
                    <div className="patients-section">
                        {/* Stats cards de pacientes */}
                        {(() => {
                            const totalPets = pets.length;
                            const activePets = pets.filter(p => (p.vaccines?.length || 0) > 0).length;
                            const now = new Date();
                            const in60Days = new Date();
                            in60Days.setDate(in60Days.getDate() + 60);
                            let reminders = 0;
                            pets.forEach(pet => {
                                (pet.vaccines || []).forEach(v => {
                                    if (v.next_dose) {
                                        const nd = new Date(v.next_dose);
                                        if (nd >= now && nd <= in60Days) reminders++;
                                    }
                                });
                            });
                            return (
                                <div className="patients-stats">
                                    <div className="pstat pstat-total">
                                        <div className="pstat-icon-wrap"><span className="pstat-icon">🐾</span></div>
                                        <div className="pstat-content">
                                            <p className="pstat-num">{totalPets}</p>
                                            <p className="pstat-label">Pacientes totales</p>
                                            <p className="pstat-sub">Todos tus pacientes registrados</p>
                                        </div>
                                        <div className="pstat-deco" aria-hidden="true">🐾</div>
                                    </div>
                                    <div className="pstat pstat-active">
                                        <div className="pstat-icon-wrap"><span className="pstat-icon">✅</span></div>
                                        <div className="pstat-content">
                                            <p className="pstat-num">{activePets}</p>
                                            <p className="pstat-label">Activos</p>
                                            <p className="pstat-sub">Con vacunas registradas</p>
                                        </div>
                                        <div className="pstat-deco" aria-hidden="true">✅</div>
                                    </div>
                                    <div className="pstat pstat-reminders">
                                        <div className="pstat-icon-wrap"><span className="pstat-icon">💉</span></div>
                                        <div className="pstat-content">
                                            <p className="pstat-num">{reminders}</p>
                                            <p className="pstat-label">Recordatorios</p>
                                            <p className="pstat-sub">Vacunas por vencer (60 días)</p>
                                        </div>
                                        <div className="pstat-deco" aria-hidden="true">💉</div>
                                    </div>
                                    <div className="pstat pstat-rating">
                                        <div className="pstat-icon-wrap"><span className="pstat-icon">❤️</span></div>
                                        <div className="pstat-content">
                                            <p className="pstat-num">{totalPets > 0 ? totalPets : '—'}</p>
                                            <p className="pstat-label">Vinculados</p>
                                            <p className="pstat-sub">Mascotas de tu clínica</p>
                                        </div>
                                        <div className="pstat-deco" aria-hidden="true">❤️</div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Buscador + dropdown */}
                        <div className="patients-filters">
                            <div className="patients-search-wrap">
                                <span className="patients-search-icon">🔍</span>
                                <input
                                    className="patients-search"
                                    type="text"
                                    placeholder="Buscar por nombre de mascota o dueño..."
                                    value={searchQuery}
                                    onChange={e => { setSearchQuery(e.target.value); setSelectedPetFicha(null); }}
                                />
                                {searchQuery && (
                                    <button className="patients-search-clear" onClick={() => setSearchQuery('')}>✕</button>
                                )}
                            </div>
                            <div className="patients-filter-drop">
                                <span className="filter-drop-icon">🎯</span>
                                <span className="filter-drop-label">Todos los pacientes</span>
                                <span className="filter-drop-caret">▾</span>
                            </div>
                        </div>

                        {/* Si hay una mascota seleccionada, mostrar su ficha completa */}
                        {selectedPetFicha ? (
                            <div className="pet-ficha">
                                <button className="btn-back-patients" onClick={() => setSelectedPetFicha(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '9px 18px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', marginBottom: 16, fontFamily: "'Nunito', sans-serif", display: 'inline-flex', alignItems: 'center', gap: 6 }}>← Volver a pacientes</button>

                                {/* Datos base */}
                                <div className="pet-summary">
                                    <div className="summary-avatar">
                                        {selectedPetFicha.photo
                                            ? <img src={selectedPetFicha.photo} alt={selectedPetFicha.name} />
                                            : <span>{SPECIES_ICON[selectedPetFicha.species] || "🐾"}</span>}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3>{selectedPetFicha.name}</h3>
                                        <p>{selectedPetFicha.species_display} · {selectedPetFicha.breed || "Sin raza"} · {selectedPetFicha.sex === "male" ? "Macho" : "Hembra"}</p>
                                        {selectedPetFicha.weight && <p>⚖️ {selectedPetFicha.weight} kg</p>}
                                        {selectedPetFicha.is_neutered && <p>✂️ Castrado/a</p>}
                                        {selectedPetFicha.allergies && <p>⚠️ Alergias: {selectedPetFicha.allergies}</p>}
                                        {selectedPetFicha.notes && <p>📝 {selectedPetFicha.notes}</p>}
                                        <p style={{ marginTop: 8 }}>👤 <strong>{selectedPetFicha.owner_name || "—"}</strong>
                                            {selectedPetFicha.owner_phone && (
                                                <a href={`https://wa.me/${selectedPetFicha.owner_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                                                    style={{ marginLeft: 10, color: '#25D366', fontWeight: 700, textDecoration: 'none', fontSize: '0.85rem' }}>
                                                    📱 {selectedPetFicha.owner_phone}
                                                </a>
                                            )}
                                        </p>
                                    </div>
                                    <div className="summary-actions">
                                        <button className="btn-visit" onClick={() => { setVisitForm({ ...EMPTY_VISIT, pet: selectedPetFicha.id, date: new Date().toISOString().slice(0, 16) }); setError(""); setShowVisitModal(true); }}>📋 + Registrar visita</button>
                                        <button className="btn-add-vaccine" onClick={() => { setVaccineForm({ ...EMPTY_VACCINE, pet: selectedPetFicha.id }); setError(""); setShowVaccineModal(true); }}>💉 + Registrar vacuna</button>
                                        <button className="btn-pdf" onClick={() => handleDownloadPDF(selectedPetFicha.id, selectedPetFicha.name)}>📄 PDF</button>
                                    </div>
                                </div>

                                {/* Historial de visitas */}
                                <h4 style={{ color: '#4CAF50', margin: '24px 0 12px', fontSize: '1rem', fontWeight: 700 }}>📋 Historial de visitas</h4>
                                {visits.filter(v => v.pet === selectedPetFicha.id).length === 0 ? (
                                    <div className="empty-state"><span>📋</span><p>Sin visitas registradas aún.</p></div>
                                ) : (
                                    <div className="visits-list">
                                        {visits.filter(v => v.pet === selectedPetFicha.id).map(visit => (
                                            <div key={visit.id} className="visit-card">
                                                <div className="visit-date-box">
                                                    <span className="visit-day">{new Date(visit.date).getDate()}</span>
                                                    <span className="visit-month">{new Date(visit.date).toLocaleString("es-AR", { month: "short" })}</span>
                                                    <span className="visit-year">{new Date(visit.date).getFullYear()}</span>
                                                </div>
                                                <div className="visit-info">
                                                    <div className="visit-top">
                                                        <h3 className="visit-reason">{visit.reason}</h3>
                                                        <span className="visit-vet">🩺 Dr/a. {visit.vet_first_name} {visit.vet_last_name} · Mat. {visit.vet_license}{visit.vet_clinic_name ? ` · ${visit.vet_clinic_name}` : ""}</span>
                                                    </div>
                                                    {visit.diagnosis && <p className="visit-field"><span>Diagnóstico:</span> {visit.diagnosis}</p>}
                                                    {visit.treatment && <p className="visit-field"><span>Tratamiento:</span> {visit.treatment}</p>}
                                                    {visit.observations && <p className="visit-field"><span>Observaciones:</span> {visit.observations}</p>}
                                                    {visit.next_visit && <p className="visit-next">📅 Próxima visita: {new Date(visit.next_visit).toLocaleDateString("es-AR")}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Vacunas */}
                                <h4 style={{ color: '#FF9800', margin: '24px 0 12px', fontSize: '1rem', fontWeight: 700 }}>💉 Vacunas</h4>
                                {vaccines.filter(v => v.pet === selectedPetFicha.id).length === 0 ? (
                                    <div className="empty-state"><span>💉</span><p>Sin vacunas registradas aún.</p></div>
                                ) : (
                                    <div className="vaccine-table-wrap">
                                        <table className="vaccine-table">
                                            <thead><tr>
                                                <th>Vacuna</th><th>Fecha</th><th>Próx. dosis</th><th>Lote</th><th>Veterinario</th><th>Clínica</th><th>Notas</th>
                                            </tr></thead>
                                            <tbody>
                                                {vaccines.filter(v => v.pet === selectedPetFicha.id).map(v => (
                                                    <tr key={v.id}>
                                                        <td>{v.name}</td>
                                                        <td>{v.date_applied}</td>
                                                        <td>{v.next_dose || "—"}</td>
                                                        <td>{v.batch || "—"}</td>
                                                        <td>{v.vet_first_name} {v.vet_last_name}{v.vet_license ? ` · Mat. ${v.vet_license}` : ""}</td>
                                                        <td>{v.vet_clinic_name || "—"}</td>
                                                        <td>{v.notes || "—"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {/* Fotos clínicas */}
                                <h4 style={{ color: '#6bcaff', margin: '24px 0 12px', fontSize: '1rem', fontWeight: 700 }}>📷 Fotos clínicas</h4>
                                <div className="clinical-photos-upload">
                                    <input
                                        type="text"
                                        placeholder="Descripción (ej: Radiografía columna...)"
                                        value={clinicalPhotoCaption}
                                        onChange={e => setClinicalPhotoCaption(e.target.value)}
                                        style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.10)', borderRadius: 10, color: '#fff', padding: '10px 14px', fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem', outline: 'none', width: '100%', marginBottom: 8, boxSizing: 'border-box' }}
                                    />
                                    {clinicalPhotoError && <div className="form-error">⚠️ {clinicalPhotoError}</div>}
                                    <input ref={clinicalFileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleClinicalPhotoUpload} style={{ display: 'none' }} />
                                    <button className="btn-upload-clinical" onClick={() => clinicalFileInputRef.current?.click()} disabled={clinicalPhotoUploading}>
                                        {clinicalPhotoUploading ? "⏳ Subiendo..." : "📤 Subir foto clínica"}
                                    </button>
                                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>JPG, PNG o WebP · Máximo 5MB</p>
                                </div>
                                {clinicalPhotos.length === 0 ? (
                                    <div className="empty-state"><span>📷</span><p>Sin fotos clínicas cargadas aún.</p></div>
                                ) : (
                                    <div className="clinical-photos-grid">
                                        {clinicalPhotos.map(photo => (
                                            <div key={photo.id} className="clinical-photo-card">
                                                <img src={photo.image_url} alt={photo.caption || "Foto clínica"} />
                                                {photo.caption && <p className="clinical-photo-caption">{photo.caption}</p>}
                                                <p className="clinical-photo-clinic">🏥 {photo.clinic_name}</p>
                                                <button className="btn-delete-clinical" onClick={() => handleClinicalPhotoDelete(photo.id)}>🗑 Eliminar</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Lista de pacientes con buscador */
                            pets.length === 0 ? (
                                <div className="empty-state"><span>🐾</span><p>No hay mascotas vinculadas a tu clínica todavía.</p></div>
                            ) : (
                                <div className="pets-grid-v2">
                                    {pets
                                        .filter(pet =>
                                            pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            (pet.owner_name && pet.owner_name.toLowerCase().includes(searchQuery.toLowerCase()))
                                        )
                                        .map(pet => {
                                            const age = pet.birth_date ? (() => {
                                                const b = new Date(pet.birth_date);
                                                const now = new Date();
                                                let years = now.getFullYear() - b.getFullYear();
                                                const m = now.getMonth() - b.getMonth();
                                                if (m < 0 || (m === 0 && now.getDate() < b.getDate())) years--;
                                                return years;
                                            })() : null;
                                            const sex = pet.sex === 'male' ? { icon: '♂', label: 'Macho' } : pet.sex === 'female' ? { icon: '♀', label: 'Hembra' } : null;
                                            const vaccineCount = pet.vaccines?.length || 0;
                                            return (
                                                <article key={pet.id} className="pcard">
                                                    <div className="pcard-top">
                                                        <div className="pcard-photo">
                                                            {pet.photo
                                                                ? <img src={pet.photo} alt={pet.name} />
                                                                : <span>{SPECIES_ICON[pet.species] || "🐾"}</span>}
                                                        </div>
                                                        <div className="pcard-header">
                                                            <div className="pcard-title-row">
                                                                <h3 className="pcard-name">{pet.name}</h3>
                                                                <span className="pcard-badge">● Activo</span>
                                                            </div>
                                                            <p className="pcard-species-row">
                                                                {pet.species_display || pet.species}
                                                                {sex && <> · <span className="pcard-sex">{sex.icon} {sex.label}</span></>}
                                                                {pet.breed && <> · {pet.breed}</>}
                                                            </p>
                                                            {pet.owner_name && <p className="pcard-owner">👤 {pet.owner_name}</p>}
                                                        </div>
                                                        <button className="pcard-menu-btn" aria-label="Más opciones">⋯</button>
                                                    </div>

                                                    {/* Chips principales: edad, peso, color */}
                                                    {(age !== null || pet.weight || pet.color) && (
                                                        <div className="pcard-main-chips">
                                                            {age !== null && (
                                                                <div className="pchip pchip-main">
                                                                    <span className="pchip-icon">📅</span>
                                                                    <div>
                                                                        <span className="pchip-value">{age} {age === 1 ? 'año' : 'años'}</span>
                                                                        <span className="pchip-label">Edad</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {pet.weight && (
                                                                <div className="pchip pchip-main">
                                                                    <span className="pchip-icon">⚖️</span>
                                                                    <div>
                                                                        <span className="pchip-value">{pet.weight} kg</span>
                                                                        <span className="pchip-label">Peso</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {pet.color && (
                                                                <div className="pchip pchip-main">
                                                                    <span className="pchip-icon">🎨</span>
                                                                    <div>
                                                                        <span className="pchip-value">{pet.color}</span>
                                                                        <span className="pchip-label">Color</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Chips secundarios: feeding, habitat, lives_with */}
                                                    {(pet.feeding || pet.habitat || pet.lives_with_animals) && (
                                                        <div className="pcard-mini-chips">
                                                            {pet.feeding && <span className="pmini">🍖 {pet.feeding}</span>}
                                                            {pet.habitat && <span className="pmini">🏠 {pet.habitat}</span>}
                                                            {pet.lives_with_animals && <span className="pmini">🐾 Convive con otros animales</span>}
                                                        </div>
                                                    )}

                                                    {/* Vacunas */}
                                                    {vaccineCount > 0 && (
                                                        <p className="pcard-vaccines">🛡 {vaccineCount} vacuna{vaccineCount !== 1 ? 's' : ''} registrada{vaccineCount !== 1 ? 's' : ''}</p>
                                                    )}

                                                    {/* Botones */}
                                                    <div className="pcard-actions">
                                                        <button className="pbtn pbtn-outline" onClick={() => { setSelectedPetFicha(pet); fetchClinicalPhotos(pet.id); }}>
                                                            📄 Ver ficha completa <span className="pbtn-arrow">→</span>
                                                        </button>
                                                        <button className="pbtn pbtn-outline" onClick={() => handleDownloadPDF(pet.id, pet.name)}>
                                                            📁 Historial
                                                        </button>
                                                        <button className="pbtn pbtn-primary" onClick={() => { setSelectedPetFicha(pet); fetchClinicalPhotos(pet.id); }}>
                                                            📅 Sacar turno
                                                        </button>
                                                        <button className="pbtn pbtn-violet" onClick={() => { setSelectedPetFicha(pet); fetchClinicalPhotos(pet.id); }}>
                                                            🛡 Antiparasitarios
                                                        </button>
                                                    </div>
                                                </article>
                                            );
                                        })
                                    }
                                    {pets.filter(pet =>
                                        pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        (pet.owner_name && pet.owner_name.toLowerCase().includes(searchQuery.toLowerCase()))
                                    ).length === 0 && (
                                            <div className="empty-state empty-turnos-v2">
                                                <div className="empty-icon-big">🔍</div>
                                                <h3 className="empty-title">Sin resultados</h3>
                                                <p>No se encontraron pacientes para "{searchQuery}".</p>
                                            </div>
                                        )}
                                </div>
                            )
                        )}
                    </div>
                )}



                {/* ══ TAB FOTOS ══ */}
                {tab === "fotos" && (
                    <div className="photos-section-v2">
                        {/* Header con ilustración */}
                        <div className="fotos-header">
                            <div className="fotos-header-left">
                                <p className="fotos-eyebrow">📷 Fotos</p>
                                <h2 className="fotos-title">Fotos del local</h2>
                                <p className="fotos-subtitle">{photos.length}/5 fotos — Se muestran en tu perfil público</p>
                            </div>
                            <div className="fotos-illu" aria-hidden="true">
                                <FotosIllustration />
                            </div>
                        </div>

                        {/* Dropzone grande */}
                        {photos.length < 5 && (
                            <div className="fotos-dropzone">
                                <div className="dropzone-circle">
                                    <span className="dropzone-arrow">☁️</span>
                                </div>
                                <h3 className="dropzone-title">Subí fotos de tu clínica</h3>
                                <p className="dropzone-sub">Mostrá tu espacio y generá confianza<br />en tus clientes.</p>
                                <p className="dropzone-info">JPG, PNG o WebP • Máximo 3MB por foto</p>
                                <div className="dropzone-caption-wrap">
                                    <input
                                        type="text"
                                        className="dropzone-caption-input"
                                        placeholder="Descripción (opcional): Sala de espera, Consultorio…"
                                        value={photoCaption}
                                        onChange={e => setPhotoCaption(e.target.value)}
                                        maxLength={100}
                                    />
                                </div>
                                {photoError && <div className="form-error">⚠️ {photoError}</div>}
                                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                                <button className="dropzone-btn" onClick={() => fileInputRef.current?.click()} disabled={photoUploading}>
                                    {photoUploading ? "⏳ Subiendo…" : "📤 Subir foto"}
                                </button>
                            </div>
                        )}
                        {photos.length >= 5 && (
                            <div className="fotos-limit">
                                <span>🎉</span>
                                <div>
                                    <strong>¡Llegaste al límite de 5 fotos!</strong>
                                    <p>Eliminá una foto para poder subir otra.</p>
                                </div>
                            </div>
                        )}

                        {/* Grid Tus fotos */}
                        <div className="fotos-section-title">Tus fotos ({photos.length}/5)</div>

                        {photosLoading ? (
                            <div className="loading-state"><span className="paw-spin">🐾</span><p>Cargando fotos…</p></div>
                        ) : (
                            <div className="fotos-grid-v2">
                                {photos.map(photo => (
                                    <div key={photo.id} className="foto-card-v2">
                                        <div className="foto-card-img-wrap">
                                            <img src={photo.image} alt={photo.caption || "Foto del local"} />
                                            <button className="foto-menu-btn" aria-label="Más opciones">⋯</button>
                                        </div>
                                        <div className="foto-card-info">
                                            <span className="foto-caption-chip">🏥 {photo.caption || 'Clínica'}</span>
                                            <button className="foto-delete-btn" onClick={() => handlePhotoDelete(photo.id)} title="Eliminar foto">🗑</button>
                                        </div>
                                        <p className="foto-date">Agregada el {photo.created_at ? new Date(photo.created_at).toLocaleDateString('es-AR') : '—'}</p>
                                    </div>
                                ))}
                                {/* Slots vacíos */}
                                {Array.from({ length: Math.max(0, 5 - photos.length) }).map((_, i) => (
                                    <button
                                        key={`empty-${i}`}
                                        className="foto-slot-empty"
                                        onClick={() => photos.length < 5 && fileInputRef.current?.click()}
                                        disabled={photos.length >= 5 || photoUploading}
                                    >
                                        <span className="foto-slot-icon">📷</span>
                                        <span className="foto-slot-label">Agregar foto</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Tip abajo */}
                        <div className="fotos-tip">
                            <span className="fotos-tip-icon">✨</span>
                            <div className="fotos-tip-content">
                                <span className="fotos-tip-title">Tip</span>
                                <p className="fotos-tip-text">
                                    Las fotos de tu clínica ayudan a que más dueños te elijan.<br />
                                    Mostrá tu espacio, tu equipo y lo que hace especial tu veterinaria.
                                </p>
                            </div>
                            <TipDeskIllustration />
                        </div>
                    </div>
                )}

                {/* ══ TAB MI AGENDA ══ */}
                {tab === "mi-agenda" && (
                    <div className="schedule-section">
                        <div className="photos-header">
                            <div>
                                <h2 className="photos-title">🗓 Mi Agenda</h2>
                                <p className="photos-subtitle">Configurá tus horarios para que los clientes puedan sacar turno online</p>
                            </div>
                        </div>

                        {scheduleError && <div className="form-error">⚠️ {scheduleError}</div>}
                        {scheduleSuccess && <div className="success-toast">✅ {scheduleSuccess}</div>}

                        {scheduleLoading ? (
                            <div className="loading-state"><span className="paw-spin">🐾</span><p>Cargando agenda...</p></div>
                        ) : (
                            <>
                                {/* Días */}
                                <div className="schedule-card">
                                    <h3 className="schedule-card-title">📅 Días de atención</h3>
                                    <div className="days-grid">
                                        {DAYS.map((day, i) => {
                                            const isActive = schedule?.working_days?.includes(i);
                                            return (
                                                <button key={i} type="button"
                                                    className={`day-btn ${isActive ? 'active' : ''}`}
                                                    onClick={() => {
                                                        const days = schedule?.working_days || [];
                                                        const newDays = isActive ? days.filter(d => d !== i) : [...days, i].sort();
                                                        setSchedule(prev => ({ ...prev, working_days: newDays }));
                                                    }}>
                                                    {day}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Horarios por día */}
                                {(schedule?.working_days || []).length > 0 && (
                                    <div className="schedule-card">
                                        <h3 className="schedule-card-title">🕐 Horarios por día</h3>
                                        {(schedule?.working_days || []).sort().map(dayIdx => (
                                            <div key={dayIdx} className="day-hours-row">
                                                <span className="day-hours-label">{DAYS[dayIdx]}</span>
                                                <div className="day-hours-inputs">
                                                    <input type="time"
                                                        value={schedule?.day_hours?.[dayIdx]?.open || "09:00"}
                                                        onChange={e => setSchedule(prev => ({ ...prev, day_hours: { ...prev.day_hours, [dayIdx]: { ...prev.day_hours?.[dayIdx], open: e.target.value } } }))}
                                                    />
                                                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>a</span>
                                                    <input type="time"
                                                        value={schedule?.day_hours?.[dayIdx]?.close || "18:00"}
                                                        onChange={e => setSchedule(prev => ({ ...prev, day_hours: { ...prev.day_hours, [dayIdx]: { ...prev.day_hours?.[dayIdx], close: e.target.value } } }))}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Duración por tipo */}
                                <div className="schedule-card">
                                    <h3 className="schedule-card-title">⏱ Duración por tipo de turno</h3>
                                    {[
                                        { key: 'duration_control', label: '🩺 Control general' },
                                        { key: 'duration_vaccine', label: '💉 Vacunación' },
                                        { key: 'duration_surgery', label: '🔪 Cirugía' },
                                        { key: 'duration_other', label: '📋 Otro' },
                                    ].map(({ key, label }) => (
                                        <div key={key} className="duration-row">
                                            <span className="duration-label">{label}</span>
                                            <select value={schedule?.[key] || 30}
                                                onChange={e => setSchedule(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}>
                                                {[10, 15, 20, 30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m} minutos</option>)}
                                            </select>
                                        </div>
                                    ))}
                                </div>

                                {/* Config adicional */}
                                <div className="schedule-card">
                                    <h3 className="schedule-card-title">⚙️ Configuración adicional</h3>
                                    <div className="duration-row">
                                        <span className="duration-label">Intervalo entre turnos</span>
                                        <select value={schedule?.interval_minutes ?? 10}
                                            onChange={e => setSchedule(prev => ({ ...prev, interval_minutes: parseInt(e.target.value) }))}>
                                            <option value={0}>Sin intervalo</option>
                                            <option value={10}>10 minutos</option>
                                            <option value={15}>15 minutos</option>
                                            <option value={20}>20 minutos</option>
                                        </select>
                                    </div>
                                    <div className="duration-row">
                                        <span className="duration-label">Límite para cancelar</span>
                                        <select value={schedule?.cancel_limit_hours ?? 4}
                                            onChange={e => setSchedule(prev => ({ ...prev, cancel_limit_hours: parseInt(e.target.value) }))}>
                                            <option value={2}>2 horas antes</option>
                                            <option value={4}>4 horas antes</option>
                                            <option value={8}>8 horas antes</option>
                                            <option value={24}>24 horas antes</option>
                                        </select>
                                    </div>
                                </div>

                                <button className="btn-save-schedule" disabled={scheduleSaving} onClick={saveSchedule}>
                                    {scheduleSaving ? "Guardando..." : "💾 Guardar agenda"}
                                </button>

                                {/* Turno externo */}
                                <div className="schedule-card">
                                    <h3 className="schedule-card-title">📞 Agregar turno externo</h3>
                                    <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
                                        Para turnos tomados por teléfono o WhatsApp. Bloquea ese horario en la agenda online.
                                    </p>
                                    <form onSubmit={handleExternalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <div className="form-group">
                                            <label>Fecha y hora *</label>
                                            <input type="datetime-local" value={externalForm.requested_date}
                                                onChange={e => setExternalForm({ ...externalForm, requested_date: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Tipo</label>
                                            <select value={externalForm.appointment_type}
                                                onChange={e => setExternalForm({ ...externalForm, appointment_type: e.target.value })}>
                                                <option value="control">🩺 Control general</option>
                                                <option value="vaccine">💉 Vacunación</option>
                                                <option value="surgery">🔪 Cirugía</option>
                                                <option value="other">📋 Otro</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Descripción *</label>
                                            <input type="text" placeholder="Ej: Juan Pérez - por teléfono"
                                                value={externalForm.external_label}
                                                onChange={e => setExternalForm({ ...externalForm, external_label: e.target.value })} />
                                        </div>
                                        <button type="submit" className="btn-primary" disabled={externalSaving}>
                                            {externalSaving ? "Agregando..." : "➕ Agregar turno externo"}
                                        </button>
                                    </form>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {!loading && (
                    <div className="vet-features">
                        <div className="feature-item">
                            <span className="feature-icon feature-icon-green">📅</span>
                            <div className="feature-text">
                                <span className="feature-title">Agenda inteligente</span>
                                <span className="feature-sub">Organizá tus turnos de forma eficiente</span>
                            </div>
                        </div>
                        <div className="feature-item">
                            <span className="feature-icon feature-icon-orange">📩</span>
                            <div className="feature-text">
                                <span className="feature-title">Recordatorios automáticos</span>
                                <span className="feature-sub">Recordá vacunas y turnos importantes</span>
                            </div>
                        </div>
                        <div className="feature-item">
                            <span className="feature-icon feature-icon-blue">☁️</span>
                            <div className="feature-text">
                                <span className="feature-title">Reportes y estadísticas</span>
                                <span className="feature-sub">Descargá reportes en PDF</span>
                            </div>
                        </div>
                        <div className="feature-item">
                            <span className="feature-icon feature-icon-violet">💬</span>
                            <div className="feature-text">
                                <span className="feature-title">Soporte prioritario</span>
                                <span className="feature-sub">Estamos para ayudarte</span>
                            </div>
                        </div>
                    </div>
                )}

            </div>
            {showVisitModal && (
                <div className="modal-overlay" onClick={() => setShowVisitModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>📋 Registrar visita</h2><button className="modal-close" onClick={() => setShowVisitModal(false)}>✕</button></div>
                        {error && <div className="form-error">⚠️ {error}</div>}
                        <form onSubmit={handleVisitSubmit} className="visit-form">
                            <div className="form-section">
                                <h3 className="section-title">🩺 Datos del veterinario</h3>
                                <div className="form-row">
                                    <div className="form-group"><label>Nombre *</label><input name="vet_name" placeholder="Marcos" value={visitForm.vet_name} onChange={handleVisitChange} /></div>
                                    <div className="form-group"><label>Apellido *</label><input name="vet_lastname" placeholder="García" value={visitForm.vet_lastname} onChange={handleVisitChange} /></div>
                                </div>
                                <div className="form-group"><label>Matrícula *</label><input name="vet_license" placeholder="Mat. 12345" value={visitForm.vet_license} onChange={handleVisitChange} /></div>
                                <div className="form-group"><label>Clínica</label><input name="vet_clinic_name" placeholder="Ej: Veterinaria San Martín" value={visitForm.vet_clinic_name} onChange={handleVisitChange} /></div>
                            </div>
                            <div className="form-section">
                                <h3 className="section-title">📝 Datos de la consulta</h3>
                                <div className="form-group"><label>Fecha y hora</label><input name="date" type="datetime-local" value={visitForm.date} onChange={handleVisitChange} /></div>
                                <div className="form-group"><label>Motivo</label><input name="reason" value={visitForm.reason} onChange={handleVisitChange} /></div>
                                <div className="form-group"><label>Diagnóstico *</label><textarea name="diagnosis" rows={2} placeholder="Diagnóstico..." value={visitForm.diagnosis} onChange={handleVisitChange} /></div>
                                <div className="form-group"><label>Tratamiento</label><textarea name="treatment" rows={2} placeholder="Medicación..." value={visitForm.treatment} onChange={handleVisitChange} /></div>
                                <div className="form-group"><label>Observaciones</label><textarea name="observations" rows={2} placeholder="Notas extra..." value={visitForm.observations} onChange={handleVisitChange} /></div>
                                <div className="form-group"><label>Próxima visita</label><input name="next_visit" type="date" value={visitForm.next_visit} onChange={handleVisitChange} /></div>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-ghost" onClick={() => setShowVisitModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Guardando..." : "Guardar 📋"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Modal vacuna ── */}
            {showVaccineModal && (
                <div className="modal-overlay" onClick={() => setShowVaccineModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>💉 Registrar vacuna</h2><button className="modal-close" onClick={() => setShowVaccineModal(false)}>✕</button></div>
                        {error && <div className="form-error">⚠️ {error}</div>}
                        <form onSubmit={handleVaccineSubmit} className="visit-form">
                            <div className="form-section">
                                <h3 className="section-title">🩺 Datos del veterinario</h3>
                                <div className="form-row">
                                    <div className="form-group"><label>Nombre *</label><input name="vet_first_name" placeholder="Marcos" value={vaccineForm.vet_first_name} onChange={handleVaccineChange} /></div>
                                    <div className="form-group"><label>Apellido *</label><input name="vet_last_name" placeholder="García" value={vaccineForm.vet_last_name} onChange={handleVaccineChange} /></div>
                                </div>
                                <div className="form-group"><label>Matrícula *</label><input name="vet_license" placeholder="Mat. 12345" value={vaccineForm.vet_license} onChange={handleVaccineChange} /></div>
                                <div className="form-group"><label>Clínica</label><input name="vet_clinic_name" placeholder="Ej: Veterinaria San Martín" value={vaccineForm.vet_clinic_name} onChange={handleVaccineChange} /></div>
                            </div>
                            <div className="form-section">
                                <h3 className="section-title">💉 Datos de la vacuna</h3>
                                <div className="form-group"><label>Nombre *</label><input name="name" placeholder="Ej: Antirrábica..." value={vaccineForm.name} onChange={handleVaccineChange} /></div>
                                <div className="form-row">
                                    <div className="form-group"><label>Fecha</label><input name="date_applied" type="date" value={vaccineForm.date_applied} onChange={handleVaccineChange} /></div>
                                    <div className="form-group"><label>Próxima dosis</label><input name="next_dose" type="date" value={vaccineForm.next_dose} onChange={handleVaccineChange} /></div>
                                </div>
                                <div className="form-group"><label>Lote</label><input name="batch" placeholder="Nº de lote" value={vaccineForm.batch} onChange={handleVaccineChange} /></div>
                                <div className="form-group"><label>Notas</label><textarea name="notes" rows={2} placeholder="Observaciones..." value={vaccineForm.notes} onChange={handleVaccineChange} /></div>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-ghost" onClick={() => setShowVaccineModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Guardando..." : "Guardar 💉"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                /* VetDashboard v2.0 — rediseño con stats coloreadas + empty states limpios */
                @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Fraunces:ital,opsz,wght@1,9..144,700&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                .vet-page {
                    min-height: 100vh;
                    background:
                        radial-gradient(ellipse 1200px 600px at 20% 0%, rgba(76,175,80,0.10), transparent 50%),
                        radial-gradient(ellipse 1000px 700px at 90% 30%, rgba(255,152,0,0.08), transparent 55%),
                        radial-gradient(ellipse 900px 800px at 10% 90%, rgba(167,139,250,0.07), transparent 55%),
                        radial-gradient(ellipse 800px 600px at 95% 95%, rgba(107,202,255,0.07), transparent 55%),
                        #050a13;
                    font-family: 'Nunito', sans-serif;
                    position: relative;
                    overflow-x: clip;
                    padding-bottom: 60px;
                }
                .stars-bg {
                    position: fixed; inset: 0; width: 100%; height: 100%;
                    pointer-events: none; z-index: 0;
                }
                .star-twinkle circle, .star-twinkle path { animation: twinkle 3.5s ease-in-out infinite; }
                @keyframes twinkle { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
                .blob { position: fixed; border-radius: 50%; filter: blur(110px); opacity: 0.08; pointer-events: none; z-index: 0; }
                .b1 { width: 500px; height: 500px; background: #4CAF50; top: -120px; left: -120px; }
                .b2 { width: 400px; height: 400px; background: #FF9800; bottom: -100px; right: -100px; }
                .b3 { width: 360px; height: 360px; background: #a78bfa; top: 40%; right: -150px; }
                .vet-inner { max-width: 1400px; margin: 0 auto; padding: 36px 24px; position: relative; z-index: 1; overflow-x: hidden; }

                /* ─── Header rediseñado (sin perro) ─── */
                .vet-header {
                    position: relative;
                    display: grid;
                    grid-template-columns: 1fr 320px;
                    gap: 24px;
                    align-items: flex-start;
                    margin-bottom: 32px;
                    padding: 14px 8px 26px;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                }
                .vet-header-left { position: relative; z-index: 1; min-width: 0; }
                .vet-eyebrow {
                    display: inline-flex; align-items: center; gap: 8px;
                    color: rgba(255,255,255,0.55); font-size: 0.85rem; font-weight: 700;
                    margin-bottom: 12px;
                }
                .vet-eyebrow span { font-size: 1rem; }
                .vet-title {
                    font-family: 'Nunito', sans-serif;
                    font-size: 2.4rem; font-weight: 800; color: #fff;
                    letter-spacing: -0.8px; line-height: 1.15; margin-bottom: 10px;
                }
                .vet-name {
                    color: #4CAF50;
                    text-shadow: 0 0 30px rgba(76,175,80,0.45);
                }
                .vet-wave {
                    display: inline-block;
                    animation: wave 1.8s ease-in-out infinite;
                    transform-origin: 70% 70%;
                }
                @keyframes wave { 0%, 100% { transform: rotate(0deg); } 20% { transform: rotate(15deg); } 40% { transform: rotate(-8deg); } 60% { transform: rotate(12deg); } 80% { transform: rotate(-4deg); } }
                .vet-subtitle { color: rgba(255,255,255,0.55); font-size: 0.98rem; line-height: 1.5; }

                .vet-header-right { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 12px; align-items: stretch; }
                .success-toast { background: rgba(107,255,184,0.12); border: 1px solid rgba(107,255,184,0.3); color: #6bffb8; padding: 10px 16px; border-radius: 10px; font-size: 0.88rem; font-weight: 700; }
                .vet-stats-link {
                    display: flex; align-items: center; gap: 14px;
                    background: rgba(15,26,42,0.7);
                    border: 1px solid rgba(76,175,80,0.30);
                    color: #fff; padding: 14px 18px; border-radius: 16px;
                    text-decoration: none; transition: all 0.2s;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 4px 24px rgba(0,0,0,0.20);
                }
                .vet-stats-link:hover {
                    border-color: rgba(76,175,80,0.55);
                    box-shadow: 0 0 28px rgba(76,175,80,0.18);
                    transform: translateY(-2px);
                }
                .vet-stats-icon {
                    width: 36px; height: 36px;
                    border-radius: 10px;
                    background: linear-gradient(135deg, rgba(76,175,80,0.25), rgba(76,175,80,0.10));
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1.2rem; flex-shrink: 0;
                }
                .vet-stats-text { display: flex; flex-direction: column; line-height: 1.2; }
                .vet-stats-title { color: #66BB6A; font-size: 1rem; font-weight: 800; }
                .vet-stats-sub { color: rgba(255,255,255,0.55); font-size: 0.78rem; font-weight: 600; }

                /* ─── Tabs rediseñadas ─── */
                .tabs {
                    display: flex; gap: 8px; margin-bottom: 26px;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                    overflow-x: auto; scrollbar-width: none;
                    -webkit-overflow-scrolling: touch;
                }
                .tabs::-webkit-scrollbar { display: none; }
                .tab-btn {
                    background: transparent; border: none;
                    border-bottom: 3px solid transparent;
                    color: rgba(255,255,255,0.45);
                    font-family: 'Nunito', sans-serif; font-size: 0.95rem; font-weight: 700;
                    padding: 12px 18px;
                    display: inline-flex; align-items: center; gap: 8px;
                    cursor: pointer; transition: all 0.2s;
                    margin-bottom: -1px; white-space: nowrap; flex-shrink: 0;
                    position: relative;
                }
                .tab-icon { font-size: 1rem; }
                .tab-btn:hover { color: rgba(255,255,255,0.85); }
                .tab-btn.active {
                    color: #66BB6A;
                    border-bottom-color: #4CAF50;
                    text-shadow: 0 0 12px rgba(76,175,80,0.4);
                }
                .tab-btn.active::after {
                    content: '';
                    position: absolute;
                    bottom: -1px; left: 10%; right: 10%; height: 3px;
                    background: #4CAF50;
                    box-shadow: 0 0 12px rgba(76,175,80,0.7);
                    border-radius: 3px 3px 0 0;
                }

                .loading-state, .empty-state { text-align: center; padding: 60px 20px; display: flex; flex-direction: column; align-items: center; gap: 14px; }
                .paw-spin { font-size: 3rem; animation: spin 1s linear infinite; display: block; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .loading-state p, .empty-state p { color: rgba(255,255,255,0.4); }
                .empty-state span { font-size: 3rem; }

                /* ─── Footer de features ─── */
                .vet-features {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                    margin-top: 40px;
                    padding-top: 28px;
                    border-top: 1px solid rgba(255,255,255,0.06);
                }
                .feature-item {
                    display: flex; align-items: center; gap: 14px;
                    background: rgba(15,26,42,0.5);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 14px;
                    padding: 16px;
                    transition: all 0.2s;
                }
                .feature-item:hover {
                    background: rgba(15,26,42,0.75);
                    border-color: rgba(255,255,255,0.10);
                }
                .feature-icon {
                    width: 44px; height: 44px; border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1.3rem; flex-shrink: 0;
                }
                .feature-icon-green { background: rgba(76,175,80,0.15); color: #66BB6A; box-shadow: inset 0 0 12px rgba(76,175,80,0.15); }
                .feature-icon-orange { background: rgba(255,152,0,0.15); color: #FFB74D; box-shadow: inset 0 0 12px rgba(255,152,0,0.15); }
                .feature-icon-blue { background: rgba(107,202,255,0.15); color: #6bcaff; box-shadow: inset 0 0 12px rgba(107,202,255,0.15); }
                .feature-icon-violet { background: rgba(167,139,250,0.15); color: #a78bfa; box-shadow: inset 0 0 12px rgba(167,139,250,0.15); }
                .feature-text { display: flex; flex-direction: column; min-width: 0; }
                .feature-title { color: #fff; font-size: 0.92rem; font-weight: 800; margin-bottom: 3px; }
                .feature-sub { color: rgba(255,255,255,0.5); font-size: 0.78rem; line-height: 1.35; }

                .vet-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 22px; }
                .vet-stat {
                    position: relative;
                    border-radius: 20px;
                    padding: 24px 26px;
                    display: flex; align-items: center; gap: 18px;
                    min-width: 0; overflow: hidden;
                    transition: all 0.2s;
                    border: 2px solid;
                }
                .vet-stat:hover { transform: translateY(-3px); }
                .vet-stat .stat-deco {
                    position: absolute; right: -10px; bottom: -16px;
                    font-size: 5.5rem; opacity: 0.08;
                    pointer-events: none;
                }
                .stat-pending {
                    background: linear-gradient(135deg, rgba(76,175,80,0.12), rgba(76,175,80,0.04));
                    border-color: rgba(76,175,80,0.35);
                }
                .stat-confirmed {
                    background: linear-gradient(135deg, rgba(76,175,80,0.22), rgba(76,175,80,0.08));
                    border-color: rgba(76,175,80,0.55);
                    box-shadow: 0 0 40px rgba(76,175,80,0.15);
                }
                .stat-completed {
                    background: linear-gradient(135deg, rgba(107,202,255,0.15), rgba(107,202,255,0.05));
                    border-color: rgba(107,202,255,0.45);
                }
                .stat-noshow {
                    background: linear-gradient(135deg, rgba(255,107,107,0.15), rgba(255,107,107,0.05));
                    border-color: rgba(255,107,107,0.45);
                }

                .stat-icon-wrap {
                    width: 60px; height: 60px; border-radius: 16px;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0; position: relative; z-index: 1;
                    border: 2px solid;
                }
                .stat-pending .stat-icon-wrap {
                    background: rgba(76,175,80,0.18);
                    border-color: rgba(76,175,80,0.50);
                    box-shadow: inset 0 0 18px rgba(76,175,80,0.20);
                }
                .stat-confirmed .stat-icon-wrap {
                    background: rgba(76,175,80,0.30);
                    border-color: rgba(76,175,80,0.70);
                    box-shadow: inset 0 0 20px rgba(76,175,80,0.30), 0 0 24px rgba(76,175,80,0.30);
                }
                .stat-completed .stat-icon-wrap {
                    background: rgba(107,202,255,0.20);
                    border-color: rgba(107,202,255,0.55);
                    box-shadow: inset 0 0 18px rgba(107,202,255,0.20);
                }
                .stat-noshow .stat-icon-wrap {
                    background: rgba(255,107,107,0.20);
                    border-color: rgba(255,107,107,0.55);
                    box-shadow: inset 0 0 18px rgba(255,107,107,0.20);
                }

                .stat-icon { font-size: 1.8rem; flex-shrink: 0; }
                .stat-content { position: relative; z-index: 1; }
                .stat-num { font-size: 2.6rem; font-weight: 900; color: #fff; line-height: 1; }
                .stat-label { font-size: 0.95rem; font-weight: 800; margin-top: 4px; }
                .stat-pending .stat-label { color: #81C784; }
                .stat-confirmed .stat-label { color: #4CAF50; }
                .stat-completed .stat-label { color: #6bcaff; }
                .stat-noshow .stat-label { color: #ff6b6b; }

                /* ─── Filtros como pills más visibles ─── */
                .filters { display: flex; gap: 10px; margin-bottom: 22px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; flex-wrap: wrap; }
                .filters::-webkit-scrollbar { display: none; }
                .filter-btn {
                    background: rgba(255,255,255,0.03);
                    border: 1.5px solid rgba(255,255,255,0.12);
                    color: rgba(255,255,255,0.6);
                    border-radius: 100px;
                    padding: 11px 24px;
                    font-family: 'Nunito', sans-serif; font-size: 0.9rem; font-weight: 700;
                    cursor: pointer; transition: all 0.2s;
                    white-space: nowrap; flex-shrink: 0;
                }
                .filter-btn:hover {
                    color: rgba(255,255,255,0.95);
                    border-color: rgba(255,255,255,0.25);
                    background: rgba(255,255,255,0.06);
                }
                .filter-btn.active {
                    background: rgba(76,175,80,0.18);
                    border-color: #4CAF50;
                    color: #66BB6A;
                    box-shadow: 0 0 20px rgba(76,175,80,0.25), inset 0 0 12px rgba(76,175,80,0.10);
                    text-shadow: 0 0 8px rgba(76,175,80,0.4);
                }

                /* ─── Empty states limpios ─── */
                .empty-turnos-v2 {
                    background: linear-gradient(135deg, rgba(15,26,42,0.7), rgba(15,26,42,0.4));
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 22px;
                    padding: 70px 24px;
                    text-align: center;
                }
                .empty-icon-big {
                    font-size: 5rem;
                    margin-bottom: 18px;
                    filter: drop-shadow(0 8px 24px rgba(76,175,80,0.25));
                    opacity: 0.9;
                }
                .empty-title { color: #fff; font-size: 1.3rem; font-weight: 800; margin-bottom: 6px; }
                .empty-turnos-v2 p { color: rgba(255,255,255,0.55); font-size: 0.95rem; }

                .agenda-empty-v2 { text-align: center; padding: 22px 0; display: flex; flex-direction: column; align-items: center; gap: 8px; }
                .agenda-empty-icon {
                    font-size: 2.6rem;
                    filter: drop-shadow(0 4px 12px rgba(76,175,80,0.2));
                    opacity: 0.85;
                }
                .agenda-empty-v2 p { color: rgba(255,255,255,0.55); font-size: 0.85rem; font-weight: 700; }

                /* ─── Botón Descargar agenda rojo ─── */
                .btn-agenda-pdf {
                    background: linear-gradient(135deg, #ef5350, #e53935) !important;
                    color: #fff !important;
                    box-shadow: 0 6px 22px rgba(239,83,80,0.35) !important;
                    border: none !important;
                }
                .btn-agenda-pdf:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(239,83,80,0.45) !important; }

                /* ═══════════ TAB PACIENTES ═══════════ */
                .patients-section { display: flex; flex-direction: column; gap: 22px; }

                /* Stats de pacientes */
                .patients-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
                .pstat {
                    position: relative;
                    border-radius: 20px;
                    padding: 22px 24px;
                    display: flex; align-items: flex-start; gap: 16px;
                    min-width: 0; overflow: hidden;
                    transition: all 0.2s;
                    border: 2px solid;
                }
                .pstat:hover { transform: translateY(-3px); }
                .pstat-deco {
                    position: absolute; right: -14px; bottom: -18px;
                    font-size: 6rem; opacity: 0.06;
                    pointer-events: none;
                }
                .pstat-total {
                    background: linear-gradient(135deg, rgba(107,202,255,0.14), rgba(107,202,255,0.04));
                    border-color: rgba(107,202,255,0.40);
                }
                .pstat-active {
                    background: linear-gradient(135deg, rgba(76,175,80,0.14), rgba(76,175,80,0.04));
                    border-color: rgba(76,175,80,0.40);
                }
                .pstat-reminders {
                    background: linear-gradient(135deg, rgba(167,139,250,0.14), rgba(167,139,250,0.04));
                    border-color: rgba(167,139,250,0.40);
                }
                .pstat-rating {
                    background: linear-gradient(135deg, rgba(255,152,0,0.14), rgba(255,152,0,0.04));
                    border-color: rgba(255,152,0,0.40);
                }
                .pstat-icon-wrap {
                    width: 56px; height: 56px; border-radius: 16px;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0; position: relative; z-index: 1;
                    border: 2px solid;
                }
                .pstat-total .pstat-icon-wrap {
                    background: rgba(107,202,255,0.20);
                    border-color: rgba(107,202,255,0.55);
                    box-shadow: inset 0 0 18px rgba(107,202,255,0.22);
                }
                .pstat-active .pstat-icon-wrap {
                    background: rgba(76,175,80,0.20);
                    border-color: rgba(76,175,80,0.55);
                    box-shadow: inset 0 0 18px rgba(76,175,80,0.22);
                }
                .pstat-reminders .pstat-icon-wrap {
                    background: rgba(167,139,250,0.20);
                    border-color: rgba(167,139,250,0.55);
                    box-shadow: inset 0 0 18px rgba(167,139,250,0.22);
                }
                .pstat-rating .pstat-icon-wrap {
                    background: rgba(255,152,0,0.20);
                    border-color: rgba(255,152,0,0.55);
                    box-shadow: inset 0 0 18px rgba(255,152,0,0.22);
                }
                .pstat-icon { font-size: 1.7rem; }
                .pstat-content { position: relative; z-index: 1; min-width: 0; }
                .pstat-num { font-size: 2.3rem; font-weight: 900; color: #fff; line-height: 1; }
                .pstat-label { font-size: 0.95rem; font-weight: 800; margin-top: 5px; }
                .pstat-total .pstat-label { color: #6bcaff; }
                .pstat-active .pstat-label { color: #66BB6A; }
                .pstat-reminders .pstat-label { color: #a78bfa; }
                .pstat-rating .pstat-label { color: #FFB74D; }
                .pstat-sub { font-size: 0.75rem; color: rgba(255,255,255,0.45); font-weight: 600; margin-top: 3px; line-height: 1.35; }

                /* Filtros: buscador + dropdown */
                .patients-filters { display: grid; grid-template-columns: 1fr auto; gap: 12px; }
                .patients-search-wrap {
                    position: relative;
                    background: rgba(15,26,42,0.75);
                    border: 1.5px solid rgba(255,255,255,0.08);
                    border-radius: 16px;
                    padding: 0 16px;
                    display: flex; align-items: center; gap: 10px;
                    transition: border-color 0.15s;
                }
                .patients-search-wrap:focus-within { border-color: rgba(76,175,80,0.40); }
                .patients-search-icon { color: rgba(255,255,255,0.4); font-size: 1rem; flex-shrink: 0; }
                .patients-search {
                    flex: 1; background: transparent; border: none; outline: none;
                    color: #fff; font-size: 0.95rem;
                    padding: 15px 0;
                    font-family: 'Nunito', sans-serif;
                }
                .patients-search::placeholder { color: rgba(255,255,255,0.35); }
                .patients-search-clear {
                    background: rgba(255,255,255,0.06); border: none; color: rgba(255,255,255,0.6);
                    width: 22px; height: 22px; border-radius: 50%; cursor: pointer;
                    display: flex; align-items: center; justify-content: center; font-size: 0.7rem;
                }
                .patients-filter-drop {
                    display: flex; align-items: center; gap: 10px;
                    background: rgba(15,26,42,0.75);
                    border: 1.5px solid rgba(255,255,255,0.08);
                    border-radius: 16px; padding: 0 18px;
                    color: rgba(255,255,255,0.85); font-weight: 700; font-size: 0.9rem;
                    cursor: default;
                    height: 54px;
                }
                .filter-drop-icon { font-size: 1rem; opacity: 0.7; }
                .filter-drop-label { white-space: nowrap; }
                .filter-drop-caret { color: rgba(255,255,255,0.4); font-size: 0.75rem; }

                /* Grid de pacientes */
                .pets-grid-v2 { display: flex; flex-direction: column; gap: 16px; }

                .pcard {
                    background: linear-gradient(135deg, rgba(15,26,42,0.85), rgba(15,26,42,0.60));
                    border: 1.5px solid rgba(255,255,255,0.06);
                    border-radius: 22px;
                    padding: 24px;
                    display: flex; flex-direction: column; gap: 16px;
                    transition: all 0.2s;
                    position: relative;
                }
                .pcard:hover { border-color: rgba(76,175,80,0.25); transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.20); }

                .pcard-top { display: flex; gap: 20px; align-items: flex-start; }
                .pcard-photo {
                    width: 130px; height: 130px; border-radius: 18px;
                    overflow: hidden; flex-shrink: 0;
                    background: linear-gradient(135deg, rgba(107,202,255,0.15), rgba(76,175,80,0.10));
                    border: 1.5px solid rgba(107,202,255,0.20);
                    display: flex; align-items: center; justify-content: center;
                }
                .pcard-photo img { width: 100%; height: 100%; object-fit: cover; }
                .pcard-photo span { font-size: 4rem; }
                .pcard-header { flex: 1; min-width: 0; }
                .pcard-title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; flex-wrap: wrap; }
                .pcard-name { color: #fff; font-size: 1.6rem; font-weight: 900; letter-spacing: -0.5px; }
                .pcard-badge {
                    display: inline-flex; align-items: center; gap: 4px;
                    background: rgba(76,175,80,0.15);
                    color: #66BB6A; font-size: 0.72rem; font-weight: 800;
                    padding: 4px 12px; border-radius: 100px;
                    border: 1px solid rgba(76,175,80,0.30);
                }
                .pcard-species-row { color: rgba(255,255,255,0.75); font-size: 0.95rem; font-weight: 600; margin-bottom: 6px; }
                .pcard-sex { color: #a78bfa; font-weight: 700; }
                .pcard-owner { color: rgba(255,255,255,0.55); font-size: 0.85rem; }
                .pcard-menu-btn {
                    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
                    color: rgba(255,255,255,0.6); cursor: pointer;
                    width: 34px; height: 34px; border-radius: 10px;
                    font-size: 1.2rem; font-weight: 700;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .pcard-menu-btn:hover { background: rgba(255,255,255,0.10); color: #fff; }

                /* Chips principales edad/peso/color */
                .pcard-main-chips { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
                .pchip-main {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 14px;
                    padding: 12px 16px;
                    display: flex; align-items: center; gap: 12px;
                }
                .pchip-icon { font-size: 1.4rem; flex-shrink: 0; }
                .pchip-main > div { display: flex; flex-direction: column; line-height: 1.15; min-width: 0; }
                .pchip-value { color: #fff; font-weight: 800; font-size: 0.95rem; }
                .pchip-label { color: rgba(255,255,255,0.5); font-size: 0.72rem; font-weight: 600; margin-top: 2px; }

                /* Chips secundarios feeding/habitat/etc */
                .pcard-mini-chips { display: flex; flex-wrap: wrap; gap: 8px; }
                .pmini {
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 100px;
                    padding: 5px 12px;
                    color: rgba(255,255,255,0.75);
                    font-size: 0.78rem; font-weight: 700;
                }

                .pcard-vaccines { color: rgba(255,255,255,0.6); font-size: 0.85rem; font-weight: 700; }

                /* Botones de la pcard */
                .pcard-actions {
                    display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
                    border-top: 1px solid rgba(255,255,255,0.06);
                    padding-top: 14px;
                }
                .pbtn {
                    border: none; cursor: pointer;
                    padding: 11px 14px; border-radius: 12px;
                    font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 0.85rem;
                    display: inline-flex; align-items: center; justify-content: center; gap: 5px;
                    transition: all 0.15s;
                    white-space: nowrap;
                }
                .pbtn-outline {
                    background: rgba(107,202,255,0.05);
                    color: #6bcaff;
                    border: 1.5px solid rgba(107,202,255,0.25);
                }
                .pbtn-outline:hover { background: rgba(107,202,255,0.12); border-color: rgba(107,202,255,0.45); }
                .pbtn-primary {
                    background: linear-gradient(135deg, #4CAF50, #FF9800);
                    color: #fff;
                    box-shadow: 0 6px 18px rgba(76,175,80,0.25);
                }
                .pbtn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 26px rgba(76,175,80,0.35); }
                .pbtn-violet {
                    background: rgba(167,139,250,0.10);
                    color: #a78bfa;
                    border: 1.5px solid rgba(167,139,250,0.30);
                }
                .pbtn-violet:hover { background: rgba(167,139,250,0.18); border-color: rgba(167,139,250,0.45); }
                .pbtn-arrow { font-size: 0.9rem; }

                /* ═══════════ TAB FOTOS ═══════════ */
                .photos-section-v2 { display: flex; flex-direction: column; gap: 22px; }

                /* Header con ilustración */
                .fotos-header {
                    display: grid; grid-template-columns: 1fr 340px;
                    gap: 24px; align-items: center;
                    position: relative;
                    padding: 8px 4px 6px;
                }
                .fotos-header-left { min-width: 0; }
                .fotos-eyebrow {
                    display: inline-flex; align-items: center; gap: 6px;
                    color: #66BB6A; font-size: 0.95rem; font-weight: 800;
                    margin-bottom: 8px;
                    text-shadow: 0 0 12px rgba(76,175,80,0.30);
                }
                .fotos-title {
                    font-family: 'Nunito', sans-serif;
                    color: #fff; font-size: 2.1rem; font-weight: 900;
                    letter-spacing: -0.8px; margin-bottom: 6px;
                }
                .fotos-subtitle { color: rgba(255,255,255,0.55); font-size: 0.95rem; }
                .fotos-illu { display: flex; align-items: center; justify-content: center; }
                .fotos-illu svg { width: 100%; height: auto; max-height: 160px; }

                /* Dropzone grande */
                .fotos-dropzone {
                    background: linear-gradient(180deg, rgba(15,26,42,0.75), rgba(15,26,42,0.55));
                    border: 2px dashed rgba(107,202,255,0.30);
                    border-radius: 22px;
                    padding: 40px 24px 32px;
                    text-align: center;
                    display: flex; flex-direction: column; align-items: center; gap: 10px;
                }
                .dropzone-circle {
                    width: 90px; height: 90px; border-radius: 50%;
                    background: linear-gradient(135deg, rgba(76,175,80,0.14), rgba(76,175,80,0.05));
                    border: 2px dashed rgba(76,175,80,0.5);
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 0 40px rgba(76,175,80,0.18);
                    margin-bottom: 4px;
                }
                .dropzone-arrow {
                    font-size: 2.4rem;
                    filter: drop-shadow(0 4px 12px rgba(76,175,80,0.35));
                }
                .dropzone-title {
                    color: #fff; font-size: 1.5rem; font-weight: 900;
                    letter-spacing: -0.4px;
                }
                .dropzone-sub {
                    color: rgba(255,255,255,0.65); font-size: 0.95rem;
                    line-height: 1.5; margin-bottom: 4px;
                }
                .dropzone-info { color: rgba(255,255,255,0.35); font-size: 0.82rem; font-weight: 600; }
                .dropzone-caption-wrap {
                    width: 100%; max-width: 480px;
                    margin: 12px 0 6px;
                }
                .dropzone-caption-input {
                    width: 100%;
                    background: rgba(15,26,42,0.8);
                    border: 1.5px solid rgba(255,255,255,0.08);
                    color: #fff; font-family: 'Nunito', sans-serif;
                    font-size: 0.9rem;
                    padding: 12px 16px; border-radius: 12px;
                    outline: none;
                    transition: border-color 0.15s;
                }
                .dropzone-caption-input:focus { border-color: rgba(76,175,80,0.40); }
                .dropzone-caption-input::placeholder { color: rgba(255,255,255,0.35); }
                .dropzone-btn {
                    background: linear-gradient(135deg, #4CAF50, #66BB6A);
                    color: #fff; border: none;
                    padding: 14px 34px; border-radius: 12px;
                    font-family: 'Nunito', sans-serif; font-size: 1rem; font-weight: 800;
                    cursor: pointer;
                    display: inline-flex; align-items: center; gap: 8px;
                    box-shadow: 0 8px 24px rgba(76,175,80,0.32);
                    transition: all 0.15s;
                }
                .dropzone-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(76,175,80,0.45); }
                .dropzone-btn:disabled { opacity: 0.6; cursor: not-allowed; }

                /* Limite */
                .fotos-limit {
                    display: flex; align-items: center; gap: 16px;
                    background: linear-gradient(135deg, rgba(76,175,80,0.15), rgba(76,175,80,0.05));
                    border: 1.5px solid rgba(76,175,80,0.35);
                    border-radius: 16px; padding: 18px 22px;
                    color: rgba(255,255,255,0.85);
                }
                .fotos-limit span { font-size: 2rem; }
                .fotos-limit strong { color: #66BB6A; font-weight: 900; display: block; margin-bottom: 4px; }
                .fotos-limit p { color: rgba(255,255,255,0.6); font-size: 0.9rem; }

                /* Sección título */
                .fotos-section-title {
                    color: #fff; font-size: 1.15rem; font-weight: 900;
                    letter-spacing: -0.3px; margin-top: 6px;
                }

                /* Grid de fotos */
                .fotos-grid-v2 {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 16px;
                }
                .foto-card-v2 {
                    display: flex; flex-direction: column; gap: 8px;
                }
                .foto-card-img-wrap {
                    position: relative;
                    width: 100%; aspect-ratio: 1;
                    border-radius: 16px; overflow: hidden;
                    background: #0f1a2a;
                    border: 1px solid rgba(255,255,255,0.08);
                }
                .foto-card-img-wrap img {
                    width: 100%; height: 100%; object-fit: cover; display: block;
                }
                .foto-menu-btn {
                    position: absolute; top: 8px; right: 8px;
                    background: rgba(0,0,0,0.55);
                    color: #fff; border: none;
                    width: 30px; height: 30px; border-radius: 50%;
                    font-size: 1.2rem; font-weight: 900;
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    backdrop-filter: blur(6px);
                }
                .foto-menu-btn:hover { background: rgba(0,0,0,0.75); }
                .foto-card-info { display: flex; align-items: center; gap: 8px; }
                .foto-caption-chip {
                    background: rgba(15,26,42,0.7);
                    border: 1px solid rgba(255,255,255,0.08);
                    color: rgba(255,255,255,0.85);
                    padding: 5px 10px; border-radius: 100px;
                    font-size: 0.78rem; font-weight: 700;
                    flex: 1; min-width: 0;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .foto-delete-btn {
                    background: rgba(239,83,80,0.10);
                    border: 1px solid rgba(239,83,80,0.30);
                    color: #ef5350;
                    width: 32px; height: 32px; border-radius: 8px;
                    font-size: 0.95rem;
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                    transition: all 0.15s;
                }
                .foto-delete-btn:hover { background: rgba(239,83,80,0.20); border-color: rgba(239,83,80,0.50); }
                .foto-date {
                    color: rgba(255,255,255,0.4);
                    font-size: 0.72rem; font-weight: 600;
                }

                /* Slots vacíos "Agregar foto" */
                .foto-slot-empty {
                    width: 100%; aspect-ratio: 1;
                    background: rgba(15,26,42,0.35);
                    border: 2px dashed rgba(107,202,255,0.20);
                    border-radius: 16px;
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: all 0.15s;
                    font-family: 'Nunito', sans-serif;
                }
                .foto-slot-empty:hover:not(:disabled) {
                    background: rgba(107,202,255,0.05);
                    border-color: rgba(107,202,255,0.40);
                    transform: translateY(-2px);
                }
                .foto-slot-empty:disabled { opacity: 0.5; cursor: not-allowed; }
                .foto-slot-icon {
                    font-size: 2.4rem;
                    opacity: 0.6;
                    filter: drop-shadow(0 4px 10px rgba(107,202,255,0.2));
                }
                .foto-slot-label {
                    color: rgba(255,255,255,0.55);
                    font-size: 0.88rem; font-weight: 700;
                }

                /* Tip abajo */
                .fotos-tip {
                    position: relative;
                    background: linear-gradient(135deg, rgba(15,26,42,0.75), rgba(15,26,42,0.50));
                    border: 1px solid rgba(76,175,80,0.20);
                    border-radius: 22px;
                    padding: 20px 24px;
                    display: grid; grid-template-columns: auto 1fr 260px;
                    gap: 18px; align-items: center;
                    overflow: hidden;
                }
                .fotos-tip-icon {
                    width: 50px; height: 50px; border-radius: 14px;
                    background: rgba(167,139,250,0.15);
                    border: 1px solid rgba(167,139,250,0.35);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1.4rem;
                    box-shadow: inset 0 0 14px rgba(167,139,250,0.2);
                    flex-shrink: 0;
                }
                .fotos-tip-content { min-width: 0; }
                .fotos-tip-title {
                    color: #66BB6A; font-size: 1rem; font-weight: 900;
                    display: block; margin-bottom: 4px;
                }
                .fotos-tip-text { color: rgba(255,255,255,0.7); font-size: 0.9rem; line-height: 1.55; }
                .tip-desk-svg { width: 100%; height: auto; max-height: 90px; opacity: 0.9; }

                .turnos-layout { display: grid; grid-template-columns: 1fr 400px; gap: 24px; align-items: stretch; }
                .turnos-main { display: flex; flex-direction: column; min-width: 0; }

                .appts-list { display: flex; flex-direction: column; gap: 12px; }
                .appt-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 16px 18px; display: flex; align-items: flex-start; gap: 16px; backdrop-filter: blur(10px); transition: border-color 0.2s; overflow: hidden; }
                .appt-card:hover { border-color: rgba(107,255,184,0.2); }
                .appt-highlighted { border-color: #6bffb8 !important; box-shadow: 0 0 0 3px rgba(107,255,184,0.2); background: rgba(107,255,184,0.06) !important; }
                .appt-date-box { display: flex; flex-direction: column; align-items: center; background: rgba(107,255,184,0.10); border-radius: 10px; padding: 8px 12px; min-width: 52px; flex-shrink: 0; }
                .appt-day { font-size: 1.4rem; font-weight: 900; color: #6bffb8; line-height: 1; }
                .appt-month { font-size: 0.6rem; color: rgba(107,255,184,0.7); text-transform: uppercase; font-weight: 700; }
                .appt-time { font-size: 0.65rem; color: rgba(255,255,255,0.4); margin-top: 3px; font-weight: 600; }
                .appt-info { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
                .appt-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
                .appt-reason { font-size: 0.98rem; font-weight: 900; color: #fff; }
                .appt-status-badge { font-size: 0.7rem; font-weight: 700; border-radius: 6px; padding: 3px 9px; border: 1px solid; white-space: nowrap; flex-shrink: 0; }
                .appt-type-badge { font-size: 0.7rem; font-weight: 700; border-radius: 6px; padding: 3px 8px; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.10); white-space: nowrap; flex-shrink: 0; }
                .appt-external-badge { font-size: 0.7rem; font-weight: 700; border-radius: 6px; padding: 3px 8px; background: rgba(255,152,0,0.12); color: #FF9800; border: 1px solid rgba(255,152,0,0.25); white-space: nowrap; flex-shrink: 0; }
                .appt-meta { display: flex; gap: 10px; flex-wrap: wrap; }
                .appt-meta span { font-size: 0.78rem; color: rgba(255,255,255,0.45); }
                .appt-actions { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
                .btn-confirm { background: rgba(107,255,184,0.12); border: 1px solid rgba(107,255,184,0.3); color: #6bffb8; border-radius: 8px; padding: 7px 14px; font-family: 'Nunito', sans-serif; font-size: 0.82rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
                .btn-visit { background: rgba(107,202,255,0.12); border: 1px solid rgba(107,202,255,0.3); color: #6bcaff; border-radius: 8px; padding: 7px 14px; font-family: 'Nunito', sans-serif; font-size: 0.82rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
                .btn-noshow { background: rgba(255,149,0,0.12); border: 1px solid rgba(255,149,0,0.3); color: #ff9500; border-radius: 8px; padding: 7px 14px; font-family: 'Nunito', sans-serif; font-size: 0.82rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
                .btn-cancel-sm { background: rgba(255,107,107,0.08); border: 1px solid rgba(255,107,107,0.2); color: rgba(255,107,107,0.7); border-radius: 8px; padding: 6px 14px; font-family: 'Nunito', sans-serif; font-size: 0.78rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
                .done-label { font-size: 0.78rem; color: #6bffb8; font-weight: 700; }
                .cancelled-label { font-size: 0.78rem; color: rgba(255,107,107,0.6); font-weight: 700; }
                .noshow-label { font-size: 0.78rem; color: #ff9500; font-weight: 700; }

                .agenda-panel { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 16px; }
                .agenda-desktop { position: sticky; top: 20px; margin-top: -80px; }
                .agenda-mobile-tab { display: flex; flex-direction: column; gap: 0; }
                .agenda-mobile-tab .agenda-panel { border-radius: 16px; }
                .agenda-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
                .agenda-title-wrap { display: flex; flex-direction: column; align-items: center; gap: 4px; }
                .agenda-day-label { font-size: 0.9rem; font-weight: 900; color: #fff; text-transform: capitalize; }
                .agenda-today-btn { font-size: 0.7rem; color: #6bffb8; background: rgba(107,255,184,0.1); border: 1px solid rgba(107,255,184,0.2); border-radius: 6px; padding: 2px 8px; cursor: pointer; font-family: 'Nunito', sans-serif; font-weight: 700; }
                .agenda-nav { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); border-radius: 8px; padding: 4px 10px; cursor: pointer; font-size: 1.2rem; line-height: 1; }
                .agenda-nav:hover { background: rgba(255,255,255,0.12); }
                .agenda-date-full { font-size: 0.72rem; color: rgba(255,255,255,0.35); text-align: center; margin-bottom: 14px; text-transform: capitalize; }
                .agenda-empty { text-align: center; padding: 24px 0; display: flex; flex-direction: column; align-items: center; gap: 8px; }
                .agenda-empty span { font-size: 2rem; }
                .agenda-empty p { font-size: 0.78rem; color: rgba(255,255,255,0.3); }
                .agenda-list { display: flex; flex-direction: column; gap: 8px; }
                .agenda-item { border-left: 3px solid #6bffb8; border-radius: 0 8px 8px 0; padding: 10px 12px; background: rgba(255,255,255,0.03); display: flex; flex-direction: column; gap: 3px; transition: background 0.15s; }
                .agenda-item:hover { background: rgba(255,255,255,0.06); }
                .agenda-item-time { font-size: 0.85rem; font-weight: 900; color: #6bffb8; }
                .agenda-item-pet { font-size: 0.9rem; font-weight: 700; color: #fff; }
                .agenda-item-owner { font-size: 0.75rem; color: rgba(255,255,255,0.4); }
                .agenda-item-reason { font-size: 0.75rem; color: rgba(255,255,255,0.35); }
                .agenda-item-badge { font-size: 0.68rem; font-weight: 700; border-radius: 4px; padding: 2px 8px; align-self: flex-start; margin-top: 2px; }
                .agenda-count { font-size: 0.72rem; color: rgba(255,255,255,0.25); text-align: center; margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.06); }
                .btn-agenda-pdf { background: linear-gradient(135deg, #ef4444, #dc2626); border: none; color: #fff; border-radius: 8px; padding: 10px 12px; font-family: 'Nunito', sans-serif; font-size: 0.82rem; font-weight: 700; cursor: pointer; width: 100%; margin-bottom: 16px; display: flex; align-items: center; justify-content: center; gap: 6px; transition: opacity 0.15s; }
                .btn-agenda-pdf:hover { opacity: 0.9; }

                .pets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
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
                .pet-card-btns { display: flex; gap: 8px; }
                .btn-view-history { flex: 1; background: rgba(107,202,255,0.1); border: 1px solid rgba(107,202,255,0.25); color: #6bcaff; border-radius: 8px; padding: 8px 14px; font-family: 'Nunito', sans-serif; font-size: 0.82rem; font-weight: 700; cursor: pointer; }
                .btn-pdf { background: linear-gradient(135deg, #ef4444, #dc2626); border: none; color: #fff; border-radius: 8px; padding: 8px 12px; font-family: 'Nunito', sans-serif; font-size: 0.82rem; font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0; box-shadow: 0 4px 14px rgba(239,68,68,0.3); transition: opacity 0.15s; }
                .btn-pdf:hover { opacity: 0.9; }

                .pet-selector { margin-bottom: 20px; }
                .patients-section { display: flex; flex-direction: column; gap: 0; }
                .patients-search-wrap { margin-bottom: 20px; width: 100%; }
                .patients-search { width: 100%; padding: 12px 18px; border-radius: 12px; border: 1.5px solid rgba(255,255,255,0.10); background: rgba(255,255,255,0.06); color: #fff; font-size: 0.95rem; font-family: 'Nunito', sans-serif; outline: none; transition: border-color 0.2s; box-sizing: border-box; display: block; }
                .patients-search:focus { border-color: rgba(76,175,80,0.5); box-shadow: 0 0 0 3px rgba(76,175,80,0.1); }
                .patients-search::placeholder { color: rgba(255,255,255,0.3); }
                .selector-label { font-size: 0.8rem; color: rgba(255,255,255,0.45); font-weight: 700; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.06em; }
                .pet-chips { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
                .pet-chips::-webkit-scrollbar { display: none; }
                .pet-chip { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.10); color: rgba(255,255,255,0.5); border-radius: 20px; padding: 6px 14px; font-family: 'Nunito', sans-serif; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; flex-shrink: 0; }
                .pet-chip.active { background: rgba(107,255,184,0.12); border-color: rgba(107,255,184,0.35); color: #6bffb8; }
                .pet-summary { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px 20px; display: flex; align-items: center; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
                .summary-avatar { font-size: 2.5rem; flex-shrink: 0; width: 80px; height: 80px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.06); }
                .summary-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
                .pet-summary h3 { font-size: 1.1rem; font-weight: 900; color: #fff; margin-bottom: 4px; }
                .pet-summary p { font-size: 0.8rem; color: rgba(255,255,255,0.45); margin-top: 2px; }
                .summary-actions { display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }
                .visits-list { display: flex; flex-direction: column; gap: 14px; }
                .visit-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 18px 20px; display: flex; gap: 18px; }
                .visit-date-box { display: flex; flex-direction: column; align-items: center; background: rgba(107,202,255,0.10); border-radius: 10px; padding: 8px 12px; min-width: 52px; flex-shrink: 0; }
                .visit-day { font-size: 1.4rem; font-weight: 900; color: #6bcaff; line-height: 1; }
                .visit-month { font-size: 0.6rem; color: rgba(107,202,255,0.7); text-transform: uppercase; font-weight: 700; }
                .visit-year { font-size: 0.6rem; color: rgba(255,255,255,0.3); margin-top: 2px; }
                .visit-info { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
                .visit-top { display: flex; flex-direction: column; gap: 4px; margin-bottom: 6px; }
                .visit-reason { font-size: 1rem; font-weight: 900; color: #fff; }
                .visit-vet { font-size: 0.78rem; color: #6bcaff; font-weight: 700; }
                .visit-field { font-size: 0.85rem; color: rgba(255,255,255,0.6); line-height: 1.5; }
                .visit-field span { font-weight: 700; color: rgba(255,255,255,0.8); }
                .visit-next { font-size: 0.8rem; color: #ffd93d; font-weight: 700; margin-top: 4px; }

                .vaccines-section { display: flex; flex-direction: column; gap: 20px; }
                .vaccines-header-row { display: flex; align-items: center; gap: 16px; margin-bottom: 4px; flex-wrap: wrap; }
                .btn-add-vaccine { background: rgba(107,255,184,0.12); border: 1px solid rgba(107,255,184,0.3); color: #6bffb8; border-radius: 10px; padding: 10px 18px; font-family: 'Nunito', sans-serif; font-size: 0.88rem; font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
                .btn-sm-vaccine { background: rgba(107,255,184,0.1); border: 1px solid rgba(107,255,184,0.25); color: #6bffb8; border-radius: 8px; padding: 8px 16px; font-family: 'Nunito', sans-serif; font-size: 0.84rem; font-weight: 700; cursor: pointer; }
                .vaccine-table-wrap { overflow-x: auto; border-radius: 14px; border: 1px solid rgba(255,255,255,0.08); }
                .vaccine-table { width: 100%; border-collapse: collapse; font-size: 0.84rem; min-width: 500px; }
                .vaccine-table thead tr { background: rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.08); }
                .vaccine-table th { padding: 12px 16px; text-align: left; font-size: 0.72rem; font-weight: 900; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap; }
                .vaccine-table td { padding: 12px 16px; color: rgba(255,255,255,0.75); border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: middle; }
                .vaccine-table tbody tr:last-child td { border-bottom: none; }
                .vaccine-table tbody tr:hover td { background: rgba(255,255,255,0.02); }
                .vaccine-name { font-weight: 900; color: #fff; }
                .td-muted { color: rgba(255,255,255,0.4) !important; font-size: 0.8rem; }
                .nextdose-badge { background: rgba(107,255,184,0.1); color: #6bffb8; border-radius: 6px; padding: 2px 8px; font-size: 0.78rem; font-weight: 700; white-space: nowrap; }
                .overdue-badge { background: rgba(255,149,0,0.12); color: #ff9500; border-radius: 6px; padding: 2px 8px; font-size: 0.78rem; font-weight: 700; white-space: nowrap; }

                /* Fotos */
                .photos-section { display: flex; flex-direction: column; gap: 20px; }
                .photos-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
                .photos-title { font-family: 'Fraunces', serif; font-size: 1.4rem; font-style: italic; color: #fff; }
                .photos-subtitle { font-size: 0.82rem; color: rgba(255,255,255,0.4); margin-top: 4px; }
                .photo-upload-box { background: rgba(255,255,255,0.04); border: 1.5px dashed rgba(255,255,255,0.15); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 10px; }
                .btn-upload-photo { background: linear-gradient(135deg, #4CAF50, #66BB6A); border: none; color: #fff; border-radius: 10px; padding: 12px 24px; font-family: 'Nunito', sans-serif; font-size: 0.95rem; font-weight: 900; cursor: pointer; box-shadow: 0 4px 16px rgba(76,175,80,0.3); transition: opacity 0.15s; width: fit-content; }
                .btn-upload-photo:hover:not(:disabled) { opacity: 0.9; }
                .btn-upload-photo:disabled { opacity: 0.5; cursor: not-allowed; }
                .photos-hint { font-size: 0.75rem; color: rgba(255,255,255,0.3); }
                .photos-limit-notice { background: rgba(107,255,184,0.08); border: 1px solid rgba(107,255,184,0.2); color: #6bffb8; padding: 12px 16px; border-radius: 12px; font-size: 0.88rem; font-weight: 700; }
                .photos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
                .photo-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; }
                .photo-card img { width: 100%; height: 160px; object-fit: cover; display: block; }
                .photo-caption { font-size: 0.8rem; color: rgba(255,255,255,0.5); padding: 8px 12px; }
                .btn-delete-photo { background: rgba(255,107,107,0.08); border: none; border-top: 1px solid rgba(255,255,255,0.06); color: rgba(255,107,107,0.7); padding: 10px; font-family: 'Nunito', sans-serif; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: background 0.2s; width: 100%; }
                .btn-delete-photo:hover { background: rgba(255,107,107,0.15); }

                /* Mi Agenda */
                .schedule-section { display: flex; flex-direction: column; gap: 16px; }
                .schedule-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
                .schedule-card-title { font-size: 0.95rem; font-weight: 900; color: rgba(255,255,255,0.7); }
                .days-grid { display: flex; flex-wrap: wrap; gap: 8px; }
                .day-btn { background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.10); color: rgba(255,255,255,0.4); border-radius: 10px; padding: 8px 14px; font-family: 'Nunito', sans-serif; font-size: 0.88rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
                .day-btn.active { background: rgba(76,175,80,0.15); border-color: rgba(76,175,80,0.4); color: #4CAF50; }
                .day-hours-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .day-hours-row:last-child { border-bottom: none; }
                .day-hours-label { font-size: 0.88rem; font-weight: 700; color: rgba(255,255,255,0.6); min-width: 90px; }
                .day-hours-inputs { display: flex; align-items: center; gap: 8px; }
                .day-hours-inputs input { background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.10); border-radius: 8px; color: #fff; padding: 7px 10px; font-family: 'Nunito', sans-serif; font-size: 0.88rem; outline: none; width: 110px; }
                .duration-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .duration-row:last-child { border-bottom: none; }
                .duration-label { font-size: 0.88rem; color: rgba(255,255,255,0.6); }
                .duration-row select { background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.10); border-radius: 8px; color: #fff; padding: 7px 10px; font-family: 'Nunito', sans-serif; font-size: 0.88rem; outline: none; cursor: pointer; }
                .duration-row select option { background: #1a1a2e; }
                .btn-save-schedule { background: linear-gradient(135deg, #4CAF50, #66BB6A); border: none; color: #fff; border-radius: 12px; padding: 13px 24px; font-family: 'Nunito', sans-serif; font-size: 0.95rem; font-weight: 900; cursor: pointer; box-shadow: 0 4px 16px rgba(76,175,80,0.3); transition: opacity 0.15s; }
                .btn-save-schedule:disabled { opacity: 0.6; cursor: not-allowed; }

                /* Modales */
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(6px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; }
                .modal { background: #1e1e35; border: 1px solid rgba(255,255,255,0.10); border-radius: 24px; padding: 28px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; animation: modalIn 0.3s cubic-bezier(.22,.68,0,1.2) both; }
                @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 10px; }
                .modal-header h2 { font-family: 'Fraunces', serif; font-size: 1.4rem; font-style: italic; color: #fff; flex: 1; min-width: 0; }
                .modal-close { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); border-radius: 8px; padding: 6px 10px; cursor: pointer; flex-shrink: 0; min-width: 36px; min-height: 36px; display: flex; align-items: center; justify-content: center; }
                .form-error { background: rgba(255,107,107,0.15); border: 1px solid rgba(255,107,107,0.4); color: #ff9999; padding: 10px 14px; border-radius: 10px; font-size: 0.86rem; margin-bottom: 16px; }
                .visit-form { display: flex; flex-direction: column; gap: 20px; }
                .form-section { display: flex; flex-direction: column; gap: 12px; }
                .section-title { font-size: 0.85rem; font-weight: 900; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.06em; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.06); }
                .form-row { display: flex; gap: 12px; }
                .form-group { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; }
                .form-group label { font-size: 0.76rem; font-weight: 700; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.06em; }
                .form-group input, .form-group textarea, .form-group select { background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.10); border-radius: 10px; color: #fff; padding: 10px 14px; font-family: 'Nunito', sans-serif; font-size: 0.9rem; outline: none; transition: border-color 0.2s; width: 100%; }
                .form-group select option { background: #1a1a2e; }
                .form-group input:focus, .form-group textarea:focus, .form-group select:focus { border-color: #6bffb8; box-shadow: 0 0 0 3px rgba(107,255,184,0.10); }
                .form-group textarea { resize: vertical; }
                .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }
                .btn-ghost { background: transparent; border: 1.5px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.5); border-radius: 10px; padding: 11px 20px; font-family: 'Nunito', sans-serif; font-weight: 700; cursor: pointer; }
                .btn-primary { background: linear-gradient(135deg, #4CAF50, #FF9800); color: #fff; border: none; border-radius: 10px; padding: 11px 22px; font-family: 'Nunito', sans-serif; font-size: 0.95rem; font-weight: 900; cursor: pointer; box-shadow: 0 4px 16px rgba(76,175,80,0.3); }
                .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

                .clinical-photos-upload { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
                .btn-upload-clinical { background: rgba(107,202,255,0.12); border: 1px solid rgba(107,202,255,0.3); color: #6bcaff; border-radius: 10px; padding: 10px 18px; font-family: 'Nunito', sans-serif; font-size: 0.88rem; font-weight: 700; cursor: pointer; width: fit-content; transition: opacity 0.15s; }
                .btn-upload-clinical:disabled { opacity: 0.5; cursor: not-allowed; }
                .clinical-photos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
                .clinical-photo-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
                .clinical-photo-card img { width: 100%; height: 150px; object-fit: cover; display: block; }
                .clinical-photo-caption { font-size: 0.8rem; color: rgba(255,255,255,0.6); padding: 8px 12px 4px; font-weight: 700; }
                .clinical-photo-clinic { font-size: 0.75rem; color: rgba(255,255,255,0.35); padding: 0 12px 8px; }
                .btn-delete-clinical { background: rgba(255,107,107,0.08); border: none; border-top: 1px solid rgba(255,255,255,0.06); color: rgba(255,107,107,0.7); padding: 8px; font-family: 'Nunito', sans-serif; font-size: 0.82rem; font-weight: 700; cursor: pointer; width: 100%; transition: background 0.2s; }
                .btn-delete-clinical:hover { background: rgba(255,107,107,0.15); }

                @media (max-width: 1100px) {
                    .vet-header { grid-template-columns: 1fr; }
                    .vet-header-bg { display: none; }
                    .vet-header-right { align-items: stretch; }
                    .vet-features { grid-template-columns: repeat(2, 1fr); }
                    .patients-stats { grid-template-columns: repeat(2, 1fr); }
                    .patients-filters { grid-template-columns: 1fr; }
                    .pcard-actions { grid-template-columns: repeat(2, 1fr); }
                    .fotos-header { grid-template-columns: 1fr; text-align: left; }
                    .fotos-illu { display: none; }
                    .fotos-grid-v2 { grid-template-columns: repeat(3, 1fr); }
                    .fotos-tip { grid-template-columns: auto 1fr; }
                    .fotos-tip .tip-desk-svg { display: none; }
                }
                @media (max-width: 800px) {
                    .vet-stats { grid-template-columns: repeat(2, 1fr); gap: 10px; }
                    .stat-icon { font-size: 1.5rem; }
                    .stat-num { font-size: 1.4rem; }
                    .vet-title { font-size: 1.9rem; }
                    .vet-features { gap: 12px; }
                }
                @media (max-width: 700px) {
                    .vet-inner { padding: 16px 14px; }
                    .vet-title { font-size: 1.55rem; }
                    .vet-header { margin-bottom: 16px; padding: 8px 4px 16px; }
                    .vet-features { grid-template-columns: 1fr; }
                    .feature-item { padding: 12px; }
                    .tab-btn { font-size: 0.78rem; padding: 8px 10px; }
                    .patients-stats { grid-template-columns: 1fr; }
                    .pstat { padding: 16px 18px; }
                    .pstat-num { font-size: 1.9rem; }
                    .pcard-top { flex-direction: column; align-items: stretch; }
                    .pcard-photo { width: 100%; height: 200px; }
                    .pcard-main-chips { grid-template-columns: 1fr; }
                    .pcard-actions { grid-template-columns: 1fr; }
                    .pbtn { font-size: 0.82rem; padding: 12px; }
                    .fotos-title { font-size: 1.6rem; }
                    .fotos-dropzone { padding: 28px 18px 22px; }
                    .dropzone-title { font-size: 1.2rem; }
                    .dropzone-circle { width: 70px; height: 70px; }
                    .dropzone-arrow { font-size: 1.8rem; }
                    .fotos-grid-v2 { grid-template-columns: repeat(2, 1fr); gap: 12px; }
                    .vet-stats { grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 14px; }
                    .vet-stat { padding: 14px 16px; border-radius: 14px; gap: 10px; }
                    .stat-icon-wrap { width: 42px; height: 42px; border-radius: 12px; }
                    .stat-icon { font-size: 1.2rem; }
                    .stat-num { font-size: 1.6rem; }
                    .stat-label { font-size: 0.72rem; }
                    .vet-stat .stat-deco { font-size: 3.5rem; }
                    .filter-btn { padding: 8px 16px; font-size: 0.8rem; }
                    .turnos-layout { grid-template-columns: 1fr; gap: 0; }
                    .appt-card { padding: 12px; border-radius: 14px; gap: 10px; }
                    .appt-date-box { min-width: 42px; padding: 6px 8px; }
                    .appt-day { font-size: 1.1rem; }
                    .agenda-mobile-tab { padding: 4px 0; }
                    .pets-grid { grid-template-columns: 1fr; gap: 12px; }
                    .visit-card { flex-direction: column; gap: 12px; padding: 14px; border-radius: 14px; }
                    .visit-date-box { flex-direction: row; align-items: center; gap: 8px; min-width: unset; width: fit-content; padding: 6px 12px; border-radius: 8px; }
                    .visit-day { font-size: 1.1rem; }
                    .visit-month { font-size: 0.7rem; }
                    .visit-year { font-size: 0.7rem; margin-top: 0; margin-left: 4px; }
                    .pet-summary { flex-direction: column; align-items: flex-start; padding: 14px; }
                    .summary-actions { width: 100%; }
                    .summary-actions .btn-visit, .summary-actions .btn-pdf { flex: 1; text-align: center; }
                    .vaccines-header-row { flex-direction: column; align-items: flex-start; }
                    .btn-add-vaccine { width: 100%; text-align: center; }
                    .photos-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
                    .photo-card img { height: 120px; }
                    .days-grid { gap: 6px; }
                    .day-btn { padding: 7px 10px; font-size: 0.82rem; }
                    .day-hours-row { flex-direction: column; align-items: flex-start; gap: 6px; }
                    .duration-row { flex-direction: column; align-items: flex-start; gap: 6px; }
                    .modal-overlay { padding: 0; align-items: flex-end; }
                    .modal { border-radius: 24px 24px 0 0; padding: 24px 16px; max-height: 92vh; border-bottom: none; }
                    .modal-header h2 { font-size: 1.15rem; }
                    .form-row { flex-direction: column; gap: 10px; }
                    .form-actions { flex-direction: column-reverse; gap: 8px; }
                    .form-actions .btn-ghost, .form-actions .btn-primary { width: 100%; text-align: center; padding: 13px; }
                }
                @media (max-width: 380px) {
                    .vet-inner { padding: 12px 10px; }
                    .vet-title { font-size: 1.2rem; }
                    .tab-btn { font-size: 0.7rem; padding: 7px 8px; }
                    .stat-num { font-size: 1.1rem; }
                    .photos-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}
// ── Ilustración SVG del perro al fondo del header ──
function DogIllustration() {
    return (
        <svg className="dog-svg" viewBox="0 0 420 280" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
                <linearGradient id="dogLine" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#4CAF50" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#66BB6A" stopOpacity="0.25" />
                </linearGradient>
            </defs>
            <g fill="none" stroke="url(#dogLine)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {/* cuerpo */}
                <path d="M 120 200 Q 130 130 200 130 Q 280 130 290 200 L 290 230 L 120 230 Z" />
                {/* cabeza */}
                <ellipse cx="160" cy="105" rx="50" ry="42" />
                {/* orejas */}
                <path d="M 130 80 Q 115 50 125 95" />
                <path d="M 190 80 Q 205 50 195 95" />
                {/* hocico */}
                <path d="M 140 120 Q 145 135 165 132" />
                <circle cx="142" cy="115" r="2" fill="#4CAF50" stroke="none" />
                <circle cx="178" cy="115" r="2" fill="#4CAF50" stroke="none" />
                <path d="M 158 132 Q 162 138 168 132" />
                {/* patas */}
                <line x1="150" y1="230" x2="150" y2="255" />
                <line x1="180" y1="230" x2="180" y2="255" />
                <line x1="240" y1="230" x2="240" y2="255" />
                <line x1="270" y1="230" x2="270" y2="255" />
                {/* cola */}
                <path d="M 290 200 Q 320 180 315 150" />
                {/* arbolitos atrás */}
                <path d="M 80 230 L 80 200 M 70 215 L 80 200 L 90 215 M 75 220 L 85 220" opacity="0.6" />
                <path d="M 340 230 L 340 195 M 328 212 L 340 195 L 352 212 M 333 218 L 347 218" opacity="0.6" />
                <path d="M 360 230 L 360 205 M 352 218 L 360 205 L 368 218" opacity="0.5" />
                {/* estrellitas decorativas */}
                <circle cx="80" cy="60" r="1.2" fill="#FFB74D" stroke="none" />
                <circle cx="380" cy="50" r="1.2" fill="#66BB6A" stroke="none" />
                <circle cx="350" cy="120" r="1.5" fill="#6bcaff" stroke="none" />
                <circle cx="50" cy="130" r="1.2" fill="#FFB74D" stroke="none" />
                <circle cx="395" cy="180" r="1.5" fill="#a78bfa" stroke="none" />
            </g>
        </svg>
    );
}

// ── Fondo con partículas/estrellas ──
function StarsBackground() {
    return (
        <svg className="stars-bg" viewBox="0 0 1400 900" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
            {/* partículas verdes */}
            <circle cx="80" cy="120" r="1.4" fill="#4CAF50" opacity="0.7" />
            <circle cx="1280" cy="80" r="1.6" fill="#66BB6A" opacity="0.6" />
            <circle cx="450" cy="200" r="1" fill="#4CAF50" opacity="0.5" />
            <circle cx="900" cy="280" r="1.4" fill="#66BB6A" opacity="0.7" />
            <circle cx="60" cy="500" r="1.2" fill="#4CAF50" opacity="0.55" />
            <circle cx="1340" cy="620" r="1.4" fill="#66BB6A" opacity="0.65" />
            <circle cx="700" cy="780" r="1.2" fill="#4CAF50" opacity="0.5" />
            {/* partículas naranjas */}
            <circle cx="200" cy="40" r="1.3" fill="#FFB74D" opacity="0.7" />
            <circle cx="1100" cy="160" r="1.5" fill="#FF9800" opacity="0.6" />
            <circle cx="320" cy="850" r="1.4" fill="#FFB74D" opacity="0.65" />
            <circle cx="1380" cy="420" r="1.2" fill="#FF9800" opacity="0.55" />
            <circle cx="40" cy="380" r="1.1" fill="#FFB74D" opacity="0.5" />
            {/* partículas azules */}
            <circle cx="600" cy="60" r="1.3" fill="#6bcaff" opacity="0.6" />
            <circle cx="780" cy="500" r="1.1" fill="#6bcaff" opacity="0.5" />
            <circle cx="1180" cy="780" r="1.5" fill="#6bcaff" opacity="0.7" />
            <circle cx="20" cy="700" r="1.2" fill="#6bcaff" opacity="0.55" />
            {/* partículas violetas */}
            <circle cx="380" cy="650" r="1.4" fill="#a78bfa" opacity="0.6" />
            <circle cx="950" cy="120" r="1.2" fill="#a78bfa" opacity="0.55" />
            <circle cx="1050" cy="700" r="1.5" fill="#a78bfa" opacity="0.65" />
            <circle cx="220" cy="320" r="1.1" fill="#a78bfa" opacity="0.5" />
            {/* estrellas con brillo */}
            <g className="star-twinkle">
                <path d="M 150 250 L 152 248 L 154 250 L 152 252 Z" fill="#FFB74D" opacity="0.7" />
                <path d="M 1200 350 L 1202 348 L 1204 350 L 1202 352 Z" fill="#66BB6A" opacity="0.7" />
                <path d="M 500 580 L 502 578 L 504 580 L 502 582 Z" fill="#6bcaff" opacity="0.6" />
                <path d="M 850 720 L 852 718 L 854 720 L 852 722 Z" fill="#FFB74D" opacity="0.7" />
                <path d="M 300 750 L 302 748 L 304 750 L 302 752 Z" fill="#a78bfa" opacity="0.6" />
            </g>
        </svg>
    );
}

// ── Calendario sonriente con hojitas (empty state grande) ──
function CalendarIllustration() {
    return (
        <svg className="cal-illu" viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
                <linearGradient id="calBody" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3a4d6b" />
                    <stop offset="100%" stopColor="#26334a" />
                </linearGradient>
                <radialGradient id="calGlow" cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0%" stopColor="rgba(76,175,80,0.3)" />
                    <stop offset="100%" stopColor="rgba(76,175,80,0)" />
                </radialGradient>
            </defs>
            {/* glow detrás */}
            <ellipse cx="110" cy="120" rx="110" ry="60" fill="url(#calGlow)" />
            {/* hojitas izquierda */}
            <g opacity="0.7" fill="#4CAF50">
                <ellipse cx="58" cy="158" rx="9" ry="5" transform="rotate(-30 58 158)" />
                <ellipse cx="42" cy="170" rx="8" ry="4" transform="rotate(-45 42 170)" />
                <ellipse cx="70" cy="174" rx="7" ry="4" transform="rotate(15 70 174)" />
            </g>
            {/* hojita derecha */}
            <g opacity="0.7" fill="#4CAF50">
                <ellipse cx="178" cy="174" rx="8" ry="4" transform="rotate(35 178 174)" />
            </g>
            {/* cuerpo calendario */}
            <rect x="70" y="60" width="100" height="92" rx="10" fill="url(#calBody)" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
            {/* franja superior */}
            <rect x="70" y="60" width="100" height="22" rx="10" fill="#1b2840" />
            <rect x="70" y="74" width="100" height="8" fill="#1b2840" />
            {/* anillas */}
            <rect x="84" y="50" width="6" height="18" rx="2" fill="#5a6b8a" />
            <rect x="150" y="50" width="6" height="18" rx="2" fill="#5a6b8a" />
            {/* contenido */}
            <rect x="80" y="92" width="36" height="22" rx="4" fill="rgba(255,255,255,0.08)" />
            <rect x="124" y="92" width="36" height="22" rx="4" fill="rgba(255,255,255,0.08)" />
            <rect x="80" y="120" width="36" height="22" rx="4" fill="rgba(255,255,255,0.08)" />
            <rect x="124" y="120" width="36" height="22" rx="4" fill="rgba(255,255,255,0.08)" />
            {/* círculo verde con check (día con turno) */}
            <circle cx="142" cy="131" r="14" fill="#4CAF50" />
            <path d="M 137 131 L 141 135 L 148 127" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            {/* estrellitas decorativas */}
            <g fill="#FFB74D" opacity="0.85">
                <path d="M 50 70 L 51 67 L 52 70 L 55 71 L 52 72 L 51 75 L 50 72 L 47 71 Z" />
                <path d="M 192 90 L 193 87 L 194 90 L 197 91 L 194 92 L 193 95 L 192 92 L 189 91 Z" />
            </g>
            <g fill="#a78bfa" opacity="0.75">
                <path d="M 195 55 L 196 53 L 197 55 L 199 56 L 197 57 L 196 59 L 195 57 L 193 56 Z" />
                <path d="M 38 110 L 39 108 L 40 110 L 42 111 L 40 112 L 39 114 L 38 112 L 36 111 Z" />
            </g>
        </svg>
    );
}

// ── Calendario sonriente chico (para sidebar derecha "Hoy") ──
function CalendarSmileIllustration() {
    return (
        <svg className="cal-smile" viewBox="0 0 140 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            {/* cuerpo */}
            <rect x="32" y="30" width="76" height="68" rx="8" fill="#3a4d6b" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
            <rect x="32" y="30" width="76" height="16" rx="8" fill="#1b2840" />
            <rect x="32" y="40" width="76" height="6" fill="#1b2840" />
            {/* anillas */}
            <rect x="44" y="22" width="5" height="14" rx="2" fill="#5a6b8a" />
            <rect x="91" y="22" width="5" height="14" rx="2" fill="#5a6b8a" />
            {/* ojos */}
            <circle cx="56" cy="64" r="3.5" fill="#fff" />
            <circle cx="84" cy="64" r="3.5" fill="#fff" />
            {/* sonrisa */}
            <path d="M 56 78 Q 70 88 84 78" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* estrellitas */}
            <g fill="#FFB74D" opacity="0.75">
                <path d="M 22 28 L 23 25 L 24 28 L 27 29 L 24 30 L 23 33 L 22 30 L 19 29 Z" />
                <path d="M 118 40 L 119 37 L 120 40 L 123 41 L 120 42 L 119 45 L 118 42 L 115 41 Z" />
            </g>
            <g fill="#4CAF50" opacity="0.7">
                <path d="M 18 90 L 19 87 L 20 90 L 23 91 L 20 92 L 19 95 L 18 92 L 15 91 Z" />
            </g>
            <g fill="#a78bfa" opacity="0.75">
                <path d="M 122 95 L 123 92 L 124 95 L 127 96 L 124 97 L 123 100 L 122 97 L 119 96 Z" />
            </g>
        </svg>
    );
}

// ── Ilustración de cámara + fotos para el header de Fotos ──
function FotosIllustration() {
    return (
        <svg viewBox="0 0 340 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
                <linearGradient id="fotosCam" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6bcaff" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#4CAF50" stopOpacity="0.25" />
                </linearGradient>
            </defs>
            <g fill="none" stroke="url(#fotosCam)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
                {/* Foto izquierda (rotada) */}
                <g transform="translate(35, 90) rotate(-14)">
                    <rect x="0" y="0" width="90" height="66" rx="4" />
                    <path d="M 8 50 L 26 32 L 40 44 L 58 26 L 82 50" />
                    <circle cx="66" cy="20" r="4" />
                </g>
                {/* Cámara central grande */}
                <g transform="translate(120, 45)">
                    <rect x="0" y="15" width="150" height="110" rx="10" />
                    <path d="M 30 15 L 40 5 L 90 5 L 100 15" />
                    <circle cx="75" cy="72" r="34" />
                    <circle cx="75" cy="72" r="22" strokeWidth="2" />
                    <circle cx="120" cy="35" r="3" fill="#6bcaff" stroke="none" opacity="0.7" />
                </g>
                {/* Foto derecha (rotada al otro lado) */}
                <g transform="translate(240, 100) rotate(14)">
                    <rect x="0" y="0" width="80" height="60" rx="4" />
                    <path d="M 8 45 L 22 28 L 36 40 L 54 24 L 74 42" />
                    <circle cx="58" cy="17" r="4" />
                </g>
            </g>
            {/* Estrellitas decorativas */}
            <g fill="#FFB74D" opacity="0.85">
                <path d="M 60 40 L 62 34 L 64 40 L 70 42 L 64 44 L 62 50 L 60 44 L 54 42 Z" />
                <path d="M 280 45 L 282 39 L 284 45 L 290 47 L 284 49 L 282 55 L 280 49 L 274 47 Z" />
            </g>
            <g fill="#a78bfa" opacity="0.75">
                <path d="M 195 30 L 197 25 L 199 30 L 204 32 L 199 34 L 197 39 L 195 34 L 190 32 Z" />
                <path d="M 310 155 L 312 150 L 314 155 L 319 157 L 314 159 L 312 164 L 310 159 L 305 157 Z" />
            </g>
        </svg>
    );
}

// ── Ilustración del mostrador/escritorio para el Tip ──
function TipDeskIllustration() {
    return (
        <svg className="tip-desk-svg" viewBox="0 0 340 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <g fill="none" stroke="rgba(76,175,80,0.45)" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
                {/* Mesa horizontal */}
                <line x1="10" y1="70" x2="330" y2="70" strokeWidth="2" />
                {/* Monitor izquierda */}
                <rect x="30" y="30" width="42" height="30" rx="2" />
                <line x1="45" y1="60" x2="57" y2="60" />
                <line x1="51" y1="60" x2="51" y2="70" />
                {/* Teclado */}
                <rect x="30" y="63" width="42" height="4" rx="1" />
                {/* Libros/Portapapeles */}
                <rect x="100" y="46" width="24" height="24" rx="2" />
                <line x1="108" y1="52" x2="120" y2="52" />
                <line x1="108" y1="58" x2="120" y2="58" />
                <line x1="108" y1="64" x2="116" y2="64" />
                {/* Perro / mascota mediano */}
                <g transform="translate(140, 40)">
                    <ellipse cx="18" cy="20" rx="15" ry="10" />
                    <circle cx="30" cy="14" r="6" />
                    <line x1="27" y1="9" x2="24" y2="4" />
                    <line x1="33" y1="9" x2="36" y2="4" />
                    <line x1="10" y1="30" x2="10" y2="35" />
                    <line x1="26" y1="30" x2="26" y2="35" />
                </g>
                {/* Planta */}
                <g transform="translate(200, 32)">
                    <rect x="8" y="24" width="18" height="14" rx="2" />
                    <path d="M 17 24 Q 12 12 6 8 M 17 24 Q 22 12 28 8 M 17 24 L 17 6" />
                </g>
                {/* Reloj / cuadro */}
                <circle cx="260" cy="45" r="12" />
                <line x1="260" y1="40" x2="260" y2="45" />
                <line x1="260" y1="45" x2="264" y2="47" />
                {/* Botella */}
                <g transform="translate(290, 35)">
                    <rect x="0" y="10" width="14" height="25" rx="2" />
                    <line x1="5" y1="10" x2="5" y2="5" />
                    <line x1="9" y1="10" x2="9" y2="5" />
                </g>
            </g>
            {/* Detalles pequeños */}
            <circle cx="90" cy="42" r="1.5" fill="#FFB74D" opacity="0.7" />
            <circle cx="235" cy="38" r="1.5" fill="#6bcaff" opacity="0.7" />
        </svg>
    );
}
