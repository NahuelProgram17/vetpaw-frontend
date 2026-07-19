import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPets, createPet, updatePet, deletePet, createTreatment, deleteTreatment } from '../services/api';
import { prepareImageForUpload, replaceObjectUrl, revokeObjectUrl } from '../utils/imageUpload';
import ownerBg from "../assets/vetpaw-owner-bg.png";
import VetPawLoader from "../components/VetPawLoader";
import dashboardPetsIcon from "../assets/vetpaw-dashboard-icons/dashboard-pets.png";
import DogFriendlyIcon from "../assets/vetpaw-temperament-icons/dog/friendly.png";
import DogShyIcon from "../assets/vetpaw-temperament-icons/dog/shy.png";
import DogNervousIcon from "../assets/vetpaw-temperament-icons/dog/nervous.png";
import DogProtectiveIcon from "../assets/vetpaw-temperament-icons/dog/protective.png";
import DogPlayfulIcon from "../assets/vetpaw-temperament-icons/dog/playful.png";
import DogSleepyIcon from "../assets/vetpaw-temperament-icons/dog/sleepy.png";
import DogEaterIcon from "../assets/vetpaw-temperament-icons/dog/eater.png";
import DogIntimidatingIcon from "../assets/vetpaw-temperament-icons/dog/intimidating.png";
import HorseFriendlyIcon from "../assets/vetpaw-temperament-icons/horse/friendly.png";
import HorseShyIcon from "../assets/vetpaw-temperament-icons/horse/shy.png";
import HorseNervousIcon from "../assets/vetpaw-temperament-icons/horse/nervous.png";
import HorseProtectiveIcon from "../assets/vetpaw-temperament-icons/horse/protective.png";
import HorsePlayfulIcon from "../assets/vetpaw-temperament-icons/horse/playful.png";
import HorseSleepyIcon from "../assets/vetpaw-temperament-icons/horse/sleepy.png";
import HorseEaterIcon from "../assets/vetpaw-temperament-icons/horse/eater.png";
import HorseIntimidatingIcon from "../assets/vetpaw-temperament-icons/horse/intimidating.png";
import RabbitFriendlyIcon from "../assets/vetpaw-temperament-icons/rabbit/friendly.png";
import RabbitShyIcon from "../assets/vetpaw-temperament-icons/rabbit/shy.png";
import RabbitNervousIcon from "../assets/vetpaw-temperament-icons/rabbit/nervous.png";
import RabbitProtectiveIcon from "../assets/vetpaw-temperament-icons/rabbit/protective.png";
import RabbitPlayfulIcon from "../assets/vetpaw-temperament-icons/rabbit/playful.png";
import RabbitSleepyIcon from "../assets/vetpaw-temperament-icons/rabbit/sleepy.png";
import RabbitEaterIcon from "../assets/vetpaw-temperament-icons/rabbit/eater.png";
import RabbitIntimidatingIcon from "../assets/vetpaw-temperament-icons/rabbit/intimidating.png";
import BirdFriendlyIcon from "../assets/vetpaw-temperament-icons/bird/friendly.png";
import BirdShyIcon from "../assets/vetpaw-temperament-icons/bird/shy.png";
import BirdNervousIcon from "../assets/vetpaw-temperament-icons/bird/nervous.png";
import BirdProtectiveIcon from "../assets/vetpaw-temperament-icons/bird/protective.png";
import BirdPlayfulIcon from "../assets/vetpaw-temperament-icons/bird/playful.png";
import BirdSleepyIcon from "../assets/vetpaw-temperament-icons/bird/sleepy.png";
import BirdEaterIcon from "../assets/vetpaw-temperament-icons/bird/eater.png";
import BirdIntimidatingIcon from "../assets/vetpaw-temperament-icons/bird/intimidating.png";
import CowFriendlyIcon from "../assets/vetpaw-temperament-icons/cow/friendly.png";
import CowShyIcon from "../assets/vetpaw-temperament-icons/cow/shy.png";
import CowNervousIcon from "../assets/vetpaw-temperament-icons/cow/nervous.png";
import CowProtectiveIcon from "../assets/vetpaw-temperament-icons/cow/protective.png";
import CowPlayfulIcon from "../assets/vetpaw-temperament-icons/cow/playful.png";
import CowSleepyIcon from "../assets/vetpaw-temperament-icons/cow/sleepy.png";
import CowEaterIcon from "../assets/vetpaw-temperament-icons/cow/eater.png";
import CowIntimidatingIcon from "../assets/vetpaw-temperament-icons/cow/intimidating.png";
import GenericFriendlyIcon from "../assets/vetpaw-temperament-icons/generic/friendly.png";
import GenericShyIcon from "../assets/vetpaw-temperament-icons/generic/shy.png";
import GenericNervousIcon from "../assets/vetpaw-temperament-icons/generic/nervous.png";
import GenericProtectiveIcon from "../assets/vetpaw-temperament-icons/generic/protective.png";
import GenericPlayfulIcon from "../assets/vetpaw-temperament-icons/generic/playful.png";
import GenericSleepyIcon from "../assets/vetpaw-temperament-icons/generic/sleepy.png";
import GenericEaterIcon from "../assets/vetpaw-temperament-icons/generic/eater.png";
import GenericIntimidatingIcon from "../assets/vetpaw-temperament-icons/generic/intimidating.png";

const TREATMENT_TYPES = [
    { value: 'deworming', label: 'Desparasitación', emoji: '🛡️' },
    { value: 'flea', label: 'Pastilla antipulgas', emoji: '💊' },
    { value: 'pipette', label: 'Pipeta', emoji: '💧' },
];
const treatmentMeta = (t) => TREATMENT_TYPES.find((x) => x.value === t) || { label: t, emoji: '💊' };
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
};

const SPECIES_EMOJI = {
    dog: '🐶',
    perro: '🐶',
    cat: '🐱',
    gato: '🐱',
    horse: '🐴',
    caballo: '🐴',
    bird: '🦜',
    ave: '🦜',
    pajaro: '🦜',
    pájaro: '🦜',
    rabbit: '🐰',
    conejo: '🐰',
    cow: '🐮',
    vaca: '🐮',
    toro: '🐂',
    bull: '🐂',
    fish: '🐟',
    pez: '🐟',
    hamster: '🐹',
    turtle: '🐢',
    tortuga: '🐢',
    reptile: '🦎',
    reptil: '🦎',
    other: '🐾',
    otro: '🐾',
};

const petEmoji = (species) =>
    SPECIES_EMOJI[(species || '').toLowerCase()] || '🐾';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000')
    .replace(/\/api\/?$/, '')
    .replace(/\/$/, '');

const mediaUrl = (url) => {
    if (!url) return null;
    if (/^(https?:|data:|blob:)/i.test(url)) return url;
    return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
};

const TEMPERAMENT_META = {
    friendly: { label: 'Amigable' },
    shy: { label: 'Tímido' },
    nervous: { label: 'Nervioso' },
    protective: { label: 'Protector' },
    playful: { label: 'Juguetón' },
    sleepy: { label: 'Dormilón' },
    eater: { label: 'Comilón' },
    intimidating: { label: 'Intimidante' },
};

const TEMPERAMENT_ICON_SETS = {
    dog: { friendly: DogFriendlyIcon, shy: DogShyIcon, nervous: DogNervousIcon, protective: DogProtectiveIcon, playful: DogPlayfulIcon, sleepy: DogSleepyIcon, eater: DogEaterIcon, intimidating: DogIntimidatingIcon },
    horse: { friendly: HorseFriendlyIcon, shy: HorseShyIcon, nervous: HorseNervousIcon, protective: HorseProtectiveIcon, playful: HorsePlayfulIcon, sleepy: HorseSleepyIcon, eater: HorseEaterIcon, intimidating: HorseIntimidatingIcon },
    rabbit: { friendly: RabbitFriendlyIcon, shy: RabbitShyIcon, nervous: RabbitNervousIcon, protective: RabbitProtectiveIcon, playful: RabbitPlayfulIcon, sleepy: RabbitSleepyIcon, eater: RabbitEaterIcon, intimidating: RabbitIntimidatingIcon },
    bird: { friendly: BirdFriendlyIcon, shy: BirdShyIcon, nervous: BirdNervousIcon, protective: BirdProtectiveIcon, playful: BirdPlayfulIcon, sleepy: BirdSleepyIcon, eater: BirdEaterIcon, intimidating: BirdIntimidatingIcon },
    cow: { friendly: CowFriendlyIcon, shy: CowShyIcon, nervous: CowNervousIcon, protective: CowProtectiveIcon, playful: CowPlayfulIcon, sleepy: CowSleepyIcon, eater: CowEaterIcon, intimidating: CowIntimidatingIcon },
    generic: { friendly: GenericFriendlyIcon, shy: GenericShyIcon, nervous: GenericNervousIcon, protective: GenericProtectiveIcon, playful: GenericPlayfulIcon, sleepy: GenericSleepyIcon, eater: GenericEaterIcon, intimidating: GenericIntimidatingIcon },
};

