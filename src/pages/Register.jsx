import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/api";

const STEPS = ["Cuenta", "Personal", "Listo 🎉"];

export default function Register() {
    const navigate = useNavigate();

    const [step, setStep] = useState(0);
    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        password2: "",
        first_name: "",
        last_name: "",
        phone: "",
        role: "owner",
        province: "",
        locality: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const validateStep0 = () => {
        if (!form.username || !form.email || !form.password || !form.password2)
            return "Completá todos los campos.";
        if (form.password !== form.password2)
            return "Las contraseñas no coinciden.";
        if (form.password.length < 8)
            return "La contraseña debe tener al menos 8 caracteres.";
        return "";
    };

    const validateStep1 = () => {
        if (!form.first_name || !form.last_name)
            return "Nombre y apellido son obligatorios.";
        return "";
    };

    const handleNext = () => {
        setError("");
        const err = step === 0 ? validateStep0() : validateStep1();
        if (err) { setError(err); return; }
        setStep((s) => s + 1);
    };

    const handleSubmit = async () => {
        setError("");
        setLoading(true);
        try {
            await registerUser(form);
            setStep(2);
        } catch (err) {
            const data = err.response?.data;
            const msg = data
                ? Object.values(data).flat().join(" ")
                : "Error al registrarse. Intentá de nuevo.";
            setError(msg);
            setStep(0);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="blob blob-1" />
            <div className="blob blob-2" />
            <div className="blob blob-3" />

            <div className="auth-card">
                <div className="auth-brand">
                    <span className="paw-icon">🐾</span>
                    <h1 className="brand-name">VetPaw</h1>
                </div>
                <p className="auth-tagline">Creá tu cuenta gratis</p>

                {step < 2 && (
                    <div className="steps">
                        {STEPS.slice(0, 2).map((label, i) => (
                            <div key={i} className={`step ${i < step ? "done" : i === step ? "active" : ""}`}>
                                <div className="step-dot">{i < step ? "✓" : i + 1}</div>
                                <span className="step-label">{label}</span>
                                {i < 1 && <div className="step-line" />}
                            </div>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="auth-error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {/* ── Step 0: Cuenta ── */}
                {step === 0 && (
                    <div className="auth-form">
                        <div className="field-group">
                            <label>Usuario</label>
                            <div className="input-wrapper">
                                <span className="input-icon">👤</span>
                                <input name="username" type="text" placeholder="tu_usuario"
                                    value={form.username} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="field-group">
                            <label>Email</label>
                            <div className="input-wrapper">
                                <span className="input-icon">✉️</span>
                                <input name="email" type="email" placeholder="vos@email.com"
                                    value={form.email} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="field-group">
                            <label>Contraseña</label>
                            <div className="input-wrapper">
                                <span className="input-icon">🔒</span>
                                <input name="password" type="password" placeholder="Mín. 8 caracteres"
                                    value={form.password} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="field-group">
                            <label>Repetir contraseña</label>
                            <div className="input-wrapper">
                                <span className="input-icon">🔒</span>
                                <input name="password2" type="password" placeholder="••••••••"
                                    value={form.password2} onChange={handleChange} />
                            </div>
                        </div>
                        <button className="auth-btn" onClick={handleNext}>
                            Continuar →
                        </button>
                    </div>
                )}

                {/* ── Step 1: Personal ── */}
                {step === 1 && (
                    <div className="auth-form">
                        <div className="fields-row">
                            <div className="field-group">
                                <label>Nombre</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">😊</span>
                                    <input name="first_name" type="text" placeholder="Luna"
                                        value={form.first_name} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="field-group">
                                <label>Apellido</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">😊</span>
                                    <input name="last_name" type="text" placeholder="García"
                                        value={form.last_name} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <div className="field-group">
                            <label>Teléfono <span className="optional">(opcional)</span></label>
                            <div className="input-wrapper">
                                <span className="input-icon">📱</span>
                                <input name="phone" type="tel" placeholder="+54 9 11 1234-5678"
                                    value={form.phone} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="field-group">
                            <label>Rol</label>
                            <div className="input-wrapper select-wrapper">
                                <span className="input-icon">🏷️</span>
                                <select name="role" value={form.role} onChange={handleChange}>
                                    <option value="owner">Dueño de mascota</option>
                                    <option value="vet">Veterinario/a</option>
                                </select>
                            </div>
                        </div>

                        <div className="fields-row">
                            <div className="field-group">
                                <label>Provincia <span className="optional">(opcional)</span></label>
                                <div className="input-wrapper">
                                    <span className="input-icon">📍</span>
                                    <input name="province" type="text" placeholder="Buenos Aires"
                                        value={form.province} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="field-group">
                                <label>Localidad <span className="optional">(opcional)</span></label>
                                <div className="input-wrapper">
                                    <span className="input-icon">🏘️</span>
                                    <input name="locality" type="text" placeholder="Palermo"
                                        value={form.locality} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <div className="btn-row">
                            <button className="auth-btn-ghost" onClick={() => setStep(0)}>
                                ← Volver
                            </button>
                            <button className="auth-btn" onClick={handleSubmit} disabled={loading} style={{ flex: 2 }}>
                                {loading ? (
                                    <span className="btn-loading">
                                        <span className="spinner" /> Creando cuenta...
                                    </span>
                                ) : (
                                    "Crear cuenta 🎉"
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Step 2: Éxito ── */}
                {step === 2 && (
                    <div className="success-screen">
                        <div className="success-emoji">🐾</div>
                        <h2 className="success-title">¡Bienvenido/a a VetPaw!</h2>
                        <p className="success-msg">
                            Tu cuenta fue creada con éxito. Ya podés ingresar y gestionar los turnos de tu mascota.
                        </p>
                        <button className="auth-btn" onClick={() => navigate("/login")}>
                            Ir al login →
                        </button>
                    </div>
                )}

                {step < 2 && (
                    <p className="auth-switch">
                        ¿Ya tenés cuenta?{" "}
                        <Link to="/login" className="auth-link">Iniciá sesión</Link>
                    </p>
                )}
            </div>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Fraunces:ital,opsz,wght@1,9..144,700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .auth-page {
        min-height: 100vh; background: #1a1a2e;
        display: flex; align-items: center; justify-content: center;
        font-family: 'Nunito', sans-serif; position: relative; overflow: hidden;
        }

        .blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.18; animation: blobFloat 8s ease-in-out infinite alternate; }
        .blob-1 { width: 400px; height: 400px; background: #ffd93d; top: -80px; right: -100px; animation-duration: 10s; }
        .blob-2 { width: 350px; height: 350px; background: #ff6b6b; bottom: -100px; left: -80px; animation-duration: 12s; animation-delay: -4s; }
        .blob-3 { width: 180px; height: 180px; background: #6bcaff; top: 40%; left: 10%; animation-duration: 7s; animation-delay: -2s; }
        @keyframes blobFloat {
        from { transform: translate(0, 0) scale(1); }
        to   { transform: translate(20px, 30px) scale(1.06); }
        }

        .auth-card {
        position: relative; z-index: 10;
        background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.10);
        backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        border-radius: 28px; padding: 48px 44px 40px;
        width: 100%; max-width: 460px;
        box-shadow: 0 32px 80px rgba(0,0,0,0.5);
        animation: cardIn 0.55s cubic-bezier(.22,.68,0,1.2) both;
        }
        @keyframes cardIn {
        from { opacity: 0; transform: translateY(28px) scale(0.96); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .auth-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
        .paw-icon { font-size: 2rem; animation: pawBounce 2s ease-in-out infinite; }
        @keyframes pawBounce {
        0%,100% { transform: rotate(-8deg) scale(1); }
        50%      { transform: rotate(8deg) scale(1.15); }
        }
        .brand-name { font-family: 'Fraunces', serif; font-size: 2rem; font-weight: 700; font-style: italic; color: #ff6b6b; letter-spacing: -1px; }
        .auth-tagline { font-size: 0.78rem; color: rgba(255,255,255,0.4); margin-bottom: 24px; letter-spacing: 0.06em; text-transform: uppercase; }

        .steps { display: flex; align-items: center; margin-bottom: 24px; }
        .step { display: flex; align-items: center; gap: 8px; flex: 1; }
        .step-dot {
        width: 28px; height: 28px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.75rem; font-weight: 900;
        border: 2px solid rgba(255,255,255,0.15);
        color: rgba(255,255,255,0.3); transition: all 0.3s; flex-shrink: 0;
        }
        .step.active .step-dot { border-color: #ffd93d; color: #ffd93d; box-shadow: 0 0 0 4px rgba(255,217,61,0.15); }
        .step.done .step-dot { background: #ff6b6b; border-color: #ff6b6b; color: #fff; }
        .step-label { font-size: 0.75rem; font-weight: 700; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.06em; }
        .step.active .step-label { color: #ffd93d; }
        .step.done .step-label { color: rgba(255,255,255,0.5); }
        .step-line { flex: 1; height: 2px; background: rgba(255,255,255,0.08); margin: 0 8px; }

        .auth-error {
        background: rgba(255,107,107,0.15); border: 1px solid rgba(255,107,107,0.4);
        color: #ff9999; padding: 10px 14px; border-radius: 10px; font-size: 0.86rem;
        margin-bottom: 16px; display: flex; gap: 8px; align-items: center;
        }

        .auth-form { display: flex; flex-direction: column; gap: 14px; }
        .fields-row { display: flex; gap: 12px; }
        .fields-row .field-group { flex: 1; }

        .field-group { display: flex; flex-direction: column; gap: 6px; }
        .field-group label { font-size: 0.8rem; font-weight: 700; color: rgba(255,255,255,0.55); text-transform: uppercase; letter-spacing: 0.08em; }
        .optional { font-weight: 400; text-transform: none; font-size: 0.75rem; color: rgba(255,255,255,0.3); }

        .input-wrapper { position: relative; display: flex; align-items: center; }
        .input-icon { position: absolute; left: 14px; font-size: 1rem; pointer-events: none; z-index: 1; }
        .input-wrapper input,
        .input-wrapper select {
        width: 100%; padding: 13px 14px 13px 42px;
        background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.10);
        border-radius: 12px; color: #fff;
        font-family: 'Nunito', sans-serif; font-size: 0.96rem;
        transition: border-color 0.2s, background 0.2s, box-shadow 0.2s; outline: none;
        }
        .input-wrapper select { cursor: pointer; appearance: none; }
        .input-wrapper select option { background: #1a1a2e; color: #fff; }
        .input-wrapper input::placeholder { color: rgba(255,255,255,0.25); }
        .input-wrapper input:focus,
        .input-wrapper select:focus {
        border-color: #ffd93d; background: rgba(255,217,61,0.06);
        box-shadow: 0 0 0 4px rgba(255,217,61,0.10);
        }

        .btn-row { display: flex; gap: 10px; margin-top: 4px; }
        .auth-btn {
        padding: 14px; background: linear-gradient(135deg, #ff6b6b, #ff4a4a);
        color: #fff; font-family: 'Nunito', sans-serif; font-size: 1rem; font-weight: 900;
        border: none; border-radius: 12px; cursor: pointer;
        transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
        box-shadow: 0 6px 20px rgba(255,107,107,0.35); width: 100%;
        }
        .auth-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(255,107,107,0.5); }
        .auth-btn:active:not(:disabled) { transform: translateY(0); }
        .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .auth-btn-ghost {
        padding: 14px 18px; background: transparent; color: rgba(255,255,255,0.45);
        font-family: 'Nunito', sans-serif; font-size: 0.9rem; font-weight: 700;
        border: 1.5px solid rgba(255,255,255,0.12); border-radius: 12px; cursor: pointer;
        transition: border-color 0.2s, color 0.2s; flex: 1; white-space: nowrap;
        }
        .auth-btn-ghost:hover { border-color: rgba(255,255,255,0.3); color: rgba(255,255,255,0.7); }

        .btn-loading { display: flex; align-items: center; justify-content: center; gap: 10px; }
        .spinner { width: 16px; height: 16px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .success-screen { text-align: center; padding: 12px 0; }
        .success-emoji { font-size: 4rem; animation: successBounce 0.6s cubic-bezier(.22,.68,0,1.4) both; display: block; margin-bottom: 16px; }
        @keyframes successBounce {
        from { transform: scale(0) rotate(-30deg); opacity: 0; }
        to   { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .success-title { font-family: 'Fraunces', serif; font-size: 1.6rem; font-weight: 700; font-style: italic; color: #ffd93d; margin-bottom: 12px; }
        .success-msg { color: rgba(255,255,255,0.55); font-size: 0.9rem; line-height: 1.6; margin-bottom: 24px; }

        .auth-switch { text-align: center; margin-top: 20px; font-size: 0.88rem; color: rgba(255,255,255,0.4); }
        .auth-link { color: #ffd93d; font-weight: 700; text-decoration: none; transition: color 0.15s; }
        .auth-link:hover { color: #ffe97a; text-decoration: underline; }

        @media (max-width: 480px) {
        .auth-card { padding: 36px 20px 32px; margin: 16px; border-radius: 20px; }
        .fields-row { flex-direction: column; }
        }
    `}</style>
        </div>
    );
}
