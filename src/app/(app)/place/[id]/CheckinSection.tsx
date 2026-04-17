'use client'

import { useState, useEffect } from 'react'
import { MapPin, QrCode, KeyRound, MessageSquare, CheckCircle2, Lock, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Place, VerificationType } from '@/lib/types'
import { getDistance } from '@/lib/geo'
import { cn } from '@/lib/utils'
import { getAppClient } from '@/lib/data-client'
import { POINTS_PER_ACTION } from '@/lib/constants'

interface CheckinSectionProps {
  place: Place
}

type CheckinState = 'idle' | 'loading' | 'success' | 'error'

export default function CheckinSection({ place }: CheckinSectionProps) {
  const [state, setState] = useState<CheckinState>('idle')
  const [userPos, setUserPos] = useState<GeolocationCoordinates | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [pointsEarned, setPointsEarned] = useState(0)
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const dataClient = getAppClient()

  useEffect(() => {
    async function checkStatus() {
      const { data: { user } } = await dataClient.auth.getUser()
      if (!user) return
      const { data } = await dataClient.from('checkins').select('id, points_earned').eq('user_id', user.id).eq('place_id', place.id).maybeSingle()
      if (data) {
        setIsCheckedIn(true)
        setPointsEarned(data.points_earned)
      }
    }
    checkStatus()
  }, [place.id, dataClient])

  useEffect(() => {
    if (place.verification_type !== 'gps') return
    navigator.geolocation?.getCurrentPosition((pos) => {
      setUserPos(pos.coords)
      const d = getDistance(pos.coords.latitude, pos.coords.longitude, place.latitude, place.longitude)
      setDistance(d)
    })
  }, [place])

  async function handleCheckin(method: VerificationType) {
    setState('loading')
    setErrorMsg('')

    const { data: { user } } = await dataClient.auth.getUser()
    if (!user) {
      setErrorMsg('Musisz być zalogowany, aby zaliczyć punkt.')
      setState('error')
      return
    }

    const { data: existing } = await dataClient.from('checkins').select('*').eq('user_id', user.id).eq('place_id', place.id).maybeSingle()
    if (existing) {
      setIsCheckedIn(true)
      setPointsEarned(existing.points_earned || 0)
      setState('success')
      return
    }

    if (method === 'gps') {
      if (!userPos) {
        setErrorMsg('Nie udało się pobrać lokalizacji.')
        setState('error')
        return
      }
      const currentDistance = getDistance(userPos.latitude, userPos.longitude, place.latitude, place.longitude)
      if (currentDistance > (place.gps_radius || 50)) {
        setErrorMsg(`Za daleko od punktu (${Math.round(currentDistance)} m).`)
        setState('error')
        return
      }
    }

    if (method === 'password') {
      const expected = ((place.verification_data as any)?.password || '').toLowerCase().trim()
      if (expected && inputValue.toLowerCase().trim() !== expected) {
        setErrorMsg('Błędne hasło.')
        setState('error')
        return
      }
    }

    if (method === 'answer') {
      const expected = ((place.verification_data as any)?.answer || '').toLowerCase().trim()
      if (expected && inputValue.toLowerCase().trim() !== expected) {
        setErrorMsg('Błędna odpowiedź.')
        setState('error')
        return
      }
    }

    const pointsMap: Record<VerificationType, number> = {
      gps: POINTS_PER_ACTION.gps_checkin,
      qr: POINTS_PER_ACTION.qr_checkin,
      password: POINTS_PER_ACTION.answer_checkin,
      answer: POINTS_PER_ACTION.answer_checkin,
    }
    const points = pointsMap[method] || 10

    await dataClient.from('checkins').insert({
      user_id: user.id,
      place_id: place.id,
      quest_step_id: null,
      verification_method: method,
      verified_at: new Date().toISOString(),
      points_earned: points,
      latitude_at_checkin: userPos?.latitude || null,
      longitude_at_checkin: userPos?.longitude || null,
      notes: null,
    })

    setPointsEarned(points)
    setIsCheckedIn(true)
    setState('success')
  }

  if (state === 'success' || isCheckedIn) {
    return (
      <div className="card p-5 text-center space-y-3 animate-bounce-in">
        <div className="w-16 h-16 rounded-full bg-brand-500/20 border-2 border-brand-500 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-brand-400" />
        </div>
        <h3 className="text-white font-bold text-lg">Punkt zaliczony!</h3>
        {pointsEarned > 0 && <p className="text-brand-400 font-semibold">+{pointsEarned} punktów</p>}
        {place.unlockable_content && (
          <div className="mt-4 p-4 bg-surface-elevated rounded-xl border border-brand-500/30 text-left">
            <p className="text-brand-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-1">🔓 Odblokowana treść</p>
            <p className="text-slate-300 text-sm leading-relaxed">{place.unlockable_content}</p>
          </div>
        )}
        <Link href="/profile" className="btn-secondary w-full block text-center text-sm mt-2">Zobacz swój profil</Link>
      </div>
    )
  }

  const vType = place.verification_type
  const inGpsRange = distance !== null && distance <= (place.gps_radius || 50)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Zalicz ten punkt</h3>
        <span className="category-badge text-slate-400">
          {vType === 'gps' && '📍 GPS'}
          {vType === 'qr' && '📷 QR'}
          {vType === 'password' && '🔑 Hasło'}
          {vType === 'answer' && '❓ Odpowiedź'}
        </span>
      </div>

      {place.hint && (
        <div className="card p-3 border-l-2 border-yellow-500/50">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Wskazówka</p>
          <p className="text-slate-300 text-sm">{place.hint}</p>
        </div>
      )}

      {place.task_content && (
        <div className="card p-3 border-l-2 border-brand-500/50">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Zadanie</p>
          <p className="text-slate-300 text-sm">{place.task_content}</p>
        </div>
      )}

      {vType === 'gps' && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-400" />
              <span className="text-white text-sm font-medium">Zalicz przez GPS</span>
            </div>
            {distance !== null && (
              <span className={cn('text-sm font-medium', inGpsRange ? 'text-brand-400' : 'text-slate-400')}>
                {distance < 1000 ? `${Math.round(distance)} m` : `${(distance/1000).toFixed(1)} km`}
              </span>
            )}
          </div>
          {inGpsRange ? (
            <button onClick={() => handleCheckin('gps')} disabled={state === 'loading'} className="btn-primary w-full flex items-center justify-center gap-2">
              {state === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
              Jestem tutaj — Zalicz!
            </button>
          ) : (
            <div className="text-center py-2">
              <p className="text-slate-400 text-sm">{distance !== null ? `Za daleko. Potrzebujesz być w ${place.gps_radius || 50} m od punktu.` : 'Pobieranie lokalizacji...'}</p>
            </div>
          )}
        </div>
      )}

      {vType === 'qr' && (
        <Link href="/scan" className="card p-4 flex items-center gap-3 hover:border-brand-500/50 transition-colors">
          <QrCode className="w-5 h-5 text-brand-400 flex-shrink-0" />
          <div>
            <p className="text-white text-sm font-medium">Skanuj kod QR</p>
            <p className="text-slate-400 text-xs">Znajdź kod QR przy punkcie</p>
          </div>
        </Link>
      )}

      {(vType === 'password' || vType === 'answer') && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2">
            {vType === 'password' ? <KeyRound className="w-4 h-4 text-brand-400" /> : <MessageSquare className="w-4 h-4 text-brand-400" />}
            <span className="text-white text-sm font-medium">{vType === 'password' ? 'Wpisz hasło' : 'Odpowiedz na pytanie'}</span>
          </div>
          <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder={vType === 'password' ? 'Hasło...' : 'Twoja odpowiedź...'} className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 outline-none focus:border-brand-500 transition-colors" />
          <button onClick={() => handleCheckin(vType)} disabled={state === 'loading' || !inputValue.trim()} className="btn-primary w-full flex items-center justify-center gap-2">
            {state === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
            Sprawdź
          </button>
        </div>
      )}

      {state === 'error' && errorMsg && <div className="card p-3 border border-red-500/30 bg-red-500/10"><p className="text-red-400 text-sm">{errorMsg}</p></div>}

      {place.unlockable_content && !isCheckedIn && (
        <div className="card p-4 opacity-60">
          <div className="flex items-center gap-2 mb-2"><Lock className="w-4 h-4 text-slate-500" /><p className="text-slate-400 text-sm">Odblokuj zaliczając punkt</p></div>
          <p className="text-slate-600 text-xs">Zalicz ten punkt, aby odblokować ukrytą treść.</p>
        </div>
      )}
    </div>
  )
}