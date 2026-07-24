import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdoptions } from '../services/api';
import './Adoptions.css';

const statuses = [
  ['', 'Todos los estados'],
  ['available', 'Disponible'],
  ['urgent', 'Urgente'],
  ['foster', 'Necesita tránsito'],
  ['recovery', 'En recuperación'],
  ['reserved', 'Reservado'],
  ['adopted', 'Adoptado'],
];

export default function Adoptions() {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({
    q: '',
    species: '',
    status: '',
    province: '',
    locality: '',
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdoptions(filters);
      setItems(Array.isArray(data) ? data : data.results || []);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <main className="adp-page">
      <section className="adp-hero">
        <span>🏠 VETPAW ADOPCIONES</span>
        <h1>Una familia puede empezar con una mirada.</h1>
        <p>
          Conocé animales rescatados, ofrecé tránsito o ayudá a difundir
          historias que merecen un nuevo comienzo.
        </p>
      </section>

      <section className="adp-filter">
        <input
          placeholder="Buscar por nombre, raza, refugio o localidad"
          value={filters.q}
          onChange={(event) => updateFilter('q', event.target.value)}
        />
        <select
          value={filters.species}
          onChange={(event) => updateFilter('species', event.target.value)}
        >
          <option value="">Todas las especies</option>
          <option value="dog">Perros</option>
          <option value="cat">Gatos</option>
          <option value="rabbit">Conejos</option>
          <option value="horse">Caballos</option>
          <option value="other">Otros</option>
        </select>
        <select
          value={filters.status}
          onChange={(event) => updateFilter('status', event.target.value)}
        >
          {statuses.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          placeholder="Provincia"
          value={filters.province}
          onChange={(event) => updateFilter('province', event.target.value)}
        />
        <input
          placeholder="Localidad"
          value={filters.locality}
          onChange={(event) => updateFilter('locality', event.target.value)}
        />
      </section>

      {loading ? (
        <p className="adp-state">Cargando historias...</p>
      ) : (
        <section className="adp-grid">
          {items.map((animal) => (
            <Link className="adp-card" to={`/adopciones/${animal.id}`} key={animal.id}>
              <div className="adp-photo">
                <img src={animal.cover_url} alt={animal.name} />
                <b className={`status ${animal.status}`}>{animal.status_display}</b>
              </div>
              <div className="adp-body">
                <h2>{animal.name}</h2>
                <p>
                  {animal.species_display}
                  {animal.breed ? ` · ${animal.breed}` : ''} · {animal.locality}
                </p>
                <span>🏠 {animal.shelter_name}</span>
              </div>
            </Link>
          ))}
          {!items.length && <p className="adp-state">No encontramos fichas con esos filtros.</p>}
        </section>
      )}
    </main>
  );
}
