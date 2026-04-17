-- ============================================================
-- MiejskiTrop — Dane startowe dla Bielska-Białej
-- ============================================================

-- ─────────────────────────────────────────
-- KATEGORIE
-- ─────────────────────────────────────────
INSERT INTO categories (name, slug, icon, color, type) VALUES
  ('Pomoc społeczna',   'pomoc-spoleczna',  '🤝', '#22c55e', 'ngo'),
  ('Kultura i sztuka',  'kultura',          '🎭', '#a855f7', 'all'),
  ('Sport i rekreacja', 'sport',            '⚽', '#3b82f6', 'all'),
  ('Edukacja',          'edukacja',         '📚', '#f59e0b', 'all'),
  ('Ekologia',          'ekologia',         '🌿', '#10b981', 'all'),
  ('Zdrowie',           'zdrowie',          '❤️', '#ef4444', 'ngo'),
  ('Dzieci i młodzież', 'dzieci',           '👦', '#f97316', 'ngo'),
  ('Seniorzy',          'seniorzy',         '👴', '#6366f1', 'ngo'),
  ('Historia',          'historia',         '🏛️', '#78716c', 'place'),
  ('Architektura',      'architektura',     '🏗️', '#64748b', 'place'),
  ('Aktywizm',          'aktywizm',         '✊', '#dc2626', 'ngo'),
  ('Wolontariat',       'wolontariat',      '💪', '#0ea5e9', 'ngo');

-- ─────────────────────────────────────────
-- ORGANIZACJE NGO (Bielsko-Biała)
-- ─────────────────────────────────────────
INSERT INTO organizations (
  name, slug, short_description, description,
  activity_areas, support_types, recipient_groups,
  address, latitude, longitude, phone, email, website,
  opening_hours, is_accessible, category_id, is_active, is_promoted
) VALUES
(
  'Caritas Diecezji Bielsko-Żywieckiej',
  'caritas-bielsko-zywiecka',
  'Katolicka organizacja charytatywna niosąca pomoc potrzebującym w regionie.',
  'Caritas Diecezji Bielsko-Żywieckiej prowadzi szeroko zakrojoną działalność charytatywną na terenie diecezji. Organizacja wspiera osoby starsze, bezdomne, chore, niepełnosprawne oraz rodziny w trudnej sytuacji materialnej. Prowadzi m.in. stacje Caritas, jadłodajnie i paczki żywnościowe.',
  ARRAY['pomoc społeczna', 'wolontariat', 'pomoc charytatywna'],
  ARRAY['żywność', 'odzież', 'pomoc finansowa', 'poradnictwo'],
  ARRAY['seniorzy', 'osoby bezdomne', 'rodziny wielodzietne', 'osoby chore'],
  'ul. Wita Stwosza 20, 43-300 Bielsko-Biała',
  49.8230, 19.0420,
  '33 812 44 20',
  'caritas@diecezja.bielsko.pl',
  'https://www.caritas.diecezja.bielsko.pl',
  '{"mon": "8:00–16:00", "tue": "8:00–16:00", "wed": "8:00–16:00", "thu": "8:00–16:00", "fri": "8:00–15:00", "notes": "Jadłodajnia: pon-pt 12:00–14:00"}'::jsonb,
  TRUE,
  (SELECT id FROM categories WHERE slug = 'pomoc-spoleczna'),
  TRUE, TRUE
),
(
  'MOPS Bielsko-Biała',
  'mops-bielsko',
  'Miejski Ośrodek Pomocy Społecznej — wsparcie dla mieszkańców w trudnej sytuacji.',
  'Miejski Ośrodek Pomocy Społecznej w Bielsku-Białej realizuje zadania z zakresu pomocy społecznej. Świadczy pomoc finansową, rzeczową i usługową dla osób i rodzin, które znalazły się w trudnej sytuacji życiowej. Prowadzi też pracę socjalną i poradnictwo.',
  ARRAY['pomoc społeczna', 'praca socjalna', 'poradnictwo'],
  ARRAY['zasiłki', 'pomoc rzeczowa', 'praca socjalna', 'usługi opiekuńcze'],
  ARRAY['rodziny', 'seniorzy', 'osoby z niepełnosprawnością', 'bezdomni'],
  'ul. Karpacka 36A, 43-300 Bielsko-Biała',
  49.8185, 19.0512,
  '33 496 21 00',
  'sekretariat@mops.bielsko.pl',
  'https://www.mops.bielsko.pl',
  '{"mon": "7:30–15:30", "tue": "7:30–15:30", "wed": "7:30–15:30", "thu": "7:30–17:30", "fri": "7:30–13:30"}'::jsonb,
  TRUE,
  (SELECT id FROM categories WHERE slug = 'pomoc-spoleczna'),
  TRUE, FALSE
),
(
  'Fundacja Bielsko-Bialska',
  'fundacja-bielsko-bialska',
  'Lokalna fundacja wspierająca inicjatywy społeczne i kulturalne w mieście.',
  'Fundacja realizuje projekty na rzecz mieszkańców Bielska-Białej, wspierając lokalne inicjatywy społeczne, kulturalne i edukacyjne. Aktywnie uczestniczy w dialogu obywatelskim i promuje zaangażowanie mieszkańców w życie miasta.',
  ARRAY['kultura', 'edukacja', 'aktywizacja'],
  ARRAY['granty', 'wsparcie merytoryczne', 'szkolenia'],
  ARRAY['organizacje', 'aktywni obywatele', 'młodzież'],
  'ul. 3 Maja 11, 43-300 Bielsko-Biała',
  49.8241, 19.0452,
  NULL,
  'kontakt@fundacja-bb.pl',
  NULL,
  '{"mon": "10:00–16:00", "tue": "10:00–16:00", "wed": "10:00–16:00", "thu": "10:00–16:00", "fri": "10:00–14:00"}'::jsonb,
  FALSE,
  (SELECT id FROM categories WHERE slug = 'aktywizm'),
  TRUE, FALSE
);

