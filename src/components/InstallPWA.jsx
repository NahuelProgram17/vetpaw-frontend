import { useState, useEffect } from "react";

// ─── InstallPWA ────────────────────────────────────────────────────────────────
// Muestra un botón "📲 Instalar App" en el navbar.
// - Android/Chrome: dispara el banner nativo de instalación
// - iOS/Safari: abre un modal con instrucciones paso a paso
// - Desktop Chrome/Edge: dispara instalación nativa
// ──────────────────────────────────────────────────────────────────────────────

function isIOS() {
    return (
        /iphone|ipad|ipod/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
}

function isInStandaloneMode() {
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true
    );
}

export default function InstallPWA() {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [showButton, setShowButton] = useState(false);
    const [showIOSModal, setShowIOSModal] = useState(false);

    useEffect(() => {
        // Si ya está instalada, no mostrar
        if (isInStandaloneMode()) return;

        if (isIOS()) {
            // iOS siempre muestra el botón (instrucciones manuales)
            setShowButton(true);
        } else {
            // Android / Desktop Chrome / Edge
            const handler = (e) => {
                e.preventDefault();
                setInstallPrompt(e);
                setShowButton(true);
            };
            window.addEventListener("beforeinstallprompt", handler);
            return () => window.removeEventListener("beforeinstallprompt", handler);
        }
    }, []);

    const handleInstall = async () => {
        if (isIOS()) {
            setShowIOSModal(true);
            return;
        }
        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === "accepted") {
            setShowButton(false);
            setInstallPrompt(null);
        }
    };

    if (!showButton) return null;

    return (
        <>
            {/* ── Botón del navbar ── */}
            <button className="vetpaw-install-btn" onClick={handleInstall}>
                <span className="vetpaw-install-icon">📲</span>
                <span className="vetpaw-install-label">Instalar App</span>
            </button>

            {/* ── Modal iOS ── */}
            {showIOSModal && (
                <div className="vetpaw-ios-overlay" onClick={() => setShowIOSModal(false)}>
                    <div
                        className="vetpaw-ios-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="vetpaw-ios-close"
                            onClick={() => setShowIOSModal(false)}
                            aria-label="Cerrar"
                        >
                            ✕
                        </button>

                        <div className="vetpaw-ios-logo">🐾</div>
                        <h2 className="vetpaw-ios-title">Instalá VetPaw</h2>
                        <p className="vetpaw-ios-subtitle">
                            Seguí estos pasos para agregar la app a tu pantalla de inicio:
                        </p>

                        <div className="vetpaw-ios-steps">
                            <div className="vetpaw-ios-step">
                                <div className="vetpaw-ios-step-num">1</div>
                                <div className="vetpaw-ios-step-text">
                                    Tocá el botón{" "}
                                    <strong>Compartir</strong>{" "}
                                    <span className="vetpaw-ios-share-icon">⬆️</span>{" "}
                                    en la barra del navegador
                                </div>
                            </div>

                            <div className="vetpaw-ios-step">
                                <div className="vetpaw-ios-step-num">2</div>
                                <div className="vetpaw-ios-step-text">
                                    Deslizá hacia abajo y tocá{" "}
                                    <strong>"Agregar a pantalla de inicio"</strong>
                                </div>
                            </div>

                            <div className="vetpaw-ios-step">
                                <div className="vetpaw-ios-step-num">3</div>
                                <div className="vetpaw-ios-step-text">
                                    Tocá <strong>"Agregar"</strong> en la esquina superior derecha
                                </div>
                            </div>
                        </div>

                        <button
                            className="vetpaw-ios-btn-close"
                            onClick={() => setShowIOSModal(false)}
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}

            {/* ── Estilos ── */}
            <style>{`
        /* ── Botón navbar ── */
        .vetpaw-install-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            background: linear-gradient(135deg, #4CAF50, #FF9800);
            border: none;
            border-radius: 8px;
            padding: 7px 14px;
            cursor: pointer;
            font-family: 'Plus Jakarta Sans', 'Nunito', sans-serif;
            font-size: 14px;
            font-weight: 600;
            color: #fff;
            white-space: nowrap;
            transition: opacity 0.2s, transform 0.15s;
        }
        .vetpaw-install-btn:hover {
            opacity: 0.9;
            transform: scale(1.03);
        }
        .vetpaw-install-btn:active {
            transform: scale(0.97);
        }
        .vetpaw-install-icon {
            font-size: 16px;
            line-height: 1;
        }

        /* En mobile pequeño solo mostrar el icono */
        @media (max-width: 380px) {
            .vetpaw-install-label { display: none; }
            .vetpaw-install-btn { padding: 8px 10px; }
        }

        /* ── Overlay modal iOS ── */
        .vetpaw-ios-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.65);
            z-index: 9999;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding: 0 0 env(safe-area-inset-bottom, 0);
            animation: vetpaw-fade-in 0.2s ease;
        }
        @keyframes vetpaw-fade-in {
            from { opacity: 0; }
            to   { opacity: 1; }
        }

        /* ── Modal ── */
        .vetpaw-ios-modal {
            background: #162032;
            border-radius: 20px 20px 0 0;
            width: 100%;
            max-width: 480px;
            padding: 28px 24px 32px;
            position: relative;
            animation: vetpaw-slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @media (min-width: 500px) {
            .vetpaw-ios-overlay { align-items: center; padding: 24px; }
            .vetpaw-ios-modal {
            border-radius: 20px;
            max-width: 400px;
            }
        }
        @keyframes vetpaw-slide-up {
            from { transform: translateY(40px); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
        }

        .vetpaw-ios-close {
            position: absolute;
            top: 14px;
            right: 16px;
            background: rgba(255,255,255,0.08);
            border: none;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            color: rgba(255,255,255,0.6);
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .vetpaw-ios-logo {
            font-size: 42px;
            text-align: center;
            margin-bottom: 10px;
        }

        .vetpaw-ios-title {
            font-family: 'Plus Jakarta Sans', 'Nunito', sans-serif;
            font-size: 20px;
            font-weight: 700;
            color: #fff;
            text-align: center;
            margin: 0 0 6px;
        }

        .vetpaw-ios-subtitle {
            font-family: 'Nunito', sans-serif;
            font-size: 14px;
            color: rgba(255,255,255,0.55);
            text-align: center;
            margin: 0 0 24px;
            line-height: 1.5;
        }

        /* ── Pasos ── */
        .vetpaw-ios-steps {
            display: flex;
            flex-direction: column;
            gap: 14px;
            margin-bottom: 28px;
        }

        .vetpaw-ios-step {
            display: flex;
            align-items: flex-start;
            gap: 14px;
            background: rgba(255,255,255,0.05);
            border-radius: 12px;
            padding: 12px 14px;
        }

        .vetpaw-ios-step-num {
            min-width: 28px;
            height: 28px;
            border-radius: 50%;
            background: linear-gradient(135deg, #4CAF50, #FF9800);
            color: #fff;
            font-weight: 700;
            font-size: 13px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .vetpaw-ios-step-text {
            font-family: 'Nunito', sans-serif;
            font-size: 14px;
            color: rgba(255,255,255,0.8);
            line-height: 1.5;
            padding-top: 3px;
        }

        .vetpaw-ios-step-text strong {
            color: #fff;
        }

        .vetpaw-ios-share-icon {
            font-size: 14px;
        }

        /* ── Botón cerrar ── */
        .vetpaw-ios-btn-close {
            width: 100%;
            background: linear-gradient(135deg, #4CAF50, #FF9800);
            border: none;
            border-radius: 12px;
            padding: 14px;
            font-family: 'Plus Jakarta Sans', 'Nunito', sans-serif;
            font-size: 15px;
            font-weight: 700;
            color: #fff;
            cursor: pointer;
            transition: opacity 0.2s, transform 0.15s;
        }
        .vetpaw-ios-btn-close:hover  { opacity: 0.9; }
        .vetpaw-ios-btn-close:active { transform: scale(0.98); }
    `}</style>
        </>
    );
}
