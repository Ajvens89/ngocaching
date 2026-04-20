import { Metadata } from 'next'
import dynamic from 'next/dynamic'

export const metadata: Metadata = { title: 'Skanuj QR' }

const QRScanner = dynamic(() => import('@/components/scanner/QRScanner'), {
  ssr: false,
  loading: () => <ScannerSkeleton />,
})

function ScannerSkeleton() {
  return (
    <div className="flex flex-col h-screen-nav bg-surface">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 flex-shrink-0">
        <h1 className="font-display text-2xl font-black text-white">Skanuj kod QR</h1>
        <p className="text-slate-400 text-sm mt-0.5">Nakieruj kamerę na kod przy punkcie</p>
      </div>

      {/* Obszar kamery — skeleton */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 pt-2">
        <div
          className="relative w-full rounded-3xl overflow-hidden bg-black animate-pulse"
          style={{ maxWidth: 380, height: 340, background: '#0a0c12' }}
        >
          {/* Imitacja ramki kamery */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div style={{
              width: 200, height: 200,
              border: '2px solid rgba(74,222,128,0.3)',
              borderRadius: 16,
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
                  borderColor: 'rgba(74,222,128,0.5)', borderStyle: 'solid', borderWidth: 0, ...s,
                }} />
              ))}
            </div>
            <p className="absolute bottom-4 text-xs text-white/30">Uruchamianie kamery…</p>
          </div>
          {/* Scan line animacja */}
          <div className="absolute left-0 right-0 h-0.5 opacity-40"
            style={{
              top: '50%',
              background: 'linear-gradient(90deg, transparent, #4ade80, transparent)',
              animation: 'scanLine 2s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      {/* Manual code input — szkielet */}
      <div className="px-4 py-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(45,49,72,0.6)' }}>
        <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-3">
          lub wpisz kod ręcznie
        </p>
        <div className="flex gap-2">
          <div className="flex-1 h-[44px] rounded-xl animate-pulse"
            style={{ background: 'rgba(26,29,39,1)', border: '1px solid rgba(45,49,72,0.8)' }} />
          <div className="w-[60px] h-[44px] rounded-xl animate-pulse"
            style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)' }} />
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0%, 100% { transform: translateY(-80px); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          50% { transform: translateY(80px); }
        }
      `}</style>
    </div>
  )
}

export default function ScanPage() {
  return (
    <div className="h-screen-nav">
      <QRScanner />
    </div>
  )
}
