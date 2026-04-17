# MiejskiTrop — Roadmapa, Propozycje Nazwy i Pomysły dla Bielska-Białej

---

## CZĘŚĆ 1 — Propozycje lepszej nazwy

### Finałowe propozycje (polsko-miejskie)

| Nazwa | Czemu dobra | Domena |
|-------|-------------|--------|
| **MiejskiTrop** ⭐ | Czytelna, polska, "trop" = ślad/poszukiwanie, miejski = urban | miejskitrop.pl |
| **ŚladMiasta** | Poetycka, "ślad" sugeruje odkrywanie historii | sladmiasta.pl |
| **UrboQuest** | Nowoczesna, krótka, łatwa do wymówienia po angielsku | urboquest.pl |
| **CivicPath** | Angielska, civic = obywatelski, path = szlak | civicpath.pl |
| **MiastoZywe** | Mocna, "żywe miasto" to też wartość NGO | miastozywe.pl |
| **Odkrywca BB** | Prosta, lokalna, inicjały Bielska-Białej | odkrywca.bb / odkrywcabb.pl |
| **SocjalnyTrop** | Łączy trop + aspekt społeczny, dobra dla NGO | socjalnytrop.pl |
| **KronikaMiasta** | Historyczna, prestiżowa, "kronika" kojarzy z dokumentacją | kronikamiasta.pl |

**Rekomendacja**: **MiejskiTrop** — prosta, polska, łatwa do zapamiętania, działa zarówno dla NGO jak i dla miejskich questów, bez przesadnej "gamingowości".

---

## CZĘŚĆ 2 — Roadmapa 2.0

### Faza 1 — MVP (obecna, 0–3 miesiące)
- [x] Mapa OpenStreetMap z markerami NGO i miejsc
- [x] System check-inów (GPS, QR, hasło, odpowiedź)
- [x] Questy tematyczne z etapami
- [x] Profile użytkowników i punkty
- [x] Panel admina
- [x] PWA (instalacja na telefonie)

### Faza 2 — Wzrost (3–6 miesięcy)
- [ ] **Odznaki i gamifikacja** — rozbudowany system badges, rankingi tygodniowe
- [ ] **Eventy miejskie** — punkty czasowe powiązane z wydarzeniami w mieście
- [ ] **Gry miejskie** — questy w czasie rzeczywistym (np. "Łowca skarbu")
- [ ] **Push notifications** — powiadomienia o nowych questach i eventach
- [ ] **Mapa offline** — pobieranie kafelków do cache (Service Worker)
- [ ] **Udostępnianie** — OG cards do social media, linki do questów
- [ ] **Wyszukiwanie zaawansowane** — filtry, geosearch, autouzupełnianie

### Faza 3 — Wspólnota (6–12 miesięcy)
- [ ] **Wolontariat** — moduł rejestracji i zarządzania wolontariatem NGO
- [ ] **Mapa pomocy** — interaktywna mapa "gdzie mogę uzyskać pomoc" (jedzenie, odzież, prawnik)
- [ ] **Komentarze i oceny** — użytkownicy opisują wizyty w NGO
- [ ] **Rankingi** — TOP odkrywcy tygodnia/miesiąca, ranking organizacji
- [ ] **Questy tworzące użytkownicy** — NGO i lokalne społeczności tworzą własne questy
- [ ] **Integracja z kalendarzem** — synchronizacja eventów NGO z kalendarzem telefonu

### Faza 4 — Skala (12–24 miesiące)
- [ ] **Multi-city** — rozszerzenie na inne miasta województwa: Żywiec, Cieszyn, Oświęcim
- [ ] **API publiczne** — dla miast, federacji NGO, aplikacji trzecich
- [ ] **Aplikacja natywna** — React Native / Expo (shared codebase z Next.js)
- [ ] **White label** — każde miasto może mieć własną instancję
- [ ] **Integracja z ePUAP** — weryfikacja organizacji przez dane publiczne
- [ ] **Dashboard dla NGO** — organizacje widzą statystyki odwiedzin
- [ ] **Program partnerski** — miasto dotuje aplikację w ramach strategii NGO

---

## CZĘŚĆ 3 — Moduły do wdrożenia później

### Moduł Wolontariatu
```
Użytkownik może:
- Przeglądać ogłoszenia wolontariackie NGO
- Zapisać się na akcję
- Śledzić swoje godziny wolontariatu
- Otrzymać certyfikat elektroniczny

NGO może:
- Publikować ogłoszenia z datą/miejscem
- Zarządzać listą wolontariuszy
- Potwierdzać godziny
```

