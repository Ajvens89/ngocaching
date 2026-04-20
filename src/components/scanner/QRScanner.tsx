'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Html5Qrcode } from 'html5-qrcode'
import { CheckCircle2, XCircle, QrCode, Camera, RefreshCw, Keyboard } from 'lucide-react'
import { getAppClient } from '@/lib/data-client'
import { POINTS_PER_ACTION } from '@/lib/constants'

type ScanState = 'starting' | 'scanning' | 'loading' | 'success' | 'error' | 'no_permission'

const SCANNER_ID = 'qr-camera-view'

// ─── Krok wizarda ─────────────────────────────────────────────────────────────
type StepStatus = 'done' | 'active' | 'idle'
function WizardStep({ num, label, status }: { num: number; label: string; status: StepStatus }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300"
        style={{
          background: status === 'done'
            ? 'linear-gradient(135deg, #16a34a, #22c55e)'
            : status === 'active'
              ? 'rgba(34,197,94,0.15)'
              : 'rgba(45,49,72,0.5)',
          border: status === 'idle'
            ? '1.5px solid rgba(45,49,72,0.8)'
            : status === 'active'
              ? '1.5px solid rgba(74,222,128,0.6)'
              : 'none',
          color: status === 'done' ? '#fff' : status === 'active' ? '#4ade80' : '#475569',
        }}
      >
        {status === 'done' ? '✓' : num}
      </div>
      <span className="text-[10px] font-semibold"
        style={{ color: status === 'idle' ? '#475569' : status === 'active' ? '#4ade80' : '#86efac' }}>
        {label}
      </span>
    </div>
  )
}

function WizardSteps({ state }: { state: ScanState }) {
  const step1: StepStatus = state === 'starting' ? 'active'
    : state === 'no_permission' ? 'active'
      : 'done'
  const step2: StepStatus = state === 'scanning' ? 'active'
    : (state === 'loading' || state === 'success' || state === 'error') ? 'done'
      : 'idle'
  const step3: StepStatus = state === 'loading' ? 'active'
    : (state === 'success' || state === 'error') ? 'done'
      : 'idle'

  return (
    <div className="flex items-center gap-0 px-4 mb-4">
      <WizardStep num={1} label="Kamera" status={step1} />
      <div className="flex-1 h-px mx-2 transition-colors duration-300"
        style={{ background: step1 === 'done' ? 'rgba(34,197,94,0.4)' : 'rgba(45,49,72,0.6)' }} />
      <WizardStep num={2} label="Skanuj" status={step2} />
      <div className="flex-1 h-px mx-2 transition-colors duration-300"
        style={{ background: step2 === 'done' ? 'rgba(34,197,94,0.4)' : 'rgba(45,49,72,0.6)' }} />
      <WizardStep num={3} label="Weryfikacja" status={step3} />
    </div>
  )
}

// ─── Pasek postępu weryfikacji ─────────────────────────────────────────────────
function VerifyProgress({ active }: { active: boolean }) {
  return (
    <div className="w-48 h-1 rounded-full overflow-hidden"
      style={{ background: 'rgba(45,49,72,0.6)' }}>
      <div
        className="h-full rounded-full transition-all"
        style={{
          background: 'linear-gradient(90deg, #16a34a, #4ade80)',
          width: active ? '100%' : '0%',
          transition: active ? 'width 1.6s ease-in-out' : 'none',
        }}
      />
    </div>
  )
}

