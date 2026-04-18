'use client'

import { useState, useEffect } from 'react'
import { MapPin, QrCode, KeyRound, MessageSquare, CheckCircle2, Lock, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Place, VerificationType } from '@/lib/types'
import { getDistance } from '@/lib/geo'
import { cn } from '@/lib/utils'
import { getAppClient } from '@/lib/data-client'

interface CheckinSectionProps {
  place: Place
}

type CheckinState = 'idle' | 'loading' | 'success' | 'error'

export default function CheckinSection({ place }: CheckinSectionProps) {
  const [state, setState]             = useState<CheckinState>('idle')
  const [userPos, setUserPos]         = useState<GeolocationCoordinates | null>(null)
  const [distance, setDistance]       = useState<number | null>(null)
  const [inputValue, setInputValue]   = useState('')
  const [errorMsg, setErrorMsg]       = useState('')
  const [pointsEarned, setPointsEarned] = useState(0)
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [unlocked, setUnlocked]       = useState<string | null>(null)
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
      }
    }
    checkStatus()
  }, [place.id, place.unlockable_content, dataClient])

  // Pobierz GPS dla weryfikacji GPS
  useEffect(() => {
    if (place.verification_type !== 'gps') return
    navigator.geolocation?.getCurrentPosition((pos) => {
      setUserPos(pos.coords)
      setDistance(getDistance(pos.coords.latitude, pos.coords.longitude, place.latitude, place.longitude))
    })
  }, [place])

  // Wywołaj API route — walidacja po stronie serwera (hasło/odpowiedź NIE trafia do klienta)
  async function handleCheckin(method: VerificationType) {
    setState('loading')
    setErrorMsg('')

    const body: Record<string, unknown> = {
      place_id: place.id,
      method,
      latitude:  userPos?.latitude  ?? null,
      longitude: userPos?.longitude ?? null,
    }
    if (method === 'password') body.password = inputValue.trim()
    if (method === 'answer')   body.answer   = inputValue.trim()

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const json = await res.json()

      if (!res.ok) {
        setErrorMsg(json.error || 'Błąd weryfikacji')
        setState('error')
        return
      }

      setPointsEarned(json.points_earned ?? 0)
      setIsCheckedIn(true)
      if (place.unlockable_content) setUnlocked(place.unlockable_content)
      setState('success')
    } catch {
      setErrorMsg('Błąd połączenia. Sprawdź internet i spróbuj ponownie.')
      setState('error')
    }
  }

  // ── Stan: zaliczony ────────────────────────────────────────────
  if (state === 'success' || isCheckedIn) {
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
          <h3 className="text-white font-black text-lg">Punkt zaliczony! 🎉</h3>
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
          {inRange ? (
            <button
              onClick={() => handleCheckin('gps')}
              disabled={state === 'loading'}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {state === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
              Jestem tutaj — Zalicz!
            </button>
          ) : (
            <p className="text-slate-400 text-sm text-center py-1">
              {distance !== null
                ? `Za daleko. Zbliż się na ${place.gps_radius || 50} m od punktu.`
                : 'Pobieranie lokalizacji...'}
            </p>
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
