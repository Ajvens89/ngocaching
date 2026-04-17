'use client'

import { useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search, Filter, Navigation, X, ChevronUp, ChevronDown, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Place, MapFilters, PlaceType } from '@/lib/types'
import { BIELSKO_CENTER, DEFAULT_ZOOM, getCurrentPosition, getDistance, formatDistance } from '@/lib/geo'
import { MAP_TILE_PROVIDERS, MAP_ATTRIBUTION } from '@/lib/constants'
import { PLACE_TYPE_COLORS, PLACE_TYPE_ICONS, cn } from '@/lib/utils'
import { getAppClient } from '@/lib/data-client'
import MapFiltersPanel from './MapFilters'

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function createPlaceIcon(type: PlaceType, isCompleted: boolean) {
  const color = isCompleted ? '#22c55e' : PLACE_TYPE_COLORS[type]
  const emoji = PLACE_TYPE_ICONS[type]
  const size = 40

  return L.divIcon({
    html: `
      <div style="
        width: ${size}px; height: ${size}px;
        background: ${isCompleted ? 'rgba(34,197,94,0.18)' : color + '18'};
        border: 2px solid ${color};
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 17px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 0 0 ${isCompleted ? '4px' : '0px'} ${color}33;
        cursor: pointer;
        transition: transform 0.15s;
      ">${emoji}</div>
    `,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

function MapEventHandler({ onBoundsChange }: { onBoundsChange: (b: L.LatLngBounds) => void }) {
  const map = useMap()
  useEffect(() => {
    const h = () => onBoundsChange(map.getBounds())
    map.on('moveend', h)
    onBoundsChange(map.getBounds())
    return () => { map.off('moveend', h) }
  }, [map, onBoundsChange])
  return null
}

function LocationButton({ userPos, onLocate }: { userPos: { lat: number; lng: number } | null; onLocate: () => void }) {
  const map = useMap()
  const handleClick = () => {
    onLocate()
    if (userPos) map.flyTo([userPos.lat, userPos.lng], 16, { duration: 1.5 })
  }

  return (
    <button
      onClick={handleClick}
      style={{
        position: 'absolute',
        bottom: '108px',
        right: '16px',
        zIndex: 400,
        width: '44px',
        height: '44px',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: userPos ? 'rgba(34,197,94,0.15)' : 'rgba(26,29,39,0.95)',
        border: userPos ? '1.5px solid rgba(34,197,94,0.5)' : '1px solid rgba(45,49,72,0.9)',
        boxShadow: userPos ? '0 0 16px rgba(34,197,94,0.25), 0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(12px)',
        color: userPos ? '#4ade80' : '#94a3b8',
        transition: 'all 0.2s',
        cursor: 'pointer',
      }}
      title="Moja lokalizacja"
    >
      <Navigation className="w-5 h-5" style={{ fill: userPos ? 'rgba(74,222,128,0.2)' : 'none' }} />
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

  useEffect(() => {
    async function fetchPlaces() {
      const dataClient = getAppClient()
      const { data: placesData, error } = await dataClient
        .from('places')
        .select(`*, category:categories(*), organization:organizations(id, name)`)
        .eq('is_active', true)
        .limit(200)

      if (error || !placesData) { setLoading(false); return }

      const { data: { user } } = await dataClient.auth.getUser()
      let completedPlaceIds = new Set<string>()

      if (user) {
        const { data: checkins } = await dataClient
          .from('checkins').select('place_id').eq('user_id', user.id)
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

  useEffect(() => {
    let result = places
    if (filters.type !== 'all') result = result.filter((p) => p.type === filters.type)
    if (filters.category_id) result = result.filter((p) => p.category?.slug === filters.category_id)
    if (filters.status !== 'all') result = result.filter((p) => p.user_status === filters.status)
    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.short_description?.toLowerCase().includes(q))
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
      setUserPos({ lat: position.coords.latitude, lng: position.coords.longitude })
    } catch {
      console.warn('Brak dostępu do lokalizacji')
    }
  }, [])

  const nearbyPlaces = userPos
    ? filteredPlaces.filter((p) => (p.distance || Infinity) < 500).slice(0, 6)
    : filteredPlaces.slice(0, 6)

  const hasActiveFilters = filters.type !== 'all' || filters.category_id !== null || filters.status !== 'all'

  return (
    <div className="relative h-full w-full">

      {/* ── Search Bar ── */}
      <div className="absolute top-4 left-4 right-4 z-[500] flex gap-2">
        <div
          className="flex-1 flex items-center gap-2 px-3.5 py-3 shadow-xl"
          style={{
            background: 'rgba(15,17,23,0.82)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(45,49,72,0.8)',
            borderRadius: '14px',
          }}
        >
          <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Szukaj NGO, miejsc..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="flex-1 bg-transparent text-white text-sm placeholder-slate-600 outline-none"
          />
          {filters.search && (
            <button onClick={() => setFilters((f) => ({ ...f, search: '' }))}>
              <X className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>

        {/* Filter button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: showFilters || hasActiveFilters
              ? 'rgba(34,197,94,0.2)'
              : 'rgba(15,17,23,0.82)',
            border: showFilters || hasActiveFilters
              ? '1.5px solid rgba(34,197,94,0.5)'
              : '1px solid rgba(45,49,72,0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            color: showFilters || hasActiveFilters ? '#4ade80' : '#94a3b8',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Filter className="w-4 h-4" />
          {hasActiveFilters && (
            <span
              style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                width: '8px',
                height: '8px',
                background: '#4ade80',
                borderRadius: '50%',
                border: '1.5px solid #0f1117',
              }}
            />
          )}
        </button>
      </div>

      {/* ── Filter Panel ── */}
      {showFilters && (
        <div className="absolute top-20 left-4 right-4 z-[500]">
          <MapFiltersPanel filters={filters} onChange={setFilters} onClose={() => setShowFilters(false)} />
        </div>
      )}

      {/* ── Leaflet Map ── */}
      <MapContainer
        center={[BIELSKO_CENTER.lat, BIELSKO_CENTER.lng]}
        zoom={DEFAULT_ZOOM}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer url={MAP_TILE_PROVIDERS.CARTO_DARK} attribution={MAP_ATTRIBUTION} />
        <MapEventHandler onBoundsChange={() => {}} />

        {userPos && (
          <>
            <Circle
              center={[userPos.lat, userPos.lng]}
              radius={80}
              pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.08, weight: 1 }}
            />
            <Marker
              position={[userPos.lat, userPos.lng]}
              icon={L.divIcon({
                html: `<div style="width:14px;height:14px;background:#3b82f6;border:2.5px solid white;border-radius:50%;box-shadow:0 0 0 5px rgba(59,130,246,0.25), 0 2px 8px rgba(0,0,0,0.4)"></div>`,
                className: '',
                iconSize: [14, 14],
                iconAnchor: [7, 7],
              })}
            />
          </>
        )}

        {filteredPlaces.map((place) => (
          <Marker
            key={place.id}
            position={[place.latitude, place.longitude]}
            icon={createPlaceIcon(place.type, place.user_status === 'completed')}
            eventHandlers={{
              click: () => { setSelectedPlace(place); setShowBottomSheet(true) },
            }}
          />
        ))}

        <LocationButton userPos={userPos} onLocate={handleLocate} />
      </MapContainer>

      {/* ── Count Pill (when no sheet) ── */}
      {!showBottomSheet && (
        <button
          onClick={() => setShowBottomSheet(true)}
          style={{
            position: 'absolute',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 400,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(15,17,23,0.88)',
            border: '1px solid rgba(45,49,72,0.9)',
            borderRadius: '999px',
            padding: '8px 16px',
            color: '#cbd5e1',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(16px)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <MapPin className="w-3.5 h-3.5" style={{ color: '#4ade80' }} />
          <span style={{ color: '#4ade80', fontWeight: 800 }}>{filteredPlaces.length}</span>
          {filteredPlaces.length === 1 ? 'punkt' : filteredPlaces.length < 5 ? 'punkty' : 'punktów'}
          <ChevronUp className="w-3.5 h-3.5 ml-1" />
        </button>
      )}

      {/* ── Bottom Sheet — nad bottom nav (z-index 60 > nav z-index 50) ── */}
      {showBottomSheet && (
        <div
          className="animate-slide-up"
          style={{
            position: 'fixed',
            bottom: 'calc(72px + env(safe-area-inset-bottom))',
            left: 0,
            right: 0,
            background: 'rgba(18,21,30,0.97)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderTop: '1px solid rgba(45,49,72,0.8)',
            borderRadius: '24px 24px 0 0',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
            zIndex: 60,
            maxHeight: '58vh',
            overflowY: 'auto',
          }}
        >
          {/* Drag handle */}
          <div className="flex items-center justify-center pt-3 pb-1">
            <div style={{ width: '36px', height: '4px', borderRadius: '99px', background: 'rgba(71,85,105,0.6)' }} />
          </div>

          {/* Close row */}
          <div className="flex items-center justify-between px-4 pb-3">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">
              {selectedPlace ? 'Wybrany punkt' : userPos ? 'Blisko Ciebie' : 'Odkryj punkty'}
            </p>
            <button
              onClick={() => { setShowBottomSheet(false); setSelectedPlace(null) }}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'rgba(45,49,72,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Selected place card */}
          {selectedPlace && (
            <div className="px-4 pb-4">
              <div
                className="p-4 rounded-2xl mb-3"
                style={{ background: 'rgba(26,29,39,0.9)', border: '1px solid rgba(45,49,72,0.8)' }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{
                      background: `${PLACE_TYPE_COLORS[selectedPlace.type]}18`,
                      border: `1px solid ${PLACE_TYPE_COLORS[selectedPlace.type]}30`,
                    }}
                  >
                    {PLACE_TYPE_ICONS[selectedPlace.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: `${PLACE_TYPE_COLORS[selectedPlace.type]}18`,
                          color: PLACE_TYPE_COLORS[selectedPlace.type],
                        }}
                      >
                        {selectedPlace.category?.name || selectedPlace.type}
                      </span>
                      {selectedPlace.distance != null && (
                        <span className="text-slate-500 text-xs">{formatDistance(selectedPlace.distance)}</span>
                      )}
                    </div>
                    <h3 className="text-white font-bold text-sm leading-snug">{selectedPlace.name}</h3>
                    {selectedPlace.short_description && (
                      <p className="text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed">
                        {selectedPlace.short_description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <Link
                href={`/place/${selectedPlace.id}`}
                className="btn-primary w-full text-center block text-sm"
              >
                Zobacz szczegóły →
              </Link>
            </div>
          )}

          {/* Nearby places strip */}
          {nearbyPlaces.length > 0 && (
            <div className="border-t border-surface-border px-4 py-3">
              <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-3">
                {userPos ? '📍 Blisko Ciebie' : '🗺️ Wszystkie miejsca'}
              </p>
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
                {nearbyPlaces.map((p) => (
                  <Link
                    key={p.id}
                    href={`/place/${p.id}`}
                    className="flex-shrink-0 w-36 p-3 rounded-2xl transition-all active:scale-95"
                    style={{ background: 'rgba(26,29,39,0.9)', border: '1px solid rgba(45,49,72,0.8)' }}
                  >
                    <p className="text-xl mb-1.5">{PLACE_TYPE_ICONS[p.type]}</p>
                    <p className="text-white text-xs font-bold line-clamp-2 leading-tight mb-1">
                      {p.name}
                    </p>
                    {p.distance != null && (
                      <p className="text-slate-500 text-xs">{formatDistance(p.distance)}</p>
                    )}
                    {p.user_status === 'completed' && (
                      <p className="text-brand-400 text-xs mt-1 font-semibold">✓ Zaliczone</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
