import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Mapa',
}

// Leaflet nie obsługuje SSR — lazy load
const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-screen-nav flex items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-slate-400 text-sm">Ładowanie mapy...</p>
      </div>
    </div>
  ),
})

export default function MapPage() {
  return (
    <div className="h-screen-nav relative">
      <Suspense fallback={null}>
        <MapView />
      </Suspense>
    </div>
  )
}
