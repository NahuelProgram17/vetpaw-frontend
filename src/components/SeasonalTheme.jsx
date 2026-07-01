import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getActiveSeasonalTheme } from '../config/seasonalTheme';
import '../styles/seasonalTheme.css';

export default function SeasonalTheme() {
  const location = useLocation();
  const theme = useMemo(() => getActiveSeasonalTheme(), []);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!theme) {
      document.documentElement.removeAttribute('data-seasonal-theme');
      return;
    }
    document.documentElement.setAttribute('data-seasonal-theme', theme.id);
    return () => document.documentElement.removeAttribute('data-seasonal-theme');
  }, [theme]);

  useEffect(() => {
    // Si el usuario navega, no volvemos a mostrar el cartel si ya lo cerró.
    // El efecto visual de fondo sigue activo mientras el modo esté habilitado.
  }, [location.pathname]);

  if (!theme) return null;

  return (
    <>
      <div className={`seasonal-vetpaw-overlay seasonal-${theme.id}`} aria-hidden="true">
        <span className="seasonal-light seasonal-light-a" />
        <span className="seasonal-light seasonal-light-b" />
        <span className="seasonal-light seasonal-light-c" />
        <span className="seasonal-star seasonal-star-a">✦</span>
        <span className="seasonal-star seasonal-star-b">✧</span>
        <span className="seasonal-star seasonal-star-c">✦</span>
      </div>

      {!dismissed && (
        <aside className={`seasonal-vetpaw-card seasonal-${theme.id}`} aria-label={theme.label}>
          <div className="seasonal-card-flag" aria-hidden="true">
            <span>{theme.emoji}</span>
          </div>
          <div className="seasonal-card-copy">
            <span className="seasonal-card-eyebrow">{theme.eyebrow}</span>
            <strong>{theme.title}</strong>
            <small>{theme.text}</small>
          </div>
          <span className="seasonal-card-pill">{theme.pill}</span>
          <button
            type="button"
            className="seasonal-card-close"
            aria-label="Cerrar aviso temporal"
            onClick={() => setDismissed(true)}
          >
            ×
          </button>
        </aside>
      )}
    </>
  );
}

export function SeasonalMiniBadge({ compact = false }) {
  const theme = getActiveSeasonalTheme();
  if (!theme) return null;
  return (
    <span className={`seasonal-mini-badge seasonal-${theme.id} ${compact ? 'compact' : ''}`}>
      <span>{theme.emoji}</span>
      {!compact && <b>{theme.label}</b>}
    </span>
  );
}
