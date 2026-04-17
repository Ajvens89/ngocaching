import { Metadata } from 'next'
import Link from 'next/link'
import { Settings, MapPin, Trophy, Compass, ChevronRight } from 'lucide-react'
import { createServerDataClient } from '@/lib/data-server'
import { getExplorerLevel, formatRelativeTime } from '@/lib/utils'
import { EXPLORER_LEVEL_NAMES } from '@/lib/constants'

export const metadata: Metadata = { title: 'Profil' }

export default async function ProfilePage() {
  const dataClient = createServerDataClient()
  const { data: { user } } = await dataClient.auth.getUser()

  if (!user) return <NotLoggedIn />

  const { data: profile } = await dataClient
    .from('user_profiles').select('*').eq('id', user.id).single()

  const { data: recentCheckins } = await dataClient
    .from('checkins').select('*, place:places(id, name, type)')
    .eq('user_id', user.id).order('verified_at', { ascending: false }).limit(10)

  const { data: userBadges } = await dataClient
    .from('user_badges').select('*, badge:badges(*)').eq('user_id', user.id)

  const { data: questProgress } = await dataClient
    .from('user_progress').select('*, quest:quests(title)')
    .eq('user_id', user.id).order('started_at', { ascending: false })

  const totalPoints = (recentCheckins || []).reduce((sum: number, ci: any) => sum + (ci.points_earned || 0), 0)
  const { level, nextLevelPoints, progress } = getExplorerLevel(totalPoints)
  const levelName = EXPLORER_LEVEL_NAMES[level - 1] || 'Odkrywca'
  const checkinCount = recentCheckins?.length || 0
  const badgeCount   = userBadges?.length || 0
  const questCount   = questProgress?.filter((q: any) => q.is_completed).length || 0

  const displayName = profile?.display_name || profile?.username || 'Odkrywca'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-surface pb-8">

      {/* ── Hero Header ── */}
      <div
        className="relative px-5 pt-12 pb-6"
        style={{ background: 'linear-gradient(180deg, #0d1f12 0%, #0f1117 100%)' }}
      >
        {/* Settings button */}
        <Link
          href="/profile/settings"
          className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-2xl"
          style={{ background: 'rgba(34,38,58,0.8)', border: '1px solid rgba(45,49,72,0.6)' }}
        >
          <Settings className="w-4 h-4 text-slate-400" />
        </Link>

        {/* Avatar + Name */}
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-2xl font-black overflow-hidden glow-sm"
            style={{ background: 'linear-gradient(135deg, #15803d, #22c55e)' }}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : initials}
          </div>
          <div>
            <h1 className="text-white font-black text-xl leading-tight">{displayName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}
              >
                ⚡ Poziom {level} · {levelName}
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-1">{user.email}</p>
          </div>
        </div>

        {/* XP Bar */}
        <div
          className="p-4 rounded-2xl"
          style={{ background: 'rgba(26,29,39,0.8)', border: '1px solid rgba(34,197,94,0.15)' }}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-xs font-medium">Poziom {level} → {level + 1}</span>
            <span className="text-brand-400 text-xs font-black">{totalPoints} / {nextLevelPoints} XP</span>
          </div>
          <div className="h-2.5 bg-surface-elevated rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #16a34a, #4ade80)',
                boxShadow: '0 0 8px rgba(34,197,94,0.5)'
              }}
            />
          </div>
          <p className="text-slate-600 text-xs mt-2">
            {nextLevelPoints - totalPoints} XP do następnego poziomu
          </p>
        </div>
      </div>

      <div className="px-5 space-y-5 mt-5">

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<MapPin className="w-5 h-5" />}
            value={checkinCount}
            label="Zaliczonych"
            color="#22c55e"
            bg="rgba(34,197,94,0.08)"
          />
          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            value={badgeCount}
            label="Odznak"
            color="#facc15"
            bg="rgba(250,204,21,0.08)"
          />
          <StatCard
            icon={<Compass className="w-5 h-5" />}
            value={questCount}
            label="Questów"
            color="#60a5fa"
            bg="rgba(96,165,250,0.08)"
          />
        </div>

        {/* ── Badges ── */}
        {userBadges && userBadges.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <h2 className="text-white font-bold">Moje odznaki</h2>
              <span className="ml-auto text-slate-500 text-xs">{badgeCount} szt.</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
              {userBadges.map((ub: any) => (
                <div
                  key={ub.badge_id}
                  className="flex-shrink-0 flex flex-col items-center gap-1.5 p-3 w-20 rounded-2xl"
                  style={{ background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.15)' }}
                >
                  <span className="text-3xl">{ub.badge?.image || '🏅'}</span>
                  <p className="text-slate-400 text-[10px] text-center leading-tight line-clamp-2 font-medium">
                    {ub.badge?.name}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Quest Progress ── */}
        {questProgress && questProgress.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Compass className="w-4 h-4 text-civic-400" />
              <h2 className="text-white font-bold">Moje questy</h2>
            </div>
            <div className="space-y-2">
              {questProgress.map((qp: any) => (
                <Link
                  key={qp.id}
                  href={`/quest/${qp.quest_id}`}
                  className="flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-[0.98]"
                  style={{ background: 'rgba(26,29,39,1)', border: '1px solid rgba(45,49,72,0.8)' }}
                >
                  <div
                    className="w-2 h-10 rounded-full flex-shrink-0"
                    style={{ background: qp.is_completed ? 'linear-gradient(180deg, #22c55e, #16a34a)' : 'rgba(45,49,72,1)' }}
                  />
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">
                      {(qp.quest as any)?.title || 'Quest'}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {qp.is_completed
                        ? `✅ Ukończony · ${qp.steps_completed.length} etapów`
                        : `🔵 W toku · ${qp.steps_completed.length} etapów`}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Recent Activity ── */}
        {recentCheckins && recentCheckins.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">⚡</span>
              <h2 className="text-white font-bold">Ostatnia aktywność</h2>
            </div>
            <div className="space-y-2">
              {recentCheckins.map((ci: any) => (
                <Link
                  key={ci.id}
                  href={`/place/${ci.place_id}`}
                  className="flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-[0.98]"
                  style={{ background: 'rgba(26,29,39,1)', border: '1px solid rgba(45,49,72,0.8)' }}
                >
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-base"
                    style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)' }}
                  >
                    ✅
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">
                      {(ci.place as any)?.name || 'Punkt'}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {formatRelativeTime(ci.verified_at)}
                    </p>
                  </div>
                  <span
                    className="text-xs font-black px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80' }}
                  >
                    +{ci.points_earned}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {checkinCount === 0 && badgeCount === 0 && (
          <div className="text-center py-10">
            <p className="text-5xl mb-4">🧭</p>
            <p className="text-white font-bold text-lg mb-2">Zacznij odkrywać!</p>
            <p className="text-slate-400 text-sm mb-5">Zalicz swój pierwszy punkt, aby tu zobaczyć postępy.</p>
            <Link href="/map" className="btn-primary inline-flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Przejdź do mapy
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon, value, label, color, bg,
}: {
  icon: React.ReactNode; value: number; label: string; color: string; bg: string
}) {
  return (
    <div
      className="p-4 rounded-2xl text-center"
      style={{ background: bg, border: `1px solid ${color}20` }}
    >
      <div className="flex justify-center mb-1.5" style={{ color }}>{icon}</div>
      <p className="text-white font-black text-2xl leading-none">{value}</p>
      <p className="text-slate-500 text-xs mt-1 font-medium">{label}</p>
    </div>
  )
}

function NotLoggedIn() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 text-center">
      <div
        className="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl mb-6"
        style={{ background: 'linear-gradient(135deg, #15803d, #22c55e)', boxShadow: '0 8px 32px rgba(34,197,94,0.3)' }}
      >
        🧭
      </div>
      <h2 className="text-white text-2xl font-black mb-2">Zaloguj się</h2>
      <p className="text-slate-400 text-sm mb-8 max-w-xs">
        Śledź postępy, zdobywaj odznaki i odkrywaj miejskie questy.
      </p>
      <div className="w-full max-w-xs space-y-3">
        <Link href="/auth/login" className="btn-primary w-full block text-center">
          Zaloguj się
        </Link>
        <Link href="/auth/register" className="btn-secondary w-full block text-center">
          Utwórz konto
        </Link>
      </div>
    </div>
  )
}
