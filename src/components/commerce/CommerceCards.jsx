import { Link } from 'react-router-dom'

const money = value => value === null || value === undefined || value === '' ? '' : Number(value).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

export function CatalogCard({ item, onFavorite, ownerActions }) {
  return <article className="commerce-card">
    <div className="commerce-card-media">{item.image_url ? <img src={item.image_url} alt={item.title} /> : <span>{item.item_type === 'service' ? '✂️' : '🛍️'}</span>}</div>
    <div className="commerce-card-body">
      <div className="commerce-card-kicker">{item.item_type_display} · {item.category_display}</div>
      <h3>{item.title}</h3><p>{item.description}</p>
      <div className="commerce-price">{item.price_on_request ? 'Consultar precio' : <>{item.promotional_price && <del>{money(item.price)}</del>}<strong>{money(item.promotional_price || item.price)}</strong></>}</div>
      <div className="commerce-pills">{item.requires_booking && <span>📅 Con reserva</span>}{item.delivery && <span>📦 Envío</span>}{item.home_service && <span>🏠 A domicilio</span>}{item.pickup && <span>🛍️ Retiro</span>}</div>
      <div className="commerce-actions"><Link to={`/negocios/${item.business_slug}/catalogo/${item.id}`}>Ver detalle</Link>{onFavorite && <button type="button" onClick={() => onFavorite(item)}>{item.is_favorite ? '♥ Guardado' : '♡ Guardar'}</button>}{ownerActions}</div>
    </div>
  </article>
}

export function PromotionCard({ promotion, onFavorite, ownerActions }) {
  return <article className="commerce-card promotion">
    <div className="commerce-card-media">{promotion.image_url ? <img src={promotion.image_url} alt={promotion.title} /> : <span>🎁</span>}</div>
    <div className="commerce-card-body"><div className="commerce-card-kicker">Promoción · hasta {new Date(promotion.ends_at).toLocaleDateString('es-AR')}</div><h3>{promotion.title}</h3><p>{promotion.description}</p><div className="commerce-price">{promotion.previous_price && <del>{money(promotion.previous_price)}</del>} {promotion.promotional_price && <strong>{money(promotion.promotional_price)}</strong>}</div><div className="commerce-actions">{promotion.catalog_item && <Link to={`/negocios/${promotion.business_slug}/catalogo/${promotion.catalog_item}`}>Ver detalle</Link>}{onFavorite && <button type="button" onClick={() => onFavorite(promotion)}>{promotion.is_favorite ? '♥ Guardada' : '♡ Guardar'}</button>}{ownerActions}</div></div>
  </article>
}
