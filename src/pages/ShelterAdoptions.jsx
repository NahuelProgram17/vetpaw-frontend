import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  createAdoption,
  deleteAdoption,
  getAdoptions,
  getMyShelterProfile,
  getShelterApplications,
  getShelterHelpOffers,
  shareAdoption,
  updateAdoption,
  updateAdoptionApplication,
} from '../services/api';
import './Adoptions.css';

const empty = {
  name: '',
  species: 'dog',
  breed: '',
  sex: 'unknown',
  size: 'medium',
  age_group: 'adult',
  approximate_age: '',
  story: '',
  temperament: '',
  health_notes: '',
  province: '',
  locality: '',
  adoption_area: '',
  requirements: '',
  urgent_needs: '',
  status: 'available',
  vaccinated: false,
  neutered: false,
  dewormed: false,
  is_published: true,
  cover: null,
};

const validTabs = new Set(['animals', 'apps', 'offers']);

const listFromResponse = (data) =>
  Array.isArray(data) ? data : data?.results || [];

export default function ShelterAdoptions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const selectedApplicationId = searchParams.get('solicitud');
  const selectedOfferId = searchParams.get('ayuda');

  const [profile, setProfile] = useState(null);
  const [items, setItems] = useState([]);
  const [apps, setApps] = useState([]);
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState(
    validTabs.has(requestedTab) ? requestedTab : 'animals',
  );
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({});
  const highlightedRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const shelter = await getMyShelterProfile();
      setProfile(shelter);
      const [animalData, applicationData, offerData] = await Promise.all([
        getAdoptions({ shelter: shelter.slug }),
        getShelterApplications(),
        getShelterHelpOffers(),
      ]);
      const applicationRows = listFromResponse(applicationData);
      setItems(listFromResponse(animalData));
      setApps(applicationRows);
      setOffers(listFromResponse(offerData));
      setNoteDrafts(
        applicationRows.reduce((drafts, application) => {
          drafts[application.id] = application.shelter_notes || '';
          return drafts;
        }, {}),
      );
    } catch (error) {
      console.error(error);
      setMsg('No pudimos cargar la gestión de adopciones. Probá nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [
    setApps,
    setItems,
    setLoading,
    setMsg,
    setNoteDrafts,
    setOffers,
    setProfile,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (validTabs.has(requestedTab)) setTab(requestedTab);
  }, [requestedTab]);

  useEffect(() => {
    const selectedId =
      tab === 'apps'
        ? selectedApplicationId
        : tab === 'offers'
          ? selectedOfferId
          : null;
    if (!selectedId || !highlightedRef.current) return;

    const timer = window.setTimeout(() => {
      highlightedRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [apps, offers, selectedApplicationId, selectedOfferId, tab]);

  const changeTab = (nextTab) => {
    setTab(nextTab);
    setMsg('');
    setSearchParams(nextTab === 'animals' ? {} : { tab: nextTab }, {
      replace: true,
    });
  };

  const save = async (event) => {
    event.preventDefault();
    setMsg('');
    try {
      if (editing) await updateAdoption(editing, form);
      else await createAdoption(form);
      setMsg('Ficha guardada correctamente.');
      setForm({
        ...empty,
        province: profile?.province || '',
        locality: profile?.locality || '',
      });
      setEditing(null);
      await load();
    } catch (error) {
      console.error(error);
      setMsg('Revisá los campos obligatorios.');
    }
  };

  const edit = (animal) => {
    setEditing(animal.id);
    setForm({ ...empty, ...animal, cover: null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateApplication = async (application, changes, successMessage) => {
    setBusyId(application.id);
    setMsg('');
    try {
      const updated = await updateAdoptionApplication(application.id, {
        status: changes.status ?? application.status,
        shelter_notes:
          changes.shelter_notes ??
          noteDrafts[application.id] ??
          application.shelter_notes ??
          '',
      });
      setApps((rows) =>
        rows.map((row) => (row.id === updated.id ? updated : row)),
      );
      setNoteDrafts((drafts) => ({
        ...drafts,
        [updated.id]: updated.shelter_notes || '',
      }));
      setMsg(successMessage);
    } catch (error) {
      console.error(error);
      setMsg('No pudimos actualizar la solicitud. Probá nuevamente.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="adp-page">
      <section className="adp-hero compact">
        <span>🏠 PANEL DEL REFUGIO</span>
        <h1>Adopciones y ayuda comunitaria</h1>
        <p>
          Publicá animales, revisá solicitudes y organizá la ayuda que recibe tu
          refugio.
        </p>
      </section>

      <nav className="adp-tabs" aria-label="Gestión de adopciones">
        <button
          className={tab === 'animals' ? 'active' : ''}
          onClick={() => changeTab('animals')}
        >
          Animales ({items.length})
        </button>
        <button
          className={tab === 'apps' ? 'active' : ''}
          onClick={() => changeTab('apps')}
        >
          Solicitudes ({apps.length})
        </button>
        <button
          className={tab === 'offers' ? 'active' : ''}
          onClick={() => changeTab('offers')}
        >
          Ayuda ({offers.length})
        </button>
      </nav>

      {msg && <p className="adp-message">{msg}</p>}
      {loading && (
        <p className="adp-state">Cargando información del refugio...</p>
      )}

      {!loading && tab === 'animals' && (
        <>
          <form className="adp-editor" onSubmit={save}>
            <h2>{editing ? 'Editar ficha' : 'Nueva ficha de adopción'}</h2>
            <div className="form-grid">
              <input
                required
                placeholder="Nombre"
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
              />
              <select
                value={form.species}
                onChange={(event) =>
                  setForm({ ...form, species: event.target.value })
                }
              >
                <option value="dog">Perro</option>
                <option value="cat">Gato</option>
                <option value="rabbit">Conejo</option>
                <option value="horse">Caballo</option>
                <option value="other">Otro</option>
              </select>
              <input
                placeholder="Raza"
                value={form.breed}
                onChange={(event) =>
                  setForm({ ...form, breed: event.target.value })
                }
              />
              <input
                placeholder="Edad aproximada"
                value={form.approximate_age}
                onChange={(event) =>
                  setForm({ ...form, approximate_age: event.target.value })
                }
              />
              <input
                required
                placeholder="Provincia"
                value={form.province}
                onChange={(event) =>
                  setForm({ ...form, province: event.target.value })
                }
              />
              <input
                required
                placeholder="Localidad"
                value={form.locality}
                onChange={(event) =>
                  setForm({ ...form, locality: event.target.value })
                }
              />
              <select
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value })
                }
              >
                <option value="available">Disponible</option>
                <option value="urgent">Urgente</option>
                <option value="foster">Necesita tránsito</option>
                <option value="recovery">En recuperación</option>
                <option value="reserved">Reservado</option>
                <option value="adopted">Adoptado</option>
              </select>
              <input
                type="file"
                accept="image/*"
                required={!editing}
                onChange={(event) =>
                  setForm({ ...form, cover: event.target.files[0] })
                }
              />
            </div>
            <textarea
              required
              placeholder="Historia del animal"
              value={form.story}
              onChange={(event) =>
                setForm({ ...form, story: event.target.value })
              }
            />
            <textarea
              placeholder="Carácter y convivencia"
              value={form.temperament}
              onChange={(event) =>
                setForm({ ...form, temperament: event.target.value })
              }
            />
            <textarea
              placeholder="Requisitos de adopción"
              value={form.requirements}
              onChange={(event) =>
                setForm({ ...form, requirements: event.target.value })
              }
            />
            <div className="checks">
              <label>
                <input
                  type="checkbox"
                  checked={form.vaccinated}
                  onChange={(event) =>
                    setForm({ ...form, vaccinated: event.target.checked })
                  }
                />{' '}
                Vacunado
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={form.neutered}
                  onChange={(event) =>
                    setForm({ ...form, neutered: event.target.checked })
                  }
                />{' '}
                Castrado
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={form.dewormed}
                  onChange={(event) =>
                    setForm({ ...form, dewormed: event.target.checked })
                  }
                />{' '}
                Desparasitado
              </label>
            </div>
            <button>{editing ? 'Guardar cambios' : 'Publicar ficha'}</button>
            {editing && (
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setEditing(null);
                  setForm({
                    ...empty,
                    province: profile?.province || '',
                    locality: profile?.locality || '',
                  });
                }}
              >
                Cancelar
              </button>
            )}
          </form>

          <section className="manage-list">
            {items.map((animal) => (
              <article key={animal.id}>
                <img src={animal.cover_url} alt={animal.name} />
                <div>
                  <h3>{animal.name}</h3>
                  <p>
                    {animal.status_display} · {animal.locality}
                  </p>
                </div>
                <button onClick={() => edit(animal)}>Editar</button>
                <button
                  onClick={() =>
                    shareAdoption(animal.id).then(() =>
                      setMsg('Compartida en Comunidad.'),
                    )
                  }
                >
                  Compartir
                </button>
                <button
                  className="danger"
                  onClick={() =>
                    window.confirm('¿Eliminar ficha?') &&
                    deleteAdoption(animal.id).then(load)
                  }
                >
                  Eliminar
                </button>
              </article>
            ))}
          </section>
        </>
      )}

      {!loading && tab === 'apps' && (
        <section className="manage-list applications">
          {apps.map((application) => {
            const highlighted =
              String(application.id) === String(selectedApplicationId || '');
            const notesChanged =
              (noteDrafts[application.id] || '') !==
              (application.shelter_notes || '');
            return (
              <article
                key={application.id}
                ref={highlighted ? highlightedRef : null}
                className={highlighted ? 'application-highlight' : ''}
              >
                <div className="application-copy">
                  <h3>
                    {application.applicant_name} quiere adoptar a{' '}
                    {application.animal_name}
                  </h3>
                  <p>
                    {application.locality} · {application.phone}
                  </p>
                  <p>{application.motivation}</p>
                  <label className="shelter-note-editor">
                    <span>Observación para la persona solicitante</span>
                    <textarea
                      value={noteDrafts[application.id] ?? ''}
                      onChange={(event) =>
                        setNoteDrafts((drafts) => ({
                          ...drafts,
                          [application.id]: event.target.value,
                        }))
                      }
                      placeholder="Ejemplo: Nos comunicaremos por WhatsApp para coordinar una entrevista."
                      maxLength={1500}
                    />
                  </label>
                </div>
                <div className="application-actions">
                  <label>
                    <span>Estado</span>
                    <select
                      value={application.status}
                      disabled={busyId === application.id}
                      onChange={(event) =>
                        updateApplication(
                          application,
                          { status: event.target.value },
                          'Estado actualizado. La persona recibió una notificación.',
                        )
                      }
                    >
                      <option value="new">Nueva</option>
                      <option value="review">En revisión</option>
                      <option value="approved">Aprobada</option>
                      <option value="rejected">Rechazada</option>
                      <option value="completed">Adopción concretada</option>
                    </select>
                  </label>
                  <button
                    disabled={busyId === application.id || !notesChanged}
                    onClick={() =>
                      updateApplication(
                        application,
                        { shelter_notes: noteDrafts[application.id] || '' },
                        'Observación actualizada. La persona recibió una notificación.',
                      )
                    }
                  >
                    {busyId === application.id
                      ? 'Guardando…'
                      : notesChanged
                        ? 'Guardar observación'
                        : 'Observación al día'}
                  </button>
                </div>
              </article>
            );
          })}
          {!apps.length && <p>No hay solicitudes todavía.</p>}
        </section>
      )}

      {!loading && tab === 'offers' && (
        <section className="manage-list applications">
          {offers.map((offer) => {
            const highlighted =
              String(offer.id) === String(selectedOfferId || '');
            return (
              <article
                key={offer.id}
                ref={highlighted ? highlightedRef : null}
                className={highlighted ? 'application-highlight' : ''}
              >
                <div>
                  <h3>
                    {offer.user_name} ofrece {offer.help_type_display}
                  </h3>
                  {offer.phone && <p>📞 {offer.phone}</p>}
                  {offer.message && <p>{offer.message}</p>}
                </div>
              </article>
            );
          })}
          {!offers.length && <p>No hay ofrecimientos todavía.</p>}
        </section>
      )}
    </main>
  );
}
