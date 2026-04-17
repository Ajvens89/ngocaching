# NGOcaching — Architektura MVP

## 1. Wizja produktu

**NGOcaching** (robocza nazwa) to progresywna aplikacja webowa (PWA) do odkrywania organizacji pozarządowych i przestrzeni miasta Bielsko-Biała. Łączy mapę interaktywną, questy tematyczne, system check-inów oraz katalog NGO w jednym spójnym produkcie społeczno-miejskim.

---

## 2. Stack technologiczny

### Frontend
| Warstwa | Technologia | Uzasadnienie |
|---|---|---|
| Framework | **Next.js 14+** (App Router) | SSR/SSG, routing, API routes, łatwy deployment |
| Język | **TypeScript** | Bezpieczeństwo typów, lepsza DX |
| Style | **Tailwind CSS** | Szybki development, responsywność |
| Mapa | **Leaflet + react-leaflet** | Darmowy, OSM-native, lekki |
| Kafelki mapy | **OpenStreetMap** (Carto Voyager) | Bez kosztów licencji, polskie nazwy |
| Stan aplikacji | **Zustand** | Lekki, TypeScript-friendly |
| Formularze | **React Hook Form + Zod** | Walidacja, bezpieczeństwo |
| QR skaner | **html5-qrcode** | Bez natywnych zależności |
| PWA | **next-pwa** | Service worker, offline, install prompt |
| Ikony | **Lucide React** | Spójny system ikon |

### Backend / Infrastruktura
| Warstwa | Technologia | Uzasadnienie |
|---|---|---|
| Baza danych | **Supabase (PostgreSQL)** | Relacyjna, Row Level Security, darmowy tier |
| Autentykacja | **Supabase Auth** | Email/hasło + OAuth, JWT |
| Storage | **Supabase Storage** | Zdjęcia punktów i NGO |
| Realtime | **Supabase Realtime** (opcjonalne) | Aktywność eventów |
| Hosting | **Vercel** | Natywna integracja z Next.js |
| CDN | Vercel Edge Network | Globalna dostępność |

### Mapy — ważna decyzja
```
RDZEŃ: Leaflet + OpenStreetMap (darmowe, bez limitów)
OPCJONALNIE: Przycisk "Nawiguj w Google Maps" jako zewnętrzny link
PRZYSZŁOŚĆ: MapLibre GL JS jako upgrade dla 3D i customizacji
```

---

## 3. Architektura systemu

