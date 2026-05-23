import { useState, useEffect, useRef } from "react";

const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif";

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
    const [showModal, setShowModal] = useState(false);
    const [installed, setInstalled] = useState(false);
    const modalRef = useRef(null);

    useEffect(() => {
        if (isInStandaloneMode()) {
            setInstalled(true);
            return;
        }
        const handler = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener("beforeinstallprompt", handler);
        window.addEventListener("appinstalled", () => setInstalled(true));
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                setShowModal(false);
            }
        };
        if (showModal) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showModal]);

    if (installed) return null;

    const handleClick = async () => {
        if (isIOS()) {
            setShowModal(true);
        } else if (installPrompt) {
            installPrompt.prompt();
            const { outcome } = await installPrompt.userChoice;
            if (outcome === "accepted") setInstalled(true);
        } else {
            setShowModal(true);
        }
    };

    const ios = isIOS();

    return (
        <>
            {/* Botón navbar */}
            <button
                onClick={handleClick}
                style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "linear-gradient(135deg, #43A047, #FB8C00)",
                    border: "none", borderRadius: 10, padding: "8px 16px",
                    cursor: "pointer", fontFamily: FONT, fontSize: 14,
                    fontWeight: 700, color: "#fff", whiteSpace: "nowrap",
                    boxShadow: "0 2px 12px rgba(67,160,71,0.35)",
                    transition: "opacity 0.2s, transform 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
                <span style={{ fontSize: 16 }}>📲</span>
                <span className="install-label">Instalar App</span>
            </button>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
                    zIndex: 9999, display: "flex", alignItems: "flex-end",
                    justifyContent: "center",
                }}>
                    <div ref={modalRef} style={{
                        background: "#162032", borderRadius: "20px 20px 0 0",
                        width: "100%", maxWidth: 480, padding: "28px 24px 36px",
                        position: "relative",
                    }}>
                        <button onClick={() => setShowModal(false)} style={{
                            position: "absolute", top: 14, right: 16,
                            background: "rgba(255,255,255,0.08)", border: "none",
                            borderRadius: "50%", width: 30, height: 30,
                            color: "rgba(255,255,255,0.6)", fontSize: 14,
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        }}>✕</button>

                        <div style={{ fontSize: 40, textAlign: "center", marginBottom: 10 }}>🐾</div>
                        <h2 style={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, color: "#fff", textAlign: "center", margin: "0 0 6px" }}>
                            Instalá VetPaw
                        </h2>
                        <p style={{ fontFamily: FONT, fontSize: 14, color: "rgba(255,255,255,0.5)", textAlign: "center", margin: "0 0 24px", lineHeight: 1.5 }}>
                            {ios ? "Seguí estos pasos en Safari:" : "Seguí estos pasos en Chrome:"}
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                            {ios ? (
                                <>
                                    <Step n="1" text={<>Tocá el botón <strong style={{ color: "#fff" }}>Compartir ⬆️</strong> en la barra del navegador</>} />
                                    <Step n="2" text={<>Deslizá y tocá <strong style={{ color: "#fff" }}>"Agregar a pantalla de inicio"</strong></>} />
                                    <Step n="3" text={<>Tocá <strong style={{ color: "#fff" }}>"Agregar"</strong> arriba a la derecha</>} />
                                </>
                            ) : (
                                <>
                                    <Step n="1" text={<>Tocá el menú <strong style={{ color: "#fff" }}>⋮</strong> arriba a la derecha en Chrome</>} />
                                    <Step n="2" text={<>Buscá y tocá <strong style={{ color: "#fff" }}>"Instalar aplicación"</strong> o <strong style={{ color: "#fff" }}>"Agregar a pantalla de inicio"</strong></>} />
                                    <Step n="3" text={<>Tocá <strong style={{ color: "#fff" }}>"Instalar"</strong> para confirmar</>} />
                                </>
                            )}
                        </div>

                        <button onClick={() => setShowModal(false)} style={{
                            width: "100%", background: "linear-gradient(135deg, #43A047, #FB8C00)",
                            border: "none", borderRadius: 12, padding: 14,
                            fontFamily: FONT, fontSize: 15, fontWeight: 700,
                            color: "#fff", cursor: "pointer",
                        }}>
                            Entendido
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @media (max-width: 380px) {
                    .install-label { display: none; }
                }
            `}</style>
        </>
    );
}

function Step({ n, text }) {
    return (
        <div style={{
            display: "flex", alignItems: "flex-start", gap: 14,
            background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "12px 14px",
        }}>
            <div style={{
                minWidth: 28, height: 28, borderRadius: "50%",
                background: "linear-gradient(135deg, #43A047, #FB8C00)",
                color: "#fff", fontWeight: 700, fontSize: 13,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>{n}</div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.5, paddingTop: 3 }}>
                {text}
            </div>
        </div>
    );
}
