'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MapPin, X, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

type PermState = 'unknown' | 'prompt' | 'granted' | 'denied' | 'requesting' | 'error'

const DISMISSED_KEY = 'mt_loc_prompt_dismissed'

// Nie pokazuj na tych ścieżkach — tam już jest InstallBanner albo
// dedykowany UI z lokalizacją (np. CheckinSection na /place).
const HIDE_ON_PATHS = ['/scan']

async function readPermission(): Promise<PermState> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return 'error'
  // Permissions API nie jest dostępne w Safari <16.4. Wtedy zwróć 'unknown'.
  if (!('permissions' in navigator)) return 'unknown'
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status = await (navigator.permissions as any).query({ name: 'geolocation' })
    if (status.state === 'granted')  return 'granted'
    if (status.state === 'denied')   return 'denied'
    return 'prompt'
  } catch {
    return 'unknown'
  }
}

export default function LocationPermissionOverlay() {
  const pathname = usePathname()
  const [perm, setPerm] = useState<PermState>('unknown')
  const [dismissed, setDismissed] = useState(false)
  const checked = useRef(false)

  const hidden = HIDE_ON_PATHS.some(p => pathname?.startsWith(p))

  useEffect(() => {
    if (checked.current) return
    checked.current = true
    try {
      if (localStorage.getItem(DISMISSED_KEY)) setDismissed(true)
    } catch { /* private mode */ }

    let cancelled = false
    readPermission().then(state => { if (!cancelled) setPerm(state) })

    // Jeśli Permissions API jest dostępne, subskrybujemy zmiany statusu
    // aby ukryć nakładkę od razu po przyznaniu zgody (bez reloadu).
    let cleanup: (() => void) | null = null
    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (navigator.permissions as any).query({ name: 'geolocation' }).then((status: any) => {
          const onChange = () => {
            if (status.state === 'granted') setPerm('granted')
            else if (status.state === 'denied') setPerm('denied')
            else setPerm('prompt')
          }
          status.addEventListener('change', onChange)
          cleanup = () => status.removeEventListener('change', onChange)
        }).catch(() => { /* ignore */ })
      } catch { /* ignore */ }
    }

    return () => {
      cancelled = true
      if (cleanup) cleanup()
    }
  }, [])

  function dismiss() {
    try { localStorage.setItem(DISMISSED_KEY, '1') } catch {}
    setDismissed(true)
  }

  function requestPermission() {
    if (!navigator.geolocation) {
      setPerm('error')
      return
    }
    setPerm('requesting')
    navigator.geolocation.getCurrentPosition(
      () => {
        setPerm('granted')
        // Automatycznie znikamy — user zobaczył zielony check przez moment
        setTimeout(() => dismiss(), 1500)
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED)       setPerm('denied')
        else if (err.code === err.POSITION_UNAVAILABLE) setPerm('error')
        else if (err.code === err.TIMEOUT)              setPerm('prompt')
        else                                            setPerm('error')
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    )
  }

  // Nie renderuj nic gdy:
  // — na ukrytej ścieżce
  // — uprawnienie już przyznane (albo po granted po secundzie auto-dismissuje się)
  // — user sam zamknął nakładkę (i uprawnienie nie jest 'denied')
  // — permissions API w ogóle nie załadowało jeszcze stanu
  if (hidden) return null
  if (perm === 'granted') return null
  if (perm === 'unknown') return null
  if (dismissed && perm !== 'denied') return null

  // UI treści zależne od stanu
  const isRequesting = perm === 'requesting'
  const isDenied     = perm === 'denied'

  return (
    <div
      role="dialog"
      aria-label="Włącz lokalizację"
      className="fixed left-4 right-4 z-[180] animate-slide-up"
      style={{ bottom: 'calc(150px + env(safe-area-inset-bottom))' }}
    >
      <div
        className="p-4 rounded-2xl shadow-2xl relative"
        style={{
          background: 'linear-gradient(135deg, rgba(22,30,48,0.97), rgba(26,37,53,0.97))',
          border: '1px solid rgba(59,130,246,0.35)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Zamknij (tylko jeśli nie jest denied — denied wymaga akcji) */}
        {!isDenied && (
          <button
            onClick={dismiss}
            aria-label="Zamknij"
            className="absolute top-2 right-2 w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
            style={{ background: 'rgba(0,0,0,0.25)', border: 'none', cursor: 'pointer' }}
          >
            <X className="w-4 h-4 text-white/70" aria-hidden="true" />
          </button>
        )}

        <div className="pr-8">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: isDenied
                  ? 'rgba(239,68,68,0.15)'
                  : 'rgba(59,130,246,0.15)',
                border: isDenied
                  ? '1px solid rgba(239,68,68,0.35)'
                  : '1px solid rgba(59,130,246,0.35)',
              }}
              aria-hidden="true"
            >
              {isDenied
                ? <AlertTriangle className="w-6 h-6 text-red-300" />
                : <MapPin className="w-6 h-6 text-blue-300" />
              }
            </div>
            <div className="flex-1 min-w-0">
              {isDenied ? (
                <>
                  <p className="text-white font-bold text-sm">Lokalizacja zablokowana</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Włącz ją w ustawieniach strony
                  </p>
                </>
              ) : (
                <>
                  <p className="text-white font-bold text-sm">Włącz lokalizację</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Potrzebna do zaliczania punktów i pokazywania mapy
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Instrukcja przy denied */}
          {isDenied && (
            <div
              className="p-3 rounded-xl mb-3"
              style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(45,49,72,0.6)' }}
            >
              <p className="text-slate-300 text-xs leading-relaxed">
                <strong className="text-white">Android (Chrome):</strong> kłódka 🔒 przy adresie →
                <em> Uprawnienia</em> → <em>Lokalizacja</em> → <em>Zezwól</em>.
              </p>
              <p className="text-slate-300 text-xs leading-relaxed mt-1.5">
                <strong className="text-white">iOS (Safari):</strong> Ustawienia → Safari →
                <em> Lokalizacja</em> → <em>Zezwól</em>. Lub: <em>aA</em> w pasku adresu →
                <em> Ustawienia witryny</em>.
              </p>
              <p className="text-slate-400 text-xs mt-2">
                Po zmianie — odśwież stronę (przeciągnij w dół).
              </p>
            </div>
          )}

          {/* Przycisk akcji (tylko gdy prompt/requesting) */}
          {!isDenied && (
            <button
              onClick={requestPermission}
              disabled={isRequesting}
              aria-label="Zezwól na dostęp do lokalizacji"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-70"
              style={{
                background: isRequesting
                  ? 'rgba(59,130,246,0.25)'
                  : 'linear-gradient(135deg, #2563eb, #3b82f6)',
                color: 'white',
                boxShadow: isRequesting ? 'none' : '0 4px 12px rgba(59,130,246,0.35)',
                border: 'none',
                cursor: isRequesting ? 'wait' : 'pointer',
                minHeight: 44,
              }}
            >
              {isRequesting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Czekam na zgodę…</>
                : <><MapPin className="w-4 h-4" /> Zezwól na lokalizację</>}
            </button>
          )}

          {/* Informacja o nie-śledzeniu */}
          {!isDenied && (
            <p className="text-slate-500 text-[11px] leading-relaxed mt-2.5 text-center">
              <CheckCircle2 className="w-3 h-3 inline -mt-0.5 mr-1 text-brand-400" />
              Pozycja używana tylko lokalnie — nie zapisujemy, gdzie byłeś.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
