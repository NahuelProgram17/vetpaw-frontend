// Clinics.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClinics, joinClinic } from '../services/api';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const SERVICE_LABELS = {
    dogs: { label: 'Perros', emoji: '🐶' },
    cats: { label: 'Gatos', emoji: '🐱' },
    rabbits: { label: 'Conejos', emoji: '🐰' },
    birds: { label: 'Aves', emoji: '🦜' },
    horses: { label: 'Caballos', emoji: '🐴' },
    exotic: { label: 'Exóticos', emoji: '🦎' },
    surgery: { label: 'Cirugías', emoji: '🩺' },
    internment: { label: 'Internación', emoji: '🏥' },
    emergency: { label: 'Urgencias 24hs', emoji: '🚨' },
    grooming: { label: 'Peluquería', emoji: '✂️' },
    xray: { label: 'Radiografías', emoji: '🩻' },
    lab: { label: 'Laboratorio', emoji: '🧪' },
};

const SPECIES_KEYS = ['dogs', 'cats', 'rabbits', 'birds', 'horses', 'exotic'];



function OwnerPawIcon() {
    return (
        <span className="owner-icon-badge" aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="none">
                <path d="M22 34c3-5 6-7 10-7s7 2 10 7l5 8c3 5 0 11-6 11H23c-6 0-9-6-6-11l5-8Z" fill="url(#pawBody)" stroke="rgba(255,255,255,.48)" strokeWidth="2"/>
                <circle cx="18" cy="24" r="6" fill="#FF9800"/><circle cx="30" cy="17" r="6" fill="#4CAF50"/><circle cx="44" cy="24" r="6" fill="#6bcaff"/><circle cx="50" cy="36" r="5" fill="#FFB74D"/>
                <defs><linearGradient id="pawBody" x1="16" y1="25" x2="49" y2="54"><stop stopColor="#4CAF50"/><stop offset="1" stopColor="#FF9800"/></linearGradient></defs>
            </svg>
        </span>
    );
}
function OwnerCalendarIcon() {
    return (
        <span className="owner-icon-badge" aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="none">
                <rect x="12" y="16" width="40" height="36" rx="8" fill="rgba(107,202,255,.13)" stroke="#6bcaff" strokeWidth="2"/>
                <path d="M12 27h40" stroke="#4CAF50" strokeWidth="2"/>
                <path d="M22 11v10M42 11v10" stroke="#FF9800" strokeWidth="4" strokeLinecap="round"/>
                <rect x="20" y="34" width="8" height="8" rx="2" fill="#4CAF50"/><rect x="32" y="34" width="8" height="8" rx="2" fill="#FF9800"/>
            </svg>
        </span>
    );
}
function OwnerVetIcon() {
    return (
        <span className="owner-icon-badge" aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="none">
                <path d="M13 51V25l19-13 19 13v26" stroke="#6bcaff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M25 51V37h14v14" stroke="#4CAF50" strokeWidth="2.4" strokeLinecap="round"/>
                <path d="M32 23v12M26 29h12" stroke="#FF9800" strokeWidth="4" strokeLinecap="round"/>
            </svg>
        </span>
    );
}
function OwnerAlertPetIcon() {
    return (
        <span className="owner-icon-badge" aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="none">
                <path d="M32 11 55 52H9L32 11Z" fill="rgba(255,152,0,.15)" stroke="#FF9800" strokeWidth="2.5"/>
                <path d="M24 39c2.4-4 4.8-5.8 8-5.8S37.6 35 40 39l2.2 3.5c1.8 2.8-.2 6.5-3.6 6.5H25.4c-3.4 0-5.4-3.7-3.6-6.5L24 39Z" fill="#4CAF50"/>
                <circle cx="23" cy="31" r="3.5" fill="#FFB74D"/><circle cx="30" cy="26" r="3.5" fill="#6bcaff"/><circle cx="38" cy="31" r="3.5" fill="#FF9800"/>
            </svg>
        </span>
    );
}

