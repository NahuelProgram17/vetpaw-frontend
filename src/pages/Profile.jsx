import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { getPets, getAppointments } from "../services/api";
import api from "../services/api";
import VetPawLoader from '../components/VetPawLoader';

const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif";
const G1 = "#4CAF50";
const G2 = "#66BB6A";
const O1 = "#FF9800";
const O2 = "#FFB74D";
const BLUE = "#6bcaff";
const PURPLE = "#a78bfa";
const CARD = "#16212f";
const CARD2 = "#1b2a3d";
const BORDER = "rgba(255,255,255,0.08)";
const MUTED = "rgba(255,255,255,0.45)";
const MUTED2 = "rgba(255,255,255,0.6)";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

export default function Profile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [pets, setPets] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", province: "", locality: "", bio: "", gender: "" });
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            const [res, p, a] = await Promise.all([
                api.get("/users/profile/"),
                getPets().catch(() => []),
                getAppointments().catch(() => []),
            ]);
            setProfile(res.data);
            setForm({
                first_name: res.data.first_name || "", last_name: res.data.last_name || "",
                phone: res.data.phone || "", province: res.data.province || "",
                locality: res.data.locality || "", bio: res.data.bio || "", gender: res.data.gender || "other",
            });
            setAvatarPreview(res.data.avatar || null);
            setPets(p.results ?? p);
            setAppointments(a.results ?? a);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); setEditing(true); }
    };
    const handleEdit = () => { setEditing(true); setError(""); setSuccess(""); };
    const handleCancel = () => {
        setEditing(false); setError("");
        setForm({
            first_name: profile?.first_name || "", last_name: profile?.last_name || "",
            phone: profile?.phone || "", province: profile?.province || "",
            locality: profile?.locality || "", bio: profile?.bio || "", gender: profile?.gender || "other",
        });
        setAvatarPreview(profile?.avatar || null); setAvatarFile(null);
    };
    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true); setError(""); setSuccess("");
        try {
            const formData = new FormData();
            Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v); });
            if (avatarFile) formData.append("avatar", avatarFile);
            await api.patch("/users/profile/", formData, { headers: { "Content-Type": "multipart/form-data" } });
            await fetchAll();
            setEditing(false); setAvatarFile(null);
            setSuccess("¡Perfil actualizado correctamente!");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            const data = err.response?.data;
            setError(data ? Object.values(data).flat().join(" ") : "Error al guardar.");
        } finally { setSaving(false); }
    };

    /* ----- estadísticas reales ----- */
    const stats = useMemo(() => {
        const done = appointments.filter((a) => a.status === "completed").length;
        const pending = appointments.filter((a) => ["pending", "confirmed"].includes(a.status)).length;
        const vacc = pets.reduce((acc, p) => acc + (p.vaccines?.length || 0), 0);
        return { pets: pets.length, done, pending, vacc };
    }, [pets, appointments]);

    /* ----- perfil % completo ----- */
    const completion = useMemo(() => {
        if (!profile) return { pct: 0, missing: [] };
        const checks = [
            { key: "avatar", ok: !!profile.avatar, label: "Subí tu foto de perfil", w: 15 },
            { key: "first_name", ok: !!profile.first_name, label: "Agregá tu nombre", w: 15 },
            { key: "last_name", ok: !!profile.last_name, label: "Agregá tu apellido", w: 15 },
            { key: "phone", ok: !!profile.phone, label: "Agregá tu teléfono", w: 20 },
            { key: "province", ok: !!profile.province, label: "Indicá tu provincia", w: 10 },
            { key: "locality", ok: !!profile.locality, label: "Indicá tu localidad", w: 10 },
            { key: "bio", ok: !!profile.bio, label: "Completá tu bio", w: 15 },
        ];
        const pct = checks.reduce((a, c) => a + (c.ok ? c.w : 0), 0);
        const missing = checks.filter((c) => !c.ok);
        return { pct, missing };
    }, [profile]);

    const roleLabel = profile?.role === "clinic" ? "Veterinaria" : "Dueño/a de mascota";
    const card = { background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: 18 };

    if (loading) return <VetPawLoader message="Cargando perfil..." subText="Preparando tus datos" />;

    const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.username;

    const field = (label, value, mono) => (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "11px 0", borderBottom: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: 12.5, color: MUTED }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: value ? "#fff" : MUTED, textAlign: "right", fontStyle: value ? "normal" : "italic" }}>{value || "Sin completar"}</span>
        </div>
    );

    const input = (name, label, ph, type = "text") => (
        <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, color: MUTED, marginBottom: 6, fontWeight: 700 }}>{label}</label>
            {type === "textarea"
                ? <textarea name={name} value={form[name]} onChange={handleChange} placeholder={ph} rows={3} style={inStyle} />
                : <input name={name} value={form[name]} onChange={handleChange} placeholder={ph} style={inStyle} />}
        </div>
    );

    return (
        <div style={{ minHeight: "100vh", background: "#0a121d", fontFamily: FONT, color: "#fff", padding: "26px 22px 56px" }}>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
            <style>{`
                .pf-wrap { max-width: 1400px; margin: 0 auto; }
                .pf-head { display: grid; grid-template-columns: 1fr 340px; gap: 18px; align-items: stretch; }
                .pf-headinfo { display: flex; gap: 22px; align-items: center; }
                .pf-stats { display: flex; gap: 22px; margin-top: 16px; flex-wrap: wrap; }
                .pf-body { display: grid; grid-template-columns: 1.3fr 1fr; gap: 18px; margin-top: 18px; align-items: start; }
                .pf-act { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
                @media (max-width: 940px) {
                    .pf-head { grid-template-columns: 1fr; }
                    .pf-body { grid-template-columns: 1fr; }
                }
                @media (max-width: 600px) {
                    .pf-headinfo { flex-direction: column; text-align: center; }
                    .pf-act { grid-template-columns: 1fr; }
                }
                .pf-in:focus { outline: none; border-color: ${G1}; }
            `}</style>

            <div className="pf-wrap">

                {success && <div style={{ background: "rgba(76,175,80,0.15)", border: `1px solid ${G1}`, color: G2, padding: "12px 18px", borderRadius: 12, marginBottom: 16, fontWeight: 700, fontSize: 14 }}>{success}</div>}
                {error && <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5", padding: "12px 18px", borderRadius: 12, marginBottom: 16, fontWeight: 700, fontSize: 14 }}>{error}</div>}

                {/* ===== HEADER ===== */}
                <div className="pf-head">
                    <div style={{ ...card, padding: 24 }}>
                        <div className="pf-headinfo">
                            <div style={{ position: "relative", flexShrink: 0 }}>
                                <div style={{ width: 110, height: 110, borderRadius: "50%", overflow: "hidden", background: `linear-gradient(135deg, ${PURPLE}, ${BLUE})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 46, border: `3px solid ${G1}55` }}>
                                    {avatarPreview ? <img src={avatarPreview} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🧑"}
                                </div>
                                <label style={{ position: "absolute", bottom: 2, right: 2, width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${G1}, ${O1})`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, border: "2px solid #0a121d" }}>
                                    📷<input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
                                </label>
                            </div>
                            <div style={{ flex: 1 }}>
                                <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>{fullName}</h1>
                                <p style={{ color: MUTED2, fontSize: 14, marginBottom: 12 }}>🐾 {roleLabel}</p>
                                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12.5, color: MUTED2 }}>
                                    <span>✉️ {profile?.email}</span>
                                    {profile?.phone && <span>📞 {profile.phone}</span>}
                                    {(profile?.province || profile?.locality) && <span>📍 {[profile.province, profile.locality].filter(Boolean).join(" · ")}</span>}
                                </div>
                            </div>
                        </div>
                        {/* stats */}
                        <div className="pf-stats">
                            {[
                                { label: "Miembro desde", value: fmtDate(profile?.created_at) },
                                { label: "Mascotas", value: stats.pets },
                                { label: "Turnos completados", value: stats.done },
                                { label: "Vacunas cargadas", value: stats.vacc },
                            ].map((s, i) => (
                                <div key={i} style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "12px 18px", flex: "1 1 120px", textAlign: "center" }}>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: G2 }}>{s.value}</div>
                                    <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* completitud */}
                    <div style={{ ...card, padding: 22, display: "flex", flexDirection: "column" }}>
                        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>Perfil {completion.pct}% completo</div>
                        <div style={{ height: 10, borderRadius: 99, background: CARD2, overflow: "hidden", marginBottom: 16 }}>
                            <div style={{ width: `${completion.pct}%`, height: "100%", background: `linear-gradient(90deg, ${G1}, ${O1})`, transition: "width .4s" }} />
                        </div>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
                            {completion.missing.length ? completion.missing.slice(0, 3).map((m, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: MUTED2 }}>
                                    <span style={{ width: 18, height: 18, borderRadius: "50%", border: `1.5px solid ${MUTED}`, flexShrink: 0 }} />
                                    {m.label}
                                </div>
                            )) : (
                                <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: G2 }}>✅ ¡Tu perfil está completo!</div>
                            )}
                        </div>
                        {!editing && <button onClick={handleEdit} style={{ marginTop: 16, background: `linear-gradient(135deg, ${G1}, ${O1})`, color: "#fff", fontWeight: 800, fontSize: 14, padding: "12px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: FONT }}>✏️ Editar perfil</button>}
                    </div>
                </div>

                {/* ===== CUERPO ===== */}
                {!editing ? (
                    <div className="pf-body">
                        {/* Información personal */}
                        <div style={{ ...card, padding: 22 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>👤 Información personal</h2>
                            {field("Nombre", profile?.first_name)}
                            {field("Apellido", profile?.last_name)}
                            {field("Teléfono", profile?.phone)}
                            {field("Email", profile?.email)}
                            {field("Provincia", profile?.province)}
                            {field("Localidad", profile?.locality)}
                            <div style={{ paddingTop: 11 }}>
                                <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 6 }}>Bio</div>
                                <div style={{ fontSize: 13, color: profile?.bio ? "#fff" : MUTED, fontStyle: profile?.bio ? "normal" : "italic", lineHeight: 1.6 }}>{profile?.bio || "Sin completar"}</div>
                            </div>
                        </div>

                        {/* Resumen de actividad */}
                        <div style={{ ...card, padding: 22 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>📊 Resumen de actividad</h2>
                            <div className="pf-act">
                                {[
                                    { ic: "📅", c: G1, value: stats.done, label: "Turnos realizados" },
                                    { ic: "💉", c: O1, value: stats.vacc, label: "Vacunas cargadas" },
                                    { ic: "⏳", c: BLUE, value: stats.pending, label: "Turnos pendientes" },
                                ].map((a, i) => (
                                    <div key={i} style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "18px 14px", textAlign: "center" }}>
                                        <div style={{ width: 42, height: 42, borderRadius: 12, background: `${a.c}22`, border: `1px solid ${a.c}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, margin: "0 auto 10px" }}>{a.ic}</div>
                                        <div style={{ fontSize: 22, fontWeight: 900, color: a.c }}>{a.value}</div>
                                        <div style={{ fontSize: 11.5, color: MUTED, marginTop: 3 }}>{a.label}</div>
                                    </div>
                                ))}
                            </div>
                            <a href="/history" style={{ display: "block", textAlign: "center", marginTop: 16, padding: "12px 0", borderRadius: 12, border: `1px solid ${G1}55`, color: G2, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>Ver historial completo →</a>
                        </div>
                    </div>
                ) : (
                    /* ===== MODO EDICIÓN ===== */
                    <form onSubmit={handleSubmit} style={{ ...card, padding: 24, marginTop: 18 }}>
                        <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 18 }}>✏️ Editar perfil</h2>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            {input("first_name", "Nombre", "Tu nombre")}
                            {input("last_name", "Apellido", "Tu apellido")}
                            {input("phone", "Teléfono", "Ej: 1185678259")}
                            {input("province", "Provincia", "Ej: Buenos Aires")}
                            {input("locality", "Localidad", "Ej: Moreno")}
                            <div style={{ marginBottom: 14 }}>
                                <label style={{ display: "block", fontSize: 12, color: MUTED, marginBottom: 6, fontWeight: 700 }}>Género</label>
                                <select name="gender" value={form.gender} onChange={handleChange} style={inStyle}>
                                    <option value="male">Masculino</option>
                                    <option value="female">Femenino</option>
                                    <option value="other">Prefiero no decir</option>
                                </select>
                            </div>
                        </div>
                        {input("bio", "Bio", "Contanos algo sobre vos…", "textarea")}
                        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                            <button type="submit" disabled={saving} style={{ background: `linear-gradient(135deg, ${G1}, ${O1})`, color: "#fff", fontWeight: 800, fontSize: 14, padding: "12px 28px", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: FONT, opacity: saving ? 0.6 : 1 }}>{saving ? "Guardando…" : "💾 Guardar cambios"}</button>
                            <button type="button" onClick={handleCancel} style={{ background: CARD2, color: MUTED2, fontWeight: 700, fontSize: 14, padding: "12px 24px", borderRadius: 12, border: `1px solid ${BORDER}`, cursor: "pointer", fontFamily: FONT }}>Cancelar</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

const inStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.12)",
    background: "#1b2a3d", color: "#fff", fontSize: 14, fontFamily: FONT, boxSizing: "border-box",
};
