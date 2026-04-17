import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Clock, ChevronRight, Zap, TrendingUp } from 'lucide-react'
import { createServerDataClient } from '@/lib/data-server'
import { Quest } from '@/lib/types'
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS, formatTime, cn } from '@/lib/utils'
import type { Difficulty } from '@/lib/types'

export const metadata: Metadata = { title: 'Questy' }

const DIFFICULTY_GRADIENTS: Record<Difficulty | string, string> = {
  easy:   'linear-gradient(135deg, #14532d, #166534)',
  medium: 'linear-gradient(135deg, #713f12, #a16207)',
  hard:   'linear-gradient(135deg, #7f1d1d, #b91c1c)',
}

const DIFFICULTY_ACCENT: Record<Difficulty | string, string> = {
  easy:   '#4ade80',
  medium: '#facc15',
  hard:   '#f87171',
}

export default async function QuestsPage() {
  const dataClient = createServerDataClient()

  const { data: quests } = await dataClient
    .from('quests')
    .select(`*, category:categories(*), badge:badges(*), steps:quest_steps(count)`)
    .eq('is_active', true)
    .order('is_featured', { ascending: false })

  const featured = quests?.filter((q: any) => q.is_featured) || []
  const regular  = quests?.filter((q: any) => !q.is_featured) || []
  const allQuests = quests || []

  return (
    <div className="min-h-screen bg-surface pb-6">

      {/* ── Header ── */}
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display text-3xl font-black text-white tracking-tight">Questy</h1>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            <Zap className="w-3 h-3" />
            {allQuests.length} aktywnych
          </div>
        </div>
        <p className="text-slate-400 text-sm">Odkrywaj miasto przez tematyczne szlaki</p>
      </div>

      {/* ── Stats Strip ── */}
      <div className="px-5 mb-6">
        <div
          className="grid grid-cols-3 gap-3 p-4 rounded-2xl"
          style={{ background: 'linear-gradient(135deg, #1a2f1e22, #1e253522)', border: '1px solid rgba(34,197,94,0.15)' }}
        >
          <MiniStat icon="🗺️" value={allQuests.length.toString()} label="Questów" />
          <MiniStat icon="📍" value={allQuests.reduce((s: number, q: any) => s + (q.steps?.length || 0), 0).toString()} label="Etapów" />
          <MiniStat icon="🏅" value={allQuests.filter((q: any) => q.badge).length.toString()} label="Nagród" />
        </div>
      </div>

      {/* ── Featured ── */}
      {featured.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 px-5 mb-3">
            <TrendingUp className="w-4 h-4 text-brand-400" />
            <p className="section-label">Polecane</p>
          </div>
          <div className="flex gap-4 overflow-x-auto px-5 pb-2 scrollbar-hide">
            {featured.map((quest: any) => (
              <FeaturedCard key={quest.id} quest={quest} />
            ))}
          </div>
        </section>
      )}

      {/* ── All Quests ── */}
      <section className="px-5">
        <p className="section-label mb-3">Wszystkie questy</p>
        <div className="space-y-3">
          {allQuests.map((quest: any) => (
            <QuestRow key={quest.id} quest={quest} />
          ))}
          {allQuests.length === 0 && (
            <div className="card p-10 text-center">
              <p className="text-4xl mb-3">🗺️</p>
              <p className="text-white font-semibold mb-1">Questy wkrótce</p>
              <p className="text-slate-500 text-sm">Sprawdź ponownie za chwilę</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function MiniStat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-lg mb-0.5">{icon}</p>
      <p className="text-white font-black text-lg leading-none">{value}</p>
      <p className="text-slate-500 text-xs mt-0.5">{label}</p>
    </div>
  )
}

function FeaturedCard({ quest }: { quest: Quest & { steps?: any[]; category?: any } }) {
  const key = (quest.difficulty || 'easy') as Difficulty
  const gradient = DIFFICULTY_GRADIENTS[key] || DIFFICULTY_GRADIENTS.easy
  const accent   = DIFFICULTY_ACCENT[key]   || DIFFICULTY_ACCENT.easy
  const stepsCount = quest.steps?.length || 0

  return (
    <Link
      href={`/quest/${quest.id}`}
      className="flex-shrink-0 w-64 rounded-2xl overflow-hidden transition-transform duration-200 active:scale-95"
      style={{ background: gradient, border: `1px solid ${accent}25` }}
    >
      <div className="relative h-32">
        {quest.cover_image ? (
          <Image src={quest.cover_image} alt={quest.title} fill className="object-cover opacity-60" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-40">🗺️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-3 left-3">
          <span
            className="text-xs font-bold px-2 py-1 rounded-full"
            style={{ background: `${accent}25`, color: accent, border: `1px solid ${accent}40` }}
          >
            {DIFFICULTY_LABELS[key] || 'Łatwy'}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-white font-bold text-sm leading-tight mb-2">{quest.title}</h3>
        <div className="flex items-center gap-3 text-xs" style={{ color: `${accent}cc` }}>
          {stepsCount > 0 && <span>📍 {stepsCount} etapów</span>}
          {quest.estimated_time && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(quest.estimated_time)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function QuestRow({ quest }: { quest: Quest & { steps?: any[]; category?: any } }) {
  const key = (quest.difficulty || 'easy') as Difficulty
  const accent = DIFFICULTY_ACCENT[key] || DIFFICULTY_ACCENT.easy
  const stepsCount = quest.steps?.length || 0

  return (
    <Link
      href={`/quest/${quest.id}`}
      className="flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 active:scale-[0.98]"
      style={{ background: 'rgba(26,29,39,1)', border: '1px solid rgba(45,49,72,0.8)' }}
    >
      {/* Icon */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}
      >
        {quest.cover_image ? (
          <Image src={quest.cover_image} alt="" width={56} height={56} className="rounded-2xl object-cover" />
        ) : '🗺️'}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-bold text-sm truncate mb-1">{quest.title}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${accent}15`, color: accent }}
          >
            {DIFFICULTY_LABELS[key] || 'Łatwy'}
          </span>
          {stepsCount > 0 && (
            <span className="text-slate-500 text-xs">📍 {stepsCount} etapów</span>
          )}
          {quest.estimated_time && (
            <span className="text-slate-500 text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(quest.estimated_time)}
            </span>
          )}
        </div>
      </div>

      <ChevronRight className="w-5 h-5 text-slate-600 flex-shrink-0" />
    </Link>
  )
}
