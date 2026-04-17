# MiejskiTrop (NGOcaching) — Pełne MVP

## Wygenerowane pliki

### Dokumentacja (`docs/`)
- `01-architektura.md` — Stack, architektura systemu, decyzje techniczne
- `02-modele-danych.md` — Kompletny opis wszystkich tabel i relacji
- `03-widoki-flow.md` — Wszystkie ekrany, opisy UI/UX, flow użytkownika
- `04-deployment.md` — Krok po kroku: Supabase + Vercel + PWA
- `05-roadmapa-i-nazwy.md` — Propozycje nazwy, roadmapa 2.0, pomysły dla BB

### Baza danych (`supabase/`)
- `schema.sql` — Kompletny schemat PostgreSQL z RLS, indeksami, triggerami
- `seed.sql` — Dane startowe: 3 NGO, 7 punktów, 2 questy, QR kody

### Aplikacja Next.js (`src/`)
- `app/layout.tsx` — Root layout z PWA meta, fontami
- `app/page.tsx` — Strona startowa / onboarding
- `app/(app)/` — Główna aplikacja z bottom navigation
  - `map/page.tsx` — Mapa (dynamiczny import Leaflet)
  - `explore/page.tsx` — Katalog NGO i miejsc
  - `quests/page.tsx` — Lista questów
  - `quest/[id]/page.tsx` — Szczegóły questu z postępem
  - `place/[id]/page.tsx` — Szczegóły miejsca/NGO
  - `place/[id]/CheckinSection.tsx` — Sekcja zaliczania (GPS/QR/hasło)
  - `scan/page.tsx` — Strona skanera QR
  - `profile/page.tsx` — Profil odkrywcy
- `app/admin/` — Panel administratora
  - `page.tsx` — Dashboard z statystykami
  - `places/new/page.tsx` — Formularz dodawania punktu
- `app/api/checkin/route.ts` — API weryfikacji i zapisu check-inów
- `app/api/qr/[code]/route.ts` — API skanowania kodów QR
- `components/map/MapView.tsx` — Mapa Leaflet z markerami, filtry, bottom sheet
- `components/map/MapFilters.tsx` — Panel filtrów mapy
- `components/scanner/QRScanner.tsx` — Kamera + html5-qrcode
- `components/ui/BottomNav.tsx` — Dolna nawigacja z 5 zakładkami

### Konfiguracja
- `package.json` — Zależności
- `next.config.js` — Next.js + PWA
- `tailwind.config.ts` — Design system (kolory, animacje)
- `tsconfig.json` — TypeScript
- `.env.local.example` — Zmienne środowiskowe
- `src/lib/types.ts` — Wszystkie typy TypeScript
- `src/lib/supabase.ts` / `supabase-server.ts` — Klienty Supabase
- `src/lib/geo.ts` — Obliczenia GPS (Haversine), geolokalizacja
- `src/lib/utils.ts` — Helpers, formatowanie, kolory
- `src/lib/constants.ts` — Stałe aplikacji

## Szybki start

```bash
npm install
cp .env.local.example .env.local
# Wypełnij Supabase URL + keys
npm run dev
```

Następnie w Supabase SQL Editor uruchom:
1. `supabase/schema.sql`
2. `supabase/seed.sql`

Aplikacja gotowa pod: http://localhost:3000
