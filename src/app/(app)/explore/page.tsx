import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Search, MapPin, ChevronRight } from 'lucide-react'
import { createServerDataClient } from '@/lib/data-server'
import { PLACE_TYPE_ICONS, PLACE_TYPE_LABELS } from '@/lib/utils'
import { DEFAULT_CATEGORIES } from '@/lib/constants'
import type { Place } from '@/lib/types'

export const metadata: Metadata = { title: 'Odkryj' }


type ExplorePlaceCard = Pick<Place, 'id' | 'name' | 'type' | 'short_description' | 'cover_image'> & {
  category?: { name?: string | null; icon?: string | null } | null
}

export default async function ExplorePage() {
  const dataClient = createServerDataClient()

  // Punkty NGO
  const { data: ngosData } = await dataClient
    .from('places')
    .select('id, name, slug, short_description, cover_image, category:categories(name, icon), organization:organizations(id, name)')
    .eq('is_active', true)
    .eq('type', 'ngo')
    .order('is_promoted', { ascending: false })
    .limit(20)

  // Polecane miejsca
  const { data: promotedPlacesData } = await dataClient
    .from('places')
    .select('id, name, type, short_description, cover_image, category:categories(name, icon)')
    .eq('is_active', true)
    .eq('is_promoted', true)
    .limit(10)

  const ngos = (ngosData ?? []) as ExplorePlaceCard[]
  const promotedPlaces = (promotedPlacesData ?? []) as ExplorePlaceCard[]

  return (
    <div className="pb-4">
      {/* Nagłówek */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-white font-display">Odkryj</h1>
        <p className="text-slate-400 text-sm mt-1">Miejsca i organizacje Bielska-Białej</p>

        {/* Wyszukiwarka */}
        <div className="flex items-center gap-2 mt-4 bg-surface-card border border-surface-border rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="search"
            placeholder="Szukaj NGO, miejsc, kategorii..."
            className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 outline-none"
          />
        </div>
      </div>

      {/* Kategorie */}
      <section className="mb-6">
        <p className="px-4 text-slate-500 text-xs uppercase tracking-widest mb-3">Kategorie</p>
        <div className="flex gap-2 overflow-x-auto px-4 pb-1">
          {DEFAULT_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/explore?category=${cat.slug}`}
              className="flex-shrink-0 card px-3 py-2 flex items-center gap-2 hover:border-brand-500/40 transition-colors"
            >
              <span className="text-lg">{cat.icon}</span>
              <span className="text-slate-300 text-sm whitespace-nowrap">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Polecane miejsca */}
      {promotedPlaces && promotedPlaces.length > 0 && (
        <section className="mb-6">
          <p className="px-4 text-slate-500 text-xs uppercase tracking-widest mb-3">Polecane miejsca</p>
          <div className="flex gap-3 overflow-x-auto px-4 pb-1">
            {promotedPlaces.map((place) => (
              <Link
                key={place.id}
                href={`/place/${place.id}`}
                className="flex-shrink-0 card w-44 overflow-hidden hover:border-brand-500/40 transition-colors"
              >
                <div className="h-24 bg-surface-elevated relative">
                  {place.cover_image ? (
                    <Image src={place.cover_image} alt={place.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      {PLACE_TYPE_ICONS[place.type as keyof typeof PLACE_TYPE_ICONS]}
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-slate-500 text-xs mb-0.5">
                    {(place.category as any)?.icon} {PLACE_TYPE_LABELS[place.type as keyof typeof PLACE_TYPE_LABELS]}
                  </p>
                  <p className="text-white text-sm font-medium line-clamp-2 leading-tight">{place.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Organizacje NGO */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-slate-500 text-xs uppercase tracking-widest">Organizacje NGO</p>
          <span className="text-slate-500 text-xs">{ngos?.length || 0} org.</span>
        </div>
        <div className="space-y-2">
          {ngos?.map((ngo) => (
            <Link
              key={ngo.id}
              href={`/place/${ngo.id}`}
              className="card flex items-center gap-3 p-3 hover:border-brand-500/40 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-surface-elevated flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                {ngo.cover_image ? (
                  <Image src={ngo.cover_image} alt={ngo.name} fill className="object-cover" />
                ) : (
                  <span className="text-xl">🏢</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{ngo.name}</p>
                {ngo.short_description && (
                  <p className="text-slate-400 text-xs truncate mt-0.5">{ngo.short_description}</p>
                )}
                {(ngo.category as any) && (
                  <p className="text-slate-500 text-xs mt-0.5">
                    {(ngo.category as any).icon} {(ngo.category as any).name}
                  </p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
            </Link>
          ))}

          {(!ngos || ngos.length === 0) && (
            <div className="card p-8 text-center">
              <MapPin className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Brak organizacji w bazie</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
