'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, QrCode, KeyRound, MessageSquare, CheckCircle2, Lock, Loader2, RefreshCw, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Place, VerificationType } from '@/lib/types'
import { getDistance } from '@/lib/geo'
import { cn } from '@/lib/utils'
import { getAppClient } from '@/lib/data-client'

interface CheckinSectionProps {
  place: Place
}

type CheckinState = 'idle' | 'loading' | 'success' | 'error' | 'already'
type GpsState = 'idle' | 'requesting' | 'ok' | 'denied' | 'unavailable' | 'timeout' | 'insecure'

export default function CheckinSection({ place }: CheckinSectionProps) {
  const [state, setState]             = useState<CheckinState>('idle')
  const [userPos, setUserPos]         = useState<GeolocationCoordinates | null>(null)
  const [distance, setDistance]       = useState<number | null>(null)
  const [inputValue, setInputValue]   = useState('')
  const [errorMsg, setErrorMsg]       = useState('')
  const [pointsEarned, setPointsEarned] = useState(0)
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [unlocked, setUnlocked]       = useState<string | null>(null)
  const [gpsState, setGpsState]       = useState<GpsState>('idle')
  // Double-submit guard — useRef so value is stable across renders
  const submittingRef = useRef(false)
  const dataClient = getAppClient()

  // Sprawdź czy punkt już zaliczony
  useEffect(() => {
    async function checkStatus() {
      const { data: { user } } = await dataClient.auth.getUser()
      if (!user) return
      const { data } = await dataClient
        .from('checkins')
        .select('id, points_earned')
        .eq('user_id', user.id)
        .eq('place_id', place.id)
        .maybeSingle()
      if (data) {
        setIsCheckedIn(true)
        setPointsEarned(data.points_earned)
        // Odblokowana treść widoczna po zaliczeniu
        if (place.unlockable_content) setUnlocked(place.unlockable_content)
        setState('already')
      }
    }
    checkStatus()
  }, [place.id, place.unlockable_content, dataClient])

  // Obsługa GPS z pełnym stanem i timeoutem
  const requestGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsState('unavailable')
      return
    }
    // Geolocation wymaga HTTPS (z wyjątkiem localhost)
    if (typeof window !== 'undefined'
      && !window.isSecureContext
      && window.location.hostname !== 'localhost') {
      setGpsState('insecure')
      return
    }
    setGpsState('requesting')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos(pos.coords)
        setDistance(getDistance(
          pos.coords.latitude, pos.coords.longitude,
          place.latitude, place.longitude,
        ))
        setGpsState('ok')
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED)       setGpsState('denied')
        else if (err.code === err.POSITION_UNAVAILABLE) setGpsState('unavailable')
        else if (err.code === err.TIMEOUT)              setGpsState('timeout')
        else                                            setGpsState('unavailable')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    )
  }, [place.latitude, place.longitude])

  useEffect(() => {
    if (place.verification_type !== 'gps') return
    requestGps()
  }, [place.verification_type, requestGps])

  // Wywołaj API route — walidacja po stronie serwera (hasło/odpowiedź NIE trafia do klienta)
  async function handleCheckin(method: VerificationType) {
    // Double-submit guard
    if (submittingRef.current) return
    submittingRef.current = true

    setState('loading')
    setErrorMsg('')

    // For GPS: re-fetch position immediately before sending to avoid stale coords
    let currentLatitude: number | null = userPos?.latitude ?? null
    let currentLongitude: number | null = userPos?.longitude ?? null

    if (method === 'gps') {
      try {
        const freshPos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
        )
        currentLatitude = freshPos.coords.latitude
        currentLongitude = freshPos.coords.longitude
        setUserPos(freshPos.coords)
        setDistance(getDistance(freshPos.coords.latitude, freshPos.coords.longitude, place.latitude, place.longitude))
      } catch {
        // Fall back to previously cached position; server will reject if too far
      }
    }

    const body: Record<string, unknown> = {
      place_id: place.id,
      method,
      latitude:  currentLatitude,
      longitude: currentLongitude,
    }
    if (method === 'password') body.password = inputValue.trim()
    if (method === 'answer')   body.answer   = inputValue.trim()

    // 15-second timeout guard
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      // Guard: server might return HTML on 500 instead of JSON
      const isJson = res.headers.get('content-type')?.includes('application/json')
      if (!isJson) {
        setErrorMsg('Błąd serwera. Spróbuj ponownie za chwilę.')
        setState('error')
        submittingRef.current = false
        return
      }

      const json = await res.json()

      if (!res.ok) {
        setErrorMsg(json.error ?? 'Błąd weryfikacji')
        setState('error')
        submittingRef.current = false
        return
      }

      if (json.already_checked) {
        setPointsEarned(json.points_earned ?? 0)
        setIsCheckedIn(true)
        if (place.unlockable_content) setUnlocked(place.unlockable_content)
        setState('already')
        submittingRef.current = false
        return
      }

      setPointsEarned(json.points_earned ?? 0)
      setIsCheckedIn(true)
      // Prefer unlockable_content from API response (avoids re-fetch); fall back to prop
      if (json.unlockable_content) {
        setUnlocked(json.unlockable_content as string)
      } else if (place.unlockable_content) {
        setUnlocked(place.unlockable_content)
      }
      setState('success')
    } catch (err: unknown) {
      clearTimeout(timeoutId)
      const isAbort = err instanceof Error && err.name === 'AbortError'
      setErrorMsg(isAbort
        ? 'Przekroczono czas oczekiwania. Sprawdź połączenie i spróbuj ponownie.'
        : 'Błąd połączenia. Sprawdź internet i spróbuj ponownie.')
      setState('error')
    } finally {
      submittingRef.current = false
    }
  }

  // ── Stan: zaliczony ────────────────────────────────────────────
  const alreadyChecked = state === 'already' || (isCheckedIn && state !== 'success')
  if (state === 'success' || alreadyChecked) {
    return (
      <div className="space-y-4">
        <div
          className="p-5 rounded-2xl text-center space-y-3 animate-bounce-in"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto glow-green"
            style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.5)' }}>
            <CheckCircle2 className="w-8 h-8 text-brand-400" />
          </div>
          {alreadyChecked
            ? <h3 className="text-white font-black text-lg">Już zaliczone!</h3>
            : <h3 className="text-white font-black text-lg">Punkt zaliczony! 🎉</h3>
          }
          {pointsEarned > 0 && (
            <p className="font-black text-xl" style={{ color: '#4ade80' }}>+{pointsEarned} pkt</p>
          )}
        </div>

        {/* Odblokowana treść */}
        {unlocked && (
          <div className="p-4 rounded-2xl"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <p className="text-brand-400 text-xs uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5">
              🔓 Odblokowana treść
            </p>
            <p className="text-slate-200 text-sm leading-relaxed">{unlocked}</p>
          </div>
        )}

        <Link href="/profile" className="btn-secondary w-full block text-center text-sm">
          Zobacz swój profil →
        </Link>
      </div>
    )
  }

  // ── Formularz zaliczenia ───────────────────────────────────────
  const vType    = place.verification_type
  const inRange  = distance !== null && distance <= (place.gps_radius || 50)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold">Zalicz ten punkt</h3>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(45,49,72,0.8)', color: '#94a3b8' }}>
          {vType === 'gps'      && '📍 GPS'}
          {vType === 'qr'       && '📷 QR'}
          {vType === 'password' && '🔑 Hasło'}
          {vType === 'answer'   && '❓ Odpowiedź'}
        </span>
      </div>

      {/* Wskazówka */}
      {place.hint && (
        <div className="p-3 rounded-2xl" style={{ background: 'rgba(250,204,21,0.08)', borderLeft: '3px solid rgba(250,204,21,0.5)' }}>
          <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-1">Wskazówka</p>
          <p className="text-slate-300 text-sm">{place.hint}</p>
        </div>
      )}

      {/* Zadanie */}
      {place.task_content && (
        <div className="p-3 rounded-2xl" style={{ background: 'rgba(34,197,94,0.06)', borderLeft: '3px solid rgba(34,197,94,0.4)' }}>
          <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-1">Zadanie</p>
          <p className="text-slate-300 text-sm">{place.task_content}</p>
        </div>
      )}

      {/* GPS */}
      {vType === 'gps' && (
        <div className="p-4 rounded-2xl" style={{ background: 'rgba(26,29,39,1)', border: '1px solid rgba(45,49,72,0.8)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-400" />
              <span className="text-white text-sm font-semibold">Zalicz przez GPS</span>
            </div>
            {distance !== null && (
              <span className={cn('text-sm font-bold', inRange ? 'text-brand-400' : 'text-slate-400')}>
                {distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`}
              </span>
            )}
          </div>
          {/* Stan 1: OK i w zasięgu — przycisk zalicz */}
          {gpsState === 'ok' && inRange && (
            <button
              onClick={() => handleCheckin('gps')}
              disabled={state === 'loading'}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {state === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
              Jestem tutaj — Zalicz!
            </button>
          )}

          {/* Stan 2: OK ale za daleko */}
          {gpsState === 'ok' && !inRange && distance !== null && (
            <div className="space-y-2">
              <p className="text-slate-400 text-sm text-center py-1">
                Za daleko. Zbliż się na {place.gps_radius || 50} m od punktu.
              </p>
              <button
                onClick={requestGps}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs text-slate-300 transition-colors"
                style={{ background: 'rgba(45,49,72,0.4)', border: '1px solid rgba(45,49,72,0.8)' }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Odśwież lokalizację
              </button>
            </div>
          )}

          {/* Stan 3: trwa pobieranie */}
          {gpsState === 'requesting' && (
            <div className="flex items-center justify-center gap-2 py-3 text-slate-300 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
              Pobieranie lokalizacji…
            </div>
          )}

          {/* Stan 4: odmowa uprawnień */}
          {gpsState === 'denied' && (
            <div className="space-y-2">
              <div className="p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-300 text-sm font-semibold">Brak dostępu do lokalizacji</p>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                      Zezwól na lokalizację: kłódka obok paska adresu → Uprawnienia
                      → Lokalizacja → Zezwól. Następnie odśwież stronę.
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={requestGps}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm text-white font-semibold transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}
              >
                <RefreshCw className="w-4 h-4" />
                Spróbuj ponownie
              </button>
            </div>
          )}

          {/* Stan 5: timeout */}
          {gpsState === 'timeout' && (
            <div className="space-y-2">
              <p className="text-slate-400 text-sm text-center py-1">
                Nie udało się pobrać lokalizacji w rozsądnym czasie. Wyjdź na zewnątrz albo spróbuj ponownie.
              </p>
              <button
                onClick={requestGps}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm text-white font-semibold transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}
              >
                <RefreshCw className="w-4 h-4" />
                Spróbuj ponownie
              </button>
            </div>
          )}

          {/* Stan 6: GPS niedostępny (np. brak czujnika, offline) */}
          {gpsState === 'unavailable' && (
            <div className="space-y-2">
              <p className="text-slate-400 text-sm text-center py-1">
                Lokalizacja nieodstępna na tym urządzeniu. Włącz GPS w ustawieniach systemu.
              </p>
              <button
                onClick={requestGps}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs text-slate-300 transition-colors"
                style={{ background: 'rgba(45,49,72,0.4)', border: '1px solid rgba(45,49,72,0.8)' }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Spróbuj ponownie
              </button>
            </div>
          )}

          {/* Stan 7: niezabezpieczone połączenie (http://) */}
          {gpsState === 'insecure' && (
            <div className="p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <p className="text-red-300 text-sm font-semibold">Wymagane HTTPS</p>
              <p className="text-slate-400 text-xs mt-1">
                GPS działa tylko na stronach HTTPS. Użyj https://miejskitrop.pl
              </p>
            </div>
          )}
        </div>
      )}

      {/* QR */}
      {vType === 'qr' && (
        <Link href="/scan"
          className="flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-[0.98]"
          style={{ background: 'rgba(26,29,39,1)', border: '1px solid rgba(45,49,72,0.8)' }}>
          <QrCode className="w-5 h-5 text-brand-400 flex-shrink-0" />
          <div>
            <p className="text-white text-sm font-semibold">Skanuj kod QR</p>
            <p className="text-slate-400 text-xs">Znajdź kod QR przy punkcie i zeskanuj</p>
          </div>
        </Link>
      )}

      {/* Hasło / Odpowiedź — walidacja TYLKO SERVER-SIDE przez /api/checkin */}
      {(vType === 'password' || vType === 'answer') && (
        <div className="p-4 rounded-2xl space-y-3"
          style={{ background: 'rgba(26,29,39,1)', border: '1px solid rgba(45,49,72,0.8)' }}>
          <div className="flex items-center gap-2">
            {vType === 'password'
              ? <KeyRound className="w-4 h-4 text-brand-400" />
              : <MessageSquare className="w-4 h-4 text-brand-400" />}
            <span className="text-white text-sm font-semibold">
              {vType === 'password' ? 'Wpisz hasło' : 'Odpowiedz na pytanie'}
            </span>
          </div>
          <input
            type={vType === 'password' ? 'password' : 'text'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && inputValue.trim() && handleCheckin(vType)}
            placeholder={vType === 'password' ? 'Hasło...' : 'Twoja odpowiedź...'}
            className="w-full px-3 py-2.5 rounded-xl text-white text-sm placeholder-slate-600 outline-none"
            style={{ background: 'rgba(15,17,23,0.8)', border: '1px solid rgba(45,49,72,0.8)' }}
          />
          <button
            onClick={() => handleCheckin(vType)}
            disabled={state === 'loading' || !inputValue.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {state === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
            Sprawdź
          </button>
        </div>
      )}

      {/* Błąd */}
      {state === 'error' && errorMsg && (
        <div className="p-3 rounded-2xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <p className="text-red-400 text-sm">{errorMsg}</p>
        </div>
      )}

      {/* Podgląd odblokowanej treści (zamazany) */}
      {place.unlockable_content && !isCheckedIn && (
        <div className="p-4 rounded-2xl opacity-50"
          style={{ background: 'rgba(26,29,39,1)', border: '1px solid rgba(45,49,72,0.6)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-slate-500" />
            <p className="text-slate-400 text-sm font-semibold">Zalicz, aby odblokować treść</p>
          </div>
          {/* Zamazany podgląd - nie ujawniamy treści */}
          <div className="space-y-1.5">
            {[80, 60, 90, 40].map((w, i) => (
              <div key={i} className="h-2 rounded-full bg-surface-border" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