// ─── Główny komponent ─────────────────────────────────────────────────────────
export default function QRScanner() {
  const router = useRouter()
  const dataClient = getAppClient()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const startedRef = useRef(false)
  const [state, setState] = useState<ScanState>('starting')
  const [message, setMessage] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [showManual, setShowManual] = useState(false)

  // Zatrzymaj skaner
  async function stopScanner() {
    if (!scannerRef.current) return
    try {
      const s = scannerRef.current.getState()
      if (s === 2 || s === 3) await scannerRef.current.stop()
    } catch { /* ignore */ }
  }

  // Uruchom skaner
  async function startScanner() {
    if (startedRef.current) return
    startedRef.current = true

    const el = document.getElementById(SCANNER_ID)
    if (!el) { startedRef.current = false; return }

    const qr = new Html5Qrcode(SCANNER_ID)
    scannerRef.current = qr

    try {
      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 220 },
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
    setTimeout(() => router.push(`/place/${qrCode.place_id}`), 2000)
  }

  async function retry() {
    await stopScanner()
    startedRef.current = false
    setShowManual(false)
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
      <div className="px-4 pt-6 pb-4 flex-shrink-0">
        <h1 className="font-display text-2xl font-black text-white">Skanuj kod QR</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {state === 'starting'   ? 'Uruchamiamy kamerę...'
           : state === 'scanning' ? 'Nakieruj kamerę na kod przy punkcie'
           : state === 'loading'  ? 'Weryfikujemy kod...'
           : state === 'success'  ? 'Punkt zaliczony!'
           : state === 'no_permission' ? 'Wymagany dostęp do kamery'
           : 'Spróbuj ponownie'}
        </p>
      </div>

      {/* Pasek kroków */}
      <WizardSteps state={state} />

      {/* Obszar kamery */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 pt-2 relative">
        <div
          className="relative w-full rounded-3xl overflow-hidden"
          style={{ maxWidth: 380, height: 320, background: '#0a0c12' }}
        >
          {/* Widok kamery */}
          <div id={SCANNER_ID} style={{ width: '100%', height: '100%' }} />

          {/* Celownik (tylko podczas skanowania) */}
          {state === 'scanning' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div style={{
                width: 200, height: 200,
                border: '2px solid rgba(74,222,128,0.85)',
                borderRadius: 16,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.38)',
              }}>
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
              <p className="absolute bottom-4 text-xs text-white/70 font-medium">Ustaw kod QR w ramce</p>
            </div>
          )}

          {/* Nakładka: uruchamianie */}
          {state === 'starting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4"
              style={{ background: '#0a0c12' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1.5px solid rgba(34,197,94,0.2)' }}>
                <Camera className="w-8 h-8 text-green-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-sm">Uruchamiamy kamerę</p>
                <p className="text-slate-500 text-xs mt-1">Za chwilę możesz skanować</p>
              </div>
              {/* Animowany pasek postępu */}
              <div className="w-36 h-0.5 rounded-full overflow-hidden"
                style={{ background: 'rgba(45,49,72,0.6)' }}>
                <div className="h-full rounded-full animate-progress-bar"
                  style={{ background: 'linear-gradient(90deg, #16a34a, #4ade80)' }} />
              </div>
            </div>
          )}

          {/* Nakładka: brak uprawnień */}
          {state === 'no_permission' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center"
              style={{ background: '#0a0c12' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.25)' }}>
                <Camera className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <p className="text-white font-bold mb-2">Brak dostępu do kamery</p>
                <div className="space-y-1.5 text-left">
                  {[
                    'Otwórz ustawienia przeglądarki',
                    'Znajdź uprawnienia tej strony',
                    'Zezwól na dostęp do kamery',
                  ].map((tip, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                        style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
                        {i + 1}
                      </span>
                      <p className="text-slate-400 text-xs">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={retry}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
                <RefreshCw className="w-4 h-4" /> Spróbuj ponownie
              </button>
            </div>
          )}

          {/* Nakładka: weryfikacja */}
          {state === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4"
              style={{ background: 'rgba(10,12,18,0.97)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1.5px solid rgba(34,197,94,0.25)' }}>
                <QrCode className="w-8 h-8 text-green-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-sm">Weryfikacja kodu</p>
                <p className="text-slate-500 text-xs mt-1">Sprawdzamy punkt w bazie...</p>
              </div>
              <VerifyProgress active />
            </div>
          )}

          {/* Nakładka: sukces */}
          {state === 'success' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
              style={{ background: 'rgba(10,12,18,0.97)' }}>
              <div className="w-24 h-24 rounded-full flex items-center justify-center glow-green"
                style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.6)' }}>
                <CheckCircle2 className="w-12 h-12 text-brand-400" />
              </div>
              <p className="text-white font-black text-xl">Zaliczone! 🎉</p>
              <p className="text-brand-400 font-bold text-lg">{message}</p>
              <p className="text-slate-500 text-xs">Przekierowanie do miejsca...</p>
            </div>
          )}

          {/* Nakładka: błąd */}
          {state === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center"
              style={{ background: 'rgba(10,12,18,0.97)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.25)' }}>
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-1">Coś poszło nie tak</p>
                <p className="text-slate-400 text-xs leading-relaxed">{message}</p>
              </div>
              <button onClick={retry}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95"
                style={{ background: 'rgba(34,38,58,0.9)', border: '1px solid rgba(45,49,72,0.8)', color: '#cbd5e1' }}>
                <RefreshCw className="w-4 h-4" /> Spróbuj ponownie
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Alternatywna ścieżka — wpisz kod ręcznie */}
      <div className="px-4 pb-4 pt-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(45,49,72,0.5)' }}>
        {!showManual ? (
          <button
            onClick={() => setShowManual(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-slate-400 transition-all active:scale-95"
            style={{ background: 'rgba(26,29,39,0.6)', border: '1px solid rgba(45,49,72,0.6)' }}
          >
            <Keyboard className="w-4 h-4" />
            Nie mogę zeskanować — wpisz kod ręcznie
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Wpisz kod punktu</p>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(26,29,39,1)', border: '1px solid rgba(45,49,72,0.8)' }}>
                <QrCode className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <input
                  type="text"
                  autoFocus
                  placeholder="np. BB-001"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                  className="flex-1 bg-transparent text-white text-sm placeholder-slate-600 outline-none"
                />
              </div>
              <button
                onClick={handleManualSubmit}
                disabled={!manualCode.trim() || state === 'loading'}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}
              >
                OK
              </button>
            </div>
            <button onClick={() => setShowManual(false)}
              className="text-xs text-slate-600 hover:text-slate-500 transition-colors">
              ← Wróć do skanowania
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes progress-bar {
          0%   { width: 0%;   margin-left: 0; }
          50%  { width: 60%;  margin-left: 20%; }
          100% { width: 0%;   margin-left: 100%; }
        }
        .animate-progress-bar {
          animation: progress-bar 1.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
