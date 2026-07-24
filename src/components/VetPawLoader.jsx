import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import ownerBg from "../assets/vetpaw-owner-bg.webp";
import dogRunner from "../assets/vetpaw-loader-dog.webp";

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

      <div className="vp-loader-content">
        <div className="vp-runner-stage" aria-hidden="true">
          <img className="vp-runner-dog" src={dogRunner} alt="" draggable="false" />
          <span className="vp-speed-line vp-speed-line-1" />
          <span className="vp-speed-line vp-speed-line-2" />
          <span className="vp-speed-line vp-speed-line-3" />
        </div>

        <h2 className="vp-loader-title">
          Cargando <span>VetPaw</span>...
        </h2>

        <p className="vp-loader-subtitle">{subText}</p>

        <div className="vp-progress-wrap" aria-hidden="true">
          <div className="vp-progress-shell">
            <div className="vp-progress-fill" />
          </div>
          <strong>78%</strong>
        </div>

        <div className="vp-loader-dots" aria-hidden="true">
          <i /><i /><i /><i /><i /><i /><i /><i />
        </div>

        <div className="vp-loader-note" aria-hidden="true">
          <span>🛡️</span>
          <p>Tu información <b>pet-friendly</b> está en camino</p>
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
          padding: 94px 20px 52px;
        }

        .vp-loader-inline {
          min-height: 420px;
          width: 100%;
          padding: 48px 20px;
          border-radius: 28px;
          background: rgba(5, 15, 30, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .vp-loader-overlay {
          position: fixed;
          inset: 0;
          z-index: 80;
          background: rgba(2, 8, 18, 0.84);
          backdrop-filter: blur(2px);
        }

        .vp-loader-bg {
          position: absolute;
          inset: 0;
          z-index: -2;
          background:
            linear-gradient(180deg, rgba(2, 8, 17, 0.10), rgba(2, 8, 17, 0.26)),
            url(${ownerBg});
          background-size: cover;
          background-position: center top;
        }

        .vp-loader-bg::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 50% 45%, rgba(15, 91, 172, 0.18), transparent 35%),
            radial-gradient(circle at 50% 90%, rgba(31, 103, 255, 0.13), transparent 35%);
        }

        .vp-loader-content {
          width: min(860px, 94vw);
          min-height: 575px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          position: relative;
          animation: vpLoaderEnter 260ms ease-out both;
        }

        .vp-runner-stage {
          width: min(760px, 92vw);
          height: clamp(180px, 30vw, 285px);
          position: relative;
          overflow: hidden;
          margin-bottom: 14px;
          border-radius: 30px;
          -webkit-mask-image: radial-gradient(ellipse at center, #000 64%, transparent 76%);
          mask-image: radial-gradient(ellipse at center, #000 64%, transparent 76%);
        }

        .vp-runner-stage::before {
          content: "";
          position: absolute;
          left: 50%;
          bottom: 17%;
          width: 52%;
          height: 2px;
          transform: translateX(-50%);
          background: linear-gradient(90deg, transparent, rgba(111, 218, 85, 0.45), rgba(255, 176, 0, 0.55), transparent);
          filter: blur(0.4px);
          opacity: 0.85;
          animation: vpGroundGlow 1.15s ease-in-out infinite;
        }

        .vp-runner-dog {
          position: absolute;
          left: 50%;
          bottom: 0;
          width: min(760px, 92vw);
          max-width: none;
          height: auto;
          display: block;
          user-select: none;
          pointer-events: none;
          transform: translateX(-50%);
          filter: drop-shadow(0 18px 30px rgba(0, 0, 0, 0.26));
          animation: vpDogRun 1.05s ease-in-out infinite;
          will-change: transform;
        }

        .vp-speed-line {
          position: absolute;
          height: 2px;
          border-radius: 999px;
          opacity: 0;
          left: 15%;
          background: linear-gradient(90deg, transparent, rgba(62, 214, 255, 0.55), rgba(104, 229, 92, 0.45), transparent);
          filter: blur(0.5px);
          animation: vpSpeedLine 1.05s ease-in-out infinite;
        }

        .vp-speed-line-1 { top: 47%; width: 190px; animation-delay: 0s; }
        .vp-speed-line-2 { top: 58%; width: 255px; animation-delay: .14s; }
        .vp-speed-line-3 { top: 69%; width: 145px; animation-delay: .28s; }

        .vp-loader-title {
          margin: 0;
          font-size: clamp(36px, 5vw, 60px);
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.055em;
          text-shadow: 0 14px 35px rgba(0, 0, 0, 0.34);
        }

        .vp-loader-title span {
          background: linear-gradient(90deg, #58d86a, #ffb000);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .vp-loader-subtitle {
          margin: 18px 0 24px;
          font-size: clamp(18px, 2.2vw, 26px);
          color: rgba(226, 235, 249, 0.78);
          font-weight: 700;
        }

        .vp-progress-wrap {
          width: min(585px, 82vw);
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 16px;
        }

        .vp-progress-shell {
          height: 35px;
          border-radius: 999px;
          border: 2px solid rgba(111, 162, 226, 0.22);
          background: rgba(7, 20, 41, 0.66);
          overflow: hidden;
          box-shadow: inset 0 0 18px rgba(20, 70, 130, 0.22), 0 14px 35px rgba(0, 0, 0, 0.2);
        }

        .vp-progress-fill {
          width: 78%;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #54d466, #e0c524, #ff9f08);
          box-shadow: 0 0 18px rgba(89, 220, 99, 0.30), 0 0 22px rgba(255, 165, 8, 0.30);
          animation: vpProgressPulse 1.4s ease-in-out infinite alternate;
        }

        .vp-progress-wrap strong {
          font-size: clamp(17px, 2vw, 22px);
          font-weight: 900;
          color: rgba(255, 255, 255, 0.96);
        }

        .vp-loader-dots {
          display: flex;
          gap: 17px;
          margin-top: 25px;
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
        .vp-loader-dots i:nth-child(3) { background: #ffae18; animation-delay: .16s; }
        .vp-loader-dots i:nth-child(4) { animation-delay: .24s; }
        .vp-loader-dots i:nth-child(5) { animation-delay: .32s; }
        .vp-loader-dots i:nth-child(6) { animation-delay: .40s; }
        .vp-loader-dots i:nth-child(7) { animation-delay: .48s; }
        .vp-loader-dots i:nth-child(8) { animation-delay: .56s; }

        .vp-loader-note {
          margin-top: 36px;
          display: inline-flex;
          align-items: center;
          gap: 14px;
          padding: 15px 26px;
          border-radius: 999px;
          border: 1px solid rgba(111, 162, 226, 0.18);
          background: rgba(7, 20, 41, 0.45);
          color: rgba(226, 235, 249, 0.78);
          box-shadow: inset 0 0 22px rgba(255, 255, 255, 0.03);
        }

        .vp-loader-note span {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          border-radius: 12px;
          background: rgba(76, 175, 80, 0.16);
          border: 1px solid rgba(255, 176, 0, 0.38);
        }

        .vp-loader-note p {
          margin: 0;
          font-size: clamp(14px, 1.6vw, 18px);
          font-weight: 700;
        }

        .vp-loader-note b { color: #58d86a; }

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

        @keyframes vpDogRun {
          0%   { transform: translateX(calc(-50% - 12px)) translateY(0) scale(1); }
          22%  { transform: translateX(calc(-50% - 4px)) translateY(-5px) scale(1.006); }
          50%  { transform: translateX(calc(-50% + 12px)) translateY(0) scale(1); }
          76%  { transform: translateX(calc(-50% + 3px)) translateY(-4px) scale(1.004); }
          100% { transform: translateX(calc(-50% - 12px)) translateY(0) scale(1); }
        }

        @keyframes vpSpeedLine {
          0% { transform: translateX(75px) scaleX(.55); opacity: 0; }
          35% { opacity: .75; }
          100% { transform: translateX(-115px) scaleX(1.05); opacity: 0; }
        }

        @keyframes vpGroundGlow {
          0%, 100% { opacity: .42; transform: translateX(-50%) scaleX(.92); }
          50% { opacity: .9; transform: translateX(-50%) scaleX(1.08); }
        }

        @keyframes vpProgressPulse {
          from { filter: saturate(1); }
          to { filter: saturate(1.22) brightness(1.05); }
        }

        @keyframes vpDot {
          0%, 100% { transform: translateY(0); opacity: .55; }
          50% { transform: translateY(-6px); opacity: 1; }
        }

        @keyframes vpLoaderEnter {
          from { opacity: 0; transform: translateY(10px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media (max-width: 720px) {
          .vp-loader-full { padding: 86px 14px 44px; }
          .vp-loader-content { width: 98vw; min-height: 540px; }
          .vp-runner-stage { height: 185px; }
          .vp-progress-wrap { width: 88vw; gap: 10px; }
          .vp-progress-shell { height: 30px; }
          .vp-loader-dots { gap: 12px; }
          .vp-loader-dots i { width: 11px; height: 11px; }
          .vp-loader-note { padding: 12px 18px; }
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
