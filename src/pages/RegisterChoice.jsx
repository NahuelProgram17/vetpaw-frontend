import { useNavigate } from "react-router-dom";

export default function RegisterChoice() {
    const navigate = useNavigate();

    return (
        <div className="choice-page">
            <div className="blob blob-1" />
            <div className="blob blob-2" />

            <div className="choice-card">
                <div className="auth-brand">
                    <span className="paw-icon">🐾</span>
                    <h1 className="brand-name">VetPaw</h1>
                </div>
                <p className="choice-subtitle">¿Cómo querés registrarte?</p>

                <div className="choice-options">
                    <button className="choice-btn owner" onClick={() => navigate("/register/owner")}>
                        <span className="choice-icon">🐶</span>
                        <span className="choice-label">Soy dueño/a de mascota</span>
                        <span className="choice-desc">Buscá clínicas, pedí turnos y llevá el historial de tu mascota</span>
                    </button>

                    <button className="choice-btn clinic" onClick={() => navigate("/register/clinic")}>
                        <span className="choice-icon">🏥</span>
                        <span className="choice-label">Soy una clínica veterinaria</span>
                        <span className="choice-desc">Registrá tu clínica, gestioná turnos y atendé a tus pacientes</span>
                    </button>
                </div>

                <p className="auth-switch">
                    ¿Ya tenés cuenta?{" "}
                    <span className="auth-link" onClick={() => navigate("/login")}>Iniciá sesión</span>
                </p>
            </div>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Fraunces:ital,opsz,wght@1,9..144,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .choice-page {
            min-height: 100vh; background: #1a1a2e;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Nunito', sans-serif; position: relative; overflow: hidden;
        }
        .blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.18; animation: blobFloat 8s ease-in-out infinite alternate; }
        .blob-1 { width: 400px; height: 400px; background: #ffd93d; top: -80px; right: -100px; animation-duration: 10s; }
        .blob-2 { width: 350px; height: 350px; background: #ff6b6b; bottom: -100px; left: -80px; animation-duration: 12s; }
        @keyframes blobFloat {
            from { transform: translate(0,0) scale(1); }
            to { transform: translate(20px,30px) scale(1.06); }
        }
        .choice-card {
            position: relative; z-index: 10;
            background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.10);
            backdrop-filter: blur(20px); border-radius: 28px; padding: 48px 44px 40px;
            width: 100%; max-width: 480px;
            box-shadow: 0 32px 80px rgba(0,0,0,0.5);
            animation: cardIn 0.55s cubic-bezier(.22,.68,0,1.2) both;
        }
        @keyframes cardIn {
            from { opacity: 0; transform: translateY(28px) scale(0.96); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .auth-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
        .paw-icon { font-size: 2rem; animation: pawBounce 2s ease-in-out infinite; }
        @keyframes pawBounce {
            0%,100% { transform: rotate(-8deg) scale(1); }
            50% { transform: rotate(8deg) scale(1.15); }
        }
        .brand-name { font-family: 'Fraunces', serif; font-size: 2rem; font-weight: 700; font-style: italic; color: #ff6b6b; letter-spacing: -1px; }
        .choice-subtitle { font-size: 1.1rem; font-weight: 900; color: #fff; margin: 20px 0 24px; }
        .choice-options { display: flex; flex-direction: column; gap: 16px; margin-bottom: 28px; }
        .choice-btn {
            display: flex; flex-direction: column; align-items: flex-start; gap: 6px;
            padding: 20px 24px; border-radius: 16px; border: 2px solid rgba(255,255,255,0.10);
            background: rgba(255,255,255,0.04); cursor: pointer; text-align: left;
            transition: all 0.2s;
        }
        .choice-btn:hover { transform: translateY(-3px); }
        .choice-btn.owner:hover { border-color: #ffd93d; background: rgba(255,217,61,0.06); box-shadow: 0 8px 24px rgba(255,217,61,0.15); }
        .choice-btn.clinic:hover { border-color: #6bcaff; background: rgba(107,202,255,0.06); box-shadow: 0 8px 24px rgba(107,202,255,0.15); }
        .choice-icon { font-size: 2rem; }
        .choice-label { font-size: 1rem; font-weight: 900; color: #fff; }
        .choice-desc { font-size: 0.82rem; color: rgba(255,255,255,0.4); line-height: 1.4; }
        .auth-switch { text-align: center; font-size: 0.88rem; color: rgba(255,255,255,0.4); }
        .auth-link { color: #ffd93d; font-weight: 700; cursor: pointer; }
        .auth-link:hover { text-decoration: underline; }

        @media (max-width: 480px) {
            .choice-card { padding: 36px 20px 32px; margin: 16px; }
        }
    `}</style>
        </div>
    );
}