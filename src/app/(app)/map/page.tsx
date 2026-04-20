import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Mapa',
}

// mapbox-gl nie obsługuje SSR — lazy load
const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => <MapSkeleton />,
})

function MapSkeleton() {
  return (
    <div className="h-screen-nav relative overflow-hidden bg-[#0d0f16]">
      {/* Animowane tło mapy */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0d0f16 0%, #111520 40%, #0d1220 100%)',
        }}
      />
      {/* Siatka imitująca kafelki mapy */}
      <div className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      {/* Pulsujące bloki udające drogi/budynki */}
      <div className="absolute inset-0 overflow-hidden">
        {[
          { top: '30%', left: '10%', w: '45%', h: 3, rotate: 15 },
          { top: '45%', left: '5%', w: '60%', h: 3, rotate: -8 },
          { top: '60%', left: '20%', w: '55%', h: 3, rotate: 5 },
          { top: '38%', left: '55%', w: 3, h: '30%', rotate: 0 },
          { top: '25%', left: '72%', w: 3, h: '40%', rotate: 0 },
        ].map((s, i) => (
          <div key={i} className="absolute animate-pulse" style={{
            top: s.top, left: s.left,
            width: s.w, height: s.h,
            background: 'rgba(74,222,128,0.12)',
            borderRadius: 4,
            transform: `rotate(${s.rotate}deg)`,
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
        {/* Kółka imitujące markery */}
        {[
          { top: '35%', left: '25%' },
          { top: '55%', left: '48%' },
          { top: '42%', left: '68%' },
          { top: '65%', left: '30%' },
        ].map((p, i) => (
          <div key={i} className="absolute animate-pulse" style={{
            top: p.top, left: p.left,
            width: 36, height: 36,
            borderRadius: '50%',
            background: 'rgba(34,197,94,0.12)',
            border: '1.5px solid rgba(34,197,94,0.25)',
            transform: 'translate(-50%,-50%)',
            animationDelay: `${i * 0.3}s`,
          }} />
        ))}
      </div>

      {/* Szkielet search bar */}
      <div className="absolute top-4 left-4 right-4 flex gap-2">
        <div className="flex-1 h-[44px] rounded-[14px] animate-pulse"
          style={{ background: 'rgba(26,29,39,0.9)', border: '1px solid rgba(45,49,72,0.6)' }} />
        <div className="w-[44px] h-[44px] rounded-[14px] animate-pulse flex-shrink-0"
          style={{ background: 'rgba(26,29,39,0.9)', border: '1px solid rgba(45,49,72,0.6)' }} />
      </div>

      {/* Szkielet przycisku lokalizacji */}
      <div className="absolute right-4 animate-pulse"
        style={{ bottom: 108, width: 44, height: 44, borderRadius: 14, background: 'rgba(26,29,39,0.9)', border: '1px solid rgba(45,49,72,0.6)' }} />

      {/* Szkielet count pill */}
      <div className="absolute animate-pulse"
        style={{ bottom: 80, left: '50%', transform: 'translateX(-50%)', width: 120, height: 36, borderRadius: 999, background: 'rgba(15,17,23,0.9)', border: '1px solid rgba(45,49,72,0.8)' }} />
    </div>
  )
}

export default function MapPage() {
  return (
    <div className="h-screen-nav relative">
      <Suspense fallback={null}>
        <MapView />
      </Suspense>
    </div>
  )
}