const normalizeSpeciesForIcons = (species) => {
    const value = (species || '').toString().trim().toLowerCase();
    if (['dog', 'perro'].includes(value)) return 'dog';
    if (['horse', 'caballo', 'equino'].includes(value)) return 'horse';
    if (['rabbit', 'conejo'].includes(value)) return 'rabbit';
    if (['bird', 'ave', 'pajaro', 'pájaro', 'loro', 'canario'].includes(value)) return 'bird';
    if (['cow', 'vaca', 'toro', 'bull', 'bovine', 'bovino'].includes(value)) return 'cow';
    return 'generic';
};

const temperamentMeta = (value, display, species) => {
    const meta = TEMPERAMENT_META[value] || { label: display || value };
    const speciesKey = normalizeSpeciesForIcons(species);
    const icon = TEMPERAMENT_ICON_SETS[speciesKey]?.[value] || TEMPERAMENT_ICON_SETS.generic?.[value] || TEMPERAMENT_ICON_SETS.generic.friendly;
    return { ...meta, label: display || meta.label, icon };
};

const TEMPERAMENT_OPTIONS = Object.entries(TEMPERAMENT_META).map(([value, meta]) => ({
    value,
    label: meta.label,
}));

const EMPTY_FORM = {
    name: '',
    species: 'dog',
    breed: '',
    sex: 'male',
    birth_date: '',
    weight: '',
    color: '',
    microchip: '',
    allergies: '',
    notes: '',
    is_neutered: false,
    photo: null,
    feeding: '',
    habitat: '',
    lives_with_animals: false,
    temperament: '',
};



function OwnerPawIcon() {
    return (
        <span className="owner-icon-badge owner-icon-badge--image" aria-hidden="true">
            <img src={dashboardPetsIcon} alt="" className="owner-title-icon-img" />
        </span>
    );
}
function OwnerCalendarIcon() {
    return (
        <span className="owner-icon-badge" aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="none">
                <rect x="12" y="16" width="40" height="36" rx="8" fill="rgba(107,202,255,.13)" stroke="#6bcaff" strokeWidth="2"/>
                <path d="M12 27h40" stroke="#4CAF50" strokeWidth="2"/>
                <path d="M22 11v10M42 11v10" stroke="#FF9800" strokeWidth="4" strokeLinecap="round"/>
                <rect x="20" y="34" width="8" height="8" rx="2" fill="#4CAF50"/><rect x="32" y="34" width="8" height="8" rx="2" fill="#FF9800"/>
            </svg>
        </span>
    );
}
function OwnerVetIcon() {
    return (
        <span className="owner-icon-badge" aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="none">
                <path d="M13 51V25l19-13 19 13v26" stroke="#6bcaff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M25 51V37h14v14" stroke="#4CAF50" strokeWidth="2.4" strokeLinecap="round"/>
                <path d="M32 23v12M26 29h12" stroke="#FF9800" strokeWidth="4" strokeLinecap="round"/>
            </svg>
        </span>
    );
}
function OwnerAlertPetIcon() {
    return (
        <span className="owner-icon-badge" aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="none">
                <path d="M32 11 55 52H9L32 11Z" fill="rgba(255,152,0,.15)" stroke="#FF9800" strokeWidth="2.5"/>
                <path d="M24 39c2.4-4 4.8-5.8 8-5.8S37.6 35 40 39l2.2 3.5c1.8 2.8-.2 6.5-3.6 6.5H25.4c-3.4 0-5.4-3.7-3.6-6.5L24 39Z" fill="#4CAF50"/>
                <circle cx="23" cy="31" r="3.5" fill="#FFB74D"/><circle cx="30" cy="26" r="3.5" fill="#6bcaff"/><circle cx="38" cy="31" r="3.5" fill="#FF9800"/>
            </svg>
        </span>
    );
}

