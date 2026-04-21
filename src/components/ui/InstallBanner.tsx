'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { X, Download, Share, MoreVertical } from 'lucide-react'

type Platform = 'android' | 'ios' | 'desktop' | null

const DISMISSED_KEY = 'mt_install_dismissed'

// Banner by się nakładał na count pill, przycisk lokalizacji, przyciski skanera.
// Na home jest i tak widoczna sekcja InstallSection, więc to nic nie zabiera.
const HIDE_ON_PATHS = ['/map', '/scan']

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return null
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return 'desktop'
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    (window.navigator as any).standalone === true
  )
}

// Cache globalny — `beforeinstallprompt` czasem wypala ZANIM komponent się
// zamontuje. Przechwytujemy go w `_app`-level snippet (patrz useEffect poniżej).
declare global {
  interface Window {
    __mtDeferredPrompt?: any
  }
}

export default function InstallBanner() {
  const pathname = usePathname()
  const [show, setShow] = useState(false)
  const [platform, setPlatform] = useState<Platform>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showIosHint, setShowIosHint] = useState(false)

  // Ukryj na ekranach gdzie zasłaniałby UI
  const hidden = HIDE_ON_PATHS.some(p => pathname?.startsWith(p))
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true

    if (isInStandaloneMode()) return
    try {
      if (localStorage.getItem(DISMISSED_KEY)) return
    } catch {
      /* private mode — ignorujemy */
    }

    const plat = detectPlatform()
    setPlatform(plat)

    // Jeśli event już wypalił wcześniej, podnosimy go z window cache.
    if (window.__mtDeferredPrompt) {
      setDeferredPrompt(window.__mtDeferredPrompt)
      setShow(true)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      window.__mtDeferredPrompt = e
      setDeferredPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    const installedHandler = () => {
      setShow(false)
      try { localStorage.setItem(DISMISSED_KEY, '1') } catch {}
    }
    window.addEventListener('appinstalled', installedHandler)

    // Fallback: na Androidzie bez `beforeinstallprompt` (np. Samsung Internet,
    // albo Chrome który już raz odrzucił) — pokazujemy hint po 6 s z instrukcją.
    // Na iOS nie istnieje automatyczny prompt — zawsze pokazujemy hint.
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null
    if (plat === 'ios') {
      fallbackTimer = setTimeout(() => {
        setShowIosHint(true)
        setShow(true)
      }, 4000)
    } else if (plat === 'android') {
      fallbackTimer = setTimeout(() => {
        if (!window.__mtDeferredPrompt) {
          setShow(true) // pokazujemy „instrukcję manualną" dla Androida
        }
      }, 6000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
      if (fallbackTimer) clearTimeout(fallbackTimer)
    }
  }, [])

  function dismiss() {
    try { localStorage.setItem(DISMISSED_KEY, '1') } catch {}
    setShow(false)
  }

  async function handleInstall() {
    if (!deferredPrompt) return
    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShow(false)
        try { localStorage.setItem(DISMISSED_KEY, '1') } catch {}
      }
    } finally {
      window.__mtDeferredPrompt = undefined
      setDeferredPrompt(null)
    }
  }

  if (!show || hidden) return null

  return (
    <div
      role="banner"
      aria-label="Zainstaluj aplikację MiejskiTrop"
      className="fixed left-4 right-4 z-[200] animate-slide-up"
      style={{ bottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <div
        className="p-4 rounded-2xl shadow-2xl relative"
        style={{
          background: 'linear-gradient(135deg, rgba(20,83,45,0.97), rgba(26,37,53,0.97))',
          border: '1px solid rgba(34,197,94,0.3)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Zamknij */}
        <button
          onClick={dismiss}
          aria-label="Zamknij baner instalacji"
          className="absolute top-2 right-2 w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
          style={{ background: 'rgba(0,0,0,0.25)', border: 'none', cursor: 'pointer' }}
        >
          <X className="w-4 h-4 text-white/70" aria-hidden="true" />
        </button>

        {/* Android — automatyczny prompt dostępny */}
        {platform === 'android' && deferredPrompt && (
          <div className="flex items-center gap-3 pr-8">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
              style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)' }}
              aria-hidden="true"
            >
              🗺️
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">Zainstaluj MiejskiTrop</p>
              <p className="text-slate-400 text-xs mt-0.5">Dodaj do ekranu głównego — działa offline</p>
            </div>
            <button
              onClick={handleInstall}
              aria-label="Zainstaluj aplikację MiejskiTrop na urządzeniu"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm flex-shrink-0 transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(34,197,94,0.35)',
                border: 'none',
                cursor: 'pointer',
                minHeight: 44,
              }}
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Zainstaluj
            </button>
          </div>
        )}

        {/* Android — fallback manualny (bez beforeinstallprompt) */}
        {platform === 'android' && !deferredPrompt && (
          <div className="pr-8">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)' }}
                aria-hidden="true"
              >
                🗺️
              </div>
              <div>
                <p className="text-white font-bold text-sm">Zainstaluj MiejskiTrop</p>
                <p className="text-slate-400 text-xs mt-0.5">Jako aplikacja działa szybciej i offline</p>
              </div>
            </div>
            <ol className="space-y-2" aria-label="Kroki instalacji na Androidzie">
              <li className="flex items-center gap-2.5 text-slate-300 text-xs">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(59,130,246,0.25)' }}>
                  <MoreVertical className="w-3.5 h-3.5 text-blue-300" />
                </div>
                Otwórz menu przeglądarki (⋮ w prawym górnym rogu)
              </li>
              <li className="flex items-center gap-2.5 text-slate-300 text-xs">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(34,197,94,0.2)' }}>
                  <Download className="w-3.5 h-3.5 text-brand-400" />
                </div>
                Wybierz <strong className="text-white mx-0.5">„Zainstaluj aplikację"</strong> lub <strong className="text-white mx-0.5">„Dodaj do ekranu głównego"</strong>
              </li>
            </ol>
          </div>
        )}

        {/* iOS — zawsze manualny */}
        {platform === 'ios' && (
          <div className="pr-8">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)' }}
                aria-hidden="true"
              >
                🗺️
              </div>
              <div>
                <p className="text-white font-bold text-sm">Zainstaluj MiejskiTrop</p>
                <p className="text-slate-400 text-xs mt-0.5">Działa jak natywna aplikacja</p>
              </div>
            </div>
            <ol className="space-y-2" aria-label="Kroki instalacji na iOS">
              <li className="flex items-center gap-2.5 text-slate-300 text-xs">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(59,130,246,0.3)' }}>
                  <Share className="w-3.5 h-3.5 text-blue-400" />
                </div>
                Kliknij <strong className="text-white mx-0.5">Udostępnij</strong> w Safari
              </li>
              <li className="flex items-center gap-2.5 text-slate-300 text-xs">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(34,197,94,0.2)' }}>
                  <span className="text-sm font-black text-brand-400">+</span>
                </div>
                Wybierz <strong className="text-white mx-0.5">„Dodaj do ekranu głównego"</strong>
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
