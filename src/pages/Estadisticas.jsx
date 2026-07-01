import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const GREEN = "#4CAF50";
const ORANGE = "#FF9800";
const BLUE = "#39a7ff";
const RED = "#ff4d5f";
const VIOLET = "#a855f7";

const WEEK_DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const HOURS = ["8h", "9h", "10h", "11h", "12h", "13h", "14h", "15h", "16h", "17h", "18h"];

const normalizeList = (payload) => payload?.results ?? payload ?? [];
const toDate = (value) => (value ? new Date(value) : null);
const safeNumber = (value) => (Number.isFinite(value) ? value : 0);

function StarsBackground() {
    return (
        <svg className="stats-stars" aria-hidden="true" viewBox="0 0 1600 900" preserveAspectRatio="none">
            <defs>
                <linearGradient id="statsLine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#39a7ff" stopOpacity="0" />
                    <stop offset="0.55" stopColor="#39a7ff" stopOpacity="0.55" />
                    <stop offset="1" stopColor="#39a7ff" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="statsLineGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#4CAF50" stopOpacity="0" />
                    <stop offset="0.55" stopColor="#4CAF50" stopOpacity="0.65" />
                    <stop offset="1" stopColor="#4CAF50" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="statsLineOrange" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#FF9800" stopOpacity="0" />
                    <stop offset="0.55" stopColor="#FF9800" stopOpacity="0.7" />
                    <stop offset="1" stopColor="#FF9800" stopOpacity="0" />
                </linearGradient>
            </defs>
            <g opacity="0.75">
                <line x1="80" x2="80" y1="190" y2="820" stroke="url(#statsLineOrange)" strokeWidth="1" />
                <line x1="760" x2="760" y1="40" y2="310" stroke="url(#statsLine)" strokeWidth="1" />
                <line x1="1290" x2="1290" y1="140" y2="720" stroke="url(#statsLineGreen)" strokeWidth="1" />
                <line x1="1530" x2="1530" y1="80" y2="570" stroke="url(#statsLineOrange)" strokeWidth="1" />
            </g>
            <g className="stats-twinkle">
                <circle cx="110" cy="730" r="2" fill="#4CAF50" />
                <circle cx="250" cy="810" r="1.5" fill="#FF9800" />
                <circle cx="520" cy="145" r="1.8" fill="#FF9800" />
                <circle cx="1160" cy="130" r="1.6" fill="#4CAF50" />
                <circle cx="1380" cy="250" r="1.4" fill="#39a7ff" />
                <circle cx="1480" cy="760" r="1.7" fill="#FF9800" />
                <circle cx="1085" cy="815" r="1.2" fill="#39a7ff" />
                <circle cx="980" cy="210" r="1.5" fill="#FF9800" />
                <path d="M1320 210h12M1326 204v12" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M1360 760h12M1366 754v12" stroke="#FF9800" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M1120 420h12M1126 414v12" stroke="#39a7ff" strokeWidth="1.5" strokeLinecap="round" />
            </g>
        </svg>
    );
}

function MiniChartIllustration() {
    return (
        <svg className="stats-hero-illustration" aria-hidden="true" viewBox="0 0 360 180">
            <g opacity="0.9" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M25 140V75" stroke="#4CAF50" strokeWidth="4" />
                <path d="M55 140V40" stroke="#39a7ff" strokeWidth="4" />
                <path d="M85 140V95" stroke="#4CAF50" strokeWidth="4" />
                <path d="M115 140V58" stroke="#39a7ff" strokeWidth="4" />
                <path d="M145 140V82" stroke="#39a7ff" strokeWidth="4" />
                <path d="M175 140V42" stroke="#39a7ff" strokeWidth="4" />
                <path d="M210 125c22-44 45-40 70-64 18-18 36-24 52-18" stroke="#4CAF50" strokeWidth="3" />
                <circle cx="210" cy="125" r="4" fill="#4CAF50" stroke="none" />
                <circle cx="250" cy="86" r="4" fill="#39a7ff" stroke="none" />
                <circle cx="302" cy="45" r="4" fill="#4CAF50" stroke="none" />
                <path d="M265 144a48 48 0 1 0 48-48v48z" stroke="#39a7ff" strokeWidth="3" opacity="0.55" />
                <path d="M313 96a48 48 0 0 1 44 30" stroke="#a855f7" strokeWidth="3" opacity="0.5" />
            </g>
        </svg>
    );
}

function MetricCard({ icon, label, value, sub, tone = "green" }) {
    return (
        <article className={`metric-card metric-${tone}`}>
            <div className="metric-icon">{icon}</div>
            <div className="metric-copy">
                <p>{label}</p>
                <strong>{value}</strong>
                {sub && <span>{sub}</span>}
            </div>
        </article>
    );
}

