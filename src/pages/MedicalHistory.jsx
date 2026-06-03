import { useState, useEffect } from "react";
import { getVisits, getPets, getVaccines } from "../services/api";
import api from "../services/api";

export default function MedicalHistory() {
    const [visits, setVisits] = useState([]);
    const [vaccines, setVaccines] = useState([]);
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPet, setSelectedPet] = useState("all");
    const [section, setSection] = useState("visits");
    const [clinicalPhotos, setClinicalPhotos] = useState([]);

    useEffect(() => {
        Promise.all([getVisits(), getPets(), getVaccines()])
            .then(([v, p, vac]) => {
                setVisits(v.results ?? v);
                setPets(p.results ?? p);
                setVaccines(vac.results ?? vac);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (selectedPet !== "all") {
            api.get(`/clinical-photos/list/?pet=${selectedPet}`)
                .then(res => setClinicalPhotos(res.data))
                .catch(console.error);
        } else {
            setClinicalPhotos([]);
        }
    }, [selectedPet]);

    const filteredVisits = selectedPet === "all"
        ? visits
        : visits.filter(v => v.pet === parseInt(selectedPet));

    const filteredVaccines = selectedPet === "all"
        ? vaccines
        : vaccines.filter(v => v.pet === parseInt(selectedPet));

    const selectedPetObj = pets.find(p => String(p.id) === selectedPet);

    const formatDate = (d) => {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
    };
    const formatDateShort = (d) => {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
    };

    return (
        <div className="history-page">
            <div className="blob b1" /><div className="blob b2" />
            <div className="history-inner">

                <header className="history-header">
                    <h1 className="history-title">📋 Historial médico</h1>
                    <p className="history-subtitle">El registro completo de salud de tus mascotas.</p>
                </header>

                {/* Filtros por mascota */}
                {pets.length > 0 && (
                    <div className="pet-filters">
                        <button
                            className={`pet-filter-btn ${selectedPet === "all" ? "active" : ""}`}
                            onClick={() => setSelectedPet("all")}
                        >
                            Todas
                        </button>
                        {pets.map(p => (
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

                {/* Tabs consultas / libreta */}
                <div className="section-tabs">
                    <button
                        className={`section-tab ${section === "visits" ? "active" : ""}`}
                        onClick={() => setSection("visits")}
                    >
                        📋 Consultas ({filteredVisits.length})
                    </button>
                    <button
                        className={`section-tab ${section === "vaccines" ? "active" : ""}`}
                        onClick={() => setSection("vaccines")}
                    >
                        💉 Libreta ({filteredVaccines.length})
                    </button>
                    <button
                        className={`section-tab ${section === "photos" ? "active" : ""}`}
                        onClick={() => setSection("photos")}
                    >
                        📷 Fotos ({clinicalPhotos.length})
                    </button>
                </div>

                {loading && (
                    <div className="loading-state">
                        <span className="paw-spin">🐾</span>
                        <p>Cargando historial...</p>
                    </div>
                )}

                {/* ══ CONSULTAS ══ */}
                {!loading && section === "visits" && (
                    filteredVisits.length === 0 ? (
                        <div className="empty-state">
                            <span>📭</span>
                            <h2>Sin visitas registradas</h2>
                            <p>Cuando tu mascota sea atendida, las visitas aparecerán aquí.</p>
                        </div>
                    ) : (
                        <div className="visits-list">
                            {filteredVisits.map(visit => (
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
                                            {visit.pet_name    && <span>🐾 {visit.pet_name}</span>}
                                            {visit.clinic_name && <span>🏥 {visit.clinic_name}</span>}
                                            {(visit.vet_first_name || visit.vet_last_name) && (
                                                <span>🩺 Dr/a. {visit.vet_first_name} {visit.vet_last_name} · Mat. {visit.vet_license}</span>
                                            )}
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
                                            {visit.observations && (
                                                <div className="detail-block">
                                                    <span className="detail-label">📝 Observaciones</span>
                                                    <p>{visit.observations}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* ══ LIBRETA SANITARIA ══ */}
                {!loading && section === "vaccines" && (
                    filteredVaccines.length === 0 ? (
                        <div className="empty-state">
                            <span>💉</span>
                            <h2>Sin vacunas registradas</h2>
                            <p>Las vacunas aplicadas por tu veterinaria aparecerán aquí.</p>
                        </div>
                    ) : (
                        <div className="libreta-wrap">

                            <div className="libreta-header">
                                <div className="libreta-header-left">
                                    <div className="libreta-icon">💉</div>
                                    <div>
                                        <h2 className="libreta-title">Libreta Sanitaria</h2>
                                        <p className="libreta-sub">Registro oficial de vacunación</p>
                                    </div>
                                </div>
                                {selectedPetObj && (
                                    <div className="libreta-pet-info">
                                        <p className="libreta-pet-name">{selectedPetObj.name}</p>
                                        <p className="libreta-pet-detail">
                                            {selectedPetObj.species_display || selectedPetObj.species}
                                            {selectedPetObj.breed ? ` · ${selectedPetObj.breed}` : ""}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Tabla — scroll horizontal en mobile */}
                            <div className="libreta-table-wrap">
                                <table className="libreta-table">
                                    <thead>
                                        <tr>
                                            <th className="col-num">#</th>
                                            <th>Vacuna</th>
                                            {selectedPet === "all" && <th>Paciente</th>}
                                            <th>Fecha</th>
                                            <th>Próx. dosis</th>
                                            <th>Veterinario</th>
                                            <th>Matrícula</th>
                                            <th>Lote</th>
                                            <th>Notas</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredVaccines.map((v, idx) => {
                                            const petObj = pets.find(p => String(p.id) === String(v.pet));
                                            const nextDate = v.next_dose ? new Date(v.next_dose) : null;
                                            const isOverdue = nextDate && nextDate < new Date();
                                            return (
                                                <tr key={v.id} className={idx % 2 === 0 ? "row-even" : "row-odd"}>
                                                    <td className="col-num-val">{idx + 1}</td>
                                                    <td className="vaccine-name-cell">{v.name}</td>
                                                    {selectedPet === "all" && (
                                                        <td className="pet-cell">{petObj ? petObj.name : "—"}</td>
                                                    )}
                                                    <td className="date-cell">{formatDateShort(v.date_applied)}</td>
                                                    <td>
                                                        {v.next_dose ? (
                                                            <span className={isOverdue ? "badge-overdue" : "badge-next"}>
                                                                {isOverdue ? "⚠️ Vencida" : "✓ "}{formatDateShort(v.next_dose)}
                                                            </span>
                                                        ) : <span className="td-muted">—</span>}
                                                    </td>
                                                    <td className="vet-cell">Dr/a. {v.vet_first_name} {v.vet_last_name}</td>
                                                    <td className="td-muted mono">{v.vet_license}</td>
                                                    <td className="td-muted mono">{v.batch || "—"}</td>
                                                    <td className="td-muted">{v.notes || "—"}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer libreta */}
                            <div className="libreta-footer">
                                <div className="libreta-footer-item">
                                    <span className="footer-label">Total registradas</span>
                                    <span className="footer-value">{filteredVaccines.length}</span>
                                </div>
                                <div className="libreta-footer-item">
                                    <span className="footer-label">Próx. a vencer (7d)</span>
                                    <span className="footer-value warning">
                                        {filteredVaccines.filter(v => {
                                            if (!v.next_dose) return false;
                                            const days = (new Date(v.next_dose) - new Date()) / (1000 * 60 * 60 * 24);
                                            return days >= 0 && days <= 7;
                                        }).length}
                                    </span>
                                </div>
                                <div className="libreta-footer-item">
                                    <span className="footer-label">Vencidas</span>
                                    <span className="footer-value danger">
                                        {filteredVaccines.filter(v => v.next_dose && new Date(v.next_dose) < new Date()).length}
                                    </span>
                                </div>
                                <div className="libreta-footer-powered">
                                    Emitido por <strong>VetPaw</strong> · Registro digital de salud animal
                                </div>
                            </div>
                        </div>
                    )
                )}
                
                {/* ══ FOTOS CLÍNICAS ══ */}
                {!loading && section === "photos" && (
                    selectedPet === "all" ? (
                        <div className="empty-state">
                            <span>📷</span>
                            <h2>Seleccioná una mascota</h2>
                            <p>Elegí una mascota para ver sus fotos clínicas.</p>
                        </div>
                    ) : clinicalPhotos.length === 0 ? (
                        <div className="empty-state">
                            <span>📷</span>
                            <h2>Sin fotos clínicas</h2>
                            <p>La veterinaria aún no subió fotos para esta mascota.</p>
                        </div>
                    ) : (
                        <div className="clinical-photos-grid">
                            {clinicalPhotos.map(photo => (
                                <div key={photo.id} className="clinical-photo-card">
                                    <img src={photo.image_url} alt={photo.caption || "Foto clínica"} />
                                    {photo.caption && <p className="clinical-photo-caption">{photo.caption}</p>}
                                    <p className="clinical-photo-clinic">🏥 {photo.clinic_name}</p>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Fraunces:ital,opsz,wght@1,9..144,700&family=DM+Mono:wght@400;500&display=swap');
                html, body { background: #1a1a2e !important; margin: 0; }
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                .history-page {
                    min-height: 100vh; background: #1a1a2e;
                    font-family: 'Nunito', sans-serif;
                    position: relative; overflow-x: hidden; padding-bottom: 60px;
                }
                .blob { position: fixed; border-radius: 50%; filter: blur(90px); opacity: 0.08; pointer-events: none; }
                .b1 { width: 500px; height: 500px; background: #6bcaff; top: -100px; right: -100px; }
                .b2 { width: 400px; height: 400px; background: #6bffb8; bottom: -100px; left: -100px; }

                .history-inner {
                    max-width: 980px; margin: 0 auto; padding: 32px 24px;
                    position: relative; z-index: 1;
                    display: flex; flex-direction: column; gap: 24px;
                }

                /* ── Header ── */
                .history-header { display: flex; flex-direction: column; gap: 4px; }
                .history-title { font-family: 'Fraunces', serif; font-size: 2rem; font-weight: 700; font-style: italic; color: #fff; letter-spacing: -1px; }
                .history-subtitle { color: rgba(255,255,255,0.45); font-size: 0.9rem; }

                /* ── Filtros mascota ── */
                .pet-filters {
                    display: flex; gap: 8px;
                    flex-wrap: nowrap; overflow-x: auto; padding-bottom: 4px;
                    -webkit-overflow-scrolling: touch; scrollbar-width: none;
                }
                .pet-filters::-webkit-scrollbar { display: none; }
                .pet-filter-btn {
                    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.10);
                    color: rgba(255,255,255,0.5); border-radius: 10px; padding: 7px 16px;
                    font-family: 'Nunito', sans-serif; font-size: 0.84rem; font-weight: 700;
                    cursor: pointer; transition: all 0.2s; white-space: nowrap; flex-shrink: 0;
                }
                .pet-filter-btn:hover { border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.8); }
                .pet-filter-btn.active { background: rgba(107,202,255,0.12); border-color: rgba(107,202,255,0.35); color: #6bcaff; }

                /* ── Tabs ── */
                .section-tabs {
                    display: flex; gap: 4px;
                    border-bottom: 1px solid rgba(255,255,255,0.08);
                    overflow-x: auto; scrollbar-width: none;
                }
                .section-tabs::-webkit-scrollbar { display: none; }
                .section-tab {
                    background: transparent; border: none;
                    border-bottom: 2px solid transparent;
                    color: rgba(255,255,255,0.4); font-family: 'Nunito', sans-serif;
                    font-size: 0.92rem; font-weight: 700; padding: 10px 18px;
                    cursor: pointer; transition: all 0.2s; margin-bottom: -1px;
                    white-space: nowrap; flex-shrink: 0;
                }
                .section-tab:hover { color: rgba(255,255,255,0.7); }
                .section-tab.active { color: #6bcaff; border-bottom-color: #6bcaff; }

                /* ── Loading / Empty ── */
                .loading-state, .empty-state { text-align: center; padding: 80px 20px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
                .paw-spin { font-size: 3rem; animation: spin 1s linear infinite; display: block; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .loading-state p, .empty-state p { color: rgba(255,255,255,0.4); }
                .empty-state span { font-size: 4rem; }
                .empty-state h2 { font-family: 'Fraunces', serif; font-size: 1.5rem; font-style: italic; color: #fff; }

                /* ── Consultas — timeline ── */
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
                    flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 16px; padding: 18px 20px; margin-bottom: 16px;
                    backdrop-filter: blur(10px); display: flex; flex-direction: column; gap: 12px;
                    min-width: 0;
                }
                .visit-top { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
                .visit-reason { font-size: 1rem; font-weight: 900; color: #fff; }
                .next-visit-badge { font-size: 0.72rem; font-weight: 700; background: rgba(255,217,61,0.10); border: 1px solid rgba(255,217,61,0.25); color: #ffd93d; border-radius: 6px; padding: 3px 10px; white-space: nowrap; flex-shrink: 0; }
                .visit-meta { display: flex; gap: 10px; flex-wrap: wrap; }
                .visit-meta span { font-size: 0.78rem; color: rgba(255,255,255,0.4); }
                .visit-details { display: flex; flex-direction: column; gap: 10px; }
                .detail-block { display: flex; flex-direction: column; gap: 4px; }
                .detail-label { font-size: 0.72rem; font-weight: 900; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.06em; }
                .detail-block p { font-size: 0.88rem; color: rgba(255,255,255,0.7); line-height: 1.5; }

                /* ── Libreta sanitaria ── */
                .libreta-wrap { display: flex; flex-direction: column; border-radius: 16px; overflow: hidden; border: 1px solid rgba(107,202,255,0.2); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }

                .libreta-header {
                    background: linear-gradient(135deg, #1e2a4a, #162040);
                    border-bottom: 2px solid rgba(107,202,255,0.25);
                    padding: 20px 24px; display: flex; align-items: center;
                    justify-content: space-between; flex-wrap: wrap; gap: 14px;
                }
                .libreta-header-left { display: flex; align-items: center; gap: 14px; }
                .libreta-icon { width: 48px; height: 48px; background: rgba(107,202,255,0.12); border: 1.5px solid rgba(107,202,255,0.3); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; }
                .libreta-title { font-family: 'Fraunces', serif; font-size: 1.3rem; font-weight: 700; font-style: italic; color: #fff; letter-spacing: -0.5px; }
                .libreta-sub { font-size: 0.72rem; color: rgba(107,202,255,0.6); font-weight: 600; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.08em; }
                .libreta-pet-info { background: rgba(107,202,255,0.08); border: 1px solid rgba(107,202,255,0.2); border-radius: 10px; padding: 10px 16px; }
                .libreta-pet-name { font-size: 1rem; font-weight: 900; color: #fff; }
                .libreta-pet-detail { font-size: 0.75rem; color: rgba(107,202,255,0.7); margin-top: 2px; text-transform: capitalize; }

                /* Tabla con scroll horizontal */
                .libreta-table-wrap { overflow-x: auto; background: rgba(255,255,255,0.02); -webkit-overflow-scrolling: touch; }
                .libreta-table { width: 100%; border-collapse: collapse; font-size: 0.83rem; min-width: 600px; }
                .libreta-table thead tr { background: rgba(107,202,255,0.08); border-bottom: 1.5px solid rgba(107,202,255,0.2); }
                .libreta-table th { padding: 12px 14px; text-align: left; font-size: 0.7rem; font-weight: 900; color: rgba(107,202,255,0.7); text-transform: uppercase; letter-spacing: 0.08em; white-space: nowrap; }
                .libreta-table td { padding: 12px 14px; color: rgba(255,255,255,0.8); border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
                .row-even { background: rgba(255,255,255,0.015); }
                .row-odd  { background: rgba(255,255,255,0.03); }
                .libreta-table tbody tr:last-child td { border-bottom: none; }
                .libreta-table tbody tr:hover td { background: rgba(107,202,255,0.06); }
                .col-num { width: 36px; }
                .col-num-val { text-align: center; font-weight: 900; color: rgba(107,202,255,0.5); font-size: 0.75rem; }
                .vaccine-name-cell { font-weight: 900; color: #fff; white-space: nowrap; }
                .pet-cell { font-weight: 700; color: #6bcaff; white-space: nowrap; }
                .date-cell { white-space: nowrap; color: rgba(255,255,255,0.6); }
                .vet-cell { white-space: nowrap; color: rgba(255,255,255,0.75); }
                .td-muted { color: rgba(255,255,255,0.35) !important; }
                .mono { font-family: 'DM Mono', monospace; font-size: 0.78rem; }
                .badge-next { background: rgba(107,255,184,0.1); color: #6bffb8; border: 1px solid rgba(107,255,184,0.2); border-radius: 6px; padding: 3px 8px; font-size: 0.75rem; font-weight: 700; white-space: nowrap; }
                .badge-overdue { background: rgba(255,149,0,0.12); color: #ff9500; border: 1px solid rgba(255,149,0,0.25); border-radius: 6px; padding: 3px 8px; font-size: 0.75rem; font-weight: 700; white-space: nowrap; }

                /* Footer libreta */
                .libreta-footer { background: rgba(107,202,255,0.05); border-top: 1.5px solid rgba(107,202,255,0.15); padding: 14px 20px; display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
                .libreta-footer-item { display: flex; flex-direction: column; gap: 2px; }
                .footer-label { font-size: 0.68rem; color: rgba(255,255,255,0.35); font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
                .footer-value { font-size: 1.1rem; font-weight: 900; color: #fff; }
                .footer-value.warning { color: #ffd93d; }
                .footer-value.danger  { color: #ff9500; }
                .libreta-footer-powered { margin-left: auto; font-size: 0.72rem; color: rgba(255,255,255,0.25); font-style: italic; }
                .libreta-footer-powered strong { color: rgba(107,202,255,0.5); }
                
                .clinical-photos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
                .clinical-photo-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
                .clinical-photo-card img { width: 100%; height: 160px; object-fit: cover; display: block; }
                .clinical-photo-caption { font-size: 0.8rem; color: rgba(255,255,255,0.6); padding: 8px 12px 4px; font-weight: 700; }
                .clinical-photo-clinic { font-size: 0.75rem; color: rgba(255,255,255,0.35); padding: 0 12px 10px; }

                /* ══════════════════════════════
                RESPONSIVE — MOBILE (≤600px)
                ══════════════════════════════ */
                @media (max-width: 600px) {
                    .history-inner { padding: 16px 14px; gap: 16px; }
                    .history-title { font-size: 1.5rem; }

                    /* Timeline: columna izquierda más angosta */
                    .visit-left { width: 48px; }
                    .visit-date-box { width: 48px; padding: 6px 8px; }
                    .visit-day { font-size: 1.2rem; }
                    .visit-content { padding: 14px; border-radius: 14px; }
                    .visit-reason { font-size: 0.95rem; }

                    /* Libreta header: columna en mobile */
                    .libreta-header { flex-direction: column; align-items: flex-start; padding: 16px; }
                    .libreta-pet-info { width: 100%; }
                    .libreta-title { font-size: 1.15rem; }
                    .libreta-icon { width: 40px; height: 40px; font-size: 1.3rem; }

                    /* Footer libreta: compacto */
                    .libreta-footer { gap: 16px; padding: 12px 14px; }
                    .libreta-footer-powered { margin-left: 0; width: 100%; }
                    .footer-value { font-size: 1rem; }

                    /* Empty state */
                    .empty-state { padding: 48px 16px; }
                    .empty-state span { font-size: 3rem; }
                    .empty-state h2 { font-size: 1.3rem; }
                }

                /* ══════════════════════════════
                RESPONSIVE — MOBILE XS (≤380px)
                ══════════════════════════════ */
                @media (max-width: 380px) {
                    .history-inner { padding: 12px 10px; }
                    .history-title { font-size: 1.3rem; }
                    .visit-left { width: 40px; }
                    .visit-date-box { width: 40px; padding: 5px 6px; }
                    .visit-day { font-size: 1rem; }
                }
            `}</style>
        </div>
    );
}
