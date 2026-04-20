// ============================================================
// MiejskiTrop — Obliczenia geograficzne
// ============================================================

/**
 * Oblicza odległość między dwoma punktami GPS (formuła Haversine)
 * @returns odległość w metrach
 */
export function getDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000 // promień Ziemi w metrach
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Formatuje odległość do czytelnej formy
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }
  return `${(meters / 1000).toFixed(1)} km`
}

/**
 * Sprawdza czy użytkownik jest w zasięgu GPS punktu
 */
export function isWithinRadius(
  userLat: number, userLon: number,
  placeLat: number, placeLon: number,
  radiusMeters: number
): boolean {
  const distance = getDistance(userLat, userLon, placeLat, placeLon)
  return distance <= radiusMeters
}

/**
 * Pobiera aktualną pozycję GPS użytkownika
 */
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolokalizacja nie jest wspierana przez przeglądarkę'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    })
  })
}

/**
 * Centrum Bielska-Białej (domyślna pozycja mapy)
 */
export const BIELSKO_CENTER = {
  lat: 49.8224,
  lng: 19.0444,
} as const

export const DEFAULT_ZOOM = 14
export const MIN_ZOOM = 11
export const MAX_ZOOM = 19
