'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Html5Qrcode } from 'html5-qrcode'
import { CheckCircle2, XCircle, Loader2, QrCode, Camera, RefreshCw } from 'lucide-react'
import { getAppClient } from '@/lib/data-client'
import { POINTS_PER_ACTION } from '@/lib/constants'

type ScanState = 'init' | 'scanning' | 'loading' | 'success' | 'error' | 'no_permission'

export default function QRScanner() {
  const router = useRouter()
  const dataClient = getAppClient()
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<ScanState>('init')
  const [message, setMessage] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [isStarted, setIsStarted] = useState(false)

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        const scannerState = html5QrCodeRef.current.getState()
        // state 2 = SCANNING, state 3 = PAUSED
        if (scannerState === 2 || scannerState === 3) {
          await html5QrCodeRef.current.stop()
        }
      } catch {
        // ignore stop errors
      }
    }
  }, [])

  const startScanner = useCallback(async () => {
    if (isStarted || !containerRef.current) return
    setIsStarted(true)
    setState('init')

    try {
      const html5QrCode = new Html5Qrcode('qr-scanner-container')
      html5QrCodeRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        },
        async (decodedText: string) => {
          await stopScanner()
          await handleQRCode(decodedText)
        },
        () => {
          // scan failure (no QR found in frame) - ignore
        }
      )
      setState('scanning')
    } catch (err: any) {
      setIsStarted(false)
      if (
        err?.toString().includes('Permission') ||
        err?.toString().includes('permission') ||
        err?.toString().includes('NotAllowed')
      ) {
        setState('no_permission')
      } else {
        setState('error')
        setMessage('Nie można uruchomić kamery. Spróbuj ponownie.')
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStarted])

  useEffect(() => {
    startScanner()
    return () => {
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
      .from('qr_codes')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .maybeSingle()

    if (!qrCode?.place_id) {
      setState('error')
      setMessage('Nierozpoznany kod QR. Spróbuj ponownie.')
      setTimeout(async () => {
        setIsStarted(false)
        setState('init')
        await startScanner()
      }, 2500)
      return
    }

    const { data: existing } = await dataClient
      .from('checkins')
      .select('id')
      .eq('user_id', user.id)
      .eq('place_id', qrCode.place_id)
      .maybeSingle()

    if (!existing) {
      await dataClient.from('checkins').insert({
        user_id: user.id,
        place_id: qrCode.place_id,
        verification_method: 'qr',
        points_earned: POINTS_PER_ACTION.qr_checkin,
        verified_at: new Date().toISOString(),
        notes: null,
        quest_step_id: null,
        latitude_at_checkin: null,
        longitude_at_checkin: null,
      })
      await dataClient.from('qr_codes').update({
        scan_count: (qrCode.scan_count || 0) + 1,
        is_active: qrCode.is_single_use ? false : true,
      }).eq('id', qrCode.id)
    }

    setState('success')
    setMessage(`+${POINTS_PER_ACTION.qr_checkin} punktów!`)
    setTimeout(() => router.push(`/place/${qrCode.place_id}`), 1800)
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
      <div className="flex-1 relative flex flex-col items-center justify-center px-4">

        {/* Widok kamery — zawsze wyrenderowany żeby Html5Qrcode miał div */}
        <div
          className="w-full relative rounded-3xl overflow-hidden"
          style={{
            display: state === 'scanning' ? 'block' : 'none',
            background: '#000',
            aspectRatio: '1 / 1',
            maxWidth: '380px',
            maxHeight: '380px',
            margin: '0 auto',
          }}
        >
          <div id="qr-scanner-container" ref={containerRef} className="w-full h-full" />

          {/* Ramka celownika */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div
              style={{
                width: '200px',
                height: '200px',
                border: '2px solid rgba(74,222,128,0.8)',
                borderRadius: '16px',
                boxShadow: '0 0 0 2000px rgba(0,0,0,0.35)',
              }}
            >
              {/* Narożniki */}
              {['tl','tr','bl','br'].map((corner) => (
                <span key={corner} style={{
                  position: 'absolute',
                  width: '24px',
                  height: '24px',
                  borderColor: '#4ade80',
                  borderStyle: 'solid',
                  borderWidth: 0,
                  ...(corner === 'tl' ? { top: -2, left: -2, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 } : {}),
                  ...(corner === 'tr' ? { top: -2, right: -2, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 } : {}),
                  ...(corner === 'bl' ? { bottom: -2, left: -2, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 } : {}),
                  ...(corner === 'br' ? { bottom: -2, right: -2, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 } : {}),
                }} />
              ))}
            </div>
          </div>
          <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-white/70">
            Ustaw kod QR w ramce
          </p>
        </div>

        {/* Stan: init / ładowanie kamery */}
        {state === 'init' && (
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center"
              style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}
            >
              <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />
            </div>
            <p className="text-slate-400 text-sm">Uruchamianie kamery...</p>
          </div>
        )}

        {/* Stan: brak uprawnień */}
        {state === 'no_permission' && (
          <div className="flex flex-col items-center gap-4 text-center px-4">
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              <Camera className="w-10 h-10 text-red-400" />
            </div>
            <div>
              <p className="text-white font-bold text-lg mb-1">Brak dostępu do kamery</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Zezwól tej stronie na dostęp do kamery w ustawieniach przeglądarki, a następnie odśwież stronę.
              </p>
            </div>
            <button
              onClick={() => { setIsStarted(false); startScanner() }}
              className="btn-primary flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Spróbuj ponownie
            </button>
          </div>
        )}

        {/* Stan: ładowanie po skanie */}
        {state === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(26,29,39,1)', border: '1px solid rgba(45,49,72,1)' }}
            >
              <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
            </div>
            <p className="text-slate-300 font-medium">{message}</p>
          </div>
        )}

        {/* Stan: sukces */}
        {state === 'success' && (
          <div className="flex flex-col items-center gap-4 animate-bounce-in text-center">
            <div className="w-28 h-28 rounded-full flex items-center justify-center glow-green"
              style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.6)' }}
            >
              <CheckCircle2 className="w-14 h-14 text-brand-400" />
            </div>
            <div>
              <p className="text-white font-black text-2xl mb-1">Zaliczone! 🎉</p>
              <p className="text-brand-400 font-bold text-lg">{message}</p>
              <p className="text-slate-400 text-sm mt-1">Przechodzę do szczegółów...</p>
            </div>
          </div>
        )}

        {/* Stan: błąd */}
        {state === 'error' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
            <p className="text-red-400 font-semibold">{message}</p>
          </div>
        )}
      </div>

      {/* Wpisz kod ręcznie */}
      <div
        className="px-4 py-4 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(45,49,72,0.6)' }}
      >
        <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-3">
          lub wpisz kod ręcznie
        </p>
        <div className="flex gap-2">
          <div
            className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(26,29,39,1)', border: '1px solid rgba(45,49,72,0.8)' }}
          >
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