```
┌─────────────────────────────────────────────────────┐
│                   PRZEGLĄDARKA / PWA                 │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Mapa    │  │  Questy  │  │   Katalog NGO    │  │
│  │ (Leaflet)│  │          │  │                  │  │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
│       │              │                 │             │
│  ┌────┴──────────────┴─────────────────┴──────────┐ │
│  │              Next.js App Router                 │ │
│  │         (pages + API routes + middleware)       │ │
│  └────────────────────────┬───────────────────────┘ │
└───────────────────────────┼─────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────┐
│                    SUPABASE                          │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐ │
│  │   Auth   │  │PostgreSQL│  │     Storage        │ │
│  │  (JWT)   │  │  (RLS)   │  │  (zdjęcia/pliki)  │ │
│  └──────────┘  └──────────┘  └───────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 4. Struktura katalogów projektu

```
ngocaching/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (PWA meta, fonts)
│   │   ├── page.tsx                  # Strona startowa / onboarding
│   │   ├── (app)/                    # Grup z bottom navigation
│   │   │   ├── layout.tsx            # Shell z nawigacją
│   │   │   ├── map/page.tsx          # Główna mapa
│   │   │   ├── explore/page.tsx      # Przeglądaj NGO i miejsca
│   │   │   ├── quests/page.tsx       # Lista questów
│   │   │   ├── quest/[id]/page.tsx   # Szczegóły questu
│   │   │   ├── place/[id]/page.tsx   # Szczegóły punktu
│   │   │   ├── scan/page.tsx         # Skaner QR
│   │   │   └── profile/page.tsx      # Profil użytkownika
│   │   ├── admin/                    # Panel administratora
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Dashboard admina
│   │   │   ├── places/               # Zarządzanie punktami
│   │   │   ├── quests/               # Zarządzanie questami
│   │   │   ├── organizations/        # Zarządzanie NGO
│   │   │   └── qr-codes/            # Generator QR
│   │   └── api/                      # API Routes
│   │       ├── checkin/route.ts      # Check-in endpoint
│   │       ├── verify/route.ts       # Weryfikacja hasła/odpowiedzi
│   │       └── qr/[code]/route.ts    # Rozwiązanie kodu QR
│   │
│   ├── components/
│   │   ├── map/
│   │   │   ├── MapView.tsx           # Główny komponent mapy
│   │   │   ├── PlaceMarker.tsx       # Marker punktu na mapie
│   │   │   ├── MapFilters.tsx        # Filtry kategorii/typu
│   │   │   └── UserLocation.tsx      # Lokalizacja użytkownika
│   │   ├── quest/
│   │   │   ├── QuestCard.tsx         # Karta questu
│   │   │   ├── QuestProgress.tsx     # Pasek postępu
│   │   │   └── QuestStep.tsx         # Etap questu
│   │   ├── place/
│   │   │   ├── PlaceCard.tsx         # Karta miejsca
│   │   │   ├── PlaceDetail.tsx       # Szczegóły miejsca
│   │   │   └── CheckinButton.tsx     # Przycisk zaliczenia
│   │   ├── ngo/
│   │   │   └── NGOProfile.tsx        # Profil organizacji
│   │   ├── scanner/
│   │   │   └── QRScanner.tsx         # Kamera + dekoder QR
│   │   └── ui/
│   │       ├── BottomNav.tsx         # Dolna nawigacja
│   │       ├── Badge.tsx             # Odznaka/badge
│   │       ├── CategoryBadge.tsx     # Etykieta kategorii
│   │       └── StatusIndicator.tsx   # Status punktu
│   │
│   ├── lib/
│   │   ├── supabase.ts               # Klient Supabase (browser)
│   │   ├── supabase-server.ts        # Klient Supabase (server)
│   │   ├── types.ts                  # Wszystkie typy TypeScript
│   │   ├── utils.ts                  # Funkcje pomocnicze
│   │   ├── geo.ts                    # Obliczenia GPS/odległości
│   │   └── constants.ts              # Stałe (kategorie, itp.)
│   │
│   └── styles/
│       └── globals.css               # Style globalne + Tailwind
│
├── supabase/
│   ├── schema.sql                    # Schemat bazy danych
│   ├── seed.sql                      # Dane przykładowe (Bielsko)
│   └── policies.sql                  # Row Level Security policies
│
├── public/
│   ├── manifest.json                 # PWA manifest
│   ├── sw.js                         # Service Worker (generowany)
│   └── icons/                        # Ikony PWA
│
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── .env.local.example
```

---

## 5. Kluczowe decyzje architektoniczne

### 5.1 PWA zamiast aplikacji natywnej
MVP jako PWA daje: instalację na telefonie, działanie offline (cached mapa), dostęp do kamery (QR), geolokalizację — bez kosztów App Store i Google Play.

### 5.2 Leaflet zamiast Google Maps
- **Koszt**: OpenStreetMap = $0, Google Maps = $7/1000 wywołań
- **Prywatność**: brak śledzenia użytkowników przez Google
- **Elastyczność**: własne kafelki, własne markery, pełna kontrola
- **Dane lokalne**: OSM ma bardzo dobre dane dla Bielska-Białej

### 5.3 Supabase jako BaaS
- Wbudowana autentykacja + Row Level Security
- REST API automatycznie generowane ze schematu
- Storage dla mediów bez dodatkowej konfiguracji
- Darmowy tier wystarczający dla MVP

### 5.4 App Router (Next.js 14)
- Server Components dla szybkiego ładowania
- Loading states, error boundaries out-of-box
- Route groups dla layoutów (app vs admin)
- API Routes dla webhook-ów i weryfikacji

---

## 6. Bezpieczeństwo

### Row Level Security (Supabase)
```sql
-- Użytkownicy widzą tylko swoje check-iny
-- Admini mają pełny dostęp
-- Treści odblokowywane są widoczne tylko po zaliczeniu
```

### Weryfikacja check-inów
Wszystkie check-iny są weryfikowane server-side:
- GPS: sprawdzany promień od punktu
- QR: kod porównywany z bazy, oznaczany jako użyty (lub wielokrotny)
- Hasło/odpowiedź: hash comparison, rate limiting

---

## 7. Wydajność

- **Lazy loading mapy**: Leaflet ładowany tylko gdy potrzebny (dynamic import)
- **Optymalizacja obrazów**: Next.js Image z WebP
- **Cachowanie**: Service Worker cachuje zasoby statyczne
- **Pagination**: punkty ładowane w obrębie viewportu mapy
