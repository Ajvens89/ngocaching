import Link from 'next/link'
import { MapPin, Users, Star, ArrowRight, Zap, Shield, Navigation, Clock } from 'lucide-react'
import { createServerDataClient } from '@/lib/data-server'
import { DIFFICULTY_LABELS, formatTime } from '@/lib/utils'
import type { Difficulty } from '@/lib/types'

// Kolory questów wg trudności
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

  // Pobierz liczniki z bazy — graceful fallback if any query throws
  let placesCount: number | null = null
  let questsCount: number | null = null
  let ngosCount: number | null = null
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
    placesCount  = pc ?? null
    questsCount  = qc ?? null
    ngosCount    = nc ?? null
    featuredQuests = fq ?? null
  } catch (err) {
    console.error('HomePage data fetch error:', err)
    // All counts remain null; featuredQuests remains null → sections hidden
  }

  const places = placesCount ?? 0
  const quests = questsCount ?? 0
  const ngos   = ngosCount   ?? 0

  return (
    <div className="min-h-screen bg-surface flex flex-col overflow-hidden">

      {/* Animowane blob-y w tle */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 -right-32 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)' }} />
      </div>

      <main className="relative flex-1 flex flex-col px-5">

        {/* Hero */}
        <div className="flex flex-col items-center text-center pt-16 pb-8">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl glow-green"
              style={{ background: 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)' }}>
              🧭
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)' }}>
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <h1 className="font-display text-5xl font-black text-white tracking-tight leading-none mb-2">
            Miejski
            <span className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #4ade80, #22c55e)' }}>
              Trop
            </span>
          </h1>
          <p className="text-slate-400 text-base font-medium mb-2">
            Odkryj Bielsko-Białą. Poznaj tych, którzy mu służą.
          </p>

          {/* Liczniki z bazy danych */}
          <div className="flex items-center gap-5 mt-4 mb-8">
            <Stat value={ngos > 0 ? `${ngos}` : '—'} label="NGO" />
            <div className="w-px h-8 bg-surface-border" />
            <Stat value={quests > 0 ? `${quests}` : '—'} label="Questów" />
            <div className="w-px h-8 bg-surface-border" />
            <Stat value={places > 0 ? `${places}` : '—'} label="Miejsc" />
          </div>

          {/* CTA */}
          <div className="w-full max-w-sm space-y-3">
            <Link href="/map"
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold text-white text-base transition-all duration-200 active:scale-95 shadow-xl"
              style={{ background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 50%, #4ade80 100%)', boxShadow: '0 8px 32px rgba(34,197,94,0.35)' }}
            >
              <Navigation className="w-5 h-5" />
              Zacznij odkrywać
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/auth/login"
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-semibold text-slate-200 text-base transition-all duration-200 active:scale-95"
              style={{ background: 'rgba(34,38,58,0.8)', border: '1px solid rgba(45,49,72,0.8)' }}
            >
              Zaloguj się
            </Link>
            <p className="text-slate-500 text-sm text-center">
              Nie masz konta?{' '}
              <Link href="/auth/register" className="text-brand-400 font-semibold">
                Zarejestruj się
              </Link>
            </p>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="w-full max-w-sm mx-auto space-y-2.5 mb-8">
          <FeatureRow icon={<MapPin className="w-4 h-4" />} color="#22c55e" bg="rgba(34,197,94,0.12)" text="Odkrywaj punkty NGO i miejsca miejskie" />
          <FeatureRow icon={<Star className="w-4 h-4" />} color="#facc15" bg="rgba(250,204,21,0.10)" text="Zaliczaj questy i zdobywaj odznaki" />
          <FeatureRow icon={<Users className="w-4 h-4" />} color="#60a5fa" bg="rgba(96,165,250,0.10)" text="Poznaj organizacje służące miastu" />
          <FeatureRow icon={<Shield className="w-4 h-4" />} color="#a78bfa" bg="rgba(167,139,250,0.10)" text="Skanuj QR kody i zaliczaj lokalizacje" />
        </div>
      </main>

      {/* Questy z bazy — jeśli są, pokazujemy; jeśli nie, sekcja znika */}
      {featuredQuests && featuredQuests.length > 0 && (
        <section className="relative px-5 pb-10">
          <div className="flex items-center justify-between mb-4">
            <p className="section-label">
              {featuredQuests.some((q: any) => q.is_featured) ? 'Polecane questy' : 'Dostępne questy'}
            </p>
            <Link href="/quests" className="text-brand-400 text-xs font-semibold">
              Zobacz wszystkie →
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5">
            {(featuredQuests as any[]).map((quest) => {
              const diff = (quest.difficulty || 'easy') as Difficulty
              // demo-client returns array of step objects; use .length which works
              // for both demo (array of objects) and real Supabase count results
              const stepsCount = quest.steps?.length ?? 0
              return (
                <Link
                  key={quest.id}
                  href={`/quest/${quest.id}`}
                  className="flex-shrink-0 w-44 rounded-2xl overflow-hidden transition-transform duration-200 active:scale-95"
                  style={{ background: QUEST_GRADIENTS[diff], border: `1px solid ${QUEST_ACCENTS[diff]}30` }}
                >
                  <div className="p-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3"
                      style={{ background: `${QUEST_ACCENTS[diff]}20` }}>
                      {QUEST_ICONS[diff]}
                    </div>
                    <p className="text-white font-bold text-sm leading-tight mb-1 line-clamp-2">{quest.title}</p>
                    <div className="flex flex-col gap-0.5 mt-1">
                      {stepsCount > 0 && (
                        <p className="text-xs font-medium" style={{ color: QUEST_ACCENTS[diff] }}>
                          📍 {stepsCount} etapów
                        </p>
                      )}
                      {quest.estimated_time && (
                        <p className="text-xs font-medium" style={{ color: `${QUEST_ACCENTS[diff]}bb` }}>
                          <Clock className="w-2.5 h-2.5 inline mr-0.5" />
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
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-white font-black text-xl leading-none">{value}</p>
      <p className="text-slate-500 text-xs mt-0.5">{label}</p>
    </div>
  )
}

function FeatureRow({ icon, color, bg, text }: { icon: React.ReactNode; color: string; bg: string; text: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{ background: bg, border: `1px solid ${color}22` }}>
      <span style={{ color }}>{icon}</span>
      <span className="text-slate-300 text-sm font-medium">{text}</span>
    </div>
  )
}
