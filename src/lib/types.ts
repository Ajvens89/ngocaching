// ============================================================
// MiejskiTrop — Typy TypeScript
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

// ─────────────────────────────────────────
// Enums
// ─────────────────────────────────────────

export type PlaceType = 'ngo' | 'city' | 'quest' | 'event'
export type VerificationType = 'gps' | 'qr' | 'password' | 'answer'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type VerificationMethod = 'gps' | 'qr' | 'password' | 'answer'
export type PlaceStatus = 'undiscovered' | 'discovered' | 'completed'
export type CategoryType = 'place' | 'ngo' | 'quest' | 'all'

// ─────────────────────────────────────────
// Category & Tag
// ─────────────────────────────────────────

export interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  color: string | null
  type: CategoryType
  created_at: string
}

export interface Tag {
  id: string
  name: string
  slug: string
  created_at: string
}

// ─────────────────────────────────────────
// Opening Hours
// ─────────────────────────────────────────

export interface OpeningHours {
  mon?: string | null
  tue?: string | null
  wed?: string | null
  thu?: string | null
  fri?: string | null
  sat?: string | null
  sun?: string | null
  notes?: string | null
}

// ─────────────────────────────────────────
// Organization (NGO)
// ─────────────────────────────────────────

export interface Organization {
  id: string
  name: string
  slug: string
  short_description: string | null
  description: string | null
  activity_areas: string[]
  support_types: string[]
  recipient_groups: string[]
  address: string | null
  city: string
  latitude: number | null
  longitude: number | null
  phone: string | null
  email: string | null
  website: string | null
  opening_hours: OpeningHours | null
  accessibility_info: string | null
  is_accessible: boolean
  cover_image: string | null
  gallery: string[]
  category_id: string | null
  category?: Category
  is_active: boolean
  is_promoted: boolean
  created_at: string
  updated_at: string
}

// ─────────────────────────────────────────
// Verification Data
// ─────────────────────────────────────────

export interface VerificationDataGPS {
  radius: number
}

export interface VerificationDataQR {
  qr_code_id: string
}

export interface VerificationDataPassword {
  password_hash: string
}

export interface VerificationDataAnswer {
  question: string
  answer_hash: string
  hint?: string
}

export type VerificationData =
  | VerificationDataGPS
  | VerificationDataQR
  | VerificationDataPassword
  | VerificationDataAnswer

// ─────────────────────────────────────────
// Place (Punkt)
// ─────────────────────────────────────────

export interface Place {
  id: string
  name: string
  slug: string
  type: PlaceType
  short_description: string | null
  description: string | null
  full_description: string | null
  latitude: number
  longitude: number
  address: string | null
  category_id: string | null
  category?: Category
  organization_id: string | null
  organization?: Organization
  cover_image: string | null
  gallery: string[]
  hint: string | null
  task_content: string | null
  unlockable_content: string | null
  verification_type: VerificationType
  verification_data: VerificationData | null
  gps_radius: number
  is_active: boolean
  is_promoted: boolean
  event_start: string | null
  event_end: string | null
  accessibility: string | null
  tags?: Tag[]
  created_at: string
  updated_at: string
  // Virtual fields (computed client-side)
  distance?: number
  user_status?: PlaceStatus
}

// ─────────────────────────────────────────
// QR Code
// ─────────────────────────────────────────

export interface QRCode {
  id: string
  code: string
  place_id: string | null
  place?: Place
  is_active: boolean
  is_single_use: boolean
  scan_count: number
  created_at: string
}

// ─────────────────────────────────────────
// Quest
// ─────────────────────────────────────────

export interface CompletionConditions {
  require_all?: boolean
  min_steps?: number
  required_step_numbers?: number[]
}

export interface Quest {
  id: string
  title: string
  slug: string
  description: string | null
  theme: string | null
  cover_image: string | null
  difficulty: Difficulty
  estimated_time: number | null
  completion_conditions: CompletionConditions | null
  reward_description: string | null
  badge_id: string | null
  badge?: Badge
  is_active: boolean
  is_featured: boolean
  category_id: string | null
  category?: Category
  steps?: QuestStep[]
  created_at: string
  updated_at: string
  // Virtual
  user_progress?: UserProgress
  steps_count?: number
}

// ─────────────────────────────────────────
// Quest Step
// ─────────────────────────────────────────

export interface QuestStep {
  id: string
  quest_id: string
  place_id: string
  place?: Place
  step_number: number
  title: string
  description: string | null
  hint: string | null
  task_content: string | null
  is_optional: boolean
  created_at: string
  // Virtual
  is_completed?: boolean
}

// ─────────────────────────────────────────
// User Profile
// ─────────────────────────────────────────

export interface UserProfile {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  explorer_level: number
  total_points: number
  home_city: string
  is_admin?: boolean
  created_at: string
  updated_at: string
}

// ─────────────────────────────────────────
// Check-in
// ─────────────────────────────────────────

export interface Checkin {
  id: string
  user_id: string
  place_id: string
  place?: Place
  quest_step_id: string | null
  verification_method: VerificationMethod
  verified_at: string
  points_earned: number
  latitude_at_checkin: number | null
  longitude_at_checkin: number | null
  notes: string | null
  created_at: string
}

// ─────────────────────────────────────────
// User Progress
// ─────────────────────────────────────────

export interface UserProgress {
  id: string
  user_id: string
  quest_id: string
  quest?: Quest
  started_at: string
  completed_at: string | null
  current_step: number
  steps_completed: number[]
  is_completed: boolean
}

// ─────────────────────────────────────────
// Badge
// ─────────────────────────────────────────

export interface Badge {
  id: string
  name: string
  description: string | null
  image: string | null
  quest_id: string | null
  criteria: Json | null
  created_at: string
}

export interface UserBadge {
  user_id: string
  badge_id: string
  badge?: Badge
  earned_at: string
}

// ─────────────────────────────────────────
// Favorites
// ─────────────────────────────────────────

export interface Favorite {
  user_id: string
  place_id: string
  place?: Place
  created_at: string
}

// ─────────────────────────────────────────
// API / Form types
// ─────────────────────────────────────────

export interface MapFilters {
  type: PlaceType | 'all'
  category_id: string | null
  status: 'all' | 'undiscovered' | 'completed'
  search: string
}

export interface CheckinRequest {
  place_id: string
  method: VerificationMethod
  latitude?: number
  longitude?: number
  qr_code?: string
  password?: string
  answer?: string
  quest_step_id?: string
}

export interface CheckinResponse {
  success: boolean
  checkin?: Checkin
  points_earned?: number
  quest_completed?: boolean
  badge_earned?: Badge
  error?: string
}

export interface Coordinates {
  latitude: number
  longitude: number
}

// ─────────────────────────────────────────
// Admin types
// ─────────────────────────────────────────

export interface PlaceFormData {
  name: string
  type: PlaceType
  short_description: string
  description: string
  full_description?: string
  latitude: number
  longitude: number
  address: string
  category_id: string
  organization_id?: string
  hint?: string
  task_content?: string
  unlockable_content?: string
  verification_type: VerificationType
  gps_radius: number
  is_active: boolean
  is_promoted: boolean
  event_start?: string
  event_end?: string
  accessibility?: string
}

export interface OrganizationFormData {
  name: string
  short_description: string
  description: string
  activity_areas: string[]
  support_types: string[]
  recipient_groups: string[]
  address: string
  latitude: number
  longitude: number
  phone?: string
  email?: string
  website?: string
  opening_hours?: OpeningHours
  accessibility_info?: string
  is_accessible: boolean
  category_id: string
}