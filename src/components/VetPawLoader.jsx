import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import ownerBg from "../assets/vetpaw-owner-bg.png";

function LoaderTitle({ message }) {
  const text = message || "Cargando VetPaw...";
  if (text.includes("VetPaw")) {
    const [before, after = "..."] = text.split("VetPaw");
    return (
      <h2 className="vp-loader-title">
        {before}<span>VetPaw</span>{after}
      </h2>
    );
  }
  return <h2 className="vp-loader-title">{text}</h2>;
}

export function VetPawLoader({
  message = "Cargando VetPaw...",
  subText = "Preparando la siguiente página",
  fullScreen = true,
  overlay = false,
}) {
  return (
    <div className={`vp-loader ${fullScreen ? "vp-loader-full" : "vp-loader-inline"} ${overlay ? "vp-loader-overlay" : ""}`}>
      <div className="vp-loader-bg" />

      <div className="vp-loader-content" aria-live="polite" aria-busy="true">
        <div className="vp-loader-dog-scene" aria-hidden="true">
          <span className="vp-speed-line vp-speed-line-1" />
          <span className="vp-speed-line vp-speed-line-2" />
          <span className="vp-speed-line vp-speed-line-3" />
          <span className="vp-ground-glow" />

          <svg className="vp-loader-dog" viewBox="0 0 420 230" role="img" aria-label="Perro corriendo">
            <defs>
              <linearGradient id="vpDogStroke" x1="20" y1="190" x2="380" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1db7ff" />
                <stop offset="34%" stopColor="#55d65f" />
                <stop offset="68%" stopColor="#ffe24a" />
                <stop offset="100%" stopColor="#ff9f0a" />
              </linearGradient>
              <filter id="vpDogSoftGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="1.4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g className="vp-dog-stroke" fill="none" stroke="url(#vpDogStroke)" strokeWidth="4.8" strokeLinecap="round" strokeLinejoin="round" filter="url(#vpDogSoftGlow)">
              <path d="M108 131 C126 80 208 74 256 111 C283 132 275 166 226 176 C174 188 120 173 108 131Z" />
              <path d="M249 106 C268 70 320 76 337 111 C350 140 318 154 286 142" />
              <path d="M286 82 C269 57 249 68 255 98" />
              <path d="M337 112 L366 121 L337 131" />
              <path className="vp-tail" d="M111 129 C74 106 57 76 44 51" />
              <path className="vp-leg vp-leg-a" d="M143 175 C130 202 112 210 91 213" />
              <path className="vp-leg vp-leg-b" d="M195 177 C220 201 244 210 273 211" />
              <path className="vp-leg vp-leg-c" d="M162 175 C156 202 164 213 179 222" />
              <path className="vp-leg vp-leg-d" d="M229 174 C213 199 193 209 173 214" />
            </g>
            <circle cx="313" cy="105" r="4.5" fill="#ffd25c" />
          </svg>
        </div>

        <LoaderTitle message={message} />
        <p className="vp-loader-subtitle">{subText}</p>

        <div className="vp-loader-progress-row" aria-hidden="true">
          <div className="vp-loader-bar"><span /></div>
          <strong>78%</strong>
        </div>

        <div className="vp-loader-dots" aria-hidden="true">
          <i /> <i /> <i /> <i /> <i /> <i /> <i /> <i />
        </div>

        <div className="vp-loader-note" aria-hidden="true">
          <span>🛡️</span>
          <p>Tu información <strong>pet-friendly</strong> está en camino</p>
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
          padding: 110px 24px 72px;
        }
        .vp-loader-inline {
          min-height: 420px;
          width: 100%;
          padding: 56px 24px;
          border-radius: 28px;
          background: rgba(6, 16, 31, 0.82);
          border: 1px solid rgba(255,255,255,0.08);
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
            linear-gradient(180deg, rgba(2, 9, 20, .28), rgba(2, 9, 20, .68)),
            url(${ownerBg});
          background-size: cover;
          background-position: center;
        }
        .vp-loader-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 50% 44%, rgba(69, 202, 98, .13), transparent 25%),
            radial-gradient(circle at 56% 50%, rgba(255, 176, 24, .10), transparent 30%),
            radial-gradient(circle at 50% 98%, rgba(22, 102, 255, .22), transparent 36%);
          pointer-events: none;
        }
        .vp-loader-content {
          width: min(760px, 94vw);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          animation: vpLoaderIn .24s ease-out both;
        }
        .vp-loader-dog-scene {
          width: min(520px, 88vw);
          height: clamp(190px, 30vw, 260px);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }
        .vp-loader-dog {
          width: min(500px, 88vw);
          height: auto;
          overflow: visible;
          animation: vpDogFloat 1.05s ease-in-out infinite;
          transform-origin: 55% 82%;
        }
        .vp-dog-stroke {
          opacity: .98;
        }
        .vp-leg-a, .vp-leg-c { animation: vpFrontLeg .46s ease-in-out infinite alternate; transform-origin: 46% 76%; }
        .vp-leg-b, .vp-leg-d { animation: vpBackLeg .46s ease-in-out infinite alternate; transform-origin: 54% 76%; }
        .vp-tail { animation: vpTail .7s ease-in-out infinite alternate; transform-origin: 27% 56%; }
        .vp-speed-line {
          position: absolute;
          left: 3%;
          border-radius: 999px;
          background: linear-gradient(90deg, transparent, rgba(31,183,255,.85), rgba(93,216,88,.9), rgba(255,178,26,.78), transparent);
          filter: blur(.15px) drop-shadow(0 0 12px rgba(77, 206, 91, .42));
          opacity: .72;
          transform-origin: right center;
          animation: vpSpeedLine 1.05s ease-in-out infinite;
        }
        .vp-speed-line-1 { width: 255px; height: 2px; top: 47%; animation-delay: 0s; }
        .vp-speed-line-2 { width: 210px; height: 2px; top: 58%; animation-delay: .14s; opacity: .55; }
        .vp-speed-line-3 { width: 160px; height: 2px; top: 68%; animation-delay: .28s; opacity: .38; }
        .vp-ground-glow {
          position: absolute;
          left: 29%;
          right: 21%;
          bottom: 22%;
          height: 2px;
          border-radius: 999px;
          background: linear-gradient(90deg, transparent, rgba(80,214,90,.78), rgba(255,176,24,.75), transparent);
          box-shadow: 0 0 20px rgba(95, 220, 91, .24), 0 0 28px rgba(255, 170, 20, .14);
          opacity: .75;
        }
        .vp-loader-title {
          margin: 0;
          font-size: clamp(2.3rem, 5vw, 4rem);
          font-weight: 900;
          letter-spacing: -0.055em;
          line-height: 1.02;
          color: rgba(255,255,255,.96);
          text-shadow: 0 8px 38px rgba(0,0,0,.28);
        }
        .vp-loader-title span {
          background: linear-gradient(135deg, #5bd45c 0%, #9ad94a 38%, #f7c319 68%, #ff9f0a 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .vp-loader-subtitle {
          margin: 18px 0 0;
          color: rgba(255,255,255,.70);
          font-size: clamp(1.05rem, 2vw, 1.35rem);
          font-weight: 650;
          letter-spacing: -0.02em;
        }
        .vp-loader-progress-row {
          width: min(520px, 82vw);
          margin-top: 30px;
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 14px;
        }
        .vp-loader-progress-row strong {
          font-size: 1.05rem;
          font-weight: 900;
          color: #ffffff;
        }
        .vp-loader-bar {
          height: 22px;
          border-radius: 999px;
          padding: 3px;
          background: rgba(255,255,255,.055);
          border: 1px solid rgba(255,255,255,.12);
          box-shadow: inset 0 0 18px rgba(0,0,0,.28), 0 0 18px rgba(28, 151, 255, .08);
          overflow: hidden;
        }
        .vp-loader-bar span {
          display: block;
          height: 100%;
          width: 78%;
          border-radius: inherit;
          background: linear-gradient(90deg, #55ce5b 0%, #99d848 42%, #ffc12a 72%, #ff9f0a 100%);
          box-shadow: 0 0 18px rgba(255,169,18,.38), 0 0 16px rgba(76, 211, 95, .22);
          animation: vpBarPulse 1.2s ease-in-out infinite alternate;
        }
        .vp-loader-dots {
          display: flex;
          gap: 15px;
          margin-top: 22px;
        }
        .vp-loader-dots i {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: rgba(255,255,255,.18);
          animation: vpDot 1.15s ease-in-out infinite;
        }
        .vp-loader-dots i:nth-child(1) { background: #5bd45c; animation-delay: 0s; }
        .vp-loader-dots i:nth-child(2) { background: #c7d63b; animation-delay: .1s; }
        .vp-loader-dots i:nth-child(3) { background: #ffae1a; animation-delay: .2s; }
        .vp-loader-dots i:nth-child(4) { animation-delay: .3s; }
        .vp-loader-dots i:nth-child(5) { animation-delay: .4s; }
        .vp-loader-dots i:nth-child(6) { animation-delay: .5s; }
        .vp-loader-dots i:nth-child(7) { animation-delay: .6s; }
        .vp-loader-dots i:nth-child(8) { animation-delay: .7s; }
        .vp-loader-note {
          margin-top: 34px;
          min-height: 54px;
          padding: 10px 28px;
          display: inline-flex;
          align-items: center;
          gap: 14px;
          border-radius: 999px;
          background: rgba(7, 18, 36, .58);
          border: 1px solid rgba(255,255,255,.10);
          box-shadow: inset 0 0 24px rgba(255,255,255,.03);
        }
        .vp-loader-note span { font-size: 1.4rem; }
        .vp-loader-note p {
          margin: 0;
          color: rgba(255,255,255,.66);
          font-size: 1rem;
          font-weight: 650;
        }
        .vp-loader-note strong { color: #55d65f; }
        @keyframes vpLoaderIn {
          from { opacity: 0; transform: translateY(8px) scale(.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes vpDogFloat {
          0%, 100% { transform: translateX(-5px) translateY(0) rotate(-.7deg); }
          50% { transform: translateX(7px) translateY(-7px) rotate(.6deg); }
        }
        @keyframes vpFrontLeg {
          from { transform: rotate(-7deg) translateY(1px); }
          to { transform: rotate(8deg) translateY(-1px); }
        }
        @keyframes vpBackLeg {
          from { transform: rotate(8deg) translateY(-1px); }
          to { transform: rotate(-7deg) translateY(1px); }
        }
        @keyframes vpTail {
          from { transform: rotate(-4deg); }
          to { transform: rotate(7deg); }
        }
        @keyframes vpSpeedLine {
          0% { transform: translateX(44px) scaleX(.45); opacity: 0; }
          35% { opacity: .75; }
          100% { transform: translateX(-48px) scaleX(1); opacity: 0; }
        }
        @keyframes vpBarPulse {
          from { filter: saturate(1) brightness(.96); }
          to { filter: saturate(1.1) brightness(1.08); }
        }
        @keyframes vpDot {
          0%, 100% { transform: translateY(0); opacity: .42; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
        @media (max-width: 640px) {
          .vp-loader-full { padding: 92px 18px 56px; }
          .vp-loader-dog-scene { height: 170px; }
          .vp-loader-note { padding: 10px 18px; border-radius: 22px; }
          .vp-loader-note p { font-size: .92rem; }
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
