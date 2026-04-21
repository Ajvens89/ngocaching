'use client'

/**
 * Zawsze widoczna sekcja „Zainstaluj aplikację" na home page.
 *
 * - Jeśli przeglądarka ma zbuforowany `beforeinstallprompt` — pokazujemy jeden
 *   duży przycisk, klik = natywny prompt Chrome.
 * - Na iOS (brak prompt-a) — pokazujemy dwa kroki: Udostępnij → Dodaj do ekranu głównego.
 * - Na Androidzie bez prompt-a (np. po wcześniejszym odrzuceniu) — instrukcja menu ⋮.
 * - Jeśli PWA już jest zainstalowana (display-mode: standalone) — nic nie renderujemy.
 */

import { useEffect, useState } from 'react'
import { Download, Share, MoreVertical, CheckCircle2, Smartphone } from 'lucide-react'

type Platform = 'android' | 'ios' | 'desktop'

function detect(): Platform {
  if (typeof window === 'undefined') return 'desktop'
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return 'desktop'
}

function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    (window.navigator as any).standalone === true
  )
}

export default function InstallSection() {
  const [platform, setPlatform] = useState<Platform>('desktop')
  const [ready, setReady] = useState(false)
  const [standalone, setStandalone] = useState(false)
  const [hasPrompt, setHasPrompt] = useState(false)
  const [busy, setBusy] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    setPlatform(detect())
    setStandalone(isStandalone())
    setHasPrompt(!!(window as any).__mtDeferredPrompt)
    setReady(true)

    const h = () => setHasPrompt(true)
    const installedH = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', h)
    window.addEventListener('appinstalled', installedH)
    return () => {
      window.removeEventListener('beforeinstallprompt', h)
      window.removeEventListener('appinstalled', installedH)
    }
  }, [])

  async function doInstall() {
    const p = (window as any).__mtDeferredPrompt
    if (!p) return
    setBusy(true)
    try {
      p.prompt()
      const { outcome } = await p.userChoice
      if (outcome === 'accepted') setInstalled(true)
    } finally {
      ;(window as any).__mtDeferredPrompt = null
      setHasPrompt(false)
      setBusy(false)
    }
  }

  if (!ready) return null
  if (standalone || installed) {
    return (
      <section aria-labelledby="install-heading"
        className="px-5 py-12 max-w-2xl mx-auto w-full border-t"
        style={{ borderColor: 'rgba(45,49,72,0.4)' }}>
        <div className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
          <CheckCircle2 className="w-6 h-6 text-brand-400 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-white font-bold text-sm">Aplikacja zainstalowana</p>
            <p className="text-slate-400 text-xs mt-0.5">
              MiejskiTrop działa jak natywna aplikacja. Ikona jest na ekranie głównym Twojego urządzenia.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="zainstaluj" aria-labelledby="install-heading"
      className="px-5 py-12 max-w-2xl mx-auto w-full border-t"
      style={{ borderColor: 'rgba(45,49,72,0.4)' }}>
      <p className="text-brand-500 text-sm font-bold uppercase tracking-widest mb-2">Instalacja</p>
      <h2 id="install-heading" className="font-display text-3xl font-black text-white mb-3 leading-tight">
        Zainstaluj jako aplikację
      </h2>
      <p className="text-slate-300 text-base leading-relaxed max-w-prose mb-6">
        Dodaj MiejskiTrop do ekranu głównego — uruchamia się błyskawicznie, działa offline,
        skanuje QR i pokazuje mapę tak jak aplikacja natywna. Bez Google Play, bez App Store.
      </p>

      {/* Android — auto prompt */}
      {platform === 'android' && hasPrompt && (
        <button
          onClick={doInstall}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold text-white text-base transition-all duration-200 active:scale-95 shadow-xl disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 50%, #4ade80 100%)',
            boxShadow: '0 8px 32px rgba(34,197,94,0.35)',
            minHeight: 56,
          }}
          aria-label="Zainstaluj aplikację MiejskiTrop"
        >
          <Download className="w-5 h-5" aria-hidden="true" />
          {busy ? 'Instalowanie…' : 'Zainstaluj aplikację'}
        </button>
      )}

      {/* Android — fallback */}
      {platform === 'android' && !hasPrompt && (
        <ol className="space-y-3" aria-label="Kroki instalacji na Androidzie">
          <li className="flex items-start gap-3 p-3 rounded-2xl"
            style={{ background: 'rgba(34,38,58,0.5)', border: '1px solid rgba(45,49,72,0.6)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(59,130,246,0.2)' }}>
              <MoreVertical className="w-5 h-5 text-blue-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">1. Otwórz menu przeglądarki</p>
              <p className="text-slate-400 text-xs mt-0.5">
                W Chrome — ikona ⋮ w prawym górnym rogu. W Samsung Internet — ☰ na dole.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3 p-3 rounded-2xl"
            style={{ background: 'rgba(34,38,58,0.5)', border: '1px solid rgba(45,49,72,0.6)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(34,197,94,0.2)' }}>
              <Download className="w-5 h-5 text-brand-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">2. Wybierz „Zainstaluj aplikację"</p>
              <p className="text-slate-400 text-xs mt-0.5">
                (lub „Dodaj do ekranu głównego" — zależnie od przeglądarki)
              </p>
            </div>
          </li>
        </ol>
      )}

      {/* iOS */}
      {platform === 'ios' && (
        <ol className="space-y-3" aria-label="Kroki instalacji na iOS">
          <li className="flex items-start gap-3 p-3 rounded-2xl"
            style={{ background: 'rgba(34,38,58,0.5)', border: '1px solid rgba(45,49,72,0.6)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(59,130,246,0.25)' }}>
              <Share className="w-5 h-5 text-blue-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">1. Otwórz w Safari i kliknij Udostępnij</p>
              <p className="text-slate-400 text-xs mt-0.5">
                Ikona strzałki w kwadracie — na dole ekranu (iPhone) lub u góry (iPad).
                MiejskiTrop działa najlepiej w Safari.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3 p-3 rounded-2xl"
            style={{ background: 'rgba(34,38,58,0.5)', border: '1px solid rgba(45,49,72,0.6)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(34,197,94,0.2)' }}>
              <span className="text-xl font-black text-brand-400">+</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">2. „Dodaj do ekranu głównego"</p>
              <p className="text-slate-400 text-xs mt-0.5">
                Przewiń w dół w menu Udostępnij i kliknij tę opcję. Potem „Dodaj" w prawym górnym rogu.
              </p>
            </div>
          </li>
        </ol>
      )}

      {/* Desktop — opcjonalny prompt jeśli Chrome */}
      {platform === 'desktop' && hasPrompt && (
        <button
          onClick={doInstall}
          disabled={busy}
          className="inline-flex items-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-white transition-all active:scale-95 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', boxShadow: '0 4px 20px rgba(34,197,94,0.3)' }}
          aria-label="Zainstaluj aplikację MiejskiTrop na komputer"
        >
          <Download className="w-5 h-5" aria-hidden="true" />
          {busy ? 'Instalowanie…' : 'Zainstaluj na komputer'}
        </button>
      )}
      {platform === 'desktop' && !hasPrompt && (
        <div className="flex items-start gap-3 p-3 rounded-2xl"
          style={{ background: 'rgba(34,38,58,0.5)', border: '1px solid rgba(45,49,72,0.6)' }}>
          <Smartphone className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-white font-semibold text-sm">Najlepiej na telefonie</p>
            <p className="text-slate-400 text-xs mt-0.5">
              Otwórz tę stronę w Chrome na Androidzie lub Safari na iPhonie — pojawi się opcja
              instalacji jako aplikacja.
            </p>
          </div>
        </div>
      )}

      <p className="text-slate-500 text-xs mt-4">
        ⚡ Po instalacji działa bez internetu (pliki statyczne i ostatnio oglądane miejsca).
      </p>
    </section>
  )
}
