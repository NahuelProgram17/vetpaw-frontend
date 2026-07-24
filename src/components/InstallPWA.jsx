import { useEffect, useState } from "react";
import useAccessibleDialog from "../hooks/useAccessibleDialog";

const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif";
const VETPAW_URL = "https://vetpaw.com.ar/";

function getDeviceContext() {
    const userAgent = navigator.userAgent || "";
    const ios = (
        /iphone|ipad|ipod/i.test(userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
    const safari = ios && /safari/i.test(userAgent) && !/crios|fxios|edgios|opios|duckduckgo/i.test(userAgent);
    const inAppBrowser = ios && /instagram|fban|fbav|messenger|whatsapp|line\//i.test(userAgent);

    return { ios, safari, inAppBrowser };
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
    const [copied, setCopied] = useState(false);
    const modalRef = useAccessibleDialog({ open: showModal, onClose: () => setShowModal(false) });

    useEffect(() => {
        if (isInStandaloneMode()) {
            setInstalled(true);
            return undefined;
        }

        const handleBeforeInstall = (event) => {
            event.preventDefault();
            setInstallPrompt(event);
        };
        const handleInstalled = () => {
            setInstalled(true);
            setShowModal(false);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstall);
        window.addEventListener("appinstalled", handleInstalled);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
            window.removeEventListener("appinstalled", handleInstalled);
        };
    }, []);

    useEffect(() => {
        if (!showModal) return undefined;

        const handlePointerDown = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setShowModal(false);
            }
        };
        document.addEventListener("pointerdown", handlePointerDown);
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
        };
    }, [showModal, modalRef]);

    if (installed) return null;

    const { ios, safari, inAppBrowser } = getDeviceContext();

    const handleClick = async () => {
        if (ios) {
            setShowModal(true);
            return;
        }

        if (!installPrompt) {
            setShowModal(true);
            return;
        }

        try {
            await installPrompt.prompt();
            const { outcome } = await installPrompt.userChoice;
            if (outcome === "accepted") setInstalled(true);
        } catch (error) {
            console.error("No se pudo abrir el instalador de VetPaw:", error);
            setShowModal(true);
        }
    };

    const copyVetPawLink = async () => {
        try {
            await navigator.clipboard.writeText(VETPAW_URL);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2500);
        } catch (error) {
            console.error("No se pudo copiar el enlace:", error);
            window.prompt("Copiá este enlace y abrilo en Safari:", VETPAW_URL);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={handleClick}
                aria-label={ios ? "Instalar VetPaw en iPhone" : "Instalar aplicación VetPaw"}
                style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "linear-gradient(135deg, #43A047, #FB8C00)",
                    border: "none", borderRadius: 10, padding: "8px 16px",
                    cursor: "pointer", fontFamily: FONT, fontSize: 14,
                    fontWeight: 700, color: "#fff", whiteSpace: "nowrap",
                    boxShadow: "0 2px 12px rgba(67,160,71,0.35)",
                    transition: "opacity 0.2s, transform 0.15s",
                }}
                onMouseEnter={(event) => { event.currentTarget.style.opacity = "0.85"; }}
                onMouseLeave={(event) => { event.currentTarget.style.opacity = "1"; }}
            >
                <span style={{ fontSize: 16 }}>📲</span>
                <span className="install-label">{ios ? "Instalar en iPhone" : "Instalar App"}</span>
            </button>

            {showModal && (
                <div
                    role="presentation"
                    style={{
                        position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)",
                        zIndex: 9999, display: "flex", alignItems: "flex-end",
                        justifyContent: "center", paddingTop: 24,
                    }}
                >
                    <div
                        ref={modalRef}
                        role="dialog"
                        aria-modal="true"
                        tabIndex="-1"
                        aria-labelledby="install-vetpaw-title"
                        aria-describedby="install-vetpaw-description"
                        style={{
                            background: "#162032", borderRadius: "20px 20px 0 0",
                            width: "100%", maxWidth: 520, padding: "28px 24px 36px",
                            position: "relative", maxHeight: "92dvh", overflowY: "auto",
                            boxShadow: "0 -24px 70px rgba(0,0,0,0.45)",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            aria-label="Cerrar instrucciones"
                            style={{
                                position: "absolute", top: 14, right: 16,
                                background: "rgba(255,255,255,0.08)", border: "none",
                                borderRadius: "50%", width: 32, height: 32,
                                color: "rgba(255,255,255,0.72)", fontSize: 15,
                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                        >✕</button>

                        <div style={{ fontSize: 40, textAlign: "center", marginBottom: 10 }}>🐾</div>
                        <h2 id="install-vetpaw-title" style={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, color: "#fff", textAlign: "center", margin: "0 0 6px" }}>
                            Instalá VetPaw
                        </h2>
                        <p id="install-vetpaw-description" style={{ fontFamily: FONT, fontSize: 14, color: "rgba(255,255,255,0.58)", textAlign: "center", margin: "0 0 20px", lineHeight: 1.5 }}>
                            {ios ? "En iPhone se agrega desde el menú de Safari." : "Tené VetPaw en tu pantalla de inicio y abrilo como una app."}
                        </p>

                        {ios && (!safari || inAppBrowser) && (
                            <div style={{
                                border: "1px solid rgba(255,195,106,0.38)",
                                background: "rgba(255,195,106,0.10)",
                                borderRadius: 14, padding: 14, marginBottom: 16,
                                fontFamily: FONT, color: "rgba(255,255,255,0.88)",
                                fontSize: 13, lineHeight: 1.55,
                            }}>
                                <strong style={{ color: "#ffc36a", display: "block", marginBottom: 4 }}>
                                    Abrilo primero en Safari
                                </strong>
                                Estás dentro de otro navegador o de una app como Instagram o WhatsApp. Para evitar errores, copiá el enlace y abrilo directamente en Safari.
                                <button
                                    type="button"
                                    onClick={copyVetPawLink}
                                    style={{
                                        width: "100%", marginTop: 12, border: "1px solid rgba(255,255,255,0.16)",
                                        background: "rgba(255,255,255,0.07)", color: "#fff", borderRadius: 10,
                                        padding: 11, fontFamily: FONT, fontWeight: 800, cursor: "pointer",
                                    }}
                                >
                                    {copied ? "✓ Enlace copiado" : "Copiar vetpaw.com.ar"}
                                </button>
                            </div>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                            {ios ? (
                                <>
                                    {!safari && <Step n="1" text={<>Abrí <strong style={{ color: "#fff" }}>Safari</strong> y entrá a <strong style={{ color: "#fff" }}>vetpaw.com.ar</strong>.</>} />}
                                    <Step n={safari ? "1" : "2"} text={<>Tocá <strong style={{ color: "#fff" }}>Compartir ⬆️</strong> o el botón <strong style={{ color: "#fff" }}>Más</strong> de Safari.</>} />
                                    <Step n={safari ? "2" : "3"} text={<>Deslizá hacia abajo y tocá <strong style={{ color: "#fff" }}>“Agregar a Inicio”</strong>.</>} />
                                    <Step n={safari ? "3" : "4"} text={<>Activá <strong style={{ color: "#fff" }}>“Abrir como app web”</strong> si aparece y tocá <strong style={{ color: "#fff" }}>“Agregar”</strong>.</>} />
                                </>
                            ) : (
                                <>
                                    <Step n="1" text={<>Tocá el menú <strong style={{ color: "#fff" }}>⋮</strong> del navegador.</>} />
                                    <Step n="2" text={<>Elegí <strong style={{ color: "#fff" }}>“Instalar aplicación”</strong> o <strong style={{ color: "#fff" }}>“Agregar a pantalla de inicio”</strong>.</>} />
                                    <Step n="3" text={<>Confirmá con <strong style={{ color: "#fff" }}>“Instalar”</strong>.</>} />
                                </>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            style={{
                                width: "100%", background: "linear-gradient(135deg, #43A047, #FB8C00)",
                                border: "none", borderRadius: 12, padding: 14,
                                fontFamily: FONT, fontSize: 15, fontWeight: 700,
                                color: "#fff", cursor: "pointer",
                            }}
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @media (max-width: 390px) {
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
