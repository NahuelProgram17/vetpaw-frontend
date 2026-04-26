import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getPets, getAppointments, getClinics, getVaccines } from "../services/api";

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [pets, setPets] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [clinics, setClinics] = useState([]);
    const [vaccines, setVaccines] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getPets(), getAppointments(), getClinics(), getVaccines()])
            .then(([p, a, c, v]) => {
                setPets(p.results ?? p);
                setAppointments(a.results ?? a);
                setClinics(c.results ?? c);
                setVaccines(v.results ?? v);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const now = new Date();
    const upcoming = appointments
        .filter((a) => new Date(a.date || a.datetime) >= now)
        .sort((a, b) => new Date(a.date || a.datetime) - new Date(b.date || b.datetime))
        .slice(0, 3);

    const recent = appointments
        .filter((a) => new Date(a.date || a.datetime) < now)
        .sort((a, b) => new Date(b.date || b.datetime) - new Date(a.date || a.datetime))
        .slice(0, 3);

    const nextAppt = upcoming[0];
    const daysUntilNext = nextAppt
        ? Math.ceil((new Date(nextAppt.date || nextAppt.datetime) - now) / 86400000)
        : null;

    const firstName = user?.first_name || user?.username || "Usuario";

    const SPECIES_EMOJI = {
        dog: "🐶", perro: "🐶",
        cat: "🐱", gato: "🐱",
        bird: "🦜", pajaro: "🦜", pájaro: "🦜",
        rabbit: "🐰", conejo: "🐰",
        fish: "🐟", pez: "🐟",
    };

    const petEmoji = (species) =>
        SPECIES_EMOJI[(species || "").toLowerCase()] || "🐾";

    const formatDate = (d) => {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("es-AR", {
            day: "2-digit", month: "short", year: "numeric",
        });
    };

    const formatTime = (d) => {
        if (!d) return "";
        return new Date(d).toLocaleTimeString("es-AR", {
            hour: "2-digit", minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="dash-loading">
                <span className="paw-spin">🐾</span>
                <p>Cargando tu espacio...</p>
                <style>{`
        .dash-loading {
            min-height: 100vh; background: #1a1a2e;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center; gap: 16px;
            font-family: 'Nunito', sans-serif; color: rgba(255,255,255,0.5);
        }
        .paw-spin { font-size: 3rem; animation: spin 1s linear infinite; display: block; }
        @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
            </div>
        );
    }

    return (
        <div className="dash">
            {/* Background blobs */}
            <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />

            <div className="dash-inner">

                {/* ── Header ── */}
                <header className="dash-header">
                    <div>
                        <p className="dash-greeting">¡Hola, {firstName}! 👋</p>
                        <h1 className="dash-title">Tu panel VetPaw</h1>
                    </div>
                    <button className="btn-new-appt" onClick={() => navigate("/appointments/new")}>
                        + Nuevo turno
                    </button>
                </header>

                {/* ── Stats ── */}
                <section className="stats-grid">
                    <div className="stat-card">
                        <span className="stat-icon">🐾</span>
                        <div>
                            <p className="stat-num">{pets.length}</p>
                            <p className="stat-label">Mascotas</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <span className="stat-icon">📅</span>
                        <div>
                            <p className="stat-num">{appointments.length}</p>
                            <p className="stat-label">Turnos totales</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <span className="stat-icon">⏳</span>
                        <div>
                            <p className="stat-num">{daysUntilNext ?? "—"}</p>
                            <p className="stat-label">Días próximo turno</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <span className="stat-icon">💉</span>
                        <div>
                            <p className="stat-num">{vaccines.length}</p>
                            <p className="stat-label">Vacunas registradas</p>
                        </div>
                    </div>
                </section>

                {/* ── Mascotas + Próximos turnos ── */}
                <div className="dash-row">

                    {/* Mascotas */}
                    <section className="dash-card pets-section">
                        <div className="card-header">
                            <h2>🐾 Mis mascotas</h2>
                            <button className="btn-link" onClick={() => navigate("/pets")}>Ver todas →</button>
                        </div>
                        {pets.length === 0 ? (
                            <div className="empty-state">
                                <span>🐶</span>
                                <p>Todavía no registraste ninguna mascota.</p>
                                <button className="btn-sm" onClick={() => navigate("/pets/new")}>Agregar mascota</button>
                            </div>
                        ) : (
                            <div className="pets-list">
                                {pets.slice(0, 4).map((pet) => (
                                    <div key={pet.id} className="pet-item">
                                        <div className="pet-avatar">{petEmoji(pet.species)}</div>
                                        <div className="pet-info">
                                            <p className="pet-name">{pet.name}</p>
                                            <p className="pet-meta">{pet.species} {pet.breed ? `· ${pet.breed}` : ""}</p>
                                        </div>
                                        {pet.age && <span className="pet-age">{pet.age} años</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Próximos turnos */}
                    <section className="dash-card appts-section">
                        <div className="card-header">
                            <h2>📅 Próximos turnos</h2>
                            <button className="btn-link" onClick={() => navigate("/appointments")}>Ver todos →</button>
                        </div>
                        {upcoming.length === 0 ? (
                            <div className="empty-state">
                                <span>📭</span>
                                <p>No tenés turnos próximos.</p>
                                <button className="btn-sm" onClick={() => navigate("/appointments/new")}>Sacar turno</button>
                            </div>
                        ) : (
                            <div className="appts-list">
                                {upcoming.map((a) => (
                                    <div key={a.id} className="appt-item">
                                        <div className="appt-date-box">
                                            <span className="appt-day">
                                                {new Date(a.date || a.datetime).getDate()}
                                            </span>
                                            <span className="appt-month">
                                                {new Date(a.date || a.datetime).toLocaleString("es-AR", { month: "short" })}
                                            </span>
                                        </div>
                                        <div className="appt-info">
                                            <p className="appt-title">{a.reason || a.description || "Consulta"}</p>
                                            <p className="appt-meta">
                                                {formatTime(a.date || a.datetime)}
                                                {a.clinic_name || a.clinic ? ` · ${a.clinic_name || a.clinic}` : ""}
                                            </p>
                                        </div>
                                        <span className={`appt-status ${a.status || "pending"}`}>
                                            {a.status === "confirmed" ? "Confirmado" :
                                                a.status === "cancelled" ? "Cancelado" : "Pendiente"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* ── Clínicas + Actividad reciente ── */}
                <div className="dash-row">

                    {/* Clínicas */}
                    <section className="dash-card clinics-section">
                        <div className="card-header">
                            <h2>🏥 Clínicas disponibles</h2>
                            <button className="btn-link" onClick={() => navigate("/clinics")}>Ver todas →</button>
                        </div>
                        {clinics.length === 0 ? (
                            <div className="empty-state"><span>🏥</span><p>No hay clínicas registradas.</p></div>
                        ) : (
                            <div className="clinics-list">
                                {clinics.slice(0, 3).map((c) => (
                                    <div key={c.id} className="clinic-item">
                                        <div className="clinic-icon">🏥</div>
                                        <div className="clinic-info">
                                            <p className="clinic-name">{c.name}</p>
                                            <p className="clinic-meta">{c.address || c.city || "Sin dirección"}</p>
                                        </div>
                                        {c.phone && <span className="clinic-phone">📞 {c.phone}</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Actividad reciente */}
                    <section className="dash-card recent-section">
                        <div className="card-header">
                            <h2>🔔 Actividad reciente</h2>
                        </div>
                        {recent.length === 0 ? (
                            <div className="empty-state"><span>📋</span><p>No hay actividad reciente.</p></div>
                        ) : (
                            <div className="recent-list">
                                {recent.map((a) => (
                                    <div key={a.id} className="recent-item">
                                        <div className="recent-dot" />
                                        <div className="recent-info">
                                            <p className="recent-title">{a.reason || a.description || "Consulta"}</p>
                                            <p className="recent-date">{formatDate(a.date || a.datetime)}</p>
                                        </div>
                                        <span className={`appt-status ${a.status || "done"}`}>
                                            {a.status === "confirmed" ? "Confirmado" :
                                                a.status === "cancelled" ? "Cancelado" : "Realizado"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

            </div>

            {/* ── FAB ── */}
            <button className="fab" onClick={() => navigate("/appointments/new")} title="Nuevo turno">
                +
            </button>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Fraunces:ital,opsz,wght@1,9..144,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .dash {
        min-height: 100vh;
        background: #1a1a2e;
        font-family: 'Nunito', sans-serif;
        position: relative;
        overflow-x: hidden;
        padding-bottom: 80px;
        }

        .blob {
        position: fixed; border-radius: 50%;
        filter: blur(90px); opacity: 0.10; pointer-events: none;
        animation: blobF 10s ease-in-out infinite alternate;
        }
        .b1 { width: 500px; height: 500px; background: #ff6b6b; top: -150px; left: -150px; }
        .b2 { width: 400px; height: 400px; background: #ffd93d; bottom: -100px; right: -100px; animation-delay: -4s; }
        .b3 { width: 300px; height: 300px; background: #6bcaff; top: 40%; left: 50%; animation-delay: -2s; }
        @keyframes blobF {
        from { transform: translate(0,0) scale(1); }
        to   { transform: translate(25px,20px) scale(1.07); }
        }

        .dash-inner {
        position: relative; z-index: 1;
        max-width: 1100px; margin: 0 auto;
        padding: 32px 24px;
        }

        /* Header */
        .dash-header {
        display: flex; align-items: center;
        justify-content: space-between;
        margin-bottom: 28px;
        flex-wrap: wrap; gap: 12px;
        }
        .dash-greeting {
        font-size: 0.9rem; color: rgba(255,255,255,0.45);
        margin-bottom: 4px; font-weight: 600;
        }
        .dash-title {
        font-family: 'Fraunces', serif;
        font-size: 2rem; font-weight: 700; font-style: italic;
        color: #fff; letter-spacing: -1px;
        }
        .btn-new-appt {
        background: linear-gradient(135deg, #ff6b6b, #ff4a4a);
        color: #fff; border: none; border-radius: 12px;
        padding: 12px 22px; font-family: 'Nunito', sans-serif;
        font-size: 0.95rem; font-weight: 900; cursor: pointer;
        box-shadow: 0 6px 20px rgba(255,107,107,0.35);
        transition: transform 0.15s, box-shadow 0.15s;
        }
        .btn-new-appt:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(255,107,107,0.5); }

        /* Stats */
        .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px; margin-bottom: 24px;
        }
        .stat-card {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 16px; padding: 20px;
        display: flex; align-items: center; gap: 14px;
        backdrop-filter: blur(10px);
        transition: border-color 0.2s, transform 0.2s;
        }
        .stat-card:hover { border-color: rgba(255,107,107,0.3); transform: translateY(-2px); }
        .stat-icon { font-size: 2rem; }
        .stat-num {
        font-size: 1.8rem; font-weight: 900; color: #fff; line-height: 1;
        }
        .stat-label { font-size: 0.75rem; color: rgba(255,255,255,0.4); font-weight: 600; margin-top: 2px; }

        /* Row layout */
        .dash-row {
        display: grid; grid-template-columns: 1fr 1fr;
        gap: 20px; margin-bottom: 20px;
        }

        /* Cards */
        .dash-card {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 20px; padding: 24px;
        backdrop-filter: blur(10px);
        }
        .card-header {
        display: flex; align-items: center;
        justify-content: space-between; margin-bottom: 18px;
        }
        .card-header h2 { font-size: 1rem; font-weight: 900; color: #fff; }
        .btn-link {
        background: none; border: none; color: #ffd93d;
        font-family: 'Nunito', sans-serif; font-size: 0.82rem;
        font-weight: 700; cursor: pointer; transition: color 0.15s;
        }
        .btn-link:hover { color: #ffe97a; }

        /* Empty state */
        .empty-state {
        text-align: center; padding: 24px 0;
        display: flex; flex-direction: column; align-items: center; gap: 10px;
        }
        .empty-state span { font-size: 2.5rem; }
        .empty-state p { color: rgba(255,255,255,0.35); font-size: 0.88rem; }
        .btn-sm {
        background: rgba(255,107,107,0.15); border: 1px solid rgba(255,107,107,0.3);
        color: #ff6b6b; border-radius: 8px; padding: 8px 16px;
        font-family: 'Nunito', sans-serif; font-size: 0.84rem;
        font-weight: 700; cursor: pointer; transition: background 0.2s;
        }
        .btn-sm:hover { background: rgba(255,107,107,0.25); }

        /* Pets */
        .pets-list { display: flex; flex-direction: column; gap: 10px; }
        .pet-item {
        display: flex; align-items: center; gap: 12px;
        padding: 10px 12px; border-radius: 12px;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.06);
        transition: border-color 0.2s;
        }
        .pet-item:hover { border-color: rgba(255,217,61,0.25); }
        .pet-avatar { font-size: 1.8rem; }
        .pet-name { font-weight: 800; color: #fff; font-size: 0.95rem; }
        .pet-meta { font-size: 0.75rem; color: rgba(255,255,255,0.4); text-transform: capitalize; }
        .pet-age {
        margin-left: auto; font-size: 0.75rem; font-weight: 700;
        color: #ffd93d; background: rgba(255,217,61,0.1);
        border-radius: 6px; padding: 3px 8px;
        }

        /* Appointments */
        .appts-list { display: flex; flex-direction: column; gap: 10px; }
        .appt-item {
        display: flex; align-items: center; gap: 12px;
        padding: 10px 12px; border-radius: 12px;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.06);
        transition: border-color 0.2s;
        }
        .appt-item:hover { border-color: rgba(255,107,107,0.25); }
        .appt-date-box {
        display: flex; flex-direction: column; align-items: center;
        background: rgba(255,107,107,0.12); border-radius: 10px;
        padding: 6px 10px; min-width: 44px;
        }
        .appt-day { font-size: 1.2rem; font-weight: 900; color: #ff6b6b; line-height: 1; }
        .appt-month { font-size: 0.65rem; color: rgba(255,107,107,0.7); text-transform: uppercase; font-weight: 700; }
        .appt-title { font-weight: 800; color: #fff; font-size: 0.9rem; }
        .appt-meta { font-size: 0.75rem; color: rgba(255,255,255,0.4); }
        .appt-status {
        margin-left: auto; font-size: 0.7rem; font-weight: 700;
        border-radius: 6px; padding: 3px 8px; white-space: nowrap;
        }
        .appt-status.confirmed { background: rgba(107,202,255,0.12); color: #6bcaff; }
        .appt-status.cancelled { background: rgba(255,107,107,0.12); color: #ff6b6b; }
        .appt-status.pending, .appt-status.done { background: rgba(255,217,61,0.12); color: #ffd93d; }

        /* Clinics */
        .clinics-list { display: flex; flex-direction: column; gap: 10px; }
        .clinic-item {
        display: flex; align-items: center; gap: 12px;
        padding: 10px 12px; border-radius: 12px;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.06);
        }
        .clinic-icon { font-size: 1.6rem; }
        .clinic-name { font-weight: 800; color: #fff; font-size: 0.9rem; }
        .clinic-meta { font-size: 0.75rem; color: rgba(255,255,255,0.4); }
        .clinic-phone { margin-left: auto; font-size: 0.75rem; color: rgba(255,255,255,0.35); white-space: nowrap; }

        /* Recent */
        .recent-list { display: flex; flex-direction: column; gap: 10px; }
        .recent-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 12px; border-radius: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .recent-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #ff6b6b; flex-shrink: 0;
        }
        .recent-title { font-weight: 700; color: #fff; font-size: 0.9rem; }
        .recent-date { font-size: 0.75rem; color: rgba(255,255,255,0.4); }

        /* FAB */
        .fab {
        position: fixed; bottom: 28px; right: 28px;
        width: 56px; height: 56px; border-radius: 50%;
        background: linear-gradient(135deg, #ff6b6b, #ff4a4a);
        color: #fff; font-size: 1.8rem; font-weight: 300;
        border: none; cursor: pointer;
        box-shadow: 0 8px 24px rgba(255,107,107,0.45);
        transition: transform 0.15s, box-shadow 0.15s;
        z-index: 100;
        display: flex; align-items: center; justify-content: center;
        }
        .fab:hover { transform: scale(1.1) rotate(90deg); box-shadow: 0 12px 32px rgba(255,107,107,0.6); }

        /* Responsive */
        @media (max-width: 900px) {
        .stats-grid { grid-template-columns: repeat(2, 1fr); }
        .dash-row { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
        .stats-grid { grid-template-columns: repeat(2, 1fr); }
        .dash-inner { padding: 20px 16px; }
        .dash-title { font-size: 1.5rem; }
        }
    `}</style>
        </div>
    );
}