-- ─────────────────────────────────────────
-- PUNKTY NA MAPIE
-- ─────────────────────────────────────────
INSERT INTO places (
  name, slug, type, short_description, description,
  latitude, longitude, address,
  hint, task_content, unlockable_content,
  verification_type, gps_radius,
  is_active, is_promoted, category_id, organization_id
) VALUES
-- NGO Points
(
  'Siedziba Caritas Bielsko-Żywiec',
  'caritas-siedziba',
  'ngo',
  'Centrala Caritas Diecezji Bielsko-Żywieckiej.',
  'Tu mieści się siedziba Caritas Diecezji Bielsko-Żywieckiej. Caritas prowadzi jadłodajnię, stację charytatywną i koordynuje wolontariat w całej diecezji.',
  49.8230, 19.0420,
  'ul. Wita Stwosza 20, Bielsko-Biała',
  'Szukaj logo Caritas na budynku.',
  'Sprawdź tabliczkę przy wejściu — ile organizacji działa pod tym adresem?',
  'Caritas Bielsko-Żywiec pomaga ponad 5000 osobom rocznie. Działają tu 3 różne programy wsparcia: Jadłodajnia, Stacja Caritas i Wolontariat.',
  'gps', 60,
  TRUE, TRUE,
  (SELECT id FROM categories WHERE slug = 'pomoc-spoleczna'),
  (SELECT id FROM organizations WHERE slug = 'caritas-bielsko-zywiecka')
),
(
  'MOPS — Ośrodek Pomocy Społecznej',
  'mops-siedziba',
  'ngo',
  'Główna siedziba Miejskiego Ośrodka Pomocy Społecznej.',
  'MOPS Bielsko-Biała oferuje kompleksową pomoc osobom i rodzinom potrzebującym wsparcia. Pracownicy socjalni pomagają w uzyskaniu zasiłków, usług opiekuńczych i interwencji kryzysowej.',
  49.8185, 19.0512,
  'ul. Karpacka 36A, Bielsko-Biała',
  'Wejście od ulicy Karpackiej.',
  'Ile programów pomocy realizuje MOPS? Sprawdź tablicę informacyjną.',
  'Wiedziałeś, że MOPS prowadzi ponad 12 programów pomocy? Obejmują m.in. asystenturę rodzinną, pomoc sąsiedzką i centrum integracji społecznej.',
  'gps', 50,
  TRUE, FALSE,
  (SELECT id FROM categories WHERE slug = 'pomoc-spoleczna'),
  (SELECT id FROM organizations WHERE slug = 'mops-bielsko')
),
-- Miejsca miejskie
(
  'Ratusz Bielsko-Biała',
  'ratusz-bielsko',
  'city',
  'Zabytkowy ratusz miejski z XVI wieku — symbol Bielska-Białej.',
  'Bielski ratusz to jeden z najważniejszych zabytków miasta. Budynek pochodzi z XVI wieku i wielokrotnie był przebudowywany. Dziś mieści siedzibę władz miejskich.',
  49.8228, 19.0455,
  'Plac Ratuszowy 1, Bielsko-Biała',
  'Stoisz na Placu Ratuszowym. Wieża zegarowa jest widoczna z daleka.',
  'Jak wysoką wieżę ma ratusz? Spójrz na tabliczkę informacyjną.',
  'Wieża ratuszowa ma 35 metrów wysokości! Ratusz bielski był wielokrotnie niszczony — przez pożary i wojnę. Obecna forma pochodzi z XIX wieku.',
  'gps', 80,
  TRUE, TRUE,
  (SELECT id FROM categories WHERE slug = 'historia')
),
(
  'Katedra Świętego Mikołaja',
  'katedra-sw-mikolaja',
  'city',
  'Gotycka katedra — najstarszy kościół Bielska-Białej.',
  'Katedra Świętego Mikołaja to najstarsza świątynia w Bielsku, wzmiankowana już w 1312 roku. Jej gotycka wieża jest symbolem miasta widocznym z daleka.',
  49.8231, 19.0442,
  'ul. Wzgórze 1, Bielsko-Biała',
  'Wieża katedry jest widoczna niemal z każdego miejsca w centrum.',
  NULL,
  NULL,
  'gps', 70,
  TRUE, FALSE,
  (SELECT id FROM categories WHERE slug = 'historia')
),
(
  'Muzeum Historyczne Bielska-Białej',
  'muzeum-historyczne',
  'city',
  'Muzeum miejskie w Zamku Sułkowskich prezentujące historię miasta.',
  'Muzeum Historyczne mieści się w zamku Sułkowskich — zabytkowej rezydencji z XVI w. Zbiera i udostępnia eksponaty związane z historią Bielska i Białej oraz regionu podbeskidzkiego.',
  49.8218, 19.0447,
  'ul. Wzgórze 16, Bielsko-Biała',
  'Zamek widoczny od strony ul. Wzgórze.',
  NULL,
  NULL,
  'gps', 60,
  TRUE, FALSE,
  (SELECT id FROM categories WHERE slug = 'historia')
),
(
  'Teatr Polski w Bielsku-Białej',
  'teatr-polski',
  'city',
  'Jeden z najstarszych teatrów w regionie.',
  'Teatr Polski w Bielsku-Białej to instytucja z ponad 150-letnią tradycją. Prowadzi repertuar dramatyczny, muzyczny i dla dzieci.',
  49.8220, 19.0449,
  'ul. 1 Maja 1, Bielsko-Biała',
  NULL,
  NULL,
  NULL,
  'gps', 60,
  TRUE, FALSE,
  (SELECT id FROM categories WHERE slug = 'kultura')
),
(
  'Szyndzielnia — stacja górna kolejki',
  'szyndzielnia-stacja-gorna',
  'city',
  'Szczyt Szyndzielni (1028 m n.p.m.) — taras widokowy nad miastem.',
  'Z tarasu widokowego na Szyndzielni rozpościera się panorama Bielska-Białej i Beskidów. Kolejka linowa kursuje od centrum miasta. Latem szlaki piesze, zimą trasy narciarskie.',
  49.7870, 19.0250,
  'Szyndzielnia 1028, Bielsko-Biała',
  'Dojazd kolejką linową lub szlakiem pieszym z centrum.',
  NULL,
  'Z Szyndzielni widać ponad 100 km — przy dobrej pogodzie nawet Tatry!',
  'gps', 100,
  TRUE, TRUE,
  (SELECT id FROM categories WHERE slug = 'sport')
);

