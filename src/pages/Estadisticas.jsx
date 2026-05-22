import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const G1 = '#4CAF50';
const O1 = '#FF9800';
const DARK = '#0f1923';
const DARK2 = '#162032';
const FONT = "'Plus Jakarta Sans', 'Nunito', sans-serif";

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HORAS = ['8h','9h','10h','11h','12h','13h','14h','15h','16h','17h','18h'];

export default function Estadisticas() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [visits, setVisits] = useState([]);
    const [vaccines, setVaccines] = useState([]);
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const turnosRef = useRef(null);
    const especiesRef = useRef(null);
    const diasRef = useRef(null);
    const horasRef = useRef(null);
    const charts = useRef({});

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [appts, vis, vacs, petsData] = await Promise.all([
                    api.get('/appointments/'),
                    api.get('/visits/'),
                    api.get('/vaccines/'),
                    api.get('/pets/'),
                ]);
                setAppointments(appts.data.results ?? appts.data);
                setVisits(vis.data.results ?? vis.data);
                setVaccines(vacs.data.results ?? vacs.data);
                setPets(petsData.data.results ?? petsData.data);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchAll();
    }, []);

    // ── Cálculos ──
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const turnosMes = appointments.filter(a => new Date(a.requested_date) >= firstOfMonth);
    const turnosLastMes = appointments.filter(a => {
        const d = new Date(a.requested_date);
        return d >= firstOfLastMonth && d < firstOfMonth;
    });

    const completedMes = turnosMes.filter(a => a.status === 'completed').length;
    const noShowMes = turnosMes.filter(a => a.status === 'no_show').length;
    const totalMes = turnosMes.length;
    const totalLastMes = turnosLastMes.length;
    const pctCambio = totalLastMes > 0 ? Math.round(((totalMes - totalLastMes) / totalLastMes) * 100) : 0;
    const tasaAusentismo = totalMes > 0 ? ((noShowMes / totalMes) * 100).toFixed(1) : '0.0';

    // Pacientes nuevos este mes (por fecha de primera visita)
    const petIds = new Set(visits.filter(v => new Date(v.date) >= firstOfMonth).map(v => v.pet));
    const pacientesNuevos = petIds.size;

    // Vacunas vencen en 7 días
    const en7dias = new Date(); en7dias.setDate(en7dias.getDate() + 7);
    const vacunasProximas = vaccines.filter(v => v.next_dose && new Date(v.next_dose) <= en7dias && new Date(v.next_dose) >= now);
    const controlesVencidos = visits.filter(v => v.next_visit && new Date(v.next_visit) < now);

    // Últimas 8 semanas
    const semanas = Array.from({ length: 8 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (7 * (7 - i)));
        return d;
    });
    const turnosPorSemana = semanas.map((inicio, i) => {
        const fin = semanas[i + 1] ?? new Date();
        return appointments.filter(a => {
            const d = new Date(a.requested_date);
            return d >= inicio && d < fin;
        }).length;
    });

    // Por día de semana
    const porDia = Array(7).fill(0);
    appointments.forEach(a => {
        const d = new Date(a.requested_date).getDay();
        porDia[d]++;
    });

    // Por hora
    const porHora = Array(11).fill(0);
    appointments.forEach(a => {
        const h = new Date(a.requested_date).getHours();
        if (h >= 8 && h <= 18) porHora[h - 8]++;
    });

    // Especies
    const especieCount = {};
    pets.forEach(p => { especieCount[p.species_display || p.species] = (especieCount[p.species_display || p.species] || 0) + 1; });
    const especieLabels = Object.keys(especieCount);
    const especieData = Object.values(especieCount);
    const especieColors = ['#4CAF50','#FF9800','#6bcaff','#a855f7','#f43f5e','#fbbf24'];

    // Pacientes más frecuentes
    const visitasPorPet = {};
    visits.forEach(v => { visitasPorPet[v.pet] = (visitasPorPet[v.pet] || 0) + 1; });
    const topPets = Object.entries(visitasPorPet)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => ({ pet: pets.find(p => p.id === parseInt(id)), count }))
        .filter(x => x.pet);

    // Mejor día
    const maxDia = porDia.indexOf(Math.max(...porDia));
    const maxHora = porHora.indexOf(Math.max(...porHora)) + 8;
    
    const getLogoBase64 = async () => {
        try {
            const res = await fetch('/logo_vetpaw.png');
            const blob = await res.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
        } catch { return null; }
    };

    
    useEffect(() => {
        if (loading) return;
        const loadCharts = async () => {
            if (!window.Chart) {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
                script.onload = renderCharts;
                document.head.appendChild(script);
            } else { renderCharts(); }
        };
        loadCharts();
        return () => { Object.values(charts.current).forEach(c => c?.destroy()); };
    }, [loading, appointments, pets, visits]);

    const renderCharts = () => {
        const gridColor = 'rgba(255,255,255,0.06)';
        const tickColor = 'rgba(255,255,255,0.35)';
        const C = window.Chart;
        if (!C) return;

        Object.values(charts.current).forEach(c => c?.destroy());

        if (turnosRef.current) {
            charts.current.turnos = new C(turnosRef.current, {
                type: 'line',
                data: {
                    labels: ['S1','S2','S3','S4','S5','S6','S7','S8'],
                    datasets: [{
                        data: turnosPorSemana,
                        borderColor: G1, backgroundColor: 'rgba(76,175,80,0.08)',
                        borderWidth: 2, pointBackgroundColor: G1, pointRadius: 3,
                        fill: true, tension: 0.4
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } } },
                        y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } }, beginAtZero: true }
                    }
                }
            });
        }

        if (especiesRef.current && especieLabels.length > 0) {
            charts.current.especies = new C(especiesRef.current, {
                type: 'doughnut',
                data: {
                    labels: especieLabels,
                    datasets: [{ data: especieData, backgroundColor: especieColors.slice(0, especieLabels.length), borderWidth: 0 }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    cutout: '65%'
                }
            });
        }

        if (diasRef.current) {
            charts.current.dias = new C(diasRef.current, {
                type: 'bar',
                data: {
                    labels: DIAS,
                    datasets: [{
                        data: porDia,
                        backgroundColor: porDia.map((v, i) => i === maxDia ? G1 : 'rgba(76,175,80,0.25)'),
                        borderRadius: 6, borderSkipped: false
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 10 } } },
                        y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } }, beginAtZero: true }
                    }
                }
            });
        }

        if (horasRef.current) {
            charts.current.horas = new C(horasRef.current, {
                type: 'bar',
                data: {
                    labels: HORAS,
                    datasets: [{
                        data: porHora,
                        backgroundColor: porHora.map((v, i) => i + 8 === maxHora ? O1 : 'rgba(255,152,0,0.25)'),
                        borderRadius: 6, borderSkipped: false
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 10 } } },
                        y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } }, beginAtZero: true }
                    }
                }
            });
        }
    };

    const handleDownloadPDF = async () => {
    const { default: jsPDF } = await import('https://esm.sh/jspdf@2.5.1');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const fecha = now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    const logo = await getLogoBase64();

    doc.setFillColor(15, 25, 35);
    doc.rect(0, 0, 210, 297, 'F');

    if (logo) doc.addImage(logo, 'PNG', 155, 8, 35, 25);

    doc.setTextColor(76, 175, 80);
        doc.setFontSize(22); doc.setFont('helvetica', 'bold');
        doc.text('VetPaw — Reporte de estadísticas', 20, 24);

        doc.setTextColor(180, 180, 180);
        doc.setFontSize(11); doc.setFont('helvetica', 'normal');
        doc.text(`Clínica: ${user?.username}   |   Período: ${fecha}`, 20, 32);

        doc.setDrawColor(76, 175, 80);
        doc.setLineWidth(0.5); doc.line(20, 36, 190, 36);

        const metrics = [
            ['Turnos este mes', totalMes],
            ['Realizados', completedMes],
            ['Ausentismo', `${tasaAusentismo}%`],
            ['Pacientes nuevos', pacientesNuevos],
            ['Vacunas próximas a vencer', vacunasProximas.length],
            ['Controles vencidos', controlesVencidos.length],
        ];

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(13); doc.setFont('helvetica', 'bold');
        doc.text('Resumen del mes', 20, 46);

        metrics.forEach(([label, val], i) => {
            const y = 54 + i * 10;
            doc.setFontSize(10); doc.setFont('helvetica', 'normal');
            doc.setTextColor(160, 160, 160); doc.text(label, 20, y);
            doc.setTextColor(255, 255, 255); doc.text(String(val), 150, y);
        });

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(13); doc.setFont('helvetica', 'bold');
        doc.text('Mejores días y horarios', 20, 124);

        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        doc.setTextColor(160, 160, 160);
        doc.text(`Día con más turnos: ${DIAS[maxDia]}`, 20, 134);
        doc.text(`Hora pico: ${maxHora}:00hs`, 20, 142);

        if (topPets.length > 0) {
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(13); doc.setFont('helvetica', 'bold');
            doc.text('Pacientes más frecuentes', 20, 160);
            topPets.forEach(({ pet, count }, i) => {
                doc.setFontSize(10); doc.setFont('helvetica', 'normal');
                doc.setTextColor(160, 160, 160);
                doc.text(`${i + 1}. ${pet.name} — ${count} visita${count !== 1 ? 's' : ''}`, 20, 168 + i * 9);
            });
        }

        doc.setTextColor(100, 100, 100);
        doc.setFontSize(9);
        doc.text(`Generado por VetPaw · ${now.toLocaleDateString('es-AR')}`, 20, 285);

        doc.save(`VetPaw_Estadisticas_${fecha}.pdf`);
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', background: DARK, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite', display: 'block' }}>🐾</div>
                <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: 12 }}>Cargando estadísticas...</p>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: DARK, fontFamily: FONT, paddingBottom: 60 }}>
            <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <Link to="/clinic/dashboard" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            ← Volver al panel
                        </Link>
                        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '2rem', fontWeight: 700, fontStyle: 'italic', color: '#fff', margin: 0, letterSpacing: -1 }}>
                            📊 Estadísticas
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: 4 }}>
                            {now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })} · {user?.username}
                        </p>
                    </div>
                    <button onClick={handleDownloadPDF} style={{
                        background: 'linear-gradient(135deg, #4CAF50, #FF9800)', color: '#fff',
                        border: 'none', borderRadius: 12, padding: '12px 22px',
                        fontFamily: FONT, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        📄 Descargar reporte PDF
                    </button>
                </div>

                {/* Métricas clave */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
                    {[
                        { icon: '📅', label: 'Turnos este mes', value: totalMes, sub: pctCambio >= 0 ? `+${pctCambio}% vs mes anterior` : `${pctCambio}% vs mes anterior`, subColor: pctCambio >= 0 ? '#4CAF50' : '#ef4444' },
                        { icon: '✅', label: 'Realizados', value: completedMes, sub: `de ${totalMes} turnos`, subColor: 'rgba(255,255,255,0.35)' },
                        { icon: '❌', label: 'Ausentismo', value: `${tasaAusentismo}%`, sub: `${noShowMes} no vinieron`, subColor: noShowMes > 0 ? '#ef4444' : '#4CAF50' },
                        { icon: '🐾', label: 'Pacientes nuevos', value: pacientesNuevos, sub: 'este mes', subColor: 'rgba(255,255,255,0.35)' },
                    ].map((m, i) => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '16px 18px' }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{m.icon}</div>
                            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>{m.label}</p>
                            <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', margin: '0 0 4px', lineHeight: 1 }}>{m.value}</p>
                            <p style={{ fontSize: '0.75rem', color: m.subColor, margin: 0, fontWeight: 600 }}>{m.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Gráfico turnos + especies */}
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 20 }}>
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '20px 22px' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', margin: '0 0 4px' }}>Turnos por semana</p>
                        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', margin: '0 0 16px' }}>Últimas 8 semanas</p>
                        <div style={{ position: 'relative', height: 180 }}>
                            <canvas ref={turnosRef} role="img" aria-label="Gráfico de turnos por semana" />
                        </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '20px 22px' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', margin: '0 0 4px' }}>Pacientes por especie</p>
                        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', margin: '0 0 12px' }}>Distribución total</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                            {especieLabels.map((label, i) => (
                                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)' }}>
                                    <span style={{ width: 8, height: 8, borderRadius: 2, background: especieColors[i], flexShrink: 0 }} />
                                    {label}
                                </span>
                            ))}
                        </div>
                        <div style={{ position: 'relative', height: 140 }}>
                            {especieLabels.length > 0
                                ? <canvas ref={especiesRef} role="img" aria-label="Distribución por especie" />
                                : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem' }}>Sin datos aún</div>
                            }
                        </div>
                    </div>
                </div>

                {/* Días + Horas */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '20px 22px' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', margin: '0 0 4px' }}>Mejores días</p>
                        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', margin: '0 0 4px' }}>
                            Día más ocupado: <span style={{ color: G1, fontWeight: 700 }}>{DIAS[maxDia]}</span>
                        </p>
                        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', margin: '0 0 14px' }}>Recomendación: abrí más turnos ese día</p>
                        <div style={{ position: 'relative', height: 150 }}>
                            <canvas ref={diasRef} role="img" aria-label="Turnos por día de la semana" />
                        </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '20px 22px' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', margin: '0 0 4px' }}>Hora pico</p>
                        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', margin: '0 0 4px' }}>
                            Más demanda a las <span style={{ color: O1, fontWeight: 700 }}>{maxHora}:00hs</span>
                        </p>
                        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', margin: '0 0 14px' }}>Recomendación: tené más personal en ese horario</p>
                        <div style={{ position: 'relative', height: 150 }}>
                            <canvas ref={horasRef} role="img" aria-label="Turnos por hora del día" />
                        </div>
                    </div>
                </div>

                {/* Alertas + Top pacientes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                    {/* Alertas */}
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '20px 22px' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', margin: '0 0 16px' }}>🔔 Alertas inteligentes</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {vacunasProximas.length > 0 ? (
                                <div style={{ background: 'rgba(255,152,0,0.1)', border: '1px solid rgba(255,152,0,0.25)', borderRadius: 12, padding: '12px 14px' }}>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 700, color: O1, margin: '0 0 4px' }}>
                                        💉 {vacunasProximas.length} vacuna{vacunasProximas.length > 1 ? 's' : ''} vence{vacunasProximas.length === 1 ? '' : 'n'} en 7 días
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Contactá a los dueños para reagendar</p>
                                </div>
                            ) : (
                                <div style={{ background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.2)', borderRadius: 12, padding: '12px 14px' }}>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 700, color: G1, margin: 0 }}>✅ Sin vacunas por vencer esta semana</p>
                                </div>
                            )}
                            {controlesVencidos.length > 0 ? (
                                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '12px 14px' }}>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ef4444', margin: '0 0 4px' }}>
                                        📅 {controlesVencidos.length} control{controlesVencidos.length > 1 ? 'es' : ''} vencido{controlesVencidos.length > 1 ? 's' : ''}
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Pacientes que no volvieron a la fecha acordada</p>
                                </div>
                            ) : (
                                <div style={{ background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.2)', borderRadius: 12, padding: '12px 14px' }}>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 700, color: G1, margin: 0 }}>✅ Sin controles vencidos</p>
                                </div>
                            )}
                            <div style={{ background: 'rgba(107,202,255,0.08)', border: '1px solid rgba(107,202,255,0.2)', borderRadius: 12, padding: '12px 14px' }}>
                                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6bcaff', margin: '0 0 4px' }}>
                                    📊 Reporte mensual listo
                                </p>
                                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Descargá el PDF con todas las estadísticas</p>
                            </div>
                        </div>
                    </div>

                    {/* Top pacientes */}
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '20px 22px' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', margin: '0 0 16px' }}>🏆 Pacientes más frecuentes</p>
                        {topPets.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem' }}>
                                Sin historial de visitas aún
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {topPets.map(({ pet, count }, i) => (
                                    <div key={pet.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                            background: i === 0 ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.06)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.8rem', fontWeight: 700,
                                            color: i === 0 ? '#fbbf24' : 'rgba(255,255,255,0.35)'
                                        }}>
                                            {i + 1}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {pet.name}
                                            </p>
                                            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                                                {pet.species_display || pet.species} · {pet.owner_name || '—'}
                                            </p>
                                        </div>
                                        <div style={{ background: 'rgba(76,175,80,0.12)', border: '1px solid rgba(76,175,80,0.25)', borderRadius: 8, padding: '3px 10px' }}>
                                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: G1 }}>{count} visita{count !== 1 ? 's' : ''}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
