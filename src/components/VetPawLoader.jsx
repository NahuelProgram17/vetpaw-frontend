import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import ownerBg from "../assets/vetpaw-owner-bg.png";
import loaderVisual from "../assets/vetpaw-loader-visual.png";

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

      <div className="vp-loader-stage">
        <img
          className="vp-loader-visual"
          src={loaderVisual}
          alt={message || "Cargando VetPaw"}
          draggable="false"
        />
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
          padding: 108px 24px 64px;
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
            linear-gradient(180deg, rgba(2, 9, 20, 0.05), rgba(2, 9, 20, 0.13)),
            url(${ownerBg});
          background-size: cover;
          background-position: center;
        }

        .vp-loader-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 50% 47%, rgba(19, 78, 158, 0.16), transparent 34%),
            radial-gradient(circle at 50% 92%, rgba(28, 109, 255, 0.13), transparent 36%);
          pointer-events: none;
        }

        .vp-loader-stage {
          width: min(895px, 94vw);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: vpLoaderEnter 220ms ease-out both;
        }

        .vp-loader-visual {
          width: 100%;
          height: auto;
          display: block;
          user-select: none;
          pointer-events: none;
          filter: drop-shadow(0 26px 56px rgba(0, 0, 0, 0.18));
          animation: vpLoaderBreath 1.6s ease-in-out infinite alternate;
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

        @keyframes vpLoaderBreath {
          from { transform: translateY(0); }
          to { transform: translateY(-3px); }
        }

        @media (max-width: 640px) {
          .vp-loader-full { padding: 92px 14px 48px; }
          .vp-loader-stage { width: min(895px, 98vw); }
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
