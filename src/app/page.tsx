import Link from 'next/link'
import { MapPin, Users, Clock, ArrowRight, Navigation, CheckCircle } from 'lucide-react'
import { createServerDataClient } from '@/lib/data-server'
import { DIFFICULTY_LABELS, formatTime } from '@/lib/utils'
import type { Difficulty } from '@/lib/types'

const QUEST_GRADIENTS: Record<Difficulty | string, string> = {
  easy:   'linear-gradient(135deg, #14532d 0%, #166534 100%)',
  medium: 'linear-gradient(135deg, #713f12 0%, #a16207 100%)',
  hard:   'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)',
}
const QUEST_ACCENTS: Record<Difficulty | string, string> = {
  easy: '#4ade80', medium: '#facc15', hard: '#f87171',
}
const QUEST_ICONS: Record<Difficulty | string, string> = {
  easy: '🗺️', medium: '🧭', hard: '🏆',
}

export default async function HomePage() {
  const dataClient = createServerDataClient()

  let placesCount: number | null = null
  let questsCount: number | null = null
  let ngosCount:   number | null = null
  let featuredQuests: any[] | null = null

  try {
    const [
      { count: pc },
      { count: qc },
      { count: nc },
      { data: fq },
    ] = await Promise.all([
      dataClient.from('places').select('id', { count: 'exact', head: true }).eq('is_active', true),
      dataClient.from('quests').select('id', { count: 'exact', head: true }).eq('is_active', true),
      dataClient.from('places').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('type', 'ngo'),
      dataClient
        .from('quests')
        .select('id, title, difficulty, estimated_time, steps:quest_steps(count)')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .limit(4),
    ])
    placesCount    = pc ?? null
    questsCount    = qc ?? null
    ngosCount      = nc ?? null
    featuredQuests = fq ?? null
  } catch (err) {
    console.error('HomePage data fetch error:', err)
  }

  const places = placesCount ?? 0
  const quests = questsCount ?? 0
  const ngos   = ngosCount   ?? 0

  return (
    <div className="min-h-screen bg-surface flex flex-col">

      {/* ── Dekoration blobs (tło, pointer-events: none) ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 -right-32 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} />
      </div>

      {/* ── Nagłówek / nav ────────────────────────────────── */}
      <header className="relative z-10 sticky top-0"
        style={{ background: 'rgba(15,17,23,0.92)', borderBottom: '1px solid rgba(45,49,72,0.5)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2" aria-label="MiejskiTrop – strona główna">
            <span className="text-xl" aria-hidden="true">🧭</span>
            <span className="font-display font-black text-white text-lg leading-none">
              Miejski<span className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #4ade80, #22c55e)' }}>Trop</span>
            </span>
          </Link>

          {/* Linki nawigacyjne */}
          <nav aria-label="Nawigacja główna">
            <ul className="flex items-center gap-1 list-none m-0 p-0">
              <li>
                <Link href="/quests"
                  className="hidden sm:block px-3 py-1.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white transition-colors">
                  Questy
                </Link>
              </li>
              <li>
                <Link href="/map"
                  className="hidden sm:block px-3 py-1.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white transition-colors">
                  Mapa
                </Link>
              </li>
              <li>
                <Link href="#o-projekcie"
                  className="hidden sm:block px-3 py-1.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white transition-colors">
                  O projekcie
                </Link>
              </li>
              <li>
                <Link href="/auth/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
                  Zaloguj się
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="relative flex-1 flex flex-col">

        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="flex flex-col items-center text-center px-5 pt-14 pb-12 max-w-lg mx-auto w-full"
          aria-label="Sekcja powitalna">
          <div className="relative mb-7" aria-hidden="true">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl glow-green"
              style={{ background: 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)' }}>
              🧭
            </div>
          </div>

          <h1 className="font-display text-5xl font-black text-white tracking-tight leading-none mb-3">
            Miejski
            <span className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #4ade80, #22c55e)' }}>
              Trop
            </span>
          </h1>

          <p className="text-slate-300 text-lg font-medium mb-3 max-w-sm">
            Odkryj Bielsko-Białą. Poznaj organizacje, które jej służą.
          </p>

          {/* Liczniki */}
          {(ngos > 0 || quests > 0 || places > 0) && (
            <div className="flex items-center gap-5 mt-2 mb-8" role="list" aria-label="Statystyki aplikacji">
              <Stat value={`${ngos}`} label="NGO" />
              <div className="w-px h-8 bg-surface-border" aria-hidden="true" />
              <Stat value={`${quests}`} label="questów" />
              <div className="w-px h-8 bg-surface-border" aria-hidden="true" />
              <Stat value={`${places}`} label="miejsc" />
            </div>
          )}

          {/* CTA */}
          <div className="w-full max-w-sm space-y-3">
            <Link href="/map"
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold text-white text-base transition-all duration-200 active:scale-95 shadow-xl"
              style={{ background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 50%, #4ade80 100%)', boxShadow: '0 8px 32px rgba(34,197,94,0.35)' }}
              aria-label="Zacznij odkrywać — przejdź do mapy">
              <Navigation className="w-5 h-5" aria-hidden="true" />
              Zacznij odkrywać
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link href="/auth/register"
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-semibold text-slate-200 text-base transition-all duration-200 active:scale-95"
              style={{ background: 'rgba(34,38,58,0.8)', border: '1px solid rgba(45,49,72,0.8)' }}>
              Utwórz darmowe konto
            </Link>
            <p className="text-slate-500 text-sm">
              Masz konto?{' '}
              <Link href="/auth/login" className="text-brand-400 font-semibold hover:text-brand-300">
                Zaloguj się
              </Link>
            </p>
          </div>
        </section>

        {/* ── O projekcie ──────────────────────────────────── */}
        <section id="o-projekcie" className="px-5 py-12 max-w-2xl mx-auto w-full"
          aria-labelledby="mission-heading">
          <div className="mb-8">
            <p className="text-brand-500 text-sm font-bold uppercase tracking-widest mb-2">O projekcie</p>
            <h2 id="mission-heading" className="font-display text-3xl font-black text-white mb-4 leading-tight">
              Miasto to nie tylko budynki.<br />To ludzie, którzy im służą.
            </h2>
            <p className="text-slate-300 text-base leading-relaxed max-w-prose">
              MiejskiTrop to aplikacja miejska dla Bielska-Białej, która łączy eksplorację
              z poznawaniem lokalnych organizacji pozarządowych. Odwiedzasz miejsca, skanujesz
              kody QR, zaliczasz questy — i przy okazji dowiadujesz się, kto napędza swoje miasto.
            </p>
          </div>

          <ul className="space-y-4" aria-label="Cechy aplikacji">
            {[
              {
                icon: <MapPin className="w-5 h-5" aria-hidden="true" />,
                color: '#22c55e',
                bg: 'rgba(34,197,94,0.1)',
                border: 'rgba(34,197,94,0.2)',
                title: 'Odkrywaj punkty na mapie',
                desc: 'Interaktywna mapa Bielska-Białej z siedzibami NGO, parkami, zabytkami i innymi miejscami wartymi odwiedzenia.',
              },
              {
                icon: <CheckCircle className="w-5 h-5" aria-hidden="true" />,
                color: '#facc15',
                bg: 'rgba(250,204,21,0.08)',
                border: 'rgba(250,204,21,0.2)',
                title: 'Zaliczaj questy i zbieraj odznaki',
                desc: 'Każda trasa to historia. Ukończ quest, zdobądź odznakę i wspinaj się na wyższe poziomy odkrywcy.',
              },
              {
                icon: <Users className="w-5 h-5" aria-hidden="true" />,
                color: '#60a5fa',
                bg: 'rgba(96,165,250,0.08)',
                border: 'rgba(96,165,250,0.2)',
                title: 'Poznaj organizacje NGO',
                desc: 'Za każdym miejscem stoi historia ludzi — fundacji, stowarzyszeń i inicjatyw, które działają dla dobra wspólnego.',
              },
            ].map(({ icon, color, bg, border, title, desc }) => (
              <li key={title} className="flex gap-4 p-4 rounded-2xl"
                style={{ background: bg, border: `1px solid ${border}` }}>
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-0.5"
                  style={{ background: `${color}18`, color }}>
                  {icon}
                </div>
                <div>
                  <p className="text-white font-semibold text-base mb-1">{title}</p>
                  <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Jak to działa ────────────────────────────────── */}
        <section className="px-5 py-12 max-w-2xl mx-auto w-full border-t"
          style={{ borderColor: 'rgba(45,49,72,0.4)' }}
          aria-labelledby="how-heading">
          <p className="text-brand-500 text-sm font-bold uppercase tracking-widest mb-2">Jak to działa</p>
          <h2 id="how-heading" className="font-display text-3xl font-black text-white mb-8 leading-tight">
            Trzy kroki do pierwszego questa
          </h2>

          <ol className="space-y-6" aria-label="Kroki onboardingu">
            {[
              {
                num: '1',
                title: 'Otwórz mapę',
                desc: 'Wybierz punkt w pobliżu — siedzibę NGO, park lub zabytek. Każde miejsce ma opis i historię.',
              },
              {
                num: '2',
                title: 'Zaleź miejsce i zeskanuj kod QR',
                desc: 'Przy każdym punkcie znajduje się kod QR. Zeskanuj go aplikacją, aby potwierdzić wizytę i zdobyć punkty.',
              },
              {
                num: '3',
                title: 'Ukończ quest i odbierz odznakę',
                desc: 'Zalicz wszystkie etapy trasy, zdobądź odznakę i przejdź na wyższy poziom odkrywcy Bielska-Białej.',
              },
            ].map(({ num, title, desc }) => (
              <li key={num} className="flex gap-4">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-black text-base"
                  style={{ background: 'linear-gradient(135deg, #15803d, #22c55e)', color: '#fff' }}
                  aria-hidden="true"
                >
                  {num}
                </div>
                <div className="pt-1">
                  <p className="text-white font-bold text-base mb-1">{title}</p>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-prose">{desc}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10">
            <Link href="/map"
              className="inline-flex items-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-white transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', boxShadow: '0 4px 20px rgba(34,197,94,0.3)' }}
              aria-label="Zacznij odkrywać — przejdź do mapy">
              Zacznij odkrywać
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* ── Polecane questy ──────────────────────────────── */}
        {featuredQuests && featuredQuests.length > 0 && (
          <section className="px-5 py-12 max-w-2xl mx-auto w-full border-t w-full"
            style={{ borderColor: 'rgba(45,49,72,0.4)' }}
            aria-labelledby="quests-heading">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-brand-500 text-sm font-bold uppercase tracking-widest mb-1">Questy</p>
                <h2 id="quests-heading" className="font-display text-2xl font-black text-white">
                  {featuredQuests.some((q: any) => q.is_featured) ? 'Polecane trasy' : 'Dostępne trasy'}
                </h2>
              </div>
              <Link href="/quests"
                className="text-brand-400 text-sm font-semibold hover:text-brand-300 transition-colors flex items-center gap-1"
                aria-label="Zobacz wszystkie questy">
                Wszystkie <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5"
              role="list"
              aria-label="Lista questów">
              {(featuredQuests as any[]).map((quest) => {
                const diff = (quest.difficulty || 'easy') as Difficulty
                const stepsCount = quest.steps?.length ?? 0
                return (
                  <Link
                    key={quest.id}
                    href={`/quest/${quest.id}`}
                    className="flex-shrink-0 w-48 rounded-2xl overflow-hidden transition-transform duration-200 active:scale-95"
                    style={{ background: QUEST_GRADIENTS[diff], border: `1px solid ${QUEST_ACCENTS[diff]}30` }}
                    role="listitem"
                    aria-label={`Quest: ${quest.title}, trudność: ${DIFFICULTY_LABELS[diff as Difficulty] ?? diff}`}
                  >
                    <div className="p-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3"
                        style={{ background: `${QUEST_ACCENTS[diff]}20` }}
                        aria-hidden="true">
                        {QUEST_ICONS[diff]}
                      </div>
                      <p className="text-white font-bold text-sm leading-tight mb-1 line-clamp-2">
                        {quest.title}
                      </p>
                      <div className="flex flex-col gap-0.5 mt-1">
                        {stepsCount > 0 && (
                          <p className="text-xs font-medium" style={{ color: QUEST_ACCENTS[diff] }}>
                            <MapPin className="w-3 h-3 inline mr-0.5" aria-hidden="true" />
                            {stepsCount} {stepsCount === 1 ? 'etap' : stepsCount < 5 ? 'etapy' : 'etapów'}
                          </p>
                        )}
                        {quest.estimated_time && (
                          <p className="text-xs font-medium" style={{ color: `${QUEST_ACCENTS[diff]}bb` }}>
                            <Clock className="w-2.5 h-2.5 inline mr-0.5" aria-hidden="true" />
                            {formatTime(quest.estimated_time)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </main>

      {/* ── Stopka ────────────────────────────────────────── */}
      <footer className="relative border-t px-5 py-10"
        style={{ borderColor: 'rgba(45,49,72,0.4)' }}
        aria-label="Stopka strony">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            {/* Marka */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl" aria-hidden="true">🧭</span>
                <span className="font-display font-black text-white text-lg">MiejskiTrop</span>
              </div>
              <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                Odkrywaj Bielsko-Białą i poznaj organizacje, które jej służą.
              </p>
            </div>

            {/* Linki */}
            <nav aria-label="Linki w stopce">
              <ul className="flex flex-wrap gap-x-5 gap-y-2 list-none m-0 p-0">
                <li><Link href="/map"     className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Mapa</Link></li>
                <li><Link href="/quests"  className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Questy</Link></li>
                <li><Link href="/explore" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Odkryj</Link></li>
                <li><Link href="/auth/register" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Rejestracja</Link></li>
                <li>
                  <Link href="/polityka-prywatnosci"
                    className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                    Polityka prywatności
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div className="mt-8 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            style={{ borderTop: '1px solid rgba(45,49,72,0.4)' }}>
            <p className="text-slate-600 text-xs">
              © {new Date().getFullYear()} MiejskiTrop. Projekt społeczny dla Bielska-Białej.
            </p>
            <p className="text-slate-700 text-xs">
              Kontakt:{' '}
              <a href="mailto:kontakt@miejskitrop.pl"
                className="text-slate-500 hover:text-slate-300 transition-colors">
                kontakt@miejskitrop.pl
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center" role="listitem">
      <p className="text-white font-black text-xl leading-none">{value}</p>
      <p className="text-slate-500 text-xs mt-0.5">{label}</p>
    </div>
  )
}
