# NGOcaching — Widoki i Flow Użytkownika

## 1. Mapa podróży użytkownika

```
NOWY UŻYTKOWNIK
      │
      ▼
┌─────────────┐
│  Ekran      │
│  startowy   │ ← Logo, hasło, "Odkryj miasto"
│  (Splash)   │
└──────┬──────┘
       │
       ├── [Przeglądaj bez logowania] ──────────────────────┐
       │                                                     │
       ▼                                                     ▼
┌─────────────┐                                    ┌────────────────┐
│  Rejestracja│                                    │  Mapa / Explore│
│  lub Login  │                                    │  (read-only)   │
└──────┬──────┘                                    └────────────────┘
       │
       ▼
┌─────────────┐
│   GŁÓWNA    │ ← Bottom navigation: Mapa | Explore | Questy | Profil
│   APLIKACJA │
└─────────────┘
```

---

## 2. Ekrany — szczegółowy opis

### 2.1 Ekran startowy (`/`)
**Cel**: Pierwsze wrażenie, onboarding, zachęta do odkrywania
**Elementy**:
- Logo aplikacji + hasło ("Odkryj Bielsko. Poznaj tych, którzy mu służą.")
- Krótki opis w 3 ikonach (Odkrywaj / Zaliczaj / Ucz się)
- Przycisk "Zacznij odkrywać" → mapa
- Przycisk "Zaloguj się" / "Załóż konto"
- Podgląd 3 polecanych questów (karuzela)

---

### 2.2 Mapa (`/map`)
**Cel**: Główny hub eksploracji — tu wszystko się zaczyna
**Elementy**:
```
┌────────────────────────────────┐
│  🔍 Szukaj miejsc...   [⚙️]   │  ← wyszukiwarka + filtry
├────────────────────────────────┤
│                                │
│         MAPA LEAFLET           │
│                                │
│   ● NGO  ◆ Miejsce  ★ Quest   │  ← markery wg typu
│                                │
│   [Moje położenie]             │
│                                │
├────────────────────────────────┤
│  📍 3 punkty w pobliżu        │  ← dolny sheet (drag up)
│  ──────────────────────────── │
│  [Karta punktu]  [Karta]      │
└────────────────────────────────┘
```

**Zachowania**:
- Domyślny widok: centrum Bielska-Białej, zoom 14
- Markery kolorowane wg kategorii
- Status punktu widoczny na markerze: szary=nieodkryty, zielony=zaliczony
- Tap w marker → mini-karta z nazwą i przyciskiem "Więcej"
- Drag-up na dolny sheet → lista punktów w widoku
- Przycisk lokalizacji → "Blisko mnie" (sortowanie po odległości)
- Filtry: typ punktu (NGO/Miasto/Quest/Event), kategoria

**Filtry dostępne**:
- Typ: Wszystkie / NGO / Miejsca miejskie / Eventy
- Kategoria: Pomoc społeczna / Kultura / Sport / Ekologia / Edukacja...
- Status: Wszystkie / Nieodkryte / Zaliczone

---

### 2.3 Eksploruj (`/explore`)
**Cel**: Przeglądanie katalogu NGO i miejsc bez mapy
**Elementy**:
```
┌────────────────────────────────┐
│  EKSPLORUJ                     │
│  ─────────────────────────    │
│  [NGO] [Miejsca] [Wszystkie]  │  ← Tabs
│  ─────────────────────────    │
│  🔍 Szukaj...                  │
│                                │
│  Kategorie:                    │
│  [Pomoc] [Kultura] [Sport]... │
│                                │
│  ┌──────────┐  ┌──────────┐  │
│  │ Karta    │  │ Karta    │  │  ← Grid 2 kolumny
│  │ NGO/     │  │ NGO/     │  │
│  │ Miejsca  │  │ Miejsca  │  │
│  └──────────┘  └──────────┘  │
└────────────────────────────────┘
```

---

### 2.4 Szczegóły miejsca / NGO (`/place/[id]`)
**Cel**: Pełna informacja o punkcie + możliwość zaliczenia

