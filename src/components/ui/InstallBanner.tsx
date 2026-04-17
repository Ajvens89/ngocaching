'use client'

import { useEffect, useState } from 'react'
import { X, Download, Share } from 'lucide-react'

type Platform = 'android' | 'ios' | null

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
    // Nie pokazuj jeśli już zainstalowane
    if (isInStandaloneMode()) return

    // Nie pokazuj jeśli użytkownik już zamknął banner
    const dismissed = sessionStorage.getItem('install_banner_dismissed')
    if (dismissed) return

    const plat = detectPlatform()
    setPlatform(plat)

    if (plat === 'android') {
      // Poczekaj na event beforeinstallprompt
      const handler = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setShow(true)
      }
      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    } else if (plat === 'ios') {
      // Na iOS pokaż instrukcję ręczną
      setTimeout(() => setShow(true), 3000)
    }
  }, [])

  function dismiss() {
    sessionStorage.setItem('install_banner_dismissed', '1')
    setShow(false)
  }

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setShow(false)
      setDeferredPrompt(null)
    }
  }

  if (!show) return null

  return (
    <div
      className="fixed left-4 right-4 z-[200] animate-slide-up"
      style={{
        bottom: 'calc(80px + env(safe-area-inset-bottom))',
      }}
    >
      <div
        className="p-4 rounded-2xl shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(20,83,45,0.97), rgba(26,37,53,0.97))',
          border: '1px solid rgba(34,197,94,0.3)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <button
          onClick={dismiss}
          className="absolute top-3 right-3"
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <X className="w-3.5 h-3.5 text-white/70" />
        </button>

        {platform === 'android' && (
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
              style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)' }}
            >
              🗺️
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-white font-bold text-sm">Zainstaluj MiejskiTrop</p>
              <p className="text-slate-400 text-xs mt-0.5">Dodaj do ekranu głównego</p>
            </div>
            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(34,197,94,0.35)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Download className="w-4 h-4" />
              Zainstaluj
            </button>
          </div>
        )}

        {platform === 'ios' && (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)' }}
              >
                🗺️
              </div>
              <div className="pr-6">
                <p className="text-white font-bold text-sm">Zainstaluj MiejskiTrop</p>
                <p className="text-slate-400 text-xs mt-0.5">Dodaj aplikację do ekranu głównego</p>
              </div>
            </div>
            <div
              className="p-3 rounded-xl space-y-2"
              style={{ background: 'rgba(0,0,0,0.25)' }}
            >
              <div className="flex items-center gap-2.5 text-slate-300 text-xs">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(59,130,246,0.3)' }}
                >
                  <Share className="w-3.5 h-3.5 text-blue-400" />
                </div>
                Kliknij ikonę <span className="font-bold text-white">Udostępnij</span> w Safari
              </div>
              <div className="flex items-center gap-2.5 text-slate-300 text-xs">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(34,197,94,0.2)' }}
                >
                  <span className="text-xs font-black text-brand-400">+</span>
                </div>
                Wybierz <span className="font-bold text-white">„Dodaj do ekranu głównego"</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
