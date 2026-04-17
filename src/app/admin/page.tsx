import Link from 'next/link'
import { MapPin, Building2, Compass, QrCode, BarChart3, Plus } from 'lucide-react'
import { createServerDataClient } from '@/lib/data-server'

export const metadata = { title: 'Panel Admina' }

export default async function AdminDashboard() {
  const dataClient = createServerDataClient()

  const [
    { count: placesCount },
    { count: orgsCount },
    { count: questsCount },
    { count: usersCount },
    { count: checkinsCount },
  ] = await Promise.all([
    dataClient.from('places').select('*', { count: 'exact', head: true }),
    dataClient.from('organizations').select('*', { count: 'exact', head: true }),
    dataClient.from('quests').select('*', { count: 'exact', head: true }),
    dataClient.from('user_profiles').select('*', { count: 'exact', head: true }),
    dataClient.from('checkins').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Punkty', value: placesCount || 0, icon: MapPin, color: 'text-brand-400', href: '/admin/places' },
    { label: 'NGO', value: orgsCount || 0, icon: Building2, color: 'text-civic-400', href: '/admin/organizations' },
    { label: 'Questy', value: questsCount || 0, icon: Compass, color: 'text-yellow-400', href: '/admin/quests' },
    { label: 'Użytkownicy', value: usersCount || 0, icon: BarChart3, color: 'text-purple-400', href: '/admin/users' },
    { label: 'Check-iny', value: checkinsCount || 0, icon: QrCode, color: 'text-green-400', href: '/admin/stats' },
  ]

  const quickActions = [
    { label: 'Dodaj punkt NGO', icon: Plus, href: '/admin/places/new', color: 'bg-brand-500/20 border-brand-500/40 text-brand-400' },
    { label: 'Dodaj miejsce miejskie', icon: MapPin, href: '/admin/places/new?type=city', color: 'bg-civic-500/20 border-civic-500/40 text-civic-400' },
    { label: 'Utwórz quest', icon: Compass, href: '/admin/quests/new', color: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' },
    { label: 'Generuj QR kody', icon: QrCode, href: '/admin/qr-codes', color: 'bg-purple-500/20 border-purple-500/40 text-purple-400' },
  ]

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Panel Admina</h1>
        <p className="text-slate-400 text-sm mt-1">MiejskiTrop — Bielsko-Biała</p>
      </div>

      {/* Statystyki */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href} className="card p-4 hover:border-slate-600 transition-colors">
            <Icon className={`w-5 h-5 ${color} mb-2`} />
            <p className="text-white font-bold text-2xl">{value}</p>
            <p className="text-slate-400 text-xs">{label}</p>
          </Link>
        ))}
      </div>

      {/* Szybkie akcje */}
      <div>
        <h2 className="text-white font-semibold mb-3">Szybkie akcje</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map(({ label, icon: Icon, href, color }) => (
            <Link
              key={label}
              href={href}
              className={`card flex items-center gap-3 p-4 border ${color} hover:opacity-80 transition-opacity`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Nawigacja */}
      <div>
        <h2 className="text-white font-semibold mb-3">Zarządzaj</h2>
        <div className="space-y-1">
          {[
            { href: '/admin/places', label: '📍 Punkty i miejsca' },
            { href: '/admin/organizations', label: '🏢 Organizacje NGO' },
            { href: '/admin/quests', label: '🗺️ Questy i etapy' },
            { href: '/admin/qr-codes', label: '📷 Kody QR' },
            { href: '/admin/categories', label: '🏷️ Kategorie i tagi' },
            { href: '/admin/badges', label: '🏅 Odznaki' },
            { href: '/admin/stats', label: '📊 Statystyki' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-between card px-4 py-3 hover:border-slate-600 transition-colors"
            >
              <span className="text-slate-300 text-sm">{label}</span>
              <span className="text-slate-600">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
