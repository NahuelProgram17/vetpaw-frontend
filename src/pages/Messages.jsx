import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    getConversations,
    getMessages,
    sendMessage,
    markMessagesRead,
} from "../services/api";
import api from "../services/api";

const normalizeList = (data) => data?.results ?? data ?? [];

const initials = (name = "") => {
    const clean = String(name || "").trim();
    if (!clean) return "?";
    const parts = clean.split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase()).join("");
};

const formatChatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    }

    if (date.toDateString() === yesterday.toDateString()) return "Ayer";

    return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
};

const formatFullDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("es-AR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export default function Messages() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [selectedContact, setSelectedContact] = useState("");
    const [selectedAppt, setSelectedAppt] = useState("");
    const [text, setText] = useState("");
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [contactsLoading, setContactsLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [showNewConv, setShowNewConv] = useState(false);
    const [error, setError] = useState("");
    const [mobileView, setMobileView] = useState("list");
    const bottomRef = useRef(null);

    const isClinic = user?.role === "clinic";
    const isOwner = user?.role === "owner";

    useEffect(() => {
        fetchInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.role]);

    useEffect(() => {
        if (selectedConv) fetchMessagesForConversation(selectedConv);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedConv?.other_user_id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchInitialData = async () => {
        setLoading(true);
        setError("");
        try {
            await Promise.all([fetchConversations(), fetchContactsAndAppointments()]);
        } catch (err) {
            console.error(err);
            setError("No se pudieron cargar los mensajes. Probá actualizar la página.");
        } finally {
            setLoading(false);
        }
    };

    const fetchConversations = async () => {
        const data = await getConversations();
        const list = normalizeList(data);
        setConversations(list);
        return list;
    };

    const fetchContactsAndAppointments = async () => {
        setContactsLoading(true);
        try {
            const apptReq = api.get("/appointments/");

            if (isOwner) {
                const [clinicsRes, apptRes] = await Promise.all([api.get("/clinics/"), apptReq]);
                const clinics = normalizeList(clinicsRes.data);
                const appts = normalizeList(apptRes.data);

                setContacts(
                    clinics
                        .filter((clinic) => clinic.owner)
                        .map((clinic) => ({
                            id: clinic.owner,
                            name: clinic.name || clinic.owner_username || `Clínica #${clinic.id}`,
                            clinic_id: clinic.id,
                            type: "clinic",
                        }))
                );
                setAppointments(appts);
                return;
            }

            const [petsRes, apptRes] = await Promise.all([api.get("/pets/"), apptReq]);
            const pets = normalizeList(petsRes.data);
            const appts = normalizeList(apptRes.data);
            const seenOwners = new Map();

            pets.forEach((pet) => {
                if (pet.owner && !seenOwners.has(pet.owner)) {
                    seenOwners.set(pet.owner, {
                        id: pet.owner,
                        name: pet.owner_name || `Dueño #${pet.owner}`,
                        type: "owner",
                    });
                }
            });

            appts.forEach((appt) => {
                if (appt.owner && !seenOwners.has(appt.owner)) {
                    seenOwners.set(appt.owner, {
                        id: appt.owner,
                        name: appt.owner_name || `Dueño #${appt.owner}`,
                        type: "owner",
                    });
                }
            });

            setContacts([...seenOwners.values()]);
            setAppointments(appts);
        } finally {
            setContactsLoading(false);
        }
    };

    const fetchMessagesForConversation = async (conv) => {
        if (!conv?.other_user_id) return;
        setMessagesLoading(true);
        setError("");
        try {
            const data = await getMessages();
            const list = normalizeList(data);
            const otherId = Number(conv.other_user_id);
            const userId = Number(user?.id);

            const filtered = list.filter((msg) => {
                const sender = Number(msg.sender);
                const recipient = Number(msg.recipient);
                return (
                    (sender === otherId && recipient === userId) ||
                    (sender === userId && recipient === otherId)
                );
            });

            setMessages(filtered);
            await markMessagesRead(conv.other_user_id);
            setConversations((prev) =>
                prev.map((item) =>
                    Number(item.other_user_id) === otherId ? { ...item, unread: 0 } : item
                )
            );
        } catch (err) {
            console.error(err);
            setError("No se pudo abrir esta conversación.");
        } finally {
            setMessagesLoading(false);
        }
    };

    const filteredConversations = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) return conversations;
        return conversations.filter((conv) => {
            const name = String(conv.other_username || "").toLowerCase();
            const last = String(conv.last_message || "").toLowerCase();
            const pet = String(conv.pet_name || "").toLowerCase();
            return name.includes(term) || last.includes(term) || pet.includes(term);
        });
    }, [conversations, query]);

    const unreadTotal = useMemo(
        () => conversations.reduce((sum, conv) => sum + Number(conv.unread || 0), 0),
        [conversations]
    );

    const conversationAppointments = useMemo(() => {
        if (!selectedConv) return [];
        const otherId = Number(selectedConv.other_user_id);

        return appointments.filter((appt) => {
            if (appt.status === "cancelled") return false;
            if (isClinic) return Number(appt.owner) === otherId;
            const contact = contacts.find((c) => Number(c.id) === otherId);
            if (contact?.clinic_id) return Number(appt.clinic) === Number(contact.clinic_id);
            return true;
        });
    }, [appointments, contacts, isClinic, selectedConv]);

    const quickReplies = isClinic
        ? [
            { label: "✅ Confirmar", text: "Hola, confirmamos tu consulta. Te esperamos en el horario acordado." },
            { label: "📋 Traer datos", text: "Para atender mejor a tu mascota, por favor traé libreta sanitaria y estudios previos si tenés." },
            { label: "⏰ Reprogramar", text: "Hola, podemos reprogramar el turno. Decime qué día u horario te queda mejor." },
            { label: "💬 Consulta", text: "Hola, contame un poco más qué le sucede a tu mascota así podemos orientarte mejor." },
        ]
        : [
            { label: "✅ Confirmo", text: "Hola, confirmo que voy a asistir al turno. ¡Gracias!" },
            { label: "⏰ Reprogramar", text: "Hola, necesito reprogramar el turno. ¿Tienen otro horario disponible?" },
            { label: "💬 Consulta", text: "Hola, quería hacer una consulta sobre mi mascota." },
            { label: "📋 Estudios", text: "Hola, ¿necesito llevar libreta sanitaria o estudios previos?" },
        ];

    const handleSelectConv = (conv) => {
        setSelectedConv(conv);
        setSelectedAppt(conv.appointment_id || "");
        setMobileView("chat");
    };

    const handleStartConversation = () => {
        if (!selectedContact) return;
        const contact = contacts.find((item) => String(item.id) === String(selectedContact));
        if (!contact) return;

        const existing = conversations.find(
            (conv) => Number(conv.other_user_id) === Number(contact.id)
        );

        const conv = existing || {
            other_user_id: contact.id,
            other_username: contact.name,
            last_message: null,
            last_date: null,
            unread: 0,
            appointment_id: null,
            pet_name: null,
        };

        if (!existing) setConversations((prev) => [conv, ...prev]);
        setSelectedConv(conv);
        setShowNewConv(false);
        setSelectedContact("");
        setSelectedAppt("");
        setMobileView("chat");
    };

    const handleSend = async (event) => {
        event.preventDefault();
        const content = text.trim();
        if (!content || !selectedConv) return;

        setSending(true);
        setError("");
        try {
            await sendMessage({
                recipient: selectedConv.other_user_id,
                content,
                appointment: selectedAppt || null,
            });
            setText("");
            await fetchMessagesForConversation(selectedConv);
            await fetchConversations();
        } catch (err) {
            console.error(err);
            setError("No se pudo enviar el mensaje. Revisá la conexión e intentá de nuevo.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="vp-msg-page">
            <div className="vp-msg-bg-lines" />
            <div className="vp-msg-glow vp-msg-glow-green" />
            <div className="vp-msg-glow vp-msg-glow-orange" />
            <div className="vp-msg-shell">
                <header className="vp-msg-hero">
                    <div>
                        <p className="vp-msg-kicker">💬 Centro de comunicación</p>
                        <h1>Mensajes de VetPaw</h1>
                        <p>
                            {isClinic
                                ? "Comunicate con los dueños, respondé consultas y vinculá mensajes a turnos reales."
                                : "Hablá con veterinarias, seguí tus turnos y mantené toda la información ordenada."}
                        </p>
                    </div>

                    <div className="vp-msg-hero-actions">
                        {isClinic && (
                            <Link className="vp-msg-link-soft" to="/clinic/dashboard">
                                ← Volver al panel
                            </Link>
                        )}
                        <button className="vp-msg-primary" onClick={() => setShowNewConv(true)}>
                            + Nueva conversación
                        </button>
                    </div>
                </header>

                <section className="vp-msg-metrics">
                    <article className="vp-msg-metric">
                        <span>💬</span>
                        <div>
                            <strong>{conversations.length}</strong>
                            <p>Conversaciones</p>
                        </div>
                    </article>
                    <article className="vp-msg-metric unread">
                        <span>🔔</span>
                        <div>
                            <strong>{unreadTotal}</strong>
                            <p>Sin leer</p>
                        </div>
                    </article>
                    <article className="vp-msg-metric">
                        <span>{isClinic ? "👤" : "🏥"}</span>
                        <div>
                            <strong>{contacts.length}</strong>
                            <p>{isClinic ? "Dueños vinculados" : "Clínicas disponibles"}</p>
                        </div>
                    </article>
                </section>

                {error && <div className="vp-msg-error">⚠️ {error}</div>}

                <main className="vp-msg-layout">
                    <aside className={`vp-msg-sidebar ${mobileView === "chat" ? "is-hidden-mobile" : ""}`}>
                        <div className="vp-msg-sidebar-head">
                            <div>
                                <h2>Conversaciones</h2>
                                <p>{loading ? "Cargando..." : `${filteredConversations.length} resultado${filteredConversations.length !== 1 ? "s" : ""}`}</p>
                            </div>
                            <button className="vp-msg-icon-btn" onClick={fetchInitialData} aria-label="Actualizar conversaciones">
                                ↻
                            </button>
                        </div>

                        <label className="vp-msg-search">
                            <span>🔍</span>
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Buscar conversación..."
                            />
                            {query && <button onClick={() => setQuery("")} type="button">✕</button>}
                        </label>

                        <div className="vp-msg-conv-list">
                            {loading && (
                                <div className="vp-msg-empty small">
                                    <span className="vp-msg-spin">🐾</span>
                                    <p>Cargando conversaciones...</p>
                                </div>
                            )}

                            {!loading && filteredConversations.length === 0 && (
                                <div className="vp-msg-empty small">
                                    <span>💬</span>
                                    <h3>No hay conversaciones</h3>
                                    <p>Iniciá una conversación para empezar a usar la mensajería.</p>
                                    <button className="vp-msg-secondary" onClick={() => setShowNewConv(true)}>
                                        Iniciar conversación
                                    </button>
                                </div>
                            )}

                            {filteredConversations.map((conv) => (
                                <button
                                    key={conv.other_user_id}
                                    className={`vp-msg-conv ${Number(selectedConv?.other_user_id) === Number(conv.other_user_id) ? "active" : ""}`}
                                    onClick={() => handleSelectConv(conv)}
                                >
                                    <span className="vp-msg-avatar">{initials(conv.other_username)}</span>
                                    <span className="vp-msg-conv-info">
                                        <span className="vp-msg-conv-top">
                                            <strong>{conv.other_username || "Sin nombre"}</strong>
                                            <small>{formatChatDate(conv.last_date)}</small>
                                        </span>
                                        <span className="vp-msg-conv-bottom">
                                            <span>
                                                {conv.pet_name ? `🐾 ${conv.pet_name} · ` : ""}
                                                {conv.last_message || "Sin mensajes todavía"}
                                            </span>
                                            {Number(conv.unread) > 0 && <em>{conv.unread}</em>}
                                        </span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </aside>

                    <section className={`vp-msg-chat ${mobileView === "list" ? "is-hidden-mobile" : ""}`}>
                        {!selectedConv ? (
                            <div className="vp-msg-empty chat-empty">
                                <span>🐾</span>
                                <h2>Seleccioná una conversación</h2>
                                <p>Acá vas a poder ver el historial completo y responder desde VetPaw.</p>
                            </div>
                        ) : (
                            <>
                                <div className="vp-msg-chat-head">
                                    <button className="vp-msg-back" onClick={() => setMobileView("list")}>←</button>
                                    <span className="vp-msg-avatar large">{initials(selectedConv.other_username)}</span>
                                    <div className="vp-msg-chat-title">
                                        <h2>{selectedConv.other_username || "Contacto"}</h2>
                                        <p>
                                            {selectedConv.pet_name
                                                ? `🐾 ${selectedConv.pet_name}`
                                                : isClinic
                                                    ? "Dueño de mascota"
                                                    : "Veterinaria"}
                                        </p>
                                    </div>
                                    <button className="vp-msg-icon-btn desktop-only" onClick={() => fetchMessagesForConversation(selectedConv)}>
                                        ↻
                                    </button>
                                </div>

                                <div className="vp-msg-chat-body">
                                    {messagesLoading && (
                                        <div className="vp-msg-empty small">
                                            <span className="vp-msg-spin">🐾</span>
                                            <p>Cargando mensajes...</p>
                                        </div>
                                    )}

                                    {!messagesLoading && messages.length === 0 && (
                                        <div className="vp-msg-empty small">
                                            <span>✨</span>
                                            <h3>Sin mensajes todavía</h3>
                                            <p>Escribí el primer mensaje para iniciar la conversación.</p>
                                        </div>
                                    )}

                                    {!messagesLoading && messages.map((msg) => {
                                        const isMine = Number(msg.sender) === Number(user?.id);
                                        return (
                                            <div key={msg.id} className={`vp-msg-row ${isMine ? "mine" : "theirs"}`}>
                                                {msg.appointment_reason && (
                                                    <div className="vp-msg-appt-tag">
                                                        📅 {msg.appointment_reason}
                                                        {msg.pet_name ? ` · 🐾 ${msg.pet_name}` : ""}
                                                    </div>
                                                )}
                                                <div className="vp-msg-bubble">
                                                    <p>{msg.content}</p>
                                                </div>
                                                <small>{formatChatDate(msg.created_at)}</small>
                                            </div>
                                        );
                                    })}
                                    <div ref={bottomRef} />
                                </div>

                                <form className="vp-msg-compose" onSubmit={handleSend}>
                                    {conversationAppointments.length > 0 && (
                                        <select value={selectedAppt} onChange={(event) => setSelectedAppt(event.target.value)}>
                                            <option value="">Sin vincular a turno</option>
                                            {conversationAppointments.map((appt) => (
                                                <option key={appt.id} value={appt.id}>
                                                    {formatFullDate(appt.requested_date)} · {appt.pet_name ? `${appt.pet_name} · ` : ""}{appt.reason || appt.appointment_type_display || "Consulta"}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    <div className="vp-msg-quick-replies">
                                        {quickReplies.map((reply) => (
                                            <button key={reply.label} type="button" onClick={() => setText(reply.text)}>
                                                {reply.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="vp-msg-input-row">
                                        <input
                                            type="text"
                                            value={text}
                                            onChange={(event) => setText(event.target.value)}
                                            placeholder="Escribí tu mensaje..."
                                            disabled={sending}
                                        />
                                        <button type="submit" disabled={sending || !text.trim()}>
                                            {sending ? "..." : "Enviar"}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </section>
                </main>
            </div>

            {showNewConv && (
                <div className="vp-msg-modal-overlay" onClick={() => setShowNewConv(false)}>
                    <div className="vp-msg-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="vp-msg-modal-head">
                            <div>
                                <p>Nueva conversación</p>
                                <h2>{isOwner ? "Elegí una veterinaria" : "Elegí un dueño"}</h2>
                            </div>
                            <button onClick={() => setShowNewConv(false)}>✕</button>
                        </div>

                        <label className="vp-msg-field">
                            <span>{isOwner ? "Veterinaria" : "Dueño"}</span>
                            <select value={selectedContact} onChange={(event) => setSelectedContact(event.target.value)}>
                                <option value="">Seleccionar contacto</option>
                                {contacts.map((contact) => (
                                    <option key={contact.id} value={contact.id}>{contact.name}</option>
                                ))}
                            </select>
                        </label>

                        {contactsLoading && <p className="vp-msg-muted">Cargando contactos...</p>}
                        {!contactsLoading && contacts.length === 0 && (
                            <p className="vp-msg-muted">No hay contactos disponibles por ahora.</p>
                        )}

                        <div className="vp-msg-modal-actions">
                            <button className="vp-msg-cancel" onClick={() => setShowNewConv(false)}>Cancelar</button>
                            <button className="vp-msg-primary" disabled={!selectedContact} onClick={handleStartConversation}>
                                Iniciar conversación
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

                *, *::before, *::after { box-sizing: border-box; }

                .vp-msg-page {
                    min-height: 100vh;
                    background:
                        radial-gradient(circle at 12% 4%, rgba(76, 175, 80, 0.18), transparent 34%),
                        radial-gradient(circle at 88% 20%, rgba(255, 152, 0, 0.14), transparent 34%),
                        radial-gradient(circle at 48% 100%, rgba(36, 210, 255, 0.10), transparent 42%),
                        linear-gradient(135deg, #06111f 0%, #081424 46%, #040914 100%);
                    color: #fff;
                    font-family: 'Nunito', sans-serif;
                    position: relative;
                    overflow-x: hidden;
                    padding-bottom: 38px;
                }

                .vp-msg-bg-lines {
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    opacity: 0.28;
                    background-image:
                        linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
                    background-size: 46px 46px;
                    mask-image: radial-gradient(circle at center, black, transparent 78%);
                }

                .vp-msg-glow {
                    position: fixed;
                    width: 360px;
                    height: 360px;
                    border-radius: 999px;
                    filter: blur(95px);
                    opacity: 0.16;
                    pointer-events: none;
                }

                .vp-msg-glow-green { background: #4CAF50; left: -110px; top: 16%; }
                .vp-msg-glow-orange { background: #FF9800; right: -120px; bottom: 8%; }

                .vp-msg-shell {
                    width: min(1440px, calc(100% - 44px));
                    margin: 0 auto;
                    padding-top: 34px;
                    position: relative;
                    z-index: 1;
                }

                .vp-msg-hero {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 22px;
                    margin-bottom: 20px;
                    padding: 22px;
                    border: 1px solid rgba(255,255,255,0.10);
                    background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
                    border-radius: 28px;
                    box-shadow: 0 22px 80px rgba(0,0,0,0.28);
                    backdrop-filter: blur(18px);
                }

                .vp-msg-kicker {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    color: rgba(255,255,255,0.62);
                    font-size: 0.82rem;
                    font-weight: 900;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    margin: 0 0 9px;
                }

                .vp-msg-hero h1 {
                    margin: 0;
                    font-size: clamp(2rem, 4vw, 3.15rem);
                    line-height: 1.02;
                    letter-spacing: -1.5px;
                    font-weight: 900;
                }

                .vp-msg-hero p:not(.vp-msg-kicker) {
                    margin: 10px 0 0;
                    max-width: 720px;
                    color: rgba(255,255,255,0.62);
                    font-size: 1rem;
                    line-height: 1.55;
                }

                .vp-msg-hero-actions {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .vp-msg-primary,
                .vp-msg-secondary,
                .vp-msg-link-soft,
                .vp-msg-cancel,
                .vp-msg-icon-btn,
                .vp-msg-back {
                    font-family: 'Nunito', sans-serif;
                    border: 0;
                    cursor: pointer;
                    text-decoration: none;
                    transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, opacity 0.18s ease;
                }

                .vp-msg-primary {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    min-height: 42px;
                    padding: 11px 18px;
                    color: #04100a;
                    font-weight: 900;
                    border-radius: 15px;
                    background: linear-gradient(135deg, #4CAF50 0%, #85dc69 44%, #FF9800 100%);
                    box-shadow: 0 14px 35px rgba(76,175,80,0.20);
                }

                .vp-msg-primary:hover { transform: translateY(-1px); }
                .vp-msg-primary:disabled { opacity: 0.48; cursor: not-allowed; transform: none; }

                .vp-msg-secondary,
                .vp-msg-link-soft,
                .vp-msg-cancel,
                .vp-msg-icon-btn,
                .vp-msg-back {
                    background: rgba(255,255,255,0.07);
                    border: 1px solid rgba(255,255,255,0.12);
                    color: rgba(255,255,255,0.76);
                    border-radius: 14px;
                    font-weight: 900;
                }

                .vp-msg-secondary,
                .vp-msg-link-soft,
                .vp-msg-cancel { padding: 11px 16px; }
                .vp-msg-icon-btn,
                .vp-msg-back {
                    width: 40px;
                    height: 40px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                }

                .vp-msg-secondary:hover,
                .vp-msg-link-soft:hover,
                .vp-msg-cancel:hover,
                .vp-msg-icon-btn:hover,
                .vp-msg-back:hover {
                    background: rgba(255,255,255,0.11);
                    border-color: rgba(76,175,80,0.30);
                }

                .vp-msg-metrics {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 14px;
                    margin-bottom: 18px;
                }

                .vp-msg-metric {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 16px;
                    border-radius: 22px;
                    border: 1px solid rgba(255,255,255,0.10);
                    background: rgba(255,255,255,0.055);
                    backdrop-filter: blur(16px);
                }

                .vp-msg-metric span {
                    width: 42px;
                    height: 42px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 15px;
                    background: rgba(76,175,80,0.12);
                    border: 1px solid rgba(76,175,80,0.20);
                }

                .vp-msg-metric.unread span {
                    background: rgba(255,152,0,0.12);
                    border-color: rgba(255,152,0,0.24);
                }

                .vp-msg-metric strong {
                    display: block;
                    font-size: 1.55rem;
                    font-weight: 900;
                    line-height: 1;
                }

                .vp-msg-metric p {
                    margin: 4px 0 0;
                    color: rgba(255,255,255,0.55);
                    font-size: 0.83rem;
                    font-weight: 800;
                }

                .vp-msg-error {
                    margin-bottom: 16px;
                    padding: 12px 15px;
                    border-radius: 16px;
                    border: 1px solid rgba(255,107,107,0.28);
                    background: rgba(255,107,107,0.09);
                    color: #ffd2d2;
                    font-weight: 800;
                }

                .vp-msg-layout {
                    display: grid;
                    grid-template-columns: minmax(320px, 390px) minmax(0, 1fr);
                    gap: 18px;
                    min-height: 650px;
                    height: calc(100dvh - 265px);
                }

                .vp-msg-sidebar,
                .vp-msg-chat {
                    border-radius: 28px;
                    border: 1px solid rgba(255,255,255,0.10);
                    background: rgba(255,255,255,0.055);
                    box-shadow: 0 24px 90px rgba(0,0,0,0.30);
                    backdrop-filter: blur(18px);
                    overflow: hidden;
                    min-height: 0;
                }

                .vp-msg-sidebar {
                    display: flex;
                    flex-direction: column;
                }

                .vp-msg-sidebar-head {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    padding: 18px;
                    border-bottom: 1px solid rgba(255,255,255,0.08);
                }

                .vp-msg-sidebar h2,
                .vp-msg-chat-head h2 {
                    margin: 0;
                    font-size: 1.05rem;
                    font-weight: 900;
                }

                .vp-msg-sidebar p,
                .vp-msg-chat-head p {
                    margin: 4px 0 0;
                    color: rgba(255,255,255,0.48);
                    font-size: 0.8rem;
                    font-weight: 800;
                }

                .vp-msg-search {
                    margin: 14px 16px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    min-height: 44px;
                    border-radius: 16px;
                    border: 1px solid rgba(255,255,255,0.10);
                    background: rgba(0,0,0,0.18);
                    padding: 0 12px;
                }

                .vp-msg-search input {
                    flex: 1;
                    min-width: 0;
                    background: transparent;
                    border: 0;
                    outline: none;
                    color: #fff;
                    font-family: 'Nunito', sans-serif;
                    font-weight: 800;
                }

                .vp-msg-search input::placeholder { color: rgba(255,255,255,0.32); }
                .vp-msg-search button {
                    background: transparent;
                    color: rgba(255,255,255,0.45);
                    border: 0;
                    cursor: pointer;
                    font-weight: 900;
                }

                .vp-msg-conv-list {
                    flex: 1;
                    min-height: 0;
                    overflow-y: auto;
                    padding: 0 10px 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .vp-msg-conv-list::-webkit-scrollbar,
                .vp-msg-chat-body::-webkit-scrollbar,
                .vp-msg-quick-replies::-webkit-scrollbar { width: 7px; height: 4px; }

                .vp-msg-conv-list::-webkit-scrollbar-thumb,
                .vp-msg-chat-body::-webkit-scrollbar-thumb,
                .vp-msg-quick-replies::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.15);
                    border-radius: 99px;
                }

                .vp-msg-conv {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    text-align: left;
                    border: 1px solid transparent;
                    border-radius: 20px;
                    background: transparent;
                    color: inherit;
                    padding: 12px;
                    cursor: pointer;
                    font-family: 'Nunito', sans-serif;
                    transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
                }

                .vp-msg-conv:hover {
                    background: rgba(255,255,255,0.06);
                    border-color: rgba(255,255,255,0.10);
                }

                .vp-msg-conv.active {
                    background: linear-gradient(135deg, rgba(76,175,80,0.15), rgba(255,152,0,0.10));
                    border-color: rgba(76,175,80,0.28);
                }

                .vp-msg-avatar {
                    width: 44px;
                    height: 44px;
                    flex: 0 0 44px;
                    border-radius: 16px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, rgba(76,175,80,0.18), rgba(255,152,0,0.14));
                    border: 1px solid rgba(255,255,255,0.12);
                    color: #fff;
                    font-size: 0.88rem;
                    font-weight: 900;
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.12);
                }

                .vp-msg-avatar.large {
                    width: 52px;
                    height: 52px;
                    flex-basis: 52px;
                    border-radius: 18px;
                    font-size: 1rem;
                }

                .vp-msg-conv-info {
                    min-width: 0;
                    flex: 1;
                }

                .vp-msg-conv-top,
                .vp-msg-conv-bottom {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                }

                .vp-msg-conv-top strong {
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-size: 0.92rem;
                    font-weight: 900;
                }

                .vp-msg-conv-top small {
                    flex: 0 0 auto;
                    color: rgba(255,255,255,0.38);
                    font-weight: 800;
                    font-size: 0.72rem;
                }

                .vp-msg-conv-bottom {
                    margin-top: 5px;
                    color: rgba(255,255,255,0.48);
                    font-size: 0.78rem;
                    font-weight: 750;
                }

                .vp-msg-conv-bottom span {
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .vp-msg-conv-bottom em {
                    min-width: 22px;
                    height: 22px;
                    padding: 0 6px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 999px;
                    background: #FF9800;
                    color: #06111f;
                    font-size: 0.72rem;
                    font-weight: 900;
                    font-style: normal;
                }

                .vp-msg-chat {
                    display: flex;
                    flex-direction: column;
                }

                .vp-msg-chat-head {
                    min-height: 82px;
                    display: flex;
                    align-items: center;
                    gap: 13px;
                    padding: 15px 18px;
                    border-bottom: 1px solid rgba(255,255,255,0.08);
                    background: rgba(0,0,0,0.10);
                }

                .vp-msg-chat-title {
                    flex: 1;
                    min-width: 0;
                }

                .vp-msg-chat-title h2 {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .vp-msg-back { display: none; }

                .vp-msg-chat-body {
                    flex: 1;
                    min-height: 0;
                    overflow-y: auto;
                    padding: 22px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    background:
                        radial-gradient(circle at 50% 0%, rgba(76,175,80,0.08), transparent 32%),
                        rgba(0,0,0,0.06);
                }

                .vp-msg-empty {
                    min-height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    gap: 9px;
                    text-align: center;
                    color: rgba(255,255,255,0.54);
                    padding: 26px;
                }

                .vp-msg-empty.small {
                    min-height: 180px;
                    padding: 18px;
                }

                .vp-msg-empty.chat-empty { min-height: 100%; }
                .vp-msg-empty span { font-size: 2.4rem; }
                .vp-msg-empty h2,
                .vp-msg-empty h3 { margin: 0; color: rgba(255,255,255,0.86); }
                .vp-msg-empty p { margin: 0; max-width: 330px; line-height: 1.45; }
                .vp-msg-spin { display: inline-block; animation: vpMsgSpin 1.35s linear infinite; }
                @keyframes vpMsgSpin { to { transform: rotate(360deg); } }

                .vp-msg-row {
                    display: flex;
                    flex-direction: column;
                    max-width: min(76%, 680px);
                }

                .vp-msg-row.mine { align-self: flex-end; align-items: flex-end; }
                .vp-msg-row.theirs { align-self: flex-start; align-items: flex-start; }

                .vp-msg-bubble {
                    padding: 11px 14px;
                    border-radius: 18px;
                    border: 1px solid rgba(255,255,255,0.10);
                    box-shadow: 0 12px 24px rgba(0,0,0,0.18);
                }

                .vp-msg-row.mine .vp-msg-bubble {
                    background: linear-gradient(135deg, #4CAF50, #FF9800);
                    color: #06111f;
                    border-color: rgba(255,255,255,0.18);
                    border-bottom-right-radius: 6px;
                    font-weight: 850;
                }

                .vp-msg-row.theirs .vp-msg-bubble {
                    background: rgba(255,255,255,0.09);
                    color: rgba(255,255,255,0.86);
                    border-bottom-left-radius: 6px;
                }

                .vp-msg-bubble p {
                    margin: 0;
                    line-height: 1.52;
                    white-space: pre-wrap;
                    word-break: break-word;
                    font-size: 0.93rem;
                }

                .vp-msg-row small {
                    color: rgba(255,255,255,0.35);
                    font-size: 0.68rem;
                    font-weight: 800;
                    margin-top: 4px;
                }

                .vp-msg-appt-tag {
                    margin-bottom: 5px;
                    padding: 5px 9px;
                    border-radius: 999px;
                    border: 1px solid rgba(255,152,0,0.22);
                    background: rgba(255,152,0,0.10);
                    color: #ffd399;
                    font-size: 0.72rem;
                    font-weight: 900;
                }

                .vp-msg-compose {
                    border-top: 1px solid rgba(255,255,255,0.08);
                    padding: 14px;
                    background: rgba(0,0,0,0.14);
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .vp-msg-compose select,
                .vp-msg-field select {
                    width: 100%;
                    min-height: 42px;
                    border-radius: 14px;
                    border: 1px solid rgba(255,255,255,0.11);
                    background: rgba(255,255,255,0.07);
                    color: rgba(255,255,255,0.82);
                    font-family: 'Nunito', sans-serif;
                    font-weight: 800;
                    outline: none;
                    padding: 0 12px;
                }

                .vp-msg-compose select option,
                .vp-msg-field select option { background: #081424; color: #fff; }

                .vp-msg-quick-replies {
                    display: flex;
                    gap: 8px;
                    overflow-x: auto;
                    padding-bottom: 2px;
                }

                .vp-msg-quick-replies button {
                    flex: 0 0 auto;
                    min-height: 34px;
                    padding: 0 12px;
                    border-radius: 999px;
                    border: 1px solid rgba(255,255,255,0.10);
                    background: rgba(255,255,255,0.06);
                    color: rgba(255,255,255,0.68);
                    font-family: 'Nunito', sans-serif;
                    font-size: 0.78rem;
                    font-weight: 900;
                    cursor: pointer;
                }

                .vp-msg-quick-replies button:hover {
                    border-color: rgba(76,175,80,0.28);
                    background: rgba(76,175,80,0.10);
                    color: #bdf5b9;
                }

                .vp-msg-input-row {
                    display: flex;
                    gap: 10px;
                }

                .vp-msg-input-row input {
                    flex: 1;
                    min-width: 0;
                    height: 48px;
                    border-radius: 16px;
                    border: 1px solid rgba(255,255,255,0.11);
                    background: rgba(255,255,255,0.08);
                    color: #fff;
                    font-family: 'Nunito', sans-serif;
                    font-weight: 800;
                    outline: none;
                    padding: 0 15px;
                }

                .vp-msg-input-row input:focus { border-color: rgba(76,175,80,0.48); }
                .vp-msg-input-row input::placeholder { color: rgba(255,255,255,0.34); }

                .vp-msg-input-row button {
                    min-width: 96px;
                    border: 0;
                    border-radius: 16px;
                    color: #06111f;
                    background: linear-gradient(135deg, #4CAF50, #FF9800);
                    font-family: 'Nunito', sans-serif;
                    font-weight: 950;
                    cursor: pointer;
                }

                .vp-msg-input-row button:disabled {
                    opacity: 0.48;
                    cursor: not-allowed;
                }

                .vp-msg-modal-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 18px;
                    background: rgba(0,0,0,0.72);
                    backdrop-filter: blur(10px);
                }

                .vp-msg-modal {
                    width: min(460px, 100%);
                    border-radius: 26px;
                    border: 1px solid rgba(255,255,255,0.12);
                    background:
                        radial-gradient(circle at 0% 0%, rgba(76,175,80,0.12), transparent 34%),
                        #091422;
                    box-shadow: 0 28px 95px rgba(0,0,0,0.48);
                    padding: 22px;
                }

                .vp-msg-modal-head {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 14px;
                    margin-bottom: 18px;
                }

                .vp-msg-modal-head p {
                    margin: 0 0 5px;
                    color: rgba(255,255,255,0.48);
                    font-size: 0.78rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                }

                .vp-msg-modal-head h2 {
                    margin: 0;
                    font-size: 1.35rem;
                    font-weight: 950;
                }

                .vp-msg-modal-head button {
                    width: 36px;
                    height: 36px;
                    border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.12);
                    background: rgba(255,255,255,0.06);
                    color: rgba(255,255,255,0.64);
                    cursor: pointer;
                }

                .vp-msg-field {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .vp-msg-field span {
                    color: rgba(255,255,255,0.58);
                    font-size: 0.82rem;
                    font-weight: 900;
                }

                .vp-msg-muted {
                    color: rgba(255,255,255,0.48);
                    font-size: 0.84rem;
                    font-weight: 800;
                    margin: 10px 0 0;
                }

                .vp-msg-modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 18px;
                }

                @media (max-width: 980px) {
                    .vp-msg-layout { grid-template-columns: 310px 1fr; }
                    .vp-msg-shell { width: min(100% - 28px, 1440px); }
                }

                @media (max-width: 760px) {
                    .vp-msg-page { padding-bottom: 0; }
                    .vp-msg-shell {
                        width: 100%;
                        padding: 10px;
                    }

                    .vp-msg-hero {
                        border-radius: 22px;
                        padding: 16px;
                        flex-direction: column;
                    }

                    .vp-msg-hero-actions { width: 100%; justify-content: stretch; }
                    .vp-msg-hero-actions > * { flex: 1; }
                    .vp-msg-link-soft { text-align: center; }

                    .vp-msg-metrics {
                        grid-template-columns: 1fr;
                        gap: 9px;
                    }

                    .vp-msg-metric { padding: 12px; border-radius: 18px; }
                    .vp-msg-layout {
                        height: calc(100dvh - 285px);
                        min-height: 560px;
                        grid-template-columns: 1fr;
                        gap: 0;
                    }

                    .vp-msg-sidebar,
                    .vp-msg-chat { border-radius: 22px; }
                    .vp-msg-chat.is-hidden-mobile,
                    .vp-msg-sidebar.is-hidden-mobile { display: none; }
                    .vp-msg-back { display: inline-flex; }
                    .desktop-only { display: none; }
                    .vp-msg-chat-body { padding: 14px 10px; }
                    .vp-msg-row { max-width: 88%; }
                    .vp-msg-compose { padding: 10px; }
                    .vp-msg-input-row button { min-width: 74px; }
                    .vp-msg-modal-overlay { align-items: flex-end; padding: 0; }
                    .vp-msg-modal { border-radius: 24px 24px 0 0; }
                    .vp-msg-modal-actions { flex-direction: column-reverse; }
                    .vp-msg-modal-actions button { width: 100%; }
                }

                @media (max-width: 430px) {
                    .vp-msg-hero h1 { font-size: 1.75rem; }
                    .vp-msg-hero p:not(.vp-msg-kicker) { font-size: 0.9rem; }
                    .vp-msg-layout { height: calc(100dvh - 300px); }
                    .vp-msg-conv { padding: 10px; }
                    .vp-msg-input-row { gap: 7px; }
                    .vp-msg-input-row input { height: 44px; }
                    .vp-msg-input-row button { min-width: 64px; font-size: 0.82rem; }
                }
            `}</style>
        </div>
    );
}
