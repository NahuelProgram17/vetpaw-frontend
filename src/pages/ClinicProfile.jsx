import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import VetPawLoader from '../components/VetPawLoader';

const SERVICE_LABELS = {
    dogs: '🐶 Perros', cats: '🐱 Gatos', rabbits: '🐰 Conejos',
    birds: '🦜 Aves', horses: '🐴 Caballos', exotic: '🦎 Exóticos',
    surgery: '🔪 Cirugías', internment: '🏥 Internación',
    emergency: '🚨 Urgencias 24hs', grooming: '✂️ Peluquería',
    xray: '🩻 Radiografías', lab: '🧪 Laboratorio',
};

const renderStars = (rating, small = false) =>
    [1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ color: s <= Math.round(rating) ? '#ffd93d' : 'rgba(255,255,255,0.15)', fontSize: small ? '0.85rem' : '1.1rem' }}>★</span>
    ));

const formatDate = (d) =>
    new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

export default function ClinicProfile() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [clinic, setClinic] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [activePhoto, setActivePhoto] = useState(null);

    useEffect(() => {
        api.get(`/clinics/perfil/${slug}/`)
            .then((res) => setClinic(res.data))
            .catch((err) => {
                if (err.response?.status === 404) setNotFound(true);
            })
            .finally(() => setLoading(false));
    }, [slug]);

    if (loading) return <VetPawLoader message="Cargando perfil..." subText="Preparando la veterinaria" />;

    if (notFound) return (
        <div className="cp-page">
            <div className="blob b1" /><div className="blob b2" />
            <div className="cp-inner">
                <div className="empty-state">
                    <span className="empty-emoji">🏥</span>
                    <h2>Clínica no encontrada</h2>
                    <p>El link puede estar desactualizado o la clínica fue dada de baja.</p>
                    <button className="btn-ghost" onClick={() => navigate('/clinics')}>Ver todas las clínicas</button>
                </div>
            </div>
            <style>{baseStyles}</style>
        </div>
    );

    return (
        <div className="cp-page">
            <div className="blob b1" /><div className="blob b2" />
            <div className="cp-inner">

                <button className="btn-back" onClick={() => navigate('/clinics')}>← Volver</button>

                {/* Hero */}
                <div className="cp-hero">
                    <div className="cp-logo">
                        {clinic.logo ? <img src={clinic.logo} alt={clinic.name} /> : <span>🏥</span>}
                    </div>
                    <div className="cp-hero-info">
                        <div className="cp-badges">
                            {clinic.is_24h && <span className="badge badge-24h">🕐 24hs</span>}
                            <span className="badge badge-active">● Activa</span>
                        </div>
                        <h1 className="cp-name">{clinic.name}</h1>
                        {clinic.rating_avg ? (
                            <div className="cp-rating">
                                <div className="stars-display">{renderStars(clinic.rating_avg)}</div>
                                <span className="rating-num">{clinic.rating_avg}</span>
                                <span className="rating-count">({clinic.reviews_count} reseña{clinic.reviews_count !== 1 ? 's' : ''})</span>
                            </div>
                        ) : (
                            <span className="no-rating">Sin reseñas aún</span>
                        )}
                    </div>
                </div>

                {/* Descripción */}
                {clinic.description && (
                    <div className="cp-section">
                        <p className="cp-description">{clinic.description}</p>
                    </div>
                )}

                {/* Info + Turno */}
                <div className="cp-grid">
                    <div className="cp-section">
                        <h2 className="cp-section-title">📍 Información</h2>
                        <div className="clinic-details">
                            {(clinic.address || clinic.locality || clinic.province) && (
                                <div className="clinic-detail">
                                    <span className="detail-icon">📍</span>
                                    <span>{[clinic.address, clinic.locality, clinic.province].filter(Boolean).join(', ')}</span>
                                </div>
                            )}
                            {clinic.phone && (
                                <div className="clinic-detail">
                                    <span className="detail-icon">📞</span>
                                    <a href={`tel:${clinic.phone}`}>{clinic.phone}</a>
                                </div>
                            )}
                            {clinic.members_count > 0 && (
                                <div className="clinic-detail">
                                    <span className="detail-icon">👥</span>
                                    <span>{clinic.members_count} miembro{clinic.members_count !== 1 ? 's' : ''} registrado{clinic.members_count !== 1 ? 's' : ''}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="cp-cta-box">
                        <p className="cp-cta-text">¿Querés atenderte acá?</p>
                        <button
                            className="btn-turno-big"
                            onClick={() => user ? navigate('/appointments/new') : navigate('/login')}
                        >
                            📅 Sacar turno
                        </button>
                        {!user && <p className="cp-cta-hint">Necesitás una cuenta para sacar turno</p>}
                    </div>
                </div>

                {/* Fotos del local */}
                {clinic.photos?.length > 0 && (
                    <div className="cp-section">
                        <h2 className="cp-section-title">📷 Fotos del local</h2>
                        <div className="cp-photos-grid">
                            {clinic.photos.map((photo) => (
                                <div
                                    key={photo.id}
                                    className="cp-photo-thumb"
                                    onClick={() => setActivePhoto(photo)}
                                >
                                    <img src={photo.image} alt={photo.caption || clinic.name} />
                                    {photo.caption && (
                                        <div className="cp-photo-caption">{photo.caption}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Servicios */}
                {clinic.services?.length > 0 && (
                    <div className="cp-section">
                        <h2 className="cp-section-title">🩺 Servicios</h2>
                        <div className="clinic-specialties">
                            {clinic.services.map((s, i) => (
                                <span key={i} className="specialty-tag">{SERVICE_LABELS[s] || s}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reseñas */}
                <div className="cp-section">
                    <h2 className="cp-section-title">⭐ Reseñas</h2>
                    {clinic.reviews?.length > 0 ? (
                        <div className="reviews-list">
                            {clinic.reviews.map((r) => (
                                <div key={r.id} className="review-item">
                                    <div className="review-top">
                                        <div className="review-stars">{renderStars(r.rating, true)}</div>
                                        <span className="review-author">👤 {r.owner_name}</span>
                                        <span className="review-date">{formatDate(r.created_at)}</span>
                                    </div>
                                    {r.comment && <p className="review-comment">"{r.comment}"</p>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-rating">Esta clínica todavía no tiene reseñas.</p>
                    )}
                </div>

            </div>

            {/* Lightbox */}
            {activePhoto && (
                <div className="cp-lightbox" onClick={() => setActivePhoto(null)}>
                    <button className="cp-lightbox-close" onClick={() => setActivePhoto(null)}>✕</button>
                    <img src={activePhoto.image} alt={activePhoto.caption || clinic.name} onClick={e => e.stopPropagation()} />
                    {activePhoto.caption && (
                        <p className="cp-lightbox-caption" onClick={e => e.stopPropagation()}>{activePhoto.caption}</p>
                    )}
                </div>
            )}

            <style>{baseStyles}</style>
        </div>
    );
}

const baseStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Fraunces:ital,opsz,wght@1,9..144,700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .cp-page { min-height: 100vh; background: #1a1a2e; font-family: 'Nunito', sans-serif; position: relative; overflow-x: hidden; padding-bottom: 60px; }
    .blob { position: fixed; border-radius: 50%; filter: blur(90px); opacity: 0.08; pointer-events: none; }
    .b1 { width: 500px; height: 500px; background: #6bcaff; top: -100px; right: -100px; }
    .b2 { width: 400px; height: 400px; background: #ffd93d; bottom: -100px; left: -100px; }
    .cp-inner { max-width: 820px; margin: 0 auto; padding: 32px 24px; position: relative; z-index: 1; display: flex; flex-direction: column; gap: 20px; }

    .btn-back { background: none; border: none; color: rgba(255,255,255,0.4); font-family: 'Nunito', sans-serif; font-size: 0.9rem; font-weight: 700; cursor: pointer; padding: 0; text-align: left; transition: color 0.2s; width: fit-content; }
    .btn-back:hover { color: #fff; }

    .cp-hero { display: flex; gap: 20px; align-items: flex-start; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 24px; backdrop-filter: blur(10px); }
    .cp-logo { width: 80px; height: 80px; border-radius: 16px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.10); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; overflow: hidden; flex-shrink: 0; }
    .cp-logo img { width: 100%; height: 100%; object-fit: cover; }
    .cp-hero-info { display: flex; flex-direction: column; gap: 8px; }
    .cp-badges { display: flex; gap: 6px; flex-wrap: wrap; }
    .cp-name { font-family: 'Fraunces', serif; font-size: 1.8rem; font-weight: 700; font-style: italic; color: #fff; letter-spacing: -0.5px; }
    .cp-rating { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .stars-display { display: flex; gap: 1px; }
    .rating-num { font-size: 1rem; font-weight: 900; color: #ffd93d; }
    .rating-count { font-size: 0.82rem; color: rgba(255,255,255,0.4); }
    .no-rating { font-size: 0.82rem; color: rgba(255,255,255,0.3); font-style: italic; }

    .cp-section { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 24px; backdrop-filter: blur(10px); display: flex; flex-direction: column; gap: 14px; }
    .cp-section-title { font-size: 1rem; font-weight: 900; color: rgba(255,255,255,0.7); }
    .cp-description { font-size: 0.92rem; color: rgba(255,255,255,0.55); line-height: 1.6; }

    .cp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .cp-cta-box { background: rgba(76,175,80,0.06); border: 1px solid rgba(76,175,80,0.2); border-radius: 20px; padding: 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; text-align: center; }
    .cp-cta-text { font-size: 1rem; font-weight: 900; color: rgba(255,255,255,0.7); }
    .cp-cta-hint { font-size: 0.75rem; color: rgba(255,255,255,0.3); }
    .btn-turno-big { width: 100%; padding: 14px; background: linear-gradient(135deg, #4CAF50, #66BB6A); border: none; border-radius: 12px; color: #fff; font-family: 'Nunito', sans-serif; font-size: 1rem; font-weight: 900; cursor: pointer; box-shadow: 0 6px 20px rgba(76,175,80,0.3); transition: transform 0.15s; }
    .btn-turno-big:hover { transform: translateY(-2px); }

    .clinic-details { display: flex; flex-direction: column; gap: 10px; }
    .clinic-detail { display: flex; align-items: flex-start; gap: 8px; }
    .detail-icon { font-size: 0.9rem; flex-shrink: 0; margin-top: 2px; }
    .clinic-detail span, .clinic-detail a { font-size: 0.88rem; color: rgba(255,255,255,0.55); text-decoration: none; transition: color 0.2s; }
    .clinic-detail a:hover { color: #6bcaff; }

    .clinic-specialties { display: flex; flex-wrap: wrap; gap: 8px; }
    .specialty-tag { background: rgba(107,202,255,0.10); border: 1px solid rgba(107,202,255,0.2); color: #6bcaff; border-radius: 8px; padding: 5px 12px; font-size: 0.8rem; font-weight: 700; }

    /* Fotos */
    .cp-photos-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .cp-photo-thumb { position: relative; border-radius: 12px; overflow: hidden; cursor: pointer; aspect-ratio: 4/3; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); transition: transform 0.2s, border-color 0.2s; }
    .cp-photo-thumb:hover { transform: scale(1.02); border-color: rgba(107,202,255,0.3); }
    .cp-photo-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .cp-photo-caption { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.7)); color: rgba(255,255,255,0.85); font-size: 0.72rem; font-weight: 700; padding: 16px 10px 8px; }

    /* Lightbox */
    .cp-lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 2000; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; cursor: pointer; }
    .cp-lightbox img { max-width: 100%; max-height: 80vh; border-radius: 12px; object-fit: contain; cursor: default; }
    .cp-lightbox-close { position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius: 8px; padding: 8px 14px; font-family: 'Nunito', sans-serif; font-size: 1rem; font-weight: 700; cursor: pointer; }
    .cp-lightbox-caption { color: rgba(255,255,255,0.6); font-size: 0.85rem; margin-top: 12px; cursor: default; }

    .reviews-list { display: flex; flex-direction: column; gap: 12px; }
    .review-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; }
    .review-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .review-stars { display: flex; gap: 1px; }
    .review-author { font-size: 0.78rem; font-weight: 700; color: rgba(255,255,255,0.6); }
    .review-date { font-size: 0.72rem; color: rgba(255,255,255,0.3); margin-left: auto; }
    .review-comment { font-size: 0.85rem; color: rgba(255,255,255,0.55); font-style: italic; line-height: 1.5; }

    .badge { font-size: 0.72rem; font-weight: 700; border-radius: 6px; padding: 3px 9px; border: 1px solid; }
    .badge-24h { background: rgba(255,217,61,0.12); color: #ffd93d; border-color: rgba(255,217,61,0.25); }
    .badge-active { background: rgba(107,255,184,0.10); color: #6bffb8; border-color: rgba(107,255,184,0.2); }

    .loading-state, .empty-state { text-align: center; padding: 80px 20px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .paw-spin { font-size: 3rem; animation: spin 1s linear infinite; display: block; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-state p, .empty-state p { color: rgba(255,255,255,0.4); }
    .empty-emoji { font-size: 5rem; }
    .empty-state h2 { font-family: 'Fraunces', serif; font-size: 1.6rem; font-style: italic; color: #fff; }
    .btn-ghost { background: transparent; border: 1.5px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.5); border-radius: 10px; padding: 10px 20px; font-family: 'Nunito', sans-serif; font-weight: 700; cursor: pointer; }

    @media (max-width: 640px) {
        .cp-inner { padding: 16px 14px; }
        .cp-hero { flex-direction: column; gap: 14px; }
        .cp-logo { width: 64px; height: 64px; font-size: 2rem; }
        .cp-name { font-size: 1.4rem; }
        .cp-grid { grid-template-columns: 1fr; }
        .cp-photos-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
    }

    @media (max-width: 380px) {
        .cp-photos-grid { grid-template-columns: 1fr; }
    }
`;