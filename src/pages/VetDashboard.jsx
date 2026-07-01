import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAppointments,
  confirmAppointment,
  cancelAppointment,
  createVisit,
  markNoShow,
} from "../services/api";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const STATUS = {
  pending: { label: "Pendiente", icon: "📅", className: "pending" },
  confirmed: { label: "Confirmado", icon: "✅", className: "confirmed" },
  completed: { label: "Realizado", icon: "📋", className: "completed" },
  cancelled: { label: "Cancelado", icon: "✕", className: "cancelled" },
  no_show: { label: "Ausente", icon: "✕", className: "noshow" },
};

const EMPTY_VISIT = {
  pet: "",
  clinic: "",
  date: "",
  reason: "",
  diagnosis: "",
  treatment: "",
  observations: "",
  next_visit: "",
  vet_name: "",
  vet_lastname: "",
  vet_license: "",
  vet_clinic_name: "",
};

const EMPTY_VACCINE = {
  pet: "",
  name: "",
  date_applied: "",
  next_dose: "",
  batch: "",
  notes: "",
  vet_first_name: "",
  vet_last_name: "",
  vet_license: "",
  vet_clinic_name: "",
};

const EMPTY_SCHEDULE = {
  working_days: [],
  day_hours: {},
  duration_control: 30,
  duration_vaccine: 20,
  duration_surgery: 90,
  duration_other: 30,
  interval_minutes: 10,
  cancel_limit_hours: 4,
};

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DAY_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const SPECIES_ICON = {
  dog: "🐶",
  cat: "🐱",
  rabbit: "🐰",
  bird: "🦜",
  hamster: "🐹",
  reptile: "🦎",
  fish: "🐠",
  other: "🐾",
};

const appointmentTypeOptions = [
  { value: "control", label: "Control general" },
  { value: "vaccine", label: "Vacunación" },
  { value: "surgery", label: "Cirugía" },
  { value: "other", label: "Otro" },
];

const asArray = (data) => data?.results ?? data?.data?.results ?? data?.data ?? data ?? [];
const todayISODate = () => new Date().toISOString().slice(0, 10);
const nowLocalInput = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

function formatDate(value, opts = {}) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-AR", opts);
}

function formatTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function getAge(birthDate) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

function VetBackground() {
  return (
    <div className="vp-bg" aria-hidden="true">
      <span className="orb orb-a" />
      <span className="orb orb-b" />
      <span className="light l1" />
      <span className="light l2" />
      <span className="light l3" />
      <span className="light l4" />
      <span className="star s1">+</span>
      <span className="star s2">+</span>
      <span className="star s3">+</span>
      <span className="star s4">+</span>
    </div>
  );
}

