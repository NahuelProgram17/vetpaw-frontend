import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import loginVetpawBg from "../assets/login/login-vetpaw-bg.webp";
import { formatSanctionDate, getHomeForRole, parseLoginFailure } from "../utils/authFlow";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ username: "", password: "" });
    const [error, setError] = useState("");
    const [sanction, setSanction] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        try {
            const stored = sessionStorage.getItem("vetpaw_account_sanction");
            if (!stored) return;
            setSanction(JSON.parse(stored));
            sessionStorage.removeItem("vetpaw_account_sanction");
        } catch {
            // La sesión puede bloquear el almacenamiento en algunos navegadores.
        }
    }, []);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSanction(null);
        setLoading(true);
        try {
            const userData = await login(form.username, form.password);
            navigate(getHomeForRole(userData?.role));
        } catch (err) {
            const failure = parseLoginFailure(err.response?.data);
            if (!failure.sanction && err.userMessage) failure.error = err.userMessage;
            setSanction(failure.sanction);
            setError(failure.error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page" style={{ "--login-bg": `url(${loginVetpawBg})` }}>
            <div className="auth-bg-overlay" />

            <div className="auth-card">
                <div className="auth-brand">
                    <img src="/logo_vetpaw.png" alt="VetPaw" className="auth-logo" />
                </div>

                <p className="auth-tagline">Tu clínica, siempre cerca.</p>
                <div className="auth-divider"><span>🐾</span></div>

                <h2 className="auth-title">Iniciá sesión</h2>

                {sanction && (
                    <div className={`auth-sanction ${sanction.code === "account_banned" ? "is-banned" : "is-suspended"}`}>
                        <div className="auth-sanction-icon">{sanction.code === "account_banned" ? "⛔" : "⏳"}</div>
                        <div>
                            <strong>{sanction.code === "account_banned" ? "Cuenta expulsada" : "Cuenta suspendida"}</strong>
                            <p>{sanction.sanction?.reason || sanction.detail || "Tu cuenta tiene una medida de moderación activa."}</p>
                            {sanction.code === "account_suspended" && sanction.sanction?.ends_at && (
                                <small>Podrás volver a ingresar el {formatSanctionDate(sanction.sanction.ends_at)}.</small>
                            )}
                            {sanction.code === "account_banned" && (
                                <small>La medida permanece activa hasta que un administrador la revoque.</small>
                            )}
                            <a href="mailto:vetpaw.app@gmail.com">Contactar al equipo de VetPaw</a>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="auth-error" role="alert" aria-live="assertive">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="field-group">
                        <label htmlFor="username">Usuario</label>
                        <div className="input-wrapper">
                            <span className="input-icon">👤</span>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                placeholder="tu_usuario"
                                value={form.username}
                                onChange={handleChange}
                                required
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    <div className="field-group">
                        <label htmlFor="password">Contraseña</label>
                        <div className="input-wrapper">
                            <span className="input-icon">🔒</span>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={handleChange}
                                required
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? (
                            <span className="btn-loading">
                                <span className="spinner" /> Ingresando...
                            </span>
                        ) : (
                            "Ingresar →"
                        )}
                    </button>
                </form>

                <p className="auth-switch auth-forgot">
                    <Link to="/forgot-password" className="auth-muted-link">
                        ¿Olvidaste tu contraseña?
                    </Link>
                </p>

                <p className="auth-switch">
                    ¿No tenés cuenta?{" "}
                    <Link to="/register" className="auth-link">
                        Registrate
                    </Link>
                </p>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

                *, *::before, *::after {
                    box-sizing: border-box;
                }

                .auth-page {
                    min-height: calc(100vh - 0px);
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: clamp(38px, 6vh, 76px) 18px;
                    font-family: 'Nunito', sans-serif;
                    background-color: #061425;
                    background-image: var(--login-bg);
                    background-size: cover;
                    background-position: center center;
                    background-repeat: no-repeat;
                }

                .auth-bg-overlay {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    background:
                        radial-gradient(circle at 50% 44%, rgba(3, 12, 26, 0.08) 0%, rgba(3, 12, 26, 0.22) 58%, rgba(3, 12, 26, 0.34) 100%);
                    z-index: 1;
                }

                .auth-card {
                    position: relative;
                    z-index: 2;
                    width: min(100%, 455px);
                    padding: 46px 48px 38px;
                    border-radius: 30px;
                    background:
                        linear-gradient(180deg, rgba(7, 25, 45, 0.88), rgba(4, 17, 32, 0.91));
                    border: 1px solid rgba(115, 205, 68, 0.56);
                    box-shadow:
                        0 34px 90px rgba(0, 0, 0, 0.48),
                        0 0 0 1px rgba(255, 166, 0, 0.17),
                        -12px -12px 42px rgba(101, 216, 62, 0.12),
                        12px 12px 42px rgba(255, 163, 0, 0.11);
                    backdrop-filter: blur(18px);
                    -webkit-backdrop-filter: blur(18px);
                    animation: cardIn 0.5s ease both;
                }

                @keyframes cardIn {
                    from { opacity: 0; transform: translateY(18px) scale(.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                .auth-brand {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 10px;
                }

                .auth-logo {
                    height: 96px;
                    width: auto;
                    display: block;
                    object-fit: contain;
                    filter: drop-shadow(0 10px 22px rgba(0, 0, 0, 0.35));
                }

                .auth-tagline {
                    margin: 0;
                    color: rgba(255, 255, 255, 0.53);
                    font-size: 0.84rem;
                    font-weight: 900;
                    text-align: center;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                }

                .auth-divider {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    color: #65d84a;
                    margin: 14px 0 22px;
                    text-shadow: 0 0 16px rgba(101, 216, 74, 0.6);
                }

                .auth-divider::before,
                .auth-divider::after {
                    content: "";
                    width: 48px;
                    height: 2px;
                    border-radius: 999px;
                    background: linear-gradient(90deg, transparent, #67d948, #ffad00);
                    opacity: .9;
                }

                .auth-divider::after {
                    background: linear-gradient(90deg, #67d948, #ffad00, transparent);
                }

                .auth-title {
                    margin: 0 0 24px;
                    color: #fff;
                    font-size: clamp(1.65rem, 2.6vw, 2rem);
                    line-height: 1;
                    font-weight: 900;
                    text-align: center;
                    text-shadow: 0 5px 18px rgba(0, 0, 0, 0.38);
                }

                .auth-sanction {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    margin-bottom: 18px;
                    padding: 14px;
                    border: 1px solid rgba(255, 182, 72, 0.34);
                    border-radius: 15px;
                    background: rgba(255, 166, 0, 0.1);
                    color: #fff;
                }

                .auth-sanction.is-banned {
                    border-color: rgba(255, 92, 111, 0.38);
                    background: rgba(255, 67, 91, 0.11);
                }

                .auth-sanction-icon {
                    flex: 0 0 auto;
                    font-size: 1.7rem;
                    line-height: 1;
                }

                .auth-sanction strong {
                    display: block;
                    margin-bottom: 5px;
                    color: #ffd58f;
                    font-size: 0.9rem;
                    font-weight: 900;
                }

                .auth-sanction.is-banned strong { color: #ffacb6; }
                .auth-sanction p { margin: 0; color: rgba(255,255,255,.77); font-size: .82rem; line-height: 1.45; }
                .auth-sanction small { display: block; margin-top: 7px; color: rgba(255,255,255,.52); font-size: .72rem; line-height: 1.4; }
                .auth-sanction a { display: inline-block; margin-top: 8px; color: #7ce462; font-size: .75rem; font-weight: 900; text-decoration: none; }
                .auth-sanction a:hover { text-decoration: underline; }

                .auth-error {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 16px;
                    padding: 11px 13px;
                    color: #ffd0d0;
                    background: rgba(255, 74, 74, 0.13);
                    border: 1px solid rgba(255, 90, 90, 0.36);
                    border-radius: 14px;
                    font-size: 0.9rem;
                    font-weight: 800;
                }

                .auth-form {
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                }

                .field-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .field-group label {
                    color: rgba(255, 255, 255, 0.64);
                    font-size: 0.82rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                }

                .input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .input-icon {
                    position: absolute;
                    left: 17px;
                    top: 50%;
                    transform: translateY(-50%);
                    z-index: 1;
                    font-size: 1.05rem;
                    opacity: .86;
                    pointer-events: none;
                }

                .input-wrapper input {
                    width: 100%;
                    height: 56px;
                    padding: 0 18px 0 50px;
                    border-radius: 14px;
                    border: 1px solid rgba(172, 218, 255, 0.18);
                    outline: none;
                    background: linear-gradient(180deg, rgba(20, 42, 66, .92), rgba(13, 31, 52, .92));
                    color: #ffffff;
                    font-family: 'Nunito', sans-serif;
                    font-size: 1rem;
                    font-weight: 800;
                    transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
                }

                .input-wrapper input::placeholder {
                    color: rgba(255, 255, 255, 0.32);
                    font-weight: 700;
                }

                .input-wrapper input:focus {
                    border-color: rgba(111, 220, 69, 0.82);
                    box-shadow: 0 0 0 4px rgba(105, 217, 72, 0.13), 0 0 26px rgba(105, 217, 72, 0.13);
                    background: linear-gradient(180deg, rgba(22, 49, 72, .96), rgba(12, 34, 56, .96));
                }

                .auth-btn {
                    height: 58px;
                    margin-top: 8px;
                    border: 0;
                    border-radius: 14px;
                    cursor: pointer;
                    color: #fff;
                    font-family: 'Nunito', sans-serif;
                    font-size: 1.06rem;
                    font-weight: 900;
                    letter-spacing: .01em;
                    background: linear-gradient(135deg, #65d84a 0%, #bed52e 43%, #ff9f00 100%);
                    box-shadow: 0 16px 30px rgba(106, 218, 74, .24), 0 12px 32px rgba(255, 159, 0, .20);
                    transition: transform .16s ease, filter .16s ease, box-shadow .16s ease;
                }

                .auth-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    filter: brightness(1.06);
                    box-shadow: 0 19px 36px rgba(106, 218, 74, .30), 0 15px 36px rgba(255, 159, 0, .24);
                }

                .auth-btn:disabled {
                    opacity: .7;
                    cursor: not-allowed;
                }

                .btn-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }

                .spinner {
                    width: 16px;
                    height: 16px;
                    border: 2.5px solid rgba(255,255,255,0.35);
                    border-top-color: #fff;
                    border-radius: 50%;
                    animation: spin .7s linear infinite;
                    display: inline-block;
                }

                @keyframes spin { to { transform: rotate(360deg); } }

                .auth-switch {
                    margin: 18px 0 0;
                    text-align: center;
                    color: rgba(255, 255, 255, 0.58);
                    font-size: .95rem;
                    font-weight: 800;
                }

                .auth-forgot {
                    margin-top: 20px;
                    font-size: .86rem;
                }

                .auth-muted-link {
                    color: rgba(255, 255, 255, .48);
                    text-decoration: none;
                    transition: color .16s ease;
                }

                .auth-muted-link:hover {
                    color: rgba(255, 255, 255, .82);
                }

                .auth-link {
                    color: #65d84a;
                    font-weight: 900;
                    text-decoration: none;
                    background: linear-gradient(90deg, #65d84a, #ffad00);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    border-bottom: 2px solid #ffad00;
                    padding-bottom: 2px;
                }

                @media (max-width: 760px) {
                    .auth-page {
                        background-position: center center;
                        padding: 34px 14px;
                    }
                    .auth-card {
                        width: min(100%, 410px);
                        padding: 38px 24px 30px;
                        border-radius: 24px;
                    }
                    .auth-logo { height: 76px; }
                }
            `}</style>
        </div>
    );
}
