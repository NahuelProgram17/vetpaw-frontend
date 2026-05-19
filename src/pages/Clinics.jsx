// Clinics.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClinics, joinClinic } from '../services/api';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const SERVICE_LABELS = {
    dogs: '🐶 Perros',
    cats: '🐱 Gatos',
    rabbits: '🐰 Conejos',
    birds: '🦜 Aves',
    horses: '🐴 Caballos',
    exotic: '🦎 Exóticos',
    surgery: '🔪 Cirugías',
    internment: '🏥 Internación',
    emergency: '🚨 Urgencias 24hs',
    grooming: '✂️ Peluquería',
    xray: '🩻 Radiografías',
    lab: '🧪 Laboratorio',
};

export default function Clinics() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter24h, setFilter24h] = useState(false);
    const [joining, setJoining] = useState(null);
    const [joinSuccess, setJoinSuccess] = useState('');
    const [reviewsByClinic, setReviewsByClinic] = useState({});
    const [expandedReviews, setExpandedReviews] = useState(null);
    const [locationStatus, setLocationStatus] = useState('idle');

    useEffect(() => {
        setLocationStatus('loading');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setLocationStatus('ok');
                fetchClinics(latitude, longitude);
            },
            () => {
                setLocationStatus('denied');
                if (user?.latitude && user?.longitude) {
                    fetchClinics(user.latitude, user.longitude);
                } else {
                    fetchClinics();
                }
            },
        );
    }, []);

    const fetchClinics = (lat, lon) => {
        let url = '/clinics/';
        if (lat && lon) url += `?lat=${lat}&lon=${lon}`;
        api
            .get(url)
            .then((res) => setClinics(res.data.results ?? res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const fetchReviews = async (clinicId) => {
        if (reviewsByClinic[clinicId]) {
            setExpandedReviews(expandedReviews === clinicId ? null : clinicId);
            return;
        }
        try {
            const res = await api.get(`/reviews/?clinic=${clinicId}`);
            const reviews = res.data.results ?? res.data;
            setReviewsByClinic((prev) => ({ ...prev, [clinicId]: reviews }));
            setExpandedReviews(clinicId);
        } catch (e) {
            console.error(e);
        }
    };

    const filtered = clinics.filter((c) => {
        const matchSearch =
            c.name?.toLowerCase().includes(search.toLowerCase()) ||
            c.locality?.toLowerCase().includes(search.toLowerCase()) ||
            c.province?.toLowerCase().includes(search.toLowerCase());
        return matchSearch && (filter24h ? c.is_24h : true);
    });

    const handleJoin = async (clinicId) => {
        setJoining(clinicId);
        try {
            await joinClinic(clinicId);
            setJoinSuccess('¡Te asociaste exitosamente! 🎉');
            setTimeout(() => setJoinSuccess(''), 3000);
        } catch (err) {
            alert(err.response?.data?.error || 'Error al asociarse.');
        } finally {
            setJoining(null);
        }
    };

    const renderStars = (rating, small = false) => {
        return [1, 2, 3, 4, 5].map((s) => (
            <span
                key={s}
                style={{
                    color: s <= Math.round(rating) ? '#ffd93d' : 'rgba(255,255,255,0.15)',
                    fontSize: small ? '0.85rem' : '1rem',
                }}
            >
                ★
            </span>
        ));
    };

    const formatDate = (d) =>
        new Date(d).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });

    return (
        <div className="clinics-page">
            <div className="blob b1" />
            <div className="blob b2" />
            <div className="clinics-inner">
                <header className="clinics-header">
                    <div>
                        <h1 className="clinics-title">🏥 Veterinarias</h1>
                        <p className="clinics-subtitle">
                            {clinics.length === 0
                                ? 'No hay clínicas registradas todavía.'
                                : `${filtered.length} clínica${filtered.length !== 1 ? 's' : ''} disponible${filtered.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>
                    <button
                        className="btn-primary"
                        onClick={() => navigate('/appointments/new')}
                    >
                        📅 Sacar turno
                    </button>
                </header>

                {/* Banner de ubicación */}
                {locationStatus === 'loading' && (
                    <div className="location-banner location-loading">
                        📍 Obteniendo tu ubicación...
                    </div>
                )}
                {locationStatus === 'ok' && (
                    <div className="location-banner location-ok">
                        📍 Mostrando clínicas cercanas a tu ubicación
                    </div>
                )}
                {locationStatus === 'denied' && (
                    <div className="location-banner location-denied">
                        📍 Ubicación no disponible — mostrando todas las clínicas
                    </div>
                )}

                {/* Buscador */}
                <div className="search-bar">
                    <div className="search-input-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Buscar por nombre, localidad..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button className="search-clear" onClick={() => setSearch('')}>
                                ✕
                            </button>
                        )}
                    </div>
                    <button
                        className={`filter-24h ${filter24h ? 'active' : ''}`}
                        onClick={() => setFilter24h(!filter24h)}
                    >
                        🕐 24hs
                    </button>
                </div>

                {joinSuccess && <div className="join-toast">✅ {joinSuccess}</div>}

                {loading && (
                    <div className="loading-state">
                        <span className="paw-spin">🐾</span>
                        <p>Cargando clínicas...</p>
                    </div>
                )}

                {!loading && filtered.length === 0 && (
                    <div className="empty-state">
                        <span className="empty-emoji">🏥</span>
                        <h2>Sin resultados</h2>
                        <p>
                            {search
                                ? `No encontramos clínicas con "${search}".`
                                : 'No hay clínicas registradas todavía.'}
                        </p>
                        {search && (
                            <button className="btn-ghost" onClick={() => setSearch('')}>
                                Limpiar búsqueda
                            </button>
                        )}
                    </div>
                )}

                {!loading && filtered.length > 0 && (
                    <div className="clinics-grid">
                        {filtered.map((clinic) => (
                            <div
                                key={clinic.id}
                                className={`clinic-card ${!clinic.is_active ? 'inactive' : ''}`}
                            >
                                <div className="clinic-card-top">
                                    <div className="clinic-logo">
                                        {clinic.logo ? (
                                            <img src={clinic.logo} alt={clinic.name} />
                                        ) : (
                                            <span>🏥</span>
                                        )}
                                    </div>
                                    <div className="clinic-badges">
                                        {clinic.distance_km != null && (
                                            <span className="badge badge-distance">
                                                📍 {clinic.distance_km} km
                                            </span>
                                        )}
                                        {clinic.is_24h && (
                                            <span className="badge badge-24h">🕐 24hs</span>
                                        )}
                                        {clinic.is_active ? (
                                            <span className="badge badge-active">● Activa</span>
                                        ) : (
                                            <span className="badge badge-inactive">● Inactiva</span>
                                        )}
                                    </div>
                                </div>

                                <h3 className="clinic-name">{clinic.name}</h3>

                                <div className="clinic-rating">
                                    {clinic.rating_avg ? (
                                        <>
                                            <div className="stars-display">
                                                {renderStars(clinic.rating_avg)}
                                            </div>
                                            <span className="rating-num">{clinic.rating_avg}</span>
                                            <span className="rating-count">
                                                ({clinic.reviews_count} reseña
                                                {clinic.reviews_count !== 1 ? 's' : ''})
                                            </span>
                                        </>
                                    ) : (
                                        <span className="no-rating">Sin reseñas aún</span>
                                    )}
                                </div>

                                {clinic.description && (
                                    <p className="clinic-desc">{clinic.description}</p>
                                )}

                                {clinic.services?.length > 0 && (
                                    <div className="clinic-specialties">
                                        {clinic.services.map((s, i) => (
                                            <span key={i} className="specialty-tag">
                                                {SERVICE_LABELS[s] || s}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="clinic-details">
                                    {(clinic.address || clinic.locality || clinic.province) && (
                                        <div className="clinic-detail">
                                            <span className="detail-icon">📍</span>
                                            <span>
                                                {[clinic.address, clinic.locality, clinic.province]
                                                    .filter(Boolean)
                                                    .join(', ')}
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
                                            <span className="detail-icon">👥</span>
                                            <span>
                                                {clinic.members_count} miembro
                                                {clinic.members_count !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {clinic.reviews_count > 0 && (
                                    <button
                                        className="btn-toggle-reviews"
                                        onClick={() => fetchReviews(clinic.id)}
                                    >
                                        {expandedReviews === clinic.id
                                            ? '▲ Ocultar reseñas'
                                            : `▼ Ver reseñas (${clinic.reviews_count})`}
                                    </button>
                                )}

                                {expandedReviews === clinic.id &&
                                    reviewsByClinic[clinic.id] && (
                                        <div className="reviews-list">
                                            {reviewsByClinic[clinic.id].map((r) => (
                                                <div key={r.id} className="review-item">
                                                    <div className="review-top">
                                                        <div className="review-stars">
                                                            {renderStars(r.rating, true)}
                                                        </div>
                                                        <span className="review-author">
                                                            👤 {r.owner_name}
                                                        </span>
                                                        <span className="review-date">
                                                            {formatDate(r.created_at)}
                                                        </span>
                                                    </div>
                                                    {r.pet_name && (
                                                        <span className="review-pet">🐾 {r.pet_name}</span>
                                                    )}
                                                    {r.comment && (
                                                        <p className="review-comment">"{r.comment}"</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                <div className="clinic-card-actions">
                                    <button
                                        className="btn-turno"
                                        onClick={() => navigate('/appointments/new')}
                                        disabled={!clinic.is_active}
                                    >
                                        📅 Sacar turno
                                    </button>
                                    {user?.role === 'owner' &&
                                        (clinic.is_member ? (
                                            <button
                                                className="btn-join"
                                                disabled
                                                style={{ opacity: 0.6 }}
                                            >
                                                ✓ Asociado
                                            </button>
                                        ) : (
                                            <button
                                                className="btn-join"
                                                onClick={() => handleJoin(clinic.id)}
                                                disabled={joining === clinic.id || !clinic.is_active}
                                            >
                                                {joining === clinic.id
                                                    ? 'Asociando...'
                                                    : '🔗 Asociarse'}
                                            </button>
                                        ))}
                                </div>
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

                /* ── Header ── */
                .clinics-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
                .clinics-title { font-family: 'Fraunces', serif; font-size: 2rem; font-weight: 700; font-style: italic; color: #fff; letter-spacing: -1px; }
                .clinics-subtitle { color: rgba(255,255,255,0.45); font-size: 0.9rem; margin-top: 4px; }
                .btn-primary {
                    background: linear-gradient(135deg, #4CAF50, #FF9800); color: #fff;
                    border: none; border-radius: 12px; padding: 12px 22px;
                    font-family: 'Nunito', sans-serif; font-size: 0.95rem; font-weight: 900;
                    cursor: pointer; box-shadow: 0 6px 20px rgba(76,175,80,0.35);
                    transition: transform 0.15s; white-space: nowrap;
                }
                .btn-primary:hover { transform: translateY(-2px); }

                /* ── Banners ── */
                .location-banner { padding: 10px 16px; border-radius: 10px; font-size: 0.85rem; font-weight: 700; margin-bottom: 16px; border: 1px solid; }
                .location-loading { background: rgba(107,202,255,0.08); border-color: rgba(107,202,255,0.2); color: rgba(107,202,255,0.7); }
                .location-ok { background: rgba(107,255,184,0.08); border-color: rgba(107,255,184,0.2); color: #6bffb8; }
                .location-denied { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.08); color: rgba(255,255,255,0.35); }

                /* ── Search ── */
                .search-bar { display: flex; gap: 12px; margin-bottom: 20px; }
                .search-input-wrapper { flex: 1; position: relative; display: flex; align-items: center; }
                .search-icon { position: absolute; left: 14px; font-size: 1rem; pointer-events: none; }
                .search-input-wrapper input {
                    width: 100%; padding: 13px 40px 13px 42px;
                    background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.10);
                    border-radius: 12px; color: #fff; font-family: 'Nunito', sans-serif;
                    font-size: 0.95rem; outline: none; transition: border-color 0.2s;
                }
                .search-input-wrapper input::placeholder { color: rgba(255,255,255,0.25); }
                .search-input-wrapper input:focus { border-color: #6bcaff; }
                .search-clear { position: absolute; right: 12px; background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; font-size: 0.9rem; }
                .filter-24h {
                    background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.10);
                    color: rgba(255,255,255,0.5); border-radius: 12px; padding: 12px 20px;
                    font-family: 'Nunito', sans-serif; font-size: 0.9rem; font-weight: 700;
                    cursor: pointer; transition: all 0.2s; white-space: nowrap; flex-shrink: 0;
                }
                .filter-24h.active { background: rgba(255,217,61,0.12); border-color: rgba(255,217,61,0.4); color: #ffd93d; }

                /* ── Toast ── */
                .join-toast { background: rgba(107,255,184,0.12); border: 1px solid rgba(107,255,184,0.3); color: #6bffb8; padding: 12px 16px; border-radius: 12px; font-size: 0.9rem; font-weight: 700; margin-bottom: 16px; }

                /* ── Loading / Empty ── */
                .loading-state, .empty-state { text-align: center; padding: 80px 20px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
                .paw-spin { font-size: 3rem; animation: spin 1s linear infinite; display: block; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .loading-state p, .empty-state p { color: rgba(255,255,255,0.4); }
                .empty-emoji { font-size: 5rem; }
                .empty-state h2 { font-family: 'Fraunces', serif; font-size: 1.6rem; font-style: italic; color: #fff; }
                .btn-ghost { background: transparent; border: 1.5px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.5); border-radius: 10px; padding: 10px 20px; font-family: 'Nunito', sans-serif; font-weight: 700; cursor: pointer; }

                /* ── Grid ── */
                .clinics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }

                /* ── Card ── */
                .clinic-card {
                    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 20px; padding: 24px; backdrop-filter: blur(10px);
                    display: flex; flex-direction: column; gap: 12px;
                    transition: border-color 0.2s, transform 0.2s;
                }
                .clinic-card:hover { border-color: rgba(107,202,255,0.25); transform: translateY(-3px); }
                .clinic-card.inactive { opacity: 0.55; }

                .clinic-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; overflow: hidden; }
                .clinic-logo { width: 52px; height: 52px; border-radius: 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.10); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; overflow: hidden; flex-shrink: 0; min-width: 52px; }
                .clinic-logo img { width: 100%; height: 100%; object-fit: cover; }
                .clinic-badges { flex-direction: row; align-items: center; flex-wrap: wrap; gap: 4px;max-width: calc(100% - 68px); overflow: hidden; }
                .badge { font-size: 0.7rem; font-weight: 700; border-radius: 6px; padding: 3px 8px; border: 1px solid; }
                .badge-distance { background: rgba(107,202,255,0.12); color: #6bcaff; border-color: rgba(107,202,255,0.3); }
                .badge-24h { background: rgba(255,217,61,0.12); color: #ffd93d; border-color: rgba(255,217,61,0.25); }
                .badge-active { background: rgba(107,255,184,0.10); color: #6bffb8; border-color: rgba(107,255,184,0.2); }
                .badge-inactive { background: rgba(255,107,107,0.10); color: #ff6b6b; border-color: rgba(255,107,107,0.2); }

                .clinic-name { font-size: 1.15rem; font-weight: 900; color: #fff; }
                .clinic-rating { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
                .stars-display { display: flex; gap: 1px; }
                .rating-num { font-size: 0.9rem; font-weight: 900; color: #ffd93d; }
                .rating-count { font-size: 0.78rem; color: rgba(255,255,255,0.4); }
                .no-rating { font-size: 0.78rem; color: rgba(255,255,255,0.3); font-style: italic; }
                .clinic-desc { font-size: 0.84rem; color: rgba(255,255,255,0.45); line-height: 1.5; }

                .clinic-specialties { display: flex; flex-wrap: wrap; gap: 6px; }
                .specialty-tag { background: rgba(107,202,255,0.10); border: 1px solid rgba(107,202,255,0.2); color: #6bcaff; border-radius: 8px; padding: 3px 10px; font-size: 0.75rem; font-weight: 700; }

                .clinic-details { display: flex; flex-direction: column; gap: 7px; }
                .clinic-detail { display: flex; align-items: flex-start; gap: 8px; }
                .detail-icon { font-size: 0.9rem; flex-shrink: 0; margin-top: 1px; }
                .clinic-detail span, .clinic-detail a { font-size: 0.82rem; color: rgba(255,255,255,0.5); text-decoration: none; transition: color 0.2s; word-break: break-word; }
                .clinic-detail a:hover { color: #6bcaff; }

                .btn-toggle-reviews { background: none; border: none; color: rgba(255,217,61,0.7); font-family: 'Nunito', sans-serif; font-size: 0.78rem; font-weight: 700; cursor: pointer; padding: 0; text-align: left; transition: color 0.2s; }
                .btn-toggle-reviews:hover { color: #ffd93d; }

                .reviews-list { display: flex; flex-direction: column; gap: 10px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 12px; }
                .review-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; }
                .review-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
                .review-stars { display: flex; gap: 1px; }
                .review-author { font-size: 0.75rem; font-weight: 700; color: rgba(255,255,255,0.6); }
                .review-date { font-size: 0.7rem; color: rgba(255,255,255,0.3); margin-left: auto; }
                .review-pet { font-size: 0.72rem; color: rgba(255,255,255,0.35); }
                .review-comment { font-size: 0.82rem; color: rgba(255,255,255,0.6); font-style: italic; line-height: 1.4; margin-top: 2px; }

                /* ── Acciones card ── */
                .clinic-card-actions { display: flex; gap: 8px; margin-top: 4px; }
                .btn-turno {
                    flex: 1; padding: 11px;
                    background: rgba(76,175,80,0.10); border: 1.5px solid rgba(76,175,80,0.25);
                    color: #4CAF50; border-radius: 12px;
                    font-family: 'Nunito', sans-serif; font-size: 0.9rem; font-weight: 700;
                    cursor: pointer; transition: background 0.2s;
                }
                .btn-turno:hover:not(:disabled) { background: rgba(76,175,80,0.18); }
                .btn-turno:disabled { opacity: 0.4; cursor: not-allowed; }
                .btn-join {
                    padding: 11px 16px;
                    background: rgba(255,217,61,0.10); border: 1.5px solid rgba(255,217,61,0.25);
                    color: #ffd93d; border-radius: 12px;
                    font-family: 'Nunito', sans-serif; font-size: 0.9rem; font-weight: 700;
                    cursor: pointer; transition: background 0.2s; white-space: nowrap;
                }
                .btn-join:hover:not(:disabled) { background: rgba(255,217,61,0.18); }
                .btn-join:disabled { opacity: 0.4; cursor: not-allowed; }

                /* ══════════════════════════════
                RESPONSIVE — TABLET (≤900px)
                ══════════════════════════════ */
                @media (max-width: 900px) {
                    .clinics-grid { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
                }

                /* ══════════════════════════════
                RESPONSIVE — MOBILE (≤600px)
                ══════════════════════════════ */
                @media (max-width: 600px) {
                    .clinics-inner { padding: 16px 14px; }

                /* Header — botón compacto, no full width */
                .clinics-header { flex-direction: column; align-items: flex-start; margin-bottom: 16px; }
                .clinics-title { font-size: 1.5rem; }
                .clinics-header .btn-primary {
                    align-self: flex-start;
                    padding: 10px 18px;
                    font-size: 0.88rem;
                }

                /* Search */
                .search-bar { flex-direction: row; gap: 8px; }
                .filter-24h { padding: 13px 14px; font-size: 0.82rem; }

                /* Grid: 1 columna */
                .clinics-grid { grid-template-columns: 1fr; gap: 14px; }

                /* Card */
                .clinic-card { padding: 18px 16px; border-radius: 16px; gap: 10px; }

                /* Badges — en fila, con wrap para que no se salgan */
                .clinic-badges {
                    flex-direction: row; align-items: center;
                    flex-wrap: wrap; gap: 4px;
                    max-width: 60%;
                }

                /* Specialties — scroll horizontal, tags no se achican */
                .clinic-specialties {
                    flex-wrap: nowrap; overflow-x: auto;
                    padding-bottom: 6px;
                    -webkit-overflow-scrolling: touch; scrollbar-width: none;
                }
                .clinic-specialties::-webkit-scrollbar { display: none; }
                .specialty-tag { flex-shrink: 0; }

                /* Acciones: columna */
                .clinic-card-actions { flex-direction: column; gap: 8px; }
                .btn-turno { flex: none; width: 100%; padding: 12px; }
                .btn-join { width: 100%; padding: 12px; text-align: center; }

                /* Empty state */
                .empty-state { padding: 48px 16px; }
                .empty-emoji { font-size: 3.5rem; }
                .empty-state h2 { font-size: 1.3rem; }
            }

                /* ══════════════════════════════
                RESPONSIVE — MOBILE XS (≤380px)
                ══════════════════════════════ */
                @media (max-width: 380px) {
                    .clinics-inner { padding: 12px 10px; }
                    .clinics-title { font-size: 1.3rem; }
                    .clinic-card { padding: 14px 12px; }
                    .filter-24h { padding: 13px 10px; font-size: 0.78rem; }
                }
            `}</style>
        </div>
    );
}