export default function ClinicDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("turnos");
  const [appointments, setAppointments] = useState([]);
  const [pets, setPets] = useState([]);
  const [visits, setVisits] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [schedule, setSchedule] = useState(EMPTY_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [filter, setFilter] = useState("pending");
  const [agendaDate, setAgendaDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPet, setSelectedPet] = useState(null);
  const [visitForm, setVisitForm] = useState(EMPTY_VISIT);
  const [vaccineForm, setVaccineForm] = useState(EMPTY_VACCINE);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showVaccineModal, setShowVaccineModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoCaption, setPhotoCaption] = useState("");
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [externalSaving, setExternalSaving] = useState(false);
  const [externalForm, setExternalForm] = useState({
    requested_date: "",
    appointment_type: "control",
    external_label: "",
  });
  const [clinicalPhotos, setClinicalPhotos] = useState([]);
  const [clinicalPhotoCaption, setClinicalPhotoCaption] = useState("");
  const [clinicalPhotoUploading, setClinicalPhotoUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [highlightedAppt, setHighlightedAppt] = useState(null);
  const fileInputRef = useRef(null);
  const clinicalFileInputRef = useRef(null);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    window.clearTimeout(showMessage._t);
    showMessage._t = window.setTimeout(() => setMessage({ type: "", text: "" }), 3800);
  };

  useEffect(() => {
    fetchAll();
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
      setAppointments(asArray(apptData));
      setPets(asArray(petData));
      setVisits(asArray(visitData));
      setVaccines(asArray(vaccineData));
    } catch (error) {
      console.error(error);
      showMessage("error", "No se pudo cargar la información del panel.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotos = async () => {
    setPhotosLoading(true);
    try {
      const { data } = await api.get("/clinic-photos/list/");
      setPhotos(asArray(data));
    } catch (error) {
      console.error(error);
      showMessage("error", "No se pudieron cargar las fotos del local.");
    } finally {
      setPhotosLoading(false);
    }
  };

  const fetchClinicalPhotos = async (petId) => {
    try {
      const { data } = await api.get(`/clinical-photos/list/?pet=${petId}`);
      setClinicalPhotos(asArray(data));
    } catch (error) {
      console.error(error);
      setClinicalPhotos([]);
    }
  };

  const fetchSchedule = async () => {
    setScheduleLoading(true);
    try {
      const { data } = await api.get("/clinic-schedule/me/");
      const normalized = { ...EMPTY_SCHEDULE, ...data };
      if (!normalized.day_hours || Object.keys(normalized.day_hours).length === 0) {
        normalized.day_hours = Object.fromEntries(
          (normalized.working_days || []).map((day) => [String(day), { open: "09:00", close: "18:00" }])
        );
      }
      setSchedule(normalized);
    } catch (error) {
      setSchedule(EMPTY_SCHEDULE);
    } finally {
      setScheduleLoading(false);
    }
  };

  const statusCounts = useMemo(() => ({
    pending: appointments.filter((a) => a.status === "pending").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    no_show: appointments.filter((a) => a.status === "no_show").length,
  }), [appointments]);

  const filteredAppointments = useMemo(() => {
    if (filter === "all") return appointments;
    return appointments.filter((a) => a.status === filter);
  }, [appointments, filter]);

  const agendaTurnos = useMemo(() => {
    return appointments
      .filter((appt) => {
        const d = new Date(appt.requested_date);
        return (
          d.getFullYear() === agendaDate.getFullYear() &&
          d.getMonth() === agendaDate.getMonth() &&
          d.getDate() === agendaDate.getDate() &&
          appt.status !== "cancelled"
        );
      })
      .sort((a, b) => new Date(a.requested_date) - new Date(b.requested_date));
  }, [appointments, agendaDate]);

  const patientStats = useMemo(() => {
    const now = new Date();
    const next60 = new Date();
    next60.setDate(next60.getDate() + 60);
    const reminders = vaccines.filter((v) => {
      if (!v.next_dose) return false;
      const d = new Date(v.next_dose);
      return d >= now && d <= next60;
    }).length;
    const withHistory = pets.filter((pet) => visits.some((v) => v.pet === pet.id) || vaccines.some((v) => v.pet === pet.id)).length;
    return { total: pets.length, active: withHistory, reminders, vaccines: vaccines.length };
  }, [pets, visits, vaccines]);

  const filteredPets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return pets;
    return pets.filter((pet) => {
      return (
        pet.name?.toLowerCase().includes(q) ||
        pet.owner_name?.toLowerCase().includes(q) ||
        pet.breed?.toLowerCase().includes(q) ||
        pet.species_display?.toLowerCase().includes(q)
      );
    });
  }, [pets, searchQuery]);

  const currentPetVisits = selectedPet ? visits.filter((v) => v.pet === selectedPet.id) : [];
  const currentPetVaccines = selectedPet ? vaccines.filter((v) => v.pet === selectedPet.id) : [];

  const changeAgendaDay = (amount) => {
    const next = new Date(agendaDate);
    next.setDate(next.getDate() + amount);
    setAgendaDate(next);
  };

  const handleConfirm = async (id) => {
    try {
      await confirmAppointment(id);
      await fetchAll();
      showMessage("success", "Turno confirmado.");
    } catch (error) {
      console.error(error);
      showMessage("error", "No se pudo confirmar el turno.");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("¿Querés cancelar este turno?")) return;
    try {
      await cancelAppointment(id);
      await fetchAll();
      showMessage("success", "Turno cancelado.");
    } catch (error) {
      console.error(error);
      showMessage("error", "No se pudo cancelar el turno.");
    }
  };

  const handleNoShow = async (id) => {
    try {
      await markNoShow(id);
      await fetchAll();
      showMessage("success", "Turno marcado como ausente.");
    } catch (error) {
      console.error(error);
      showMessage("error", "No se pudo marcar como ausente.");
    }
  };

  const openVisitModal = (apptOrPet) => {
    const isAppointment = Boolean(apptOrPet?.requested_date || apptOrPet?.clinic);
    setVisitForm({
      ...EMPTY_VISIT,
      pet: isAppointment ? apptOrPet.pet || "" : apptOrPet.id || "",
      clinic: isAppointment ? apptOrPet.clinic || "" : "",
      date: nowLocalInput(),
      reason: isAppointment ? apptOrPet.reason || "" : "",
    });
    setShowVisitModal(true);
  };

  const handleVisitSubmit = async (event) => {
    event.preventDefault();
    if (!visitForm.pet) return showMessage("error", "Falta seleccionar el paciente.");
    if (!visitForm.vet_name || !visitForm.vet_lastname || !visitForm.vet_license) return showMessage("error", "Nombre, apellido y matrícula son obligatorios.");
    if (!visitForm.diagnosis) return showMessage("error", "El diagnóstico es obligatorio.");
    setSaving(true);
    try {
      await createVisit({
        pet: visitForm.pet,
        clinic: visitForm.clinic || undefined,
        date: visitForm.date,
        reason: visitForm.reason,
        diagnosis: visitForm.diagnosis,
        treatment: visitForm.treatment,
        observations: visitForm.observations,
        next_visit: visitForm.next_visit || null,
        vet_first_name: visitForm.vet_name,
        vet_last_name: visitForm.vet_lastname,
        vet_license: visitForm.vet_license,
        vet_clinic_name: visitForm.vet_clinic_name,
      });
      setShowVisitModal(false);
      await fetchAll();
      showMessage("success", "Atención registrada.");
    } catch (error) {
      console.error(error);
      const data = error.response?.data;
      showMessage("error", data ? Object.values(data).flat().join(" ") : "No se pudo guardar la atención.");
    } finally {
      setSaving(false);
    }
  };

  const openVaccineModal = (pet) => {
    setVaccineForm({ ...EMPTY_VACCINE, pet: pet.id, date_applied: todayISODate() });
    setShowVaccineModal(true);
  };

  const handleVaccineSubmit = async (event) => {
    event.preventDefault();
    if (!vaccineForm.pet) return showMessage("error", "Falta seleccionar el paciente.");
    if (!vaccineForm.name) return showMessage("error", "El nombre de la vacuna es obligatorio.");
    if (!vaccineForm.vet_first_name || !vaccineForm.vet_last_name || !vaccineForm.vet_license) return showMessage("error", "Nombre, apellido y matrícula son obligatorios.");
    setSaving(true);
    try {
      await api.post("/vaccines/", {
        ...vaccineForm,
        next_dose: vaccineForm.next_dose || null,
      });
      setShowVaccineModal(false);
      await fetchAll();
      showMessage("success", "Vacuna registrada.");
    } catch (error) {
      console.error(error);
      const data = error.response?.data;
      showMessage("error", data ? Object.values(data).flat().join(" ") : "No se pudo guardar la vacuna.");
    } finally {
      setSaving(false);
    }
  };

  const downloadPetPDF = async (pet) => {
    try {
      const response = await api.get(`/pets/${pet.id}/pdf/`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `historial_${pet.name}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      showMessage("error", "No se pudo descargar el PDF.");
    }
  };

  const downloadAgendaPDF = async () => {
    try {
      const dateStr = agendaDate.toISOString().slice(0, 10);
      const response = await api.get(`/appointments/agenda_pdf/?date=${dateStr}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `agenda_${dateStr}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      showMessage("error", "No se pudo descargar la agenda.");
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) return showMessage("error", "La foto no puede superar los 3MB.");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return showMessage("error", "Solo se permiten imágenes JPG, PNG o WebP.");
    const formData = new FormData();
    formData.append("image", file);
    if (photoCaption.trim()) formData.append("caption", photoCaption.trim());
    setPhotoUploading(true);
    try {
      await api.post("/clinic-photos/upload/", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setPhotoCaption("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchPhotos();
      showMessage("success", "Foto subida correctamente.");
    } catch (error) {
      console.error(error);
      showMessage("error", error.response?.data?.error || error.response?.data?.image?.[0] || "No se pudo subir la foto.");
    } finally {
      setPhotoUploading(false);
    }
  };

  const deletePhoto = async (photoId) => {
    if (!window.confirm("¿Eliminás esta foto del local?")) return;
    try {
      await api.delete(`/clinic-photos/${photoId}/delete/`);
      await fetchPhotos();
      showMessage("success", "Foto eliminada.");
    } catch (error) {
      console.error(error);
      showMessage("error", "No se pudo eliminar la foto.");
    }
  };

  const handleClinicalPhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedPet) return;
    if (file.size > 5 * 1024 * 1024) return showMessage("error", "La foto clínica no puede superar los 5MB.");
    const formData = new FormData();
    formData.append("image", file);
    formData.append("pet", selectedPet.id);
    if (clinicalPhotoCaption.trim()) formData.append("caption", clinicalPhotoCaption.trim());
    setClinicalPhotoUploading(true);
    try {
      await api.post("/clinical-photos/upload/", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setClinicalPhotoCaption("");
      if (clinicalFileInputRef.current) clinicalFileInputRef.current.value = "";
      await fetchClinicalPhotos(selectedPet.id);
      showMessage("success", "Foto clínica subida.");
    } catch (error) {
      console.error(error);
      showMessage("error", error.response?.data?.error || "No se pudo subir la foto clínica.");
    } finally {
      setClinicalPhotoUploading(false);
    }
  };

  const deleteClinicalPhoto = async (photoId) => {
    if (!window.confirm("¿Eliminás esta foto clínica?")) return;
    try {
      await api.delete(`/clinical-photos/${photoId}/delete/`);
      await fetchClinicalPhotos(selectedPet.id);
      showMessage("success", "Foto clínica eliminada.");
    } catch (error) {
      console.error(error);
      showMessage("error", "No se pudo eliminar la foto clínica.");
    }
  };

  const toggleWorkingDay = (day) => {
    const working = schedule.working_days || [];
    const exists = working.includes(day);
    const nextWorking = exists ? working.filter((d) => d !== day) : [...working, day].sort((a, b) => a - b);
    const nextDayHours = { ...(schedule.day_hours || {}) };
    if (!exists && !nextDayHours[String(day)]) nextDayHours[String(day)] = { open: "09:00", close: "18:00" };
    setSchedule((prev) => ({ ...prev, working_days: nextWorking, day_hours: nextDayHours }));
  };

  const updateDayHour = (day, field, value) => {
    setSchedule((prev) => ({
      ...prev,
      day_hours: {
        ...(prev.day_hours || {}),
        [String(day)]: { ...(prev.day_hours?.[String(day)] || { open: "09:00", close: "18:00" }), [field]: value },
      },
    }));
  };

  const saveSchedule = async () => {
    setScheduleSaving(true);
    try {
      const payload = {
        ...schedule,
        day_hours: Object.fromEntries(Object.entries(schedule.day_hours || {}).map(([k, v]) => [String(k), v])),
      };
      await api.post("/clinic-schedule/configurar/", payload);
      await fetchSchedule();
      showMessage("success", "Agenda guardada correctamente.");
    } catch (error) {
      console.error(error);
      const data = error.response?.data;
      showMessage("error", data ? Object.values(data).flat().join(" ") : "No se pudo guardar la agenda.");
    } finally {
      setScheduleSaving(false);
    }
  };

  const addExternalAppointment = async (event) => {
    event.preventDefault();
    if (!externalForm.requested_date || !externalForm.external_label.trim()) return showMessage("error", "Fecha y descripción son obligatorias.");
    setExternalSaving(true);
    try {
      await api.post("/clinic-schedule/turno-externo/", externalForm);
      setExternalForm({ requested_date: "", appointment_type: "control", external_label: "" });
      await fetchAll();
      showMessage("success", "Turno externo agregado.");
    } catch (error) {
      console.error(error);
      showMessage("error", error.response?.data?.error || "No se pudo agregar el turno externo.");
    } finally {
      setExternalSaving(false);
    }
  };

  const openPetFile = (pet) => {
    setSelectedPet(pet);
    fetchClinicalPhotos(pet.id);
  };

  return (
    <main className="vp-page">
      <VetBackground />
      <section className="vp-shell">
        {message.text && <div className={`vp-toast ${message.type}`}>{message.type === "success" ? "✅" : "⚠️"} {message.text}</div>}

        <header className="vp-hero">
          <div>
            <p className="vp-kicker">Panel de clínica</p>
            <h1>¡Bienvenido/a, <span>{user?.username || "clínica"}</span>! <em>👋</em></h1>
            <p>Gestioná tus turnos, pacientes y agenda desde acá.</p>
          </div>
          <Link to="/clinic/estadisticas" className="vp-stats-link">
            <strong>📊 Estadísticas</strong>
            <small>Ver reportes y métricas</small>
          </Link>
        </header>

        <nav className="vp-tabs" aria-label="Secciones del panel veterinario">
          <button className={tab === "turnos" ? "active" : ""} onClick={() => setTab("turnos")}>📅 Turnos</button>
          <button className={tab === "pacientes" ? "active" : ""} onClick={() => setTab("pacientes")}>🐾 Pacientes</button>
          <button className={tab === "fotos" ? "active" : ""} onClick={() => setTab("fotos")}>📷 Fotos</button>
          <button className={tab === "mi-agenda" ? "active" : ""} onClick={() => setTab("mi-agenda")}>🗓 Mi Agenda</button>
        </nav>

        {loading ? (
          <EmptyState icon="🐾" title="Cargando panel" text="Estamos trayendo la información de tu clínica." />
        ) : (
          <>
            {tab === "turnos" && (
              <TurnosTab
                statusCounts={statusCounts}
                filter={filter}
                setFilter={setFilter}
                filteredAppointments={filteredAppointments}
                agendaDate={agendaDate}
                agendaTurnos={agendaTurnos}
                changeAgendaDay={changeAgendaDay}
                downloadAgendaPDF={downloadAgendaPDF}
                handleConfirm={handleConfirm}
                handleCancel={handleCancel}
                handleNoShow={handleNoShow}
                openVisitModal={openVisitModal}
                setHighlightedAppt={setHighlightedAppt}
                highlightedAppt={highlightedAppt}
              />
            )}

            {tab === "pacientes" && (
              <PacientesTab
                patientStats={patientStats}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedPet={selectedPet}
                setSelectedPet={setSelectedPet}
                filteredPets={filteredPets}
                visits={visits}
                vaccines={vaccines}
                currentPetVisits={currentPetVisits}
                currentPetVaccines={currentPetVaccines}
                clinicalPhotos={clinicalPhotos}
                clinicalPhotoCaption={clinicalPhotoCaption}
                setClinicalPhotoCaption={setClinicalPhotoCaption}
                clinicalPhotoUploading={clinicalPhotoUploading}
                clinicalFileInputRef={clinicalFileInputRef}
                handleClinicalPhotoUpload={handleClinicalPhotoUpload}
                deleteClinicalPhoto={deleteClinicalPhoto}
                openPetFile={openPetFile}
                downloadPetPDF={downloadPetPDF}
                openVisitModal={openVisitModal}
                openVaccineModal={openVaccineModal}
              />
            )}

            {tab === "fotos" && (
              <FotosTab
                photos={photos}
                photosLoading={photosLoading}
                photoUploading={photoUploading}
                photoCaption={photoCaption}
                setPhotoCaption={setPhotoCaption}
                fileInputRef={fileInputRef}
                handlePhotoUpload={handlePhotoUpload}
                deletePhoto={deletePhoto}
              />
            )}

            {tab === "mi-agenda" && (
              <AgendaConfigTab
                schedule={schedule}
                scheduleLoading={scheduleLoading}
                scheduleSaving={scheduleSaving}
                toggleWorkingDay={toggleWorkingDay}
                updateDayHour={updateDayHour}
                setSchedule={setSchedule}
                saveSchedule={saveSchedule}
                externalForm={externalForm}
                setExternalForm={setExternalForm}
                externalSaving={externalSaving}
                addExternalAppointment={addExternalAppointment}
              />
            )}
          </>
        )}
      </section>

      {showVisitModal && (
        <VisitModal
          visitForm={visitForm}
          setVisitForm={setVisitForm}
          saving={saving}
          onClose={() => setShowVisitModal(false)}
          onSubmit={handleVisitSubmit}
        />
      )}
      {showVaccineModal && (
        <VaccineModal
          vaccineForm={vaccineForm}
          setVaccineForm={setVaccineForm}
          saving={saving}
          onClose={() => setShowVaccineModal(false)}
          onSubmit={handleVaccineSubmit}
        />
      )}

      <style>{styles}</style>
    </main>
  );
}

function TurnosTab({
  statusCounts,
  filter,
  setFilter,
  filteredAppointments,
  agendaDate,
  agendaTurnos,
  changeAgendaDay,
  downloadAgendaPDF,
  handleConfirm,
  handleCancel,
  handleNoShow,
  openVisitModal,
  setHighlightedAppt,
  highlightedAppt,
}) {
  return (
    <>
      <div className="vp-metrics turnos">
        <Metric className="pending" icon="📅" value={statusCounts.pending} label="Pendientes" />
        <Metric className="confirmed" icon="✓" value={statusCounts.confirmed} label="Confirmados" />
        <Metric className="completed" icon="📋" value={statusCounts.completed} label="Realizados" />
        <Metric className="noshow" icon="×" value={statusCounts.no_show} label="Ausentes" />
      </div>

      <div className="vp-turnos-grid">
        <section className="vp-card vp-list-panel">
          <div className="vp-filters">
            {["pending", "confirmed", "completed", "cancelled", "no_show", "all"].map((item) => (
              <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>
                {item === "all" ? "Todos" : STATUS[item]?.label}
              </button>
            ))}
          </div>

          {filteredAppointments.length === 0 ? (
            <EmptyState
              icon="📅"
              title={filter === "all" ? "Sin turnos registrados" : `Sin turnos ${STATUS[filter]?.label?.toLowerCase() || ""}`}
              text={filter === "all" ? "Todavía no hay turnos para mostrar." : `No hay turnos con estado “${STATUS[filter]?.label}”.`}
            />
          ) : (
            <div className="vp-appts">
              {filteredAppointments.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appt={appt}
                  highlighted={highlightedAppt === appt.id}
                  handleConfirm={handleConfirm}
                  handleCancel={handleCancel}
                  handleNoShow={handleNoShow}
                  openVisitModal={openVisitModal}
                />
              ))}
            </div>
          )}
        </section>

        <AgendaDayCard
          agendaDate={agendaDate}
          agendaTurnos={agendaTurnos}
          changeAgendaDay={changeAgendaDay}
          downloadAgendaPDF={downloadAgendaPDF}
          onJumpToAppointment={(appt) => {
            setHighlightedAppt(appt.id);
            setFilter("all");
            setTimeout(() => document.getElementById(`appt-${appt.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
          }}
        />
      </div>
    </>
  );
}

