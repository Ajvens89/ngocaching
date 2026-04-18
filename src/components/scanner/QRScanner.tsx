'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Html5Qrcode } from 'html5-qrcode'
import { CheckCircle2, XCircle, Loader2, QrCode, Camera, RefreshCw } from 'lucide-react'
import { getAppClient } from '@/lib/data-client'
import { POINTS_PER_ACTION } from '@/lib/constants'

type ScanState = 'starting' | 'scanning' | 'loading' | 'success' | 'error' | 'no_permission'

const SCANNER_ID = 'qr-camera-view'

export default function QRScanner() {
  const router = useRouter()
  const dataClient = getAppClient()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const startedRef = useRef(false)
  const [state, setState] = useState<ScanState>('starting')
  const [message, setMessage] = useState('')
  const [manualCode, setManualCode] = useState('')

  // Zatrzymaj skaner
  async function stopScanner() {
    if (!scannerRef.current) return
    try {
      const s = scannerRef.current.getState()
      if (s === 2 || s === 3) await scannerRef.current.stop()
    } catch { /* ignore */ }
  }

  // Uruchom skaner — wywołane dopiero po zamontowaniu diva
  async function startScanner() {
    if (startedRef.current) return
    startedRef.current = true

    // Upewnij się że div istnieje w DOM
    const el = document.getElementById(SCANNER_ID)
    if (!el) {
      startedRef.current = false
      return
    }

    const qr = new Html5Qrcode(SCANNER_ID)
    scannerRef.current = qr

    try {
      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 220 },          // brak aspectRatio — częste źródło błędów
        async (decoded: string) => {
          await stopScanner()
          await handleQRCode(decoded)
        },
        () => { /* nieudane klatki — ignoruj */ }
      )
      setState('scanning')
    } catch (err: any) {
      startedRef.current = false
      const msg = String(err)
      if (msg.includes('ermission') || msg.includes('NotAllowed')) {
        setState('no_permission')
      } else {
        setState('error')
        setMessage('Nie można uruchomić kamery. Zamknij inne aplikacje i spróbuj ponownie.')
      }
    }
  }

  useEffect(() => {
    // Krótkie opóźnienie żeby React zdążył wyrenderować div
    const t = setTimeout(() => startScanner(), 120)
    return () => {
      clearTimeout(t)
      stopScanner()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleQRCode(code: string) {
    setState('loading')
    setMessage('Weryfikacja kodu...')

    const { data: { user } } = await dataClient.auth.getUser()
    if (!user) {
      setState('error')
      setMessage('Musisz być zalogowany, aby zaliczyć punkt.')
      return
    }

    const { data: qrCode } = await dataClient
      .from('qr_codes').select('*').eq('code', code).eq('is_active', true).maybeSingle()

    if (!qrCode?.place_id) {
      setState('error')
      setMessage('Nierozpoznany kod QR. Spróbuj ponownie.')
      setTimeout(() => {
        startedRef.current = false
        setState('starting')
        setTimeout(() => startScanner(), 120)
      }, 2500)
      return
    }

    const { data: existing } = await dataClient
      .from('checkins').select('id').eq('user_id', user.id).eq('place_id', qrCode.place_id).maybeSingle()

    if (!existing) {
      await dataClient.from('checkins').insert({
        user_id: user.id,
        place_id: qrCode.place_id,
        verification_method: 'qr',
        points_earned: POINTS_PER_ACTION.qr_checkin,
        verified_at: new Date().toISOString(),
        notes: null, quest_step_id: null,
        latitude_at_checkin: null, longitude_at_checkin: null,
      })
      await dataClient.from('qr_codes').update({
        scan_count: (qrCode.scan_count || 0) + 1,
        is_active: !qrCode.is_single_use,
      }).eq('id', qrCode.id)
    }

    setState('success')
    setMessage(`+${POINTS_PER_ACTION.qr_checkin} punktów!`)
    setTimeout(() => router.push(`/place/${qrCode.place_id}`), 1800)
  }

  async function retry() {
    await stopScanner()
    startedRef.current = false
    setState('starting')
    setTimeout(() => startScanner(), 200)
  }

  async function handleManualSubmit() {
    if (!manualCode.trim()) return
    await stopScanner()
    await handleQRCode(manualCode.trim())
  }

  return (
    <div className="flex flex-col h-full bg-surface">

      {/* Nagłówek */}
      <div className="px-4 pt-6 pb-3 flex-shrink-0">
        <h1 className="font-display text-2xl font-black text-white">Skanuj kod QR</h1>
        <p className="text-slate-400 text-sm mt-0.5">Nakieruj kamerę na kod przy punkcie</p>
      </div>

      {/* Obszar kamery */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 pt-2 relative">
        {/*
          Kontener kamery ZAWSZE jest w DOM i ma stałe wymiary.
          html5-qrcode musi mieć element z niezerowymi wymiarami przy start().
          Stany (ładowanie/sukces/błąd) są nakładkami absolutnymi NA TYM kontenerze.
        */}
        <div
          className="relative w-full rounded-3xl overflow-hidden bg-black"
          style={{ maxWidth: 380, height: 340 }}
        >
          {/* Widok kamery — html5-qrcode wstrzykuje tu <video> */}
          <div
            id={SCANNER_ID}
            style={{ width: '100%', height: '100%' }}
          />

          {/* Celownik (widoczny tylko podczas skanowania) */}
          {state === 'scanning' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div style={{
                width: 200, height: 200,
                border: '2px solid rgba(74,222,128,0.85)',
                borderRadius: 16,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.38)',
              }}>
                {/* Narożniki */}
                {([
                  { top: -2, left: -2, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
                  { top: -2, right: -2, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
                  { bottom: -2, left: -2, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
                  { bottom: -2, right: -2, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
                ] as React.CSSProperties[]).map((s, i) => (
                  <span key={i} style={{
                    position: 'absolute', width: 24, height: 24,
                    borderColor: '#4ade80', borderStyle: 'solid', borderWidth: 0, ...s,
                  }} />
                ))}
              </div>
              <p className="absolute bottom-4 text-xs text-white/70">Ustaw kod QR w ramce</p>
            </div>
          )}

          {/* Nakładka: uruchamianie */}
          {state === 'starting' && (
            <div className="absolute inset-0 bg-surface-card flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />
              <p className="text-slate-400 text-sm">Uruchamianie kamery...</p>
            </div>
          )}

          {/* Nakładka: brak uprawnień */}
          {state === 'no_permission' && (
            <div className="absolute inset-0 bg-surface-card flex flex-col items-center justify-center gap-4 px-6 text-center">
              <Camera className="w-12 h-12 text-red-400" />
              <div>
                <p className="text-white font-bold mb-1">Brak dostępu do kamery</p>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Zezwól tej stronie na dostęp do kamery w ustawieniach przeglądarki, a następnie kliknij poniżej.
                </p>
              </div>
              <button onClick={retry} className="btn-primary flex items-center gap-2 text-sm py-2.5 px-5">
                <RefreshCw className="w-4 h-4" /> Spróbuj ponownie
              </button>
            </div>
          )}

          {/* Nakładka: weryfikacja */}
          {state === 'loading' && (
            <div className="absolute inset-0 bg-surface-card/95 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-12 h-12 text-brand-500 animate-spin" />
              <p className="text-slate-300 font-medium">{message}</p>
            </div>
          )}

          {/* Nakładka: sukces */}
          {state === 'success' && (
            <div className="absolute inset-0 bg-surface-card/95 flex flex-col items-center justify-center gap-3 animate-bounce-in">
              <div className="w-24 h-24 rounded-full flex items-center justify-center glow-green"
                style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.6)' }}>
                <CheckCircle2 className="w-12 h-12 text-brand-400" />
              </div>
              <p className="text-white font-black text-xl">Zaliczone! 🎉</p>
              <p className="text-brand-400 font-bold">{message}</p>
            </div>
          )}

          {/* Nakładka: błąd */}
          {state === 'error' && (
            <div className="absolute inset-0 bg-surface-card/95 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <XCircle className="w-12 h-12 text-red-400" />
              <p className="text-red-400 font-semibold text-sm">{message}</p>
              <button onClick={retry} className="btn-secondary flex items-center gap-2 text-sm py-2 px-4">
                <RefreshCw className="w-4 h-4" /> Spróbuj ponownie
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Wpisz kod ręcznie */}
      <div className="px-4 py-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(45,49,72,0.6)' }}>
        <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-3">
          lub wpisz kod ręcznie
        </p>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(26,29,39,1)', border: '1px solid rgba(45,49,72,0.8)' }}>
            <QrCode className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Wpisz kod punktu..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              className="flex-1 bg-transparent text-white text-sm placeholder-slate-600 outline-none"
            />
          </div>
          <button
            onClick={handleManualSubmit}
            disabled={!manualCode.trim() || state === 'loading'}
            className="btn-primary px-5 py-2.5"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
