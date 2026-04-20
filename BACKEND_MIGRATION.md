# MiejskiTrop — Plan migracji do produkcyjnego backendu

## Dlaczego Firebase Auth + Firestore

Projekt już działa na **Firebase App Hosting** (region europe-west4).
Dodanie Firebase Auth i Firestore to zero nowej infrastruktury — ten sam projekt,
te same narzędzia CLI, ten sam billing. Alternatywa (Supabase Postgres + RLS)
wymagałaby zewnętrznego serwera i osobnego deployu.

---

## Architektura docelowa

```
                ┌──────────────────────────────────────────────┐
                │          Firebase Project: ngocaching         │
                │                                              │
  Browser  ───► │  Firebase Auth (email/password, Google)      │
                │  Firestore (dane użytkowników + treści)       │
                │  Firebase App Hosting (Next.js)              │
                │  Firebase Secret Manager (tokeny)            │
                └──────────────────────────────────────────────┘
```

---

## Schemat Firestore

```
/places/{placeId}              ← treści (miejsca, questy) — zarządzane przez admina
/quests/{questId}
/quest_steps/{stepId}
/categories/{categoryId}
/organizations/{orgId}
/qr_codes/{code}

/users/{userId}/               ← dane użytkownika — private, RLS via Security Rules
  profile                      ← dokument: displayName, level, totalPoints, city
  checkins/{checkinId}         ← każde zaliczenie punktu
  progress/{questId}           ← postęp questa: stepsCompleted[], isCompleted
  badges/{badgeId}             ← zdobyte odznaki
```

---

## Security Rules (Firestore)

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Treści publiczne — read dla wszystkich, write tylko admin
    match /places/{id}   { allow read: if true; allow write: if isAdmin(); }
    match /quests/{id}   { allow read: if true; allow write: if isAdmin(); }
    match /categories/{id} { allow read: if true; allow write: if isAdmin(); }
    match /organizations/{id} { allow read: if true; allow write: if isAdmin(); }
    match /quest_steps/{id} { allow read: if true; allow write: if isAdmin(); }
    match /qr_codes/{id} { allow read: if true; allow write: if isAdmin(); }

    // Dane użytkownika — tylko właściciel
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    function isAdmin() {
      return request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)/profile).data.is_admin == true;
    }
  }
}
```

---

## Plan wdrożenia (4 etapy, ~3 tygodnie)

### Etap 1 — Firebase Auth (3 dni)

**Co robimy:**
1. Włącz Firebase Auth w Console → Authentication → Sign-in method → Email/Password
2. Zainstaluj `firebase` SDK (już jest w package.json!)
3. Stwórz `src/lib/firebase.ts`:

```ts
import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:    process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // ... reszta z .env.local.example
}

const app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db   = getFirestore(app)
```

4. Zamień `demo-client.ts` auth na Firebase Auth:

```ts
// src/lib/data-client.ts
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'

export function getAppClient() {
  return {
    auth: {
      async getUser() {
        return new Promise(resolve => {
          const unsub = onAuthStateChanged(auth, user => {
            unsub()
            resolve({ data: { user: user ? { id: user.uid, email: user.email } : null }, error: null })
          })
        })
      },
      async signInWithPassword({ email, password }) {
        try {
          const cred = await signInWithEmailAndPassword(auth, email, password)
          return { data: { user: { id: cred.user.uid, email: cred.user.email } }, error: null }
        } catch (e: any) {
          return { data: { user: null }, error: { message: 'Nieprawidłowy e-mail lub hasło.' } }
        }
      },
      async signUp({ email, password }) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password)
          return { data: { user: { id: cred.user.uid, email: cred.user.email } }, error: null }
        } catch (e: any) {
          return { data: { user: null }, error: { message: e.message } }
        }
      },
      async signOut() {
        await signOut(auth)
        return { error: null }
      },
    },
    from: (table) => { /* Etap 2 */ },
  }
}
```

**Efekt:** login/register/logout działa przez Firebase Auth. Konta są trwałe i działają cross-device.

---

### Etap 2 — Dane treści w Firestore (5 dni)

**Co robimy:**
1. Stwórz `scripts/seed-firestore.ts` — załaduj `DEMO_PLACES`, `DEMO_QUESTS`, etc. do Firestore
2. Zamień `.from(table).select()` na `getDocs(collection(db, table))`

```ts
from(table: string) {
  return {
    select(columns?: string) {
      return {
        eq(field, value) { this._filters.push({ field, value }); return this },
        async single() {
          const snap = await getDocs(query(collection(db, table), where(field, '==', value)))
          return { data: snap.docs[0]?.data() || null, error: null }
        },
        // ... reszta buildera
      }
    }
  }
}
```

**Efekt:** miejsca, questy, kategorie ładują się z Firestore, a nie z demo-data.ts.

---

### Etap 3 — Dane użytkownika w Firestore (5 dni)

**Co robimy:**
1. `checkins` → `/users/{uid}/checkins` — zapis i odczyt z Firestore
2. `user_progress` → `/users/{uid}/progress/{questId}`
3. `user_badges` → `/users/{uid}/badges`
4. `user_profiles` → dokument `/users/{uid}/profile` tworzony po rejestracji

**Efekt:** postępy i odznaki są trwałe, synchronizowane między urządzeniami.

---

### Etap 4 — Wyłącz demo-client (2 dni)

1. Usuń `demo-client.ts`, `demo-data.ts` z produkcji
2. Dodaj seed data do Firestore przez Firebase Console lub skrypt
3. Zostaw demo-client tylko w testach/dev (feature flag `DEMO_MODE=true`)
4. Zaktualizuj `data-server.ts` do Firebase Admin SDK

```ts
// src/lib/data-server.ts
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

export function createServerDataClient() {
  if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!)) })
  }
  // wrapper analogiczny do demo-client, ale używający Admin SDK
}
```

---

## Szacowany czas

| Etap | Czas | Efekt |
|------|------|-------|
| 1 — Auth | 3 dni | Prawdziwe konta, cross-device login |
| 2 — Treści | 5 dni | Miejsca i questy z Firestore |
| 3 — Dane usera | 5 dni | Trwały postęp i odznaki |
| 4 — Wyłącz demo | 2 dni | Zero artefaktów demo w prod |
| **Razem** | **~3 tyg.** | **Pełny produkcyjny backend** |

---

## Env vars potrzebne po migracji

```bash
# .env.local (i Firebase Secret Manager dla produkcji)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ngocaching.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ngocaching
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ngocaching.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_MAPBOX_TOKEN=pk.ey...
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}  # server-side only
```

---

## Co można zrobić dziś bez backendu

Poniższe NIE wymagają Firestore i mogą iść w tym samym sprincie:

- [x] Ukrycie demo credentials z produkcji (done)
- [x] Usunięcie placeholderów (done)
- [x] Spójność marki MiejskiTrop (done)
- [x] Skeletony mapy i skanera (done)
- [ ] Onboarding "pierwszy quest w 60 sekund" — statyczny, bez backendu
- [ ] Error boundaries na kluczowych stronach
- [ ] Telemetria — `gtag` lub `firebase analytics` (1 dzień pracy)