function PacientesTab({
  patientStats,
  searchQuery,
  setSearchQuery,
  selectedPet,
  setSelectedPet,
  filteredPets,
  visits,
  vaccines,
  currentPetVisits,
  currentPetVaccines,
  clinicalPhotos,
  clinicalPhotoCaption,
  setClinicalPhotoCaption,
  clinicalPhotoUploading,
  clinicalFileInputRef,
  handleClinicalPhotoUpload,
  deleteClinicalPhoto,
  openPetFile,
  downloadPetPDF,
  openVisitModal,
  openVaccineModal,
}) {
  if (selectedPet) {
    return (
      <section className="vp-pet-detail">
        <button className="vp-back" onClick={() => setSelectedPet(null)}>← Volver a pacientes</button>
        <PetMainCard
          pet={selectedPet}
          visits={visits}
          vaccines={vaccines}
          detailed
          onFile={() => {}}
          onPdf={() => downloadPetPDF(selectedPet)}
          onVisit={() => openVisitModal(selectedPet)}
          onVaccine={() => openVaccineModal(selectedPet)}
        />

        <div className="vp-detail-grid">
          <section className="vp-card">
            <h3 className="vp-section-title">📋 Historial de visitas</h3>
            {currentPetVisits.length === 0 ? (
              <EmptyState icon="📋" title="Sin visitas" text="Todavía no hay consultas registradas para este paciente." compact />
            ) : (
              <div className="vp-history-list">
                {currentPetVisits.map((visit) => (
                  <article className="vp-history-item" key={visit.id}>
                    <div className="history-date">
                      <strong>{formatDate(visit.date, { day: "2-digit" })}</strong>
                      <span>{formatDate(visit.date, { month: "short" })}</span>
                    </div>
                    <div>
                      <h4>{visit.reason || "Consulta"}</h4>
                      <p><b>Diagnóstico:</b> {visit.diagnosis || "—"}</p>
                      {visit.treatment && <p><b>Tratamiento:</b> {visit.treatment}</p>}
                      {visit.observations && <p><b>Observaciones:</b> {visit.observations}</p>}
                      {visit.next_visit && <span className="vp-pill green">Próxima: {formatDate(visit.next_visit)}</span>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="vp-card">
            <h3 className="vp-section-title">💉 Vacunas</h3>
            {currentPetVaccines.length === 0 ? (
              <EmptyState icon="💉" title="Sin vacunas" text="Todavía no hay vacunas registradas para este paciente." compact />
            ) : (
              <div className="vp-table-wrap">
                <table className="vp-table">
                  <thead><tr><th>Vacuna</th><th>Fecha</th><th>Próx. dosis</th><th>Veterinario</th></tr></thead>
                  <tbody>
                    {currentPetVaccines.map((vaccine) => (
                      <tr key={vaccine.id}>
                        <td>{vaccine.name}</td>
                        <td>{formatDate(vaccine.date_applied)}</td>
                        <td>{vaccine.next_dose ? formatDate(vaccine.next_dose) : "—"}</td>
                        <td>{[vaccine.vet_first_name, vaccine.vet_last_name].filter(Boolean).join(" ") || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <section className="vp-card vp-clinical-photos">
          <h3 className="vp-section-title">📷 Fotos clínicas</h3>
          <div className="vp-inline-form">
            <input value={clinicalPhotoCaption} onChange={(e) => setClinicalPhotoCaption(e.target.value)} placeholder="Descripción, por ejemplo: radiografía, lesión, control..." />
            <input ref={clinicalFileInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleClinicalPhotoUpload} />
            <button onClick={() => clinicalFileInputRef.current?.click()} disabled={clinicalPhotoUploading}>{clinicalPhotoUploading ? "Subiendo..." : "Subir foto"}</button>
          </div>
          {clinicalPhotos.length === 0 ? (
            <EmptyState icon="📷" title="Sin fotos clínicas" text="Las fotos clínicas quedan asociadas a este paciente." compact />
          ) : (
            <div className="vp-photo-grid small">
              {clinicalPhotos.map((photo) => (
                <article className="vp-photo" key={photo.id}>
                  <img src={photo.image_url || photo.image} alt={photo.caption || "Foto clínica"} />
                  <div><strong>{photo.caption || "Foto clínica"}</strong><button onClick={() => deleteClinicalPhoto(photo.id)}>Eliminar</button></div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    );
  }

  return (
    <section className="vp-patients">
      <div className="vp-metrics patients">
        <Metric className="blue" icon="🐾" value={patientStats.total} label="Pacientes totales" sub="Registrados en tu clínica" />
        <Metric className="confirmed" icon="✓" value={patientStats.active} label="Con historial" sub="Con visitas o vacunas" />
        <Metric className="violet" icon="💉" value={patientStats.reminders} label="Recordatorios" sub="Vacunas por vencer" />
        <Metric className="gold" icon="🛡" value={patientStats.vaccines} label="Vacunas" sub="Registradas" />
      </div>

      <div className="vp-search-row">
        <div className="vp-search">🔍<input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar por nombre de mascota o dueño..." /></div>
        <div className="vp-select-look">▾ Todos los pacientes</div>
      </div>

      {filteredPets.length === 0 ? (
        <EmptyState icon="🐾" title="Sin pacientes" text={searchQuery ? "No encontramos pacientes con esa búsqueda." : "Todavía no hay mascotas vinculadas a tu clínica."} />
      ) : (
        <div className="vp-pet-list">
          {filteredPets.map((pet) => (
            <PetMainCard
              key={pet.id}
              pet={pet}
              visits={visits}
              vaccines={vaccines}
              onFile={() => openPetFile(pet)}
              onPdf={() => downloadPetPDF(pet)}
              onVisit={() => openVisitModal(pet)}
              onVaccine={() => openVaccineModal(pet)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CameraOutlineIcon({ className = "" }) {
  return (
    <svg className={`vp-camera-svg ${className}`} viewBox="0 0 128 96" aria-hidden="true" focusable="false">
      <path d="M34 22h13l7-10h20l7 10h13c10 0 18 8 18 18v30c0 10-8 18-18 18H34c-10 0-18-8-18-18V40c0-10 8-18 18-18Z" />
      <circle cx="64" cy="56" r="19" />
      <circle cx="94" cy="38" r="4" />
    </svg>
  );
}

function FotosTab({ photos, photosLoading, photoUploading, photoCaption, setPhotoCaption, fileInputRef, handlePhotoUpload, deletePhoto }) {
  return (
    <section className="vp-photos-page">
      <div className="vp-page-title">
        <div className="title-icon"><CameraOutlineIcon /></div>
        <div>
          <h2>Fotos del local</h2>
          <p>{photos.length}/5 fotos — Se muestran en tu perfil público</p>
        </div>
      </div>

      {photos.length < 5 && (
        <div className="vp-upload-zone">
          <CameraOutlineIcon className="upload-camera-icon" />
          <h3>Subí fotos de tu clínica</h3>
          <p>Mostrá tu espacio y generá confianza en tus clientes.</p>
          <input value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} maxLength={100} placeholder="Descripción opcional: sala de espera, consultorio..." />
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handlePhotoUpload} />
          <button onClick={() => fileInputRef.current?.click()} disabled={photoUploading}>{photoUploading ? "Subiendo..." : "📤 Subir foto"}</button>
          <small>JPG, PNG o WebP · Máximo 3MB por foto</small>
        </div>
      )}

      <h3 className="vp-section-title">Tus fotos ({photos.length}/5)</h3>
      {photosLoading ? (
        <EmptyState icon="🐾" title="Cargando fotos" text="Un momento..." />
      ) : photos.length === 0 ? (
        <EmptyState icon="📷" title="Todavía no subiste fotos" text="Las fotos del local aparecen en el perfil público de tu clínica." />
      ) : (
        <div className="vp-photo-grid">
          {photos.map((photo) => (
            <article className="vp-photo" key={photo.id}>
              <img src={photo.image} alt={photo.caption || "Foto del local"} />
              <div><strong>{photo.caption || "Foto del local"}</strong><button onClick={() => deletePhoto(photo.id)}>Eliminar</button></div>
            </article>
          ))}
          {Array.from({ length: Math.max(0, 5 - photos.length) }).map((_, idx) => (
            <button className="vp-photo-placeholder" key={idx} onClick={() => fileInputRef.current?.click()}><CameraOutlineIcon /><span>Agregar foto</span></button>
          ))}
        </div>
      )}

      <div className="vp-tip"><b>Tip</b><span>Las fotos de tu clínica ayudan a que más dueños te elijan. Mostrá tu espacio, tu equipo y lo que hace especial a tu veterinaria.</span></div>
    </section>
  );
}

function AgendaCalendarArt() {
  return (
    <div className="vp-agenda-art" aria-hidden="true">
      <svg viewBox="0 0 220 170" role="img">
        <defs>
          <linearGradient id="agendaArtGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#55d66b" />
            <stop offset="1" stopColor="#236cff" />
          </linearGradient>
        </defs>
        <rect x="35" y="35" width="105" height="98" rx="16" />
        <path d="M35 62h105" />
        <path d="M62 22v28M112 22v28" />
        <path d="M62 82h16M95 82h16M62 108h16M95 108h16" />
        <circle cx="151" cy="96" r="44" />
        <path d="M151 70v30l22 14" />
      </svg>
    </div>
  );
}

function AgendaConfigTab({
  schedule,
  scheduleLoading,
  scheduleSaving,
  toggleWorkingDay,
  updateDayHour,
  setSchedule,
  saveSchedule,
  externalForm,
  setExternalForm,
  externalSaving,
  addExternalAppointment,
}) {
  if (scheduleLoading) return <EmptyState icon="🗓" title="Cargando agenda" text="Estamos trayendo tu configuración de horarios." />;
  const working = schedule.working_days || [];
  const dayHours = schedule.day_hours || {};

  return (
    <section className="vp-agenda-config">
      <div className="vp-page-title">
        <div className="title-icon violet">🗓</div>
        <div>
          <h2>Mi Agenda</h2>
          <p>Configurá tus días, horarios y preferencias de turnos.</p>
        </div>
      </div>

      <section className="vp-card soft">
        <h3 className="vp-section-title">📅 Días de atención</h3>
        <div className="vp-days">
          {DAYS.map((day, index) => (
            <button key={day} className={working.includes(index) ? "active" : ""} onClick={() => toggleWorkingDay(index)}>{DAY_SHORT[index]}</button>
          ))}
        </div>
      </section>

      <section className="vp-card soft">
        <h3 className="vp-section-title">🕐 Horarios por día</h3>
        {working.length === 0 ? (
          <EmptyState icon="🕐" title="Sin días activos" text="Seleccioná al menos un día de atención." compact />
        ) : (
          <div className="vp-hour-list">
            {[...working].sort((a, b) => a - b).map((day) => (
              <div className="vp-hour-row" key={day}>
                <strong>{DAYS[day]}</strong>
                <span>Desde</span>
                <input type="time" value={dayHours[String(day)]?.open || "09:00"} onChange={(e) => updateDayHour(day, "open", e.target.value)} />
                <span>Hasta</span>
                <input type="time" value={dayHours[String(day)]?.close || "18:00"} onChange={(e) => updateDayHour(day, "close", e.target.value)} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="vp-card soft vp-agenda-side-card">
        <div className="vp-side-card-head">
          <div>
            <h3 className="vp-section-title">⏱ Duración por tipo de turno</h3>
            <p className="vp-muted small">Definí cuánto dura cada tipo de consulta.</p>
          </div>
          <AgendaCalendarArt />
        </div>

        <div className="vp-duration-list">
          {[
            ["duration_control", "🩺 Control general"],
            ["duration_vaccine", "💉 Vacunación"],
            ["duration_surgery", "✂️ Cirugía"],
            ["duration_other", "⋯ Otro"],
          ].map(([key, label]) => (
            <label key={key}><span>{label}</span><select value={schedule[key] || 30} onChange={(e) => setSchedule((prev) => ({ ...prev, [key]: Number(e.target.value) }))}>{[10, 15, 20, 30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} minutos</option>)}</select></label>
          ))}
        </div>

        <div className="vp-side-divider" />

        <h3 className="vp-section-title">⚙️ Configuración adicional</h3>
        <div className="vp-duration-list two">
          <label><span>Intervalo entre turnos</span><select value={schedule.interval_minutes ?? 10} onChange={(e) => setSchedule((prev) => ({ ...prev, interval_minutes: Number(e.target.value) }))}><option value={0}>Sin intervalo</option><option value={10}>10 minutos</option><option value={15}>15 minutos</option><option value={20}>20 minutos</option></select></label>
          <label><span>Límite para cancelar</span><select value={schedule.cancel_limit_hours ?? 4} onChange={(e) => setSchedule((prev) => ({ ...prev, cancel_limit_hours: Number(e.target.value) }))}><option value={2}>2 horas antes</option><option value={4}>4 horas antes</option><option value={8}>8 horas antes</option><option value={24}>24 horas antes</option></select></label>
        </div>
        <button className="vp-save" disabled={scheduleSaving} onClick={saveSchedule}>{scheduleSaving ? "Guardando..." : "💾 Guardar agenda"}</button>
      </section>

      <section className="vp-card soft">
        <h3 className="vp-section-title">📞 Agregar turno externo</h3>
        <p className="vp-muted">Para turnos tomados por teléfono o WhatsApp. Bloquea ese horario en la agenda online.</p>
        <form className="vp-external-form" onSubmit={addExternalAppointment}>
          <label>Fecha y hora<input type="datetime-local" value={externalForm.requested_date} onChange={(e) => setExternalForm({ ...externalForm, requested_date: e.target.value })} /></label>
          <label>Tipo<select value={externalForm.appointment_type} onChange={(e) => setExternalForm({ ...externalForm, appointment_type: e.target.value })}>{appointmentTypeOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></label>
          <label>Descripción<input value={externalForm.external_label} onChange={(e) => setExternalForm({ ...externalForm, external_label: e.target.value })} placeholder="Ej: Juan Pérez - por teléfono" /></label>
          <button type="submit" disabled={externalSaving}>{externalSaving ? "Agregando..." : "+ Agregar turno externo"}</button>
        </form>
      </section>
    </section>
  );
}

function AgendaDayCard({ agendaDate, agendaTurnos, changeAgendaDay, downloadAgendaPDF, onJumpToAppointment }) {
  return (
    <aside className="vp-card vp-day-card">
      <div className="vp-day-head">
        <button onClick={() => changeAgendaDay(-1)}>‹</button>
        <div><strong>Hoy</strong><span>{formatDate(agendaDate, { weekday: "long", day: "2-digit", month: "long" })}</span></div>
        <button onClick={() => changeAgendaDay(1)}>›</button>
      </div>
      <button className="vp-download red" onClick={downloadAgendaPDF}>📄 Descargar agenda</button>
      {agendaTurnos.length === 0 ? (
        <EmptyState icon="🗓" title="Sin turnos este día" text={`${agendaTurnos.length} turnos este día`} compact />
      ) : (
        <div className="vp-day-list">
          {agendaTurnos.map((appt) => (
            <button key={appt.id} className="vp-day-appt" onClick={() => onJumpToAppointment(appt)}>
              <strong>{formatTime(appt.requested_date)}</strong>
              <span>{appt.is_external ? appt.external_label : appt.pet_name || "Paciente"}</span>
              <em>{appt.appointment_type_display || appt.reason || "Consulta"}</em>
            </button>
          ))}
        </div>
      )}
      <div className="vp-day-count">{agendaTurnos.length} turno{agendaTurnos.length !== 1 ? "s" : ""} este día</div>
    </aside>
  );
}

function AppointmentCard({ appt, highlighted, handleConfirm, handleCancel, handleNoShow, openVisitModal }) {
  const meta = STATUS[appt.status] || STATUS.pending;
  return (
    <article id={`appt-${appt.id}`} className={`vp-appt ${meta.className} ${highlighted ? "highlight" : ""}`}>
      <div className="vp-datebox"><strong>{formatDate(appt.requested_date, { day: "2-digit" })}</strong><span>{formatDate(appt.requested_date, { month: "short" })}</span><small>{formatTime(appt.requested_date)}</small></div>
      <div className="vp-appt-body">
        <div className="vp-appt-top">
          <h3>{appt.is_external ? `Turno externo: ${appt.external_label}` : appt.reason || "Consulta"}</h3>
          <span className={`vp-status ${meta.className}`}>{meta.icon} {meta.label}</span>
          {appt.appointment_type_display && <span className="vp-type">{appt.appointment_type_display}</span>}
        </div>
        <p className="vp-appt-meta">
          {!appt.is_external && <><span>🐾 {appt.pet_name || "—"}</span><span>👤 {appt.owner_name || "—"}</span></>}
          <span>📆 {formatDate(appt.requested_date, { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}</span>
        </p>
        <div className="vp-actions">
          {appt.status === "pending" && <><button className="ok" onClick={() => handleConfirm(appt.id)}>Confirmar</button><button className="danger" onClick={() => handleCancel(appt.id)}>Cancelar</button></>}
          {appt.status === "confirmed" && !appt.is_external && <><button className="primary" onClick={() => openVisitModal(appt)}>Cargar visita</button><button className="warning" onClick={() => handleNoShow(appt.id)}>Ausente</button><button className="danger" onClick={() => handleCancel(appt.id)}>Cancelar</button></>}
          {appt.status === "confirmed" && appt.is_external && <button className="danger" onClick={() => handleCancel(appt.id)}>Cancelar</button>}
        </div>
      </div>
    </article>
  );
}

function PetMainCard({ pet, visits, vaccines, onFile, onPdf, onVisit, onVaccine, detailed = false }) {
  const age = getAge(pet.birth_date);
  const petVisits = visits.filter((v) => v.pet === pet.id);
  const petVaccines = vaccines.filter((v) => v.pet === pet.id);
  return (
    <article className={`vp-pet-card ${detailed ? "detailed" : ""}`}>
      <div className="vp-pet-photo">{pet.photo ? <img src={pet.photo} alt={pet.name} /> : <span>{SPECIES_ICON[pet.species] || "🐾"}</span>}</div>
      <div className="vp-pet-info">
        <div className="vp-pet-title"><h3>{pet.name}</h3><span>● Activo</span></div>
        <p>{pet.species_display || pet.species || "Mascota"}{pet.sex && ` · ${pet.sex === "male" ? "♂ Macho" : "♀ Hembra"}`}</p>
        {pet.breed && <p className="vp-muted">{pet.breed}</p>}
        {pet.owner_name && <p className="vp-muted">👤 {pet.owner_name}</p>}
        <div className="vp-pet-chips">
          {age !== null && <span>📅 <b>{age} {age === 1 ? "año" : "años"}</b><small>Edad</small></span>}
          {pet.weight && <span>⚖️ <b>{pet.weight} kg</b><small>Peso</small></span>}
          {pet.color && <span>🎨 <b>{pet.color}</b><small>Color</small></span>}
        </div>
        <div className="vp-mini-chips">
          {pet.feeding && <em>🍲 {pet.feeding}</em>}
          {pet.habitat && <em>🏠 {pet.habitat}</em>}
          {pet.lives_with_animals && <em>🐾 Convive con otros animales</em>}
        </div>
        <p className="vp-vaccine-count">🛡 {petVaccines.length} vacuna{petVaccines.length !== 1 ? "s" : ""} registrada{petVaccines.length !== 1 ? "s" : ""} · {petVisits.length} visita{petVisits.length !== 1 ? "s" : ""}</p>
        <div className="vp-pet-actions">
          <button className="outline" onClick={onFile}>📄 Ver ficha completa</button>
          <button className="outline green" onClick={onPdf}>📁 Historial</button>
          <button className="gradient" onClick={onVisit}>📅 Sacar turno</button>
          <button className="outline violet" onClick={onVaccine}>🛡 Antiparasitarios</button>
        </div>
      </div>
    </article>
  );
}

function Metric({ className, icon, value, label, sub }) {
  return (
    <article className={`vp-metric ${className || ""}`}>
      <div className="vp-metric-icon">{icon}</div>
      <div><strong>{value}</strong><span>{label}</span>{sub && <small>{sub}</small>}</div>
    </article>
  );
}

function EmptyState({ icon, title, text, compact = false }) {
  return <div className={`vp-empty ${compact ? "compact" : ""}`}><div>{icon}</div><h3>{title}</h3><p>{text}</p></div>;
}

function VisitModal({ visitForm, setVisitForm, saving, onClose, onSubmit }) {
  const set = (key, value) => setVisitForm((prev) => ({ ...prev, [key]: value }));
  return (
    <Modal title="📋 Registrar visita" onClose={onClose}>
      <form className="vp-modal-form" onSubmit={onSubmit}>
        <div className="form-grid"><label>Nombre veterinario *<input value={visitForm.vet_name} onChange={(e) => set("vet_name", e.target.value)} /></label><label>Apellido *<input value={visitForm.vet_lastname} onChange={(e) => set("vet_lastname", e.target.value)} /></label></div>
        <label>Matrícula *<input value={visitForm.vet_license} onChange={(e) => set("vet_license", e.target.value)} /></label>
        <label>Clínica<input value={visitForm.vet_clinic_name} onChange={(e) => set("vet_clinic_name", e.target.value)} /></label>
        <label>Fecha y hora<input type="datetime-local" value={visitForm.date} onChange={(e) => set("date", e.target.value)} /></label>
        <label>Motivo<input value={visitForm.reason} onChange={(e) => set("reason", e.target.value)} /></label>
        <label>Diagnóstico *<textarea rows="3" value={visitForm.diagnosis} onChange={(e) => set("diagnosis", e.target.value)} /></label>
        <label>Tratamiento<textarea rows="3" value={visitForm.treatment} onChange={(e) => set("treatment", e.target.value)} /></label>
        <label>Observaciones<textarea rows="3" value={visitForm.observations} onChange={(e) => set("observations", e.target.value)} /></label>
        <label>Próxima visita<input type="date" value={visitForm.next_visit} onChange={(e) => set("next_visit", e.target.value)} /></label>
        <div className="modal-actions"><button type="button" onClick={onClose}>Cancelar</button><button className="gradient" disabled={saving}>{saving ? "Guardando..." : "Guardar visita"}</button></div>
      </form>
    </Modal>
  );
}

function VaccineModal({ vaccineForm, setVaccineForm, saving, onClose, onSubmit }) {
  const set = (key, value) => setVaccineForm((prev) => ({ ...prev, [key]: value }));
  return (
    <Modal title="💉 Registrar vacuna" onClose={onClose}>
      <form className="vp-modal-form" onSubmit={onSubmit}>
        <label>Nombre de vacuna *<input value={vaccineForm.name} onChange={(e) => set("name", e.target.value)} /></label>
        <div className="form-grid"><label>Fecha aplicada<input type="date" value={vaccineForm.date_applied} onChange={(e) => set("date_applied", e.target.value)} /></label><label>Próxima dosis<input type="date" value={vaccineForm.next_dose} onChange={(e) => set("next_dose", e.target.value)} /></label></div>
        <label>Lote<input value={vaccineForm.batch} onChange={(e) => set("batch", e.target.value)} /></label>
        <div className="form-grid"><label>Nombre veterinario *<input value={vaccineForm.vet_first_name} onChange={(e) => set("vet_first_name", e.target.value)} /></label><label>Apellido *<input value={vaccineForm.vet_last_name} onChange={(e) => set("vet_last_name", e.target.value)} /></label></div>
        <label>Matrícula *<input value={vaccineForm.vet_license} onChange={(e) => set("vet_license", e.target.value)} /></label>
        <label>Clínica<input value={vaccineForm.vet_clinic_name} onChange={(e) => set("vet_clinic_name", e.target.value)} /></label>
        <label>Notas<textarea rows="3" value={vaccineForm.notes} onChange={(e) => set("notes", e.target.value)} /></label>
        <div className="modal-actions"><button type="button" onClick={onClose}>Cancelar</button><button className="gradient" disabled={saving}>{saving ? "Guardando..." : "Guardar vacuna"}</button></div>
      </form>
    </Modal>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="vp-modal-backdrop" onMouseDown={onClose}>
      <div className="vp-modal" onMouseDown={(e) => e.stopPropagation()}>
        <header><h2>{title}</h2><button onClick={onClose}>×</button></header>
        {children}
      </div>
    </div>
  );
}

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
:root{--bg:#050d19;--panel:rgba(8,22,40,.76);--panel2:rgba(12,27,49,.66);--line:rgba(148,189,255,.16);--text:#f6f8ff;--muted:rgba(226,235,255,.62);--green:#55d66b;--orange:#ffad16;--blue:#45a7ff;--red:#ff4d68;--violet:#a77cff;}
.vp-page{min-height:100vh;background:radial-gradient(circle at 20% 5%,rgba(76,175,80,.11),transparent 34%),radial-gradient(circle at 85% 30%,rgba(255,152,0,.08),transparent 28%),linear-gradient(135deg,#06101f,#071323 45%,#050b15);color:var(--text);font-family:'Nunito',sans-serif;position:relative;overflow:hidden;padding:42px 22px 70px}.vp-shell{max-width:1400px;margin:0 auto;position:relative;z-index:1}.vp-bg{position:fixed;inset:0;pointer-events:none;z-index:0}.orb{position:absolute;border-radius:50%;filter:blur(100px);opacity:.22}.orb-a{width:480px;height:480px;background:#0c82ff;left:20%;bottom:-180px}.orb-b{width:420px;height:420px;background:#19c66b;right:-180px;top:120px}.light{position:absolute;width:2px;height:220px;background:linear-gradient(transparent,#41b6ff,transparent);opacity:.45}.l1{left:7%;top:16%}.l2{right:10%;top:8%;background:linear-gradient(transparent,#ffb32e,transparent)}.l3{left:62%;top:0}.l4{right:18%;bottom:10%;background:linear-gradient(transparent,#55d66b,transparent)}.star{position:absolute;color:#ffb72a;opacity:.75}.s1{left:28%;top:24%}.s2{right:22%;top:18%}.s3{left:8%;bottom:15%;color:#55d66b}.s4{right:5%;bottom:22%;color:#45a7ff}.vp-toast{position:fixed;right:22px;top:82px;z-index:50;padding:13px 16px;border-radius:16px;background:rgba(10,22,38,.92);border:1px solid var(--line);box-shadow:0 18px 60px rgba(0,0,0,.35);font-weight:800}.vp-toast.success{border-color:rgba(85,214,107,.35)}.vp-toast.error{border-color:rgba(255,77,104,.35)}
.vp-hero{display:grid;grid-template-columns:1fr auto;gap:24px;align-items:center;margin-bottom:22px;padding:34px 6px 26px;border-bottom:1px solid var(--line);position:relative}.vp-hero:after{content:'';position:absolute;right:250px;top:10px;width:260px;height:130px;opacity:.14;background:radial-gradient(circle at 30% 60%,rgba(85,214,107,.35),transparent 26%),url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 120"><path d="M45 96 C62 40, 122 31, 155 75 C171 98, 199 82, 202 62" fill="none" stroke="%237db8ff" stroke-width="3"/><circle cx="82" cy="50" r="8" fill="none" stroke="%237db8ff" stroke-width="3"/><path d="M119 50 q25 -24 55 8" fill="none" stroke="%237db8ff" stroke-width="3"/></svg>') center/contain no-repeat}.vp-kicker{text-transform:uppercase;letter-spacing:1.6px;color:var(--green);font-weight:900;font-size:.88rem;margin:0 0 12px}.vp-hero h1{font-size:clamp(2rem,4vw,3.45rem);line-height:1.05;margin:0 0 10px;font-weight:900;letter-spacing:-1.8px}.vp-hero h1 span{color:var(--green);text-shadow:0 0 28px rgba(85,214,107,.35)}.vp-hero h1 em{font-style:normal;font-size:.7em}.vp-hero p{margin:0;color:var(--muted);font-size:1.15rem}.vp-stats-link{display:flex;flex-direction:column;gap:3px;min-width:180px;text-decoration:none;color:var(--green);border:1px solid rgba(85,214,107,.42);border-radius:16px;background:linear-gradient(135deg,rgba(85,214,107,.13),rgba(69,167,255,.05));padding:15px 20px;box-shadow:0 0 36px rgba(85,214,107,.08)}.vp-stats-link strong{font-size:1.15rem}.vp-stats-link small{color:var(--muted)}
.vp-tabs{display:flex;gap:24px;align-items:center;border-bottom:1px solid var(--line);margin-bottom:18px}.vp-tabs button{background:none;border:0;color:rgba(255,255,255,.58);padding:0 4px 15px;font-size:1.07rem;font-weight:900;cursor:pointer;border-bottom:2px solid transparent}.vp-tabs button.active{color:var(--green);border-bottom-color:var(--green);text-shadow:0 0 18px rgba(85,214,107,.25)}
.vp-card,.vp-metric,.vp-upload-zone,.vp-pet-card,.vp-photo,.vp-photo-placeholder,.vp-tip{background:linear-gradient(180deg,rgba(15,34,60,.72),rgba(6,18,34,.72));border:1px solid var(--line);border-radius:20px;box-shadow:0 22px 70px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.04);backdrop-filter:blur(16px)}.vp-metrics{display:grid;gap:18px;margin:18px 0 20px}.vp-metrics.turnos{grid-template-columns:repeat(4,1fr)}.vp-metrics.patients{grid-template-columns:repeat(4,1fr)}.vp-metric{padding:22px;display:flex;gap:18px;align-items:center;min-height:104px;position:relative;overflow:hidden}.vp-metric:after{content:'';position:absolute;right:-18px;bottom:-28px;width:115px;height:115px;border-radius:50%;opacity:.12;background:currentColor}.vp-metric-icon{width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);font-size:1.7rem}.vp-metric strong{display:block;font-size:2.35rem;line-height:1;font-weight:900}.vp-metric span{display:block;font-weight:900}.vp-metric small{display:block;color:var(--muted);font-size:.78rem;margin-top:2px}.vp-metric.pending,.vp-metric.confirmed{color:var(--green);border-color:rgba(85,214,107,.28)}.vp-metric.completed,.vp-metric.blue{color:var(--blue);border-color:rgba(69,167,255,.25)}.vp-metric.noshow{color:var(--red);border-color:rgba(255,77,104,.28)}.vp-metric.violet{color:var(--violet);border-color:rgba(167,124,255,.28)}.vp-metric.gold{color:var(--orange);border-color:rgba(255,173,22,.28)}
.vp-turnos-grid{display:grid;grid-template-columns:1fr 360px;gap:24px}.vp-list-panel{padding:0;overflow:hidden}.vp-filters{display:flex;gap:10px;flex-wrap:wrap;padding:14px;border-bottom:1px solid var(--line)}.vp-filters button,.vp-actions button,.vp-pet-actions button,.vp-day-head button,.vp-inline-form button,.vp-upload-zone button,.vp-external-form button,.vp-save,.modal-actions button{font-family:inherit;border:1px solid var(--line);border-radius:13px;background:rgba(255,255,255,.04);color:rgba(255,255,255,.75);font-weight:900;padding:11px 16px;cursor:pointer;transition:.18s}.vp-filters button.active{color:#fff;border-color:rgba(85,214,107,.75);box-shadow:0 0 0 2px rgba(85,214,107,.12),0 0 22px rgba(85,214,107,.16)}.vp-appts{padding:16px;display:grid;gap:14px}.vp-appt{display:grid;grid-template-columns:82px 1fr;gap:16px;padding:16px;border-radius:18px;background:rgba(255,255,255,.035);border:1px solid var(--line)}.vp-appt.highlight{outline:2px solid var(--orange)}.vp-datebox{border-radius:16px;background:rgba(69,167,255,.09);border:1px solid rgba(69,167,255,.16);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px}.vp-datebox strong{font-size:1.8rem;color:var(--green)}.vp-datebox span{text-transform:uppercase;color:var(--muted);font-weight:900}.vp-datebox small{color:rgba(255,255,255,.62)}.vp-appt-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.vp-appt h3{font-size:1.1rem;margin:0}.vp-status,.vp-type,.vp-pill{border-radius:999px;padding:5px 9px;font-size:.78rem;font-weight:900}.vp-status.confirmed,.vp-status.completed,.vp-pill.green{background:rgba(85,214,107,.12);color:var(--green)}.vp-status.pending{background:rgba(255,173,22,.12);color:var(--orange)}.vp-status.cancelled,.vp-status.noshow{background:rgba(255,77,104,.12);color:var(--red)}.vp-type{background:rgba(255,255,255,.07);color:var(--muted)}.vp-appt-meta{display:flex;gap:14px;flex-wrap:wrap;color:var(--muted);margin:9px 0}.vp-actions{display:flex;gap:8px;flex-wrap:wrap}.vp-actions button.ok{background:rgba(85,214,107,.14);color:var(--green)}.vp-actions button.primary{background:rgba(69,167,255,.15);color:#8fc8ff}.vp-actions button.warning{background:rgba(255,173,22,.14);color:var(--orange)}.vp-actions button.danger{background:rgba(255,77,104,.12);color:#ff8a9d}
.vp-day-card{padding:24px}.vp-day-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}.vp-day-head div{display:flex;flex-direction:column;text-align:center}.vp-day-head strong{font-size:1.45rem}.vp-day-head span{color:var(--muted);text-transform:capitalize}.vp-download{width:100%;border:0;border-radius:14px;padding:14px;color:#fff;font-weight:900;cursor:pointer}.vp-download.red{background:linear-gradient(135deg,#ff445d,#e82443)}.vp-day-list{display:grid;gap:10px;margin-top:16px}.vp-day-appt{text-align:left;background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:14px;color:#fff;padding:12px;display:grid;grid-template-columns:62px 1fr;gap:8px;cursor:pointer}.vp-day-appt strong{color:#fff}.vp-day-appt span{font-weight:900}.vp-day-appt em{grid-column:2;color:#7db8ff;font-style:normal}.vp-day-count{text-align:center;color:var(--muted);border-top:1px solid var(--line);padding-top:14px;margin-top:16px}
.vp-empty{display:grid;place-items:center;text-align:center;min-height:260px;padding:34px;color:var(--muted)}.vp-empty.compact{min-height:120px}.vp-empty div{font-size:3.1rem;filter:drop-shadow(0 0 18px rgba(69,167,255,.35))}.vp-empty h3{color:#fff;margin:8px 0 4px;font-size:1.25rem}.vp-empty p{max-width:420px}
.vp-search-row{display:grid;grid-template-columns:1fr 260px;gap:12px;margin-bottom:16px}.vp-search,.vp-select-look{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.045);border:1px solid var(--line);border-radius:15px;padding:13px 16px;color:var(--muted)}.vp-search input{flex:1;background:none;border:0;outline:0;color:#fff;font:inherit}.vp-pet-list{display:grid;gap:16px}.vp-pet-card{position:relative;display:grid;grid-template-columns:160px 1fr;gap:22px;padding:18px}.vp-pet-card.detailed{margin-bottom:18px}.vp-pet-photo{height:160px;border-radius:16px;overflow:hidden;display:grid;place-items:center;background:rgba(255,255,255,.05);border:1px solid var(--line);font-size:3rem}.vp-pet-photo img{width:100%;height:100%;object-fit:cover}.vp-pet-title{display:flex;gap:12px;align-items:center}.vp-pet-title h3{font-size:2rem;line-height:1;margin:0}.vp-pet-title span{color:var(--green);font-weight:900;background:rgba(85,214,107,.12);border:1px solid rgba(85,214,107,.2);padding:5px 10px;border-radius:999px}.vp-pet-info>p{color:var(--muted);margin:6px 0}.vp-muted{color:var(--muted)}.vp-pet-chips{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:12px 0}.vp-pet-chips span{background:rgba(255,255,255,.045);border:1px solid var(--line);border-radius:13px;padding:12px;display:flex;gap:8px;align-items:center}.vp-pet-chips small{display:block;color:var(--muted)}.vp-mini-chips{display:flex;gap:8px;flex-wrap:wrap}.vp-mini-chips em{font-style:normal;background:rgba(255,255,255,.055);border:1px solid var(--line);border-radius:999px;padding:7px 11px;color:var(--muted)}.vp-vaccine-count{margin:12px 0!important}.vp-pet-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.vp-pet-actions button.outline{color:#9ed3ff}.vp-pet-actions button.green{color:var(--green)}.vp-pet-actions button.violet{color:#d5b8ff}.vp-pet-actions button.gradient,.gradient{background:linear-gradient(135deg,var(--green),var(--orange));border:0!important;color:#fff!important;box-shadow:0 12px 30px rgba(255,173,22,.16)}.vp-dot-menu{position:absolute;right:18px;top:18px;width:42px;height:42px;border-radius:50%;border:1px solid var(--line);background:rgba(255,255,255,.06);color:#fff}.vp-back{margin-bottom:16px;background:rgba(255,255,255,.05);border:1px solid var(--line);color:#fff;border-radius:12px;padding:11px 14px;font-weight:900}.vp-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.vp-section-title{margin:0 0 14px;font-size:1.2rem}.vp-history-list{display:grid;gap:12px}.vp-history-item{display:grid;grid-template-columns:64px 1fr;gap:14px;padding:14px;border:1px solid var(--line);border-radius:16px;background:rgba(255,255,255,.03)}.history-date{display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:13px;background:rgba(69,167,255,.09)}.history-date strong{font-size:1.5rem;color:var(--blue)}.history-date span{text-transform:uppercase;color:var(--muted);font-weight:900}.vp-table-wrap{overflow:auto}.vp-table{width:100%;border-collapse:collapse}.vp-table th,.vp-table td{padding:12px;border-bottom:1px solid var(--line);text-align:left}.vp-table th{color:var(--green)}
.vp-page-title{display:flex;gap:16px;align-items:center;margin:10px 0 20px}.title-icon{width:62px;height:62px;border-radius:16px;display:grid;place-items:center;background:rgba(69,167,255,.14);border:1px solid rgba(69,167,255,.25);font-size:1.7rem}.title-icon.violet{background:rgba(167,124,255,.13);border-color:rgba(167,124,255,.28)}.vp-page-title h2{font-size:2.35rem;margin:0}.vp-page-title p{color:var(--muted);margin:4px 0 0}.vp-upload-zone{text-align:center;padding:34px;margin-bottom:22px;border-style:dashed}.upload-icon{font-size:3.4rem;color:var(--green);margin-bottom:10px}.vp-upload-zone input,.vp-inline-form input,.vp-external-form input,.vp-external-form select,.vp-hour-row input,.vp-duration-list select,.vp-modal-form input,.vp-modal-form textarea{background:rgba(255,255,255,.055);border:1px solid var(--line);border-radius:12px;color:#fff;padding:11px 13px;font:inherit;outline:0}.vp-upload-zone input{display:block;max-width:560px;width:100%;margin:14px auto}.vp-upload-zone button{background:linear-gradient(135deg,#18c983,#4c91ff);color:#fff;border:0}.vp-upload-zone small{display:block;color:var(--muted);margin-top:9px}.vp-photo-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:16px}.vp-photo-grid.small{grid-template-columns:repeat(auto-fill,minmax(180px,1fr))}.vp-photo{overflow:hidden}.vp-photo img{width:100%;height:150px;object-fit:cover}.vp-photo div{padding:12px;display:flex;justify-content:space-between;gap:12px;align-items:center}.vp-photo button{background:rgba(255,77,104,.12);border:1px solid rgba(255,77,104,.25);color:#ff8a9d;border-radius:10px;padding:8px 10px}.vp-photo-placeholder{min-height:218px;color:var(--muted);display:grid;place-items:center;font:inherit}.vp-photo-placeholder span{display:block}.vp-tip{margin-top:20px;padding:18px;display:flex;gap:14px}.vp-tip b{color:var(--green)}.vp-tip span{color:var(--muted)}
.vp-agenda-config{max-width:980px}.vp-card.soft{padding:18px;margin-bottom:12px}.vp-days{display:flex;gap:8px;flex-wrap:wrap}.vp-days button{border:1px solid var(--line);background:rgba(255,255,255,.05);color:var(--muted);border-radius:10px;padding:10px 13px;font-weight:900}.vp-days button.active{background:rgba(85,214,107,.16);border-color:rgba(85,214,107,.42);color:var(--green)}.vp-hour-list,.vp-duration-list{display:grid;gap:10px}.vp-hour-row{display:grid;grid-template-columns:140px 54px 120px 54px 120px;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)}.vp-hour-row span,.vp-duration-list span{color:var(--muted)}.vp-duration-list label{display:grid;grid-template-columns:1fr 160px;align-items:center;gap:12px}.vp-duration-list.two{grid-template-columns:1fr 1fr}.vp-save{width:100%;margin-top:14px;background:linear-gradient(135deg,#18c983,#55d66b);color:#fff;border:0}.vp-external-form{display:grid;gap:10px}.vp-external-form label,.vp-modal-form label{display:grid;gap:6px;color:var(--muted);font-weight:800}.vp-external-form button{background:linear-gradient(135deg,var(--green),var(--orange));border:0;color:#fff}.vp-inline-form{display:grid;grid-template-columns:1fr auto;gap:10px;margin-bottom:14px}.vp-inline-form button{background:linear-gradient(135deg,#18c983,#4c91ff);border:0;color:#fff}
.vp-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.62);display:grid;place-items:center;z-index:200;padding:20px}.vp-modal{width:min(720px,100%);max-height:88vh;overflow:auto;background:#071323;border:1px solid var(--line);border-radius:22px;box-shadow:0 28px 90px rgba(0,0,0,.55)}.vp-modal header{display:flex;justify-content:space-between;align-items:center;padding:18px;border-bottom:1px solid var(--line)}.vp-modal header h2{margin:0}.vp-modal header button{background:none;border:0;color:#fff;font-size:2rem;cursor:pointer}.vp-modal-form{padding:18px;display:grid;gap:12px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:8px}
@media (max-width:1000px){.vp-hero{grid-template-columns:1fr}.vp-turnos-grid{grid-template-columns:1fr}.vp-metrics.turnos,.vp-metrics.patients{grid-template-columns:repeat(2,1fr)}.vp-pet-actions{grid-template-columns:1fr 1fr}.vp-photo-grid{grid-template-columns:repeat(2,1fr)}.vp-detail-grid{grid-template-columns:1fr}.vp-duration-list.two{grid-template-columns:1fr}}@media (max-width:680px){.vp-page{padding:24px 12px 60px}.vp-hero h1{font-size:2.1rem}.vp-tabs{overflow:auto;gap:16px}.vp-metrics.turnos,.vp-metrics.patients,.vp-search-row{grid-template-columns:1fr}.vp-pet-card{grid-template-columns:1fr}.vp-pet-photo{height:220px}.vp-pet-chips{grid-template-columns:1fr}.vp-pet-actions{grid-template-columns:1fr}.vp-hour-row{grid-template-columns:1fr 1fr}.vp-duration-list label{grid-template-columns:1fr}.form-grid{grid-template-columns:1fr}}

/* Ajustes solicitados — VetDashboard fix */
.vp-shell{max-width:min(1520px,calc(100vw - 64px));}
.vp-dot-menu{display:none!important;}
.vp-camera-svg{width:76px;height:58px;display:block;margin:0 auto 14px;fill:none;stroke:rgba(214,225,245,.72);stroke-width:7;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 18px rgba(69,167,255,.18));}
.title-icon .vp-camera-svg{width:42px;height:34px;margin:0;stroke:rgba(117,190,255,.95);stroke-width:7;}
.upload-camera-icon{width:92px;height:70px;margin-bottom:14px;stroke:rgba(105,210,255,.92);filter:drop-shadow(0 0 22px rgba(69,167,255,.25));}
.vp-photo-placeholder{min-height:218px;display:flex!important;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:18px;cursor:pointer;}
.vp-photo-placeholder span{font-size:1.15rem;font-weight:800;color:rgba(226,235,255,.62);}
.vp-photo-placeholder:hover .vp-camera-svg{stroke:#8fc8ff;}

/* Agenda más ancha y menos larga */
.vp-agenda-config{max-width:none!important;width:100%;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(360px,.85fr);gap:18px;align-items:start;}
.vp-agenda-config>.vp-page-title{grid-column:1/-1;margin-bottom:2px;}
.vp-agenda-config>.vp-card.soft{margin-bottom:0;}
.vp-agenda-config>.vp-card.soft:nth-of-type(1){grid-column:1/-1;}
.vp-agenda-config>.vp-card.soft:nth-of-type(2){grid-column:1/2;align-self:stretch;}
.vp-agenda-config>.vp-card.soft:nth-of-type(3){grid-column:2/3;align-self:stretch;}
.vp-agenda-config>.vp-card.soft:nth-of-type(4){grid-column:1/-1;}
.vp-agenda-config .vp-card.soft{padding:24px;border-radius:22px;}
.vp-days button{min-width:72px;}
.vp-hour-row{grid-template-columns:minmax(105px,140px) 58px minmax(138px,160px) 58px minmax(138px,160px)!important;gap:12px;align-items:center;}
.vp-hour-row input{min-width:138px;width:100%;height:48px;padding:10px 14px!important;font-size:1rem;line-height:1.2;color:#fff;background-color:rgba(16,34,59,.96)!important;}
.vp-hour-row input::-webkit-calendar-picker-indicator,
.vp-external-form input[type="datetime-local"]::-webkit-calendar-picker-indicator,
.vp-modal-form input[type="date"]::-webkit-calendar-picker-indicator,
.vp-modal-form input[type="datetime-local"]::-webkit-calendar-picker-indicator{filter:invert(1) brightness(1.2);opacity:.8;margin-right:8px;cursor:pointer;}
.vp-duration-list{gap:14px;}
.vp-duration-list label{grid-template-columns:minmax(0,1fr) minmax(170px,210px)!important;gap:16px;}
.vp-duration-list.two{display:grid;grid-template-columns:1fr!important;}
.vp-duration-list.two label{grid-template-columns:minmax(0,1fr) minmax(190px,230px)!important;}
.vp-duration-list select,
.vp-external-form select,
.vp-external-form input,
.vp-modal-form input,
.vp-modal-form textarea,
.vp-upload-zone input{background-color:rgba(16,34,59,.96)!important;color:#fff!important;border-color:rgba(148,189,255,.22)!important;min-height:48px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.vp-duration-list select,
.vp-external-form select{min-width:170px;padding-right:38px!important;color-scheme:dark;}
.vp-duration-list option,
.vp-external-form option{background:#10223b!important;color:#f6f8ff!important;}
.vp-save{min-height:54px;font-size:1rem;}
.vp-external-form{grid-template-columns:1fr 260px;gap:14px;align-items:end;}
.vp-external-form label:first-child{grid-column:1/2;}
.vp-external-form label:nth-child(2){grid-column:2/3;}
.vp-external-form label:nth-child(3){grid-column:1/2;}
.vp-external-form button{grid-column:2/3;min-height:48px;align-self:end;}
.vp-external-form input[type="datetime-local"]{padding-right:46px!important;}

@media (max-width:1100px){
  .vp-shell{max-width:calc(100vw - 28px);}
  .vp-agenda-config{grid-template-columns:1fr;}
  .vp-agenda-config>.vp-card.soft:nth-of-type(n){grid-column:1/-1;}
  .vp-external-form{grid-template-columns:1fr;}
  .vp-external-form label:first-child,.vp-external-form label:nth-child(2),.vp-external-form label:nth-child(3),.vp-external-form button{grid-column:1/-1;}
}
@media (max-width:680px){
  .vp-shell{max-width:100%;}
  .vp-hour-row{grid-template-columns:1fr!important;gap:8px;}
  .vp-hour-row input{min-width:0;}
  .vp-duration-list label,.vp-duration-list.two label{grid-template-columns:1fr!important;}
  .vp-duration-list select,.vp-external-form select{width:100%;}
  .vp-photo-grid{grid-template-columns:1fr!important;}
}

/* Agenda compacta sin espacios vacíos */
.vp-agenda-side-card{position:relative;overflow:hidden;min-height:100%;display:flex;flex-direction:column;}
.vp-side-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:12px;}
.vp-muted.small{font-size:.86rem;margin-top:-6px;}
.vp-side-divider{height:1px;background:linear-gradient(90deg,transparent,rgba(148,189,255,.24),transparent);margin:20px 0 18px;}
.vp-agenda-art{width:145px;min-width:145px;height:112px;border-radius:22px;background:radial-gradient(circle at 35% 10%,rgba(85,214,107,.16),transparent 58%),rgba(255,255,255,.025);border:1px solid rgba(148,189,255,.12);display:grid;place-items:center;opacity:.9;}
.vp-agenda-art svg{width:124px;height:94px;fill:none;stroke:url(#agendaArtGlow);stroke-width:4.5;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 16px rgba(69,167,255,.18));}
.vp-agenda-config>.vp-card.soft:nth-of-type(2){min-height:100%;}
.vp-agenda-config>.vp-card.soft:nth-of-type(3){min-height:100%;}
.vp-agenda-config>.vp-card.soft:nth-of-type(4){margin-top:0;}
.vp-hour-list{height:100%;}
@media (max-width:1100px){
  .vp-side-card-head{align-items:center;}
  .vp-agenda-art{width:120px;min-width:120px;height:92px;}
  .vp-agenda-art svg{width:100px;height:78px;}
}
@media (max-width:680px){
  .vp-side-card-head{display:block;}
  .vp-agenda-art{margin-top:12px;width:100%;height:90px;}
}

`;
