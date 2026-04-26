import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getClinics } from "../services/api";

export default function Clinics() {
const navigate = useNavigate();
const [clinics, setClinics] = useState([]);
const [loading, setLoading] = useState(true);
const [search, setSearch] = useState("");
const [filter24h, setFilter24h] = useState(false);

useEffect(() => {
    getClinics()
    .then((data) => setClinics(data.results ?? data))
    .catch(console.error)
    .finally(() => setLoading(false));
}, []);

const filtered = clinics.filter((c) => {
    const matchSearch =
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.locality?.toLowerCase().includes(search.toLowerCase()) ||
    c.province?.toLowerCase().includes(search.toLowerCase()) ||
    c.specialties?.toLowerCase().includes(search.toLowerCase());
    const match24h = filter24h ? c.is_24h : true;
    return matchSearch && match24h;
});

return (
    <div className="clinics-page">
    <div className="blob b1" /><div className="blob b2" />

    <div className="clinics-inner">
        {/* Header */}
        <header className="clinics-header">
        <div>
            <h1 className="clinics-title">🏥 Veterinarias</h1>
            <p className="clinics-subtitle">
            {clinics.length === 0
                ? "No hay clínicas registradas todavía."
                : `${filtered.length} clínica${filtered.length !== 1 ? "s" : ""} disponible${filtered.length !== 1 ? "s" : ""}`}
            </p>
        </div>
        <button className="btn-primary" onClick={() => navigate("/appointments/new")}>
            📅 Sacar turno
        </button>
        </header>

        {/* Search + Filter */}
        <div className="search-bar">
        <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
            type="text"
            placeholder="Buscar por nombre, localidad o especialidad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
            <button className="search-clear" onClick={() => setSearch("")}>✕</button>
            )}
        </div>
        <button
            className={`filter-24h ${filter24h ? "active" : ""}`}
            onClick={() => setFilter24h(!filter24h)}
        >
            🕐 24hs
        </button>
        </div>

        {/* Loading */}
        {loading && (
        <div className="loading-state">
            <span className="paw-spin">🐾</span>
            <p>Cargando clínicas...</p>
        </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
        <div className="empty-state">
            <span className="empty-emoji">🏥</span>
            <h2>Sin resultados</h2>
            <p>{search ? `No encontramos clínicas con "${search}".` : "No hay clínicas registradas todavía."}</p>
            {search && <button className="btn-ghost" onClick={() => setSearch("")}>Limpiar búsqueda</button>}
        </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
        <div className="clinics-grid">
            {filtered.map((clinic) => (
            <div key={clinic.id} className={`clinic-card ${!clinic.is_active ? "inactive" : ""}`}>
                {/* Header card */}
                <div className="clinic-card-top">
                <div className="clinic-logo">
                    {clinic.logo
                    ? <img src={clinic.logo} alt={clinic.name} />
                    : <span>🏥</span>
                    }
                </div>
                <div className="clinic-badges">
                    {clinic.is_24h && <span className="badge badge-24h">🕐 24hs</span>}
                    {clinic.is_active
                    ? <span className="badge badge-active">● Activa</span>
                    : <span className="badge badge-inactive">● Inactiva</span>
                    }
                </div>
                </div>

                <h3 className="clinic-name">{clinic.name}</h3>

                {clinic.description && (
                <p className="clinic-desc">{clinic.description}</p>
                )}

                {clinic.specialties && (
                <div className="clinic-specialties">
                    {clinic.specialties.split(",").map((s, i) => (
                    <span key={i} className="specialty-tag">{s.trim()}</span>
                    ))}
                </div>
                )}

                <div className="clinic-details">
                {(clinic.address || clinic.locality || clinic.province) && (
                    <div className="clinic-detail">
                    <span className="detail-icon">📍</span>
                    <span>
                        {[clinic.address, clinic.locality, clinic.province]
                        .filter(Boolean).join(", ")}
                    </span>
                    </div>
                )}
                {clinic.phone && (
                    <div className="clinic-detail">
                    <span className="detail-icon">📞</span>
                    <a href={`tel:${clinic.phone}`}>{clinic.phone}</a>
                    </div>
                )}
                {clinic.email && (
                    <div className="clinic-detail">
                    <span className="detail-icon">✉️</span>
                    <a href={`mailto:${clinic.email}`}>{clinic.email}</a>
                    </div>
                )}
                {clinic.members_count > 0 && (
                    <div className="clinic-detail">
                    <span className="detail-icon">👨‍⚕️</span>
                    <span>{clinic.members_count} veterinario{clinic.members_count !== 1 ? "s" : ""}</span>
                </div>
)}
                </div>

                <button
                className="btn-turno"
                onClick={() => navigate(`/appointments/new`)}
                disabled={!clinic.is_active}
                >
                📅 Sacar turno aquí
                </button>
            </div>
            ))}
        </div>
        )}
    </div>

    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Fraunces:ital,opsz,wght@1,9..144,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .clinics-page {
        min-height: 100vh; background: #1a1a2e;
        font-family: 'Nunito', sans-serif;
        position: relative; overflow-x: hidden; padding-bottom: 60px;
        }

        .blob { position: fixed; border-radius: 50%; filter: blur(90px); opacity: 0.08; pointer-events: none; }
        .b1 { width: 500px; height: 500px; background: #6bcaff; top: -100px; right: -100px; }
        .b2 { width: 400px; height: 400px; background: #ffd93d; bottom: -100px; left: -100px; }

        .clinics-inner { max-width: 1100px; margin: 0 auto; padding: 32px 24px; position: relative; z-index: 1; }

        .clinics-header {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
        }
        .clinics-title { font-family: 'Fraunces', serif; font-size: 2rem; font-weight: 700; font-style: italic; color: #fff; letter-spacing: -1px; }
        .clinics-subtitle { color: rgba(255,255,255,0.45); font-size: 0.9rem; margin-top: 4px; }

        .btn-primary {
        background: linear-gradient(135deg, #ff6b6b, #ff4a4a);
        color: #fff; border: none; border-radius: 12px;
        padding: 12px 22px; font-family: 'Nunito', sans-serif;
        font-size: 0.95rem; font-weight: 900; cursor: pointer;
        box-shadow: 0 6px 20px rgba(255,107,107,0.35);
        transition: transform 0.15s, box-shadow 0.15s;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(255,107,107,0.5); }

        /* Search */
        .search-bar { display: flex; gap: 12px; margin-bottom: 28px; }
        .search-input-wrapper {
        flex: 1; position: relative; display: flex; align-items: center;
        }
        .search-icon { position: absolute; left: 14px; font-size: 1rem; pointer-events: none; }
        .search-input-wrapper input {
        width: 100%; padding: 13px 40px 13px 42px;
        background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.10);
        border-radius: 12px; color: #fff;
        font-family: 'Nunito', sans-serif; font-size: 0.95rem; outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;
        }
        .search-input-wrapper input::placeholder { color: rgba(255,255,255,0.25); }
        .search-input-wrapper input:focus { border-color: #6bcaff; box-shadow: 0 0 0 3px rgba(107,202,255,0.12); }
        .search-clear {
        position: absolute; right: 12px; background: none; border: none;
        color: rgba(255,255,255,0.4); cursor: pointer; font-size: 0.9rem;
        transition: color 0.2s;
        }
        .search-clear:hover { color: #ff6b6b; }

        .filter-24h {
        background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.10);
        color: rgba(255,255,255,0.5); border-radius: 12px; padding: 12px 20px;
        font-family: 'Nunito', sans-serif; font-size: 0.9rem; font-weight: 700;
        cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        .filter-24h:hover { border-color: rgba(255,217,61,0.3); color: #ffd93d; }
        .filter-24h.active { background: rgba(255,217,61,0.12); border-color: rgba(255,217,61,0.4); color: #ffd93d; }

        /* States */
        .loading-state, .empty-state {
        text-align: center; padding: 80px 20px;
        display: flex; flex-direction: column; align-items: center; gap: 16px;
        }
        .paw-spin { font-size: 3rem; animation: spin 1s linear infinite; display: block; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-state p, .empty-state p { color: rgba(255,255,255,0.4); }
        .empty-emoji { font-size: 5rem; }
        .empty-state h2 { font-family: 'Fraunces', serif; font-size: 1.6rem; font-style: italic; color: #fff; }
        .btn-ghost {
        background: transparent; border: 1.5px solid rgba(255,255,255,0.15);
        color: rgba(255,255,255,0.5); border-radius: 10px; padding: 10px 20px;
        font-family: 'Nunito', sans-serif; font-weight: 700; cursor: pointer;
        transition: border-color 0.2s;
        }
        .btn-ghost:hover { border-color: rgba(255,255,255,0.3); }

        /* Grid */
        .clinics-grid {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        }

        .clinic-card {
        background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
        border-radius: 20px; padding: 24px;
        backdrop-filter: blur(10px);
        display: flex; flex-direction: column; gap: 12px;
        transition: border-color 0.2s, transform 0.2s;
        }
        .clinic-card:hover { border-color: rgba(107,202,255,0.25); transform: translateY(-3px); }
        .clinic-card.inactive { opacity: 0.55; }

        .clinic-card-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .clinic-logo {
        width: 52px; height: 52px; border-radius: 12px;
        background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.10);
        display: flex; align-items: center; justify-content: center; font-size: 1.8rem;
        overflow: hidden; flex-shrink: 0;
        }
        .clinic-logo img { width: 100%; height: 100%; object-fit: cover; }

        .clinic-badges { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }
        .badge {
        font-size: 0.7rem; font-weight: 700; border-radius: 6px; padding: 3px 8px; border: 1px solid;
        }
        .badge-24h { background: rgba(255,217,61,0.12); color: #ffd93d; border-color: rgba(255,217,61,0.25); }
        .badge-active { background: rgba(107,255,184,0.10); color: #6bffb8; border-color: rgba(107,255,184,0.2); }
        .badge-inactive { background: rgba(255,107,107,0.10); color: #ff6b6b; border-color: rgba(255,107,107,0.2); }

        .clinic-name { font-size: 1.15rem; font-weight: 900; color: #fff; }
        .clinic-desc { font-size: 0.84rem; color: rgba(255,255,255,0.45); line-height: 1.5; }

        .clinic-specialties { display: flex; flex-wrap: wrap; gap: 6px; }
        .specialty-tag {
        background: rgba(107,202,255,0.10); border: 1px solid rgba(107,202,255,0.2);
        color: #6bcaff; border-radius: 8px; padding: 3px 10px; font-size: 0.75rem; font-weight: 700;
        }

        .clinic-details { display: flex; flex-direction: column; gap: 7px; }
        .clinic-detail { display: flex; align-items: center; gap: 8px; }
        .detail-icon { font-size: 0.9rem; flex-shrink: 0; }
        .clinic-detail span, .clinic-detail a {
        font-size: 0.82rem; color: rgba(255,255,255,0.5);
        text-decoration: none; transition: color 0.2s;
        }
        .clinic-detail a:hover { color: #6bcaff; }

        .btn-turno {
        margin-top: 4px; padding: 11px;
        background: rgba(107,202,255,0.10); border: 1.5px solid rgba(107,202,255,0.25);
        color: #6bcaff; border-radius: 12px;
        font-family: 'Nunito', sans-serif; font-size: 0.9rem; font-weight: 700;
        cursor: pointer; transition: background 0.2s, border-color 0.2s;
        }
        .btn-turno:hover:not(:disabled) { background: rgba(107,202,255,0.18); border-color: rgba(107,202,255,0.45); }
        .btn-turno:disabled { opacity: 0.4; cursor: not-allowed; }

        @media (max-width: 600px) {
        .clinics-inner { padding: 20px 16px; }
        .search-bar { flex-direction: column; }
        }
    `}</style>
    </div>
);
}
