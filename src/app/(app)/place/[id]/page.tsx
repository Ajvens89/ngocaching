import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Phone, Mail, Globe, Clock,
  ExternalLink, Heart, Share2, Navigation
} from 'lucide-react'
import { createServerDataClient } from '@/lib/data-server'
import { PLACE_TYPE_LABELS, PLACE_TYPE_COLORS, PLACE_TYPE_ICONS, getGoogleMapsUrl } from '@/lib/utils'
import CheckinSection from './CheckinSection'

interface PageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const dataClient = createServerDataClient()
  const { data } = await dataClient
    .from('places')
    .select('name, short_description')
    .eq('id', params.id)
    .single()

  return {
    title: data?.name || 'Punkt',
    description: data?.short_description || '',
  }
}

export default async function PlacePage({ params }: PageProps) {
  const dataClient = createServerDataClient()

  const { data: place, error } = await dataClient
    .from('places')
    .select(`
      *,
      category:categories(*),
      organization:organizations(*)
    `)
    .eq('id', params.id)
    .eq('is_active', true)
    .single()

  if (error || !place) {
    notFound()
  }

  const typeColor = PLACE_TYPE_COLORS[place.type as keyof typeof PLACE_TYPE_COLORS]
  const typeIcon = PLACE_TYPE_ICONS[place.type as keyof typeof PLACE_TYPE_ICONS]
  const mapsUrl = getGoogleMapsUrl(place.latitude, place.longitude, place.name)
  const longText = place.full_description || place.description || place.short_description

  return (
    <div className="min-h-screen bg-surface">
      {/* Zdjęcie nagłówkowe */}
      <div className="relative h-64 bg-surface-card">
        {place.cover_image ? (
          <Image
            src={place.cover_image}
            alt={place.name}
            fill
            className="object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-7xl"
            style={{ background: `${typeColor}22` }}
          >
            {typeIcon}
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />

        {/* Nawigacja górna */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <Link
            href="/map"
            className="w-10 h-10 rounded-xl bg-surface-card/80 backdrop-blur border border-surface-border flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-xl bg-surface-card/80 backdrop-blur border border-surface-border flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </button>
            <button className="w-10 h-10 rounded-xl bg-surface-card/80 backdrop-blur border border-surface-border flex items-center justify-center">
              <Share2 className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Status badge */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <span
            className="category-badge"
            style={{ borderColor: typeColor + '66', color: typeColor }}
          >
            {typeIcon} {PLACE_TYPE_LABELS[place.type as keyof typeof PLACE_TYPE_LABELS]}
          </span>
          {place.is_promoted && (
            <span className="category-badge text-yellow-400 border-yellow-400/30">
              ⭐ Polecane
            </span>
          )}
        </div>
      </div>

      {/* Treść */}
      <div className="px-4 py-5 space-y-6">

        {/* Nagłówek */}
        <div>
          {place.category && (
            <p className="text-slate-400 text-sm mb-1">{place.category.icon} {place.category.name}</p>
          )}
          <h1 className="text-white text-2xl font-bold leading-tight">{place.name}</h1>
          {place.address && (
            <p className="text-slate-400 text-sm mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {place.address}
            </p>
          )}
        </div>

        {/* Opis */}
        {longText && (
          <div>
            <p className="text-slate-300 leading-relaxed">{longText}</p>
          </div>
        )}

        {/* Dane organizacji */}
        {place.organization && (
          <div className="card p-4 space-y-3">
            <h2 className="text-white font-semibold flex items-center gap-2">
              🏢 {place.organization.name}
            </h2>
            {place.organization.short_description && (
              <p className="text-slate-400 text-sm">{place.organization.short_description}</p>
            )}
            <div className="space-y-2">
              {place.organization.phone && (
                <a
                  href={`tel:${place.organization.phone}`}
                  className="flex items-center gap-2 text-slate-300 text-sm hover:text-brand-400"
                >
                  <Phone className="w-4 h-4 text-slate-500" />
                  {place.organization.phone}
                </a>
              )}
              {place.organization.email && (
                <a
                  href={`mailto:${place.organization.email}`}
                  className="flex items-center gap-2 text-slate-300 text-sm hover:text-brand-400"
                >
                  <Mail className="w-4 h-4 text-slate-500" />
                  {place.organization.email}
                </a>
              )}
              {place.organization.website && (
                <a
                  href={place.organization.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-300 text-sm hover:text-brand-400"
                >
                  <Globe className="w-4 h-4 text-slate-500" />
                  Strona internetowa
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            {place.organization.opening_hours && (
              <div className="border-t border-surface-border pt-3">
                <p className="flex items-center gap-1.5 text-slate-400 text-xs mb-2">
                  <Clock className="w-3.5 h-3.5" /> Godziny otwarcia
                </p>
                <OpeningHoursTable hours={place.organization.opening_hours} />
              </div>
            )}
          </div>
        )}

        {/* Nawigacja GPS */}
        <div className="card p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-brand-400" />
            Nawigacja
          </h3>
          <p className="text-slate-400 text-sm mb-3">
            Współrzędne: {place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}
          </p>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
          >
            Otwórz w Google Maps
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Galeria */}
        {place.gallery && place.gallery.length > 0 && (
          <div>
            <h3 className="text-white font-semibold mb-3">Galeria</h3>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {place.gallery.map((img: string, i: number) => (
                <div key={i} className="flex-shrink-0 w-28 h-20 rounded-xl overflow-hidden bg-surface-card">
                  <Image src={img} alt="" width={112} height={80} className="object-cover w-full h-full" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sekcja zaliczania */}
        <CheckinSection place={place} />
      </div>
    </div>
  )
}

function OpeningHoursTable({ hours }: { hours: Record<string, string | null> }) {
  const days = [
    { key: 'mon', label: 'Poniedziałek' },
    { key: 'tue', label: 'Wtorek' },
    { key: 'wed', label: 'Środa' },
    { key: 'thu', label: 'Czwartek' },
    { key: 'fri', label: 'Piątek' },
    { key: 'sat', label: 'Sobota' },
    { key: 'sun', label: 'Niedziela' },
  ]

  return (
    <div className="space-y-1">
      {days.map(({ key, label }) => {
        const value = hours[key]
        return (
          <div key={key} className="flex justify-between text-xs">
            <span className="text-slate-500">{label}</span>
            <span className={value ? 'text-slate-300' : 'text-slate-600'}>
              {value || 'Zamknięte'}
            </span>
          </div>
        )
      })}
      {hours.notes && (
        <p className="text-slate-500 text-xs pt-2 border-t border-surface-border mt-2">
          {hours.notes}
        </p>
      )}
    </div>
  )
}