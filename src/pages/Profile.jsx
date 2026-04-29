import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function AvatarSVG({ gender }) {
    if (gender === 'female') return (
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
            <defs>
                <linearGradient id="bgF" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ec4899"/>
                    <stop offset="100%" stopColor="#8b5cf6"/>
                </linearGradient>
            </defs>
            <rect width="100" height="100" fill="url(#bgF)"/>
            {/* Cuerpo */}
            <ellipse cx="50" cy="85" rx="22" ry="14" fill="#f9a8d4" opacity="0.6"/>
            {/* Vestido */}
            <path d="M34 70 Q50 60 66 70 L70 95 Q50 88 30 95 Z" fill="#ec4899"/>
            {/* Cuello */}
            <rect x="45" y="52" width="10" height="10" rx="2" fill="#fcd5b0"/>
            {/* Cabeza */}
            <circle cx="50" cy="42" r="18" fill="#fcd5b0">
                <animate attributeName="cy" values="42;40;42" dur="3s" repeatCount="indefinite"/>
            </circle>
            {/* Cabello */}
            <ellipse cx="50" cy="28" rx="18" ry="8" fill="#7c3aed"/>
            <ellipse cx="33" cy="38" rx="5" ry="12" fill="#7c3aed"/>
            <ellipse cx="67" cy="38" rx="5" ry="12" fill="#7c3aed"/>
            {/* Ojos */}
            <circle cx="43" cy="42" r="2.5" fill="#1e1b4b"/>
            <circle cx="57" cy="42" r="2.5" fill="#1e1b4b"/>
            <circle cx="44" cy="41" r="0.8" fill="#fff"/>
            <circle cx="58" cy="41" r="0.8" fill="#fff"/>
            {/* Sonrisa */}
            <path d="M44 49 Q50 54 56 49" stroke="#e879a0" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            {/* Mejillas */}
            <circle cx="40" cy="47" r="4" fill="#f9a8d4" opacity="0.5"/>
            <circle cx="60" cy="47" r="4" fill="#f9a8d4" opacity="0.5"/>
        </svg>
    );

    if (gender === 'male') return (
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
            <defs>
                <linearGradient id="bgM" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1"/>
                    <stop offset="100%" stopColor="#06b6d4"/>
                </linearGradient>
            </defs>
            <rect width="100" height="100" fill="url(#bgM)"/>
            {/* Cuerpo */}
            <rect x="32" y="62" width="36" height="30" rx="6" fill="#4f46e5"/>
            {/* Corbata */}
            <polygon points="50,63 47,70 50,78 53,70" fill="#06b6d4"/>
            {/* Cuello */}
            <rect x="45" y="52" width="10" height="12" rx="2" fill="#fcd5b0"/>
            {/* Cabeza */}
            <circle cx="50" cy="40" r="18" fill="#fcd5b0">
                <animate attributeName="cy" values="40;38;40" dur="3s" repeatCount="indefinite"/>
            </circle>
            {/* Cabello */}
            <ellipse cx="50" cy="25" rx="17" ry="7" fill="#1e1b4b"/>
            <ellipse cx="34" cy="32" rx="4" ry="8" fill="#1e1b4b"/>
            {/* Ojos */}
            <circle cx="43" cy="40" r="2.5" fill="#1e1b4b"/>
            <circle cx="57" cy="40" r="2.5" fill="#1e1b4b"/>
            <circle cx="44" cy="39" r="0.8" fill="#fff"/>
            <circle cx="58" cy="39" r="0.8" fill="#fff"/>
            {/* Sonrisa */}
            <path d="M44 47 Q50 52 56 47" stroke="#f97316" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            {/* Mejillas */}
            <circle cx="40" cy="45" r="4" fill="#fca5a5" opacity="0.4"/>
            <circle cx="60" cy="45" r="4" fill="#fca5a5" opacity="0.4"/>
        </svg>
    );

    // Neutro
    return (
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
            <defs>
                <linearGradient id="bgN" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1"/>
                    <stop offset="100%" stopColor="#8b5cf6"/>
                </linearGradient>
            </defs>
            <rect width="100" height="100" fill="url(#bgN)"/>
            <circle cx="50" cy="40" r="18" fill="#fcd5b0">
                <animate attributeName="cy" values="40;38;40" dur="3s" repeatCount="indefinite"/>
            </circle>
            <ellipse cx="50" cy="26" rx="16" ry="7" fill="#4f46e5"/>
            <rect x="33" y="62" width="34" height="28" rx="6" fill="#6366f1"/>
            <rect x="45" y="52" width="10" height="12" rx="2" fill="#fcd5b0"/>
            <circle cx="43" cy="40" r="2.5" fill="#1e1b4b"/>
            <circle cx="57" cy="40" r="2.5" fill="#1e1b4b"/>
            <circle cx="44" cy="39" r="0.8" fill="#fff"/>
            <circle cx="58" cy="39" r="0.8" fill="#fff"/>
            <path d="M44 47 Q50 52 56 47" stroke="#a78bfa" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            <text x="50" y="98" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.6)" fontFamily="sans-serif">VetPaw</text>
        </svg>
    );
}

