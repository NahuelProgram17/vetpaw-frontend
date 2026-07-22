import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getCommunityExplore,
  togglePetFollow,
} from '../services/api'
import PostCard from '../components/community/PostCard'
import VetPawLoader from '../components/VetPawLoader'
import './Explore.css'

const TABS = [
  ['all', '✨ Todo'],
  ['pets', '🐾 Mascotas'],
  ['posts', '📸 Publicaciones'],
  ['clinics', '🏥 Veterinarias'],
  ['businesses', '🛍️ Negocios'],
  ['shelters', '🏠 Refugios'],
  ['hashtags', '#️⃣ Hashtags'],
  ['lost', '🚨 Perdidos'],
]

const EMPTY_RESULTS = {
  pets: [],
  posts: [],
  clinics: [],
  businesses: [],
  shelters: [],
  hashtags: [],
  lost_pets: [],
}

const TYPE_LABELS = {
  pet: 'Mascota',
  clinic: 'Veterinaria',
  business: 'Negocio',
  shelter: 'Refugio',
  hashtag: 'Hashtag',
  post: 'Publicación',
}

const plural = (value, one, many) => `${value} ${value === 1 ? one : many}`

export default function Explore() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const inputRef = useRef(null)

  const initialSection = TABS.some(([value]) => value === searchParams.get('seccion'))
    ? searchParams.get('seccion')
    : 'all'

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('q') || '')
  const [section, setSection] = useState(initialSection)
  const [species, setSpecies] = useState(searchParams.get('especie') || '')
  const [locality, setLocality] = useState(searchParams.get('localidad') || '')
  const [province, setProvince] = useState(searchParams.get('provincia') || '')
  const [sort, setSort] = useState(searchParams.get('orden') || 'popular')
  const [only24h, setOnly24h] = useState(searchParams.get('24h') === '1')
  const [businessType, setBusinessType] = useState(searchParams.get('rubro') || '')
  const [shelterType, setShelterType] = useState(searchParams.get('tipo_refugio') || '')
  const [acceptingAnimals, setAcceptingAnimals] = useState(searchParams.get('recibe') === '1')
  const [data, setData] = useState({
    counts: { pets: 0, posts: 0, clinics: 0, businesses: 0, shelters: 0, hashtags: 0, lost: 0 },
    results: EMPTY_RESULTS,
    suggestions: [],
    trending_hashtags: [],
    popular_localities: [],
    species_options: [],
    business_type_options: [],
    shelter_type_options: [],
    pagination: null,
  })
  const [loading, setLoading] = useState(true)
  const [moreLoading, setMoreLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [searchFocused, setSearchFocused] = useState(false)
  const [followingBusy, setFollowingBusy] = useState(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 350)
    return () => window.clearTimeout(timer)
  }, [query])

  const requestParams = useCallback((requestedPage = 1) => ({
    q: debouncedQuery || undefined,
    section,
    species: species || undefined,
    locality: locality || undefined,
    province: province || undefined,
    sort,
    is_24h: only24h || undefined,
    business_type: businessType || undefined,
    shelter_type: shelterType || undefined,
    accepting_animals: acceptingAnimals || undefined,
    page: requestedPage,
    page_size: 12,
  }), [debouncedQuery, section, species, locality, province, sort, only24h, businessType, shelterType, acceptingAnimals])

  const syncUrl = useCallback(() => {
    const next = {}
    if (debouncedQuery) next.q = debouncedQuery
    if (section !== 'all') next.seccion = section
    if (species) next.especie = species
    if (locality) next.localidad = locality
    if (province) next.provincia = province
    if (sort !== 'popular') next.orden = sort
    if (only24h) next['24h'] = '1'
    if (businessType) next.rubro = businessType
    if (shelterType) next.tipo_refugio = shelterType
    if (acceptingAnimals) next.recibe = '1'
    setSearchParams(next, { replace: true })
  }, [debouncedQuery, section, species, locality, province, sort, only24h, businessType, shelterType, acceptingAnimals, setSearchParams])

  const load = useCallback(async (requestedPage = 1, append = false) => {
    append ? setMoreLoading(true) : setLoading(true)
    setError('')
    try {
      const response = await getCommunityExplore(requestParams(requestedPage))
      setData((current) => {
        if (!append) return response
        const nextResults = { ...current.results }
        const source = response.results || EMPTY_RESULTS
        Object.keys(nextResults).forEach((key) => {
          const incoming = Array.isArray(source[key]) ? source[key] : []
          if (incoming.length) nextResults[key] = [...(nextResults[key] || []), ...incoming]
        })
        return { ...response, results: nextResults }
      })
      setPage(requestedPage)
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'No pudimos cargar Explorar. Probá nuevamente.')
    } finally {
      setLoading(false)
      setMoreLoading(false)
    }
  }, [requestParams])

  useEffect(() => {
    syncUrl()
    load(1, false)
  }, [syncUrl, load])

  const selectSection = (value) => {
    setSection(value)
    setPage(1)
  }

  const clearFilters = () => {
    setSpecies('')
    setLocality('')
    setProvince('')
    setOnly24h(false)
    setBusinessType('')
    setShelterType('')
    setAcceptingAnimals(false)
    setSort('popular')
  }

  const openSuggestion = (item) => {
    setSearchFocused(false)
    navigate(item.target_url)
  }

  const toggleFollow = async (pet) => {
    if (!user) {
      navigate('/login')
      return
    }
    setFollowingBusy(pet.id)
    try {
      const result = await togglePetFollow(pet.id)
      setData((current) => ({
        ...current,
        results: {
          ...current.results,
          pets: current.results.pets.map((item) => (
            item.id === pet.id
              ? { ...item, following: result.following, followers_count: result.followers_count }
              : item
          )),
        },
      }))
    } finally {
      setFollowingBusy(null)
    }
  }

  const removePost = (id, blocked = false, blockedUserId = null) => {
    setData((current) => ({
      ...current,
      results: {
        ...current.results,
        posts: current.results.posts.filter((post) => (
          blocked && blockedUserId
            ? post.actor?.owner_user_id !== blockedUserId
            : post.id !== id
        )),
      },
    }))
  }

  const openHashtag = (tag) => navigate(`/comunidad?hashtag=${encodeURIComponent(tag)}`)

  const totalResults = useMemo(
    () => Object.values(data.counts || {}).reduce((sum, value) => sum + Number(value || 0), 0),
    [data.counts],
  )

  const filtersActive = Boolean(species || locality || province || only24h || businessType || shelterType || acceptingAnimals || sort !== 'popular')
  const suggestionsVisible = searchFocused && debouncedQuery.length >= 2 && data.suggestions?.length > 0

  return (
    <main className="explore-page">
      <div className="explore-shell">
        <header className="explore-hero">
          <div className="explore-hero-copy">
            <span className="explore-kicker">🔎 VetPaw Explorar</span>
            <h1><span className="explore-title-green">Encontrá nuevas historias,</span> <span className="explore-title-orange">mascotas y perfiles.</span></h1>
            <p>Buscá por nombre, raza, especie, localidad o hashtag. La información médica y los domicilios privados nunca aparecen acá.</p>
          </div>
          <div className="explore-hero-stat">
            <strong>{totalResults}</strong>
            <span>{debouncedQuery ? 'resultados encontrados' : 'perfiles y publicaciones para descubrir'}</span>
          </div>
        </header>

        <section className="explore-search-card">
          <div className="explore-search-wrap">
            <span>🔎</span>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value.slice(0, 80))}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => window.setTimeout(() => setSearchFocused(false), 160)}
              placeholder="Buscá mascotas, veterinarias, negocios, refugios o #hashtags"
              aria-label="Buscar en VetPaw"
            />
            {query && <button type="button" onClick={() => { setQuery(''); inputRef.current?.focus() }}>✕</button>}
          </div>

          {suggestionsVisible && (
            <div className="explore-suggestions">
              {data.suggestions.map((item) => (
                <button type="button" key={`${item.kind}-${item.id}`} onMouseDown={() => openSuggestion(item)}>
                  {item.image ? <img src={item.image} alt="" /> : <span className="explore-suggestion-icon">{item.kind === 'hashtag' ? '#️⃣' : item.kind === 'clinic' ? '🏥' : item.kind === 'business' ? '🛍️' : item.kind === 'shelter' ? '🏠' : item.kind === 'post' ? '📸' : '🐾'}</span>}
                  <span><strong>{item.title}</strong><small>{TYPE_LABELS[item.kind]} · {item.subtitle}</small></span>
                  <b>›</b>
                </button>
              ))}
            </div>
          )}

          <div className="explore-tabs">
            {TABS.map(([value, label]) => (
              <button type="button" key={value} className={section === value ? 'active' : ''} onClick={() => selectSection(value)}>
                {label}
                {value !== 'all' && <span>{data.counts?.[value] ?? 0}</span>}
              </button>
            ))}
          </div>

          <div className="explore-filters">
            <select value={species} onChange={(event) => setSpecies(event.target.value)}>
              <option value="">Todas las especies</option>
              {(data.species_options || []).map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
            </select>
            <input value={locality} onChange={(event) => setLocality(event.target.value.slice(0, 100))} placeholder="Localidad" />
            <input value={province} onChange={(event) => setProvince(event.target.value.slice(0, 100))} placeholder="Provincia" />
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="popular">Más populares</option>
              <option value="recent">Más recientes</option>
            </select>
            {(section === 'businesses' || section === 'all') && <select value={businessType} onChange={(event) => setBusinessType(event.target.value)}><option value="">Todos los rubros</option>{(data.business_type_options || []).map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select>}
            {(section === 'shelters' || section === 'all') && <select value={shelterType} onChange={(event) => setShelterType(event.target.value)}><option value="">Todos los refugios</option>{(data.shelter_type_options || []).map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select>}
            {(section === 'clinics' || section === 'businesses' || section === 'all') && (
              <label className="explore-check"><input type="checkbox" checked={only24h} onChange={(event) => setOnly24h(event.target.checked)} /> Atención 24 h</label>
            )}
            {(section === 'shelters' || section === 'all') && <label className="explore-check"><input type="checkbox" checked={acceptingAnimals} onChange={(event) => setAcceptingAnimals(event.target.checked)} /> Recibe animales</label>}
            {filtersActive && <button type="button" className="explore-clear" onClick={clearFilters}>Limpiar filtros</button>}
          </div>
        </section>

        {!debouncedQuery && (data.trending_hashtags?.length > 0 || data.popular_localities?.length > 0) && (
          <section className="explore-trends">
            <div><strong>🔥 Tendencias</strong><span>Lo que está compartiendo la comunidad</span></div>
            <div className="explore-trend-content">
              <div className="explore-trend-list">
                {data.trending_hashtags.slice(0, 7).map((tag) => (
                  <button type="button" key={tag.name} onClick={() => openHashtag(tag.name)}>#{tag.name} <small>{tag.count}</small></button>
                ))}
              </div>
              {data.popular_localities?.length > 0 && (
                <div className="explore-location-list">
                  <span>📍 Cerca de vos:</span>
                  {data.popular_localities.slice(0, 5).map((item) => (
                    <button type="button" key={item.name} onClick={() => setLocality(item.name)}>{item.name} <small>{item.count}</small></button>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {error && <div className="explore-error">{error}</div>}

        {loading ? (
          <VetPawLoader message="Explorando VetPaw..." subText="Buscando mascotas, publicaciones y perfiles" fullScreen={false} />
        ) : (
          <ExploreResults
            data={data}
            section={section}
            user={user}
            followingBusy={followingBusy}
            onFollow={toggleFollow}
            onSection={selectSection}
            onDeleted={removePost}
            onHashtag={openHashtag}
          />
        )}

        {!loading && data.pagination?.has_more && (
          <div className="explore-load-more">
            <button type="button" disabled={moreLoading} onClick={() => load(page + 1, true)}>
              {moreLoading ? 'Cargando...' : 'Ver más resultados'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

function ExploreResults({ data, section, user, followingBusy, onFollow, onSection, onDeleted, onHashtag }) {
  const results = data.results || EMPTY_RESULTS
  const isAll = section === 'all'

  const empty = section === 'pets' ? !results.pets.length
    : section === 'posts' ? !results.posts.length
      : section === 'clinics' ? !results.clinics.length
        : section === 'businesses' ? !results.businesses.length
          : section === 'shelters' ? !results.shelters.length
            : section === 'hashtags' ? !results.hashtags.length
              : section === 'lost' ? !results.lost_pets.length
                : !results.pets.length && !results.posts.length && !results.clinics.length && !results.businesses.length && !results.shelters.length && !results.hashtags.length && !results.lost_pets.length

  if (empty) {
    return (
      <section className="explore-empty">
        <span>🐶</span>
        <h2>No encontramos resultados</h2>
        <p>Probá con otra palabra, una localidad cercana o quitando algún filtro.</p>
      </section>
    )
  }

  return (
    <div className="explore-results">
      {(isAll || section === 'pets') && results.pets.length > 0 && (
        <ResultSection title="🐾 Mascotas para conocer" total={data.counts?.pets} action={isAll ? () => onSection('pets') : null}>
          <div className="explore-pet-grid">
            {results.pets.map((pet) => <PetResultCard key={pet.id} pet={pet} user={user} busy={followingBusy === pet.id} onFollow={onFollow} />)}
          </div>
        </ResultSection>
      )}

      {(isAll || section === 'posts') && results.posts.length > 0 && (
        <ResultSection title="📸 Publicaciones" total={data.counts?.posts} action={isAll ? () => onSection('posts') : null}>
          <div className="explore-post-list">
            {results.posts.map((post) => (
              <PostCard key={post.id} initialPost={post} user={user} onDeleted={onDeleted} onHashtagClick={onHashtag} />
            ))}
          </div>
        </ResultSection>
      )}

      {(isAll || section === 'clinics') && results.clinics.length > 0 && (
        <ResultSection title="🏥 Veterinarias verificadas" total={data.counts?.clinics} action={isAll ? () => onSection('clinics') : null}>
          <div className="explore-clinic-grid">
            {results.clinics.map((clinic) => <ClinicResultCard key={clinic.id} clinic={clinic} />)}
          </div>
        </ResultSection>
      )}

      {(isAll || section === 'businesses') && results.businesses.length > 0 && (
        <ResultSection title="🛍️ Negocios para mascotas" total={data.counts?.businesses} action={isAll ? () => onSection('businesses') : null}>
          <div className="explore-clinic-grid">
            {results.businesses.map((item) => <PartnerResultCard key={item.id} item={item} kind="business" />)}
          </div>
        </ResultSection>
      )}

      {(isAll || section === 'shelters') && results.shelters.length > 0 && (
        <ResultSection title="🏠 Refugios y rescatistas" total={data.counts?.shelters} action={isAll ? () => onSection('shelters') : null}>
          <div className="explore-clinic-grid">
            {results.shelters.map((item) => <PartnerResultCard key={item.id} item={item} kind="shelter" />)}
          </div>
        </ResultSection>
      )}

      {(isAll || section === 'hashtags') && results.hashtags.length > 0 && (
        <ResultSection title="#️⃣ Hashtags" total={data.counts?.hashtags} action={isAll ? () => onSection('hashtags') : null}>
          <div className="explore-hashtag-grid">
            {results.hashtags.map((tag) => <Link key={tag.name} to={tag.target_url}><strong>#{tag.name}</strong><span>{plural(tag.count, 'publicación', 'publicaciones')}</span></Link>)}
          </div>
        </ResultSection>
      )}

      {(isAll || section === 'lost') && results.lost_pets.length > 0 && (
        <ResultSection title="🚨 Perdidos y encontrados" total={data.counts?.lost} action={isAll ? () => onSection('lost') : null}>
          <div className="explore-lost-grid">
            {results.lost_pets.map((item) => <LostResultCard key={item.id} item={item} />)}
          </div>
        </ResultSection>
      )}
    </div>
  )
}

function ResultSection({ title, total, action, children }) {
  return (
    <section className="explore-result-section">
      <div className="explore-section-heading">
        <div><h2>{title}</h2><span>{plural(total || 0, 'resultado', 'resultados')}</span></div>
        {action && <button type="button" onClick={action}>Ver todos →</button>}
      </div>
      {children}
    </section>
  )
}

function PetResultCard({ pet, user, busy, onFollow }) {
  return (
    <article className="explore-pet-card">
      <Link to={pet.profile_url} className="explore-pet-photo">
        {pet.photo ? <img src={pet.photo} alt={pet.name} loading="lazy" /> : <span>🐾</span>}
      </Link>
      <div className="explore-pet-info">
        <Link to={pet.profile_url}>{pet.name}</Link>
        <p>{pet.species_display}{pet.breed ? ` · ${pet.breed}` : ''}</p>
        <small>📍 {[pet.locality, pet.province].filter(Boolean).join(', ') || 'Argentina'}</small>
        <div className="explore-card-stats"><span>👥 {pet.followers_count}</span><span>📸 {pet.posts_count}</span></div>
      </div>
      {(!user || user.id !== pet.owner_user_id) && (
        <button type="button" disabled={busy} className={pet.following ? 'following' : ''} onClick={() => onFollow(pet)}>
          {busy ? '...' : pet.following ? 'Siguiendo' : 'Seguir'}
        </button>
      )}
    </article>
  )
}

function ClinicResultCard({ clinic }) {
  return (
    <Link className="explore-clinic-card" to={clinic.profile_url}>
      <div className="explore-clinic-logo">{clinic.logo ? <img src={clinic.logo} alt={clinic.name} loading="lazy" /> : '🏥'}</div>
      <div>
        <div className="explore-verified"><strong>{clinic.name}</strong><span title="Veterinaria verificada">●</span></div>
        <p>📍 {[clinic.locality, clinic.province].filter(Boolean).join(', ')}</p>
        <small>{clinic.is_24h ? '🕐 Atención 24 horas' : '🩺 Perfil veterinario'} · {plural(clinic.posts_count, 'publicación', 'publicaciones')}</small>
        {clinic.services?.length > 0 && <div className="explore-services">{clinic.services.slice(0, 3).map((service) => <span key={service}>{service}</span>)}</div>}
      </div>
      <b>›</b>
    </Link>
  )
}

function PartnerResultCard({ item, kind }) {
  const isBusiness = kind === 'business'
  return (
    <Link className="explore-clinic-card" to={item.profile_url}>
      <div className="explore-clinic-logo">{item.logo ? <img src={item.logo} alt={item.name} loading="lazy" /> : isBusiness ? '🛍️' : '🏠'}</div>
      <div>
        <div className="explore-verified"><strong>{item.name}</strong>{item.is_verified && <span title="Perfil verificado">●</span>}</div>
        <p>{item.type_display} · 📍 {[item.locality, item.province].filter(Boolean).join(', ')}</p>
        <small>{isBusiness ? (item.is_24h ? '🕐 Atención 24 horas' : item.home_service ? '🏠 Atención a domicilio' : '🛍️ Negocio VetPaw') : item.capacity_status_display} · {plural(item.posts_count, 'publicación', 'publicaciones')}</small>
        {isBusiness && item.services?.length > 0 && <div className="explore-services">{item.services.slice(0, 3).map((service) => <span key={service}>{service}</span>)}</div>}
        {!isBusiness && <div className="explore-services">{item.accepting_animals && <span>Recibe animales</span>}{item.needs_foster_homes && <span>Busca tránsito</span>}{item.needs_volunteers && <span>Busca voluntarios</span>}</div>}
      </div>
      <b>›</b>
    </Link>
  )
}

function LostResultCard({ item }) {
  return (
    <Link className="explore-lost-card" to={item.target_url}>
      <div>{item.photo ? <img src={item.photo} alt={item.pet_name} loading="lazy" /> : <span>🔎</span>}</div>
      <section>
        <strong>{item.report_type === 'lost' ? 'Se busca' : 'Encontrada'}: {item.pet_name}</strong>
        <p>{item.species_display}{item.breed ? ` · ${item.breed}` : ''}</p>
        <small>📍 {[item.locality, item.province].filter(Boolean).join(', ') || 'Sin ubicación'}</small>
      </section>
      <b>Ver aviso →</b>
    </Link>
  )
}
