import Link from 'next/link'
import { MapPin, Users, Star, ArrowRight, Zap, Shield, Navigation } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col overflow-hidden">

      {/* ── Animated background blobs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 -right-32 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)' }}
        />
      </div>

      <main className="relative flex-1 flex flex-col px-5">

        {/* ── Hero ── */}
        <div className="flex flex-col items-center text-center pt-16 pb-8">

          {/* Logo mark */}
          <div className="relative mb-6">
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl glow-green"
              style={{ background: 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)' }}
            >
              🧭
            </div>
            <div
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)' }}
            >
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="font-display text-5xl font-black text-white tracking-tight leading-none mb-2">
            Miejski<span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #4ade80, #22c55e)' }}
            >Trop</span>
          </h1>
          <p className="text-slate-400 text-base font-medium mb-2">
            Odkryj Bielsko-Białą. Poznaj tych, którzy mu służą.
          </p>

          {/* Stats bar */}
          <div className="flex items-center gap-5 mt-4 mb-8">
            <Stat value="40+" label="NGO" />
            <div className="w-px h-8 bg-surface-border" />
            <Stat value="12" label="Questów" />
            <div className="w-px h-8 bg-surface-border" />
            <Stat value="200+" label="Miejsc" />
          </div>

          {/* CTA Buttons */}
          <div className="w-full max-w-sm space-y-3">
            <Link
              href="/map"
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold text-white text-base transition-all duration-200 active:scale-95 shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 50%, #4ade80 100%)',
                boxShadow: '0 8px 32px rgba(34,197,94,0.35)'
              }}
            >
              <Navigation className="w-5 h-5" />
              Zacznij odkrywać
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/login"
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-semibold text-slate-200 text-base transition-all duration-200 active:scale-95"
              style={{ background: 'rgba(34,38,58,0.8)', border: '1px solid rgba(45,49,72,0.8)' }}
            >
              Zaloguj się
            </Link>
            <p className="text-slate-500 text-sm text-center">
              Nie masz konta?{' '}
              <Link href="/auth/register" className="text-brand-400 font-semibold hover:text-brand-300">
                Zarejestruj się
              </Link>
            </p>
          </div>
        </div>

        {/* ── Feature Pills ── */}
        <div className="w-full max-w-sm mx-auto space-y-2.5 mb-8">
          <FeatureRow
            icon={<MapPin className="w-4 h-4" />}
            color="#22c55e"
            bg="rgba(34,197,94,0.12)"
            text="Odkrywaj punkty NGO i miejsca miejskie"
          />
          <FeatureRow
            icon={<Star className="w-4 h-4" />}
            color="#facc15"
            bg="rgba(250,204,21,0.10)"
            text="Zaliczaj questy i zdobywaj odznaki"
          />
          <FeatureRow
            icon={<Users className="w-4 h-4" />}
            color="#60a5fa"
            bg="rgba(96,165,250,0.10)"
            text="Poznaj organizacje służące miastu"
          />
          <FeatureRow
            icon={<Shield className="w-4 h-4" />}
            color="#a78bfa"
            bg="rgba(167,139,250,0.10)"
            text="Skanuj QR kody i zaliczaj lokalizacje"
          />
        </div>
      </main>

      {/* ── Featured Quests ── */}
      <section className="relative px-5 pb-10">
        <div className="flex items-center justify-between mb-4">
          <p className="section-label">Polecane questy</p>
          <Link href="/quests" className="text-brand-400 text-xs font-semibold">
            Zobacz wszystkie →
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5">
          <QuestCard
            title="Odkryj NGO Bielska"
            subtitle="8 etapów · ~2h"
            icon="🏢"
            gradient="linear-gradient(135deg, #14532d 0%, #166534 100%)"
            accent="#22c55e"
          />
          <QuestCard
            title="Szlak Historyczny"
            subtitle="6 etapów · ~1.5h"
            icon="🏛️"
            gradient="linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)"
            accent="#60a5fa"
          />
          <QuestCard
            title="Zielone Bielsko"
            subtitle="5 etapów · ~1h"
            icon="🌿"
            gradient="linear-gradient(135deg, #14532d 0%, #15803d 100%)"
            accent="#4ade80"
          />
          <QuestCard
            title="Kultura i Sztuka"
            subtitle="7 etapów · ~2h"
            icon="🎨"
            gradient="linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)"
            accent="#a78bfa"
          />
        </div>
      </section>
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

function FeatureRow({
  icon, color, bg, text,
}: {
  icon: React.ReactNode
  color: string
  bg: string
  text: string
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{ background: bg, border: `1px solid ${color}22` }}
    >
      <span style={{ color }}>{icon}</span>
      <span className="text-slate-300 text-sm font-medium">{text}</span>
    </div>
  )
}

function QuestCard({
  title, subtitle, icon, gradient, accent,
}: {
  title: string
  subtitle: string
  icon: string
  gradient: string
  accent: string
}) {
  return (
    <Link
      href="/quests"
      className="flex-shrink-0 w-44 rounded-2xl overflow-hidden transition-transform duration-200 active:scale-95"
      style={{ background: gradient, border: `1px solid ${accent}30` }}
    >
      <div className="p-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3"
          style={{ background: `${accent}20` }}
        >
          {icon}
        </div>
        <p className="text-white font-bold text-sm leading-tight mb-1">{title}</p>
        <p className="text-xs font-medium" style={{ color: accent }}>
          {subtitle}
        </p>
      </div>
    </Link>
  )
}
