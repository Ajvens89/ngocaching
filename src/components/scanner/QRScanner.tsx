'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode'
import { CheckCircle2, XCircle, Loader2, QrCode } from 'lucide-react'
import { getAppClient } from '@/lib/data-client'
import { POINTS_PER_ACTION } from '@/lib/constants'

type ScanState = 'scanning' | 'loading' | 'success' | 'error'

export default function QRScanner() {
  const router = useRouter()
  const dataClient = getAppClient()
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const divRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<ScanState>('scanning')
  const [message, setMessage] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    if (!divRef.current || hasStarted) return
    setHasStarted(true)
    const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: { width: 250, height: 250 }, supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA], showTorchButtonIfSupported: true }, false)
    scanner.render(async (decodedText: string) => {
      scanner.pause(true)
      await handleQRCode(decodedText)
    }, () => {})
    scannerRef.current = scanner
    return () => {
      scanner.clear().catch(() => {})
    }
  }, [hasStarted])

  async function handleQRCode(code: string) {
    setState('loading')
    setMessage('Weryfikacja kodu...')

    const { data: { user } } = await dataClient.auth.getUser()
    if (!user) {
      setState('error')
      setMessage('Musisz być zalogowany, aby zaliczyć punkt.')
      return
    }

    const { data: qrCode } = await dataClient.from('qr_codes').select('*').eq('code', code).eq('is_active', true).maybeSingle()
    if (!qrCode?.place_id) {
      setState('error')
      setMessage('Nierozpoznany kod QR')
      setTimeout(() => { setState('scanning'); scannerRef.current?.resume() }, 2500)
      return
    }

    const { data: existing } = await dataClient.from('checkins').select('*').eq('user_id', user.id).eq('place_id', qrCode.place_id).maybeSingle()
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
      await dataClient.from('qr_codes').update({ scan_count: (qrCode.scan_count || 0) + 1, is_active: qrCode.is_single_use ? false : true }).eq('id', qrCode.id)
    }

    setState('success')
    setMessage(`Punkt zaliczony! +${POINTS_PER_ACTION.qr_checkin} pkt`)
    setTimeout(() => router.push(`/place/${qrCode.place_id}`), 1800)
  }

  async function handleManualSubmit() {
    if (!manualCode.trim()) return
    await handleQRCode(manualCode.trim())
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-white">Skanuj kod QR</h1>
        <p className="text-slate-400 text-sm mt-1">Nakieruj kamerę na kod przy punkcie</p>
      </div>
      <div className="flex-1 relative">
        {state === 'scanning' && <div id="qr-reader" ref={divRef} className="w-full" style={{ border: 'none' }} />}
        {state === 'loading' && <div className="flex flex-col items-center justify-center h-full gap-4"><div className="w-20 h-20 rounded-full bg-surface-card border border-surface-border flex items-center justify-center"><Loader2 className="w-8 h-8 text-brand-500 animate-spin" /></div><p className="text-slate-300">{message}</p></div>}
        {state === 'success' && <div className="flex flex-col items-center justify-center h-full gap-4 animate-bounce-in"><div className="w-24 h-24 rounded-full bg-brand-500/20 border-2 border-brand-500 flex items-center justify-center glow-green"><CheckCircle2 className="w-12 h-12 text-brand-400" /></div><p className="text-white font-bold text-lg">{message}</p><p className="text-slate-400 text-sm">Przekierowuję do punktu...</p></div>}
        {state === 'error' && <div className="flex flex-col items-center justify-center h-full gap-4"><div className="w-20 h-20 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center"><XCircle className="w-10 h-10 text-red-400" /></div><p className="text-red-400 font-medium">{message}</p></div>}
      </div>
      <div className="px-4 py-4 border-t border-surface-border">
        <p className="text-slate-500 text-xs uppercase tracking-wider mb-3">lub wpisz kod ręcznie</p>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-surface-card border border-surface-border rounded-xl px-3 py-2.5"><QrCode className="w-4 h-4 text-slate-400" /><input type="text" placeholder="Wpisz kod punktu..." value={manualCode} onChange={(e) => setManualCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()} className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 outline-none" /></div>
          <button onClick={handleManualSubmit} disabled={!manualCode.trim() || state === 'loading'} className="btn-primary px-4">OK</button>
        </div>
      </div>
    </div>
  )
}
