import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, ChevronRight, X } from 'lucide-react'
import { createServerDataClient } from '@/lib/data-server'
import { PLACE_TYPE_ICONS, PLACE_TYPE_LABELS } from '@/lib/utils'
import { DEFAULT_CATEGORIES } from '@/lib/constants'
import type { Place } from '@/lib/types'
import SearchBar from './SearchBar'

export const metadata: Metadata = { title: 'Odkryj' }

type ExplorePlaceCard = Pick<Place, 'id' | 'name' | 'type' | 'short_description' | 'cover_image'> & {
  category?: { name?: string | null; icon?: string | null; slug?: string | null } | null
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string }
}) {
  const dataClient = createServerDataClient()
  const activeCategory = searchParams?.category ?? null
  const searchQuery    = searchParams?.q ?? ''

  // Jeśli filtrujemy kategorię — pobierz jej ID
  let categoryId: string | null = null
  if (activeCategory) {
    const { data: cat } = await dataClient
      .from('categories')
      .select('id, name, icon')
      .eq('slug', activeCategory)
      .maybeSingle()
    categoryId = cat?.id ?? null
  }

  // Buduj query dla NGO
  let ngoQuery = dataClient
    .from('places')
    .select('id, name, type, short_description, cover_image, category:categories(name, icon, slug), organization:organizations(id, name)')
    .eq('is_active', true)
    .eq('type', 'ngo')
    .order('is_promoted', { ascending: false })
    .limit(30)

  if (categoryId) ngoQuery = ngoQuery.eq('category_id', categoryId)
  if (searchQuery) ngoQuery = ngoQuery.ilike('name', `%${searchQuery}%`)

  // Polecane miejsca (all types)
  let promotedQuery = dataClient
    .from('places')
    .select('id, name, type, short_description, cover_image, category:categories(name, icon, slug)')
    .eq('is_active', true)
    .eq('is_promoted', true)
    .limit(10)

  if (categoryId) promotedQuery = promotedQuery.eq('category_id', categoryId)
  if (searchQuery) promotedQuery = promotedQuery.ilike('name', `%${searchQuery}%`)

  const [{ data: ngosData }, { data: promotedData }] = await Promise.all([ngoQuery, promotedQuery])

  const ngos           = (ngosData     ?? []) as ExplorePlaceCard[]
  const promotedPlaces = (promotedData ?? []) as ExplorePlaceCard[]

  const activecat = DEFAULT_CATEGORIES.find((c) => c.slug === activeCategory)

  return (
    <div className="pb-4">
      {/* Nagłówek */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="font-display text-2xl font-black text-white">Odkryj</h1>
        <p className="text-slate-400 text-sm mt-0.5">Miejsca i organizacje Bielska-Białej</p>
        <SearchBar defaultValue={searchQuery} />
      </div>

      {/* Kategorie */}
      <section className="mb-6">
        <p className="px-4 text-slate-500 text-xs uppercase tracking-widest font-semibold mb-3">Kategorie</p>
        <div className="flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
          {activeCategory && (
            <Link
              href="/explore"
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', color: '#4ade80' }}
            >
              <X className="w-3 h-3" /> Wyczyść
            </Link>
          )}
          {DEFAULT_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.slug
            return (
              <Link
                key={cat.slug}
                href={isActive ? '/explore' : `/explore?category=${cat.slug}`}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: isActive ? `${cat.color}20` : 'rgba(26,29,39,0.9)',
                  border: isActive ? `1.5px solid ${cat.color}60` : '1px solid rgba(45,49,72,0.8)',
                  color: isActive ? cat.color : '#94a3b8',
                }}
              >
                <span className="text-base">{cat.icon}</span>
                <span className="whitespace-nowrap">{cat.name}</span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Aktywny filtr — banner */}
      {activecat && (
        <div className="mx-4 mb-4 px-4 py-3 rounded-2xl flex items-center gap-3"
          style={{ background: `${activecat.color}12`, border: `1px solid ${activecat.color}30` }}>
          <span className="text-2xl">{activecat.icon}</span>
          <div>
            <p className="text-white font-bold text-sm">{activecat.name}</p>
            <p className="text-slate-400 text-xs">
              {ngos.length + promotedPlaces.length} wyników
            </p>
          </div>
        </div>
      )}

      {/* Wyniki wyszukiwania — banner */}
      {searchQuery && (
        <div className="mx-4 mb-4 px-4 py-3 rounded-2xl"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <p className="text-slate-300 text-sm">
            Wyniki dla: <span className="text-white font-bold">„{searchQuery}"</span>
            {' '}— {ngos.length + promotedPlaces.length} miejsc
          </p>
        </div>
      )}

      {/* Polecane miejsca (ukryj jeśli filtrujemy po kategorii NGO) */}
      {promotedPlaces.length > 0 && !activeCategory && (
        <section className="mb-6">
          <p className="px-4 text-slate-500 text-xs uppercase tracking-widest font-semibold mb-3">Polecane miejsca</p>
          <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide">
            {promotedPlaces.map((place) => (
              <Link key={place.id} href={`/place/${place.id}`}
                className="flex-shrink-0 rounded-2xl overflow-hidden transition-all active:scale-95"
                style={{ width: 176, background: 'rgba(26,29,39,1)', border: '1px solid rgba(45,49,72,0.8)' }}
              >
                <div className="h-24 relative bg-surface-elevated">
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
                  <p className="text-white text-sm font-semibold line-clamp-2 leading-tight">{place.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Organizacje NGO */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold">
            Organizacje NGO
          </p>
          <span className="text-slate-500 text-xs">{ngos.length} org.</span>
        </div>
        <div className="space-y-2">
          {ngos.map((ngo) => (
            <Link key={ngo.id} href={`/place/${ngo.id}`}
              className="flex items-center gap-3 p-3 rounded-2xl transition-all active:scale-[0.98]"
              style={{ background: 'rgba(26,29,39,1)', border: '1px solid rgba(45,49,72,0.8)' }}
            >
              <div className="w-12 h-12 rounded-xl bg-surface-elevated flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                {ngo.cover_image ? (
                  <Image src={ngo.cover_image} alt={ngo.name} fill className="object-cover" />
                ) : (
                  <span className="text-xl">🏢</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{ngo.name}</p>
                {ngo.short_description && (
                  <p className="text-slate-400 text-xs truncate mt-0.5">{ngo.short_description}</p>
                )}
                {(ngo.category as any)?.name && (
                  <p className="text-slate-500 text-xs mt-0.5">
                    {(ngo.category as any).icon} {(ngo.category as any).name}
                  </p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
            </Link>
          ))}

          {/* Empty state */}
          {ngos.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-4xl mb-3">🏢</p>
              <p className="text-white font-bold mb-1">
                {searchQuery || activeCategory ? 'Brak wyników' : 'Brak organizacji w bazie'}
              </p>
              <p className="text-slate-400 text-sm">
                {searchQuery
                  ? `Nie znaleziono NGO dla „${searchQuery}"`
                  : activeCategory
                  ? 'Żadne NGO nie pasuje do tej kategorii'
                  : 'Organizacje zostaną dodane wkrótce'}
              </p>
              {(searchQuery || activeCategory) && (
                <Link href="/explore" className="btn-secondary inline-flex mt-4 text-sm py-2 px-4">
                  Wyczyść filtry
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
