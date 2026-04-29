import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ username: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showResend, setShowResend] = useState(false);    
    const [resendMsg, setResendMsg] = useState("");
    const [resendEmail, setResendEmail] = useState("");

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
        const userData = await login(form.username, form.password);
        if (userData?.role === "clinic") {
            navigate("/clinic/dashboard");
        } else {
            navigate("/dashboard");
        }       
    } catch (err) {
        const data = err.response?.data;
        const msg = data?.email?.[0] || data?.detail || "Credenciales incorrectas. Intentá de nuevo.";
        setError(msg);
        if (data?.email?.[0]?.includes('verificar')) {
            setShowResend(true);
        }
    } finally {
        setLoading(false);
    }
};
const handleResend = async (e) => {
    e.preventDefault();
    try {
        await fetch("http://localhost:8000/api/users/resend-verification/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: resendEmail }),
        });
        setResendMsg("Email reenviado. Revisá tu casilla 📬");
    } catch {
        setResendMsg("Hubo un error. Intentá de nuevo.");
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

                <p className="auth-tagline">Tu clínica, siempre cerca.</p>

                <h2 className="auth-title">Iniciá sesión</h2>

                {error && (
    <div className="auth-error">
        <span>⚠️</span> {error}
    </div>
)}

{showResend && (
    <div className="resend-box">
        <p>¿No recibiste el email?</p>
        <form onSubmit={handleResend} className="resend-form">
            <input
                type="email"
                placeholder="Tu email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                required
            />
            <button type="submit">Reenviar 📬</button>
        </form>
        {resendMsg && <p className="resend-msg">{resendMsg}</p>}
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

                <p className="auth-switch">
                    ¿No tenés cuenta?{" "}
                    <Link to="/register" className="auth-link">
                        Registrate
                    </Link>
                </p>
            </div>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Fraunces:ital,opsz,wght@1,9..144,700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .auth-page {
        min-height: 100vh;
        background: #1a1a2e;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Nunito', sans-serif;
        position: relative;
        overflow: hidden;
        }

        .blob {
        position: absolute;
        border-radius: 50%;
        filter: blur(80px);
        opacity: 0.18;
        animation: blobFloat 8s ease-in-out infinite alternate;
        }
        .blob-1 { width: 420px; height: 420px; background: #ff6b6b; top: -100px; left: -120px; animation-duration: 9s; }
        .blob-2 { width: 320px; height: 320px; background: #ffd93d; bottom: -80px; right: -80px; animation-duration: 11s; animation-delay: -3s; }
        .blob-3 { width: 200px; height: 200px; background: #6bcaff; top: 50%; right: 15%; animation-duration: 7s; animation-delay: -1.5s; }
        @keyframes blobFloat {
        from { transform: translate(0, 0) scale(1); }
        to   { transform: translate(30px, 25px) scale(1.08); }
        }

        .auth-card {
        position: relative;
        z-index: 10;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.10);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 28px;
        padding: 48px 44px 40px;
        width: 100%;
        max-width: 420px;
        box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,107,107,0.08);
        animation: cardIn 0.55s cubic-bezier(.22,.68,0,1.2) both;
        }
        @keyframes cardIn {
        from { opacity: 0; transform: translateY(28px) scale(0.96); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .auth-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
        .paw-icon { font-size: 2rem; animation: pawBounce 2s ease-in-out infinite; }
        @keyframes pawBounce {
        0%, 100% { transform: rotate(-8deg) scale(1); }
        50%       { transform: rotate(8deg) scale(1.15); }
        }
        .brand-name {
        font-family: 'Fraunces', serif;
        font-size: 2rem; font-weight: 700; font-style: italic;
        color: #ff6b6b; letter-spacing: -1px;
        }

        .auth-tagline {
        font-size: 0.78rem; color: rgba(255,255,255,0.4);
        margin-bottom: 28px; letter-spacing: 0.06em; text-transform: uppercase;
        }

        .auth-title { font-size: 1.4rem; font-weight: 900; color: #fff; margin-bottom: 20px; }

        .auth-error {
        background: rgba(255,107,107,0.15);
        border: 1px solid rgba(255,107,107,0.4);
        color: #ff9999; padding: 10px 14px;
        border-radius: 10px; font-size: 0.86rem;
        margin-bottom: 16px; display: flex; gap: 8px; align-items: center;
        }

        .auth-form { display: flex; flex-direction: column; gap: 18px; }

        .field-group { display: flex; flex-direction: column; gap: 6px; }
        .field-group label {
        font-size: 0.8rem; font-weight: 700;
        color: rgba(255,255,255,0.55);
        text-transform: uppercase; letter-spacing: 0.08em;
        }

        .input-wrapper { position: relative; display: flex; align-items: center; }
        .input-icon { position: absolute; left: 14px; font-size: 1rem; pointer-events: none; }
        .input-wrapper input {
        width: 100%;
        padding: 13px 14px 13px 42px;
        background: rgba(255,255,255,0.06);
        border: 1.5px solid rgba(255,255,255,0.10);
        border-radius: 12px; color: #fff;
        font-family: 'Nunito', sans-serif; font-size: 0.96rem;
        transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        outline: none;
        }
        .input-wrapper input::placeholder { color: rgba(255,255,255,0.25); }
        .input-wrapper input:focus {
        border-color: #ff6b6b;
        background: rgba(255,107,107,0.07);
        box-shadow: 0 0 0 4px rgba(255,107,107,0.12);
        }

        .auth-btn {
        margin-top: 6px; padding: 14px;
        background: linear-gradient(135deg, #ff6b6b 0%, #ff4a4a 100%);
        color: #fff; font-family: 'Nunito', sans-serif;
        font-size: 1rem; font-weight: 900; border: none;
        border-radius: 12px; cursor: pointer; letter-spacing: 0.03em;
        transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
        box-shadow: 0 6px 20px rgba(255,107,107,0.35);
        }
        .auth-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(255,107,107,0.5); }
        .auth-btn:active:not(:disabled) { transform: translateY(0); }
        .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .btn-loading { display: flex; align-items: center; justify-content: center; gap: 10px; }
        .spinner {
        width: 16px; height: 16px;
        border: 2.5px solid rgba(255,255,255,0.3);
        border-top-color: #fff; border-radius: 50%;
        animation: spin 0.7s linear infinite; display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .auth-switch { text-align: center; margin-top: 22px; font-size: 0.88rem; color: rgba(255,255,255,0.4); }
        .auth-link { color: #ffd93d; font-weight: 700; text-decoration: none; transition: color 0.15s; }
        .auth-link:hover { color: #ffe97a; text-decoration: underline; }

        @media (max-width: 480px) {
        .auth-card { padding: 36px 24px 32px; margin: 16px; border-radius: 20px; }
        }
        .resend-box {
    background: rgba(255,217,61,0.08);
    border: 1px solid rgba(255,217,61,0.3);
    border-radius: 10px;
    padding: 14px;
    margin-bottom: 16px;
    font-size: 0.86rem;
    color: rgba(255,255,255,0.7);
}
.resend-form {
    display: flex;
    gap: 8px;
    margin-top: 8px;
}
.resend-form input {
    flex: 1;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.06);
    color: #fff;
    font-size: 0.86rem;
    outline: none;
}
.resend-form button {
    padding: 8px 14px;
    background: #ffd93d;
    color: #1a1a2e;
    border: none;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
    font-size: 0.86rem;
}
.resend-msg {
    margin-top: 8px;
    color: #ffd93d;
    font-size: 0.83rem;
}
    `}</style>
        </div>
    );
}
