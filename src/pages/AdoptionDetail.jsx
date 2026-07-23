import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  applyForAdoption,
  getAdoption,
  getMyAdoptionApplications,
  offerAdoptionHelp,
  shareAdoption,
} from '../services/api';
import './Adoptions.css';

const applicationStatus = {
  new: 'Nueva',
  review: 'En revisión',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  completed: 'Adopción concretada',
};

const listFromResponse = (data) =>
  Array.isArray(data) ? data : data?.results || [];

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export default function AdoptionDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const requestedApplicationId = searchParams.get('solicitud');
  const { user } = useAuth();
  const [animal, setAnimal] = useState(null);
  const [application, setApplication] = useState(null);
  const [modal, setModal] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const loadApplication = useCallback(
    async (animalId) => {
      if (user?.role !== 'owner') {
        setApplication(null);
        return;
      }

      try {
        const rows = listFromResponse(await getMyAdoptionApplications());
        const selected =
          rows.find(
            (row) =>
              requestedApplicationId &&
              String(row.id) === requestedApplicationId,
          ) ||
          rows.find((row) => String(row.animal) === String(animalId)) ||
          null;
        setApplication(selected);
      } catch (error) {
        console.error(error);
      }
    },
    [requestedApplicationId, user?.role],
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAdoption(id)
      .then(async (data) => {
        if (!active) return;
        setAnimal(data);
        await loadApplication(data.id);
      })
      .catch((error) => {
        console.error(error);
        if (active) setMsg('No pudimos cargar esta ficha de adopción.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, loadApplication]);

  const submitApply = async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    payload.has_other_animals = Boolean(payload.has_other_animals);
    payload.follow_up_available = Boolean(payload.follow_up_available);
    payload.accepts_requirements = Boolean(payload.accepts_requirements);
    try {
      const created = await applyForAdoption(id, payload);
      setApplication(created);
      setMsg(
        'Solicitud enviada al refugio. Te avisaremos cuando cambie su estado.',
      );
      setModal('');
    } catch (error) {
      const detail = error.response?.data?.detail;
      const firstFieldError = Object.values(error.response?.data || {})
        .flat()
        .find(Boolean);
      setMsg(detail || firstFieldError || 'No se pudo enviar la solicitud.');
    }
  };

  const help = async (event) => {
    event.preventDefault();
    try {
      await offerAdoptionHelp(
        id,
        Object.fromEntries(new FormData(event.currentTarget)),
      );
      setMsg(
        'Tu ofrecimiento fue enviado y el refugio recibió una notificación.',
      );
      setModal('');
    } catch (error) {
      console.error(error);
      setMsg('No se pudo enviar el ofrecimiento.');
    }
  };

  if (loading) {
    return (
      <main className="adp-page">
        <p className="adp-state">Cargando ficha...</p>
      </main>
    );
  }

  if (!animal) {
    return (
      <main className="adp-page">
        <p className="adp-state">
          {msg || 'No encontramos esta ficha de adopción.'}
        </p>
      </main>
    );
  }

  const canApply =
    user?.role === 'owner' && animal.status !== 'adopted' && !application;

  return (
    <main className="adp-page">
      <Link className="adp-back" to="/adopciones">
        ← Volver a Adopciones
      </Link>
      <article className="adp-detail">
        <div className="adp-detail-photo">
          <img src={animal.cover_url} alt={animal.name} />
          <b className={`status ${animal.status}`}>{animal.status_display}</b>
        </div>
        <div className="adp-info">
          <span>🏠 {animal.shelter_name}</span>
          <h1>{animal.name}</h1>
          <p className="adp-location">
            📍 {animal.locality}, {animal.province}
          </p>
          <div className="adp-tags">
            <b>{animal.species_display}</b>
            {animal.breed && <b>{animal.breed}</b>}
            {animal.approximate_age && <b>{animal.approximate_age}</b>}
            {animal.size && <b>{animal.size}</b>}
          </div>
          <h3>Su historia</h3>
          <p>{animal.story}</p>
          {animal.temperament && (
            <>
              <h3>Carácter</h3>
              <p>{animal.temperament}</p>
            </>
          )}
          {animal.requirements && (
            <>
              <h3>Requisitos de adopción</h3>
              <p>{animal.requirements}</p>
            </>
          )}
          <div className="adp-health">
            <span>{animal.vaccinated ? '✅' : '▫️'} Vacunado</span>
            <span>{animal.neutered ? '✅' : '▫️'} Castrado</span>
            <span>{animal.dewormed ? '✅' : '▫️'} Desparasitado</span>
          </div>

          {application && (
            <section
              className={`adp-application-status status-${application.status}`}
            >
              <span>🐾 TU SOLICITUD DE ADOPCIÓN</span>
              <h3>
                {applicationStatus[application.status] || application.status}
              </h3>
              <p>
                Última actualización:{' '}
                {formatDate(application.updated_at || application.created_at)}
              </p>
              {application.shelter_notes && (
                <div className="adp-shelter-note">
                  <b>Mensaje del refugio</b>
                  <p>{application.shelter_notes}</p>
                </div>
              )}
            </section>
          )}

          {msg && <p className="adp-message">{msg}</p>}
          <div className="adp-actions">
            {canApply && (
              <button onClick={() => setModal('apply')}>
                🐾 Quiero adoptar
              </button>
            )}
            {user?.role === 'owner' && application && (
              <span className="adp-already-applied">
                ✓ Ya enviaste una solicitud
              </span>
            )}
            {user && animal.status !== 'adopted' && (
              <button className="secondary" onClick={() => setModal('help')}>
                🤝 Quiero ayudar
              </button>
            )}
            {animal.can_manage && (
              <>
                <button
                  className="secondary"
                  onClick={() =>
                    shareAdoption(id).then(() =>
                      setMsg('Ficha compartida en Comunidad.'),
                    )
                  }
                >
                  📣 Compartir en Comunidad
                </button>
                <Link className="button-link" to="/refugio/adopciones">
                  Administrar ficha
                </Link>
              </>
            )}
          </div>
        </div>
      </article>

      {modal === 'apply' && (
        <div className="adp-modal">
          <form onSubmit={submitApply}>
            <button type="button" className="x" onClick={() => setModal('')}>
              ×
            </button>
            <h2>Solicitud para adoptar a {animal.name}</h2>
            <input name="phone" required placeholder="Teléfono o WhatsApp" />
            <input name="locality" required placeholder="Localidad" />
            <input
              name="housing_type"
              required
              placeholder="Casa, departamento, patio..."
            />
            <label>
              <input type="checkbox" name="has_other_animals" /> Tengo otros
              animales
            </label>
            <textarea name="other_animals" placeholder="Contanos cuáles" />
            <textarea
              name="experience"
              placeholder="Experiencia con animales"
            />
            <textarea
              name="motivation"
              required
              placeholder="¿Por qué querés adoptarlo?"
            />
            <label>
              <input
                type="checkbox"
                name="follow_up_available"
                defaultChecked
              />{' '}
              Acepto seguimiento
            </label>
            <label>
              <input type="checkbox" name="accepts_requirements" required />{' '}
              Acepto los requisitos del refugio
            </label>
            <button>Enviar solicitud</button>
          </form>
        </div>
      )}

      {modal === 'help' && (
        <div className="adp-modal">
          <form onSubmit={help}>
            <button type="button" className="x" onClick={() => setModal('')}>
              ×
            </button>
            <h2>Ofrecer ayuda</h2>
            <select name="help_type" required>
              <option value="foster">Hogar de tránsito</option>
              <option value="food">Alimento</option>
              <option value="medicine">Medicamentos</option>
              <option value="transport">Traslado</option>
              <option value="vet">Ayuda veterinaria</option>
              <option value="volunteer">Voluntariado</option>
              <option value="sharing">Difusión</option>
            </select>
            <input name="phone" placeholder="Teléfono" />
            <textarea
              name="message"
              placeholder="Contale al refugio cómo podés ayudar"
            />
            <button>Enviar ofrecimiento</button>
          </form>
        </div>
      )}
    </main>
  );
}
