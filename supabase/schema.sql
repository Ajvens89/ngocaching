-- ============================================================
-- MiejskiTrop (NGOcaching) — Schemat bazy danych
-- PostgreSQL / Supabase
-- ============================================================

-- Włącz rozszerzenia
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "earthdistance" CASCADE;
CREATE EXTENSION IF NOT EXISTS "cube" CASCADE;

-- ─────────────────────────────────────────
-- KATEGORIE
-- ─────────────────────────────────────────
CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT UNIQUE NOT NULL,
  icon       TEXT,
  color      TEXT DEFAULT '#22c55e',
  type       TEXT CHECK (type IN ('place', 'ngo', 'quest', 'all')) DEFAULT 'all',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- TAGI
-- ─────────────────────────────────────────
CREATE TABLE tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- ORGANIZACJE (NGO)
-- ─────────────────────────────────────────
CREATE TABLE organizations (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  slug               TEXT UNIQUE NOT NULL,
  short_description  TEXT,
  description        TEXT,
  activity_areas     TEXT[] DEFAULT '{}',
  support_types      TEXT[] DEFAULT '{}',
  recipient_groups   TEXT[] DEFAULT '{}',
  address            TEXT,
  city               TEXT DEFAULT 'Bielsko-Biała',
  latitude           DECIMAL(10, 8),
  longitude          DECIMAL(11, 8),
  phone              TEXT,
  email              TEXT,
  website            TEXT,
  opening_hours      JSONB,
  accessibility_info TEXT,
  is_accessible      BOOLEAN DEFAULT FALSE,
  cover_image        TEXT,
  gallery            TEXT[] DEFAULT '{}',
  category_id        UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active          BOOLEAN DEFAULT TRUE,
  is_promoted        BOOLEAN DEFAULT FALSE,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- PUNKTY (places)
-- ─────────────────────────────────────────
CREATE TABLE places (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,
  slug                 TEXT UNIQUE NOT NULL,
  type                 TEXT CHECK (type IN ('ngo', 'city', 'quest', 'event')) NOT NULL,
  short_description    TEXT,
  description          TEXT,
  full_description     TEXT,
  latitude             DECIMAL(10, 8) NOT NULL,
  longitude            DECIMAL(11, 8) NOT NULL,
  address              TEXT,
  category_id          UUID REFERENCES categories(id) ON DELETE SET NULL,
  organization_id      UUID REFERENCES organizations(id) ON DELETE SET NULL,
  cover_image          TEXT,
  gallery              TEXT[] DEFAULT '{}',
  hint                 TEXT,
  task_content         TEXT,
  unlockable_content   TEXT,
  verification_type    TEXT CHECK (verification_type IN ('gps', 'qr', 'password', 'answer')) DEFAULT 'gps',
  verification_data    JSONB,
  gps_radius           INTEGER DEFAULT 50,
  is_active            BOOLEAN DEFAULT TRUE,
  is_promoted          BOOLEAN DEFAULT FALSE,
  event_start          TIMESTAMPTZ,
  event_end            TIMESTAMPTZ,
  accessibility        TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- TAGI PUNKTÓW (junction)
-- ─────────────────────────────────────────
CREATE TABLE place_tags (
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  tag_id   UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (place_id, tag_id)
);

-- ─────────────────────────────────────────
-- KODY QR
-- ─────────────────────────────────────────
CREATE TABLE qr_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  place_id      UUID REFERENCES places(id) ON DELETE CASCADE,
  is_active     BOOLEAN DEFAULT TRUE,
  is_single_use BOOLEAN DEFAULT FALSE,
  scan_count    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- ODZNAKI
-- ─────────────────────────────────────────
CREATE TABLE badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  image       TEXT,
  quest_id    UUID,   -- wypełniane po stworzeniu quest
  criteria    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- QUESTY
-- ─────────────────────────────────────────
CREATE TABLE quests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 TEXT NOT NULL,
  slug                  TEXT UNIQUE NOT NULL,
  description           TEXT,
  theme                 TEXT,
  cover_image           TEXT,
  difficulty            TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'easy',
  estimated_time        INTEGER,                -- minuty
  completion_conditions JSONB DEFAULT '{"require_all": true}'::JSONB,
  reward_description    TEXT,
  badge_id              UUID REFERENCES badges(id) ON DELETE SET NULL,
  is_active             BOOLEAN DEFAULT TRUE,
  is_featured           BOOLEAN DEFAULT FALSE,
  category_id           UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Dodaj FK do badges po stworzeniu quests
ALTER TABLE badges ADD CONSTRAINT badges_quest_id_fkey
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────
-- ETAPY QUESTÓW
-- ─────────────────────────────────────────
CREATE TABLE quest_steps (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id     UUID REFERENCES quests(id) ON DELETE CASCADE NOT NULL,
  place_id     UUID REFERENCES places(id) ON DELETE CASCADE,
  step_number  INTEGER NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  hint         TEXT,
  task_content TEXT,
  is_optional  BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (quest_id, step_number)
);

-- ─────────────────────────────────────────
-- PROFILE UŻYTKOWNIKÓW
-- ─────────────────────────────────────────
CREATE TABLE user_profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username       TEXT UNIQUE,
  display_name   TEXT,
  avatar_url     TEXT,
  bio            TEXT,
  explorer_level INTEGER DEFAULT 1,
  total_points   INTEGER DEFAULT 0,
  home_city      TEXT DEFAULT 'Bielsko-Biała',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- CHECK-INY
-- ─────────────────────────────────────────
CREATE TABLE checkins (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  place_id             UUID REFERENCES places(id) ON DELETE CASCADE NOT NULL,
  quest_step_id        UUID REFERENCES quest_steps(id) ON DELETE SET NULL,
  verification_method  TEXT CHECK (verification_method IN ('gps', 'qr', 'password', 'answer')) NOT NULL,
  verified_at          TIMESTAMPTZ DEFAULT NOW(),
  points_earned        INTEGER DEFAULT 10,
  latitude_at_checkin  DECIMAL(10, 8),
  longitude_at_checkin DECIMAL(11, 8),
  notes                TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, place_id)   -- 1 check-in per miejsce per użytkownik
);

-- ─────────────────────────────────────────
-- POSTĘP QUESTÓW
-- ─────────────────────────────────────────
CREATE TABLE user_progress (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  quest_id         UUID REFERENCES quests(id) ON DELETE CASCADE NOT NULL,
  started_at       TIMESTAMPTZ DEFAULT NOW(),
  completed_at     TIMESTAMPTZ,
  current_step     INTEGER DEFAULT 1,
  steps_completed  INTEGER[] DEFAULT '{}',
  is_completed     BOOLEAN DEFAULT FALSE,
  UNIQUE (user_id, quest_id)
);

-- ─────────────────────────────────────────
-- ODZNAKI UŻYTKOWNIKÓW
-- ─────────────────────────────────────────
CREATE TABLE user_badges (
  user_id   UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  badge_id  UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

-- ─────────────────────────────────────────
-- ULUBIONE
-- ─────────────────────────────────────────
CREATE TABLE favorites (
  user_id    UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  place_id   UUID REFERENCES places(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, place_id)
);

-- ─────────────────────────────────────────
-- INDEKSY
-- ─────────────────────────────────────────
CREATE INDEX idx_places_type        ON places(type);
CREATE INDEX idx_places_category    ON places(category_id);
CREATE INDEX idx_places_active      ON places(is_active);
CREATE INDEX idx_places_location    ON places(latitude, longitude);
CREATE INDEX idx_checkins_user      ON checkins(user_id);
CREATE INDEX idx_checkins_place     ON checkins(place_id);
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_qr_codes_code      ON qr_codes(code);
CREATE INDEX idx_organizations_active ON organizations(is_active);

-- ─────────────────────────────────────────
-- FUNKCJE POMOCNICZE
-- ─────────────────────────────────────────

-- Automatyczne tworzenie profilu po rejestracji
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Inkrementacja punktów użytkownika
CREATE OR REPLACE FUNCTION increment_user_points(user_id UUID, points_to_add INTEGER)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_profiles
  SET
    total_points = total_points + points_to_add,
    explorer_level = GREATEST(1, FLOOR(LOG(1.5, GREATEST(total_points + points_to_add, 1) / 50.0 + 1) + 1)::INTEGER),
    updated_at = NOW()
  WHERE id = user_id;
END;
$$;

-- Aktualizacja updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER update_places_updated_at       BEFORE UPDATE ON places       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_quests_updated_at        BEFORE UPDATE ON quests        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────

-- Włącz RLS
ALTER TABLE categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags            ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE places          ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_tags      ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests          ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_steps     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress   ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges     ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites       ENABLE ROW LEVEL SECURITY;

-- Publiczny odczyt danych
CREATE POLICY "Publiczny odczyt kategorii"     ON categories    FOR SELECT USING (TRUE);
CREATE POLICY "Publiczny odczyt tagów"         ON tags          FOR SELECT USING (TRUE);
CREATE POLICY "Publiczny odczyt organizacji"   ON organizations FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Publiczny odczyt miejsc"        ON places        FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Publiczny odczyt tagów miejsc"  ON place_tags    FOR SELECT USING (TRUE);
CREATE POLICY "Publiczny odczyt questów"       ON quests        FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Publiczny odczyt etapów"        ON quest_steps   FOR SELECT USING (TRUE);
CREATE POLICY "Publiczny odczyt odznak"        ON badges        FOR SELECT USING (TRUE);

-- Użytkownicy zarządzają własnym profilem
CREATE POLICY "Użytkownik czyta własny profil"
  ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Użytkownik aktualizuje własny profil"
  ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Check-iny
CREATE POLICY "Użytkownik widzi własne check-iny"
  ON checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Użytkownik tworzy check-iny"
  ON checkins FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Postęp questów
CREATE POLICY "Użytkownik zarządza własnym postępem"
  ON user_progress FOR ALL USING (auth.uid() = user_id);

-- Odznaki użytkowników
CREATE POLICY "Użytkownik widzi własne odznaki"
  ON user_badges FOR SELECT USING (auth.uid() = user_id);

-- Ulubione
CREATE POLICY "Użytkownik zarządza ulubionymi"
  ON favorites FOR ALL USING (auth.uid() = user_id);

-- QR kody — tylko service role
CREATE POLICY "Odczyt QR kodów"
  ON qr_codes FOR SELECT USING (is_active = TRUE);
