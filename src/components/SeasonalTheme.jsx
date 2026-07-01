import { useEffect, useMemo } from 'react';
import { getActiveSeasonalTheme } from '../config/seasonalTheme';
import '../styles/seasonalTheme.css';

export default function SeasonalTheme() {
  const theme = useMemo(() => getActiveSeasonalTheme(), []);

  useEffect(() => {
    if (!theme) {
      document.documentElement.removeAttribute('data-seasonal-theme');
      return;
    }

    document.documentElement.setAttribute('data-seasonal-theme', theme.id);
    return () => document.documentElement.removeAttribute('data-seasonal-theme');
  }, [theme]);

  if (!theme) return null;

  return (
    <>
      <div className={`seasonal-vetpaw-overlay seasonal-${theme.id}`} aria-hidden="true">
        <span className="seasonal-light seasonal-light-a" />
        <span className="seasonal-light seasonal-light-b" />
        <span className="seasonal-light seasonal-light-c" />
        <span className="seasonal-light seasonal-light-d" />
        <span className="seasonal-star seasonal-star-a">✦</span>
        <span className="seasonal-star seasonal-star-b">✧</span>
        <span className="seasonal-star seasonal-star-c">✦</span>
        <span className="seasonal-star seasonal-star-d">✧</span>
      </div>

      <div className={`seasonal-top-banner seasonal-${theme.id}`} aria-label={theme.label}>
        <span className="seasonal-flag-stripes" aria-hidden="true" />
        <div className="seasonal-banner-content">
          <span className="seasonal-banner-badge">{theme.emoji} {theme.label}</span>
          <strong>{theme.title}</strong>
          <span>{theme.bannerText || theme.text}</span>
        </div>
        <span className="seasonal-banner-ball" aria-hidden="true">⚽</span>
      </div>

      <div className={`seasonal-quick-badges seasonal-${theme.id}`} aria-hidden="true">
        {(theme.badges || []).map((badge) => (
          <span key={badge}>{badge}</span>
        ))}
      </div>
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