### Moduł Mapy Pomocy
```
Inspiracja: MOPS "mapa świadczeń"
Użytkownik może:
- Filtrować: "Potrzebuję jedzenia", "Szukam prawnika", "Wsparcie dla bezdomnych"
- Dostać listę NGO + adresy + godziny
- Zadzwonić jednym kliknięciem
- Podzielić się mapą z osobą potrzebującą

Kluczowe dla: streetworkerów, pracowników socjalnych, opieki społecznej
```

### Moduł Gier Miejskich
```
Typy gier:
- Szybka gra (1-2h): questy w centrum
- Gra teamowa: drużyny rywalizują kto odkryje więcej punktów
- Gra nocna: punkty aktywne tylko wieczorem
- Gra sezonowa: specjalne eventy (Mikołajki, Dzień Seniora, etc.)
```

### Moduł Eventów
```
NGO publikuje event → pojawia się na mapie → użytkownik dostaje notyfikację
→ Uczestniczy → Check-in → Punkty + Odznaka → NGO widzi dane

Przykłady:
- Zbiórka jedzenia Caritas (konkretny dzień, miejsce)
- Bieg charytatywny MOPS
- Festiwal kultury "Kultura dla wszystkich"
```

### Moduł Dla Szkół
```
Nauczyciel tworzy quest dla klasy → uczniowie zaliczają w terenie
→ Nauczyciel widzi postęp → System generuje raporty

Zastosowania:
- Lekcja WOS w terenie
- Wycieczka poznawcza po NGO
- Projekt o lokalnej historii
```

---

## CZĘŚĆ 4 — Pomysły na zastosowanie w Bielsku-Białej

### Questy gotowe do realizacji

**Quest 1: "Mapa Pomocy Bielska"**
Odwiedź 6 głównych instytucji pomocowych:
Caritas → MOPS → PCPR → Centrum Integracji Społecznej → Żywiec Zdrój Fundacja → Dom Seniora

**Quest 2: "Szlak Kultury i NGO"**
Teatr Polski → Muzeum Beskidzkie → Dom Kultury Włókniarz → Biblioteka Miejska → Galeria Bielska BWA

**Quest 3: "Zielona Ścieżka"**
Szyndzielnia → Park Słowacki → Ogród Botaniczny → Stowarzyszenie Ekologiczne → Szałasiska

**Quest 4: "Bielsko dla Dzieci"**
Domy dziecka, świetlice środowiskowe, fundacje dziecięce, plac Ratuszowy, Bajkowy Park

**Quest 5: "Szlak Niepodległości"**
Miejsca pamięci + organizacje kombatanckie + Muzeum Historyczne + Skansen

**Quest 6: "NGO Challenge"**
Ogólnomiejska gra: przez 1 miesiąc zalicz jak najwięcej punktów NGO.
Ranking miesięczny, sponsorowany przez miasto.

---

### Potencjalni partnerzy w Bielsku-Białej

**Instytucje publiczne**:
- Urząd Miejski Bielsko-Biała (dofinansowanie, dane NGO)
- MOPS Bielsko-Biała (mapa pomocy)
- MOK (eventy kulturalne)
- Biblioteka Miejska (punkty questowe)

**Federacje i sieci NGO**:
- BFOP (Bielsko-Bialskie Forum Organizacji Pozarządowych)
- BORIS (centrum wspierania NGO)
- Regionalna Izba Gospodarcza (sponsorzy)

**Szkoły i uczelnie**:
- ATH (Akademia Techniczno-Humanistyczna) — projekt badawczy
- Szkoły średnie — questy edukacyjne

**Potencjalni sponsorzy**:
- Żywiec Zdrój (CSR, sponsoring sportu)
- Famur Group
- Lokalne firmy rodzinne

---

### Model finansowania

**Krótkoterminiowy (MVP)**:
Dofinansowanie z budżetu obywatelskiego lub grantu UE (POPC, FERS).
Koszt: 20-50 tys. PLN na wdrożenie i pierwsze 2 lata.

**Długoterminowy (skala)**:
- Subskrypcja dla NGO: 0-50 PLN/mies. (mały budżet = darmowo)
- White label dla innych miast: 500-2000 PLN/mies.
- Usługi eventowe: gry miejskie na zamówienie (festiwale, konferencje)
- Granty celowe na digitalizację sektora NGO

---

### KPI do mierzenia sukcesu MVP

Po 3 miesiącach od launchu:
- 100+ zarejestrowanych użytkowników
- 10+ aktywnych NGO w bazie
- 3+ questy ukończone przez co najmniej 10 osób
- 50+ unikalnych check-inów tygodniowo
- Ocena PWA: min. 4.0 w ankiecie (NPS > 30)
