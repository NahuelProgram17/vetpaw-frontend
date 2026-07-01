import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import ownerBg from "../assets/vetpaw-owner-bg.png";
import dogRunner from "../assets/vetpaw-loader-dog.png";

export function VetPawLoader({
  message = "Cargando VetPaw...",
  subText = "Preparando la siguiente página",
  fullScreen = true,
  overlay = false,
}) {
  return (
    <div
      className={`vp-loader ${fullScreen ? "vp-loader-full" : "vp-loader-inline"} ${overlay ? "vp-loader-overlay" : ""}`}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="vp-loader-bg" />

      <div className="vp-loader-card">
        <div className="vp-dog-track" aria-hidden="true">
          <img className="vp-running-dog" src={dogRunner} alt="" draggable="false" />
        </div>

        <h2 className="vp-loader-title">
          Cargando <span>VetPaw</span>...
        </h2>
        <p className="vp-loader-subtitle">{subText}</p>

        <div className="vp-progress-row" aria-hidden="true">
          <div className="vp-progress-shell">
            <div className="vp-progress-fill" />
          </div>
          <strong className="vp-progress-number">78%</strong>
        </div>

        <div className="vp-loader-dots" aria-hidden="true">
          <i /><i /><i /><i /><i /><i /><i /><i />
        </div>

        <div className="vp-loader-pill" aria-hidden="true">
          <span className="vp-loader-shield">🐾</span>
          <span>Tu información <b>pet-friendly</b> está en camino</span>
        </div>
      </div>

      <span className="vp-loader-sr-only">{message} {subText}</span>

      <style>{`
        .vp-loader {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Plus Jakarta Sans', 'Nunito', system-ui, sans-serif;
          color: #ffffff;
          isolation: isolate;
        }

        .vp-loader-full {
          min-height: 100vh;
          width: 100%;
          padding: 102px 24px 54px;
        }

        .vp-loader-inline {
          min-height: 430px;
          width: 100%;
          padding: 48px 24px;
          border-radius: 28px;
          background: rgba(6, 16, 31, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .vp-loader-overlay {
          position: fixed;
          inset: 0;
          z-index: 80;
          background: #06101d;
        }

        .vp-loader-bg {
          position: absolute;
          inset: 0;
          z-index: -2;
          background:
            linear-gradient(180deg, rgba(2, 9, 20, 0.04), rgba(2, 9, 20, 0.16)),
            url(${ownerBg});
          background-size: cover;
          background-position: center;
        }

        .vp-loader-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 50% 46%, rgba(19, 78, 158, 0.16), transparent 34%),
            radial-gradient(circle at 50% 92%, rgba(28, 109, 255, 0.13), transparent 36%);
          pointer-events: none;
        }

        .vp-loader-card {
          width: min(895px, 94vw);
          min-height: 620px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          position: relative;
          animation: vpLoaderEnter 240ms ease-out both;
        }

        .vp-dog-track {
          width: min(790px, 92vw);
          height: clamp(170px, 30vw, 280px);
          position: relative;
          overflow: hidden;
          margin-bottom: 16px;
          border-radius: 22px;
        }

        .vp-running-dog {
          position: absolute;
          left: 50%;
          bottom: 0;
          width: min(790px, 92vw);
          max-width: none;
          height: auto;
          display: block;
          user-select: none;
          pointer-events: none;
          transform: translateX(-50%);
          animation: vpDogRun 1.05s ease-in-out infinite;
          filter: drop-shadow(0 22px 34px rgba(0, 0, 0, 0.22));
        }

        .vp-loader-title {
          margin: 0;
          font-size: clamp(34px, 5vw, 58px);
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.055em;
          text-shadow: 0 14px 35px rgba(0, 0, 0, 0.32);
        }

        .vp-loader-title span {
          background: linear-gradient(90deg, #58d86a, #ffb000);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .vp-loader-subtitle {
          margin: 20px 0 24px;
          font-size: clamp(17px, 2.2vw, 26px);
          color: rgba(226, 235, 249, 0.78);
          font-weight: 700;
        }

        .vp-progress-row {
          width: min(580px, 78vw);
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 16px;
          align-items: center;
        }

        .vp-progress-shell {
          height: 38px;
          border-radius: 999px;
          border: 2px solid rgba(109, 162, 224, 0.22);
          background: rgba(7, 20, 41, 0.72);
          overflow: hidden;
          box-shadow: inset 0 0 20px rgba(20, 70, 130, 0.22), 0 14px 35px rgba(0, 0, 0, 0.2);
        }

        .vp-progress-fill {
          width: 78%;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #54d466, #e0c524, #ff9f08);
          box-shadow: 0 0 22px rgba(89, 220, 99, 0.32), 0 0 25px rgba(255, 165, 8, 0.34);
          animation: vpProgressPulse 1.4s ease-in-out infinite alternate;
        }

        .vp-progress-number {
          font-size: clamp(17px, 2vw, 22px);
          font-weight: 900;
          color: rgba(255, 255, 255, 0.96);
        }

        .vp-loader-dots {
          display: flex;
          gap: 18px;
          margin-top: 26px;
        }

        .vp-loader-dots i {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: rgba(73, 114, 164, 0.35);
          animation: vpDot 1.25s ease-in-out infinite;
        }

        .vp-loader-dots i:nth-child(1) { background: #69e95c; animation-delay: 0s; }
        .vp-loader-dots i:nth-child(2) { background: #d7da37; animation-delay: .08s; }
        .vp-loader-dots i:nth-child(3) { background: #ffa719; animation-delay: .16s; }
        .vp-loader-dots i:nth-child(4) { animation-delay: .24s; }
        .vp-loader-dots i:nth-child(5) { animation-delay: .32s; }
        .vp-loader-dots i:nth-child(6) { animation-delay: .40s; }
        .vp-loader-dots i:nth-child(7) { animation-delay: .48s; }
        .vp-loader-dots i:nth-child(8) { animation-delay: .56s; }

        .vp-loader-pill {
          margin-top: 36px;
          width: min(540px, 85vw);
          min-height: 62px;
          padding: 12px 24px;
          border-radius: 999px;
          border: 1px solid rgba(142, 185, 241, 0.16);
          background: rgba(8, 24, 48, 0.56);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          color: rgba(226, 235, 249, 0.78);
          font-size: clamp(15px, 2vw, 20px);
          font-weight: 700;
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.16);
        }

        .vp-loader-pill b {
          color: #55d866;
        }

        .vp-loader-shield {
          width: 34px;
          height: 34px;
          display: inline-grid;
          place-items: center;
          border-radius: 12px;
          border: 1px solid rgba(88, 216, 106, 0.42);
          background: rgba(88, 216, 106, 0.12);
        }

        .vp-loader-sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        @keyframes vpLoaderEnter {
          from { opacity: 0; transform: translateY(8px) scale(0.992); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes vpDogRun {
          0% { transform: translateX(calc(-50% - 18px)) translateY(1px) scale(0.996); }
          35% { transform: translateX(calc(-50% + 5px)) translateY(-8px) scale(1); }
          70% { transform: translateX(calc(-50% + 22px)) translateY(0px) scale(1.004); }
          100% { transform: translateX(calc(-50% - 18px)) translateY(1px) scale(0.996); }
        }

        @keyframes vpProgressPulse {
          from { filter: brightness(0.96); }
          to { filter: brightness(1.12); }
        }

        @keyframes vpDot {
          0%, 100% { transform: translateY(0); opacity: .65; }
          50% { transform: translateY(-5px); opacity: 1; }
        }

        @media (max-width: 640px) {
          .vp-loader-full { padding: 92px 14px 48px; }
          .vp-loader-card { width: 98vw; min-height: 560px; }
          .vp-progress-row { width: 86vw; gap: 10px; }
          .vp-progress-shell { height: 30px; }
          .vp-loader-dots { gap: 12px; }
          .vp-loader-dots i { width: 11px; height: 11px; }
        }
      `}</style>
    </div>
  );
}

export function RouteChangeLoader({ duration = 760 }) {
  const location = useLocation();
  const firstRun = useRef(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), duration);
    return () => window.clearTimeout(timer);
  }, [location.pathname, duration]);

  if (!visible) return null;

  return (
    <VetPawLoader
      overlay
      message="Cargando VetPaw..."
      subText="Preparando la siguiente página"
    />
  );
}

export default VetPawLoader;