**Sekcje**:
```
[← Wróć]                [❤️ Zapisz]

[ZDJĘCIE GŁÓWNE]

📍 Typ: NGO  |  Kategoria: Pomoc społeczna
⭐ Status: Nieodkryty

NAZWA MIEJSCA
──────────────
Krótki opis...

📍 Adres: ul. Przykładowa 1, Bielsko-Biała
📞 33 499 00 00
✉️ kontakt@ngo.pl
🌐 www.ngo.pl

Godziny otwarcia:
Pon-Pt: 9:00–17:00

──────────────────────
OPIS DZIAŁALNOŚCI
...pełny opis...

──────────────────────
📸 GALERIA
[foto] [foto] [foto]

──────────────────────
🗺️ NAWIGACJA
[Otwórz w Google Maps] ← zewnętrzny link

──────────────────────
✅ ZALICZ TEN PUNKT

[Wskazówka: Wejdź w budynek od ul. 3 Maja]

[📍 Zalicz przez GPS]     [jeśli w promieniu]
[📷 Skanuj QR kod]
[🔑 Wpisz hasło]

──────────────────────
🔒 TREŚĆ DO ODBLOKOWANIA
[Widoczna tylko po zaliczeniu]
```

---

### 2.5 Questy (`/quests`)
**Cel**: Przeglądanie i rozpoczynanie questów tematycznych
```
┌────────────────────────────────┐
│  QUESTY                        │
│  ─────────────────────────    │
│  [Polecane] [Aktywne] [Ukończone]
│                                │
│  ┌──────────────────────────┐ │
│  │ 🏙️ ODKRYJ NGO BIELSKA   │ │  ← karta questu
│  │ 8 etapów · ~2h · łatwy  │ │
│  │ Twój postęp: ████░░ 3/8 │ │
│  │ [Kontynuuj]             │ │
│  └──────────────────────────┘ │
│                                │
│  ┌──────────────────────────┐ │
│  │ 🏛️ SZLAK HISTORYCZNY    │ │
│  │ 6 etapów · ~1.5h · łatwy│ │
│  │ Nierozpoczęty            │ │
│  │ [Rozpocznij]            │ │
│  └──────────────────────────┘ │
└────────────────────────────────┘
```

---

### 2.6 Szczegóły questu (`/quest/[id]`)
```
[← Wróć]

[OKŁADKA QUESTU]

🏙️ ODKRYJ NGO BIELSKA
━━━━━━━━━━━━━━━━━━━━
Trudność: ⭐ Łatwy  |  Czas: ~2h
Etapy: 8  |  Twój postęp: 3/8

Opis questu...

── LISTA ETAPÓW ────────────────
✅ 1. Caritas Diecezji B-Ż       ← zaliczone
✅ 2. MOPS Bielsko-Biała          ← zaliczone
✅ 3. Fundacja Na Rzecz...        ← zaliczone
🔵 4. Stowarzyszenie "Bielska... ← aktywny (następny)
⬜ 5. Dom Dziecka...              ← zablokowany
⬜ 6. ...
⬜ 7. ...
⬜ 8. Finał: Ratusz               ← ostatni etap

── NAGRODA ─────────────────────
🏅 Odznaka "Odkrywca NGO Bielska"
[Po ukończeniu wszystkich etapów]

[▶ PRZEJDŹ DO ETAPU 4]
```

---

### 2.7 Skaner QR (`/scan`)
**Cel**: Szybkie zaliczenie punktu przez kod QR
```
┌────────────────────────────────┐
│  SKANUJ QR KOD                 │
│                                │
│  ┌──────────────────────────┐ │
│  │                          │ │
│  │    [POLE KAMERY]         │ │
│  │                          │ │
│  │    ╔══════════╗          │ │
│  │    ║ CELOWNIK ║          │ │
│  │    ╚══════════╝          │ │
│  │                          │ │
│  └──────────────────────────┘ │
│                                │
│  Nakieruj na kod QR            │
│  przy punkcie                  │
│                                │
│  ── LUB ────────────────────  │
│  Wpisz kod ręcznie: [______]  │
│                              [OK]
└────────────────────────────────┘
```