-- ─────────────────────────────────────────
-- ODZNAKI
-- ─────────────────────────────────────────
INSERT INTO badges (name, description, image, criteria) VALUES
  ('Odkrywca NGO',        'Zaliczyłeś swój pierwszy punkt NGO',     '🏅', '{"checkin_type": "ngo", "count": 1}'::jsonb),
  ('Przyjaciel Potrzebujących', 'Odkryłeś 5 organizacji pomocowych', '🌟', '{"ngo_checkins": 5}'::jsonb),
  ('Kronikarz Bielska',   'Zaliczyłeś 5 historycznych miejsc',       '📜', '{"city_checkins": 5, "category": "historia"}'::jsonb),
  ('Zdobywca Szczytów',   'Dotarłeś na Szyndzielnię',                '⛰️',  '{"place_slug": "szyndzielnia-stacja-gorna"}'::jsonb),
  ('Aktywny Obywatel',    'Ukończyłeś quest społeczny',              '🏛️', '{"quest_completed": true}'::jsonb),
  ('Odkrywca Bielska',    'Zaliczyłeś 10 punktów na mapie',          '🧭', '{"total_checkins": 10}'::jsonb);

-- ─────────────────────────────────────────
-- QUESTY
-- ─────────────────────────────────────────
INSERT INTO quests (
  title, slug, description, theme,
  difficulty, estimated_time,
  completion_conditions, reward_description,
  badge_id, is_active, is_featured,
  category_id
) VALUES
(
  'Odkryj NGO Bielska-Białej',
  'odkryj-ngo-bielska',
  'Poznaj organizacje pozarządowe działające w Bielsku-Białej. Odwiedź ich siedziby, dowiedz się czym się zajmują i odkryj, jak wiele dobrego robią dla mieszkańców.',
  'pomoc społeczna',
  'easy', 120,
  '{"require_all": false, "min_steps": 2}'::jsonb,
  'Odznaka "Przyjaciel Potrzebujących" i 50 punktów bonusowych',
  (SELECT id FROM badges WHERE name = 'Przyjaciel Potrzebujących'),
  TRUE, TRUE,
  (SELECT id FROM categories WHERE slug = 'pomoc-spoleczna')
),
(
  'Szlak historyczny Bielsko-Biała',
  'szlak-historyczny',
  'Przejdź przez najważniejsze historyczne miejsca Bielska-Białej. Od ratusza po zamek Sułkowskich — odkryj historię miasta, które przez wieki było perłą pogranicza.',
  'historia',
  'easy', 90,
  '{"require_all": true}'::jsonb,
  'Odznaka "Kronikarz Bielska"',
  (SELECT id FROM badges WHERE name = 'Kronikarz Bielska'),
  TRUE, TRUE,
  (SELECT id FROM categories WHERE slug = 'historia')
);

