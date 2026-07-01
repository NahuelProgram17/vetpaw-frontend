// VetPaw - Temas temporales / fechas especiales
// Para desactivar todo y volver al diseño original:
// 1) cambiar SEASONAL_THEME_ENABLED a false
//    o
// 2) en .env poner: VITE_SEASONAL_THEME_ENABLED=false
//
// Para cambiar de tema:
// - Mundial / Selección Argentina: VITE_SEASONAL_THEME=worldcup
// - Navidad: VITE_SEASONAL_THEME=christmas
// - Ninguno: VITE_SEASONAL_THEME=none

const envTheme = import.meta.env.VITE_SEASONAL_THEME;
const envEnabled = import.meta.env.VITE_SEASONAL_THEME_ENABLED;

export const SEASONAL_THEME_ID = envTheme || 'worldcup';
export const SEASONAL_THEME_ENABLED =
  envEnabled === undefined
    ? true
    : String(envEnabled).toLowerCase() !== 'false';

export const SEASONAL_THEMES = {
  worldcup: {
    id: 'worldcup',
    label: 'Modo Mundial',
    emoji: '🇦🇷',
    eyebrow: 'VetPaw Mundial',
    title: 'Tu mascota también alienta',
    text: 'Turnos, vacunas e historial siempre listos, también en días de partido.',
    pill: 'Selección Argentina',
    accentA: '#6bcaff',
    accentB: '#ffffff',
    accentC: '#ffb300',
  },
  christmas: {
    id: 'christmas',
    label: 'Modo Navidad',
    emoji: '🎄',
    eyebrow: 'VetPaw Navidad',
    title: 'Fiestas seguras para tu mascota',
    text: 'Recordá revisar vacunas, antiparasitarios y cuidado con ruidos fuertes.',
    pill: 'Felices fiestas',
    accentA: '#4CAF50',
    accentB: '#ffffff',
    accentC: '#ff5252',
  },
  none: null,
};

export function getActiveSeasonalTheme() {
  if (!SEASONAL_THEME_ENABLED) return null;
  return SEASONAL_THEMES[SEASONAL_THEME_ID] || null;
}
