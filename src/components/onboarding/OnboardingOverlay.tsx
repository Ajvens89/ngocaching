'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, QrCode, Trophy, Users, ArrowDown, ArrowRight, X } from 'lucide-react'

const STORAGE_KEY = 'mt_onboarded_v1'

// ─── Hook: IntersectionObserver dla animacji scroll ───────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return { ref, visible }
}

// ─── Sekcja z animacją wejścia ────────────────────────────────────────────────
function RevealSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useReveal()
  return (
    <div
      ref={ref}
      style={{
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
      }}
    >
      {children}
    </div>
  )
}

// ─── Krok "jak to działa" ────────────────────────────────────────────────────
function Step({ num, icon, title, desc }: { num: number; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
        style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold tracking-widest uppercase text-green-500 mb-0.5">Krok {num}</p>
        <p className="text-white font-bold text-base leading-snug">{title}</p>
        <p className="text-slate-400 text-sm mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

// ─── Karta NGO demo ───────────────────────────────────────────────────────────
function NGOCard({ emoji, name, desc, color }: { emoji: string; name: string; desc: string; color: string }) {
  return (
    <div className="flex-shrink-0 w-48 rounded-2xl p-4"
      style={{ background: 'rgba(26,29,39,0.9)', border: `1px solid ${color}30` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
        style={{ background: `${color}18` }}>
        {emoji}
      </div>
      <p className="text-white font-bold text-sm leading-tight mb-1">{name}</p>
      <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
    </div>
  )
}

// ─── Główny komponent ─────────────────────────────────────────────────────────
export default function OnboardingOverlay() {
  const router = useRouter()
  const [show, setShow] = useState(false)
  const [hiding, setHiding] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Sprawdź localStorage po zamontowaniu (SSR safe)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!localStorage.getItem(STORAGE_KEY)) {
      setShow(true)
    }
  }, [])

  function dismiss(path: string) {
    localStorage.setItem(STORAGE_KEY, '1')
    setHiding(true)
    setTimeout(() => {
      setShow(false)
      router.push(path)
    }, 350)
  }

  function skip() {
    localStorage.setItem(STORAGE_KEY, '1')
    setHiding(true)
    setTimeout(() => setShow(false), 350)
  }

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: '#0f1117',
        transition: 'opacity 0.35s ease',
        opacity: hiding ? 0 : 1,
        pointerEvents: hiding ? 'none' : 'auto',
      }}
    >
      {/* Blobs w tle — subtelne */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-32 w-80 h-80 rounded-full opacity-[0.12]"
          style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 -right-40 w-72 h-72 rounded-full opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} />
        <div className="absolute -bottom-20 left-1/3 w-64 h-64 rounded-full opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)' }} />
      </div>

      {/* Przycisk pomiń */}
      <button
        onClick={skip}
        className="absolute top-5 right-5 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
        style={{ background: 'rgba(45,49,72,0.6)', border: '1px solid rgba(45,49,72,0.8)' }}
        aria-label="Pomiń onboarding"
      >
        <X className="w-4 h-4 text-slate-400" />
      </button>

      {/* Przewijalna treść */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">

        {/* ─── Sekcja 1: Hero ─────────────────────────────────── */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative">
          {/* Logo */}
          <div className="relative mb-8">
            <div
              className="w-28 h-28 rounded-[2rem] flex items-center justify-center text-6xl"
              style={{
                background: 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)',
                boxShadow: '0 0 60px rgba(34,197,94,0.35)',
              }}
            >
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
          <p className="text-slate-300 text-lg font-medium mb-2 max-w-xs">
            Odkrywaj Bielsko-Białą jak nigdy dotąd
          </p>
          <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
            Poznaj organizacje, które służą miastu. Zaliczaj miejsca, zdobywaj odznaki, kończ questy.
          </p>

          {/* Scroll hint */}
          <div className="absolute bottom-10 flex flex-col items-center gap-2 animate-bounce">
            <p className="text-slate-600 text-xs uppercase tracking-widest font-semibold">Przewiń</p>
            <ArrowDown className="w-4 h-4 text-slate-600" />
          </div>
        </section>

        {/* ─── Sekcja 2: Jak to działa ─────────────────────────── */}
        <section className="min-h-screen flex flex-col justify-center px-6 py-16">
          <RevealSection>
            <p className="text-xs font-bold tracking-widest uppercase text-green-500 mb-2">Jak to działa</p>
            <h2 className="font-display text-3xl font-black text-white mb-8 leading-tight">
              Twój pierwszy quest<br />w 60 sekund
            </h2>
          </RevealSection>

          <div className="space-y-7">
            <RevealSection delay={100}>
              <Step
                num={1}
                icon={<MapPin className="w-5 h-5 text-green-400" />}
                title="Znajdź miejsce na mapie"
                desc="Otwórz mapę i wybierz jeden z punktów w pobliżu — siedzibę NGO, park, zabytek lub muzeum."
              />
            </RevealSection>

            <RevealSection delay={200}>
              <div className="ml-16 w-px h-6 bg-surface-border" />
            </RevealSection>

            <RevealSection delay={200}>
              <Step
                num={2}
                icon={<QrCode className="w-5 h-5 text-blue-400" />}
                title="Zaleź je i zeskanuj kod QR"
                desc="Przy każdym punkcie znajduje się kod QR. Zeskanuj go aplikacją i zalicz wizytę."
              />
            </RevealSection>

            <RevealSection delay={300}>
              <div className="ml-16 w-px h-6 bg-surface-border" />
            </RevealSection>

            <RevealSection delay={300}>
              <Step
                num={3}
                icon={<Trophy className="w-5 h-5 text-yellow-400" />}
                title="Zdobywaj punkty i odznaki"
                desc="Każde zaliczenie daje punkty. Ukończ quest — odbierz odznakę i przejdź na wyższy poziom."
              />
            </RevealSection>
          </div>

          {/* Mini diagram */}
          <RevealSection delay={400}>
            <div className="mt-10 flex items-center gap-2 overflow-x-auto pb-2 -mx-6 px-6">
              {[
                { label: 'Mapa', emoji: '🗺️', color: '#22c55e' },
                { label: 'Skanuj', emoji: '📱', color: '#3b82f6' },
                { label: 'Punkty', emoji: '⭐', color: '#facc15' },
                { label: 'Odznaka', emoji: '🏅', color: '#a855f7' },
              ].map((step, i, arr) => (
                <div key={step.label} className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ background: `${step.color}15`, border: `1px solid ${step.color}30` }}>
                      {step.emoji}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{step.label}</p>
                  </div>
                  {i < arr.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-slate-700 flex-shrink-0 mb-4" />
                  )}
                </div>
              ))}
            </div>
          </RevealSection>
        </section>

        {/* ─── Sekcja 3: Organizacje NGO ────────────────────────── */}
        <section className="min-h-screen flex flex-col justify-center py-16 overflow-hidden">
          <div className="px-6 mb-8">
            <RevealSection>
              <p className="text-xs font-bold tracking-widest uppercase text-blue-400 mb-2">Odkrywaj lokalne NGO</p>
              <h2 className="font-display text-3xl font-black text-white leading-tight mb-3">
                Poznaj organizacje,<br />które tworzą miasto
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Bielsko-Biała ma dziesiątki organizacji pozarządowych — od pomocy społecznej po ekologię i kulturę. MiejskiTrop pomaga je odkryć.
              </p>
            </RevealSection>
          </div>

          {/* Karty NGO — przewijalne w poziomie */}
          <RevealSection delay={100}>
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-0 px-6 scrollbar-hide">
              <NGOCard emoji="🤝" name="Pomoc społeczna" desc="Wsparcie dla potrzebujących, seniorów i rodzin w kryzysie." color="#22c55e" />
              <NGOCard emoji="🌿" name="Ekologia" desc="Ochrona terenów zielonych i edukacja środowiskowa." color="#10b981" />
              <NGOCard emoji="🎭" name="Kultura i sztuka" desc="Lokalne teatry, galerie i inicjatywy artystyczne." color="#a855f7" />
              <NGOCard emoji="👦" name="Dzieci i młodzież" desc="Programy edukacyjne i sportowe dla młodych." color="#f97316" />
            </div>
          </RevealSection>

          <div className="px-6 mt-8">
            <RevealSection delay={200}>
              <div className="flex items-center gap-3 p-4 rounded-2xl"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <Users className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-slate-300 text-sm leading-snug">
                  Każde miejsce, które odwiedzasz, to realna historia ludzi służących Bielsku-Białej.
                </p>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* ─── Sekcja 4: CTA ───────────────────────────────────── */}
        <section className="min-h-screen flex flex-col justify-center px-6 py-16">
          <RevealSection>
            <div className="text-center mb-10">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6"
                style={{
                  background: 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)',
                  boxShadow: '0 0 40px rgba(34,197,94,0.3)',
                }}
              >
                🏆
              </div>
              <h2 className="font-display text-3xl font-black text-white mb-3">
                Gotowy na pierwszy trop?
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
                Dołącz do odkrywców Bielska-Białej. Konto jest darmowe — zbierasz punkty od pierwszego skanowania.
              </p>
            </div>
          </RevealSection>

          <RevealSection delay={100}>
            <div className="space-y-3 max-w-sm mx-auto w-full">
              <button
                onClick={() => dismiss('/auth/register')}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold text-white text-base transition-all duration-200 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 50%, #4ade80 100%)',
                  boxShadow: '0 8px 32px rgba(34,197,94,0.35)',
                }}
              >
                Utwórz darmowe konto
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => dismiss('/auth/login')}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-semibold text-slate-200 text-base transition-all duration-200 active:scale-95"
                style={{ background: 'rgba(34,38,58,0.8)', border: '1px solid rgba(45,49,72,0.8)' }}
              >
                Mam już konto — zaloguj
              </button>

              <button
                onClick={() => dismiss('/map')}
                className="w-full py-3 text-slate-500 text-sm font-medium hover:text-slate-400 transition-colors"
              >
                Przeglądaj bez konta →
              </button>
            </div>
          </RevealSection>

          {/* Social proof — statyczne */}
          <RevealSection delay={200}>
            <div className="mt-10 flex justify-center gap-6">
              {[
                { value: '30+', label: 'Miejsc' },
                { value: '5', label: 'Questów' },
                { value: '12', label: 'NGO' },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="text-white font-black text-xl leading-none">{value}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </RevealSection>

          {/* Padding na dole żeby ostatnia sekcja nie znikała pod klawiaturą */}
          <div className="h-16" />
        </section>
      </div>

      {/* Sticky pasek na dole — skrót do CTA bez scrollowania */}
      <div
        className="flex-shrink-0 px-5 py-3 flex gap-2 items-center"
        style={{ borderTop: '1px solid rgba(45,49,72,0.5)', background: 'rgba(15,17,23,0.95)', backdropFilter: 'blur(16px)' }}
      >
        <button
          onClick={() => dismiss('/auth/register')}
          className="flex-1 py-3 rounded-2xl font-bold text-white text-sm transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}
        >
          Zacznij odkrywać
        </button>
        <button
          onClick={() => dismiss('/map')}
          className="py-3 px-4 rounded-2xl font-semibold text-slate-400 text-sm transition-all active:scale-95"
          style={{ background: 'rgba(26,29,39,0.9)', border: '1px solid rgba(45,49,72,0.8)' }}
        >
          Mapa
        </button>
      </div>
    </div>
  )
}
