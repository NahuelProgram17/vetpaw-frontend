import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { togglePetFollow } from '../../services/api'

const fallback = (type) => type === 'clinic' ? '🏥' : '🐾'

export default function CommunityRightRail({ discover, user, onRefresh }) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(null)
  const follow = async (pet) => {
    if (!user) { navigate('/login'); return }
    setBusy(pet.id)
    try { await togglePetFollow(pet.id); onRefresh?.() } finally { setBusy(null) }
  }

  return (
    <aside className="community-right">
      <div className="community-sticky">
        <section className="right-section community-card">
          <div className="right-title"><span>🐾 Mascotas para conocer</span><Link to="/explorar?seccion=pets">Ver más</Link></div>
          {(discover.suggested_pets || []).slice(0, 4).map((pet) => (
            <div className="suggestion-row" key={pet.id}>
              {pet.photo ? <img className="suggestion-avatar" src={pet.photo} alt="" loading="lazy" decoding="async" /> : <div className="suggestion-avatar">🐾</div>}
              <div className="suggestion-info"><Link className="suggestion-name" to={`/mascotas/${pet.id}`}>{pet.name}</Link><div className="suggestion-sub">{pet.species_display}{pet.locality ? ` · ${pet.locality}` : ''}</div></div>
              <button className={`mini-follow ${pet.following ? 'following' : ''}`} disabled={busy === pet.id} onClick={() => follow(pet)}>{pet.following ? 'Siguiendo' : 'Seguir'}</button>
            </div>
          ))}
          {!discover.suggested_pets?.length && <div className="composer-sub">Pronto aparecerán nuevas mascotas.</div>}
        </section>

        {!!discover.birthdays?.length && (
          <section className="right-section community-card">
            <div className="right-title"><span>🎂 Cumpleaños VetPaw</span></div>
            {discover.birthdays.slice(0, 4).map((item) => (
              <Link className="right-mini-card" to={`/mascotas/${item.pet_id}`} key={item.id}>
                {item.photo ? <img src={item.photo} alt="" loading="lazy" decoding="async" /> : <div className="suggestion-avatar">🎂</div>}
                <div><strong>{item.pet_name} cumple {item.age}</strong><span>Dejale una patita de cumpleaños.</span></div>
              </Link>
            ))}
          </section>
        )}

        <section className="right-section community-card">
          <div className="right-title"><span>🚨 Cerca de la comunidad</span><Link to="/mascotas-perdidas">Ver avisos</Link></div>
          {(discover.lost_pets || []).slice(0, 3).map((item) => (
            <Link className="right-mini-card" to="/mascotas-perdidas" key={item.id}>
              {item.photo ? <img src={item.photo} alt="" loading="lazy" decoding="async" /> : <div className="suggestion-avatar">🔎</div>}
              <div><strong>{item.report_type === 'lost' ? 'Se busca' : 'Encontrada'}: {item.pet_name}</strong><span>{item.locality || 'Sin localidad'}{item.province ? `, ${item.province}` : ''}</span></div>
            </Link>
          ))}
          {!discover.lost_pets?.length && <div className="composer-sub">No hay avisos activos en este momento.</div>}
        </section>


        {(discover.businesses?.length > 0 || discover.shelters?.length > 0) && (
          <section className="right-section community-card">
            <div className="right-title"><span>🤝 Ecosistema VetPaw</span><Link to="/explorar">Explorar</Link></div>
            {(discover.businesses || []).slice(0, 2).map((item) => (
              <Link className="right-mini-card" to={`/negocios/${item.slug}`} key={`business-${item.id}`}>
                {item.logo ? <img src={item.logo} alt="" loading="lazy" decoding="async" /> : <div className="suggestion-avatar">🛍️</div>}
                <div><strong>{item.name}</strong><span>{item.type_display} · {item.locality}</span></div>
              </Link>
            ))}
            {(discover.shelters || []).slice(0, 2).map((item) => (
              <Link className="right-mini-card" to={`/refugios/${item.slug}`} key={`shelter-${item.id}`}>
                {item.logo ? <img src={item.logo} alt="" loading="lazy" decoding="async" /> : <div className="suggestion-avatar">🏠</div>}
                <div><strong>{item.name}</strong><span>{item.capacity_status_display} · {item.locality}</span></div>
              </Link>
            ))}
          </section>
        )}

        <section className="right-section community-card">
          <div className="right-title"><span>🏥 Veterinarias en VetPaw</span><Link to="/explorar?seccion=clinics">Todas</Link></div>
          {(discover.clinics || []).slice(0, 4).map((clinic) => (
            <Link className="right-mini-card" to={`/clinicas/${clinic.slug}`} key={clinic.id}>
              {clinic.logo ? <img src={clinic.logo} alt="" loading="lazy" decoding="async" /> : <div className="suggestion-avatar">{fallback('clinic')}</div>}
              <div><strong>{clinic.name} {clinic.is_24h ? '· 24 h' : ''}</strong><span>{clinic.locality}, {clinic.province}</span></div>
            </Link>
          ))}
        </section>
      </div>
    </aside>
  )
}