function EmptyChart({ children = "Sin datos todavía" }) {
    return <div className="empty-chart">{children}</div>;
}

export default function Estadisticas() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [visits, setVisits] = useState([]);
    const [vaccines, setVaccines] = useState([]);
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const turnosRef = useRef(null);
    const especiesRef = useRef(null);
    const diasRef = useRef(null);
    const horasRef = useRef(null);
    const charts = useRef({});

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            setError("");
            try {
                const [appts, vis, vacs, petsData] = await Promise.all([
                    api.get("/appointments/"),
                    api.get("/visits/"),
                    api.get("/vaccines/"),
                    api.get("/pets/"),
                ]);
                setAppointments(normalizeList(appts.data));
                setVisits(normalizeList(vis.data));
                setVaccines(normalizeList(vacs.data));
                setPets(normalizeList(petsData.data));
            } catch (e) {
                console.error(e);
                setError("No se pudieron cargar las estadísticas. Intentá nuevamente en unos minutos.");
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const stats = useMemo(() => {
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const turnosMes = appointments.filter((a) => {
            const d = toDate(a.requested_date);
            return d && d >= firstOfMonth && d < firstOfNextMonth;
        });
        const turnosLastMes = appointments.filter((a) => {
            const d = toDate(a.requested_date);
            return d && d >= firstOfLastMonth && d < firstOfMonth;
        });

        const completedMes = turnosMes.filter((a) => a.status === "completed").length;
        const noShowMes = turnosMes.filter((a) => a.status === "no_show").length;
        const totalMes = turnosMes.length;
        const totalLastMes = turnosLastMes.length;
        const pctCambio = totalLastMes > 0 ? Math.round(((totalMes - totalLastMes) / totalLastMes) * 100) : 0;
        const tasaAusentismo = totalMes > 0 ? ((noShowMes / totalMes) * 100).toFixed(1) : "0.0";

        const petIds = new Set(
            visits
                .filter((v) => {
                    const d = toDate(v.date);
                    return d && d >= firstOfMonth && d < firstOfNextMonth;
                })
                .map((v) => v.pet)
        );
        const pacientesNuevos = petIds.size;

        const en7dias = new Date(now);
        en7dias.setDate(en7dias.getDate() + 7);
        const vacunasProximas = vaccines.filter((v) => {
            const d = toDate(v.next_dose);
            return d && d >= now && d <= en7dias;
        });
        const controlesVencidos = visits.filter((v) => {
            const d = toDate(v.next_visit);
            return d && d < now;
        });

        const semanas = Array.from({ length: 8 }, (_, i) => {
            const d = new Date(now);
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - 7 * (7 - i));
            return d;
        });
        const turnosPorSemana = semanas.map((inicio, i) => {
            const fin = semanas[i + 1] ?? now;
            return appointments.filter((a) => {
                const d = toDate(a.requested_date);
                return d && d >= inicio && d < fin;
            }).length;
        });

        const porDia = Array(7).fill(0);
        appointments.forEach((a) => {
            const d = toDate(a.requested_date);
            if (d) porDia[d.getDay()] += 1;
        });

        const porHora = Array(11).fill(0);
        appointments.forEach((a) => {
            const d = toDate(a.requested_date);
            if (!d) return;
            const h = d.getHours();
            if (h >= 8 && h <= 18) porHora[h - 8] += 1;
        });

        const especieCount = {};
        pets.forEach((p) => {
            const label = p.species_display || p.species || "Sin especie";
            especieCount[label] = (especieCount[label] || 0) + 1;
        });
        const especieLabels = Object.keys(especieCount);
        const especieData = Object.values(especieCount);
        const especieColors = [GREEN, ORANGE, BLUE, VIOLET, "#f43f5e", "#fbbf24"];

        const visitasPorPet = {};
        visits.forEach((v) => {
            if (v.pet) visitasPorPet[v.pet] = (visitasPorPet[v.pet] || 0) + 1;
        });
        const topPets = Object.entries(visitasPorPet)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id, count]) => ({ pet: pets.find((p) => String(p.id) === String(id)), count }))
            .filter((x) => x.pet);

        const hasAppointments = appointments.length > 0;
        const maxDiaValue = Math.max(...porDia);
        const maxHoraValue = Math.max(...porHora);
        const maxDia = maxDiaValue > 0 ? porDia.indexOf(maxDiaValue) : -1;
        const maxHoraIndex = maxHoraValue > 0 ? porHora.indexOf(maxHoraValue) : -1;
        const maxHora = maxHoraIndex >= 0 ? maxHoraIndex + 8 : null;

        return {
            now,
            firstOfMonth,
            totalMes,
            totalLastMes,
            pctCambio,
            completedMes,
            noShowMes,
            tasaAusentismo,
            pacientesNuevos,
            vacunasProximas,
            controlesVencidos,
            turnosPorSemana,
            porDia,
            porHora,
            especieLabels,
            especieData,
            especieColors,
            topPets,
            hasAppointments,
            maxDia,
            maxHora,
        };
    }, [appointments, pets, vaccines, visits]);

    const renderCharts = () => {
        const C = window.Chart;
        if (!C) return;

        Object.values(charts.current).forEach((chart) => chart?.destroy());
        charts.current = {};

        const gridColor = "rgba(255,255,255,0.07)";
        const tickColor = "rgba(255,255,255,0.48)";
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: true } },
            animation: { duration: 650 },
        };

        if (turnosRef.current) {
            charts.current.turnos = new C(turnosRef.current, {
                type: "line",
                data: {
                    labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6", "Sem 7", "Sem 8"],
                    datasets: [
                        {
                            data: stats.turnosPorSemana,
                            borderColor: GREEN,
                            backgroundColor: "rgba(76,175,80,0.12)",
                            borderWidth: 3,
                            pointBackgroundColor: GREEN,
                            pointBorderColor: "#0b1424",
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            fill: true,
                            tension: 0.42,
                        },
                    ],
                },
                options: {
                    ...commonOptions,
                    scales: {
                        x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 11 } } },
                        y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 11 } }, beginAtZero: true },
                    },
                },
            });
        }

        if (especiesRef.current && stats.especieLabels.length > 0) {
            charts.current.especies = new C(especiesRef.current, {
                type: "doughnut",
                data: {
                    labels: stats.especieLabels,
                    datasets: [
                        {
                            data: stats.especieData,
                            backgroundColor: stats.especieColors.slice(0, stats.especieLabels.length),
                            borderWidth: 0,
                        },
                    ],
                },
                options: { ...commonOptions, cutout: "68%" },
            });
        }

        if (diasRef.current) {
            charts.current.dias = new C(diasRef.current, {
                type: "bar",
                data: {
                    labels: WEEK_DAYS,
                    datasets: [
                        {
                            data: stats.porDia,
                            backgroundColor: stats.porDia.map((_, i) => (i === stats.maxDia ? GREEN : "rgba(76,175,80,0.28)")),
                            borderRadius: 8,
                            borderSkipped: false,
                        },
                    ],
                },
                options: {
                    ...commonOptions,
                    scales: {
                        x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 11 } } },
                        y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 11 } }, beginAtZero: true },
                    },
                },
            });
        }

        if (horasRef.current) {
            charts.current.horas = new C(horasRef.current, {
                type: "bar",
                data: {
                    labels: HOURS,
                    datasets: [
                        {
                            data: stats.porHora,
                            backgroundColor: stats.porHora.map((_, i) => (stats.maxHora === i + 8 ? ORANGE : "rgba(255,152,0,0.28)")),
                            borderRadius: 8,
                            borderSkipped: false,
                        },
                    ],
                },
                options: {
                    ...commonOptions,
                    scales: {
                        x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 11 } } },
                        y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 11 } }, beginAtZero: true },
                    },
                },
            });
        }
    };

    useEffect(() => {
        if (loading) return undefined;

        const loadCharts = () => {
            if (!window.Chart) {
                const existing = document.querySelector("script[data-vetpaw-chartjs]");
                if (existing) {
                    existing.addEventListener("load", renderCharts, { once: true });
                    return;
                }
                const script = document.createElement("script");
                script.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
                script.async = true;
                script.dataset.vetpawChartjs = "true";
                script.onload = renderCharts;
                document.head.appendChild(script);
            } else {
                renderCharts();
            }
        };

        loadCharts();
        return () => Object.values(charts.current).forEach((chart) => chart?.destroy());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, stats.turnosPorSemana, stats.porDia, stats.porHora, stats.especieLabels.length, stats.especieData.length]);

    const getLogoBase64 = async () => {
        try {
            const res = await fetch("/logo_vetpaw.png");
            const blob = await res.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
        } catch {
            return null;
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const { default: jsPDF } = await import("https://esm.sh/jspdf@2.5.1");
            const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            const fecha = stats.now.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
            const logo = await getLogoBase64();

            doc.setFillColor(8, 14, 26);
            doc.rect(0, 0, 210, 297, "F");
            doc.setFillColor(13, 27, 48);
            doc.roundedRect(12, 12, 186, 45, 5, 5, "F");

            if (logo) doc.addImage(logo, "PNG", 160, 18, 26, 20);

            doc.setTextColor(76, 175, 80);
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("VetPaw — Estadísticas", 22, 28);
            doc.setTextColor(205, 213, 224);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Clínica: ${user?.username || "—"}`, 22, 38);
            doc.text(`Período: ${fecha}`, 22, 45);

            const metrics = [
                ["Turnos este mes", stats.totalMes],
                ["Realizados", stats.completedMes],
                ["Ausentismo", `${stats.tasaAusentismo}%`],
                ["Pacientes nuevos", stats.pacientesNuevos],
                ["Vacunas próximas a vencer", stats.vacunasProximas.length],
                ["Controles vencidos", stats.controlesVencidos.length],
            ];

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Resumen del mes", 22, 72);

            metrics.forEach(([label, value], i) => {
                const y = 84 + i * 10;
                doc.setTextColor(150, 160, 175);
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.text(label, 24, y);
                doc.setTextColor(255, 255, 255);
                doc.setFont("helvetica", "bold");
                doc.text(String(value), 160, y);
            });

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Mejores días y horarios", 22, 158);

            doc.setTextColor(150, 160, 175);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Día con más turnos: ${stats.maxDia >= 0 ? WEEK_DAYS[stats.maxDia] : "Sin datos"}`, 24, 170);
            doc.text(`Hora pico: ${stats.maxHora !== null ? `${stats.maxHora}:00hs` : "Sin datos"}`, 24, 180);

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Pacientes más frecuentes", 22, 202);

            if (stats.topPets.length === 0) {
                doc.setTextColor(150, 160, 175);
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.text("Sin historial de visitas todavía.", 24, 214);
            } else {
                stats.topPets.forEach(({ pet, count }, i) => {
                    doc.setTextColor(150, 160, 175);
                    doc.setFontSize(10);
                    doc.setFont("helvetica", "normal");
                    doc.text(`${i + 1}. ${pet.name} — ${count} visita${count !== 1 ? "s" : ""}`, 24, 214 + i * 9);
                });
            }

            doc.setTextColor(100, 108, 120);
            doc.setFontSize(9);
            doc.text(`Generado por VetPaw · ${stats.now.toLocaleDateString("es-AR")}`, 22, 285);
            doc.save(`VetPaw_Estadisticas_${fecha}.pdf`);
        } catch (e) {
            console.error(e);
            setError("No se pudo generar el PDF.");
        }
    };

    if (loading) {
        return (
            <div className="stats-page stats-loading-page">
                <StarsBackground />
                <div className="loading-card">
                    <span>🐾</span>
                    <p>Cargando estadísticas...</p>
                </div>
                <style>{STYLES}</style>
            </div>
        );
    }

    return (
        <main className="stats-page">
            <StarsBackground />
            <div className="stats-glow stats-glow-1" />
            <div className="stats-glow stats-glow-2" />

            <section className="stats-shell">
                <aside className="stats-sidebar">
                    <div className="sidebar-card sidebar-hero">
                        <div className="sidebar-clinic-icon">🏥</div>
                        <p>Panel de clínica</p>
                        <h2>¡Bienvenido,<br /><span>{user?.username || "clínica"}!</span></h2>
                        <small>Gestioná tu clínica de forma simple y eficiente.</small>
                    </div>

                    <nav className="sidebar-nav" aria-label="Secciones de clínica">
                        <Link to="/clinic/dashboard">📅 <span>Turnos</span></Link>
                        <Link to="/clinic/dashboard">👥 <span>Pacientes</span></Link>
                        <Link to="/clinic/dashboard">📷 <span>Fotos</span></Link>
                        <Link to="/clinic/dashboard">🗓 <span>Mi Agenda</span></Link>
                        <span className="active">📊 <span>Estadísticas</span></span>
                        <Link to="/clinic/dashboard">⚙️ <span>Configuración</span></Link>
                    </nav>

                    <div className="support-card">
                        <div>🎧</div>
                        <strong>¿Necesitás ayuda?</strong>
                        <span>Estamos para ayudarte</span>
                        <button type="button">Contactar soporte</button>
                    </div>
                </aside>

                <div className="stats-main">
                    <header className="stats-header">
                        <div>
                            <Link to="/clinic/dashboard" className="back-link">← Volver al panel</Link>
                            <div className="title-row">
                                <span className="title-icon">📊</span>
                                <div>
                                    <h1>Estadísticas</h1>
                                    <p>{stats.now.toLocaleDateString("es-AR", { month: "long", year: "numeric" })} · {user?.username || "Clínica"}</p>
                                </div>
                            </div>
                        </div>
                        <button type="button" className="pdf-btn" onClick={handleDownloadPDF}>📄 Descargar reporte PDF</button>
                        <MiniChartIllustration />
                    </header>

                    {error && <div className="stats-error">⚠️ {error}</div>}

                    <section className="metrics-grid" aria-label="Métricas principales">
                        <MetricCard icon="📅" label="Turnos este mes" value={stats.totalMes} tone="green" sub={stats.totalLastMes > 0 ? `${stats.pctCambio >= 0 ? "+" : ""}${stats.pctCambio}% vs mes anterior` : "Sin comparación previa"} />
                        <MetricCard icon="✅" label="Realizados" value={stats.completedMes} tone="blue" sub={`de ${stats.totalMes} turno${stats.totalMes !== 1 ? "s" : ""}`} />
                        <MetricCard icon="❌" label="Ausentismo" value={`${stats.tasaAusentismo}%`} tone="red" sub={`${stats.noShowMes} no vinieron`} />
                        <MetricCard icon="🐾" label="Pacientes nuevos" value={stats.pacientesNuevos} tone="orange" sub="este mes" />
                    </section>

                    <section className="charts-grid first-row">
                        <article className="stats-panel chart-wide">
                            <div className="panel-head">
                                <div>
                                    <h3>Turnos por semana</h3>
                                    <p>Últimas 8 semanas</p>
                                </div>
                            </div>
                            <div className="chart-box tall">
                                {appointments.length > 0 ? <canvas ref={turnosRef} /> : <EmptyChart>Sin turnos registrados todavía</EmptyChart>}
                            </div>
                        </article>

                        <article className="stats-panel chart-side">
                            <div className="panel-head">
                                <div>
                                    <h3>Pacientes por especie</h3>
                                    <p>Distribución total</p>
                                </div>
                            </div>
                            <div className="species-legend">
                                {stats.especieLabels.map((label, i) => (
                                    <span key={label}><i style={{ background: stats.especieColors[i % stats.especieColors.length] }} /> {label}</span>
                                ))}
                            </div>
                            <div className="chart-box donut">
                                {stats.especieLabels.length > 0 ? <canvas ref={especiesRef} /> : <EmptyChart>Sin pacientes cargados</EmptyChart>}
                            </div>
                        </article>
                    </section>

                    <section className="charts-grid">
                        <article className="stats-panel">
                            <div className="panel-head">
                                <div>
                                    <h3>⭐ Mejores días</h3>
                                    <p>Día más ocupado: <strong>{stats.maxDia >= 0 ? WEEK_DAYS[stats.maxDia] : "Sin datos"}</strong></p>
                                    <small>{stats.maxDia >= 0 ? "Recomendación: abrí más turnos ese día" : "Cuando tengas turnos, VetPaw calculará tu mejor día."}</small>
                                </div>
                            </div>
                            <div className="chart-box"><canvas ref={diasRef} /></div>
                        </article>

                        <article className="stats-panel">
                            <div className="panel-head">
                                <div>
                                    <h3>🕘 Hora pico</h3>
                                    <p>Más demanda: <strong>{stats.maxHora !== null ? `${stats.maxHora}:00hs` : "Sin datos"}</strong></p>
                                    <small>{stats.maxHora !== null ? "Recomendación: tené más personal en ese horario" : "Cuando tengas turnos, VetPaw marcará tu horario fuerte."}</small>
                                </div>
                            </div>
                            <div className="chart-box"><canvas ref={horasRef} /></div>
                        </article>
                    </section>

                    <section className="bottom-grid">
                        <article className="stats-panel alerts-panel">
                            <h3>🔔 Alertas inteligentes</h3>
                            <div className="alerts-list">
                                {stats.vacunasProximas.length > 0 ? (
                                    <div className="alert-row warning">
                                        <strong>💉 {stats.vacunasProximas.length} vacuna{stats.vacunasProximas.length !== 1 ? "s" : ""} por vencer esta semana</strong>
                                        <span>Contactá a los dueños para coordinar la próxima dosis.</span>
                                    </div>
                                ) : (
                                    <div className="alert-row success">
                                        <strong>✅ Sin vacunas por vencer esta semana</strong>
                                    </div>
                                )}

                                {stats.controlesVencidos.length > 0 ? (
                                    <div className="alert-row danger">
                                        <strong>📅 {stats.controlesVencidos.length} control{stats.controlesVencidos.length !== 1 ? "es" : ""} vencido{stats.controlesVencidos.length !== 1 ? "s" : ""}</strong>
                                        <span>Pacientes que no volvieron a la fecha acordada.</span>
                                    </div>
                                ) : (
                                    <div className="alert-row success">
                                        <strong>✅ Sin controles vencidos</strong>
                                    </div>
                                )}

                                <button type="button" className="alert-row report" onClick={handleDownloadPDF}>
                                    <strong>📊 Reporte mensual listo</strong>
                                    <span>Descargá el PDF con todas las estadísticas.</span>
                                </button>
                            </div>
                        </article>

                        <article className="stats-panel top-pets-panel">
                            <h3>🏆 Pacientes más frecuentes</h3>
                            {stats.topPets.length === 0 ? (
                                <EmptyChart>Sin historial de visitas todavía</EmptyChart>
                            ) : (
                                <div className="top-pets-list">
                                    {stats.topPets.map(({ pet, count }, i) => (
                                        <div className="top-pet" key={pet.id}>
                                            <div className="top-pet-rank">{i + 1}</div>
                                            <div className="top-pet-avatar">
                                                {pet.photo ? <img src={pet.photo} alt={pet.name} /> : <span>🐾</span>}
                                            </div>
                                            <div className="top-pet-copy">
                                                <strong>{pet.name}</strong>
                                                <span>{pet.species_display || pet.species || "Mascota"} · {pet.owner_name || "Sin dueño asociado"}</span>
                                            </div>
                                            <em>{count} visita{count !== 1 ? "s" : ""}</em>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </article>
                    </section>
                </div>
            </section>
            <style>{STYLES}</style>
        </main>
    );
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

* { box-sizing: border-box; }

.stats-page {
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
    padding: 28px 22px 58px;
    color: #f8fbff;
    font-family: 'Nunito', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background:
        radial-gradient(circle at 20% 12%, rgba(76,175,80,.15), transparent 26%),
        radial-gradient(circle at 78% 22%, rgba(57,167,255,.16), transparent 30%),
        radial-gradient(circle at 96% 70%, rgba(255,152,0,.08), transparent 26%),
        linear-gradient(135deg, #06101e 0%, #07182a 42%, #05111f 100%);
}

.stats-loading-page {
    display: flex;
    align-items: center;
    justify-content: center;
}

.loading-card {
    position: relative;
    z-index: 2;
    width: min(360px, 92vw);
    padding: 34px;
    text-align: center;
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 28px;
    background: rgba(8,18,34,.75);
    box-shadow: 0 30px 90px rgba(0,0,0,.42);
}
.loading-card span { display: block; font-size: 3rem; animation: statsSpin 1.3s linear infinite; }
.loading-card p { margin: 12px 0 0; color: rgba(255,255,255,.68); font-weight: 800; }
@keyframes statsSpin { to { transform: rotate(360deg); } }

.stats-stars {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
    opacity: .95;
}
.stats-twinkle circle,
.stats-twinkle path { animation: statsTwinkle 4s ease-in-out infinite; }
@keyframes statsTwinkle { 0%, 100% { opacity: .28; } 50% { opacity: 1; } }

.stats-glow {
    position: fixed;
    border-radius: 999px;
    filter: blur(115px);
    pointer-events: none;
    z-index: 0;
    opacity: .18;
}
.stats-glow-1 { width: 480px; height: 480px; background: #39a7ff; top: -180px; right: 12%; }
.stats-glow-2 { width: 380px; height: 380px; background: #4CAF50; bottom: -160px; left: 7%; }

.stats-shell {
    position: relative;
    z-index: 1;
    width: min(1480px, 100%);
    margin: 0 auto;
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr);
    gap: 28px;
}

.stats-sidebar,
.stats-main { min-width: 0; }

.sidebar-card,
.support-card,
.stats-panel,
.metric-card {
    background: linear-gradient(180deg, rgba(14,32,57,.78), rgba(7,19,35,.72));
    border: 1px solid rgba(160,195,255,.13);
    box-shadow: 0 22px 70px rgba(0,0,0,.32), inset 0 1px 0 rgba(255,255,255,.04);
    backdrop-filter: blur(20px);
}

.stats-sidebar {
    position: sticky;
    top: 24px;
    align-self: start;
    display: grid;
    gap: 18px;
}
.sidebar-card {
    border-radius: 18px;
    padding: 20px;
}
.sidebar-hero { min-height: 260px; }
.sidebar-clinic-icon {
    width: 82px;
    height: 82px;
    display: grid;
    place-items: center;
    margin-bottom: 18px;
    border-radius: 22px;
    font-size: 2.2rem;
    background: linear-gradient(135deg, rgba(57,167,255,.15), rgba(76,175,80,.10));
    border: 1px solid rgba(57,167,255,.22);
}
.sidebar-card p {
    color: rgba(255,255,255,.60);
    font-weight: 800;
    margin: 0 0 14px;
}
.sidebar-card h2 {
    margin: 0;
    font-size: 1.45rem;
    line-height: 1.16;
    font-weight: 900;
}
.sidebar-card h2 span { color: #55d875; }
.sidebar-card small {
    display: block;
    margin-top: 16px;
    color: rgba(255,255,255,.62);
    line-height: 1.65;
    font-size: .98rem;
}

.sidebar-nav {
    display: grid;
    gap: 4px;
    padding: 8px 0 0;
}
.sidebar-nav a,
.sidebar-nav span {
    min-height: 48px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 14px;
    border-radius: 12px;
    color: rgba(255,255,255,.68);
    text-decoration: none;
    font-weight: 800;
    transition: .18s ease;
}
.sidebar-nav a:hover { background: rgba(255,255,255,.06); color: #fff; }
.sidebar-nav .active {
    color: #fff;
    background: linear-gradient(90deg, rgba(76,175,80,.28), rgba(76,175,80,.06));
    box-shadow: inset 3px 0 0 #4CAF50;
}

.support-card {
    border-radius: 18px;
    padding: 18px;
}
.support-card div {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: rgba(76,175,80,.14);
    margin-bottom: 12px;
}
.support-card strong { display: block; font-size: 1rem; }
.support-card span { display: block; color: rgba(255,255,255,.56); margin: 6px 0 14px; }
.support-card button {
    width: 100%;
    height: 44px;
    border-radius: 10px;
    border: 1px solid rgba(76,175,80,.45);
    background: rgba(76,175,80,.08);
    color: #73e688;
    font-weight: 900;
    cursor: pointer;
}

.stats-header {
    position: relative;
    min-height: 145px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    padding: 12px 0 26px;
    border-bottom: 1px solid rgba(255,255,255,.08);
    margin-bottom: 22px;
}
.back-link {
    display: inline-flex;
    color: rgba(255,255,255,.48);
    text-decoration: none;
    font-size: .9rem;
    font-weight: 800;
    margin-bottom: 16px;
}
.back-link:hover { color: #fff; }
.title-row {
    display: flex;
    align-items: center;
    gap: 14px;
}
.title-icon {
    width: 56px;
    height: 56px;
    display: grid;
    place-items: center;
    font-size: 2rem;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(76,175,80,.22), rgba(57,167,255,.13));
    border: 1px solid rgba(76,175,80,.25);
}
.title-row h1 {
    margin: 0;
    font-size: clamp(2rem, 4vw, 3rem);
    line-height: 1;
    font-weight: 900;
    letter-spacing: -.04em;
}
.title-row p {
    margin: 8px 0 0;
    color: rgba(255,255,255,.56);
    font-weight: 700;
}
.pdf-btn {
    position: relative;
    z-index: 2;
    min-height: 48px;
    border: 0;
    border-radius: 14px;
    padding: 0 20px;
    color: #fff;
    font-weight: 900;
    cursor: pointer;
    background: linear-gradient(135deg, #49c768, #ffad0a);
    box-shadow: 0 12px 34px rgba(255,152,0,.18);
}
.stats-hero-illustration {
    position: absolute;
    right: 22px;
    top: 18px;
    width: min(360px, 38%);
    height: auto;
    opacity: .55;
    pointer-events: none;
}

.stats-error {
    padding: 14px 16px;
    margin-bottom: 18px;
    border: 1px solid rgba(255,77,95,.25);
    background: rgba(255,77,95,.10);
    color: #ffb4bd;
    border-radius: 14px;
    font-weight: 800;
}

.metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 18px;
}
.metric-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 16px;
    min-height: 128px;
    padding: 20px;
    border-radius: 18px;
    overflow: hidden;
}
.metric-card::after {
    content: "";
    position: absolute;
    inset: auto -45px -55px auto;
    width: 130px;
    height: 130px;
    border-radius: 50%;
    opacity: .16;
    background: currentColor;
}
.metric-green { color: #55d875; }
.metric-blue { color: #50aaff; }
.metric-red { color: #ff5d6e; }
.metric-orange { color: #ffad0a; }
.metric-icon {
    width: 58px;
    height: 58px;
    flex: 0 0 58px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    font-size: 1.6rem;
    background: color-mix(in srgb, currentColor 18%, transparent);
    border: 1px solid color-mix(in srgb, currentColor 35%, transparent);
}
.metric-copy p {
    margin: 0 0 6px;
    color: rgba(255,255,255,.68);
    text-transform: uppercase;
    font-weight: 900;
    font-size: .76rem;
    letter-spacing: .05em;
}
.metric-copy strong {
    display: block;
    color: #fff;
    font-size: 2rem;
    line-height: .95;
    margin-bottom: 8px;
}
.metric-copy span {
    display: block;
    color: currentColor;
    font-size: .84rem;
    font-weight: 900;
}

.charts-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
    margin-bottom: 18px;
}
.first-row { grid-template-columns: minmax(0, 1.6fr) minmax(320px, .85fr); }
.stats-panel {
    border-radius: 18px;
    padding: 20px;
    min-width: 0;
}
.panel-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
}
.panel-head h3,
.alerts-panel h3,
.top-pets-panel h3 {
    margin: 0 0 6px;
    color: #fff;
    font-size: 1.08rem;
    font-weight: 900;
}
.panel-head p,
.panel-head small {
    margin: 0;
    color: rgba(255,255,255,.56);
    font-weight: 700;
}
.panel-head p strong { color: #64dd7b; }
.panel-head small { display: block; margin-top: 4px; color: rgba(255,255,255,.38); font-size: .8rem; }
.chart-box {
    position: relative;
    height: 170px;
    min-height: 170px;
}
.chart-box.tall { height: 220px; }
.chart-box.donut { height: 185px; }
.empty-chart {
    width: 100%;
    height: 100%;
    min-height: 120px;
    display: grid;
    place-items: center;
    color: rgba(255,255,255,.42);
    font-weight: 800;
    text-align: center;
    border-radius: 14px;
    background: rgba(255,255,255,.025);
    border: 1px dashed rgba(255,255,255,.10);
}
.species-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 10px;
}
.species-legend span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: rgba(255,255,255,.66);
    font-size: .84rem;
    font-weight: 800;
}
.species-legend i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.bottom-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
}
.alerts-list {
    display: grid;
    gap: 10px;
}
.alert-row {
    display: block;
    width: 100%;
    text-align: left;
    border-radius: 12px;
    padding: 13px 14px;
    border: 1px solid rgba(255,255,255,.10);
    background: rgba(255,255,255,.04);
    color: #fff;
    font-family: inherit;
}
.alert-row strong { display: block; font-weight: 900; }
.alert-row span { display: block; margin-top: 4px; color: rgba(255,255,255,.55); font-size: .84rem; }
.alert-row.success { background: rgba(76,175,80,.10); border-color: rgba(76,175,80,.25); color: #67e97f; }
.alert-row.warning { background: rgba(255,152,0,.10); border-color: rgba(255,152,0,.26); color: #ffb341; }
.alert-row.danger { background: rgba(255,77,95,.10); border-color: rgba(255,77,95,.26); color: #ff7c8a; }
.alert-row.report { cursor: pointer; background: rgba(57,167,255,.10); border-color: rgba(57,167,255,.24); color: #67c1ff; }

.top-pets-list {
    display: grid;
    gap: 10px;
}
.top-pet {
    display: grid;
    grid-template-columns: 34px 48px minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    padding: 10px;
    border-radius: 14px;
    background: rgba(255,255,255,.035);
    border: 1px solid rgba(255,255,255,.08);
}
.top-pet-rank {
    width: 30px;
    height: 30px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: #ffbf3d;
    font-weight: 900;
    background: rgba(255,152,0,.12);
}
.top-pet-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
    display: grid;
    place-items: center;
    background: rgba(255,255,255,.08);
    border: 1px solid rgba(255,255,255,.12);
}
.top-pet-avatar img { width: 100%; height: 100%; object-fit: cover; }
.top-pet-copy { min-width: 0; }
.top-pet-copy strong {
    display: block;
    color: #fff;
    font-weight: 900;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.top-pet-copy span {
    display: block;
    color: rgba(255,255,255,.50);
    font-size: .84rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.top-pet em {
    font-style: normal;
    padding: 6px 10px;
    border-radius: 9px;
    color: #65e77b;
    background: rgba(76,175,80,.12);
    border: 1px solid rgba(76,175,80,.24);
    font-weight: 900;
    font-size: .82rem;
}

@media (max-width: 1180px) {
    .stats-shell { grid-template-columns: 1fr; }
    .stats-sidebar { position: static; grid-template-columns: 1fr; }
    .sidebar-card, .support-card { display: none; }
    .sidebar-nav {
        display: flex;
        overflow-x: auto;
        padding: 8px;
        border: 1px solid rgba(255,255,255,.1);
        border-radius: 16px;
        background: rgba(7,19,35,.72);
    }
    .sidebar-nav a, .sidebar-nav span { white-space: nowrap; }
}

@media (max-width: 980px) {
    .stats-page { padding: 18px 14px 44px; }
    .stats-header { flex-direction: column; min-height: 0; }
    .stats-hero-illustration { display: none; }
    .metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .first-row, .charts-grid, .bottom-grid { grid-template-columns: 1fr; }
}

@media (max-width: 620px) {
    .title-row { align-items: flex-start; }
    .title-icon { width: 48px; height: 48px; font-size: 1.65rem; }
    .pdf-btn { width: 100%; justify-content: center; }
    .metrics-grid { grid-template-columns: 1fr; }
    .metric-card { min-height: 110px; }
    .top-pet { grid-template-columns: 30px 42px minmax(0, 1fr); }
    .top-pet em { grid-column: 3; justify-self: start; }
}
`;