export default function Profile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '',
    province: '', locality: '', bio: '', gender: '',
    });
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/users/profile/');
            setProfile(res.data);
            setForm({
                first_name: res.data.first_name || '',
                last_name: res.data.last_name || '',
                phone: res.data.phone || '',
                province: res.data.province || '',
                locality: res.data.locality || '',
                bio: res.data.bio || '',
                gender: res.data.gender || 'other',
            });
            setAvatarPreview(res.data.avatar || null);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
    };

    const handleEdit = () => { setEditing(true); setError(''); setSuccess(''); };

    const handleCancel = () => {
        setEditing(false);
        setError('');
        setForm({
            first_name: profile?.first_name || '',
            last_name: profile?.last_name || '',
            phone: profile?.phone || '',
            province: profile?.province || '',
            locality: profile?.locality || '',
            bio: profile?.bio || '',
        });
        setAvatarPreview(profile?.avatar || null);
        setAvatarFile(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const formData = new FormData();
            Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v); });
            if (avatarFile) formData.append('avatar', avatarFile);
            await api.patch('/users/profile/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            await fetchProfile();
            setEditing(false);
            setAvatarFile(null);
            setSuccess('¡Perfil actualizado correctamente!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            const data = err.response?.data;
            setError(data ? Object.values(data).flat().join(' ') : 'Error al guardar.');
        } finally { setSaving(false); }
    };

    const initials = user
        ? (user.first_name?.[0] || user.username?.[0] || '?').toUpperCase()
        : '?';

    return (
        <div className="profile-page">
            <div className="blob b1" /><div className="blob b2" />
            <div className="profile-inner">
                <header className="profile-header">
                    <div>
                        <h1 className="profile-title"> Mi perfil</h1>
                        <p className="profile-subtitle">Tu información personal</p>
                    </div>
                    {success && <div className="success-toast">✅ {success}</div>}
                </header>

                {loading ? (
                    <div className="loading-state"><span className="paw-spin">🐾</span><p>Cargando perfil...</p></div>
                ) : (
                    <div className="profile-layout">
                        {/* Avatar card */}
                        <div className="avatar-card">
                            <div className="avatar-wrapper">
                                {avatarPreview
                                ? <img src={avatarPreview} alt="avatar" className="avatar-img" />
                                : <AvatarSVG gender={profile?.gender} />
                                }
                            </div>
                            <p className="avatar-name">{profile?.first_name || user?.username}</p>
                            <p className="avatar-role">{user?.role === 'vet' ? '🩺 Veterinario/a' : '🐾 Dueño/a de mascota'}</p>
                            <p className="avatar-email">{profile?.email}</p>
                            {editing && (
                                <label className="avatar-upload-btn">
                                    📷 Cambiar foto
                                    <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                                </label>
                            )}
                        </div>

                        {/* Info / Form */}
                        <div className="profile-form-card">
                            {error && <div className="error-msg">⚠️ {error}</div>}

                            {!editing ? (
                                /* ── Vista ── */
                                <div className="profile-view">
                                    <div className="view-row">
                                        <div className="view-field">
                                            <span className="view-label">Nombre</span>
                                            <span className="view-value">{profile?.first_name || <em className="empty-val">Sin completar</em>}</span>
                                        </div>
                                        <div className="view-field">
                                            <span className="view-label">Apellido</span>
                                            <span className="view-value">{profile?.last_name || <em className="empty-val">Sin completar</em>}</span>
                                        </div>
                                    </div>
                                    <div className="view-field">
                                        <span className="view-label">Teléfono</span>
                                        <span className="view-value">{profile?.phone || <em className="empty-val">Sin completar</em>}</span>
                                    </div>
                                    <div className="view-row">
                                        <div className="view-field">
                                            <span className="view-label">Provincia</span>
                                            <span className="view-value">{profile?.province || <em className="empty-val">Sin completar</em>}</span>
                                        </div>
                                        <div className="view-field">
                                            <span className="view-label">Localidad</span>
                                            <span className="view-value">{profile?.locality || <em className="empty-val">Sin completar</em>}</span>
                                        </div>
                                    </div>
                                    <div className="view-field">
                                        <span className="view-label">Bio</span>
                                        <span className="view-value">{profile?.bio || <em className="empty-val">Sin completar</em>}</span>
                                    </div>
                                    <div className="view-actions">
                                        <button className="btn-primary" onClick={handleEdit}>✏️ Editar perfil</button>
                                    </div>
                                </div>
                            ) : (
                                /* ── Edición ── */
                                <form onSubmit={handleSubmit} className="profile-form">
                                    <div className="form-row">
                                        <div className="form-group">
    <label>Género</label>
    <select name="gender" value={form.gender} onChange={handleChange}>
        <option value="other">Prefiero no decir</option>
        <option value="male">Masculino</option>
        <option value="female">Femenino</option>
    </select>
</div>
                                        <div className="form-group">
                                            <label>Nombre</label>
                                            <input name="first_name" placeholder="Luna" value={form.first_name} onChange={handleChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Apellido</label>
                                            <input name="last_name" placeholder="García" value={form.last_name} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Teléfono</label>
                                        <input name="phone" placeholder="+54 9 11 1234-5678" value={form.phone} onChange={handleChange} />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Provincia</label>
                                            <input name="province" placeholder="Buenos Aires" value={form.province} onChange={handleChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Localidad</label>
                                            <input name="locality" placeholder="Palermo" value={form.locality} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Bio</label>
                                        <textarea name="bio" rows={3} placeholder="Contanos algo sobre vos..." value={form.bio} onChange={handleChange} />
                                    </div>
                                    <div className="form-actions">
                                        <button type="button" className="btn-ghost" onClick={handleCancel}>Cancelar</button>
                                        <button type="submit" className="btn-primary" disabled={saving}>
                                            {saving ? 'Guardando...' : 'Guardar cambios'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Fraunces:ital,opsz,wght@1,9..144,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .profile-page { min-height: 100vh; background: #1a1a2e; font-family: 'Nunito', sans-serif; position: relative; overflow-x: hidden; padding-bottom: 60px; }
        .blob { position: fixed; border-radius: 50%; filter: blur(90px); opacity: 0.08; pointer-events: none; }
        .b1 { width: 500px; height: 500px; background: #ff6b6b; top: -100px; left: -100px; }
        .b2 { width: 400px; height: 400px; background: #ffd93d; bottom: -100px; right: -100px; }
        .profile-inner { max-width: 900px; margin: 0 auto; padding: 32px 24px; position: relative; z-index: 1; }
        .profile-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
        .profile-title { font-family: 'Fraunces', serif; font-size: 2rem; font-weight: 700; font-style: italic; color: #fff; letter-spacing: -1px; text-shadow: 0 2px 12px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.8); }
        .profile-subtitle { color: rgba(255,255,255,0.45); font-size: 0.9rem; margin-top: 4px; }
        .success-toast { background: rgba(107,255,184,0.12); border: 1px solid rgba(107,255,184,0.3); color: #6bffb8; padding: 10px 16px; border-radius: 10px; font-size: 0.88rem; font-weight: 700; }
        .loading-state { text-align: center; padding: 80px 20px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .paw-spin { font-size: 3rem; animation: spin 1s linear infinite; display: block; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-state p { color: rgba(255,255,255,0.4); }
        .profile-layout { display: grid; grid-template-columns: 240px 1fr; gap: 24px; align-items: start; }
        .avatar-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 28px 20px; display: flex; flex-direction: column; align-items: center; gap: 10px; backdrop-filter: blur(10px); }
        .avatar-wrapper { width: 90px; height: 90px; border-radius: 50%; overflow: hidden; border: 3px solid rgba(255,107,107,0.4); margin-bottom: 4px; }
        .avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-initials { width: 100%; height: 100%; background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899); display: flex; align-items: center; justify-content: center; font-size: 2.2rem; font-weight: 900; color: #fff; text-shadow: 0 2px 8px rgba(0,0,0,0.3); }
        .avatar-name { font-size: 1rem; font-weight: 900; color: #fff; text-align: center; }
        .avatar-role { font-size: 0.76rem; color: rgba(255,255,255,0.45); }
        .avatar-email { font-size: 0.74rem; color: rgba(255,255,255,0.3); word-break: break-all; text-align: center; padding: 0 8px; }
        .avatar-upload-btn { background: rgba(255,255,255,0.06); border: 1.5px dashed rgba(255,255,255,0.2); border-radius: 10px; padding: 8px 14px; color: rgba(255,255,255,0.5); font-size: 0.82rem; font-weight: 700; cursor: pointer; margin-top: 8px; transition: border-color 0.2s, color 0.2s; }
        .avatar-upload-btn:hover { border-color: rgba(255,107,107,0.4); color: #ff6b6b; }
        .profile-form-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 28px; backdrop-filter: blur(10px); }
        .error-msg { background: rgba(255,107,107,0.15); border: 1px solid rgba(255,107,107,0.4); color: #ff9999; padding: 10px 14px; border-radius: 10px; font-size: 0.86rem; margin-bottom: 16px; }
        /* View mode */
        .profile-view { display: flex; flex-direction: column; gap: 16px; }
        .view-row { display: flex; gap: 20px; }
        .view-field { display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .view-label { font-size: 0.72rem; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.06em; }
        .view-value { font-size: 0.95rem; color: #fff; font-weight: 600; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .empty-val { font-style: italic; color: rgba(255,255,255,0.25); font-weight: 400; }
        .view-actions { display: flex; justify-content: flex-end; margin-top: 8px; }
        /* Form mode */
        .profile-form { display: flex; flex-direction: column; gap: 14px; }
        .form-row { display: flex; gap: 12px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .form-group label { font-size: 0.78rem; font-weight: 700; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.06em; }
        .form-group input, .form-group textarea { background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.10); border-radius: 10px; color: #fff; padding: 11px 14px; font-family: 'Nunito', sans-serif; font-size: 0.92rem; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        .form-group input::placeholder, .form-group textarea::placeholder { color: rgba(255,255,255,0.2); }
        .form-group input:focus, .form-group textarea:focus { border-color: #ff6b6b; box-shadow: 0 0 0 3px rgba(255,107,107,0.12); }
        .form-group textarea { resize: vertical; }
        .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
        .btn-primary { background: linear-gradient(135deg, #ff6b6b, #ff4a4a); color: #fff; border: none; border-radius: 12px; padding: 12px 24px; font-family: 'Nunito', sans-serif; font-size: 0.95rem; font-weight: 900; cursor: pointer; box-shadow: 0 6px 20px rgba(255,107,107,0.35); transition: transform 0.15s, box-shadow 0.15s; }
        .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(255,107,107,0.5); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-ghost { background: transparent; border: 1.5px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.5); border-radius: 10px; padding: 11px 20px; font-family: 'Nunito', sans-serif; font-weight: 700; cursor: pointer; transition: border-color 0.2s; }
        .btn-ghost:hover { border-color: rgba(255,255,255,0.25); }
        @media (max-width: 700px) { .profile-layout { grid-template-columns: 1fr; } .form-row { flex-direction: column; } .view-row { flex-direction: column; } .profile-inner { padding: 20px 16px; } }
        .form-group select { background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.10); border-radius: 10px; color: #fff; padding: 11px 14px; font-family: 'Nunito', sans-serif; font-size: 0.92rem; outline: none; transition: border-color 0.2s; cursor: pointer; }
        .form-group select option { background: #1a1a2e; color: #fff; }
        .form-group select:focus { border-color: #ff6b6b; box-shadow: 0 0 0 3px rgba(255,107,107,0.12); }        
    `}</style>
        </div>
    );
}