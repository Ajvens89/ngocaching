import { Metadata } from 'next'
import dynamic from 'next/dynamic'

export const metadata: Metadata = { title: 'Skanuj QR' }

const QRScanner = dynamic(() => import('@/components/scanner/QRScanner'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen-nav">
      <div className="text-slate-400">Uruchamianie kamery...</div>
    </div>
  ),
})

export default function ScanPage() {
  return (
    <div className="h-screen-nav">
      <QRScanner />
    </div>
  )
}
