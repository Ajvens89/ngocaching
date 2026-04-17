import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Clock, MapPin, CheckCircle2, Circle, Lock, Trophy } from 'lucide-react'
import { createServerDataClient } from '@/lib/data-server'
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS, formatTime, cn } from '@/lib/utils'

interface PageProps { params: { id: string } }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const dataClient = createServerDataClient()
  const { data } = await dataClient.from('quests').select('title').eq('id', params.id).single()
  return { title: data?.title || 'Quest' }
}

export default async function QuestDetailPage({ params }: PageProps) {
  const dataClient = createServerDataClient()

  const { data: quest, error } = await dataClient
    .from('quests')
    .select(`
      *,
      category:categories(*),
      badge:badges(*),
      steps:quest_steps(*, place:places(id, name, short_description, type, cover_image, latitude, longitude))
    `)
    .eq('id', params.id)
    .eq('is_active', true)
    .single()

  if (error || !quest) notFound()

  const steps = quest.steps?.sort((a: any, b: any) => a.step_number - b.step_number) || []

  // Pobierz postęp użytkownika (jeśli zalogowany)
  const { data: { user } } = await dataClient.auth.getUser()
  let userProgress = null
  if (user) {
    const { data } = await dataClient
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('quest_id', quest.id)
      .single()
    userProgress = data
  }

  const completedSteps: number[] = userProgress?.steps_completed || []
  const difficultyKey = (quest.difficulty || 'easy') as keyof typeof DIFFICULTY_COLORS
  const progressPercent = steps.length > 0
    ? Math.round((completedSteps.length / steps.length) * 100)
    : 0

  return (
    <div className="min-h-screen bg-surface">
      {/* Okładka */}
      <div className="relative h-56">
        {quest.cover_image ? (
          <Image src={quest.cover_image} alt={quest.title} fill className="object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-900 to-surface-card flex items-center justify-center text-7xl">
            🗺️
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
        <Link
          href="/quests"
          className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-surface-card/80 backdrop-blur border border-surface-border flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
      </div>

      <div className="px-4 py-5 space-y-6">

        {/* Nagłówek */}
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {quest.category && (
              <span className="category-badge">{quest.category.icon} {quest.category.name}</span>
            )}
            <span className={cn('text-sm font-medium', DIFFICULTY_COLORS[difficultyKey])}>
              {DIFFICULTY_LABELS[difficultyKey]}
            </span>
          </div>
          <h1 className="text-white text-2xl font-bold">{quest.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-slate-400 text-sm">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />{steps.length} etapów
            </span>
            {quest.estimated_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />{formatTime(quest.estimated_time)}
              </span>
            )}
          </div>
        </div>

        {/* Opis */}
        {quest.description && (
          <p className="text-slate-300 leading-relaxed">{quest.description}</p>
        )}

        {/* Postęp */}
        {userProgress && (
          <div className="card p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-slate-300 text-sm font-medium">Twój postęp</p>
              <p className="text-brand-400 text-sm font-bold">
                {completedSteps.length}/{steps.length}
              </p>
            </div>
            <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {userProgress.is_completed && (
              <p className="text-brand-400 text-sm mt-2 flex items-center gap-1">
                <Trophy className="w-4 h-4" /> Quest ukończony!
              </p>
            )}
          </div>
        )}

        {/* Etapy */}
        <div>
          <h2 className="text-white font-semibold mb-3">Etapy questu</h2>
          <div className="space-y-2">
            {steps.map((step: any, index: number) => {
              const isCompleted = completedSteps.includes(step.step_number)
              const isNext = !isCompleted && (index === 0 || completedSteps.includes(steps[index - 1]?.step_number))
              const isLocked = !isCompleted && !isNext && userProgress !== null

              return (
                <div
                  key={step.id}
                  className={cn(
                    'card p-3 flex items-start gap-3 transition-colors',
                    isNext && 'border-brand-500/40',
                    isLocked && 'opacity-50'
                  )}
                >
                  {/* Status ikona */}
                  <div className="mt-0.5 flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-brand-400" />
                    ) : isLocked ? (
                      <Lock className="w-5 h-5 text-slate-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-slate-500 text-xs">Etap {step.step_number}</span>
                      {step.is_optional && (
                        <span className="category-badge text-xs py-0.5">opcjonalny</span>
                      )}
                    </div>
                    <h3 className={cn(
                      'font-medium text-sm',
                      isCompleted ? 'text-brand-400' : 'text-white'
                    )}>
                      {step.title}
                    </h3>
                    {step.description && (
                      <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">{step.description}</p>
                    )}

                    {/* Przejdź do etapu */}
                    {step.place && (isNext || isCompleted) && (
                      <Link
                        href={`/place/${step.place.id}`}
                        className={cn(
                          'inline-flex items-center gap-1 mt-2 text-xs font-medium rounded-lg px-2.5 py-1.5',
                          isNext
                            ? 'bg-brand-500 text-white'
                            : 'bg-surface-elevated text-slate-400'
                        )}
                      >
                        <MapPin className="w-3 h-3" />
                        {isNext ? 'Przejdź do miejsca' : 'Odwiedź ponownie'}
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Nagroda */}
        {(quest.reward_description || quest.badge) && (
          <div className="card p-4 border-yellow-500/30">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              Nagroda za ukończenie
            </h3>
            {quest.reward_description && (
              <p className="text-slate-300 text-sm mb-2">{quest.reward_description}</p>
            )}
            {quest.badge && (
              <div className="flex items-center gap-3">
                {quest.badge.image && (
                  <Image src={quest.badge.image} alt={quest.badge.name} width={40} height={40} />
                )}
                <div>
                  <p className="text-yellow-400 font-medium text-sm">{quest.badge.name}</p>
                  {quest.badge.description && (
                    <p className="text-slate-400 text-xs">{quest.badge.description}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        {!userProgress && (
          <button className="btn-primary w-full">Rozpocznij quest</button>
        )}
      </div>
    </div>
  )
}
