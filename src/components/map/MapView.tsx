'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search, Filter, Navigation, X, ChevronUp, ChevronDown, MapPin, CheckCircle2, Lock } from 'lucide-react'
import Link from 'next/link'
import { Place, MapFilters, PlaceType, QuestStep } from '@/lib/types'
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
        pointer-events: auto;
      ">${emoji}</div>
    `,
    className: 'leaflet-div-icon-custom',
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
  const [questSteps, setQuestSteps] = useState<QuestStep[]>([])
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

  // ── Stable ref: zawsze aktualny filteredPlaces bez re-tworzenia handlera ──
  const filteredPlacesRef = useRef<Place[]>([])
  useEffect(() => { filteredPlacesRef.current = filteredPlaces }, [filteredPlaces])

  useEffect(() => {
    async function fetchData() {
      const dataClient = getAppClient()
      const [placesResult, stepsResult] = await Promise.all([
        dataClient
          .from('places')
          .select(`*, category:categories(*), organization:organizations(id, name)`)
          .eq('is_active', true)
          .limit(200),
        dataClient
          .from('quest_steps')
          .select(`*, quest:quests(id, title)`)
          .limit(200),
      ])

      const { data: placesData, error } = placesResult
      if (error || !placesData) { setLoading(false); return }

      // Quest steps — do kojarzenia miejsca z etapem questa
      setQuestSteps((stepsResult.data as QuestStep[]) ?? [])

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
    fetchData()
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

  // ── Stabilny handler markera — nie zmienia się między renderami ──────────
  // BUG FIX: wcześniej tworzony inline, co powodowało re-attach w react-leaflet
  const handleMarkerClick = useCallback((placeId: string) => {
    const place = filteredPlacesRef.current.find(p => p.id === placeId) ?? null
    setSelectedPlace(place)
    setShowBottomSheet(true)
  }, []) // celowo pusta deps — handler czyta dane przez ref

  const nearbyPlaces = userPos
    ? filteredPlaces.filter((p) => (p.distance || Infinity) < 500).slice(0, 6)
    : filteredPlaces.slice(0, 6)

  const hasActiveFilters = filters.type !== 'all' || filters.category_id !== null || filters.status !== 'all'

  // Znajdź quest steps powiązane z wybranym miejscem
  const relatedSteps = selectedPlace
    ? questSteps.filter(s => s.place_id === selectedPlace.id)
    : []

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
            position: 'relative',
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
              // BUG FIX 1: stopPropagation zapobiega dalszemu procesowaniu przez Leaflet
              // BUG FIX 2: handleMarkerClick jest stabilny (useCallback + ref),
              //            nie powoduje off/re-on w react-leaflet na każdym renderze
              click: (e) => {
                L.DomEvent.stopPropagation(e as any)
                handleMarkerClick(place.id)
              },
            }}
          />
        ))}

        <LocationButton userPos={userPos} onLocate={handleLocate} />
      </MapContainer>

      {/* ── Count Pill ── */}
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

      {/* ── Bottom Sheet ────────────────────────────────────────────────────── */}
      {showBottomSheet && (
        <div
          className="animate-slide-up"
          style={{
            position: 'fixed',
            bottom: 'calc(72px + env(safe-area-inset-bottom))',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: '480px',
            background: 'rgba(13,15,22,0.98)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            borderTop: '1px solid rgba(55,60,84,0.7)',
            borderLeft: '1px solid rgba(55,60,84,0.4)',
            borderRight: '1px solid rgba(55,60,84,0.4)',
            borderRadius: '24px 24px 0 0',
            boxShadow: '0 -12px 48px rgba(0,0,0,0.7)',
            zIndex: 1000,
            maxHeight: '62vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Drag handle */}
          <div className="flex items-center justify-center pt-3 pb-1 flex-shrink-0">
            <div style={{ width: '40px', height: '4px', borderRadius: '99px', background: 'rgba(71,85,105,0.5)' }} />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-1 pb-3 flex-shrink-0">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest">
              {selectedPlace ? 'Wybrany punkt' : userPos ? 'Blisko Ciebie' : 'Odkryj punkty'}
            </p>
            <button
              onClick={() => { setShowBottomSheet(false); setSelectedPlace(null) }}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '10px',
                background: 'rgba(45,49,72,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: '1px solid rgba(71,85,105,0.4)',
              }}
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* ── Scrollable content ── */}
          <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>

            {/* ── Wybrany punkt — karta szczegółów ── */}
            {selectedPlace && (
              <div className="px-5 pb-5 space-y-4">

                {/* Nazwa miejsca + meta */}
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{
                        background: `${PLACE_TYPE_COLORS[selectedPlace.type]}18`,
                        color: PLACE_TYPE_COLORS[selectedPlace.type],
                        border: `1px solid ${PLACE_TYPE_COLORS[selectedPlace.type]}30`,
                      }}
                    >
                      {PLACE_TYPE_ICONS[selectedPlace.type]} {selectedPlace.category?.name || selectedPlace.type}
                    </span>
                    {selectedPlace.distance != null && (
                      <span className="text-slate-500 text-xs font-medium">{formatDistance(selectedPlace.distance)}</span>
                    )}
                    {selectedPlace.user_status === 'completed' && (
                      <span className="text-brand-400 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Zaliczone
                      </span>
                    )}
                  </div>
                  <h2 className="text-white text-xl font-black leading-tight">{selectedPlace.name}</h2>
                  {selectedPlace.short_description && (
                    <p className="text-slate-400 text-sm mt-1.5 leading-relaxed line-clamp-2">
                      {selectedPlace.short_description}
                    </p>
                  )}
                </div>

                {/* Wskazówka */}
                {selectedPlace.hint && (
                  <div
                    className="p-3.5 rounded-2xl"
                    style={{
                      background: 'rgba(250,204,21,0.07)',
                      border: '1px solid rgba(250,204,21,0.18)',
                    }}
                  >
                    <p className="text-yellow-400 text-xs font-bold uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                      💡 Wskazówka
                    </p>
                    <p className="text-slate-300 text-sm leading-relaxed">{selectedPlace.hint}</p>
                  </div>
                )}

                {/* Zadanie */}
                {selectedPlace.task_content && (
                  <div
                    className="p-3.5 rounded-2xl"
                    style={{
                      background: 'rgba(34,197,94,0.07)',
                      border: '1px solid rgba(34,197,94,0.18)',
                    }}
                  >
                    <p className="text-brand-400 text-xs font-bold uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                      🎯 Zadanie
                    </p>
                    <p className="text-slate-200 text-sm leading-relaxed">{selectedPlace.task_content}</p>
                  </div>
                )}

                {/* Quest step powiązany z tym miejscem */}
                {relatedSteps.length > 0 && (
                  <div
                    className="p-3.5 rounded-2xl"
                    style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}
                  >
                    <p className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: '#f59e0b' }}>
                      🗺️ Etap questa
                    </p>
                    <div className="space-y-2.5">
                      {relatedSteps.map((step: any) => (
                        <div key={step.id} className="flex items-start gap-3">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5"
                            style={{ background: 'rgba(245,158,11,0.25)', color: '#f59e0b' }}
                          >
                            {step.step_number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold leading-snug">{step.title}</p>
                            {step.quest?.title && (
                              <p className="text-slate-500 text-xs mt-0.5">{step.quest.title}</p>
                            )}
                          </div>
                          {selectedPlace.user_status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#4ade80' }} />
                          ) : (
                            <Lock className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Lista pobliskich miejsc (gdy brak wybranego punktu) */}
            {!selectedPlace && nearbyPlaces.length > 0 && (
              <div className="px-5 pb-5">
                <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-3">
                  {userPos ? '📍 Blisko Ciebie' : '🗺️ Wszystkie miejsca'}
                </p>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {nearbyPlaces.map((p) => (
                    <Link
                      key={p.id}
                      href={`/place/${p.id}`}
                      className="flex-shrink-0 w-40 p-3.5 rounded-2xl transition-all active:scale-95"
                      style={{ background: 'rgba(22,26,38,0.9)', border: '1px solid rgba(55,60,84,0.7)' }}
                    >
                      <p className="text-2xl mb-2">{PLACE_TYPE_ICONS[p.type]}</p>
                      <p className="text-white text-sm font-bold line-clamp-2 leading-tight mb-1">{p.name}</p>
                      {p.distance != null && (
                        <p className="text-slate-500 text-xs">{formatDistance(p.distance)}</p>
                      )}
                      {p.user_status === 'completed' && (
                        <p className="text-brand-400 text-xs mt-1.5 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Zaliczone
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Sticky CTA (only when a place is selected) ── */}
          {selectedPlace && (
            <div
              className="flex-shrink-0 px-5 pt-3 pb-5"
              style={{ borderTop: '1px solid rgba(55,60,84,0.5)' }}
            >
              <Link
                href={`/place/${selectedPlace.id}`}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'center',
                  padding: '14px 20px',
                  borderRadius: '16px',
                  background: selectedPlace.user_status === 'completed'
                    ? 'rgba(34,197,94,0.15)'
                    : 'linear-gradient(135deg, #16a34a, #22c55e)',
                  color: selectedPlace.user_status === 'completed' ? '#4ade80' : '#fff',
                  fontWeight: 800,
                  fontSize: '15px',
                  border: selectedPlace.user_status === 'completed'
                    ? '1px solid rgba(34,197,94,0.3)'
                    : 'none',
                  boxShadow: selectedPlace.user_status === 'completed'
                    ? 'none'
                    : '0 6px 20px rgba(34,197,94,0.35)',
                  letterSpacing: '-0.01em',
                }}
              >
                {selectedPlace.user_status === 'completed' ? '✓ Odwiedź ponownie' : 'Zalicz punkt →'}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
