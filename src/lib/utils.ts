import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { PlaceType, Difficulty, PlaceStatus } from './types'
export { EXPLORER_LEVEL_NAMES } from './constants'

// ─────────────────────────────────────────
// Tailwind helper
// ─────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─────────────────────────────────────────
// Etykiety i kolory typów
// ─────────────────────────────────────────

export const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  ngo: 'NGO',
  city: 'Miejsce miejskie',
  quest: 'Punkt questowy',
  event: 'Event',
}

export const PLACE_TYPE_COLORS: Record<PlaceType, string> = {
  ngo: '#22c55e',    // zielony
  city: '#3b82f6',   // niebieski
  quest: '#f59e0b',  // złoty
  event: '#ec4899',  // różowy
}

export const PLACE_TYPE_ICONS: Record<PlaceType, string> = {
  ngo: '🏢',
  city: '🏛️',
  quest: '⭐',
  event: '🎪',
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Łatwy',
  medium: 'Średni',
  hard: 'Trudny',
}

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-red-400',
}

export const STATUS_LABELS: Record<PlaceStatus, string> = {
  undiscovered: 'Nieodkryty',
  discovered: 'Odkryty',
  completed: 'Zaliczony',
}

// ─────────────────────────────────────────
// Formatowanie
// ─────────────────────────────────────────

export function formatTime(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `~${h}h ${m}min` : `~${h}h`
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'dzisiaj'
  if (diffDays === 1) return 'wczoraj'
  if (diffDays < 7) return `${diffDays} dni temu`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} tyg. temu`
  return formatDate(dateString)
}

// ─────────────────────────────────────────
// URL Supabase Storage
// ─────────────────────────────────────────

export function getStorageUrl(path: string | null): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return path
}

// ─────────────────────────────────────────
// Generowanie slugów
// ─────────────────────────────────────────

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // usuń znaki diakrytyczne
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
    .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
    .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ─────────────────────────────────────────
// Google Maps link
// ─────────────────────────────────────────

export function getGoogleMapsUrl(lat: number, lng: number, name?: string): string {
  const query = name
    ? encodeURIComponent(name)
    : `${lat},${lng}`
  return `https://www.google.com/maps/search/?api=1&query=${query}&query_place=${lat},${lng}`
}

// ─────────────────────────────────────────
// Obliczenie poziomu explorera
// ─────────────────────────────────────────

export function getExplorerLevel(points: number): { level: number; nextLevelPoints: number; progress: number } {
  const thresholds = [0, 50, 150, 300, 500, 750, 1050, 1400, 1800, 2300, 3000]

  let level = 1
  for (let i = 1; i < thresholds.length; i++) {
    if (points >= thresholds[i]) {
      level = i + 1
    } else {
      break
    }
  }

  const currentThreshold = thresholds[level - 1] || 0
  const nextThreshold = thresholds[level] || thresholds[thresholds.length - 1]
  const progress = nextThreshold > currentThreshold
    ? ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100
    : 100

  return { level, nextLevelPoints: nextThreshold, progress: Math.min(progress, 100) }
}
