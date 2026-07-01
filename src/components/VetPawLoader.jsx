import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import ownerBg from "../assets/vetpaw-owner-bg.png";

export function VetPawLoader({
  message = "Cargando VetPaw...",
  subText = "Preparando la siguiente página",
  fullScreen = true,
  overlay = false,
}) {
  return (
    <div className={`vp-loader ${fullScreen ? "vp-loader-full" : "vp-loader-inline"} ${overlay ? "vp-loader-overlay" : ""}`}>
      <div className="vp-loader-bg" />
      <div className="vp-loader-card" aria-live="polite" aria-busy="true">
        <div className="vp-loader-dog-wrap">
          <span className="vp-loader-trail vp-loader-trail-1" />
          <span className="vp-loader-trail vp-loader-trail-2" />
          <span className="vp-loader-trail vp-loader-trail-3" />

          <svg className="vp-loader-dog" viewBox="0 0 260 150" role="img" aria-label="Perro corriendo">
            <defs>
              <linearGradient id="vpDogLine" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4CAF50" />
                <stop offset="48%" stopColor="#7ED957" />
                <stop offset="100%" stopColor="#FF9800" />
              </linearGradient>
              <filter id="vpDogGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g fill="none" stroke="url(#vpDogLine)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" filter="url(#vpDogGlow)">
              <path className="vp-dog-line vp-dog-body" d="M64 78 C82 42 137 38 166 65 C181 80 178 102 150 111 C119 122 73 111 64 78Z" />
              <path className="vp-dog-line vp-dog-head" d="M158 62 C174 37 210 42 220 66 C230 90 205 100 184 91" />
              <path className="vp-dog-line" d="M188 47 C176 31 162 37 165 55" />
              <path className="vp-dog-line" d="M219 68 L236 72 L219 79" />
              <path className="vp-dog-line" d="M62 78 C37 64 27 42 20 31" />
              <path className="vp-dog-leg-a" d="M91 110 C84 126 72 132 60 134" />
              <path className="vp-dog-leg-b" d="M126 112 C140 126 153 132 169 134" />
              <path className="vp-dog-leg-c" d="M103 109 C100 127 105 134 113 142" />
              <path className="vp-dog-leg-d" d="M146 108 C137 124 127 131 116 135" />
            </g>
            <circle cx="202" cy="64" r="4" fill="#FFB74D" />
          </svg>
        </div>

        <h2>{message}</h2>
        <p>{subText}</p>

        <div className="vp-loader-bar" aria-hidden="true">
          <span />
        </div>

        <div className="vp-loader-dots" aria-hidden="true">
          <i /> <i /> <i /> <i /> <i />
        </div>
      </div>

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
          padding: 120px 24px 80px;
        }
        .vp-loader-inline {
          min-height: 320px;
          width: 100%;
          padding: 44px 24px;
          border-radius: 24px;
          background: rgba(7, 20, 36, 0.72);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .vp-loader-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: #06101d;
          backdrop-filter: blur(8px);
        }
        .vp-loader-bg {
          position: absolute;
          inset: 0;
          z-index: -2;
          background:
            linear-gradient(180deg, rgba(4,11,22,.74), rgba(4,11,22,.9)),
            url(${ownerBg});
          background-size: cover;
          background-position: center;
          transform: scale(1.02);
        }
        .vp-loader-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 50% 42%, rgba(76,175,80,.16), transparent 26%),
            radial-gradient(circle at 58% 55%, rgba(255,152,0,.14), transparent 28%),
            radial-gradient(circle at 50% 92%, rgba(42,125,255,.22), transparent 32%);
          z-index: -1;
        }
        .vp-loader-card {
          width: min(720px, 94vw);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 14px;
          animation: vpLoaderIn .24s ease-out both;
        }
        .vp-loader-dog-wrap {
          width: min(360px, 78vw);
          height: 190px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: -6px;
        }
        .vp-loader-dog {
          width: 100%;
          max-width: 340px;
          animation: vpDogRun 1.1s ease-in-out infinite;
          transform-origin: center bottom;
        }
        .vp-dog-line {
          stroke-dasharray: 520;
          stroke-dashoffset: 520;
          animation: vpDogDraw 1.25s ease-in-out infinite alternate;
        }
        .vp-dog-leg-a, .vp-dog-leg-b, .vp-dog-leg-c, .vp-dog-leg-d {
          animation: vpDogLegs .58s ease-in-out infinite alternate;
          transform-origin: center top;
        }
        .vp-dog-leg-b, .vp-dog-leg-d { animation-delay: .28s; }
        .vp-loader-trail {
          position: absolute;
          left: 18px;
          height: 3px;
          border-radius: 999px;
          background: linear-gradient(90deg, transparent, rgba(76,175,80,.85), rgba(255,152,0,.75), transparent);
          filter: drop-shadow(0 0 10px rgba(76,175,80,.5));
          animation: vpTrail 1.1s ease-in-out infinite;
        }
        .vp-loader-trail-1 { width: 210px; top: 82px; animation-delay: 0s; }
        .vp-loader-trail-2 { width: 160px; top: 108px; animation-delay: .16s; opacity: .65; }
        .vp-loader-trail-3 { width: 120px; top: 132px; animation-delay: .32s; opacity: .45; }
        .vp-loader-card h2 {
          margin: 0;
          font-size: clamp(2rem, 5vw, 3.2rem);
          font-weight: 900;
          letter-spacing: -0.05em;
          line-height: 1;
          color: #fff;
        }
        .vp-loader-card h2::first-letter { color: inherit; }
        .vp-loader-card h2 strong,
        .vp-loader-card h2 .brand {
          background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 36%, #FFB300 70%, #FF9800 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .vp-loader-card p {
          margin: 0;
          color: rgba(255,255,255,.68);
          font-size: clamp(1rem, 2vw, 1.25rem);
          font-weight: 650;
        }
        .vp-loader-bar {
          width: min(460px, 76vw);
          height: 18px;
          border-radius: 999px;
          padding: 3px;
          margin-top: 14px;
          background: rgba(255,255,255,.07);
          border: 1px solid rgba(255,255,255,.12);
          box-shadow: inset 0 0 18px rgba(0,0,0,.25);
          overflow: hidden;
        }
        .vp-loader-bar span {
          display: block;
          height: 100%;
          width: 42%;
          border-radius: inherit;
          background: linear-gradient(90deg, #4CAF50, #8BC34A, #FFB300, #FF9800);
          box-shadow: 0 0 18px rgba(255,152,0,.42);
          animation: vpBar 1.25s ease-in-out infinite;
        }
        .vp-loader-dots {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }
        .vp-loader-dots i {
          width: 11px;
          height: 11px;
          border-radius: 999px;
          background: rgba(255,255,255,.18);
          animation: vpDot 1s ease-in-out infinite;
        }
        .vp-loader-dots i:nth-child(1) { background: #4CAF50; animation-delay: 0s; }
        .vp-loader-dots i:nth-child(2) { background: #8BC34A; animation-delay: .12s; }
        .vp-loader-dots i:nth-child(3) { background: #FFB300; animation-delay: .24s; }
        .vp-loader-dots i:nth-child(4) { animation-delay: .36s; }
        .vp-loader-dots i:nth-child(5) { animation-delay: .48s; }
        @keyframes vpLoaderIn {
          from { opacity: 0; transform: translateY(8px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes vpDogRun {
          0%, 100% { transform: translateX(-10px) translateY(0) rotate(-1deg); }
          50% { transform: translateX(12px) translateY(-8px) rotate(1deg); }
        }
        @keyframes vpDogDraw {
          from { stroke-dashoffset: 170; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes vpDogLegs {
          from { transform: rotate(-8deg); }
          to { transform: rotate(10deg); }
        }
        @keyframes vpTrail {
          0% { transform: translateX(28px) scaleX(.35); opacity: 0; }
          35% { opacity: .88; }
          100% { transform: translateX(-34px) scaleX(1); opacity: 0; }
        }
        @keyframes vpBar {
          0% { transform: translateX(-105%); width: 34%; }
          50% { width: 58%; }
          100% { transform: translateX(245%); width: 34%; }
        }
        @keyframes vpDot {
          0%, 100% { transform: translateY(0); opacity: .45; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
        @media (max-width: 640px) {
          .vp-loader-full { padding: 92px 18px 60px; }
          .vp-loader-dog-wrap { height: 150px; }
          .vp-loader-card { gap: 12px; }
        }
      `}</style>
    </div>
  );
}

export function RouteChangeLoader({ duration = 620 }) {
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
