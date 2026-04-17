# NGOcaching — Modele Danych

## Diagram ERD (uproszczony)

```
users ─────────────────────────────────────────────┐
  │                                                 │
  ├── user_profiles                                 │
  │                                                 │
  ├── checkins ──────────── places ────── organizations
  │       │                    │
  ├── user_progress ──── quest_steps ──── quests
  │
  ├── user_badges ────── badges
  │
  └── favorites ──────── places
```

---

## Tabele szczegółowo

### `categories`
Kategorie dla NGO, miejsc i questów.
```
id            UUID PK
name          TEXT NOT NULL           -- "Pomoc społeczna"
slug          TEXT UNIQUE             -- "pomoc-spoleczna"
icon          TEXT                    -- emoji lub nazwa ikony
color         TEXT                    -- "#22c55e" (hex)
type          ENUM(place,ngo,quest,all)
created_at    TIMESTAMPTZ
```

### `tags`
Tagi do wielokrotnego oznaczania punktów.
```
id            UUID PK
name          TEXT UNIQUE             -- "dostępny"
slug          TEXT UNIQUE             -- "dostepny"
created_at    TIMESTAMPTZ
```

### `organizations`
Organizacje pozarządowe i ich profile.
```
id                UUID PK
name              TEXT NOT NULL       -- "Caritas Diecezji Bielsko-Żywieckiej"
slug              TEXT UNIQUE         -- "caritas-bielsko"
short_description TEXT                -- 1-2 zdania
description       TEXT                -- pełny opis
activity_areas    TEXT[]              -- ["pomoc społeczna", "dzieci"]
support_types     TEXT[]              -- ["żywność", "odzież", "poradnictwo"]
recipient_groups  TEXT[]              -- ["seniorzy", "rodziny", "bezdomni"]
address           TEXT                -- "ul. Przykładowa 1"
city              TEXT DEFAULT 'Bielsko-Biała'
latitude          DECIMAL(10,8)
longitude         DECIMAL(11,8)
phone             TEXT
email             TEXT
website           TEXT
opening_hours     JSONB               -- {"pon-pt": "9:00-17:00"}
accessibility_info TEXT               -- info dla osób z niepełnosprawnościami
is_accessible     BOOLEAN
cover_image       TEXT                -- URL z Supabase Storage
gallery           TEXT[]              -- tablica URL-i
category_id       UUID FK→categories
is_active         BOOLEAN DEFAULT true
is_promoted       BOOLEAN DEFAULT false
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ
```

### `places`
Wszystkie punkty na mapie (NGO-siedziby, miejsca miejskie, etapy questów, eventy).
```
id                  UUID PK
name                TEXT NOT NULL       -- "Muzeum Miejskie"
slug                TEXT UNIQUE
type                ENUM(ngo, city, quest, event) NOT NULL
short_description   TEXT
description         TEXT
full_description    TEXT                -- odblokowywana po zaliczeniu
latitude            DECIMAL(10,8) NOT NULL
longitude           DECIMAL(11,8) NOT NULL
address             TEXT
category_id         UUID FK→categories
organization_id     UUID FK→organizations  -- null jeśli nie NGO
cover_image         TEXT
gallery             TEXT[]
hint                TEXT                -- wskazówka dla użytkownika
task_content        TEXT                -- treść zadania przy punkcie
unlockable_content  TEXT                -- treść widoczna po zaliczeniu
verification_type   ENUM(gps,qr,password,answer,combined)
verification_data   JSONB               -- {"answer": "hash", "radius": 50}
gps_radius          INTEGER DEFAULT 50  -- metry
is_active           BOOLEAN DEFAULT true
is_promoted         BOOLEAN DEFAULT false
event_start         TIMESTAMPTZ         -- dla event points
event_end           TIMESTAMPTZ
accessibility       TEXT
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

### `place_tags` (tabela łącząca)
```
place_id     UUID FK→places
tag_id       UUID FK→tags
PRIMARY KEY (place_id, tag_id)
```

### `qr_codes`
Kody QR przypisane do punktów.
```
id           UUID PK
code         TEXT UNIQUE NOT NULL    -- unikalny token (np. UUID)
place_id     UUID FK→places
is_active    BOOLEAN DEFAULT true
is_single_use BOOLEAN DEFAULT false  -- jednorazowy lub wielokrotny
scan_count   INTEGER DEFAULT 0
created_at   TIMESTAMPTZ
```

### `quests`
Questy tematyczne złożone z etapów.
```
id                    UUID PK
title                 TEXT NOT NULL   -- "Odkryj NGO Bielska"
slug                  TEXT UNIQUE
description           TEXT
theme                 TEXT            -- "pomoc społeczna" / "historia"
cover_image           TEXT
difficulty            ENUM(easy,medium,hard)
estimated_time        INTEGER         -- minuty
completion_conditions JSONB           -- {"min_steps": 5, "require_all": false}
reward_description    TEXT
badge_id              UUID FK→badges
is_active             BOOLEAN DEFAULT true
is_featured           BOOLEAN DEFAULT false
category_id           UUID FK→categories
created_at            TIMESTAMPTZ
updated_at            TIMESTAMPTZ
```

### `quest_steps`
Etapy questów — każdy to punkt do odwiedzenia/zaliczenia.
```
id              UUID PK
quest_id        UUID FK→quests CASCADE DELETE
place_id        UUID FK→places
step_number     INTEGER NOT NULL    -- kolejność
title           TEXT NOT NULL
description     TEXT
hint            TEXT                -- dodatkowa wskazówka
task_content    TEXT                -- zadanie do wykonania w tym etapie
is_optional     BOOLEAN DEFAULT false
UNIQUE(quest_id, step_number)
```

### `user_profiles`
Rozszerzenie profilu Supabase Auth.
```
id              UUID PK → auth.users(id)
username        TEXT UNIQUE
display_name    TEXT
avatar_url      TEXT
bio             TEXT
explorer_level  INTEGER DEFAULT 1
total_points    INTEGER DEFAULT 0
home_city       TEXT DEFAULT 'Bielsko-Biała'
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

