// ============================================================
// MiejskiTrop — Stałe aplikacji
// ============================================================

export const APP_NAME = 'MiejskiTrop'
export const APP_TAGLINE = 'Odkryj Bielsko-Białą. Poznaj tych, którzy mu służą.'
export const APP_VERSION = '0.1.0'

export const DEFAULT_CATEGORIES = [
  { name: 'Pomoc społeczna', slug: 'pomoc-spoleczna', icon: '🤝', color: '#22c55e', type: 'ngo' },
  { name: 'Kultura i sztuka', slug: 'kultura', icon: '🎭', color: '#a855f7', type: 'all' },
  { name: 'Sport i rekreacja', slug: 'sport', icon: '⚽', color: '#3b82f6', type: 'all' },
  { name: 'Edukacja', slug: 'edukacja', icon: '📚', color: '#f59e0b', type: 'all' },
  { name: 'Ekologia', slug: 'ekologia', icon: '🌿', color: '#10b981', type: 'all' },
  { name: 'Zdrowie', slug: 'zdrowie', icon: '❤️', color: '#ef4444', type: 'ngo' },
  { name: 'Dzieci i młodzież', slug: 'dzieci', icon: '👦', color: '#f97316', type: 'ngo' },
  { name: 'Seniorzy', slug: 'seniorzy', icon: '👴', color: '#6366f1', type: 'ngo' },
  { name: 'Historia', slug: 'historia', icon: '🏛️', color: '#78716c', type: 'place' },
  { name: 'Architektura', slug: 'architektura', icon: '🏗️', color: '#64748b', type: 'place' },
  { name: 'Aktywizm', slug: 'aktywizm', icon: '✊', color: '#dc2626', type: 'ngo' },
  { name: 'Wolontariat', slug: 'wolontariat', icon: '💪', color: '#0ea5e9', type: 'ngo' },
] as const

export const EXPLORER_LEVEL_NAMES = [
  'Nowicjusz',       // 1
  'Obserwator',      // 2
  'Odkrywca',        // 3
  'Badacz',          // 4
  'Weteran',         // 5
  'Ekspert',         // 6
  'Mistrz',          // 7
  'Legenda',         // 8
  'Ambasador',       // 9
  'Strażnik Miasta', // 10
]

export const POINTS_PER_ACTION = {
  gps_checkin: 10,
  qr_checkin: 15,
  answer_checkin: 20,
  quest_complete: 50,
  first_checkin: 25, // bonus za pierwsze zaliczenie
} as const

export const MAP_TILE_PROVIDERS = {
  // Carto Voyager — elegancki, czytelny styl
  CARTO_VOYAGER: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  // OSM Standard
  OSM: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  // Carto Dark — dla dark mode
  CARTO_DARK: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
} as const

export const MAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
