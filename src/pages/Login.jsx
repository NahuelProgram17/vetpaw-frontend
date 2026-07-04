import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import appointmentIcon from "../assets/vetpaw-dashboard-icons/dashboard-appointments.png";
import vaccineIcon from "../assets/vetpaw-icons/syringe.png";
import historyIcon from "../assets/vetpaw-icons/medical-folder.png";
import bookIcon from "../assets/vetpaw-icons/health-book.png";
import reminderIcon from "../assets/vetpaw-icons/reminder-bell.png";
import healthIcon from "../assets/vetpaw-icons/health-heart.png";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ username: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

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
            const msg = data?.detail || "Credenciales incorrectas. Intentá de nuevo.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-vp">
            <div className="login-grid" />
            <div className="login-glow login-glow-green" />
            <div className="login-glow login-glow-orange" />
            <div className="login-paw paw-a">🐾</div>
            <div className="login-paw paw-b">🐾</div>
            <div className="login-paw paw-c">🐾</div>

            <div className="login-feature login-feature-left feature-calendar">
                <img src={appointmentIcon} alt="Turnos" />
            </div>
            <div className="login-feature login-feature-left feature-vaccine">
                <img src={vaccineIcon} alt="Vacunas" />
            </div>
            <div className="login-feature login-feature-left feature-folder">
                <img src={historyIcon} alt="Historial" />
            </div>
            <div className="login-feature login-feature-right feature-health">
                <img src={healthIcon} alt="Salud" />
            </div>
            <div className="login-feature login-feature-right feature-book">
                <img src={bookIcon} alt="Libreta sanitaria" />
            </div>
            <div className="login-feature login-feature-right feature-bell">
                <img src={reminderIcon} alt="Recordatorios" />
            </div>

            <section className="login-card-vp" aria-label="Iniciar sesión">
                <div className="login-logo-wrap">
                    <img src="/logo_vetpaw.png" alt="VetPaw" className="login-logo" />
                </div>

                <p className="login-tagline">Tu clínica, siempre cerca.</p>
                <div className="login-title-line"><span>🐾</span></div>
                <h1 className="login-title">Iniciá sesión</h1>

                {error && (
                    <div className="auth-error">
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

                <p className="auth-switch muted-link-row">
                    <Link to="/forgot-password" className="forgot-link">
                        ¿Olvidaste tu contraseña?
                    </Link>
                </p>
                <p className="auth-switch register-row">
                    ¿No tenés cuenta?{" "}
                    <Link to="/register" className="auth-link">
                        Registrate
                    </Link>
                </p>
            </section>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .login-page-vp {
            min-height: calc(100vh - 72px);
            padding: clamp(28px, 4.8vw, 70px) 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
            color: #fff;
            font-family: 'Nunito', sans-serif;
            background:
                radial-gradient(circle at 0% 100%, rgba(76, 175, 80, 0.30), transparent 32%),
                radial-gradient(circle at 100% 12%, rgba(255, 152, 0, 0.30), transparent 35%),
                radial-gradient(circle at 50% 22%, rgba(19, 89, 150, 0.24), transparent 44%),
                linear-gradient(135deg, #061425 0%, #071a2f 44%, #06111f 100%);
        }

        .login-grid {
            position: absolute;
            inset: 0;
            background-image:
                linear-gradient(rgba(255,255,255,.026) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,.026) 1px, transparent 1px);
            background-size: 46px 46px;
            mask-image: radial-gradient(circle at center, black 0%, transparent 78%);
            pointer-events: none;
        }

        .login-page-vp::before,
        .login-page-vp::after {
            content: '';
            position: absolute;
            pointer-events: none;
            opacity: .44;
            filter: blur(.1px);
        }

        .login-page-vp::before {
            width: 34vw;
            height: 34vw;
            min-width: 340px;
            min-height: 340px;
            left: -8vw;
            bottom: -7vw;
            border-radius: 50%;
            border: 1.5px solid rgba(114, 216, 76, .36);
            box-shadow: inset 0 0 80px rgba(76, 175, 80, .12), 0 0 80px rgba(76, 175, 80, .13);
        }

        .login-page-vp::after {
            width: 34vw;
            height: 34vw;
            min-width: 350px;
            min-height: 350px;
            right: -10vw;
            top: -8vw;
            border-radius: 50%;
            border: 1.5px solid rgba(255, 152, 0, .34);
            box-shadow: inset 0 0 90px rgba(255, 152, 0, .13), 0 0 90px rgba(255, 152, 0, .12);
        }

        .login-glow {
            position: absolute;
            border-radius: 999px;
            filter: blur(62px);
            pointer-events: none;
        }

        .login-glow-green {
            width: 360px;
            height: 360px;
            left: -125px;
            bottom: -125px;
            background: rgba(76, 175, 80, .52);
        }

        .login-glow-orange {
            width: 390px;
            height: 390px;
            right: -135px;
            top: -120px;
            background: rgba(255, 152, 0, .42);
        }

        .login-paw {
            position: absolute;
            font-size: clamp(42px, 7vw, 98px);
            opacity: .07;
            color: #d8ecff;
            pointer-events: none;
            user-select: none;
        }
        .paw-a { left: 13%; top: 11%; transform: rotate(-16deg); }
        .paw-b { right: 13%; top: 12%; transform: rotate(13deg); }
        .paw-c { left: 28%; bottom: 12%; transform: rotate(12deg) scale(.7); }

        .login-feature {
            position: absolute;
            z-index: 1;
            pointer-events: none;
            opacity: .20;
            filter: drop-shadow(0 18px 34px rgba(0,0,0,.40));
            animation: loginFloat 7s ease-in-out infinite alternate;
        }

        .login-feature img {
            width: clamp(82px, 10vw, 152px);
            height: auto;
            display: block;
            transform: rotate(var(--rot, -8deg));
        }

        .login-feature-left { left: max(28px, 8vw); }
        .login-feature-right { right: max(28px, 8vw); }

        .feature-calendar { top: 14%; --rot: -13deg; animation-delay: -.8s; }
        .feature-vaccine { top: 38%; left: max(60px, 19vw); --rot: -18deg; animation-delay: -2s; opacity: .22; }
        .feature-folder { bottom: 11%; --rot: 4deg; animation-delay: -1.2s; opacity: .16; }
        .feature-health { top: 15%; --rot: 10deg; animation-delay: -.5s; }
        .feature-book { top: 40%; --rot: 13deg; animation-delay: -1.8s; opacity: .17; }
        .feature-bell { bottom: 12%; right: max(70px, 20vw); --rot: -10deg; animation-delay: -2.5s; opacity: .20; }

        @keyframes loginFloat {
            from { transform: translate3d(0, 0, 0) scale(1); }
            to { transform: translate3d(12px, -16px, 0) scale(1.035); }
        }

        .login-card-vp {
            width: min(100%, 560px);
            position: relative;
            z-index: 5;
            padding: clamp(34px, 4.1vw, 52px) clamp(28px, 4vw, 48px) 40px;
            border-radius: 32px;
            background:
                linear-gradient(180deg, rgba(9, 31, 54, .88), rgba(6, 18, 33, .92)),
                radial-gradient(circle at 24% 0%, rgba(76, 175, 80, .13), transparent 36%),
                radial-gradient(circle at 100% 0%, rgba(255, 152, 0, .12), transparent 35%);
            border: 1px solid rgba(255,255,255,.12);
            box-shadow:
                0 34px 100px rgba(0,0,0,.50),
                0 0 44px rgba(76, 175, 80, .08),
                inset 0 1px 0 rgba(255,255,255,.08);
            overflow: hidden;
            animation: cardIn .55s cubic-bezier(.22,.68,0,1.08) both;
        }

        .login-card-vp::before {
            content: '';
            position: absolute;
            inset: 0;
            padding: 1px;
            border-radius: 32px;
            background: linear-gradient(135deg, rgba(76,175,80,.88), rgba(255,152,0,.82), rgba(90,172,255,.2));
            -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none;
        }

        .login-card-vp::after {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at 50% 0%, rgba(255,255,255,.08), transparent 44%);
            pointer-events: none;
        }

        @keyframes cardIn {
            from { opacity: 0; transform: translateY(24px) scale(.97); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .login-logo-wrap {
            display: flex;
            justify-content: center;
            margin-bottom: 12px;
            position: relative;
            z-index: 2;
        }

        .login-logo {
            width: 132px;
            height: auto;
            display: block;
            filter: drop-shadow(0 10px 22px rgba(76,175,80,.16));
        }

        .login-tagline {
            position: relative;
            z-index: 2;
            text-align: center;
            font-size: .84rem;
            color: rgba(255,255,255,.55);
            margin: 0;
            letter-spacing: .07em;
            text-transform: uppercase;
            font-weight: 900;
        }

        .login-title-line {
            position: relative;
            z-index: 2;
            width: 122px;
            height: 20px;
            margin: 15px auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6be05f;
            font-size: 17px;
        }
        .login-title-line::before,
        .login-title-line::after {
            content: '';
            width: 42px;
            height: 2px;
            border-radius: 99px;
            background: linear-gradient(90deg, transparent, #74d84c, #ffae00);
        }
        .login-title-line::after { transform: rotate(180deg); }
        .login-title-line span { margin: 0 10px; filter: drop-shadow(0 0 8px rgba(76,175,80,.45)); }

        .login-title {
            position: relative;
            z-index: 2;
            text-align: center;
            margin: 0 0 24px;
            font-size: clamp(28px, 3vw, 38px);
            line-height: 1.05;
            font-weight: 900;
            letter-spacing: -.8px;
            text-shadow: 0 4px 0 rgba(0,0,0,.18);
        }

        .auth-error {
            position: relative;
            z-index: 2;
            background: rgba(255,82,82,0.14);
            border: 1px solid rgba(255,82,82,0.42);
            color: #ffb0b0;
            padding: 12px 14px;
            border-radius: 14px;
            font-size: .9rem;
            margin-bottom: 16px;
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .auth-form {
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            gap: 18px;
        }

        .field-group { display: flex; flex-direction: column; gap: 8px; }
        .field-group label {
            font-size: .82rem;
            font-weight: 900;
            color: rgba(255,255,255,.62);
            text-transform: uppercase;
            letter-spacing: .08em;
        }

        .input-wrapper { position: relative; display: flex; align-items: center; }
        .input-icon {
            position: absolute;
            left: 16px;
            font-size: 1.05rem;
            pointer-events: none;
            opacity: .92;
        }
        .input-wrapper input {
            width: 100%;
            padding: 15px 16px 15px 48px;
            background: rgba(255,255,255,.055);
            border: 1.5px solid rgba(210,232,255,.16);
            border-radius: 15px;
            color: #fff;
            font-family: 'Nunito', sans-serif;
            font-size: 1rem;
            font-weight: 700;
            transition: border-color .2s, background .2s, box-shadow .2s, transform .2s;
            outline: none;
            box-shadow: inset 0 1px 0 rgba(255,255,255,.04);
        }
        .input-wrapper input::placeholder { color: rgba(255,255,255,.25); }
        .input-wrapper input:focus {
            border-color: rgba(92, 222, 80, .88);
            background: rgba(76,175,80,.075);
            box-shadow: 0 0 0 4px rgba(76,175,80,.13), 0 0 22px rgba(76,175,80,.08);
        }

        .auth-btn {
            margin-top: 8px;
            padding: 16px;
            background: linear-gradient(135deg, #5fca4e 0%, #f8b400 58%, #ff9800 100%);
            color: #fff;
            font-family: 'Nunito', sans-serif;
            font-size: 1.08rem;
            font-weight: 900;
            border: 0;
            border-radius: 15px;
            cursor: pointer;
            letter-spacing: .02em;
            transition: transform .15s, box-shadow .15s, opacity .15s;
            box-shadow: 0 12px 30px rgba(76,175,80,.26), 0 10px 25px rgba(255,152,0,.18);
        }
        .auth-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 16px 34px rgba(76,175,80,.34), 0 12px 26px rgba(255,152,0,.24); }
        .auth-btn:active:not(:disabled) { transform: translateY(0); }
        .auth-btn:disabled { opacity: .68; cursor: not-allowed; }

        .btn-loading { display: flex; align-items: center; justify-content: center; gap: 10px; }
        .spinner {
            width: 17px;
            height: 17px;
            border: 2.5px solid rgba(255,255,255,.3);
            border-top-color: #fff;
            border-radius: 50%;
            animation: spin .7s linear infinite;
            display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .auth-switch {
            position: relative;
            z-index: 2;
            text-align: center;
            font-size: .92rem;
            color: rgba(255,255,255,.58);
        }
        .muted-link-row { margin: 18px 0 0; }
        .register-row { margin: 16px 0 0; }
        .forgot-link {
            color: rgba(255,255,255,.50);
            font-weight: 800;
            text-decoration: none;
            transition: color .15s;
        }
        .forgot-link:hover { color: rgba(255,255,255,.78); text-decoration: underline; }
        .auth-link {
            color: #74e05f;
            font-weight: 900;
            text-decoration: none;
            position: relative;
            transition: color .15s;
        }
        .auth-link::after {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            bottom: -5px;
            height: 2px;
            border-radius: 99px;
            background: linear-gradient(90deg, #64d84d, #ffb100);
            box-shadow: 0 0 12px rgba(255,177,0,.25);
        }
        .auth-link:hover { color: #ffbe28; }

        @media (max-width: 980px) {
            .login-feature { opacity: .12; }
            .feature-vaccine, .feature-bell { display: none; }
        }

        @media (max-width: 640px) {
            .login-page-vp { padding: 28px 14px; align-items: flex-start; }
            .login-card-vp { border-radius: 24px; padding: 32px 22px 30px; }
            .login-card-vp::before { border-radius: 24px; }
            .login-logo { width: 112px; }
            .login-feature { display: none; }
            .login-paw { opacity: .045; }
        }
    `}</style>
        </div>
    );
}