### `checkins`
Historia zaliczonych punktów przez użytkownika.
```
id                  UUID PK
user_id             UUID FK→user_profiles CASCADE
place_id            UUID FK→places
quest_step_id       UUID FK→quest_steps    -- null jeśli poza questem
verification_method ENUM(gps,qr,password,answer)
verified_at         TIMESTAMPTZ DEFAULT NOW()
points_earned       INTEGER DEFAULT 10
latitude_at_checkin DECIMAL(10,8)          -- współrzędne w momencie check-in
longitude_at_checkin DECIMAL(11,8)
notes               TEXT
UNIQUE(user_id, place_id)                  -- 1 check-in per miejsce per user
```

### `user_progress`
Postęp użytkownika w questach.
```
id               UUID PK
user_id          UUID FK→user_profiles CASCADE
quest_id         UUID FK→quests
started_at       TIMESTAMPTZ DEFAULT NOW()
completed_at     TIMESTAMPTZ
current_step     INTEGER DEFAULT 1
steps_completed  INTEGER[] DEFAULT '{}'    -- tablica step_number
is_completed     BOOLEAN DEFAULT false
UNIQUE(user_id, quest_id)
```

### `badges`
Odznaki do zdobycia przez użytkowników.
```
id           UUID PK
name         TEXT NOT NULL           -- "Odkrywca NGO"
description  TEXT
image        TEXT                    -- URL SVG/PNG
quest_id     UUID FK→quests          -- odznaka za quest (opcjonalne)
criteria     JSONB                   -- {"checkins": 10} (dowolne kryteria)
created_at   TIMESTAMPTZ
```

### `user_badges`
Odznaki zdobyte przez użytkowników.
```
user_id    UUID FK→user_profiles CASCADE
badge_id   UUID FK→badges
earned_at  TIMESTAMPTZ DEFAULT NOW()
PRIMARY KEY (user_id, badge_id)
```

### `favorites`
Zapisane przez użytkownika miejsca.
```
user_id    UUID FK→user_profiles CASCADE
place_id   UUID FK→places
created_at TIMESTAMPTZ DEFAULT NOW()
PRIMARY KEY (user_id, place_id)
```

---

## Typy JSONB — szczegóły

### `verification_data` (places)
```json
// Dla type = "gps"
{ "radius": 50 }

// Dla type = "qr"
{ "qr_code_id": "uuid-kodu" }

// Dla type = "password"
{ "password_hash": "bcrypt-hash" }

// Dla type = "answer"
{
  "question": "Ile stopni ma wieża ratuszowa?",
  "answer_hash": "bcrypt-hash",
  "hint": "Spójrz na tabliczkę przy wejściu"
}

// Dla type = "combined"
{
  "require": ["gps", "qr"],
  "radius": 50,
  "qr_code_id": "uuid-kodu"
}
```

### `opening_hours` (organizations)
```json
{
  "mon": "9:00–17:00",
  "tue": "9:00–17:00",
  "wed": "9:00–20:00",
  "thu": "9:00–17:00",
  "fri": "9:00–15:00",
  "sat": null,
  "sun": null,
  "notes": "Dyżur telefoniczny 24h: 33 499 00 00"
}
```

### `completion_conditions` (quests)
```json
{
  "require_all": false,
  "min_steps": 4,
  "required_step_numbers": [1, 2]
}
```

---

## Row Level Security — zasady

```
PUBLICZNE (bez logowania):
- Odczyt: categories, tags, organizations (is_active=true)
- Odczyt: places (is_active=true, bez unlockable_content)
- Odczyt: quests, quest_steps (is_active=true)
- Odczyt: badges

ZALOGOWANY UŻYTKOWNIK:
- Odczyt/zapis: własny user_profile
- Odczyt/zapis: własne checkins, user_progress, favorites, user_badges
- Odczyt: unlockable_content (tylko po check-inie)

ADMIN:
- Pełny dostęp do wszystkich tabel
- Tylko przez service_role key (server-side)
```

---

## Indeksy dla wydajności

```sql
CREATE INDEX idx_places_location ON places USING GIST (
  ll_to_earth(latitude, longitude)
);
CREATE INDEX idx_places_type ON places(type);
CREATE INDEX idx_places_category ON places(category_id);
CREATE INDEX idx_checkins_user ON checkins(user_id);
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_qr_codes_code ON qr_codes(code);
```
