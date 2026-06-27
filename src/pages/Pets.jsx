import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPets, createPet, updatePet, deletePet, createTreatment, deleteTreatment } from '../services/api';

const TREATMENT_TYPES = [
    { value: 'deworming', label: 'Desparasitación' },
    { value: 'flea', label: 'Pastilla antipulgas' },
    { value: 'pipette', label: 'Pipeta' },
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
    bird: '🦜',
    pajaro: '🦜',
    rabbit: '🐰',
    conejo: '🐰',
    fish: '🐟',
    pez: '🐟',
    hamster: '🐹',
    turtle: '🐢',
    tortuga: '🐢',
};

const petEmoji = (species) =>
    SPECIES_EMOJI[(species || '').toLowerCase()] || '🐾';

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
};

export default function Pets() {
    const navigate = useNavigate();
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPet, setEditingPet] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);

    // ── Tratamientos preventivos ──
    const [treatmentPetId, setTreatmentPetId] = useState(null);
    const [tForm, setTForm] = useState({ treatment_type: 'deworming', date_applied: todayISO(), product: '' });
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
        setPhotoPreview(null);
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
        });
        setPhotoPreview(pet.photo || null);
        setError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingPet(null);
        setPhotoPreview(null);
        setError('');
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm({ ...form, photo: file });
            setPhotoPreview(URL.createObjectURL(file));
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
        setTForm({ treatment_type: 'deworming', date_applied: todayISO(), product: '' });
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
            await createTreatment({
                pet: treatmentPetId,
                treatment_type: tForm.treatment_type,
                date_applied: tForm.date_applied,
                product: tForm.product.trim(),
            });
            await fetchPets();
            setTForm({ treatment_type: tForm.treatment_type, date_applied: todayISO(), product: '' });
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
                        <h1 className="pets-title">🐾 Mis mascotas</h1>
                        <p className="pets-subtitle">
                            {pets.length === 0
                                ? 'Todavía no registraste ninguna mascota.'
                                : `Tenés ${pets.length} mascota${pets.length > 1 ? 's' : ''} registrada${pets.length > 1 ? 's' : ''}.`}
                        </p>
                    </div>
                    <button className="btn-primary" onClick={openNew}>
                        + Agregar mascota
                    </button>
                </header>

                {loading && (
                    <div className="loading-state">
                        <span className="paw-spin">🐾</span>
                        <p>Cargando mascotas...</p>
                    </div>
                )}

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
                                <div className="pet-photo-side">
                                    {pet.photo ? (
                                        <img
                                            src={pet.photo}
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
                                                        ✏️ Editar
                                                    </button>
                                                    <button
                                                        className="pet-menu-item danger"
                                                        onClick={() => { setOpenMenuId(null); setDeleteConfirm(pet.id); }}
                                                    >
                                                        🗑️ Eliminar
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

                                    {/* Chips reales: alimentación, hábitat, convivencia */}
                                    {(pet.feeding || pet.habitat || pet.lives_with_animals) && (
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
                                                <span className="pet-chip">🐾 Convive con otros animales</span>
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
                                            onClick={() => navigate('/history')}
                                        >
                                            📋 Ver historial
                                        </button>
                                        <button
                                            className="pet-btn pet-btn-grad"
                                            onClick={() => navigate(`/appointments/new?pet=${pet.id}`)}
                                        >
                                            📅 Sacar turno
                                        </button>
                                        <button
                                            className="pet-btn pet-btn-grad"
                                            onClick={() => openTreatments(pet)}
                                        >
                                            🛡️ Antiparasitarios
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
                                        <option value="bird">🦜 Ave</option>
                                        <option value="rabbit">🐰 Conejo</option>
                                        <option value="hamster">🐹 Hámster</option>
                                        <option value="turtle">🐢 Tortuga</option>
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
                                    🐾 Convive con otros animales
                                </label>
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
                                            accept="image/*"
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
                                            : 'Crear mascota 🐾'}
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

                        {/* Cargar nueva aplicación */}
                        <form className="pet-form" onSubmit={handleAddTreatment}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Producto</label>
                                    <select
                                        value={tForm.treatment_type}
                                        onChange={(e) => setTForm({ ...tForm, treatment_type: e.target.value })}
                                    >
                                        {TREATMENT_TYPES.map((t) => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
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

                        {/* Historial agrupado por tipo */}
                        <div className="treatment-history">
                            {TREATMENT_TYPES.map((type) => {
                                const items = (treatmentPet.treatments || [])
                                    .filter((t) => t.treatment_type === type.value);
                                return (
                                    <div key={type.value} className="treatment-group">
                                        <h4>{type.label} <span>({items.length})</span></h4>
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
                    </div>
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Fraunces:ital,opsz,wght@1,9..144,700&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                .pets-page {
                    min-height: 100vh; background: #1a1a2e;
                    font-family: 'Nunito', sans-serif;
                    position: relative; overflow-x: hidden; padding-bottom: 60px;
                }
                .blob { position: fixed; border-radius: 50%; filter: blur(90px); opacity: 0.08; pointer-events: none; }
                .b1 { width: 500px; height: 500px; background: #ff6b6b; top: -100px; right: -100px; }
                .b2 { width: 400px; height: 400px; background: #ffd93d; bottom: -100px; left: -100px; }

                .pets-inner {
                    max-width: 1100px; margin: 0 auto;
                    padding: 32px 24px; position: relative; z-index: 1;
                }

                /* ── Header ── */
                .pets-header {
                    display: flex; align-items: center; justify-content: space-between;
                    margin-bottom: 32px; flex-wrap: wrap; gap: 12px;
                }
                .pets-title {
                    font-family: 'Fraunces', serif; font-size: 2rem; font-weight: 700;
                    font-style: italic; color: #fff; letter-spacing: -1px;
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
                .paw-spin { font-size: 3rem; animation: spin 1s linear infinite; display: block; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .loading-state p { color: rgba(255,255,255,0.4); }
                .empty-emoji { font-size: 5rem; }
                .empty-state h2 { font-family: 'Fraunces', serif; font-size: 1.6rem; font-style: italic; color: #fff; }
                .empty-state p { color: rgba(255,255,255,0.45); max-width: 340px; line-height: 1.6; }

                /* ── Lista de mascotas (panel ancho apilado) ── */
                .pets-list {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                /* ── Card ancha (panel) ── */
                .pet-row {
                    background: #16212f;
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 20px;
                    padding: 24px;
                    display: flex;
                    gap: 24px;
                    position: relative;
                    color: #fff;
                    font-family: 'Plus Jakarta Sans', 'Nunito', sans-serif;
                    transition: border-color 0.2s, transform 0.2s;
                }
                .pet-row:hover { border-color: rgba(76,175,80,0.25); }

                .pet-photo-side {
                    flex-shrink: 0;
                    width: 280px;
                }
                .pet-row-photo {
                    width: 280px; height: 280px;
                    border-radius: 16px;
                    object-fit: cover;
                    background: #1b2a3d;
                    border: 1px solid rgba(255,255,255,0.06);
                }
                .pet-row-photo.placeholder {
                    display: flex; align-items: center; justify-content: center;
                }
                .pet-row-emoji { font-size: 5.5rem; line-height: 1; }

                .pet-info-side {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }

                /* Header: nombre + activo + menú */
                .pet-info-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 12px;
                }
                .pet-info-headleft {
                    display: flex; align-items: center; gap: 12px;
                    flex-wrap: wrap;
                }
                .pet-row-name {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    font-size: 2rem; font-weight: 800; color: #fff;
                    letter-spacing: -0.5px; line-height: 1.1;
                }
                .pet-active-badge {
                    background: rgba(76,175,80,0.15);
                    color: #66BB6A;
                    border: 1px solid rgba(76,175,80,0.3);
                    border-radius: 999px;
                    padding: 4px 12px;
                    font-size: 0.78rem;
                    font-weight: 700;
                    white-space: nowrap;
                }

                /* Menú "..." */
                .pet-menu-wrap { position: relative; flex-shrink: 0; }
                .pet-menu-btn {
                    background: #1b2a3d;
                    border: 1px solid rgba(255,255,255,0.08);
                    color: rgba(255,255,255,0.7);
                    border-radius: 10px;
                    width: 40px; height: 40px;
                    cursor: pointer;
                    font-size: 1.1rem; font-weight: 700;
                    display: flex; align-items: center; justify-content: center;
                    transition: background 0.2s, color 0.2s;
                }
                .pet-menu-btn:hover { background: #213348; color: #fff; }
                .pet-menu {
                    position: absolute;
                    top: calc(100% + 6px);
                    right: 0;
                    background: #1b2a3d;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    box-shadow: 0 12px 32px rgba(0,0,0,0.4);
                    min-width: 160px;
                    overflow: hidden;
                    z-index: 10;
                    display: flex; flex-direction: column;
                }
                .pet-menu-item {
                    background: transparent; border: none;
                    color: rgba(255,255,255,0.85);
                    text-align: left;
                    padding: 11px 14px;
                    cursor: pointer;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    font-size: 0.9rem; font-weight: 600;
                    transition: background 0.15s;
                }
                .pet-menu-item:hover { background: rgba(255,255,255,0.06); }
                .pet-menu-item.danger { color: #ff8888; }
                .pet-menu-item.danger:hover { background: rgba(255,107,107,0.12); }

                /* Especie · sexo */
                .pet-row-meta {
                    font-size: 0.95rem;
                    color: rgba(255,255,255,0.6);
                    display: flex; align-items: center; gap: 6px;
                    flex-wrap: wrap;
                }
                .pet-row-dot { opacity: 0.5; }

                /* Stat boxes (edad/peso/color) */
                .pet-stats-row {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                }
                .pet-stat-box {
                    background: #1b2a3d;
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 14px;
                    padding: 14px 16px;
                    display: flex; align-items: center; gap: 12px;
                    min-width: 0;
                }
                .pet-stat-icon {
                    font-size: 1.4rem; flex-shrink: 0;
                    width: 32px; height: 32px;
                    display: flex; align-items: center; justify-content: center;
                }
                .pet-stat-text { min-width: 0; overflow: hidden; }
                .pet-stat-value {
                    font-size: 1rem; font-weight: 700; color: #fff;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .pet-stat-label {
                    font-size: 0.75rem; color: rgba(255,255,255,0.45);
                    margin-top: 2px;
                }

                /* Chips (alimentación, hábitat, convivencia) */
                .pet-chips-row {
                    display: flex; flex-wrap: wrap; gap: 8px;
                }
                .pet-chip {
                    background: #1b2a3d;
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 999px;
                    padding: 7px 14px;
                    font-size: 0.85rem;
                    color: rgba(255,255,255,0.75);
                    display: inline-flex; align-items: center; gap: 6px;
                }

                /* Alerta de alergias */
                .pet-alert {
                    background: rgba(255,217,61,0.08);
                    border: 1px solid rgba(255,217,61,0.25);
                    border-radius: 10px;
                    padding: 8px 12px;
                    font-size: 0.85rem;
                    color: #ffd93d;
                }

                /* Línea de vacunas */
                .pet-vaccines-line {
                    display: flex; align-items: center; gap: 8px;
                    font-size: 0.9rem;
                    color: rgba(255,255,255,0.65);
                }
                .pet-vac-ico { font-size: 1rem; }

                /* Botones de acción */
                .pet-actions-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 10px;
                    margin-top: 4px;
                }
                .pet-btn {
                    border-radius: 12px;
                    padding: 13px 16px;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    font-size: 0.9rem;
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
                    border-radius: 20px;
                    padding: 22px 24px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
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
                    width: 56px; height: 56px;
                    border-radius: 50%;
                    background: rgba(76,175,80,0.12);
                    border: 1.5px solid rgba(102,187,106,0.4);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1.8rem; font-weight: 300;
                    color: #66BB6A;
                    flex-shrink: 0;
                }
                .add-pet-texts { flex: 1; min-width: 0; }
                .add-pet-title { font-size: 1.05rem; font-weight: 700; color: #fff; }
                .add-pet-sub { font-size: 0.88rem; color: rgba(255,255,255,0.5); margin-top: 2px; }
                .add-pet-cta-btn {
                    background: transparent;
                    border: 1.5px solid rgba(102,187,106,0.5);
                    color: #66BB6A;
                    border-radius: 12px;
                    padding: 11px 18px;
                    font-weight: 700;
                    font-size: 0.9rem;
                    white-space: nowrap;
                    flex-shrink: 0;
                }
                .add-pet-cta:hover .add-pet-cta-btn { background: rgba(76,175,80,0.08); }

                /* ── Historial de antiparasitarios ── */
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
                .form-group input::placeholder, .form-group textarea::placeholder { color: rgba(255,255,255,0.2); }
                .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
                    border-color: #4CAF50; box-shadow: 0 0 0 3px rgba(76,175,80,0.12);
                }
                .form-group textarea { resize: vertical; }

                /* ── Foto ── */
                .photo-upload { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
                .photo-preview { width: 80px; height: 80px; border-radius: 12px; object-fit: cover; border: 2px solid rgba(255,107,107,0.3); }
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
                    .pet-row { flex-direction: column; gap: 18px; }
                    .pet-photo-side { width: 100%; }
                    .pet-row-photo { width: 100%; height: 260px; }
                    .pet-actions-row { grid-template-columns: 1fr; }
                    .add-pet-cta { flex-wrap: wrap; }
                }

                /* ══════════════════════════════
                RESPONSIVE — MOBILE (≤600px)
                ══════════════════════════════ */
                @media (max-width: 600px) {
                    .pets-inner { padding: 16px 14px; }

                    /* Header */
                    .pets-header { flex-direction: column; align-items: flex-start; margin-bottom: 20px; }
                    .pets-title { font-size: 1.5rem; }
                    .pets-header .btn-primary { width: 100%; text-align: center; }

                    /* Lista */
                    .pets-list { gap: 14px; }

                    /* Card */
                    .pet-row { padding: 18px 16px; border-radius: 16px; gap: 14px; }
                    .pet-row-photo { height: 220px; }
                    .pet-row-name { font-size: 1.5rem; }
                    .pet-row-emoji { font-size: 4rem; }
                    .pet-stats-row { gap: 8px; }
                    .pet-stat-box { padding: 10px 12px; gap: 8px; }
                    .pet-stat-icon { font-size: 1.2rem; width: 26px; height: 26px; }
                    .pet-stat-value { font-size: 0.88rem; }
                    .pet-stat-label { font-size: 0.7rem; }

                    /* Add CTA */
                    .add-pet-cta { padding: 18px 16px; gap: 14px; }
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
                    .pets-inner { padding: 12px 10px; }
                    .pet-row { padding: 14px 12px; }
                    .pet-row-name { font-size: 1.3rem; }
                    .pets-title { font-size: 1.3rem; }
                    .pet-stats-row { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}
