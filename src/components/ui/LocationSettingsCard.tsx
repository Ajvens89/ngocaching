'use client'

import { useEffect, useState } from 'react'
import { MapPin, CheckCircle2, AlertTriangle, Loader2, HelpCircle } from 'lucide-react'

type PermState = 'unknown' | 'prompt' | 'granted' | 'denied' | 'requesting' | 'error'

const DISMISSED_KEY = 'mt_loc_prompt_dismissed'

async function readPermission(): Promise<PermState> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return 'error'
  if (!('permissions' in navigator)) return 'unknown'
  try {
    const status = await (navigator.permissions as any).query({ name: 'geolocation' })
    if (status.state === 'granted') return 'granted'
    if (status.state === 'denied')  return 'denied'
    return 'prompt'
  } catch {
    return 'unknown'
  }
}

export default function LocationSettingsCard() {
  const [perm, setPerm] = useState<PermState>('unknown')

  useEffect(() => {
    let cancelled = false
    readPermission().then(s => { if (!cancelled) setPerm(s) })

    let cleanup: (() => void) | null = null
    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      try {
            (navigator.permissions as any).query({ name: 'geolocation' }).then((status: any) => {
          const onChange = () => {
            if (status.state === 'granted') setPerm('granted')
            else if (status.state === 'denied') setPerm('denied')
            else setPerm('prompt')
          }
          status.addEventListener('change', onChange)
          cleanup = () => status.removeEventListener('change', onChange)
        }).catch(() => {})
      } catch {}
    }
    return () => {
      cancelled = true
      if (cleanup) cleanup()
    }
  }, [])

  function requestPermission() {
    if (!navigator.geolocation) {
      setPerm('error')
      return
    }
    // Wyczyść dismiss, żeby baner znowu się pojawił jeśli potrzeba
    try { localStorage.removeItem(DISMISSED_KEY) } catch {}

    setPerm('requesting')
    navigator.geolocation.getCurrentPosition(
      () => setPerm('granted'),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setPerm('denied')
        else if (err.code === err.POSITION_UNAVAILABLE) setPerm('error')
        else if (err.code === err.TIMEOUT) setPerm('prompt')
        else setPerm('error')
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    )
  }

  // Kolorystyka w zależności od stanu
  const theme = (() => {
    switch (perm) {
      case 'granted':
        return { label: 'Włączona', color: '#4ade80', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.35)', Icon: CheckCircle2 }
      case 'denied':
        return { label: 'Zablokowana', color: '#fca5a5', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', Icon: AlertTriangle }
      case 'requesting':
        return { label: 'Czekam na odpowiedź…', color: '#93c5fd', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', Icon: Loader2 }
      case 'error':
        return { label: 'Niedostępna', color: '#fca5a5', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', Icon: AlertTriangle }
      default:
        return { label: 'Nie włączona', color: '#fde68a', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', Icon: HelpCircle }
    }
  })()

  const { Icon } = theme

  return (
    <div
      className="p-5 rounded-2xl"
      style={{ background: 'rgba(26,29,39,1)', border: '1px solid rgba(45,49,72,0.8)' }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}
        >
          <MapPin className="w-5 h-5 text-brand-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-bold text-sm">Dostęp do lokalizacji</h2>
          <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
            Aplikacja używa lokalizacji do zaliczania punktów GPS i pokazywania
            pobliskich miejsc na mapie. Dane są używane lokalnie i nie są zapisywane.
          </p>
        </div>
      </div>

      {/* Stan aktualny */}
      <div
        className="flex items-center gap-2 p-3 rounded-xl mb-3"
        style={{ background: theme.bg, border: `1px solid ${theme.border}` }}
      >
        <Icon
          className={`w-4 h-4 flex-shrink-0 ${perm === 'requesting' ? 'animate-spin' : ''}`}
          style={{ color: theme.color }}
        />
        <span className="text-sm font-semibold" style={{ color: theme.color }}>
          Stan: {theme.label}
        </span>
      </div>

      {/* Akcja */}
      {perm === 'granted' ? (
        <p className="text-slate-500 text-xs text-center">
          Wszystko gotowe — możesz zaliczać punkty GPS.
        </p>
      ) : perm === 'denied' ? (
        <div
          className="p-3 rounded-xl text-xs text-slate-300 leading-relaxed space-y-1.5"
          style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(45,49,72,0.6)' }}
        >
          <p>
            <strong className="text-white">Android (Chrome):</strong> kłódka 🔒 przy pasku adresu →
            <em> Uprawnienia</em> → <em>Lokalizacja</em> → <em>Zezwól</em>. Następnie odśwież stronę.
          </p>
          <p>
            <strong className="text-white">iOS (Safari):</strong> <em>aA</em> w pasku adresu →
            <em> Ustawienia witryny</em> → <em>Lokalizacja</em> → <em>Zezwól</em>. Lub: Ustawienia iOS →
            Safari → Lokalizacja.
          </p>
          <p className="text-slate-500 pt-1">
            Po zmianie w ustawieniach systemu wróć tutaj i kliknij „Spróbuj ponownie".
          </p>
          <button
            onClick={requestPermission}
            className="w-full mt-2 py-2.5 px-3 rounded-xl text-sm text-white font-semibold transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}
          >
            Spróbuj ponownie
          </button>
        </div>
      ) : (
        <button
          onClick={requestPermission}
          disabled={perm === 'requesting'}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-white font-bold transition-all active:scale-95 disabled:opacity-70"
          style={{
            background: perm === 'requesting'
              ? 'rgba(59,130,246,0.25)'
              : 'linear-gradient(135deg, #16a34a, #22c55e)',
            boxShadow: perm === 'requesting' ? 'none' : '0 4px 12px rgba(34,197,94,0.35)',
            minHeight: 44,
          }}
        >
          {perm === 'requesting'
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Czekam na zgodę…</>
            : <><MapPin className="w-4 h-4" /> Zezwól na lokalizację</>}
        </button>
      )}
    </div>
  )
}
