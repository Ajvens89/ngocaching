'use client'

import { useEffect, useState } from 'react'
import { X, Download, Share } from 'lucide-react'

type Platform = 'android' | 'ios' | null

const DISMISSED_KEY = 'mt_install_dismissed'

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return null
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return null
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  )
}

export default function InstallBanner() {
  const [show, setShow] = useState(false)
  const [platform, setPlatform] = useState<Platform>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    if (isInStandaloneMode()) return
    // localStorage zamiast sessionStorage — pamiętaj między sesjami
    if (localStorage.getItem(DISMISSED_KEY)) return

    const plat = detectPlatform()
    setPlatform(plat)

    if (plat === 'android') {
      const handler = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setShow(true)
      }
      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    } else if (plat === 'ios') {
      // Pokaż po 4s, nie przeszkadzaj od razu
      const t = setTimeout(() => setShow(true), 4000)
      return () => clearTimeout(t)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setShow(false)
  }

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShow(false)
      localStorage.setItem(DISMISSED_KEY, '1')
    }
    setDeferredPrompt(null)
  }

  if (!show) return null

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
          className="touch-target absolute top-2 right-2 flex items-center justify-center rounded-xl transition-colors"
          style={{ background: 'rgba(0,0,0,0.25)', border: 'none', cursor: 'pointer' }}
        >
          <X className="w-3.5 h-3.5 text-white/70" aria-hidden="true" />
        </button>

        {/* Android */}
        {platform === 'android' && (
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
              className="touch-target flex items-center gap-1.5 px-4 rounded-xl font-bold text-sm flex-shrink-0 transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(34,197,94,0.35)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Zainstaluj
            </button>
          </div>
        )}

        {/* iOS */}
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
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(59,130,246,0.3)' }}
                  aria-hidden="true"
                >
                  <Share className="w-3.5 h-3.5 text-blue-400" />
                </div>
                Kliknij <strong className="text-white mx-0.5">Udostępnij</strong> w Safari
              </li>
              <li className="flex items-center gap-2.5 text-slate-300 text-xs">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(34,197,94,0.2)' }}
                  aria-hidden="true"
                >
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