-- ─────────────────────────────────────────
-- ETAPY QUESTÓW
-- ─────────────────────────────────────────

-- Quest 1: Odkryj NGO
INSERT INTO quest_steps (quest_id, place_id, step_number, title, description) VALUES
(
  (SELECT id FROM quests WHERE slug = 'odkryj-ngo-bielska'),
  (SELECT id FROM places WHERE slug = 'caritas-siedziba'),
  1,
  'Odwiedź Caritas',
  'Zacznij od siedziby Caritas — jednej z największych organizacji charytatywnych w Bielsku. Dowiedz się, jak pomagają.'
),
(
  (SELECT id FROM quests WHERE slug = 'odkryj-ngo-bielska'),
  (SELECT id FROM places WHERE slug = 'mops-siedziba'),
  2,
  'Odwiedź MOPS',
  'Miejski Ośrodek Pomocy Społecznej to publiczna instytucja pomocowa. Sprawdź jakie programy realizuje dla mieszkańców Bielska.'
);

-- Quest 2: Szlak historyczny
INSERT INTO quest_steps (quest_id, place_id, step_number, title, description) VALUES
(
  (SELECT id FROM quests WHERE slug = 'szlak-historyczny'),
  (SELECT id FROM places WHERE slug = 'katedra-sw-mikolaja'),
  1,
  'Katedra Świętego Mikołaja',
  'Zacznij od najstarszej świątyni miasta — katedry wzmiankowanej już w 1312 roku.'
),
(
  (SELECT id FROM quests WHERE slug = 'szlak-historyczny'),
  (SELECT id FROM places WHERE slug = 'ratusz-bielsko'),
  2,
  'Ratusz miejski',
  'Plac Ratuszowy to serce Bielska-Białej. Tu biło miasto przez wieki.'
),
(
  (SELECT id FROM quests WHERE slug = 'szlak-historyczny'),
  (SELECT id FROM places WHERE slug = 'muzeum-historyczne'),
  3,
  'Muzeum w Zamku Sułkowskich',
  'Finał szlaku — zamek z XVI wieku i muzeum historii regionu.'
);

-- ─────────────────────────────────────────
-- KODY QR (przykładowe)
-- ─────────────────────────────────────────
INSERT INTO qr_codes (code, place_id, is_active, is_single_use) VALUES
  ('MIEJSKI-CARITAS-001', (SELECT id FROM places WHERE slug = 'caritas-siedziba'), TRUE, FALSE),
  ('MIEJSKI-MOPS-001',    (SELECT id FROM places WHERE slug = 'mops-siedziba'),    TRUE, FALSE),
  ('MIEJSKI-RATUSZ-001',  (SELECT id FROM places WHERE slug = 'ratusz-bielsko'),   TRUE, FALSE),
  ('MIEJSKI-KATEDRA-001', (SELECT id FROM places WHERE slug = 'katedra-sw-mikolaja'), TRUE, FALSE),
  ('MIEJSKI-SZYN-001',    (SELECT id FROM places WHERE slug = 'szyndzielnia-stacja-gorna'), TRUE, FALSE);