Po skanowaniu:
- Sukces → animacja ✅ + "Punkt zaliczony! +10 pkt" + redirect do punktu
- Błąd → "Kod nierozpoznany" + opcja ponownej próby
- Już zaliczony → "Ten punkt już masz! Zaliczony: 5 dni temu"

---

### 2.8 Profil użytkownika (`/profile`)
```
[⚙️ Ustawienia]

  [AVATAR]
  Nazwa użytkownika
  Odkrywca Poziomu 3
  
  ██████████░░░░░ 230/300 pkt do Poziomu 4

  📍 23 punkty  |  🏅 5 odznak  |  🗺️ 3 questy

──── OSTATNIA AKTYWNOŚĆ ─────────
✅ Caritas B-Ż · 2 dni temu
✅ MOPS · 5 dni temu
✅ Muzeum Miejskie · tydzień temu

──── MOJE ODZNAKI ───────────────
[🏅] [🏅] [🏅] [🔒] [🔒] [🔒]

──── QUESTY ─────────────────────
✅ Szlak Historyczny (ukończony)
🔵 Odkryj NGO (3/8)

──── ZAPISANE MIEJSCA ───────────
[❤️ Dom Kultury] [❤️ Fundacja XY]
```

---

### 2.9 Panel Admina (`/admin`)

**Dashboard**:
```
┌────────────────────────────────┐
│  PANEL ADMINA — NGOcaching     │
│                                │
│  📍 47 punktów  |  🏢 23 NGO  │
│  🗺️ 5 questów  |  👤 128 usr  │
│                                │
│  ── ZARZĄDZAJ ──────────────  │
│  [📍 Punkty]   [🏢 NGO]       │
│  [🗺️ Questy]   [📷 QR Kody]  │
│  [📊 Statystyki]               │
└────────────────────────────────┘
```

**Formularz dodawania punktu**:
- Nazwa, typ, kategoria
- Opis krótki / pełny / odblokowywany
- Współrzędne (picker na mapie lub ręcznie)
- Zdjęcie główne + galeria
- Typ zaliczenia + parametry
- Wskazówka, zadanie

**Formularz questu**:
- Tytuł, opis, motyw, trudność
- Drag-and-drop kolejność etapów
- Wybór punktów z listy/mapy
- Generator QR kodów (+ drukowanie)

---

## 3. Stany punktu — logika UI

```
NIEODKRYTY  →  ODKRYTY (w pobliżu GPS)  →  ZALICZONY
   ⬜                  🔵                      ✅

NIEODKRYTY: szary marker, bez treści odblokowanej
ODKRYTY:    niebieski marker, widoczna wskazówka/zadanie
ZALICZONY:  zielony marker, treść odblokowana, punkty naliczone
```

---

## 4. Flow check-inu

```
Użytkownik klika "Zalicz punkt"
         │
         ├── GPS ──→ Sprawdź odległość (API)
         │            ├── < radius: ✅ Check-in
         │            └── > radius: ❌ "Za daleko (potrzebujesz być w XX m)"
         │
         ├── QR ───→ Skanuj kod ──→ API verify
         │            ├── valid: ✅ Check-in
         │            └── invalid: ❌ "Nierozpoznany kod"
         │
         ├── HASŁO → Form input ──→ API hash compare
         │            ├── match: ✅ Check-in
         │            └── mismatch: ❌ "Błędne hasło"
         │
         └── ANSWER → Form input ──→ API hash compare
                       ├── match: ✅ Check-in
                       └── mismatch: ❌ "Błędna odpowiedź"

Po sukcesie:
  → Zapisz checkin w DB
  → Przyznaj punkty
  → Sprawdź postęp questów
  → Sprawdź odznaki
  → Pokaż animację sukcesu
  → Odblokuj treść
```
