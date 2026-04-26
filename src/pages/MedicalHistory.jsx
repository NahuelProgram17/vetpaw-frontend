import { useState, useEffect } from "react";
import { getVisits, getPets } from "../services/api";

export default function MedicalHistory() {
    const [visits, setVisits] = useState([]);
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPet, setSelectedPet] = useState("all");

    useEffect(() => {
        Promise.all([getVisits(), getPets()])
            .then(([v, p]) => {
                setVisits(v.results ?? v);
                setPets(p.results ?? p);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filtered = selectedPet === "all"
        ? visits
        : visits.filter((v) => v.pet === parseInt(selectedPet));

    const formatDate = (d) => {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("es-AR", {
            day: "2-digit", month: "long", year: "numeric",
        });
    };

    const parseObservations = (obs) => {
        if (!obs) return { vet: null, text: "" };
        const match = obs.match(/^\[Vet: (.+?) \| Mat\. (.+?)\] (.*)/s);
        if (match) return { vet: `${match[1]} — Mat. ${match[2]}`, text: match[3] };
        return { vet: null, text: obs };
    };

    return (
        <div className="history-page">
            <div className="blob b1" /><div className="blob b2" />

            <div className="history-inner">
                <header className="history-header">
                    <div>
                        <h1 className="history-title">📋 Historial médico</h1>
                        <p className="history-subtitle">
                            {visits.length === 0 ? "No hay visitas registradas todavía." : `${filtered.length} visita${filtered.length !== 1 ? "s" : ""} registrada${filtered.length !== 1 ? "s" : ""}`}
                        </p>
                    </div>
                </header>

                {/* Filter by pet */}
                {pets.length > 0 && (
                    <div className="pet-filters">
                        <button className={`pet-filter-btn ${selectedPet === "all" ? "active" : ""}`} onClick={() => setSelectedPet("all")}>
                            🐾 Todas
                        </button>
                        {pets.map((p) => (
                            <button
                                key={p.id}
                                className={`pet-filter-btn ${selectedPet === String(p.id) ? "active" : ""}`}
                                onClick={() => setSelectedPet(String(p.id))}
                            >
                                {p.name}
                            </button>
                        ))}
                    </div>
                )}

                {loading && (
                    <div className="loading-state">
                        <span className="paw-spin">🐾</span>
                        <p>Cargando historial...</p>
                    </div>
                )}

                {!loading && filtered.length === 0 && (
                    <div className="empty-state">
                        <span>📭</span>
                        <h2>Sin visitas registradas</h2>
                        <p>Cuando tu mascota sea atendida, las visitas aparecerán aquí.</p>
                    </div>
                )}

                {!loading && filtered.length > 0 && (
                    <div className="visits-list">
                        {filtered.map((visit) => {
                            const { vet, text } = parseObservations(visit.observations);
                            return (
                                <div key={visit.id} className="visit-card">
                                    <div className="visit-left">
                                        <div className="visit-date-box">
                                            <span className="visit-day">{new Date(visit.date).getDate()}</span>
                                            <span className="visit-month">{new Date(visit.date).toLocaleString("es-AR", { month: "short" })}</span>
                                            <span className="visit-year">{new Date(visit.date).getFullYear()}</span>
                                        </div>
                                        <div className="visit-line" />
                                    </div>

                                    <div className="visit-content">
                                        <div className="visit-top">
                                            <h3 className="visit-reason">{visit.reason || "Consulta"}</h3>
                                            {visit.next_visit && (
                                                <span className="next-visit-badge">
                                                    📅 Próxima: {formatDate(visit.next_visit)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="visit-meta">
                                            {visit.pet_name && <span>🐾 {visit.pet_name}</span>}
                                            {visit.clinic_name && <span>🏥 {visit.clinic_name}</span>}
                                            {visit.vet_name && <span>🩺 {visit.vet_name}</span>}
                                        </div>

                                        <div className="visit-details">
                                            {visit.diagnosis && (
                                                <div className="detail-block">
                                                    <span className="detail-label">🔍 Diagnóstico</span>
                                                    <p>{visit.diagnosis}</p>
                                                </div>
                                            )}
                                            {visit.treatment && (
                                                <div className="detail-block">
                                                    <span className="detail-label">💊 Tratamiento</span>
                                                    <p>{visit.treatment}</p>
                                                </div>
                                            )}
                                            {text && (
                                                <div className="detail-block">
                                                    <span className="detail-label">📝 Observaciones</span>
                                                    <p>{text}</p>
                                                </div>
                                            )}
                                            {vet && (
                                                <div className="vet-signature">
                                                    <span>🩺 Atendido por: <strong>{vet}</strong></span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Fraunces:ital,opsz,wght@1,9..144,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .history-page {
        min-height: 100vh; background: #1a1a2e;
        font-family: 'Nunito', sans-serif;
        position: relative; overflow-x: hidden; padding-bottom: 60px;
        }
        .blob { position: fixed; border-radius: 50%; filter: blur(90px); opacity: 0.08; pointer-events: none; }
        .b1 { width: 500px; height: 500px; background: #6bcaff; top: -100px; right: -100px; }
        .b2 { width: 400px; height: 400px; background: #6bffb8; bottom: -100px; left: -100px; }

        .history-inner { max-width: 800px; margin: 0 auto; padding: 32px 24px; position: relative; z-index: 1; }

        .history-header { margin-bottom: 24px; }
        .history-title { font-family: 'Fraunces', serif; font-size: 2rem; font-weight: 700; font-style: italic; color: #fff; letter-spacing: -1px; }
        .history-subtitle { color: rgba(255,255,255,0.45); font-size: 0.9rem; margin-top: 4px; }

        .pet-filters { display: flex; gap: 8px; margin-bottom: 28px; flex-wrap: wrap; }
        .pet-filter-btn {
        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.10);
        color: rgba(255,255,255,0.5); border-radius: 10px; padding: 7px 16px;
        font-family: 'Nunito', sans-serif; font-size: 0.84rem; font-weight: 700;
        cursor: pointer; transition: all 0.2s;
        }
        .pet-filter-btn:hover { border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.8); }
        .pet-filter-btn.active { background: rgba(107,202,255,0.12); border-color: rgba(107,202,255,0.35); color: #6bcaff; }

        .loading-state, .empty-state {
        text-align: center; padding: 80px 20px;
        display: flex; flex-direction: column; align-items: center; gap: 16px;
        }
        .paw-spin { font-size: 3rem; animation: spin 1s linear infinite; display: block; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-state p, .empty-state p { color: rgba(255,255,255,0.4); }
        .empty-state span { font-size: 4rem; }
        .empty-state h2 { font-family: 'Fraunces', serif; font-size: 1.5rem; font-style: italic; color: #fff; }

        .visits-list { display: flex; flex-direction: column; gap: 0; }

        .visit-card { display: flex; gap: 0; }

        .visit-left { display: flex; flex-direction: column; align-items: center; width: 70px; flex-shrink: 0; }
        .visit-date-box {
        display: flex; flex-direction: column; align-items: center;
        background: rgba(107,202,255,0.12); border: 1px solid rgba(107,202,255,0.2);
        border-radius: 12px; padding: 8px 10px; width: 56px;
        }
        .visit-day { font-size: 1.4rem; font-weight: 900; color: #6bcaff; line-height: 1; }
        .visit-month { font-size: 0.6rem; color: rgba(107,202,255,0.7); text-transform: uppercase; font-weight: 700; }
        .visit-year { font-size: 0.6rem; color: rgba(255,255,255,0.3); font-weight: 600; margin-top: 2px; }
        .visit-line { flex: 1; width: 2px; background: rgba(255,255,255,0.06); margin: 8px 0; }

        .visit-content {
        flex: 1; background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 16px; padding: 20px; margin-bottom: 16px;
        backdrop-filter: blur(10px);
        display: flex; flex-direction: column; gap: 12px;
        }

        .visit-top { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
        .visit-reason { font-size: 1rem; font-weight: 900; color: #fff; }
        .next-visit-badge {
        font-size: 0.72rem; font-weight: 700;
        background: rgba(255,217,61,0.10); border: 1px solid rgba(255,217,61,0.25);
        color: #ffd93d; border-radius: 6px; padding: 3px 10px;
        }

        .visit-meta { display: flex; gap: 14px; flex-wrap: wrap; }
        .visit-meta span { font-size: 0.78rem; color: rgba(255,255,255,0.4); }

        .visit-details { display: flex; flex-direction: column; gap: 10px; }
        .detail-block { display: flex; flex-direction: column; gap: 4px; }
        .detail-label { font-size: 0.72rem; font-weight: 900; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.06em; }
        .detail-block p { font-size: 0.88rem; color: rgba(255,255,255,0.7); line-height: 1.5; }

        .vet-signature {
        background: rgba(107,255,184,0.06); border: 1px solid rgba(107,255,184,0.15);
        border-radius: 8px; padding: 8px 12px;
        font-size: 0.82rem; color: rgba(107,255,184,0.8);
        }
        .vet-signature strong { color: #6bffb8; }

        @media (max-width: 600px) {
        .history-inner { padding: 20px 16px; }
        .visit-left { width: 50px; }
        }
    `}</style>
        </div>
    );
}