export default function Pets() {
    const navigate = useNavigate();
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPet, setEditingPet] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [temperamentOpen, setTemperamentOpen] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);

    // ── Tratamientos preventivos ──
    const [treatmentPetId, setTreatmentPetId] = useState(null);
    const [tForm, setTForm] = useState({ treatment_type: 'deworming', date_applied: todayISO(), next_dose: '', product: '' });
    const [tSaving, setTSaving] = useState(false);
    const [tError, setTError] = useState('');
    const treatmentPet = pets.find((p) => p.id === treatmentPetId) || null;

    useEffect(() => {
        fetchPets();
    }, []);

    useEffect(() => {
        if (openMenuId === null) return;
        const onDocClick = (e) => {
            if (!e.target.closest('.pet-menu-wrap')) setOpenMenuId(null);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [openMenuId]);

    useEffect(() => {
        if (!showModal && !treatmentPetId) return;

        const handleEscape = (event) => {
            if (event.key !== 'Escape') return;
            closeModal();
            closeTreatments();
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [showModal, treatmentPetId]);

    const fetchPets = async () => {
        try {
            const data = await getPets();
            setPets(data.results ?? data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const openNew = () => {
        setEditingPet(null);
        setForm(EMPTY_FORM);
        setPhotoPreview((current) => { revokeObjectUrl(current); return null; });
        setError('');
        setShowModal(true);
    };

    const openEdit = (pet) => {
        setEditingPet(pet);
        setForm({
            name: pet.name || '',
            species: pet.species || 'dog',
            breed: pet.breed || '',
            sex: pet.sex || 'male',
            birth_date: pet.birth_date || '',
            weight: pet.weight || '',
            color: pet.color || '',
            microchip: pet.microchip || '',
            allergies: pet.allergies || '',
            notes: pet.notes || '',
            is_neutered: pet.is_neutered || false,
            photo: null,
            feeding: pet.feeding || '',
            habitat: pet.habitat || '',
            lives_with_animals: pet.lives_with_animals || false,
            temperament: pet.temperament || '',
        });
        setPhotoPreview(mediaUrl(pet.photo));
        setError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setTemperamentOpen(false);
        setEditingPet(null);
        setPhotoPreview((current) => { revokeObjectUrl(current); return null; });
        setError('');
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
        if (name === 'species') setTemperamentOpen(false);
    };

    const selectTemperament = (value) => {
        setForm((prev) => ({ ...prev, temperament: value }));
        setTemperamentOpen(false);
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError('');
        try {
            const prepared = await prepareImageForUpload(file, { maxMB: 5, maxDimension: 2048, label: 'La foto de la mascota' });
            setForm((current) => ({ ...current, photo: prepared }));
            setPhotoPreview((current) => replaceObjectUrl(current, prepared));
        } catch (imageError) {
            setError(imageError.message || 'No pudimos preparar la foto.');
            e.target.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name) {
            setError('El nombre es obligatorio.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            if (editingPet) {
                await updatePet(editingPet.id, form);
            } else {
                await createPet(form);
            }
            await fetchPets();
            closeModal();
        } catch (err) {
            const data = err.response?.data;
            setError(
                data ? Object.values(data).flat().join(' ') : 'Error al guardar.',
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deletePet(id);
            setPets(pets.filter((p) => p.id !== id));
            setDeleteConfirm(null);
        } catch (e) {
            console.error(e);
        }
    };

    const openTreatments = (pet) => {
        setTreatmentPetId(pet.id);
        setTForm({ treatment_type: 'deworming', date_applied: todayISO(), next_dose: '', product: '' });
        setTError('');
    };
    const closeTreatments = () => setTreatmentPetId(null);

    const handleAddTreatment = async (e) => {
        e.preventDefault();
        setTError('');
        if (!tForm.date_applied) {
            setTError('Elegí la fecha de aplicación.');
            return;
        }
        setTSaving(true);
        try {
            const payload = {
                pet: treatmentPetId,
                treatment_type: tForm.treatment_type,
                date_applied: tForm.date_applied,
                product: tForm.product.trim(),
            };
            if (tForm.next_dose) payload.next_dose = tForm.next_dose;
            await createTreatment(payload);
            await fetchPets();
            setTForm({ treatment_type: tForm.treatment_type, date_applied: todayISO(), next_dose: '', product: '' });
        } catch (e) {
            console.error(e);
            setTError('No se pudo guardar. Intentá de nuevo.');
        } finally {
            setTSaving(false);
        }
    };

    const handleDeleteTreatment = async (id) => {
        try {
            await deleteTreatment(id);
            await fetchPets();
        } catch (e) {
            console.error(e);
        }
    };

    const calcAge = (birth_date) => {
        if (!birth_date) return null;
        const diff = Date.now() - new Date(birth_date).getTime();
        const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
        if (years < 1) {
            const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
            return months <= 0
                ? 'Recién nacido'
                : `${months} mes${months > 1 ? 'es' : ''}`;
        }
        return `${years} año${years > 1 ? 's' : ''}`;
    };

    return (
        <div className="pets-page">
            <div className="blob b1" />
            <div className="blob b2" />
            <div className="pets-inner">
                <header className="pets-header">
                    <div>
                        <div className="owner-hero-title-row"><OwnerPawIcon /><h1 className="pets-title owner-gradient-title">Mis mascotas</h1></div>
                        <p className="pets-subtitle">
                            {pets.length === 0
                                ? 'Todavía no registraste ninguna mascota.'
                                : `Tenés ${pets.length} mascota${pets.length > 1 ? 's' : ''} registrada${pets.length > 1 ? 's' : ''}.`}
                        </p>
                    </div>
                </header>

                {loading && <VetPawLoader message="Cargando mascotas..." subText="Preparando tus mascotas" fullScreen={false} />}

                {!loading && pets.length === 0 && (
                    <div className="empty-state">
                        <span className="empty-emoji">🐶</span>
                        <h2>¡Tu familia peluda te espera!</h2>
                        <p>
                            Registrá tu primera mascota para gestionar sus turnos y vacunas.
                        </p>
                        <button className="btn-primary" onClick={openNew}>
                            + Agregar mascota
                        </button>
                    </div>
                )}

                {!loading && pets.length > 0 && (
                    <div className="pets-list">
                        {pets.map((pet) => (
                            <div key={pet.id} className="pet-row">
                                <div className={`pet-photo-side ${pet.birthday_frame_active ? 'birthday-photo-active' : ''}`}>
                                    {pet.birthday_frame_active && <span className="pet-birthday-crown" title="¡Semana de cumpleaños!">👑</span>}
                                    {pet.photo ? (
                                        <img
                                            src={mediaUrl(pet.photo)}
                                            alt={pet.name}
                                            className="pet-row-photo"
                                        />
                                    ) : (
                                        <div className="pet-row-photo placeholder">
                                            <span className="pet-row-emoji">{petEmoji(pet.species)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pet-info-side">
                                    {/* Header: nombre + Activo + menú "..." */}
                                    <div className="pet-info-header">
                                        <div className="pet-info-headleft">
                                            <h3 className="pet-row-name">{pet.name}</h3>
                                            <span className="pet-active-badge">✓ Activo</span>
                                        </div>
                                        <div className="pet-menu-wrap">
                                            <button
                                                className="pet-menu-btn"
                                                onClick={() => setOpenMenuId(openMenuId === pet.id ? null : pet.id)}
                                                title="Más opciones"
                                                aria-label="Más opciones"
                                            >
                                                •••
                                            </button>
                                            {openMenuId === pet.id && (
                                                <div className="pet-menu">
                                                    <button
                                                        className="pet-menu-item"
                                                        onClick={() => { setOpenMenuId(null); openEdit(pet); }}
                                                    >
                                                        <span className="pet-menu-icon">✏️</span>
                                                        <span>Editar</span>
                                                    </button>
                                                    <button
                                                        className="pet-menu-item"
                                                        onClick={() => { setOpenMenuId(null); navigate(`/mascotas/${pet.id}`); }}
                                                    >
                                                        <span className="pet-menu-icon">🌎</span>
                                                        <span>Perfil público</span>
                                                    </button>
                                                    <button
                                                        className="pet-menu-item danger"
                                                        onClick={() => { setOpenMenuId(null); setDeleteConfirm(pet.id); }}
                                                    >
                                                        <span className="pet-menu-icon">🗑️</span>
                                                        <span>Eliminar</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Especie · sexo */}
                                    <p className="pet-row-meta">
                                        <span style={{ textTransform: 'capitalize' }}>
                                            {pet.species_display || pet.species || '—'}
                                        </span>
                                        {pet.sex && (
                                            <>
                                                <span className="pet-row-dot">·</span>
                                                <span>{pet.sex === 'male' ? '♂ Macho' : '♀ Hembra'}</span>
                                            </>
                                        )}
                                    </p>

                                    {pet.birthday_badges?.length > 0 && (
                                        <div className="pet-birthday-badges">
                                            {pet.birthday_badges.slice(0, 4).map((celebration) => (
                                                <span key={celebration.id} className="pet-birthday-badge" title={celebration.badge?.subtitle}>
                                                    <b>{celebration.badge?.emoji || '🎖️'}</b>
                                                    <span>{celebration.badge?.name}</span>
                                                    <small>{celebration.year}</small>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Fila de stats: edad / peso / color */}
                                    <div className="pet-stats-row">
                                        <div className="pet-stat-box">
                                            <span className="pet-stat-icon">🎂</span>
                                            <div className="pet-stat-text">
                                                <div className="pet-stat-value">{calcAge(pet.birth_date) || '—'}</div>
                                                <div className="pet-stat-label">Edad</div>
                                            </div>
                                        </div>
                                        <div className="pet-stat-box">
                                            <span className="pet-stat-icon">⚖️</span>
                                            <div className="pet-stat-text">
                                                <div className="pet-stat-value">{pet.weight ? `${pet.weight} kg` : '—'}</div>
                                                <div className="pet-stat-label">Peso</div>
                                            </div>
                                        </div>
                                        <div className="pet-stat-box">
                                            <span className="pet-stat-icon">🎨</span>
                                            <div className="pet-stat-text">
                                                <div className="pet-stat-value" style={{ textTransform: 'capitalize' }}>{pet.color || '—'}</div>
                                                <div className="pet-stat-label">Color</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Chips reales: alimentación, hábitat, convivencia, carácter */}
                                    {(pet.feeding || pet.habitat || pet.lives_with_animals || pet.temperament) && (
                                        <div className="pet-chips-row">
                                            {pet.feeding && (
                                                <span className="pet-chip">
                                                    🥣 {pet.feeding === 'balanced' ? 'Balanceada' : pet.feeding === 'homemade' ? 'Casera' : 'Mixta'}
                                                </span>
                                            )}
                                            {pet.habitat && (
                                                <span className="pet-chip">
                                                    🏠 {pet.habitat === 'apartment' ? 'Departamento' : pet.habitat === 'house' ? 'Casa con patio' : 'Campo'}
                                                </span>
                                            )}
                                            {pet.lives_with_animals && (
                                                <span className="pet-chip">🐕 Convive con otros animales</span>
                                            )}
                                            {pet.temperament && (
                                                <span className="pet-chip pet-chip--temperament">
                                                    {(() => {
                                                        const meta = temperamentMeta(pet.temperament, pet.temperament_display, pet.species);
                                                        return (
                                                            <>
                                                                <img src={meta.icon} alt="" className="pet-temperament-chip-icon" />
                                                                <span>{meta.label}</span>
                                                            </>
                                                        );
                                                    })()}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Alergias (si hay) */}
                                    {pet.allergies && (
                                        <div className="pet-alert">⚠️ Alergias: {pet.allergies}</div>
                                    )}

                                    {/* Línea de vacunas */}
                                    <div className="pet-vaccines-line">
                                        <span className="pet-vac-ico">🛡️</span>
                                        {pet.vaccines && pet.vaccines.length > 0
                                            ? `${pet.vaccines.length} vacuna${pet.vaccines.length > 1 ? 's' : ''} registrada${pet.vaccines.length > 1 ? 's' : ''}`
                                            : 'Sin vacunas registradas'}
                                    </div>

                                    {/* 3 botones de acción */}
                                    <div className="pet-actions-row">
                                        <button
                                            className="pet-btn pet-btn-ghost"
                                            onClick={() => navigate(`/history?pet=${pet.id}`)}
                                        >
                                            📋 Ver historial
                                        </button>
                                        <button
                                            className="pet-btn pet-btn-grad"
                                            onClick={() => navigate(`/appointments/new?pet=${pet.id}`)}
                                        >
                                            🗓️ Sacar turno
                                        </button>
                                        <button
                                            className="pet-btn pet-btn-grad"
                                            onClick={() => openTreatments(pet)}
                                        >
                                            💊 Antiparasitarios
                                            {pet.treatments && pet.treatments.length > 0 ? ` (${pet.treatments.length})` : ''}
                                        </button>
                                    </div>
                                </div>

                                {deleteConfirm === pet.id && (
                                    <div className="delete-confirm">
                                        <p>
                                            ¿Eliminar a <strong>{pet.name}</strong>?
                                        </p>
                                        <div className="delete-btns">
                                            <button
                                                className="btn-cancel"
                                                onClick={() => setDeleteConfirm(null)}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                className="btn-danger"
                                                onClick={() => handleDelete(pet.id)}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Tarjeta punteada: agregar otra mascota */}
                        <button className="add-pet-cta" onClick={openNew}>
                            <span className="add-pet-plus">+</span>
                            <div className="add-pet-texts">
                                <div className="add-pet-title">Agregar otra mascota</div>
                                <div className="add-pet-sub">Registrá a otro miembro de tu familia peluda.</div>
                            </div>
                            <span className="add-pet-cta-btn">+ Agregar mascota</span>
                        </button>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                {editingPet ? `Editar a ${editingPet.name}` : 'Nueva mascota'}
                            </h2>
                            <button className="modal-close" onClick={closeModal}>
                                ✕
                            </button>
                        </div>
                        {error && <div className="form-error">⚠️ {error}</div>}
                        <form onSubmit={handleSubmit} className="pet-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nombre *</label>
                                    <input
                                        name="name"
                                        placeholder="Luna"
                                        value={form.name}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Especie</label>
                                    <select
                                        name="species"
                                        value={form.species}
                                        onChange={handleChange}
                                    >
                                        <option value="dog">🐶 Perro</option>
                                        <option value="cat">🐱 Gato</option>
                                        <option value="horse">🐴 Caballo</option>
                                        <option value="bird">🦜 Ave</option>
                                        <option value="rabbit">🐰 Conejo</option>
                                        <option value="cow">🐮 Vaca / Toro</option>
                                        <option value="hamster">🐹 Hámster</option>
                                        <option value="reptile">🦎 Reptil</option>
                                        <option value="fish">🐟 Pez</option>
                                        <option value="other">🐾 Otro</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Raza</label>
                                    <input
                                        name="breed"
                                        placeholder="Labrador"
                                        value={form.breed}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Sexo</label>
                                    <select name="sex" value={form.sex} onChange={handleChange}>
                                        <option value="male">♂ Macho</option>
                                        <option value="female">♀ Hembra</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Fecha de nacimiento</label>
                                    <input
                                        name="birth_date"
                                        type="date"
                                        value={form.birth_date}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Peso (kg)</label>
                                    <input
                                        name="weight"
                                        type="number"
                                        step="0.1"
                                        placeholder="5.2"
                                        value={form.weight}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Color</label>
                                    <input
                                        name="color"
                                        placeholder="Marrón y blanco"
                                        value={form.color}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Microchip</label>
                                    <input
                                        name="microchip"
                                        placeholder="N° de microchip"
                                        value={form.microchip}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Alimentación</label>
                                    <select
                                        name="feeding"
                                        value={form.feeding}
                                        onChange={handleChange}
                                    >
                                        <option value="">— Seleccioná —</option>
                                        <option value="balanced">🥣 Balanceada</option>
                                        <option value="homemade">🍖 Casera</option>
                                        <option value="mixed">🥗 Mixta</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Hábitat</label>
                                    <select
                                        name="habitat"
                                        value={form.habitat}
                                        onChange={handleChange}
                                    >
                                        <option value="">— Seleccioná —</option>
                                        <option value="apartment">🏢 Departamento</option>
                                        <option value="house">🏠 Casa con patio</option>
                                        <option value="field">🌾 Campo</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-check">
                                <input
                                    type="checkbox"
                                    id="lives_with_animals"
                                    name="lives_with_animals"
                                    checked={form.lives_with_animals}
                                    onChange={handleChange}
                                />
                                <label htmlFor="lives_with_animals">
                                    🐕 Convive con otros animales
                                </label>
                            </div>

                            <div className="form-group full">
                                <label>Carácter</label>
                                <div className="temperament-picker">
                                    <button
                                        type="button"
                                        className="temperament-trigger"
                                        onClick={() => setTemperamentOpen((open) => !open)}
                                    >
                                        {form.temperament ? (() => {
                                            const meta = temperamentMeta(form.temperament, null, form.species);
                                            return (
                                                <>
                                                    <img src={meta.icon} alt="" className="temperament-trigger-icon" />
                                                    <span>{meta.label}</span>
                                                </>
                                            );
                                        })() : <span className="temperament-placeholder">— Seleccioná —</span>}
                                        <span className="temperament-chevron">⌄</span>
                                    </button>
                                    {temperamentOpen && (
                                        <div className="temperament-menu">
                                            {TEMPERAMENT_OPTIONS.map((option) => {
                                                const meta = temperamentMeta(option.value, option.label, form.species);
                                                return (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        className={`temperament-option ${form.temperament === option.value ? 'active' : ''}`}
                                                        onClick={() => selectTemperament(option.value)}
                                                    >
                                                        <img src={meta.icon} alt="" className="temperament-option-icon" />
                                                        <span>{meta.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="form-group full">
                                <label>Alergias</label>
                                <input
                                    name="allergies"
                                    placeholder="Ej: Polen, pollo..."
                                    value={form.allergies}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group full">
                                <label>Notas adicionales</label>
                                <textarea
                                    name="notes"
                                    placeholder="Comportamiento, medicación habitual..."
                                    value={form.notes}
                                    onChange={handleChange}
                                    rows={3}
                                />
                            </div>

                            {/* Foto */}
                            <div className="form-group full">
                                <label>Foto</label>
                                <div className="photo-upload">
                                    {photoPreview && (
                                        <img
                                            src={photoPreview}
                                            alt="preview"
                                            className="photo-preview"
                                        />
                                    )}
                                    <label className="photo-label">
                                        📷 {photoPreview ? 'Cambiar foto' : 'Subir foto'}
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handlePhotoChange}
                                            className="photo-input-hidden"
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="form-check">
                                <input
                                    type="checkbox"
                                    id="is_neutered"
                                    name="is_neutered"
                                    checked={form.is_neutered}
                                    onChange={handleChange}
                                />
                                <label htmlFor="is_neutered">✂️ Castrado/a</label>
                            </div>
                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn-ghost"
                                    onClick={closeModal}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving
                                        ? 'Guardando...'
                                        : editingPet
                                            ? 'Guardar cambios'
                                            : 'Crear mascota 🐕'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {treatmentPet && (
                <div className="modal-overlay" onClick={closeTreatments}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Antiparasitarios — {treatmentPet.name}</h2>
                            <button className="modal-close" onClick={closeTreatments}>✕</button>
                        </div>

                        {tError && <div className="form-error">{tError}</div>}

                        {/* Historial agrupado por tipo */}
                        <div className="treatment-history">
                            {TREATMENT_TYPES.map((type) => {
                                const items = (treatmentPet.treatments || [])
                                    .filter((t) => t.treatment_type === type.value);
                                return (
                                    <div key={type.value} className="treatment-group">
                                        <h4>{type.emoji} {type.label} <span>({items.length})</span></h4>
                                        {items.length === 0 ? (
                                            <p className="treatment-empty">Sin registros todavía.</p>
                                        ) : (
                                            <ul className="treatment-list">
                                                {items.map((t) => (
                                                    <li key={t.id}>
                                                        <div>
                                                            <strong>{fmtDate(t.date_applied)}</strong>
                                                            {t.product && <span className="treatment-prod"> · {t.product}</span>}
                                                        </div>
                                                        <button
                                                            className="treatment-del"
                                                            title="Eliminar"
                                                            onClick={() => handleDeleteTreatment(t.id)}
                                                        >🗑️</button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                );
                            })}
                        </div>


                        <div className="treatment-form-title">➕ Nueva aplicación</div>
                        <form className="pet-form" onSubmit={handleAddTreatment}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Producto</label>
                                    <select
                                        value={tForm.treatment_type}
                                        onChange={(e) => setTForm({ ...tForm, treatment_type: e.target.value })}
                                    >
                                        {TREATMENT_TYPES.map((t) => (
                                            <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Fecha</label>
                                    <input
                                        type="date"
                                        value={tForm.date_applied}
                                        max={todayISO()}
                                        onChange={(e) => setTForm({ ...tForm, date_applied: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group full">
                                <label>Próxima dosis (opcional)</label>
                                <input
                                    type="date"
                                    value={tForm.next_dose}
                                    min={tForm.date_applied || todayISO()}
                                    onChange={(e) => setTForm({ ...tForm, next_dose: e.target.value })}
                                />
                                <small style={{ display: 'block', marginTop: 4, fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
                                    Si la cargás, te aparecerá un recordatorio en Mi Panel.
                                </small>
                            </div>
                            <div className="form-group full">
                                <label>Marca / nota (opcional)</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Drontal, NexGard, etc."
                                    value={tForm.product}
                                    onChange={(e) => setTForm({ ...tForm, product: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="btn-primary" disabled={tSaving}>
                                {tSaving ? 'Guardando...' : '➕ Registrar aplicación'}
                            </button>
                        </form>

                    </div>
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700;900&family=Fraunces:ital,opsz,wght@1,9..144,700&display=swap');

/* ───────────────── VetPaw dueño visual refresh v2 ───────────────── */
.owner-cosmic-bg,
.dash-page,
.pets-page,
.appts-page,
.clinics-page,
.lostpets-page,
.history-page {
    background:
        linear-gradient(180deg, rgba(3, 10, 20, .72) 0%, rgba(5, 12, 28, .78) 42%, rgba(4, 9, 20, .86) 100%),
        url(${ownerBg}) center top / cover fixed no-repeat !important;
    position: relative;
    isolation: isolate;
}
.owner-cosmic-bg::before,
.dash-page::before,
.pets-page::before,
.appts-page::before,
.clinics-page::before,
.lostpets-page::before,
.history-page::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background:
        radial-gradient(circle at 15% 10%, rgba(54, 116, 255, .10), transparent 28%),
        radial-gradient(circle at 76% 88%, rgba(31, 95, 255, .15), transparent 32%),
        radial-gradient(circle at 92% 32%, rgba(76, 175, 80, .07), transparent 26%);
    opacity: .75;
}
.owner-cosmic-bg::after,
.dash-page::after,
.pets-page::after,
.appts-page::after,
.clinics-page::after,
.lostpets-page::after,
.history-page::after {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.025), transparent);
    opacity: .45;
}
.owner-title,
.dash-title-modern,
.pets-title,
.appts-title,
.hero-title,
.history-title {
    font-family: 'Plus Jakarta Sans', 'Nunito', sans-serif !important;
    font-style: normal !important;
    font-weight: 900 !important;
    letter-spacing: -1.3px !important;
    text-shadow: 0 10px 34px rgba(0,0,0,.25);
}
.owner-icon-badge {
    width: 52px;
    height: 52px;
    border-radius: 18px;
    display: inline-grid;
    place-items: center;
    background: linear-gradient(135deg, rgba(76,175,80,.16), rgba(255,152,0,.15));
    border: 1px solid rgba(255,255,255,.10);
    box-shadow: inset 0 0 26px rgba(255,255,255,.04), 0 12px 30px rgba(0,0,0,.25);
    color: #fff;
    vertical-align: middle;
}
.owner-icon-badge svg { width: 30px; height: 30px; display: block; }
.owner-icon-badge--image { overflow: hidden; }
.owner-title-icon-img { width: 38px; height: 38px; object-fit: contain; display: block; filter: drop-shadow(0 8px 16px rgba(0,0,0,.28)); }
.owner-hero-title-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }

 .owner-gradient-title,
.dash-title-modern,
.pets-title,
.appts-title,
.hero-title,
.history-main-title,
.history-title-main {
    background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 38%, #FFB300 72%, #FF9800 100%) !important;
    -webkit-background-clip: text !important;
    background-clip: text !important;
    color: transparent !important;
    -webkit-text-fill-color: transparent !important;
    filter:
        drop-shadow(1px 0 0 rgba(0,0,0,.82))
        drop-shadow(-1px 0 0 rgba(0,0,0,.82))
        drop-shadow(0 1px 0 rgba(0,0,0,.82))
        drop-shadow(0 -1px 0 rgba(0,0,0,.82))
        drop-shadow(0 3px 5px rgba(0,0,0,.36));
    text-shadow: none !important;
}
.paw-runner {
    font-size: 3rem;
    display: inline-block;
    animation: pawRun 1.35s ease-in-out infinite;
    transform-origin: center bottom;
}
@keyframes pawRun {
    0% { transform: translateX(-22px) translateY(0) rotate(-7deg); opacity: .55; }
    25% { transform: translateX(-8px) translateY(-5px) rotate(4deg); opacity: 1; }
    50% { transform: translateX(10px) translateY(0) rotate(-3deg); opacity: 1; }
    75% { transform: translateX(24px) translateY(-5px) rotate(5deg); opacity: .9; }
    100% { transform: translateX(42px) translateY(0) rotate(-6deg); opacity: .55; }
}


                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                .pets-page {
                    min-height: 100vh; background: transparent;
                    font-family: 'Nunito', sans-serif;
                    position: relative; overflow-x: hidden; padding-bottom: 60px;
                }
                .blob { position: fixed; border-radius: 50%; filter: blur(90px); opacity: 0.04; pointer-events: none; z-index:0; }
                .b1 { width: 500px; height: 500px; background: #ff6b6b; top: -100px; right: -100px; }
                .b2 { width: 400px; height: 400px; background: #ffd93d; bottom: -100px; left: -100px; }

                .pets-inner {
                    max-width: 1400px; margin: 0 auto;
                    padding: 90px 24px 32px; position: relative; z-index: 1;
                }

                /* ── Header ── */
                .pets-header {
                    display: flex; align-items: center; justify-content: space-between;
                    margin-bottom: 32px; flex-wrap: wrap; gap: 12px;
                }
                .pets-title {
                    font-family: 'Baloo 2', 'Nunito', sans-serif; font-size: 2.7rem; font-weight: 900;
                    font-style: normal; color: #fff; letter-spacing: -1.5px; margin: 0; line-height: 1;
                }
                .pets-subtitle { color: rgba(255,255,255,0.45); font-size: 0.9rem; margin-top: 4px; }

                /* ── Botones principales ── */
                .btn-primary {
                    background: linear-gradient(135deg, #4CAF50, #FF9800);
                    color: #fff; border: none; border-radius: 12px;
                    padding: 12px 22px; font-family: 'Nunito', sans-serif;
                    font-size: 0.95rem; font-weight: 900; cursor: pointer;
                    box-shadow: 0 4px 14px rgba(76,175,80,0.3);
                    transition: transform 0.15s, box-shadow 0.15s;
                    white-space: nowrap;
                }
                .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(76,175,80,0.5); }
                .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

                /* ── Estados ── */
                .loading-state, .empty-state {
                    text-align: center; padding: 80px 20px;
                    display: flex; flex-direction: column; align-items: center; gap: 16px;
                }
                .paw-spin { font-size: 3rem; display: block; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .loading-state p { color: rgba(255,255,255,0.4); }
                .empty-emoji { font-size: 5rem; }
                .empty-state h2 { font-family: 'Fraunces', serif; font-size: 1.6rem; font-style: italic; color: #fff; }
                .empty-state p { color: rgba(255,255,255,0.45); max-width: 340px; line-height: 1.6; }

                /* ── Lista de mascotas (panel ancho apilado) ── */
                .pets-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                /* ── Card ancha (panel) ── */
                .pet-row {
                    background: #16212f;
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 18px;
                    padding: 18px;
                    display: flex;
                    gap: 18px;
                    position: relative;
                    color: #fff;
                    font-family: 'Plus Jakarta Sans', 'Nunito', sans-serif;
                    transition: border-color 0.2s, transform 0.2s;
                }
                .pet-row:hover { border-color: rgba(76,175,80,0.25); }

                .pet-photo-side {
                    flex-shrink: 0;
                    width: 220px;
                    position: relative;
                    border-radius: 17px;
                }
                .pet-photo-side.birthday-photo-active {
                    padding: 5px;
                    background: linear-gradient(135deg, #4CAF50, #FFD54F, #FF9800, #4CAF50);
                    background-size: 260% 260%;
                    animation: birthdayFrameMove 4s ease infinite;
                    box-shadow: 0 0 0 5px rgba(255,213,79,.07), 0 16px 35px rgba(255,152,0,.2);
                }
                .pet-photo-side.birthday-photo-active .pet-row-photo { width: 210px; height: 210px; border-radius: 12px; }
                .pet-birthday-crown { position: absolute; z-index: 4; top: -29px; right: -18px; font-size: 49px; transform: rotate(14deg); filter: drop-shadow(0 8px 8px rgba(0,0,0,.45)); animation: birthdayCrownPet 1.9s ease-in-out infinite; }
                @keyframes birthdayFrameMove { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
                @keyframes birthdayCrownPet { 0%,100% { transform: rotate(12deg) translateY(0); } 50% { transform: rotate(17deg) translateY(-5px); } }
                .pet-row-photo {
                    width: 220px; height: 220px;
                    border-radius: 14px;
                    object-fit: cover;
                    background: #1b2a3d;
                    border: 1px solid rgba(255,255,255,0.06);
                }
                .pet-row-photo.placeholder {
                    display: flex; align-items: center; justify-content: center;
                }
                .pet-row-emoji { font-size: 4.5rem; line-height: 1; }

                .pet-info-side {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                /* Header: nombre + activo + menú */
                .pet-info-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 10px;
                }
                .pet-info-headleft {
                    display: flex; align-items: center; gap: 10px;
                    flex-wrap: wrap;
                }
                .pet-row-name {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    font-size: 1.6rem; font-weight: 800; color: #fff;
                    letter-spacing: -0.5px; line-height: 1.1;
                }
                .pet-active-badge {
                    background: rgba(76,175,80,0.15);
                    color: #66BB6A;
                    border: 1px solid rgba(76,175,80,0.3);
                    border-radius: 999px;
                    padding: 3px 10px;
                    font-size: 0.72rem;
                    font-weight: 700;
                    white-space: nowrap;
                }

                /* Menú "..." */
                .pet-menu-wrap { position: relative; flex-shrink: 0; }
                .pet-menu-btn {
                    background: linear-gradient(135deg, rgba(76,175,80,0.16), rgba(255,152,0,0.12));
                    border: 1px solid rgba(255,255,255,0.12);
                    color: rgba(255,255,255,0.82);
                    border-radius: 999px;
                    width: 40px; height: 34px;
                    cursor: pointer;
                    font-size: 1.15rem; font-weight: 900;
                    line-height: 1;
                    letter-spacing: 1px;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: inset 0 0 18px rgba(255,255,255,0.04), 0 8px 20px rgba(0,0,0,0.22);
                    transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, color 0.18s ease;
                }
                .pet-menu-btn:hover {
                    transform: translateY(-1px);
                    color: #fff;
                    border-color: rgba(76,175,80,0.38);
                    box-shadow: 0 12px 26px rgba(76,175,80,0.15), 0 8px 20px rgba(0,0,0,0.28);
                }
                .pet-menu {
                    position: absolute;
                    top: calc(100% + 10px);
                    right: 0;
                    background: linear-gradient(180deg, rgba(28,42,62,0.98), rgba(16,26,41,0.98));
                    border: 1px solid rgba(255,255,255,0.12);
                    border-radius: 16px;
                    box-shadow: 0 18px 46px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.06);
                    min-width: 178px;
                    overflow: hidden;
                    z-index: 30;
                    display: flex; flex-direction: column;
                    padding: 7px;
                    backdrop-filter: blur(12px);
                }
                .pet-menu::before {
                    content: "";
                    position: absolute;
                    top: -6px;
                    right: 18px;
                    width: 12px;
                    height: 12px;
                    transform: rotate(45deg);
                    background: rgba(28,42,62,0.98);
                    border-left: 1px solid rgba(255,255,255,0.12);
                    border-top: 1px solid rgba(255,255,255,0.12);
                }
                .pet-menu-item {
                    background: transparent; border: none;
                    color: rgba(255,255,255,0.9);
                    text-align: left;
                    padding: 11px 12px;
                    cursor: pointer;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    font-size: 0.9rem; font-weight: 800;
                    border-radius: 12px;
                    display: flex; align-items: center; gap: 10px;
                    transition: background 0.15s ease, transform 0.15s ease, color 0.15s ease;
                    position: relative;
                    z-index: 1;
                }
                .pet-menu-icon { width: 24px; height: 24px; display: inline-grid; place-items: center; border-radius: 8px; background: rgba(255,255,255,0.06); }
                .pet-menu-item:hover { background: rgba(76,175,80,0.13); color: #fff; transform: translateX(2px); }
                .pet-menu-item.danger { color: #ff9d9d; }
                .pet-menu-item.danger:hover { background: rgba(255,107,107,0.14); color: #ffb3b3; }

                .pet-birthday-badges { display: flex; flex-wrap: wrap; gap: 7px; }
                .pet-birthday-badge { display: inline-flex; align-items: center; gap: 6px; min-height: 31px; padding: 5px 9px; border-radius: 999px; border: 1px solid rgba(255,202,84,.25); background: linear-gradient(135deg,rgba(76,175,80,.12),rgba(255,152,0,.1)); color: rgba(255,255,255,.82); font-size: 10px; font-weight: 800; }
                .pet-birthday-badge b { font-size: 16px; line-height: 1; }
                .pet-birthday-badge small { color: #ffd675; font-size: 9px; }

                /* Especie · sexo */
                .pet-row-meta {
                    font-size: 0.88rem;
                    color: rgba(255,255,255,0.6);
                    display: flex; align-items: center; gap: 6px;
                    flex-wrap: wrap;
                }
                .pet-row-dot { opacity: 0.5; }

                /* Stat boxes (edad/peso/color) */
                .pet-stats-row {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                }
                .pet-stat-box {
                    background: #1b2a3d;
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 12px;
                    padding: 10px 12px;
                    display: flex; align-items: center; gap: 10px;
                    min-width: 0;
                }
                .pet-stat-icon {
                    font-size: 1.15rem; flex-shrink: 0;
                    width: 26px; height: 26px;
                    display: flex; align-items: center; justify-content: center;
                }
                .pet-stat-text { min-width: 0; overflow: hidden; }
                .pet-stat-value {
                    font-size: 0.92rem; font-weight: 700; color: #fff;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .pet-stat-label {
                    font-size: 0.7rem; color: rgba(255,255,255,0.45);
                    margin-top: 1px;
                }

                /* Chips (alimentación, hábitat, convivencia) */
                .pet-chips-row {
                    display: flex; flex-wrap: wrap; gap: 7px;
                }
                .pet-chip {
                    background: #1b2a3d;
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 999px;
                    padding: 6px 12px;
                    font-size: 0.8rem;
                    color: rgba(255,255,255,0.75);
                    display: inline-flex; align-items: center; gap: 6px;
                }

                .pet-chip--temperament {
                    padding-left: 7px;
                }
                .pet-temperament-chip-icon {
                    width: 24px;
                    height: 24px;
                    border-radius: 999px;
                    object-fit: cover;
                    filter: drop-shadow(0 2px 5px rgba(0,0,0,0.35));
                    flex-shrink: 0;
                }

                /* Alerta de alergias */
                .pet-alert {
                    background: rgba(255,217,61,0.08);
                    border: 1px solid rgba(255,217,61,0.25);
                    border-radius: 10px;
                    padding: 7px 11px;
                    font-size: 0.82rem;
                    color: #ffd93d;
                }

                /* Línea de vacunas */
                .pet-vaccines-line {
                    display: flex; align-items: center; gap: 7px;
                    font-size: 0.85rem;
                    color: rgba(255,255,255,0.65);
                }
                .pet-vac-ico { font-size: 0.95rem; }

                /* Botones de acción */
                .pet-actions-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 9px;
                    margin-top: 2px;
                }
                .pet-btn {
                    border-radius: 11px;
                    padding: 10px 14px;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
                    text-align: center;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .pet-btn-ghost {
                    background: transparent;
                    border: 1.5px solid rgba(102,187,106,0.5);
                    color: #66BB6A;
                }
                .pet-btn-ghost:hover { background: rgba(76,175,80,0.08); border-color: #66BB6A; }
                .pet-btn-grad {
                    background: linear-gradient(135deg, #4CAF50, #FF9800);
                    border: none;
                    color: #fff;
                    box-shadow: 0 4px 14px rgba(76,175,80,0.25);
                }
                .pet-btn-grad:hover { transform: translateY(-1px); box-shadow: 0 8px 22px rgba(76,175,80,0.35); }

                /* Tarjeta punteada "Agregar otra mascota" */
                .add-pet-cta {
                    background: transparent;
                    border: 1.5px dashed rgba(102,187,106,0.35);
                    border-radius: 18px;
                    padding: 18px 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    cursor: pointer;
                    color: #fff;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    text-align: left;
                    transition: border-color 0.2s, background 0.2s;
                    width: 100%;
                }
                .add-pet-cta:hover {
                    border-color: rgba(102,187,106,0.7);
                    background: rgba(76,175,80,0.04);
                }
                .add-pet-plus {
                    width: 48px; height: 48px;
                    border-radius: 50%;
                    background: rgba(76,175,80,0.12);
                    border: 1.5px solid rgba(102,187,106,0.4);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1.6rem; font-weight: 300;
                    color: #66BB6A;
                    flex-shrink: 0;
                }
                .add-pet-texts { flex: 1; min-width: 0; }
                .add-pet-title { font-size: 0.98rem; font-weight: 700; color: #fff; }
                .add-pet-sub { font-size: 0.84rem; color: rgba(255,255,255,0.5); margin-top: 2px; }
                .add-pet-cta-btn {
                    background: transparent;
                    border: 1.5px solid rgba(102,187,106,0.5);
                    color: #66BB6A;
                    border-radius: 11px;
                    padding: 9px 16px;
                    font-weight: 700;
                    font-size: 0.85rem;
                    white-space: nowrap;
                    flex-shrink: 0;
                }
                .add-pet-cta:hover .add-pet-cta-btn { background: rgba(76,175,80,0.08); }

                /* ── Historial de antiparasitarios ── */
                
.treatment-form-title{
    margin:18px 0 10px;
    padding-top:16px;
    border-top:1px solid rgba(255,255,255,.10);
    color:#55d66b;
    font-weight:900;
    font-size:1.05rem;
}
.treatment-history { margin-top: 22px; display: flex; flex-direction: column; gap: 16px; }
                .treatment-group h4 {
                    font-family: 'Nunito', sans-serif; font-size: 0.95rem; font-weight: 700;
                    color: #fff; margin-bottom: 8px;
                }
                .treatment-group h4 span { color: #66BB6A; font-weight: 700; }
                .treatment-empty { font-size: 0.82rem; color: rgba(255,255,255,0.35); padding: 4px 0 2px; }
                .treatment-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
                .treatment-list li {
                    display: flex; align-items: center; justify-content: space-between; gap: 10px;
                    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 10px; padding: 9px 12px; font-size: 0.86rem; color: rgba(255,255,255,0.85);
                }
                .treatment-prod { color: rgba(255,255,255,0.5); }
                .treatment-del {
                    background: rgba(255,107,107,0.12); border: 1px solid rgba(255,107,107,0.3);
                    border-radius: 8px; padding: 4px 8px; cursor: pointer; font-size: 0.85rem;
                    transition: background 0.2s; flex-shrink: 0;
                }
                .treatment-del:hover { background: rgba(255,107,107,0.25); }
                .btn-outline {
                    background: linear-gradient(135deg, #4CAF50, #FF9800); border: none;
                    color: #fff; border-radius: 10px; padding: 10px;
                    font-family: 'Nunito', sans-serif; font-size: 0.88rem; font-weight: 700;
                    cursor: pointer; box-shadow: 0 4px 14px rgba(76,175,80,0.3);
                    transition: opacity 0.15s; margin-top: 4px; width: 100%; text-align: center;
                }
                .btn-outline:hover { opacity: 0.9; }

                /* ── Delete confirm ── */
                .delete-confirm {
                    position: absolute; inset: 0; border-radius: 20px;
                    background: rgba(26,26,46,0.95); backdrop-filter: blur(8px);
                    display: flex; flex-direction: column; align-items: center;
                    justify-content: center; gap: 16px; padding: 20px;
                }
                .delete-confirm p { color: #fff; font-size: 0.95rem; text-align: center; }
                .delete-confirm strong { color: #ff6b6b; }
                .delete-btns { display: flex; gap: 10px; }
                .btn-cancel {
                    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
                    color: rgba(255,255,255,0.6); border-radius: 10px; padding: 8px 16px;
                    font-family: 'Nunito', sans-serif; font-weight: 700; cursor: pointer;
                }
                .btn-danger {
                    background: linear-gradient(135deg, #ff6b6b, #ff4a4a); border: none;
                    color: #fff; border-radius: 10px; padding: 8px 16px;
                    font-family: 'Nunito', sans-serif; font-weight: 700; cursor: pointer;
                }

                /* ── Modal ── */
                .modal-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.7);
                    backdrop-filter: blur(6px); z-index: 1000;
                    display: flex; align-items: center; justify-content: center;
                    padding: 16px;
                }
                .modal {
                    background: #1e1e35; border: 1px solid rgba(255,255,255,0.10);
                    border-radius: 24px; padding: 28px; width: 100%; max-width: 560px;
                    max-height: 90vh; overflow-y: auto;
                    animation: modalIn 0.3s cubic-bezier(.22,.68,0,1.2) both;
                }
                @keyframes modalIn {
                    from { opacity: 0; transform: scale(0.95) translateY(20px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
                .modal-header {
                    display: flex; justify-content: space-between;
                    align-items: center; margin-bottom: 20px; gap: 10px;
                }
                .modal-header h2 {
                    font-family: 'Fraunces', serif; font-size: 1.4rem;
                    font-style: italic; color: #fff; flex: 1; min-width: 0;
                }
                .modal-close {
                    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
                    color: rgba(255,255,255,0.5); border-radius: 8px; padding: 6px 10px;
                    cursor: pointer; font-size: 0.9rem; transition: background 0.2s;
                    flex-shrink: 0; min-width: 36px; min-height: 36px;
                    display: flex; align-items: center; justify-content: center;
                }
                .modal-close:hover { background: rgba(255,107,107,0.15); color: #ff6b6b; }
                .form-error {
                    background: rgba(255,107,107,0.15); border: 1px solid rgba(255,107,107,0.4);
                    color: #ff9999; padding: 10px 14px; border-radius: 10px;
                    font-size: 0.86rem; margin-bottom: 16px;
                }

                /* ── Formulario ── */
                .pet-form { display: flex; flex-direction: column; gap: 14px; }
                .form-row { display: flex; gap: 12px; }
                .form-group { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; }
                .form-group.full { flex: none; }
                .form-group label {
                    font-size: 0.78rem; font-weight: 700; color: rgba(255,255,255,0.5);
                    text-transform: uppercase; letter-spacing: 0.06em;
                }
                .form-group input, .form-group select, .form-group textarea {
                    background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.10);
                    border-radius: 10px; color: #fff; padding: 11px 14px;
                    font-family: 'Nunito', sans-serif; font-size: 0.92rem;
                    outline: none; transition: border-color 0.2s, box-shadow 0.2s;
                    width: 100%;
                }
                .form-group select { cursor: pointer; appearance: none; }
                .form-group select option { background: #1a1a2e; }

                .temperament-picker {
                    position: relative;
                    z-index: 5;
                }
                .temperament-trigger {
                    width: 100%;
                    min-height: 52px;
                    background: rgba(255,255,255,0.06);
                    border: 1.5px solid rgba(255,255,255,0.10);
                    border-radius: 10px;
                    color: #fff;
                    padding: 8px 12px;
                    font-family: 'Nunito', sans-serif;
                    font-size: 0.92rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
                    text-align: left;
                }
                .temperament-trigger:hover,
                .temperament-trigger:focus {
                    border-color: #4CAF50;
                    box-shadow: 0 0 0 3px rgba(76,175,80,0.12);
                    outline: none;
                }
                .temperament-placeholder { color: rgba(255,255,255,0.65); font-weight: 600; }
                .temperament-trigger-icon,
                .temperament-option-icon {
                    width: 34px;
                    height: 34px;
                    border-radius: 999px;
                    object-fit: cover;
                    flex-shrink: 0;
                    filter: drop-shadow(0 3px 8px rgba(0,0,0,0.35));
                }
                .temperament-chevron {
                    margin-left: auto;
                    color: rgba(255,255,255,0.55);
                    font-size: 1.15rem;
                    line-height: 1;
                }
                .temperament-menu {
                    position: absolute;
                    left: 0;
                    right: 0;
                    top: calc(100% + 7px);
                    background: #16162a;
                    border: 1px solid rgba(76,175,80,0.36);
                    border-radius: 14px;
                    padding: 8px;
                    box-shadow: 0 18px 40px rgba(0,0,0,0.45);
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 7px;
                    max-height: 280px;
                    overflow: auto;
                    z-index: 70;
                }
                .temperament-option {
                    background: rgba(255,255,255,0.045);
                    border: 1px solid rgba(255,255,255,0.07);
                    color: rgba(255,255,255,0.88);
                    border-radius: 12px;
                    padding: 7px 9px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    font-family: 'Nunito', sans-serif;
                    font-size: 0.9rem;
                    font-weight: 800;
                    transition: transform 0.15s, border-color 0.15s, background 0.15s;
                    text-align: left;
                }
                .temperament-option:hover,
                .temperament-option.active {
                    background: rgba(76,175,80,0.12);
                    border-color: rgba(76,175,80,0.42);
                    transform: translateY(-1px);
                }
                .form-group input::placeholder, .form-group textarea::placeholder { color: rgba(255,255,255,0.2); }
                .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
                    border-color: #4CAF50; box-shadow: 0 0 0 3px rgba(76,175,80,0.12);
                }
                .form-group textarea { resize: vertical; }

                /* ── Foto ── */
                .photo-upload { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
                .photo-preview { width: 110px; height: 110px; border-radius: 12px; object-fit: contain; object-position: center; background: #07111f; border: 2px solid rgba(255,107,107,0.3); }
                .photo-label {
                    background: rgba(255,255,255,0.06); border: 1.5px dashed rgba(255,255,255,0.2);
                    border-radius: 10px; padding: 10px 18px; color: rgba(255,255,255,0.5);
                    font-size: 0.88rem; font-weight: 700; cursor: pointer;
                    transition: border-color 0.2s, color 0.2s;
                }
                .photo-label:hover { border-color: rgba(76,175,80,0.4); color: #4CAF50; }
                .photo-input-hidden { display: none; }

                /* ── Checkboxes ── */
                .form-check { display: flex; align-items: center; gap: 10px; }
                .form-check input { accent-color: #4CAF50; width: 18px; height: 18px; flex-shrink: 0; }
                .form-check label { color: rgba(255,255,255,0.7); font-size: 0.9rem; cursor: pointer; }

                /* ── Acciones del form ── */
                .form-actions { display: flex; gap: 10px; margin-top: 8px; justify-content: flex-end; }
                .btn-ghost {
                    background: transparent; border: 1.5px solid rgba(255,255,255,0.12);
                    color: rgba(255,255,255,0.5); border-radius: 10px; padding: 11px 20px;
                    font-family: 'Nunito', sans-serif; font-weight: 700; cursor: pointer;
                    transition: border-color 0.2s;
                }
                .btn-ghost:hover { border-color: rgba(255,255,255,0.25); }

                /* ══════════════════════════════
                RESPONSIVE — TABLET (≤900px)
                ══════════════════════════════ */
                @media (max-width: 900px) {
                    .pet-row { flex-direction: column; gap: 14px; }
                    .pet-photo-side { width: 100%; }
                    .pet-row-photo { width: 100%; height: 220px; }
                    .pet-photo-side.birthday-photo-active .pet-row-photo { width: 100%; height: 210px; }
                    .pet-actions-row { grid-template-columns: 1fr; }
                    .add-pet-cta { flex-wrap: wrap; }
                }

                /* ══════════════════════════════
                RESPONSIVE — MOBILE (≤600px)
                ══════════════════════════════ */
                @media (max-width: 600px) {
                    .pets-inner { padding: 76px 14px 24px; }

                    /* Header */
                    .pets-header { flex-direction: column; align-items: flex-start; margin-bottom: 20px; }
                    .pets-title { font-size: 1.5rem; }
                    .pets-header .btn-primary { width: 100%; text-align: center; }

                    /* Lista */
                    .pets-list { gap: 14px; }

                    /* Card */
                    .pet-row { padding: 16px 14px; border-radius: 16px; gap: 12px; }
                    .pet-row-photo { height: 200px; }
                    .pet-row-name { font-size: 1.35rem; }
                    .pet-row-emoji { font-size: 3.6rem; }
                    .pet-stats-row { gap: 7px; }
                    .pet-stat-box { padding: 9px 11px; gap: 8px; }
                    .pet-stat-icon { font-size: 1.05rem; width: 24px; height: 24px; }
                    .pet-stat-value { font-size: 0.85rem; }
                    .pet-stat-label { font-size: 0.68rem; }

                    /* Add CTA */
                    .add-pet-cta { padding: 16px 14px; gap: 12px; }
                    .add-pet-cta-btn { width: 100%; text-align: center; }

                    /* Empty state */
                    .empty-state { padding: 48px 16px; }
                    .empty-emoji { font-size: 3.5rem; }
                    .empty-state h2 { font-size: 1.3rem; }

                    /* Modal: ocupa toda la pantalla en mobile */
                    .modal-overlay { padding: 0; align-items: flex-end; }
                    .modal {
                        border-radius: 24px 24px 0 0; padding: 24px 18px;
                        max-height: 92vh; border-bottom: none;
                    }
                    .modal-header h2 { font-size: 1.15rem; }

                    .temperament-menu { grid-template-columns: 1fr; max-height: 240px; }
                    .temperament-trigger-icon, .temperament-option-icon { width: 30px; height: 30px; }

                    /* Formulario: todos los fields en columna */
                    .form-row { flex-direction: column; gap: 10px; }
                    .form-actions { flex-direction: column-reverse; gap: 8px; }
                    .form-actions .btn-ghost,
                    .form-actions .btn-primary { width: 100%; text-align: center; padding: 13px; }
                }

                /* ══════════════════════════════
                RESPONSIVE — MOBILE XS (≤380px)
                ══════════════════════════════ */
                @media (max-width: 380px) {
                    .pets-inner { padding: 72px 10px 24px; }
                    .pet-row { padding: 14px 12px; }
                    .pet-row-name { font-size: 1.3rem; }
                    .pets-title { font-size: 1.3rem; }
                    .pet-stats-row { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}
