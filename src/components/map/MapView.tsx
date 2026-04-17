'use client'

import { useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search, Filter, Navigation, X, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { Place, MapFilters, PlaceType } from '@/lib/types'
import { BIELSKO_CENTER, DEFAULT_ZOOM, getCurrentPosition, getDistance, formatDistance } from '@/lib/geo'
import { MAP_TILE_PROVIDERS, MAP_ATTRIBUTION } from '@/lib/constants'
import { PLACE_TYPE_COLORS, PLACE_TYPE_ICONS, cn } from '@/lib/utils'
import { getAppClient } from '@/lib/data-client'
import MapFiltersPanel from './MapFilters'

// Fix Leaflet domyślne ikony
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Tworzy niestandardową ikonę markera
function createPlaceIcon(type: PlaceType, isCompleted: boolean) {
  const color = isCompleted ? '#22c55e' : PLACE_TYPE_COLORS[type]
  const emoji = PLACE_TYPE_ICONS[type]
  const size = 36

  return L.divIcon({
    html: `
      <div style="
        width: ${size}px; height: ${size}px;
        background: ${color}22;
        border: 2px solid ${color};
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        cursor: pointer;
        transition: transform 0.15s;
        ${isCompleted ? `box-shadow: 0 0 0 3px ${color}44, 0 2px 8px rgba(0,0,0,0.4);` : ''}
      ">${emoji}</div>
    `,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

// Komponent do śledzenia viewport mapy
function MapEventHandler({
  onBoundsChange,
}: {
  onBoundsChange: (bounds: L.LatLngBounds) => void
}) {
  const map = useMap()

  useEffect(() => {
    const handleMoveEnd = () => onBoundsChange(map.getBounds())
    map.on('moveend', handleMoveEnd)
    onBoundsChange(map.getBounds())
    return () => { map.off('moveend', handleMoveEnd) }
  }, [map, onBoundsChange])

  return null
}

// Przycisk "Moje położenie"
function LocationButton({
  userPos,
  onLocate,
}: {
  userPos: { lat: number; lng: number } | null
  onLocate: () => void
}) {
  const map = useMap()

  const handleClick = () => {
    onLocate()
    if (userPos) {
      map.flyTo([userPos.lat, userPos.lng], 16, { duration: 1.5 })
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'absolute bottom-28 right-4 z-[400]',
        'w-11 h-11 rounded-xl flex items-center justify-center',
        'bg-surface-card border border-surface-border shadow-lg',
        'transition-all duration-200 active:scale-95',
        userPos ? 'text-brand-400' : 'text-slate-400'
      )}
      title="Moja lokalizacja"
    >
      <Navigation className="w-5 h-5" />
    </button>
  )
}

export default function MapView() {
  const [places, setPlaces] = useState<Place[]>([])
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showBottomSheet, setShowBottomSheet] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [filters, setFilters] = useState<MapFilters>({
    type: 'all',
    category_id: null,
    status: 'all',
    search: '',
  })

  // Pobierz miejsca z Supabase
  useEffect(() => {
    async function fetchPlaces() {
      const dataClient = getAppClient()
      const { data: placesData, error } = await dataClient
        .from('places')
        .select(`*, category:categories(*), organization:organizations(id, name)`)
        .eq('is_active', true)
        .limit(200)

      if (error || !placesData) {
        setLoading(false)
        return
      }

      const { data: { user } } = await dataClient.auth.getUser()
      let completedPlaceIds = new Set<string>()

      if (user) {
        const { data: checkins } = await dataClient
          .from('checkins')
          .select('place_id')
          .eq('user_id', user.id)

        completedPlaceIds = new Set((checkins || []).map((c: any) => c.place_id))
      }

      const normalized = placesData.map((p: any) => ({
        ...p,
        user_status: completedPlaceIds.has(p.id) ? 'completed' : 'undiscovered',
      }))

      setPlaces(normalized)
      setFilteredPlaces(normalized)
      setLoading(false)
    }
    fetchPlaces()
  }, [])

  // Filtruj miejsca
  useEffect(() => {
    let result = places

    if (filters.type !== 'all') {
      result = result.filter((p) => p.type === filters.type)
    }
    if (filters.category_id) {
      result = result.filter((p) => p.category?.slug === filters.category_id)
    }
    if (filters.status !== 'all') {
      result = result.filter((p) => p.user_status === filters.status)
    }

    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.short_description?.toLowerCase().includes(q)
      )
    }

    if (userPos) {
      result = result.map((p) => ({
        ...p,
        distance: getDistance(userPos.lat, userPos.lng, p.latitude, p.longitude),
      }))
      result.sort((a, b) => (a.distance || 0) - (b.distance || 0))
    }

    setFilteredPlaces(result)
  }, [places, filters, userPos])

  const handleLocate = useCallback(async () => {
    try {
      const position = await getCurrentPosition()
      setUserPos({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      })
    } catch {
      console.warn('Brak dostępu do lokalizacji')
    }
  }, [])

  const nearbyPlaces = userPos
    ? filteredPlaces.filter((p) => (p.distance || Infinity) < 500).slice(0, 5)
    : filteredPlaces.slice(0, 5)

  return (
    <div className="relative h-full w-full">
      {/* Pasek wyszukiwania */}
      <div className="absolute top-4 left-4 right-4 z-[500] flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-surface-card border border-surface-border rounded-xl px-3 py-2.5 shadow-lg">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Szukaj NGO, miejsc..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 outline-none"
          />
          {filters.search && (
            <button onClick={() => setFilters((f) => ({ ...f, search: '' }))}>
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-colors',
            showFilters
              ? 'bg-brand-500 border border-brand-400 text-white'
              : 'bg-surface-card border border-surface-border text-slate-400'
          )}
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Panel filtrów */}
      {showFilters && (
        <div className="absolute top-20 left-4 right-4 z-[500]">
          <MapFiltersPanel
            filters={filters}
            onChange={setFilters}
            onClose={() => setShowFilters(false)}
          />
        </div>
      )}

      {/* Mapa Leaflet */}
      <MapContainer
        center={[BIELSKO_CENTER.lat, BIELSKO_CENTER.lng]}
        zoom={DEFAULT_ZOOM}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url={MAP_TILE_PROVIDERS.CARTO_DARK}
          attribution={MAP_ATTRIBUTION}
        />

        <MapEventHandler onBoundsChange={() => {}} />

        {/* Lokalizacja użytkownika */}
        {userPos && (
          <>
            <Circle
              center={[userPos.lat, userPos.lng]}
              radius={50}
              pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15 }}
            />
            <Marker
              position={[userPos.lat, userPos.lng]}
              icon={L.divIcon({
                html: `<div style="width:14px;height:14px;background:#3b82f6;border:2px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.3)"></div>`,
                className: '',
                iconSize: [14, 14],
                iconAnchor: [7, 7],
              })}
            />
          </>
        )}

        {/* Markery punktów */}
        {filteredPlaces.map((place) => (
          <Marker
            key={place.id}
            position={[place.latitude, place.longitude]}
            icon={createPlaceIcon(place.type, place.user_status === 'completed')}
            eventHandlers={{
              click: () => {
                setSelectedPlace(place)
                setShowBottomSheet(true)
              },
            }}
          />
        ))}

        <LocationButton userPos={userPos} onLocate={handleLocate} />
      </MapContainer>

      {/* Bottom Sheet */}
      {showBottomSheet && selectedPlace && (
        <div className="bottom-sheet animate-slide-up">
          <div
            className="w-10 h-1 rounded-full bg-surface-border mx-auto mt-3 mb-4"
          />
          <div className="px-4 pb-6">
            {/* Mini karta wybranego miejsca */}
            <div className="flex items-start gap-3 mb-4">
              <div className="text-3xl">{PLACE_TYPE_ICONS[selectedPlace.type]}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="category-badge text-xs"
                    style={{ borderColor: PLACE_TYPE_COLORS[selectedPlace.type] + '66' }}
                  >
                    {selectedPlace.category?.name || selectedPlace.type}
                  </span>
                  {selectedPlace.distance && (
                    <span className="text-slate-500 text-xs">
                      {formatDistance(selectedPlace.distance)}
                    </span>
                  )}
                </div>
                <h3 className="text-white font-semibold">{selectedPlace.name}</h3>
                {selectedPlace.short_description && (
                  <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                    {selectedPlace.short_description}
                  </p>
                )}
              </div>
              <button onClick={() => setShowBottomSheet(false)} className="text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <Link
              href={`/place/${selectedPlace.id}`}
              className="btn-primary w-full text-center block"
            >
              Zobacz szczegóły
            </Link>
          </div>

          {/* Pobliskie miejsca */}
          {nearbyPlaces.length > 0 && (
            <div className="border-t border-surface-border px-4 py-3">
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-3">
                {userPos ? 'Blisko Ciebie' : 'Ostatnio dodane'}
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {nearbyPlaces.map((p) => (
                  <Link
                    key={p.id}
                    href={`/place/${p.id}`}
                    className="flex-shrink-0 card px-3 py-2 w-36 hover:border-brand-500/50"
                  >
                    <p className="text-sm mb-0.5">{PLACE_TYPE_ICONS[p.type]}</p>
                    <p className="text-white text-xs font-medium line-clamp-2 leading-tight">
                      {p.name}
                    </p>
                    {p.distance && (
                      <p className="text-slate-500 text-xs mt-1">{formatDistance(p.distance)}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Przycisk otwierania bottom sheet */}
      {!showBottomSheet && (
        <button
          onClick={() => setShowBottomSheet(true)}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-2 bg-surface-card border border-surface-border rounded-full px-4 py-2 text-slate-300 text-sm shadow-lg"
        >
          <ChevronUp className="w-4 h-4" />
          {filteredPlaces.length} {filteredPlaces.length === 1 ? 'punkt' : 'punktów'}
        </button>
      )}
    </div>
  )
}
