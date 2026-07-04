import { useNavigate } from "react-router-dom";
import ownerIcon from "../assets/vetpaw-dashboard-icons/dashboard-pets.png";
import clinicIcon from "../assets/vetpaw-dashboard-icons/dashboard-clinics.png";

export default function RegisterChoice() {
    const navigate = useNavigate();

    return (
        <div className="choice-page">
            <div className="choice-bg choice-bg-dog" />
            <div className="choice-bg choice-bg-cat" />
            <div className="choice-glow choice-glow-green" />
            <div className="choice-glow choice-glow-orange" />
            <div className="choice-paw choice-paw-1">🐾</div>
            <div className="choice-paw choice-paw-2">🐾</div>
            <div className="choice-paw choice-paw-3">🐾</div>
            <div className="choice-spark s1" />
            <div className="choice-spark s2" />
            <div className="choice-spark s3" />

            <section className="choice-card" aria-label="Elegir tipo de registro">
                <div className="choice-logo-wrap">
                    <img src="/logo_vetpaw.png" alt="VetPaw" className="choice-logo" />
                </div>

                <h1 className="choice-title">¿Cómo querés registrarte?</h1>
                <div className="choice-title-line"><span>🐾</span></div>

                <div className="choice-options">
                    <button className="choice-btn owner" onClick={() => navigate("/register/owner")}>
                        <span className="choice-icon-bubble owner-bubble">
                            <img src={ownerIcon} alt="Dueño de mascota" className="choice-custom-icon" />
                        </span>

                        <span className="choice-copy">
                            <span className="choice-label">Soy dueño/a de mascota</span>
                            <span className="choice-desc">Buscá clínicas, pedí turnos y llevá el historial de tu mascota</span>
                        </span>

                        <span className="choice-arrow">›</span>
                    </button>

                    <button className="choice-btn clinic" onClick={() => navigate("/register/clinic")}>
                        <span className="choice-icon-bubble clinic-bubble">
                            <img src={clinicIcon} alt="Clínica veterinaria" className="choice-custom-icon" />
                        </span>

                        <span className="choice-copy">
                            <span className="choice-label">Soy una clínica veterinaria</span>
                            <span className="choice-desc">Registrá tu clínica, gestioná turnos y atendé a tus pacientes</span>
                        </span>

                        <span className="choice-arrow clinic-arrow">›</span>
                    </button>
                </div>

                <p className="auth-switch">
                    ¿Ya tenés cuenta?{" "}
                    <span className="auth-link" onClick={() => navigate("/login")}>Iniciá sesión</span>
                </p>
            </section>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        .choice-page {
            min-height: calc(100vh - 72px);
            padding: clamp(28px, 5vw, 72px) 18px;
            background:
                radial-gradient(circle at 12% 88%, rgba(76, 175, 80, 0.24), transparent 30%),
                radial-gradient(circle at 92% 12%, rgba(255, 152, 0, 0.24), transparent 32%),
                linear-gradient(135deg, #061425 0%, #071a2f 44%, #06111f 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Nunito', sans-serif;
            position: relative;
            overflow: hidden;
            color: #fff;
        }

        .choice-page::before {
            content: '';
            position: absolute;
            inset: 0;
            background-image:
                linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
            background-size: 44px 44px;
            mask-image: radial-gradient(circle at center, black 0%, transparent 78%);
            pointer-events: none;
        }

        .choice-bg {
            position: absolute;
            width: min(35vw, 560px);
            aspect-ratio: 1 / 1;
            background-size: cover;
            background-position: center;
            opacity: .16;
            filter: grayscale(100%) contrast(1.05) brightness(.86);
            mix-blend-mode: screen;
            pointer-events: none;
        }

        .choice-bg::after {
            content: '';
            position: absolute;
            inset: -2px;
            background: radial-gradient(circle at center, transparent 32%, #061425 74%);
        }

        .choice-bg-dog {
            left: -7vw;
            top: 17%;
            background-image: url('/perro1.jpg');
            transform: rotate(-5deg) scale(1.05);
        }

        .choice-bg-cat {
            right: -7vw;
            top: 23%;
            background-image: url('/gato1.jpg');
            transform: rotate(5deg) scale(1.08);
        }

        .choice-glow {
            position: absolute;
            border-radius: 999px;
            filter: blur(54px);
            opacity: .42;
            pointer-events: none;
        }

        .choice-glow-green {
            width: 340px;
            height: 340px;
            left: -110px;
            bottom: -120px;
            background: rgba(76, 175, 80, .55);
        }

        .choice-glow-orange {
            width: 370px;
            height: 370px;
            right: -120px;
            top: -95px;
            background: rgba(255, 152, 0, .42);
        }

        .choice-paw {
            position: absolute;
            font-size: clamp(44px, 7vw, 96px);
            opacity: .06;
            color: #fff;
            filter: blur(.2px);
            user-select: none;
            pointer-events: none;
        }

        .choice-paw-1 { left: 15%; top: 12%; transform: rotate(-16deg); }
        .choice-paw-2 { right: 14%; top: 13%; transform: rotate(14deg); }
        .choice-paw-3 { right: 7%; top: 29%; transform: rotate(-10deg) scale(.72); }

        .choice-spark {
            position: absolute;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #ffc233;
            box-shadow: 0 0 18px #ffc233;
            animation: sparkPulse 2.8s ease-in-out infinite alternate;
        }
        .s1 { left: 14%; top: 17%; animation-delay: .2s; }
        .s2 { right: 16%; top: 20%; animation-delay: .7s; }
        .s3 { right: 8%; bottom: 30%; animation-delay: 1s; }

        @keyframes sparkPulse {
            from { opacity: .35; transform: scale(.72); }
            to { opacity: 1; transform: scale(1.18); }
        }

        .choice-card {
            width: min(100%, 860px);
            position: relative;
            z-index: 2;
            padding: clamp(34px, 4vw, 56px);
            border-radius: 32px;
            background:
                linear-gradient(180deg, rgba(9, 31, 54, .86), rgba(6, 18, 33, .9)),
                radial-gradient(circle at 24% 0%, rgba(76, 175, 80, .13), transparent 36%),
                radial-gradient(circle at 100% 0%, rgba(255, 152, 0, .12), transparent 35%);
            border: 1px solid rgba(255,255,255,.12);
            box-shadow:
                0 32px 100px rgba(0,0,0,.45),
                inset 0 1px 0 rgba(255,255,255,.08);
            overflow: hidden;
            animation: cardIn .55s cubic-bezier(.22,.68,0,1.08) both;
        }

        .choice-card::before {
            content: '';
            position: absolute;
            inset: 0;
            padding: 1px;
            border-radius: 32px;
            background: linear-gradient(135deg, rgba(76,175,80,.85), rgba(255,152,0,.78), rgba(90,172,255,.2));
            -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none;
        }

        @keyframes cardIn {
            from { opacity: 0; transform: translateY(24px) scale(.97); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .choice-logo-wrap {
            display: flex;
            justify-content: center;
            margin-bottom: 18px;
        }

        .choice-logo {
            width: 118px;
            height: auto;
            display: block;
            filter: drop-shadow(0 10px 22px rgba(76,175,80,.16));
        }

        .choice-title {
            margin: 0;
            text-align: center;
            font-size: clamp(31px, 4.2vw, 48px);
            line-height: 1.08;
            font-weight: 900;
            letter-spacing: -1.4px;
            text-shadow: 0 4px 0 rgba(0,0,0,.16);
        }

        .choice-title-line {
            width: 118px;
            height: 20px;
            margin: 16px auto 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6be05f;
            font-size: 17px;
            position: relative;
        }
        .choice-title-line::before,
        .choice-title-line::after {
            content: '';
            width: 42px;
            height: 2px;
            border-radius: 99px;
            background: linear-gradient(90deg, transparent, #74d84c, #ffae00);
        }
        .choice-title-line::after { transform: rotate(180deg); }
        .choice-title-line span { margin: 0 10px; filter: drop-shadow(0 0 8px rgba(76,175,80,.45)); }

        .choice-options {
            display: flex;
            flex-direction: column;
            gap: 18px;
            max-width: 690px;
            margin: 0 auto 26px;
        }

        .choice-btn {
            width: 100%;
            min-height: 132px;
            display: grid;
            grid-template-columns: 118px 1fr 68px;
            align-items: center;
            gap: 24px;
            padding: 22px 24px;
            border-radius: 24px;
            background: linear-gradient(135deg, rgba(18,45,70,.8), rgba(8,24,42,.74));
            border: 1.5px solid rgba(255,255,255,.12);
            color: #fff;
            cursor: pointer;
            text-align: left;
            transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease, background .18s ease;
            position: relative;
            overflow: hidden;
        }

        .choice-btn::before {
            content: '';
            position: absolute;
            inset: -1px;
            background: radial-gradient(circle at 15% 50%, rgba(76,175,80,.18), transparent 34%);
            opacity: 0;
            transition: opacity .18s ease;
        }

        .choice-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 22px 44px rgba(0,0,0,.28);
        }
        .choice-btn:hover::before { opacity: 1; }
        .choice-btn.owner { border-color: rgba(76,175,80,.42); }
        .choice-btn.owner:hover { border-color: rgba(103, 224, 84, .98); box-shadow: 0 20px 48px rgba(76,175,80,.16); }
        .choice-btn.clinic { border-color: rgba(255,152,0,.42); }
        .choice-btn.clinic:hover { border-color: rgba(255, 174, 0, .95); box-shadow: 0 20px 48px rgba(255,152,0,.16); }

        .choice-icon-bubble {
            width: 96px;
            height: 96px;
            border-radius: 999px;
            display: grid;
            place-items: center;
            position: relative;
            z-index: 1;
            background: radial-gradient(circle at 30% 20%, rgba(255,255,255,.17), rgba(255,255,255,.03));
            border: 1px solid rgba(255,255,255,.12);
            box-shadow: inset 0 0 28px rgba(255,255,255,.05), 0 12px 30px rgba(0,0,0,.24);
        }
        .owner-bubble { box-shadow: inset 0 0 30px rgba(76,175,80,.14), 0 12px 30px rgba(0,0,0,.25); }
        .clinic-bubble { box-shadow: inset 0 0 30px rgba(255,152,0,.13), 0 12px 30px rgba(0,0,0,.25); }

        .choice-custom-icon {
            width: 72px;
            height: 72px;
            object-fit: contain;
            filter: drop-shadow(0 8px 14px rgba(0,0,0,.26));
        }

        .choice-copy {
            display: flex;
            flex-direction: column;
            gap: 8px;
            position: relative;
            z-index: 1;
        }

        .choice-label {
            font-size: clamp(22px, 2.3vw, 29px);
            font-weight: 900;
            line-height: 1.1;
            letter-spacing: -.55px;
            text-shadow: 0 3px 0 rgba(0,0,0,.14);
        }

        .choice-desc {
            max-width: 430px;
            color: rgba(255,255,255,.72);
            font-size: clamp(16px, 1.5vw, 20px);
            line-height: 1.42;
            font-weight: 600;
        }

        .choice-arrow {
            width: 58px;
            height: 58px;
            border-radius: 999px;
            display: grid;
            place-items: center;
            justify-self: end;
            font-size: 46px;
            line-height: 1;
            color: #74e45e;
            background: rgba(76,175,80,.12);
            border: 1px solid rgba(76,175,80,.35);
            box-shadow: 0 0 22px rgba(76,175,80,.15);
            position: relative;
            z-index: 1;
            transition: transform .18s ease;
        }
        .clinic-arrow {
            color: #ffb22c;
            background: rgba(255,152,0,.12);
            border-color: rgba(255,152,0,.38);
            box-shadow: 0 0 22px rgba(255,152,0,.15);
        }
        .choice-btn:hover .choice-arrow { transform: translateX(4px); }

        .auth-switch {
            margin: 0;
            text-align: center;
            color: rgba(255,255,255,.72);
            font-size: clamp(16px, 1.5vw, 19px);
            font-weight: 700;
        }
        .auth-link {
            color: #74e45e;
            font-weight: 900;
            cursor: pointer;
            position: relative;
        }
        .auth-link::after {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            bottom: -7px;
            height: 3px;
            border-radius: 99px;
            background: linear-gradient(90deg, #4caf50, #ff9800);
        }

        @media (max-width: 820px) {
            .choice-page { padding: 24px 14px; align-items: flex-start; }
            .choice-card { padding: 30px 18px; border-radius: 24px; }
            .choice-bg { opacity: .09; width: 72vw; }
            .choice-bg-dog { left: -25vw; top: 8%; }
            .choice-bg-cat { right: -28vw; top: 45%; }
            .choice-btn {
                grid-template-columns: 82px 1fr 42px;
                gap: 14px;
                min-height: 112px;
                padding: 18px 16px;
                border-radius: 20px;
            }
            .choice-icon-bubble { width: 74px; height: 74px; }
            .choice-custom-icon { width: 58px; height: 58px; }
            .choice-arrow { width: 40px; height: 40px; font-size: 34px; }
        }

        @media (max-width: 520px) {
            .choice-btn {
                grid-template-columns: 1fr;
                text-align: center;
                justify-items: center;
            }
            .choice-copy { align-items: center; }
            .choice-desc { max-width: 280px; }
            .choice-arrow { display: none; }
        }
    `}</style>
        </div>
    );
}
