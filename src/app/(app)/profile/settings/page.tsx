import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import LocationSettingsCard from '@/components/ui/LocationSettingsCard'

export const metadata = {
  title: 'Ustawienia',
}

export default function ProfileSettingsPage() {
  return (
    <div className="px-4 pt-6 pb-8 max-w-xl mx-auto">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-4 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Wróć do profilu
      </Link>

      <h1 className="text-2xl font-black text-white mb-1">Ustawienia</h1>
      <p className="text-slate-400 text-sm mb-6">
        Zarządzaj uprawnieniami i preferencjami aplikacji.
      </p>

      <div className="space-y-4">
        <LocationSettingsCard />
      </div>
    </div>
  )
}
