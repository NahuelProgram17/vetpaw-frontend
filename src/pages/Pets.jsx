import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPets, createPet, updatePet, deletePet } from '../services/api';

const SPECIES_EMOJI = {
    dog: '🐶', perro: '🐶', cat: '🐱', gato: '🐱',
    bird: '🦜', pajaro: '🦜', rabbit: '🐰', conejo: '🐰',
    fish: '🐟', pez: '🐟', hamster: '🐹', turtle: '🐢', tortuga: '🐢',
};

const petEmoji = (species) => SPECIES_EMOJI[(species || '').toLowerCase()] || '🐾';

const EMPTY_FORM = {
    name: '', species: 'dog', breed: '', sex: 'male',
    birth_date: '', weight: '', color: '', microchip: '',
    allergies: '', notes: '', is_neutered: false, photo: null,
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

    useEffect(() => { fetchPets(); }, []);

    const fetchPets = async () => {
        try {
            const data = await getPets();
            setPets(data.results ?? data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
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
            name: pet.name || '', species: pet.species || 'dog',
            breed: pet.breed || '', sex: pet.sex || 'male',
            birth_date: pet.birth_date || '', weight: pet.weight || '',
            color: pet.color || '', microchip: pet.microchip || '',
            allergies: pet.allergies || '', notes: pet.notes || '',
            is_neutered: pet.is_neutered || false, photo: null,
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
        if (!form.name) { setError('El nombre es obligatorio.'); return; }
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
            setError(data ? Object.values(data).flat().join(' ') : 'Error al guardar.');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        try {
            await deletePet(id);
            setPets(pets.filter((p) => p.id !== id));
            setDeleteConfirm(null);
        } catch (e) { console.error(e); }
    };

    const calcAge = (birth_date) => {
        if (!birth_date) return null;
        const diff = Date.now() - new Date(birth_date).getTime();
        const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
        if (years < 1) {
            const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
            return months <= 0 ? 'Recién nacido' : `${months} mes${months > 1 ? 'es' : ''}`;
        }
        return `${years} año${years > 1 ? 's' : ''}`;
    };

    return (
        <div className="pets-page">
            <div className="blob b1" /><div className="blob b2" />
            <div className="pets-inner">
                <header className="pets-header">
                    <div>
                        <h1 className="pets-title">🐾 Mis mascotas</h1>
                        <p className="pets-subtitle">
                            {pets.length === 0 ? 'Todavía no registraste ninguna mascota.'
                                : `Tenés ${pets.length} mascota${pets.length > 1 ? 's' : ''} registrada${pets.length > 1 ? 's' : ''}.`}
                        </p>
                    </div>
                    <button className="btn-primary" onClick={openNew}>+ Agregar mascota</button>
                </header>

                {loading && <div className="loading-state"><span className="paw-spin">🐾</span><p>Cargando mascotas...</p></div>}

                {!loading && pets.length === 0 && (
                    <div className="empty-state">
                        <span className="empty-emoji">🐶</span>
                        <h2>¡Tu familia peluda te espera!</h2>
                        <p>Registrá tu primera mascota para gestionar sus turnos y vacunas.</p>
                        <button className="btn-primary" onClick={openNew}>+ Agregar mascota</button>
                    </div>
                )}

                {!loading && pets.length > 0 && (
                    <div className="pets-grid">
                        {pets.map((pet) => (
                            <div key={pet.id} className="pet-card">
                                <div className="pet-card-top">
                                    <div className="pet-avatar-lg">
                                        {pet.photo
                                            ? <img src={pet.photo} alt={pet.name} className="pet-photo" />
                                            : petEmoji(pet.species)
                                        }
                                    </div>
                                    <div className="pet-card-actions">
                                        <button className="btn-icon" onClick={() => openEdit(pet)} title="Editar">✏️</button>
                                        <button className="btn-icon danger" onClick={() => setDeleteConfirm(pet.id)} title="Eliminar">🗑️</button>
                                    </div>
                                </div>
                                <h3 className="pet-card-name">{pet.name}</h3>
                                <p className="pet-card-species">{pet.species_display || pet.species}</p>
                                <div className="pet-card-info">
                                    {pet.breed && <span className="pet-tag">🦴 {pet.breed}</span>}
                                    {pet.sex && <span className="pet-tag">{pet.sex === 'male' ? '♂ Macho' : '♀ Hembra'}</span>}
                                    {pet.birth_date && <span className="pet-tag">🎂 {calcAge(pet.birth_date)}</span>}
                                    {pet.weight && <span className="pet-tag">⚖️ {pet.weight} kg</span>}
                                    {pet.color && <span className="pet-tag">🎨 {pet.color}</span>}
                                    {pet.is_neutered && <span className="pet-tag neutered">✂️ Castrado/a</span>}
                                </div>
                                {pet.allergies && <div className="pet-alert">⚠️ Alergias: {pet.allergies}</div>}
                                {pet.vaccines && pet.vaccines.length > 0 && (
                                    <div className="pet-vaccines">💉 {pet.vaccines.length} vacuna{pet.vaccines.length > 1 ? 's' : ''} registrada{pet.vaccines.length > 1 ? 's' : ''}</div>
                                )}
                                <button className="btn-outline" onClick={() => navigate(`/appointments/new?pet=${pet.id}`)}>📅 Sacar turno</button>
                                {deleteConfirm === pet.id && (
                                    <div className="delete-confirm">
                                        <p>¿Eliminar a <strong>{pet.name}</strong>?</p>
                                        <div className="delete-btns">
                                            <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
                                            <button className="btn-danger" onClick={() => handleDelete(pet.id)}>Eliminar</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingPet ? `Editar a ${editingPet.name}` : 'Nueva mascota'}</h2>
                            <button className="modal-close" onClick={closeModal}>✕</button>
                        </div>
                        {error && <div className="form-error">⚠️ {error}</div>}
                        <form onSubmit={handleSubmit} className="pet-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nombre *</label>
                                    <input name="name" placeholder="Luna" value={form.name} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Especie</label>
                                    <select name="species" value={form.species} onChange={handleChange}>
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
                                    <input name="breed" placeholder="Labrador" value={form.breed} onChange={handleChange} />
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
                                    <input name="birth_date" type="date" value={form.birth_date} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Peso (kg)</label>
                                    <input name="weight" type="number" step="0.1" placeholder="5.2" value={form.weight} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Color</label>
                                    <input name="color" placeholder="Marrón y blanco" value={form.color} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Microchip</label>
                                    <input name="microchip" placeholder="N° de microchip" value={form.microchip} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="form-group full">
                                <label>Alergias</label>
                                <input name="allergies" placeholder="Ej: Polen, pollo..." value={form.allergies} onChange={handleChange} />
                            </div>
                            <div className="form-group full">
                                <label>Notas adicionales</label>
                                <textarea name="notes" placeholder="Comportamiento, medicación habitual..." value={form.notes} onChange={handleChange} rows={3} />
                            </div>

                            {/* Foto */}
                            <div className="form-group full">
                                <label>Foto</label>
                                <div className="photo-upload">
                                    {photoPreview && (
                                        <img src={photoPreview} alt="preview" className="photo-preview" />
                                    )}
                                    <label className="photo-label">
                                        📷 {photoPreview ? 'Cambiar foto' : 'Subir foto'}
                                        <input type="file" accept="image/*" onChange={handlePhotoChange} className="photo-input-hidden" />
                                    </label>
                                </div>
                            </div>

                            <div className="form-check">
                                <input type="checkbox" id="is_neutered" name="is_neutered" checked={form.is_neutered} onChange={handleChange} />
                                <label htmlFor="is_neutered">✂️ Castrado/a</label>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-ghost" onClick={closeModal}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? 'Guardando...' : editingPet ? 'Guardar cambios' : 'Crear mascota 🐾'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Fraunces:ital,opsz,wght@1,9..144,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .pets-page { min-height: 100vh; background: #1a1a2e; font-family: 'Nunito', sans-serif; position: relative; overflow-x: hidden; padding-bottom: 60px; }
        .blob { position: fixed; border-radius: 50%; filter: blur(90px); opacity: 0.08; pointer-events: none; }
        .b1 { width: 500px; height: 500px; background: #ff6b6b; top: -100px; right: -100px; }
        .b2 { width: 400px; height: 400px; background: #ffd93d; bottom: -100px; left: -100px; }
        .pets-inner { max-width: 1100px; margin: 0 auto; padding: 32px 24px; position: relative; z-index: 1; }
        .pets-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; flex-wrap: wrap; gap: 12px; }
        .pets-title { font-family: 'Fraunces', serif; font-size: 2rem; font-weight: 700; font-style: italic; color: #fff; letter-spacing: -1px; }
        .pets-subtitle { color: rgba(255,255,255,0.45); font-size: 0.9rem; margin-top: 4px; }
        .btn-primary { background: linear-gradient(135deg, #ff6b6b, #ff4a4a); color: #fff; border: none; border-radius: 12px; padding: 12px 22px; font-family: 'Nunito', sans-serif; font-size: 0.95rem; font-weight: 900; cursor: pointer; box-shadow: 0 6px 20px rgba(255,107,107,0.35); transition: transform 0.15s, box-shadow 0.15s; }
        .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(255,107,107,0.5); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .loading-state, .empty-state { text-align: center; padding: 80px 20px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .paw-spin { font-size: 3rem; animation: spin 1s linear infinite; display: block; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-state p { color: rgba(255,255,255,0.4); }
        .empty-emoji { font-size: 5rem; }
        .empty-state h2 { font-family: 'Fraunces', serif; font-size: 1.6rem; font-style: italic; color: #fff; }
        .empty-state p { color: rgba(255,255,255,0.45); max-width: 340px; line-height: 1.6; }
        .pets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .pet-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 24px; backdrop-filter: blur(10px); transition: border-color 0.2s, transform 0.2s; position: relative; display: flex; flex-direction: column; gap: 10px; }
        .pet-card:hover { border-color: rgba(255,107,107,0.25); transform: translateY(-3px); }
        .pet-card-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .pet-avatar-lg { font-size: 3.5rem; line-height: 1; }
        .pet-photo { width: 60px; height: 60px; border-radius: 12px; object-fit: cover; border: 2px solid rgba(255,107,107,0.3); }
        .pet-card-actions { display: flex; gap: 6px; }
        .btn-icon { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.10); border-radius: 8px; padding: 6px 8px; cursor: pointer; font-size: 1rem; transition: background 0.2s; }
        .btn-icon:hover { background: rgba(255,255,255,0.12); }
        .btn-icon.danger:hover { background: rgba(255,107,107,0.15); }
        .pet-card-name { font-size: 1.3rem; font-weight: 900; color: #fff; }
        .pet-card-species { font-size: 0.8rem; color: rgba(255,255,255,0.4); text-transform: capitalize; margin-top: -6px; }
        .pet-card-info { display: flex; flex-wrap: wrap; gap: 6px; }
        .pet-tag { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 3px 10px; font-size: 0.78rem; color: rgba(255,255,255,0.6); }
        .pet-tag.neutered { background: rgba(107,202,255,0.1); color: #6bcaff; border-color: rgba(107,202,255,0.2); }
        .pet-alert { background: rgba(255,217,61,0.1); border: 1px solid rgba(255,217,61,0.2); border-radius: 8px; padding: 6px 10px; font-size: 0.8rem; color: #ffd93d; }
        .pet-vaccines { font-size: 0.8rem; color: rgba(255,255,255,0.4); }
        .btn-outline { background: transparent; border: 1.5px solid rgba(255,107,107,0.3); color: #ff6b6b; border-radius: 10px; padding: 9px; font-family: 'Nunito', sans-serif; font-size: 0.88rem; font-weight: 700; cursor: pointer; transition: background 0.2s, border-color 0.2s; margin-top: 4px; }
        .btn-outline:hover { background: rgba(255,107,107,0.1); border-color: rgba(255,107,107,0.5); }
        .delete-confirm { position: absolute; inset: 0; border-radius: 20px; background: rgba(26,26,46,0.95); backdrop-filter: blur(8px); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 20px; }
        .delete-confirm p { color: #fff; font-size: 0.95rem; text-align: center; }
        .delete-confirm strong { color: #ff6b6b; }
        .delete-btns { display: flex; gap: 10px; }
        .btn-cancel { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.6); border-radius: 10px; padding: 8px 16px; font-family: 'Nunito', sans-serif; font-weight: 700; cursor: pointer; }
        .btn-danger { background: linear-gradient(135deg, #ff6b6b, #ff4a4a); border: none; color: #fff; border-radius: 10px; padding: 8px 16px; font-family: 'Nunito', sans-serif; font-weight: 700; cursor: pointer; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal { background: #1e1e35; border: 1px solid rgba(255,255,255,0.10); border-radius: 24px; padding: 32px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; animation: modalIn 0.3s cubic-bezier(.22,.68,0,1.2) both; }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .modal-header h2 { font-family: 'Fraunces', serif; font-size: 1.4rem; font-style: italic; color: #fff; }
        .modal-close { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); border-radius: 8px; padding: 6px 10px; cursor: pointer; font-size: 0.9rem; transition: background 0.2s; }
        .modal-close:hover { background: rgba(255,107,107,0.15); color: #ff6b6b; }
        .form-error { background: rgba(255,107,107,0.15); border: 1px solid rgba(255,107,107,0.4); color: #ff9999; padding: 10px 14px; border-radius: 10px; font-size: 0.86rem; margin-bottom: 16px; }
        .pet-form { display: flex; flex-direction: column; gap: 14px; }
        .form-row { display: flex; gap: 12px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .form-group.full { flex: none; }
        .form-group label { font-size: 0.78rem; font-weight: 700; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.06em; }
        .form-group input, .form-group select, .form-group textarea { background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.10); border-radius: 10px; color: #fff; padding: 11px 14px; font-family: 'Nunito', sans-serif; font-size: 0.92rem; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        .form-group select { cursor: pointer; appearance: none; }
        .form-group select option { background: #1a1a2e; }
        .form-group input::placeholder, .form-group textarea::placeholder { color: rgba(255,255,255,0.2); }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #ff6b6b; box-shadow: 0 0 0 3px rgba(255,107,107,0.12); }
        .form-group textarea { resize: vertical; }
        .photo-upload { display: flex; align-items: center; gap: 14px; }
        .photo-preview { width: 80px; height: 80px; border-radius: 12px; object-fit: cover; border: 2px solid rgba(255,107,107,0.3); }
        .photo-label { background: rgba(255,255,255,0.06); border: 1.5px dashed rgba(255,255,255,0.2); border-radius: 10px; padding: 10px 18px; color: rgba(255,255,255,0.5); font-size: 0.88rem; font-weight: 700; cursor: pointer; transition: border-color 0.2s, color 0.2s; }
        .photo-label:hover { border-color: rgba(255,107,107,0.4); color: #ff6b6b; }
        .photo-input-hidden { display: none; }
        .form-check { display: flex; align-items: center; gap: 10px; }
        .form-check input { width: 18px; height: 18px; accent-color: #ff6b6b; cursor: pointer; }
        .form-check label { color: rgba(255,255,255,0.7); font-size: 0.9rem; cursor: pointer; }
        .form-actions { display: flex; gap: 10px; margin-top: 8px; justify-content: flex-end; }
        .btn-ghost { background: transparent; border: 1.5px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.5); border-radius: 10px; padding: 11px 20px; font-family: 'Nunito', sans-serif; font-weight: 700; cursor: pointer; transition: border-color 0.2s; }
        .btn-ghost:hover { border-color: rgba(255,255,255,0.25); }
        @media (max-width: 600px) { .form-row { flex-direction: column; } .pets-inner { padding: 20px 16px; } }
    `}</style>
        </div>
    );
}