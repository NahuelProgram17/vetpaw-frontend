import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getConversations, getMessages, sendMessage, markMessagesRead } from "../services/api";
import api from "../services/api";

export default function Messages() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [showNewConv, setShowNewConv] = useState(false);
    const [selectedContact, setSelectedContact] = useState("");
    const [selectedAppt, setSelectedAppt] = useState("");
    const [appointments, setAppointments] = useState([]);
    const bottomRef = useRef(null);

    useEffect(() => {
        fetchConversations();
        fetchContacts();
    }, []);

    useEffect(() => {
        if (selectedConv) fetchMessages(selectedConv);
    }, [selectedConv]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const data = await getConversations();
            setConversations(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchContacts = async () => {
        try {
            if (user?.role === 'owner') {
                const data = await api.get('/clinics/');
                const clinics = data.data.results ?? data.data;
                setContacts(clinics.map(c => ({
                    id: c.owner,
                    name: c.name,
                    clinic_id: c.id,
                })));
                const apptData = await api.get('/appointments/');
                setAppointments(apptData.data.results ?? apptData.data);
            } else {
                const petData = await api.get('/pets/');
                const pets = petData.data.results ?? petData.data;
                const seen = {};
                pets.forEach(p => {
                    if (p.owner && !seen[p.owner]) {
                        seen[p.owner] = { id: p.owner, name: p.owner_name || `Dueño #${p.owner}` };
                    }
                });
                setContacts(Object.values(seen));
                const apptData = await api.get('/appointments/');
                setAppointments(apptData.data.results ?? apptData.data);
            }
        } catch (e) { console.error(e); }
    };

    const fetchMessages = async (conv) => {
        try {
            const data = await getMessages();
            const msgs = data.results ?? data;
            const filtered = msgs.filter(m =>
                (m.sender === conv.other_user_id || m.recipient === conv.other_user_id)
            );
            setMessages(filtered);
            await markMessagesRead(conv.other_user_id);
            setConversations(prev => prev.map(c =>
                c.other_user_id === conv.other_user_id ? { ...c, unread: 0 } : c
            ));
        } catch (e) { console.error(e); }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim() || !selectedConv) return;
        setSending(true);
        try {
            await sendMessage({
                recipient: selectedConv.other_user_id,
                content: text.trim(),
                appointment: selectedAppt || null,
            });
            setText("");
            await fetchMessages(selectedConv);
            await fetchConversations();
        } catch (e) { console.error(e); }
        finally { setSending(false); }
    };

    const handleStartConv = async () => {
        if (!selectedContact) return;
        const contact = contacts.find(c => String(c.id) === String(selectedContact));
        if (!contact) return;
        const conv = {
            other_user_id: contact.id,
            other_username: contact.name,
            unread: 0,
            last_message: null,
            pet_name: null,
        };
        setSelectedConv(conv);
        setShowNewConv(false);
        setSelectedContact("");
        const exists = conversations.find(c => c.other_user_id === contact.id);
        if (!exists) setConversations(prev => [conv, ...prev]);
    };

    const formatTime = (d) => {
        if (!d) return "";
        const date = new Date(d);
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
        }
        return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
    };

    const QUICK_REPLIES_OWNER = [
        { label: "💰 ¿Cuánto sale la consulta?", text: "Hola, quisiera saber cuánto sale la consulta." },
        { label: "🐕 ¿Puedo ir con síntomas?", text: "Hola, mi mascota tiene síntomas. ¿Puedo llevarla sin turno previo?" },
        { label: "⏰ ¿Turno más temprano?", text: "Hola, ¿tienen disponibilidad en un horario más temprano?" },
        { label: "✅ Confirmo que voy", text: "Confirmo que voy a estar presente en el turno. ¡Gracias!" },
        { label: "❌ No puedo ir", text: "Hola, lamentablemente no voy a poder ir al turno. ¿Podemos reprogramar?" },
    ];

    const QUICK_REPLIES_CLINIC = [
        { label: "💰 Informar precio", text: "Hola, el valor de la consulta es $" },
        { label: "✅ Puede venir", text: "Sí, puede traer a su mascota sin problema." },
        { label: "📋 Necesitamos datos", text: "Para poder atenderlo necesitamos que complete los datos de su mascota en la app." },
        { label: "⚠️ Requiere turno", text: "Para esa consulta es necesario un turno previo. Por favor agendalo desde la app." },
        { label: "📞 Llamanos", text: `Para más información podés llamarnos al ${user?.phone || 'nuestro teléfono'}.` },
    ];

    const quickReplies = user?.role === 'owner' ? QUICK_REPLIES_OWNER : QUICK_REPLIES_CLINIC;

    return (
        <div className="messages-page">
            <div className="blob b1" /><div className="blob b2" />
            <div className="messages-inner">

                <header className="messages-header">
                    <h1 className="messages-title">💬 Mensajes</h1>
                    <button className="btn-new-conv" onClick={() => setShowNewConv(true)}>
                        + Nueva conversación
                    </button>
                </header>

                <div className="messages-layout">

                    {/* ── Conversaciones ── */}
                    <div className="conv-list">
                        {loading && (
                            <div className="conv-empty">
                                <span className="paw-spin">🐾</span>
                            </div>
                        )}
                        {!loading && conversations.length === 0 && (
                            <div className="conv-empty">
                                <span>💬</span>
                                <p>No tenés conversaciones todavía.</p>
                                <button className="btn-sm-msg" onClick={() => setShowNewConv(true)}>
                                    Iniciar una →
                                </button>
                            </div>
                        )}
                        {conversations.map((conv) => (
                            <div
                                key={conv.other_user_id}
                                className={`conv-item ${selectedConv?.other_user_id === conv.other_user_id ? "active" : ""}`}
                                onClick={() => setSelectedConv(conv)}
                            >
                                <div className="conv-avatar">
                                    {conv.other_username?.[0]?.toUpperCase() || "?"}
                                </div>
                                <div className="conv-info">
                                    <div className="conv-top">
                                        <span className="conv-name">{conv.other_username}</span>
                                        <span className="conv-time">{formatTime(conv.last_date)}</span>
                                    </div>
                                    <div className="conv-bottom">
                                        <span className="conv-last">
                                            {conv.pet_name && `🐾 ${conv.pet_name} · `}
                                            {conv.last_message || "Sin mensajes"}
                                        </span>
                                        {conv.unread > 0 && (
                                            <span className="conv-unread">{conv.unread}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Chat ── */}
                    <div className="chat-area">
                        {!selectedConv ? (
                            <div className="chat-empty">
                                <span>💬</span>
                                <p>Seleccioná una conversación o iniciá una nueva.</p>
                            </div>
                        ) : (
                            <>
                                <div className="chat-header">
                                    <div className="chat-avatar">
                                        {selectedConv.other_username?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="chat-name">{selectedConv.other_username}</p>
                                        {selectedConv.pet_name && (
                                            <p className="chat-sub">🐾 {selectedConv.pet_name}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="chat-messages">
                                    {messages.length === 0 && (
                                        <div className="chat-empty-msgs">
                                            <p>No hay mensajes todavía. ¡Escribí el primero!</p>
                                        </div>
                                    )}
                                    {messages.map((msg) => {
                                        const isMine = msg.sender === user?.id;
                                        return (
                                            <div key={msg.id} className={`msg-row ${isMine ? "mine" : "theirs"}`}>
                                                {msg.appointment_reason && (
                                                    <div className="msg-appt-tag">
                                                        📅 {msg.appointment_reason}
                                                        {msg.pet_name && ` · 🐾 ${msg.pet_name}`}
                                                    </div>
                                                )}
                                                <div className={`msg-bubble ${isMine ? "mine" : "theirs"}`}>
                                                    {msg.content}
                                                </div>
                                                <span className="msg-time">{formatTime(msg.created_at)}</span>
                                            </div>
                                        );
                                    })}
                                    <div ref={bottomRef} />
                                </div>

                                <form className="chat-input-area" onSubmit={handleSend}>
                                    {appointments.length > 0 && (
                                        <select
                                            className="appt-select"
                                            value={selectedAppt}
                                            onChange={e => setSelectedAppt(e.target.value)}
                                        >
                                            <option value="">Sin vincular a turno</option>
                                            {appointments
                                                .filter(a => a.status !== 'cancelled')
                                                .map(a => (
                                                    <option key={a.id} value={a.id}>
                                                        📅 {a.reason || 'Consulta'} — {new Date(a.requested_date).toLocaleDateString('es-AR')}
                                                    </option>
                                                ))
                                            }
                                        </select>
                                    )}

                                    {/* ── Respuestas rápidas ── */}
                                    <div className="quick-replies">
                                        {quickReplies.map((qr, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                className="quick-reply-btn"
                                                onClick={() => setText(qr.text)}
                                            >
                                                {qr.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* ── Input de texto ── */}
                                    <div className="input-row">
                                        <input
                                            type="text"
                                            placeholder="Escribí tu mensaje..."
                                            value={text}
                                            onChange={e => setText(e.target.value)}
                                            className="chat-input"
                                            disabled={sending}
                                        />
                                        <button
                                            type="submit"
                                            className="btn-send"
                                            disabled={sending || !text.trim()}
                                        >
                                            {sending ? "..." : "↑"}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Modal nueva conversación ── */}
            {showNewConv && (
                <div className="modal-overlay" onClick={() => setShowNewConv(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>💬 Nueva conversación</h2>
                            <button className="modal-close" onClick={() => setShowNewConv(false)}>✕</button>
                        </div>
                        <div className="form-group">
                            <label>
                                {user?.role === 'owner' ? 'Seleccioná una clínica' : 'Seleccioná un dueño'}
                            </label>
                            <select
                                value={selectedContact}
                                onChange={e => setSelectedContact(e.target.value)}
                            >
                                <option value="">— Elegí un contacto —</option>
                                {contacts.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-actions">
                            <button className="btn-ghost" onClick={() => setShowNewConv(false)}>Cancelar</button>
                            <button
                                className="btn-primary-msg"
                                onClick={handleStartConv}
                                disabled={!selectedContact}
                            >
                                Iniciar conversación →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Fraunces:ital,opsz,wght@1,9..144,700&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                .messages-page { min-height: 100vh; background: #1a1a2e; font-family: 'Nunito', sans-serif; position: relative; overflow-x: hidden; }
                .blob { position: fixed; border-radius: 50%; filter: blur(90px); opacity: 0.08; pointer-events: none; }
                .b1 { width: 500px; height: 500px; background: #6bcaff; top: -100px; left: -100px; }
                .b2 { width: 400px; height: 400px; background: #ff6b6b; bottom: -100px; right: -100px; }
                .messages-inner { max-width: 1100px; margin: 0 auto; padding: 32px 24px; position: relative; z-index: 1; display: flex; flex-direction: column; gap: 20px; height: calc(100vh - 56px); }
                .messages-header { display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
                .messages-title { font-family: 'Fraunces', serif; font-size: 2rem; font-weight: 700; font-style: italic; color: #fff; letter-spacing: -1px; }
                .btn-new-conv { background: linear-gradient(135deg, #6bcaff, #3aaee0); color: #1a1a2e; border: none; border-radius: 10px; padding: 10px 20px; font-family: 'Nunito', sans-serif; font-size: 0.88rem; font-weight: 900; cursor: pointer; }
                .messages-layout { display: grid; grid-template-columns: 300px 1fr; gap: 16px; flex: 1; min-height: 0; }
                .conv-list { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow-y: auto; display: flex; flex-direction: column; }
                .conv-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 40px 20px; text-align: center; flex: 1; }
                .conv-empty span { font-size: 2.5rem; }
                .conv-empty p { color: rgba(255,255,255,0.35); font-size: 0.86rem; }
                .btn-sm-msg { background: rgba(107,202,255,0.12); border: 1px solid rgba(107,202,255,0.3); color: #6bcaff; border-radius: 8px; padding: 7px 14px; font-family: 'Nunito', sans-serif; font-size: 0.82rem; font-weight: 700; cursor: pointer; }
                .conv-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.15s; }
                .conv-item:hover { background: rgba(255,255,255,0.04); }
                .conv-item.active { background: rgba(107,202,255,0.08); border-left: 3px solid #6bcaff; }
                .conv-avatar { width: 40px; height: 40px; border-radius: 50%; background: rgba(107,202,255,0.15); color: #6bcaff; font-size: 1rem; font-weight: 900; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .conv-info { flex: 1; min-width: 0; }
                .conv-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; }
                .conv-name { font-size: 0.88rem; font-weight: 800; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .conv-time { font-size: 0.7rem; color: rgba(255,255,255,0.35); flex-shrink: 0; }
                .conv-bottom { display: flex; justify-content: space-between; align-items: center; }
                .conv-last { font-size: 0.75rem; color: rgba(255,255,255,0.4); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
                .conv-unread { background: #ff6b6b; color: #fff; font-size: 0.65rem; font-weight: 900; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .paw-spin { font-size: 2rem; animation: spin 1s linear infinite; display: block; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .chat-area { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; display: flex; flex-direction: column; min-height: 0; }
                .chat-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; flex: 1; }
                .chat-empty span { font-size: 3rem; }
                .chat-empty p { color: rgba(255,255,255,0.35); font-size: 0.9rem; }
                .chat-header { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
                .chat-avatar { width: 38px; height: 38px; border-radius: 50%; background: rgba(107,202,255,0.15); color: #6bcaff; font-size: 1rem; font-weight: 900; display: flex; align-items: center; justify-content: center; }
                .chat-name { font-size: 0.95rem; font-weight: 900; color: #fff; }
                .chat-sub { font-size: 0.75rem; color: rgba(255,255,255,0.4); margin-top: 2px; }
                .chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 10px; min-height: 0; }
                .chat-empty-msgs { text-align: center; padding: 40px 0; color: rgba(255,255,255,0.3); font-size: 0.85rem; }
                .msg-row { display: flex; flex-direction: column; }
                .msg-row.mine { align-items: flex-end; }
                .msg-row.theirs { align-items: flex-start; }
                .msg-appt-tag { font-size: 0.7rem; color: rgba(255,217,61,0.7); background: rgba(255,217,61,0.08); border: 1px solid rgba(255,217,61,0.15); border-radius: 6px; padding: 2px 8px; margin-bottom: 4px; }
                .msg-bubble { max-width: 72%; padding: 10px 14px; border-radius: 14px; font-size: 0.88rem; line-height: 1.5; word-break: break-word; }
                .msg-bubble.mine { background: linear-gradient(135deg, #6bcaff, #3aaee0); color: #1a1a2e; border-bottom-right-radius: 4px; }
                .msg-bubble.theirs { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.85); border-bottom-left-radius: 4px; }
                .msg-time { font-size: 0.65rem; color: rgba(255,255,255,0.3); margin-top: 3px; }
                .chat-input-area { padding: 14px 16px; border-top: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; display: flex; flex-direction: column; gap: 8px; }
                .appt-select { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.10); border-radius: 8px; color: rgba(255,255,255,0.6); padding: 6px 10px; font-family: 'Nunito', sans-serif; font-size: 0.78rem; outline: none; width: 100%; }
                .appt-select option { background: #1a1a2e; }
                .quick-replies { display: flex; gap: 6px; flex-wrap: wrap; padding-bottom: 4px; }
                .quick-reply-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.10); color: rgba(255,255,255,0.55); border-radius: 20px; padding: 5px 12px; font-family: 'Nunito', sans-serif; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
                .quick-reply-btn:hover { background: rgba(107,202,255,0.12); border-color: rgba(107,202,255,0.3); color: #6bcaff; }
                .input-row { display: flex; gap: 8px; }
                .chat-input { flex: 1; background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.10); border-radius: 10px; color: #fff; padding: 10px 14px; font-family: 'Nunito', sans-serif; font-size: 0.9rem; outline: none; transition: border-color 0.2s; }
                .chat-input:focus { border-color: #6bcaff; }
                .chat-input::placeholder { color: rgba(255,255,255,0.25); }
                .btn-send { background: linear-gradient(135deg, #6bcaff, #3aaee0); color: #1a1a2e; border: none; border-radius: 10px; width: 42px; height: 42px; font-size: 1.2rem; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: opacity 0.2s; }
                .btn-send:disabled { opacity: 0.5; cursor: not-allowed; }
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(6px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .modal { background: #1e1e35; border: 1px solid rgba(255,255,255,0.10); border-radius: 20px; padding: 28px; width: 100%; max-width: 420px; display: flex; flex-direction: column; gap: 16px; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; }
                .modal-header h2 { font-family: 'Fraunces', serif; font-size: 1.3rem; font-style: italic; color: #fff; }
                .modal-close { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); border-radius: 8px; padding: 6px 10px; cursor: pointer; }
                .form-group { display: flex; flex-direction: column; gap: 6px; }
                .form-group label { font-size: 0.78rem; font-weight: 700; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.06em; }
                .form-group select { background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.10); border-radius: 10px; color: #fff; padding: 11px 14px; font-family: 'Nunito', sans-serif; font-size: 0.92rem; outline: none; }
                .form-group select option { background: #1a1a2e; }
                .form-actions { display: flex; gap: 10px; justify-content: flex-end; }
                .btn-ghost { background: transparent; border: 1.5px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.5); border-radius: 10px; padding: 10px 18px; font-family: 'Nunito', sans-serif; font-weight: 700; cursor: pointer; }
                .btn-primary-msg { background: linear-gradient(135deg, #6bcaff, #3aaee0); color: #1a1a2e; border: none; border-radius: 10px; padding: 10px 20px; font-family: 'Nunito', sans-serif; font-size: 0.9rem; font-weight: 900; cursor: pointer; }
                .btn-primary-msg:disabled { opacity: 0.5; cursor: not-allowed; }
                @media (max-width: 700px) {
                    .messages-layout { grid-template-columns: 1fr; }
                    .conv-list { max-height: 250px; }
                }
            `}</style>
        </div>
    );
}