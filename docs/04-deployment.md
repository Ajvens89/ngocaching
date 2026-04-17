# MiejskiTrop — Instrukcja uruchomienia i wdrożenia

## Wymagania wstępne

- Node.js 18+ (`node --version`)
- npm lub pnpm
- Konto Supabase (darmowe: https://supabase.com)
- Konto Vercel (darmowe: https://vercel.com)

---

## KROK 1 — Konfiguracja Supabase

### 1.1 Utwórz projekt
1. Wejdź na https://supabase.com i utwórz nowy projekt
2. Wybierz region: **Central EU (Frankfurt)** (najniższe opóźnienia dla PL)
3. Zanotuj: Project URL i anon/service_role keys

### 1.2 Uruchom schemat bazy danych
W panelu Supabase → **SQL Editor** → wklej i wykonaj:
```bash
# Kolejność:
1. supabase/schema.sql    # Schemat tabel
2. supabase/seed.sql      # Dane startowe (Bielsko-Biała)
```

### 1.3 Konfiguracja Storage
W Supabase → **Storage** → utwórz buckety:
- `places` — publiczny (zdjęcia punktów)
- `organizations` — publiczny (zdjęcia NGO)
- `avatars` — prywatny (awatary użytkowników)

Polityka dla bucketu publicznego:
```sql
CREATE POLICY "Publiczny odczyt"
ON storage.objects FOR SELECT
USING (bucket_id IN ('places', 'organizations'));

CREATE POLICY "Admini mogą uploadować"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id IN ('places', 'organizations') AND auth.role() = 'authenticated');
```

### 1.4 Konfiguracja Auth
W Supabase → **Authentication** → **Settings**:
- Site URL: `https://twoja-domena.vercel.app`
- Redirect URLs: `https://twoja-domena.vercel.app/**`
- Włącz: Email + password
- Opcjonalnie: Google OAuth

---

## KROK 2 — Uruchomienie lokalne

```bash
# 1. Sklonuj/rozpakuj projekt
cd ngocaching

# 2. Zainstaluj zależności
npm install

# 3. Skopiuj zmienne środowiskowe
cp .env.local.example .env.local

# 4. Wypełnij .env.local (z panelu Supabase):
NEXT_PUBLIC_SUPABASE_URL=https://twoj-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# 5. Uruchom serwer deweloperski
npm run dev

# Aplikacja dostępna pod: http://localhost:3000
```

### Typowe problemy lokalne

**Problem**: Mapa nie ładuje się
**Rozwiązanie**: Leaflet wymaga wyłączenia SSR. Sprawdź że `MapView` jest importowany przez `dynamic(() => import(...), { ssr: false })`

**Problem**: Błąd "supabase not configured"
**Rozwiązanie**: Sprawdź .env.local — zmienne muszą mieć prefix `NEXT_PUBLIC_`

**Problem**: QR skaner nie uruchamia kamery
**Rozwiązanie**: HTTPS jest wymagany. Lokalnie użyj `localhost` (nie 127.0.0.1). Alternatywnie ustaw `http://localhost:3000` w Supabase Auth Settings.

---

## KROK 3 — Wdrożenie na Vercel

### 3.1 Przez interfejs Vercel
```
1. https://vercel.com/new
2. "Import Git Repository" lub "Deploy from local"
3. Framework: Next.js (auto-detected)
4. Dodaj zmienne środowiskowe:
   NEXT_PUBLIC_SUPABASE_URL = ...
   NEXT_PUBLIC_SUPABASE_ANON_KEY = ...
   SUPABASE_SERVICE_ROLE_KEY = ...
5. Kliknij Deploy
```

### 3.2 Przez Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod

# Zmienne przez CLI:
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

### 3.3 Po wdrożeniu
1. Zaktualizuj Supabase Auth → Site URL na: `https://twoj-projekt.vercel.app`
2. Przetestuj PWA: otwórz na telefonie Chrome → "Dodaj do ekranu głównego"

---

## KROK 4 — Panel Admina

Panel admina dostępny pod `/admin`. Żeby go zabezpieczyć:

### Opcja A: Middleware Next.js (zalecane)
Utwórz `src/middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Sprawdź czy zalogowany
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => request.cookies.get(name)?.value } }
  )
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/auth/login?redirect=/admin', request.url))
  }

  // Sprawdź rolę admin (opcjonalnie przez tabele Supabase)
  return NextResponse.next()
}

export const config = { matcher: ['/admin/:path*'] }
```

### Opcja B: Supabase Role
Dodaj kolumnę `role` do `user_profiles` i sprawdzaj w middleware.

---

## KROK 5 — Generowanie kodów QR

### Przez panel admina
```
/admin/qr-codes → Wybierz punkt → Generuj QR → Drukuj
```

### Programowo (skrypt)
```typescript
import QRCode from 'qrcode'

const codes = ['MIEJSKI-XXX-001', 'MIEJSKI-YYY-001']
for (const code of codes) {
  await QRCode.toFile(`qr-${code}.png`, code, {
    width: 400,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' }
  })
}
```

### Format kodu QR
Kody muszą być zarejestrowane w tabeli `qr_codes` w Supabase.
Format: `[PREFIX]-[SKROT-MIEJSCA]-[NUMER]`
Przykład: `MIEJSKI-CARITAS-001`

---

## KROK 6 — Dodawanie treści

### Przez panel admina (`/admin`)
1. Dodaj kategorie (jeśli potrzeba więcej)
2. Dodaj organizację NGO
3. Dodaj punkt dla organizacji
4. Wygeneruj kod QR (jeśli typ = QR)
5. Stwórz quest i dodaj etapy

### Import CSV (bulk)
```sql
-- Przykładowy import z CSV przez Supabase SQL Editor
COPY organizations (name, slug, address, latitude, longitude)
FROM '/path/to/ngos.csv'
CSV HEADER;
```

---

## Monitorowanie

### Błędy aplikacji
- Vercel → Deployments → Functions → Logs
- Supabase → Logs → Edge Functions

### Baza danych
- Supabase → Database → Query Performance
- Monitoruj tabelę `checkins` — wzrost oznacza aktywność

### PWA
Przetestuj instalację PWA:
```
Chrome DevTools → Application → Manifest
Chrome DevTools → Application → Service Workers
```

---

## Szacunkowe koszty (miesięczne)

| Usługa | Plan Free | Kiedy upgrade |
|--------|-----------|---------------|
| Supabase | 0 PLN (500 MB DB, 1 GB storage) | >1000 użytkowników/dzień |
| Vercel | 0 PLN (100 GB bandwidth) | >1M req/miesiąc |
| Domain | ~50 PLN/rok | Od razu |
| **Razem MVP** | **~4 PLN/miesiąc** | — |

Dla miasta/federacji NGO — całkowity koszt utrzymania MVP to praktycznie koszt domeny.