export default function Clinics() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter24h, setFilter24h] = useState(false);
    const [filterSpecies, setFilterSpecies] = useState('');
    const [filterService, setFilterService] = useState('');
    const [joining, setJoining] = useState(null);
    const [joinSuccess, setJoinSuccess] = useState('');
    const [reviewsByClinic, setReviewsByClinic] = useState({});
    const [expandedReviews, setExpandedReviews] = useState(null);
    const [locationStatus, setLocationStatus] = useState('idle');
    const [lastUpdate, setLastUpdate] = useState(null);
    const [now, setNow] = useState(Date.now());

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

    // tic cada minuto para "Actualizado hace X min"
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(t);
    }, []);

    const fetchClinics = (lat, lon) => {
        let url = '/clinics/';
        if (lat && lon) url += `?lat=${lat}&lon=${lon}`;
        api
            .get(url)
            .then((res) => {
                setClinics(res.data.results ?? res.data);
                setLastUpdate(Date.now());
            })
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

    // Derivar listas dinámicas de especies y servicios desde las clínicas reales
    const { availableSpecies, availableServices } = useMemo(() => {
        const sp = new Set();
        const sv = new Set();
        clinics.forEach((c) => {
            (c.services || []).forEach((s) => {
                if (SPECIES_KEYS.includes(s)) sp.add(s);
                else sv.add(s);
            });
        });
        return {
            availableSpecies: Array.from(sp),
            availableServices: Array.from(sv),
        };
    }, [clinics]);

    const filtered = clinics.filter((c) => {
        const matchSearch =
            !search ||
            c.name?.toLowerCase().includes(search.toLowerCase()) ||
            c.locality?.toLowerCase().includes(search.toLowerCase()) ||
            c.province?.toLowerCase().includes(search.toLowerCase());
        const match24h = !filter24h || c.is_24h;
        const matchSpecies = !filterSpecies || (c.services || []).includes(filterSpecies);
        const matchService = !filterService || (c.services || []).includes(filterService);
        return matchSearch && match24h && matchSpecies && matchService;
    });

    const hasActiveFilters = search || filter24h || filterSpecies || filterService;
    const clearFilters = () => {
        setSearch('');
        setFilter24h(false);
        setFilterSpecies('');
        setFilterService('');
    };

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

    const renderStars = (rating, small = false) =>
        [1, 2, 3, 4, 5].map((s) => (
            <span
                key={s}
                style={{
                    color: s <= Math.round(rating) ? '#ffd93d' : 'rgba(255,255,255,0.15)',
                    fontSize: small ? '0.85rem' : '1.05rem',
                }}
            >
                ★
            </span>
        ));

    const formatDate = (d) =>
        new Date(d).toLocaleDateString('es-AR', {
            day: '2-digit', month: 'short', year: 'numeric',
        });

    const timeAgo = (ts) => {
        if (!ts) return '—';
        const diff = Math.floor((now - ts) / 60000); // min
        if (diff < 1) return 'recién';
        if (diff === 1) return 'hace 1 min';
        if (diff < 60) return `hace ${diff} min`;
        const hrs = Math.floor(diff / 60);
        if (hrs === 1) return 'hace 1 h';
        return `hace ${hrs} h`;
    };

    return (
        <div className="clinics-page">
            <div className="blob b1" />
            <div className="blob b2" />
            <div className="clinics-inner">

                {/* ─── Hero ─── */}
                <section className="hero">
                    <div className="hero-left">
                        <div className="hero-eyebrow">
                            <span className="eyebrow-icon">🏥</span>
                            RED DE CENTROS VETERINARIOS
                        </div>
                        <div className="owner-hero-title-row"><OwnerVetIcon /><h1 className="hero-title">Veterinarias</h1></div>
                        <p className="hero-subtitle">
                            Encontrá clínicas veterinarias de confianza cerca tuyo.
                            <br />Atención profesional para el bienestar de tu mascota.
                        </p>
                        <div className="hero-chips">
                            <span className="hero-chip">
                                <span className="chip-icon">🏥</span>
                                {clinics.length} clínica{clinics.length !== 1 ? 's' : ''} disponible{clinics.length !== 1 ? 's' : ''}
                            </span>
                            {lastUpdate && (
                                <span className="hero-chip">
                                    <span className="chip-icon chip-dot">●</span>
                                    Actualizado {timeAgo(lastUpdate)}
                                </span>
                            )}
                            {locationStatus === 'ok' && (
                                <span className="hero-chip chip-ok">
                                    <span className="chip-icon">📍</span>
                                    Ubicación detectada
                                </span>
                            )}
                            {locationStatus === 'denied' && (
                                <span className="hero-chip chip-warn">
                                    <span className="chip-icon">📍</span>
                                    Sin ubicación — todas las clínicas
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="hero-right">
                        <HeroIllustration />
                        <button className="hero-cta" onClick={() => navigate('/appointments/new')}>
                            <span className="cta-icon">📅</span>
                            <span className="cta-text">
                                <span className="cta-title">Sacar turno</span>
                                <span className="cta-sub">Reservá ahora</span>
                            </span>
                        </button>
                    </div>
                </section>

                {/* ─── Filtros ─── */}
                <section className="filters-bar">
                    <div className="filter-search">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Buscar por nombre o localidad…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button className="search-clear" onClick={() => setSearch('')}>✕</button>
                        )}
                    </div>

                    <button
                        className={`filter-toggle ${filter24h ? 'on' : ''}`}
                        onClick={() => setFilter24h(!filter24h)}
                        title="Solo veterinarias 24hs"
                    >
                        <span>🕐 24hs</span>
                        <span className={`switch ${filter24h ? 'on' : ''}`}>
                            <span className="switch-knob" />
                        </span>
                    </button>

                    <div className="filter-select">
                        <span className="select-icon">🐾</span>
                        <select value={filterSpecies} onChange={(e) => setFilterSpecies(e.target.value)}>
                            <option value="">Todas las especies</option>
                            {availableSpecies.map((s) => (
                                <option key={s} value={s}>
                                    {SERVICE_LABELS[s]?.label || s}
                                </option>
                            ))}
                        </select>
                        <span className="select-caret">▾</span>
                    </div>

                    <div className="filter-select">
                        <span className="select-icon">🩺</span>
                        <select value={filterService} onChange={(e) => setFilterService(e.target.value)}>
                            <option value="">Todos los servicios</option>
                            {availableServices.map((s) => (
                                <option key={s} value={s}>
                                    {SERVICE_LABELS[s]?.label || s}
                                </option>
                            ))}
                        </select>
                        <span className="select-caret">▾</span>
                    </div>

                    <button
                        className="filter-clear"
                        onClick={clearFilters}
                        disabled={!hasActiveFilters}
                    >
                        <span className="clear-icon">↻</span>
                        Limpiar filtros
                    </button>
                </section>

                {joinSuccess && <div className="join-toast">✅ {joinSuccess}</div>}

                {/* ─── Loading / Empty ─── */}
                {loading && (
                    <div className="loading-state">
                        <span className="paw-spin">🐾</span>
                        <p>Cargando clínicas…</p>
                    </div>
                )}

                {!loading && filtered.length === 0 && (
                    <div className="empty-state">
                        <span className="empty-emoji">🏥</span>
                        <h2>Sin resultados</h2>
                        <p>
                            {hasActiveFilters
                                ? 'No encontramos clínicas con esos filtros.'
                                : 'Todavía no hay clínicas registradas.'}
                        </p>
                        {hasActiveFilters && (
                            <button className="btn-ghost" onClick={clearFilters}>
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                )}

                {/* ─── Grid de clínicas ─── */}
                {!loading && filtered.length > 0 && (
                    <div className="clinics-grid">
                        {filtered.map((clinic) => (
                            <article
                                key={clinic.id}
                                className={`clinic-card ${!clinic.is_active ? 'inactive' : ''}`}
                            >
                                <div className="card-head">
                                    <div className="clinic-logo">
                                        {clinic.logo ? (
                                            <img src={clinic.logo} alt={clinic.name} />
                                        ) : (
                                            <ClinicSvgPlaceholder />
                                        )}
                                    </div>
                                    <div className="card-head-info">
                                        <div className="card-title-row">
                                            <h3 className="clinic-name">{clinic.name}</h3>
                                            {clinic.is_active ? (
                                                <span className="badge badge-active">● Activa</span>
                                            ) : (
                                                <span className="badge badge-inactive">● Inactiva</span>
                                            )}
                                        </div>
                                        <div className="clinic-rating">
                                            {clinic.rating_avg ? (
                                                <>
                                                    <div className="stars-display">
                                                        {renderStars(clinic.rating_avg)}
                                                    </div>
                                                    <span className="rating-num">{Number(clinic.rating_avg).toFixed(1)}</span>
                                                    <span className="rating-count">
                                                        ({clinic.reviews_count} reseña{clinic.reviews_count !== 1 ? 's' : ''})
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="no-rating">Sin reseñas aún</span>
                                            )}
                                        </div>
                                        <div className="card-badges-row">
                                            {clinic.distance_km != null && (
                                                <span className="mini-badge mini-distance">
                                                    📍 {clinic.distance_km} km
                                                </span>
                                            )}
                                            {clinic.is_24h && (
                                                <span className="mini-badge mini-24h">🕐 24hs</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {clinic.services?.length > 0 && (
                                    <div className="clinic-specialties">
                                        {clinic.services.map((s, i) => {
                                            const info = SERVICE_LABELS[s];
                                            return (
                                                <span key={i} className={`specialty-tag tag-${s}`}>
                                                    {info?.emoji} {info?.label || s}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}

                                {clinic.description && (
                                    <p className="clinic-desc">{clinic.description}</p>
                                )}

                                <div className="clinic-details">
                                    {(clinic.address || clinic.locality || clinic.province) && (
                                        <div className="clinic-detail">
                                            <span className="detail-icon">📍</span>
                                            <span>
                                                {[clinic.address, clinic.locality, clinic.province]
                                                    .filter(Boolean).join(', ')}
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
                                                {clinic.members_count} miembro{clinic.members_count !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="card-actions">
                                    <button
                                        className="btn-perfil"
                                        onClick={() => navigate(`/clinicas/${clinic.slug}`)}
                                    >
                                        👁 Ver perfil
                                    </button>
                                    <button
                                        className="btn-turno"
                                        onClick={() => navigate('/appointments/new')}
                                        disabled={!clinic.is_active}
                                    >
                                        📅 Sacar turno
                                    </button>
                                    {user?.role === 'owner' && (
                                        clinic.is_member ? (
                                            <button className="btn-join" disabled style={{ opacity: 0.6 }}>
                                                ✓ Asociado
                                            </button>
                                        ) : (
                                            <button
                                                className="btn-join"
                                                onClick={() => handleJoin(clinic.id)}
                                                disabled={joining === clinic.id || !clinic.is_active}
                                            >
                                                {joining === clinic.id ? 'Asociando…' : '🔗 Asociarse'}
                                            </button>
                                        )
                                    )}
                                </div>

                                <div className="card-footer">
                                    {clinic.reviews_count > 0 ? (
                                        <button
                                            className="btn-toggle-reviews"
                                            onClick={() => fetchReviews(clinic.id)}
                                        >
                                            {expandedReviews === clinic.id
                                                ? '▲ Ocultar reseñas'
                                                : `▼ Ver reseña${clinic.reviews_count !== 1 ? 's' : ''} (${clinic.reviews_count})`}
                                        </button>
                                    ) : <span />}
                                    {clinic.is_active && (
                                        <span className="verified-pill">
                                            <span className="verified-check">✓</span>
                                            Centro verificado
                                        </span>
                                    )}
                                </div>

                                {expandedReviews === clinic.id && reviewsByClinic[clinic.id] && (
                                    <div className="reviews-list">
                                        {reviewsByClinic[clinic.id].map((r) => (
                                            <div key={r.id} className="review-item">
                                                <div className="review-top">
                                                    <div className="review-stars">
                                                        {renderStars(r.rating, true)}
                                                    </div>
                                                    <span className="review-author">👤 {r.owner_name}</span>
                                                    <span className="review-date">{formatDate(r.created_at)}</span>
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
                            </article>
                        ))}
                    </div>
                )}

                {/* ─── Banda de confianza ─── */}
                {!loading && clinics.length > 0 && (
                    <section className="trust-band">
                        <TrustItem icon="🛡" iconColor="#4CAF50" title="Tu mascota en buenas manos"
                            sub="Todos los centros son verificados por VetPaw para garantizar atención de calidad." />
                        <TrustItem icon="👨‍⚕️" iconColor="#FF9800" title="Profesionales"
                            sub="Veterinarios matriculados" />
                        <TrustItem icon="💚" iconColor="#ef5350" title="Atención 24/7"
                            sub="Urgencias y emergencias" />
                        <TrustItem icon="🔒" iconColor="#6bcaff" title="Seguridad"
                            sub="Centros verificados" />
                    </section>
                )}
            </div>

            <style>{styles}</style>
        </div>
    );
}

// ─── Sub-componentes ───
function HeroIllustration() {
    return (
        <svg className="hero-illu" viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
                <linearGradient id="houseG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(76,175,80,0.18)" />
                    <stop offset="100%" stopColor="rgba(76,175,80,0)" />
                </linearGradient>
                <linearGradient id="pinG" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#4CAF50" />
                    <stop offset="100%" stopColor="#FF9800" />
                </linearGradient>
            </defs>
            {/* Casa 1 */}
            <g opacity="0.55">
                <polygon points="40,90 80,55 120,90" fill="none" stroke="rgba(76,175,80,0.4)" strokeWidth="1.5" />
                <rect x="50" y="90" width="60" height="55" fill="none" stroke="rgba(76,175,80,0.4)" strokeWidth="1.5" />
                <rect x="72" y="115" width="16" height="30" fill="none" stroke="rgba(76,175,80,0.4)" strokeWidth="1.5" />
                <rect x="58" y="100" width="10" height="10" fill="none" stroke="rgba(76,175,80,0.4)" strokeWidth="1.5" />
                <rect x="92" y="100" width="10" height="10" fill="none" stroke="rgba(76,175,80,0.4)" strokeWidth="1.5" />
                <line x1="76" y1="72" x2="76" y2="60" stroke="rgba(255,152,0,0.5)" strokeWidth="1.5" />
                <rect x="72" y="55" width="10" height="6" fill="rgba(255,152,0,0.5)" />
            </g>
            {/* Casa 2 (grande, atrás) */}
            <g opacity="0.4">
                <polygon points="140,80 190,40 240,80" fill="none" stroke="rgba(107,202,255,0.45)" strokeWidth="1.5" />
                <rect x="150" y="80" width="80" height="65" fill="none" stroke="rgba(107,202,255,0.45)" strokeWidth="1.5" />
                <rect x="180" y="105" width="20" height="40" fill="none" stroke="rgba(107,202,255,0.45)" strokeWidth="1.5" />
                <rect x="158" y="90" width="14" height="14" fill="none" stroke="rgba(107,202,255,0.45)" strokeWidth="1.5" />
                <rect x="208" y="90" width="14" height="14" fill="none" stroke="rgba(107,202,255,0.45)" strokeWidth="1.5" />
                {/* cruz médica */}
                <rect x="186" y="55" width="8" height="20" fill="rgba(76,175,80,0.7)" />
                <rect x="180" y="61" width="20" height="8" fill="rgba(76,175,80,0.7)" />
            </g>
            {/* Pin GPS grande */}
            <g transform="translate(252,30)">
                <path d="M 0,0 C -16,0 -25,12 -25,28 C -25,46 0,72 0,72 C 0,72 25,46 25,28 C 25,12 16,0 0,0 Z"
                    fill="url(#pinG)" />
                <circle cx="0" cy="28" r="9" fill="#0a121d" />
            </g>
            {/* Detallitos decorativos */}
            <circle cx="30" cy="30" r="1.5" fill="rgba(76,175,80,0.6)" />
            <circle cx="290" cy="120" r="1.5" fill="rgba(255,152,0,0.6)" />
            <circle cx="180" cy="20" r="1.5" fill="rgba(107,202,255,0.6)" />
            <circle cx="120" cy="160" r="1.5" fill="rgba(167,139,250,0.6)" />
        </svg>
    );
}

function ClinicSvgPlaceholder() {
    return (
        <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="8" y="14" width="20" height="38" rx="2" fill="#fff" />
            <rect x="32" y="14" width="20" height="38" rx="2" fill="#fff" />
            <rect x="13" y="20" width="4" height="4" fill="#6bcaff" />
            <rect x="19" y="20" width="4" height="4" fill="#6bcaff" />
            <rect x="13" y="28" width="4" height="4" fill="#6bcaff" />
            <rect x="19" y="28" width="4" height="4" fill="#6bcaff" />
            <rect x="37" y="20" width="4" height="4" fill="#6bcaff" />
            <rect x="43" y="20" width="4" height="4" fill="#6bcaff" />
            {/* cruz medica */}
            <rect x="38" y="34" width="8" height="16" fill="#ef5350" />
            <rect x="34" y="38" width="16" height="8" fill="#ef5350" />
            {/* puerta clinica 1 */}
            <rect x="15" y="40" width="6" height="12" fill="#1b2a3d" />
        </svg>
    );
}

function TrustItem({ icon, iconColor, title, sub }) {
    return (
        <div className="trust-item">
            <span className="trust-icon" style={{ color: iconColor, background: `${iconColor}15` }}>
                {icon}
            </span>
            <div className="trust-text">
                <div className="trust-title">{title}</div>
                <div className="trust-sub">{sub}</div>
            </div>
        </div>
    );
}

// ─── Estilos ───
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700;800;900&family=Fraunces:ital,opsz,wght@1,9..144,700&display=swap');

/* ───────────────── VetPaw dueño visual refresh ───────────────── */
.owner-cosmic-bg,
.dash-page,
.pets-page,
.appts-page,
.clinics-page,
.lostpets-page {
    background:
        radial-gradient(circle at 14% 4%, rgba(65, 115, 255, 0.34), transparent 30%),
        radial-gradient(circle at 78% 94%, rgba(31, 95, 255, 0.42), transparent 34%),
        radial-gradient(circle at 96% 28%, rgba(76, 175, 80, 0.16), transparent 30%),
        radial-gradient(circle at 8% 82%, rgba(255, 152, 0, 0.10), transparent 28%),
        linear-gradient(180deg, #041124 0%, #061426 52%, #040914 100%) !important;
    position: relative;
    isolation: isolate;
}
.owner-cosmic-bg::before,
.dash-page::before,
.pets-page::before,
.appts-page::before,
.clinics-page::before,
.lostpets-page::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background-image:
        radial-gradient(circle, rgba(255,184,60,.95) 0 1.2px, transparent 1.4px),
        radial-gradient(circle, rgba(82,216,105,.85) 0 1.2px, transparent 1.4px),
        radial-gradient(circle, rgba(75,162,255,.9) 0 1px, transparent 1.2px),
        linear-gradient(180deg, transparent 0 48%, rgba(76,175,80,.32) 50%, transparent 58%),
        linear-gradient(180deg, transparent 0 42%, rgba(255,152,0,.32) 50%, transparent 58%),
        linear-gradient(180deg, transparent 0 46%, rgba(74,150,255,.36) 50%, transparent 58%);
    background-size: 520px 520px, 700px 700px, 610px 610px, 1px 360px, 1px 520px, 1px 430px;
    background-position: 12% 16%, 84% 20%, 70% 74%, 9% 16%, 92% 10%, 62% 0%;
    opacity: .72;
    mix-blend-mode: screen;
}
.owner-cosmic-bg::after,
.dash-page::after,
.pets-page::after,
.appts-page::after,
.clinics-page::after,
.lostpets-page::after {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background:
        radial-gradient(circle at 5% 92%, rgba(79, 195, 247, .28), transparent 18%),
        radial-gradient(circle at 92% 96%, rgba(76, 175, 80, .14), transparent 22%),
        linear-gradient(90deg, transparent, rgba(255,255,255,.035), transparent);
    opacity: .85;
}
.owner-title,
.dash-title-modern,
.pets-title,
.appts-title,
.hero-title {
    font-family: 'Baloo 2', 'Plus Jakarta Sans', 'Nunito', sans-serif !important;
    font-style: normal !important;
    font-weight: 900 !important;
    letter-spacing: -1.5px !important;
    text-shadow: 0 10px 34px rgba(0,0,0,.25);
}
.owner-icon-badge {
    width: 52px;
    height: 52px;
    border-radius: 18px;
    display: inline-grid;
    place-items: center;
    background: linear-gradient(135deg, rgba(76,175,80,.18), rgba(255,152,0,.18));
    border: 1px solid rgba(255,255,255,.10);
    box-shadow: inset 0 0 26px rgba(255,255,255,.04), 0 12px 30px rgba(0,0,0,.25);
    color: #fff;
    vertical-align: middle;
}
.owner-icon-badge svg { width: 30px; height: 30px; display: block; }
.owner-hero-title-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.clinics-page {
    min-height: 100vh; background: transparent;
    font-family: 'Nunito', sans-serif;
    position: relative; overflow-x: hidden; padding-bottom: 80px;
}
.blob { position: fixed; border-radius: 50%; filter: blur(110px); opacity: 0.10; pointer-events: none; z-index: 0; }
.b1 { width: 500px; height: 500px; background: #4CAF50; top: -150px; right: -120px; }
.b2 { width: 420px; height: 420px; background: #FF9800; bottom: -120px; left: -120px; }

.clinics-inner { max-width: 1400px; margin: 0 auto; padding: 36px 24px; position: relative; z-index: 1; }

/* ── Hero ── */
.hero {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 24px;
    align-items: center;
    background: linear-gradient(135deg, rgba(22,33,47,0.85), rgba(22,33,47,0.6));
    border: 1px solid rgba(76,175,80,0.18);
    border-radius: 24px;
    padding: 34px 36px;
    margin-bottom: 28px;
    position: relative;
    overflow: hidden;
}
.hero::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse at top right, rgba(76,175,80,0.10), transparent 60%);
    pointer-events: none;
}
.hero-left { position: relative; z-index: 1; }
.hero-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    color: rgba(255,255,255,0.55); font-size: 0.78rem; font-weight: 800;
    letter-spacing: 2px; margin-bottom: 14px; text-transform: uppercase;
}
.eyebrow-icon { font-size: 1rem; }
.hero-title {
    font-family: 'Baloo 2', 'Nunito', sans-serif; font-size: 3.2rem; font-weight: 700; font-style: normal;
    color: #fff; letter-spacing: -1.5px; line-height: 1; margin-bottom: 16px;
}
.hero-subtitle { color: rgba(255,255,255,0.65); font-size: 1rem; line-height: 1.55; max-width: 520px; }
.hero-chips { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
.hero-chip {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(27,42,61,0.7); border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.8);
    padding: 7px 14px; border-radius: 100px;
    font-size: 0.82rem; font-weight: 700;
}
.chip-icon { font-size: 0.9rem; }
.chip-dot { color: #4CAF50; font-size: 0.6rem; }
.chip-ok { color: #66BB6A; border-color: rgba(76,175,80,0.3); background: rgba(76,175,80,0.10); }
.chip-warn { color: #ffd93d; border-color: rgba(255,217,61,0.25); background: rgba(255,217,61,0.08); }

.hero-right {
    position: relative; z-index: 1;
    display: flex; flex-direction: column; gap: 16px; align-items: stretch;
}
.hero-illu { width: 100%; height: auto; max-height: 180px; }
.hero-cta {
    display: flex; align-items: center; gap: 14px;
    background: linear-gradient(135deg, #4CAF50, #FF9800);
    border: none; color: #fff; border-radius: 16px;
    padding: 18px 22px; cursor: pointer;
    box-shadow: 0 12px 32px rgba(76,175,80,0.35);
    font-family: 'Nunito', sans-serif;
    transition: transform 0.18s, box-shadow 0.18s;
}
.hero-cta:hover { transform: translateY(-2px); box-shadow: 0 16px 38px rgba(76,175,80,0.45); }
.cta-icon { font-size: 1.6rem; }
.cta-text { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.15; }
.cta-title { font-size: 1.15rem; font-weight: 900; }
.cta-sub { font-size: 0.78rem; font-weight: 600; opacity: 0.85; }

/* ── Filtros ── */
.filters-bar {
    display: grid;
    grid-template-columns: 1.4fr auto 1fr 1fr auto;
    gap: 10px;
    margin-bottom: 22px;
    align-items: stretch;
}
.filter-search {
    position: relative; display: flex; align-items: center;
    background: #16212f; border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px; padding: 0 14px;
    transition: border-color 0.15s;
}
.filter-search:focus-within { border-color: rgba(76,175,80,0.4); }
.search-icon { color: rgba(255,255,255,0.4); font-size: 0.95rem; margin-right: 10px; }
.filter-search input {
    flex: 1; background: transparent; border: none; outline: none;
    color: #fff; font-size: 0.92rem; padding: 13px 0;
    font-family: 'Nunito', sans-serif;
}
.filter-search input::placeholder { color: rgba(255,255,255,0.35); }
.search-clear {
    background: rgba(255,255,255,0.06); border: none; color: rgba(255,255,255,0.6);
    width: 22px; height: 22px; border-radius: 50%; cursor: pointer;
    display: flex; align-items: center; justify-content: center; font-size: 0.7rem;
}
.search-clear:hover { background: rgba(255,255,255,0.12); color: #fff; }

.filter-toggle {
    display: flex; align-items: center; gap: 10px;
    background: #16212f; border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.75); cursor: pointer;
    border-radius: 14px; padding: 0 16px; font-weight: 700; font-size: 0.88rem;
    font-family: 'Nunito', sans-serif;
    transition: all 0.15s;
}
.filter-toggle.on {
    border-color: rgba(76,175,80,0.4); color: #66BB6A;
    background: rgba(76,175,80,0.08);
}
.switch {
    width: 34px; height: 18px; border-radius: 100px;
    background: rgba(255,255,255,0.15); position: relative;
    transition: background 0.18s;
}
.switch.on { background: #4CAF50; }
.switch-knob {
    position: absolute; top: 2px; left: 2px;
    width: 14px; height: 14px; border-radius: 50%; background: #fff;
    transition: transform 0.18s;
}
.switch.on .switch-knob { transform: translateX(16px); }

.filter-select {
    position: relative; display: flex; align-items: center;
    background: #16212f; border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px; padding: 0 12px;
    transition: border-color 0.15s;
}
.filter-select:focus-within { border-color: rgba(76,175,80,0.4); }
.select-icon { color: rgba(255,255,255,0.5); margin-right: 8px; font-size: 0.95rem; }
.filter-select select {
    flex: 1; appearance: none; background: transparent; border: none; outline: none;
    color: #fff; font-size: 0.88rem; font-weight: 700; padding: 12px 18px 12px 0;
    font-family: 'Nunito', sans-serif; cursor: pointer;
}
.filter-select select option { background: #16212f; color: #fff; }
.select-caret {
    position: absolute; right: 12px; color: rgba(255,255,255,0.4); font-size: 0.7rem;
    pointer-events: none;
}

.filter-clear {
    display: flex; align-items: center; gap: 7px;
    background: transparent; border: 1px solid rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.75); cursor: pointer;
    border-radius: 14px; padding: 0 16px; font-weight: 700; font-size: 0.88rem;
    font-family: 'Nunito', sans-serif;
    transition: all 0.15s;
}
.filter-clear:hover:not(:disabled) {
    border-color: rgba(255,152,0,0.4); color: #FFB74D; background: rgba(255,152,0,0.06);
}
.filter-clear:disabled { opacity: 0.4; cursor: not-allowed; }
.clear-icon { font-size: 1rem; }

/* ── Toast ── */
.join-toast {
    background: linear-gradient(135deg, rgba(76,175,80,0.18), rgba(76,175,80,0.06));
    border: 1px solid rgba(76,175,80,0.35); color: #66BB6A;
    padding: 12px 18px; border-radius: 12px; font-weight: 800; margin-bottom: 16px;
    text-align: center; font-size: 0.92rem;
}

/* ── Loading / Empty ── */
.loading-state, .empty-state {
    background: #16212f; border-radius: 20px; padding: 60px 24px;
    text-align: center; border: 1px solid rgba(255,255,255,0.06);
}
.paw-spin { font-size: 3rem; display: inline-block; animation: spin 1.4s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.loading-state p { color: rgba(255,255,255,0.5); margin-top: 12px; font-weight: 700; }
.empty-emoji { font-size: 3.5rem; }
.empty-state h2 { color: #fff; margin: 12px 0 8px; font-size: 1.4rem; font-weight: 900; }
.empty-state p { color: rgba(255,255,255,0.5); margin-bottom: 20px; }
.btn-ghost {
    background: transparent; border: 1.5px solid rgba(255,255,255,0.15);
    color: rgba(255,255,255,0.85); padding: 10px 20px; border-radius: 10px;
    font-family: 'Nunito', sans-serif; font-weight: 800; cursor: pointer;
}
.btn-ghost:hover { border-color: rgba(76,175,80,0.4); color: #66BB6A; }

/* ── Grid de clínicas ── */
.clinics-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(440px, 1fr));
    gap: 20px;
}
.clinic-card {
    background: #16212f; border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px; padding: 22px; transition: all 0.2s;
    display: flex; flex-direction: column;
    position: relative; overflow: hidden;
}
.clinic-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, #4CAF50, #FF9800);
    opacity: 0; transition: opacity 0.2s;
}
.clinic-card:hover { border-color: rgba(76,175,80,0.25); transform: translateY(-3px); }
.clinic-card:hover::before { opacity: 1; }
.clinic-card.inactive { opacity: 0.55; }

.card-head { display: flex; gap: 16px; margin-bottom: 14px; }
.clinic-logo {
    width: 84px; height: 84px; border-radius: 16px;
    background: linear-gradient(135deg, rgba(107,202,255,0.10), rgba(76,175,80,0.10));
    border: 1px solid rgba(107,202,255,0.18);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; overflow: hidden;
}
.clinic-logo img { width: 100%; height: 100%; object-fit: cover; border-radius: 16px; }
.clinic-logo svg { width: 56px; height: 56px; }
.card-head-info { flex: 1; min-width: 0; }
.card-title-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 6px; }
.clinic-name {
    color: #fff; font-size: 1.45rem; font-weight: 900;
    font-family: 'Nunito', sans-serif; letter-spacing: -0.3px;
}
.badge {
    font-size: 0.7rem; font-weight: 800; padding: 4px 10px;
    border-radius: 100px; white-space: nowrap;
}
.badge-active { background: rgba(76,175,80,0.15); color: #66BB6A; border: 1px solid rgba(76,175,80,0.3); }
.badge-inactive { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); }
.clinic-rating {
    display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
    flex-wrap: wrap;
}
.stars-display { display: flex; }
.rating-num { color: #ffd93d; font-weight: 900; font-size: 1rem; }
.rating-count { color: rgba(255,255,255,0.5); font-size: 0.82rem; font-weight: 600; }
.no-rating { color: rgba(255,255,255,0.4); font-size: 0.85rem; font-style: normal; }
.card-badges-row { display: flex; gap: 6px; flex-wrap: wrap; }
.mini-badge {
    font-size: 0.7rem; font-weight: 800; padding: 3px 9px;
    border-radius: 100px;
}
.mini-distance { background: rgba(107,202,255,0.12); color: #6bcaff; border: 1px solid rgba(107,202,255,0.25); }
.mini-24h { background: rgba(167,139,250,0.12); color: #a78bfa; border: 1px solid rgba(167,139,250,0.25); }

/* Specialties con colores */
.clinic-specialties { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
.specialty-tag {
    font-size: 0.78rem; font-weight: 800; padding: 6px 11px;
    border-radius: 10px; display: inline-flex; align-items: center; gap: 4px;
    background: #1b2a3d; color: rgba(255,255,255,0.75);
    border: 1px solid rgba(255,255,255,0.06);
}
.tag-dogs { background: rgba(255,152,0,0.10); color: #FFB74D; border-color: rgba(255,152,0,0.25); }
.tag-cats { background: rgba(167,139,250,0.10); color: #a78bfa; border-color: rgba(167,139,250,0.25); }
.tag-rabbits { background: rgba(239,83,80,0.10); color: #ef9a9a; border-color: rgba(239,83,80,0.25); }
.tag-birds { background: rgba(107,202,255,0.10); color: #6bcaff; border-color: rgba(107,202,255,0.25); }
.tag-horses { background: rgba(141,110,99,0.15); color: #d7ccc8; border-color: rgba(141,110,99,0.30); }
.tag-exotic { background: rgba(255,217,61,0.10); color: #ffd93d; border-color: rgba(255,217,61,0.25); }
.tag-surgery, .tag-internment { background: rgba(76,175,80,0.10); color: #66BB6A; border-color: rgba(76,175,80,0.25); }
.tag-emergency { background: rgba(239,83,80,0.12); color: #ef5350; border-color: rgba(239,83,80,0.3); }
.tag-lab { background: rgba(76,175,80,0.10); color: #66BB6A; border-color: rgba(76,175,80,0.25); }

.clinic-desc {
    color: rgba(255,255,255,0.6); font-size: 0.9rem; line-height: 1.5;
    margin-bottom: 14px; display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
}

/* Detalles */
.clinic-details {
    display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;
    padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06);
}
.clinic-detail {
    display: flex; align-items: flex-start; gap: 10px;
    color: rgba(255,255,255,0.7); font-size: 0.88rem; line-height: 1.4;
}
.detail-icon { color: rgba(255,255,255,0.4); flex-shrink: 0; }
.clinic-detail a { color: #6bcaff; text-decoration: none; font-weight: 700; }
.clinic-detail a:hover { text-decoration: underline; }

/* Acciones */
.card-actions { display: flex; gap: 8px; margin-top: auto; }
.btn-perfil, .btn-turno, .btn-join {
    flex: 1; border: none; cursor: pointer;
    padding: 12px 14px; border-radius: 12px; font-weight: 800;
    font-family: 'Nunito', sans-serif; font-size: 0.88rem;
    transition: all 0.15s;
}
.btn-perfil {
    background: transparent; color: rgba(255,255,255,0.85);
    border: 1.5px solid rgba(255,255,255,0.12);
}
.btn-perfil:hover { border-color: rgba(107,202,255,0.4); color: #6bcaff; background: rgba(107,202,255,0.06); }
.btn-turno {
    background: linear-gradient(135deg, #4CAF50, #FF9800); color: #fff;
    box-shadow: 0 6px 20px rgba(76,175,80,0.25);
}
.btn-turno:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(76,175,80,0.35); }
.btn-turno:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-join {
    background: rgba(167,139,250,0.10); color: #a78bfa;
    border: 1.5px solid rgba(167,139,250,0.3);
}
.btn-join:hover:not(:disabled) { background: rgba(167,139,250,0.18); }

/* Footer card */
.card-footer {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 14px; padding-top: 14px;
    border-top: 1px solid rgba(255,255,255,0.06);
    gap: 10px;
}
.btn-toggle-reviews {
    background: transparent; border: none; cursor: pointer;
    color: #FFB74D; font-weight: 800; font-size: 0.85rem;
    font-family: 'Nunito', sans-serif;
}
.btn-toggle-reviews:hover { color: #FF9800; }
.verified-pill {
    display: inline-flex; align-items: center; gap: 6px;
    color: #66BB6A; font-size: 0.82rem; font-weight: 800;
}
.verified-check {
    width: 18px; height: 18px; border-radius: 50%;
    background: rgba(76,175,80,0.18); color: #66BB6A;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 0.7rem; font-weight: 900;
    border: 1px solid rgba(76,175,80,0.3);
}

/* Reviews list */
.reviews-list {
    margin-top: 12px; padding-top: 14px;
    border-top: 1px solid rgba(255,255,255,0.06);
    display: flex; flex-direction: column; gap: 12px;
}
.review-item {
    background: #1b2a3d; border-radius: 12px; padding: 12px 14px;
    border: 1px solid rgba(255,255,255,0.05);
}
.review-top { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; flex-wrap: wrap; }
.review-stars { display: flex; }
.review-author { color: rgba(255,255,255,0.85); font-size: 0.82rem; font-weight: 700; }
.review-date { color: rgba(255,255,255,0.4); font-size: 0.75rem; margin-left: auto; }
.review-pet { color: #6bcaff; font-size: 0.78rem; font-weight: 700; display: inline-block; margin-bottom: 6px; }
.review-comment { color: rgba(255,255,255,0.7); font-size: 0.85rem; line-height: 1.5; font-style: normal; }

/* ── Banda confianza ── */
.trust-band {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
    background: #16212f; border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px; padding: 22px;
    margin-top: 28px;
}
.trust-item { display: flex; align-items: center; gap: 12px; }
.trust-icon {
    width: 42px; height: 42px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.3rem; flex-shrink: 0;
}
.trust-text { min-width: 0; }
.trust-title { color: #fff; font-size: 0.92rem; font-weight: 900; margin-bottom: 2px; }
.trust-sub { color: rgba(255,255,255,0.5); font-size: 0.78rem; line-height: 1.4; }

/* ── Responsive ── */
@media (max-width: 980px) {
    .hero { grid-template-columns: 1fr; gap: 18px; padding: 26px 24px; }
    .hero-right { flex-direction: column; }
    .hero-illu { max-height: 140px; }
    .hero-title { font-size: 2.4rem; }
    .filters-bar { grid-template-columns: 1fr 1fr; }
    .filter-search { grid-column: 1 / -1; }
    .filter-clear { grid-column: 1 / -1; justify-content: center; }
    .clinics-grid { grid-template-columns: 1fr; }
    .trust-band { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 560px) {
    .clinics-inner { padding: 24px 16px; }
    .hero { padding: 22px 18px; border-radius: 18px; }
    .hero-title { font-size: 2rem; }
    .hero-subtitle { font-size: 0.92rem; }
    .filters-bar { grid-template-columns: 1fr; }
    .filter-toggle, .filter-select, .filter-clear { justify-content: space-between; }
    .clinic-card { padding: 18px; border-radius: 16px; }
    .clinic-logo { width: 64px; height: 64px; }
    .clinic-logo svg { width: 42px; height: 42px; }
    .clinic-name { font-size: 1.2rem; }
    .card-actions { flex-direction: column; }
    .trust-band { grid-template-columns: 1fr; padding: 18px; gap: 14px; }
    .card-footer { flex-direction: column; align-items: flex-start; gap: 8px; }
}
`;
