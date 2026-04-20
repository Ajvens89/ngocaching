'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import Map, { Marker, type MapRef } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import Supercluster from 'supercluster'
import { Search, Filter, Navigation, X, ChevronUp, MapPin, CheckCircle2, Lock } from 'lucide-react'
import Link from 'next/link'
import { Place, MapFilters, PlaceType, QuestStep } from '@/lib/types'
import { BIELSKO_CENTER, DEFAULT_ZOOM, getCurrentPosition, getDistance, formatDistance } from '@/lib/geo'
import { PLACE_TYPE_COLORS, PLACE_TYPE_ICONS, cn } from '@/lib/utils'
import { getAppClient } from '@/lib/data-client'
import MapFiltersPanel from './MapFilters'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

const STYLE_DARK  = 'mapbox://styles/mapbox/dark-v11'
const STYLE_LIGHT = 'mapbox://styles/mapbox/light-v11'

// ── Marker sizes — min 44px touch target (WCAG 2.5.8) ────────────────────────
const MARKER_SIZE   = 44
const SELECTED_SIZE = 54

interface ClusterFeature {
  type: 'Feature'
  properties: { cluster: true; cluster_id: number; point_count: number; point_count_abbreviated: string | number }
  geometry: { type: 'Point'; coordinates: [number, number] }
  id: number
}
interface PointFeature {
  type: 'Feature'
  properties: { cluster: false; placeId: string }
  geometry: { type: 'Point'; coordinates: [number, number] }
}
type AnyFeature = ClusterFeature | PointFeature

// ── Per-place marker component ────────────────────────────────────────────────
function PlaceMarker({
  place,
  isSelected,
  stepNumber,
  isDark,
  onClick,
}: {
  place: Place
  isSelected: boolean
  stepNumber: number | null
  isDark: boolean
  onClick: () => void
}) {
  const color     = place.user_status === 'completed' ? '#22c55e' : PLACE_TYPE_COLORS[place.type]
  const emoji     = PLACE_TYPE_ICONS[place.type]
  const size      = isSelected ? SELECTED_SIZE : MARKER_SIZE
  const bgAlpha   = isDark ? '20' : '28'
  const borderOpacity = isDark ? 0.7 : 0.85

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick() }}
      style={{
        width: size,
        height: size,
        background: `${color}${bgAlpha}`,
        border: `2px solid ${color}`,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: isSelected ? 20 : 17,
        cursor: 'pointer',
        position: 'relative',
        transition: 'width 0.15s, height 0.15s, box-shadow 0.15s',
        boxShadow: isSelected
          ? `0 0 0 3px ${color}55, 0 6px 20px rgba(0,0,0,0.55)`
          : `0 3px 10px rgba(0,0,0,0.45)`,
        backdropFilter: 'blur(4px)',
      }}
    >
      {emoji}
      {/* Quest step badge */}
      {stepNumber !== null && (
        <div style={{
          position: 'absolute',
          top: -6, right: -6,
          width: 18, height: 18,
          borderRadius: '50%',
          background: '#f59e0b',
          border: '2px solid ' + (isDark ? '#0d0f16' : '#fff'),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 900, color: '#000',
          lineHeight: 1,
        }}>
          {stepNumber}
        </div>
      )}
      {/* Completed tick */}
      {place.user_status === 'completed' && !isSelected && (
        <div style={{
          position: 'absolute',
          bottom: -5, right: -5,
          width: 16, height: 16,
          borderRadius: '50%',
          background: '#22c55e',
          border: '2px solid ' + (isDark ? '#0d0f16' : '#fff'),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 8,
        }}>
          ✓
        </div>
      )}
    </div>
  )
}

// ── Cluster bubble component ──────────────────────────────────────────────────
function ClusterMarker({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick() }}
      style={{
        width: 44, height: 44,
        background: 'rgba(34,197,94,0.18)',
        border: '2px solid rgba(34,197,94,0.7)',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        color: '#4ade80',
        fontWeight: 800,
        fontSize: 14,
        boxShadow: '0 0 0 6px rgba(34,197,94,0.12), 0 4px 14px rgba(0,0,0,0.45)',
        backdropFilter: 'blur(4px)',
        transition: 'transform 0.1s',
      }}
    >
      {count}
    </div>
  )
}

// ── User dot ──────────────────────────────────────────────────────────────────
function UserDot({ isDark }: { isDark: boolean }) {
  return (
    <div style={{
      width: 14, height: 14,
      background: '#3b82f6',
      border: '2.5px solid white',
      borderRadius: '50%',
      boxShadow: '0 0 0 5px rgba(59,130,246,0.25), 0 2px 8px rgba(0,0,0,0.4)',
    }} />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function MapView() {
  const mapRef = useRef<MapRef>(null)

  // ── Data state ───────────────────────────────────────────────────────────
  const [places,         setPlaces]         = useState<Place[]>([])
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([])
  const [questSteps,     setQuestSteps]     = useState<QuestStep[]>([])
  const [loading,        setLoading]        = useState(true)

  // ── Map/UI state ─────────────────────────────────────────────────────────
  const [userPos,           setUserPos]          = useState<{ lat: number; lng: number } | null>(null)
  const [showFilters,       setShowFilters]       = useState(false)
  const [showBottomSheet,   setShowBottomSheet]   = useState(false)
  const [selectedPlace,     setSelectedPlace]     = useState<Place | null>(null)
  const [filters,           setFilters]           = useState<MapFilters>({
    type: 'all', category_id: null, status: 'all', search: '',
  })

  // ── Bottom sheet swipe-to-dismiss ────────────────────────────────────────
  const [sheetDragY,  setSheetDragY]  = useState(0)
  const touchStartY = useRef<number>(0)
  const isDragging  = useRef(false)

  const handleSheetTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    isDragging.current = true
  }, [])

  const handleSheetTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return
    const delta = e.touches[0].clientY - touchStartY.current
    if (delta > 0) setSheetDragY(delta) // tylko w dół
  }, [])

  const handleSheetTouchEnd = useCallback(() => {
    isDragging.current = false
    if (sheetDragY > 90) {
      setShowBottomSheet(false)
      setSelectedPlace(null)
    }
    setSheetDragY(0)
  }, [sheetDragY])

  // ── Dark-mode detection ──────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(true) // default dark to avoid flash
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDark(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // ── Zoom state (for clustering) ───────────────────────────────────────────
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)

  // ── Stable ref ────────────────────────────────────────────────────────────
  const filteredPlacesRef = useRef<Place[]>([])
  useEffect(() => { filteredPlacesRef.current = filteredPlaces }, [filteredPlaces])

  // ── Quest step number per place ───────────────────────────────────────────
  const stepNumberByPlace = useMemo<Record<string, number>>(() => {
    const m: Record<string, number> = {}
    questSteps.forEach(s => {
      if (!(s.place_id in m)) m[s.place_id] = s.step_number
    })
    return m
  }, [questSteps])

  // ── Data fetching ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchData() {
      const dataClient = getAppClient()
      const [placesResult, stepsResult] = await Promise.all([
        dataClient.from('places').select(`*, category:categories(*), organization:organizations(id, name)`)
          .eq('is_active', true).limit(200),
        dataClient.from('quest_steps').select(`*, quest:quests(id, title)`).limit(200),
      ])

      const { data: placesData, error } = placesResult
      if (error || !placesData) { setLoading(false); return }

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

  // ── Filter logic ──────────────────────────────────────────────────────────
  useEffect(() => {
    let result = places
    if (filters.type !== 'all') result = result.filter(p => p.type === filters.type)
    if (filters.category_id)   result = result.filter(p => p.category?.slug === filters.category_id)
    if (filters.status !== 'all') result = result.filter(p => p.user_status === filters.status)
    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) || p.short_description?.toLowerCase().includes(q)
      )
    }
    if (userPos) {
      result = result.map(p => ({
        ...p,
        distance: getDistance(userPos.lat, userPos.lng, p.latitude, p.longitude),
      }))
      result.sort((a, b) => (a.distance || 0) - (b.distance || 0))
    }
    setFilteredPlaces(result)
  }, [places, filters, userPos])

  // ── Locate ────────────────────────────────────────────────────────────────
  const handleLocate = useCallback(async () => {
    try {
      const position = await getCurrentPosition()
      const { latitude: lat, longitude: lng } = position.coords
      setUserPos({ lat, lng })
      mapRef.current?.flyTo({ center: [lng, lat], zoom: 16, duration: 1500 })
    } catch {
      console.warn('Brak dostępu do lokalizacji')
    }
  }, [])

  // ── Stable marker click handler ───────────────────────────────────────────
  const handleMarkerClick = useCallback((placeId: string) => {
    const place = filteredPlacesRef.current.find(p => p.id === placeId) ?? null
    setSelectedPlace(place)
    setShowBottomSheet(true)
  }, [])

  // ── Supercluster setup ────────────────────────────────────────────────────
  const supercluster = useMemo(() => {
    const sc = new Supercluster<{ placeId: string }>({ radius: 60, maxZoom: 17 })
    sc.load(
      filteredPlaces.map(p => ({
        type: 'Feature' as const,
        properties: { placeId: p.id },
        geometry: { type: 'Point' as const, coordinates: [p.longitude, p.latitude] },
      }))
    )
    return sc
  }, [filteredPlaces])

  const clusters = useMemo<AnyFeature[]>(() => {
    return supercluster.getClusters([-180, -85, 180, 85], Math.round(zoom)) as AnyFeature[]
  }, [supercluster, zoom])

  // ── Derived ───────────────────────────────────────────────────────────────
  const nearbyPlaces = userPos
    ? filteredPlaces.filter(p => (p.distance || Infinity) < 500).slice(0, 6)
    : filteredPlaces.slice(0, 6)

  const hasActiveFilters = filters.type !== 'all' || filters.category_id !== null || filters.status !== 'all'

  const relatedSteps = selectedPlace
    ? questSteps.filter(s => s.place_id === selectedPlace.id)
    : []

  // ── Missing token fallback ────────────────────────────────────────────────
  if (!MAPBOX_TOKEN) {
    return (
      <div className="relative h-full w-full flex items-center justify-center bg-surface">
        <div className="text-center px-6 max-w-sm">
          <p className="text-4xl mb-4">🗺️</p>
          <p className="text-white font-bold text-lg mb-2">Brak klucza Mapbox</p>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            Dodaj <code className="text-brand-400 font-mono bg-surface-elevated px-1.5 py-0.5 rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code> do pliku <code className="text-brand-400 font-mono bg-surface-elevated px-1.5 py-0.5 rounded">.env.local</code>, aby załadować mapę.
          </p>
          <p className="text-slate-500 text-xs">
            Token uzyskasz bezpłatnie na <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-brand-400 underline">mapbox.com</a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">

      {/* ── Search Bar ─────────────────────────────────────────────────────── */}
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
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            className="flex-1 bg-transparent text-white text-sm placeholder-slate-600 outline-none"
          />
          {filters.search && (
            <button onClick={() => setFilters(f => ({ ...f, search: '' }))}>
              <X className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            width: '44px', height: '44px',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background:  showFilters || hasActiveFilters ? 'rgba(34,197,94,0.2)' : 'rgba(15,17,23,0.82)',
            border: showFilters || hasActiveFilters ? '1.5px solid rgba(34,197,94,0.5)' : '1px solid rgba(45,49,72,0.8)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            color: showFilters || hasActiveFilters ? '#4ade80' : '#94a3b8',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            cursor: 'pointer', flexShrink: 0, position: 'relative',
          }}
        >
          <Filter className="w-4 h-4" />
          {hasActiveFilters && (
            <span style={{
              position: 'absolute', top: -3, right: -3,
              width: 8, height: 8,
              background: '#4ade80', borderRadius: '50%', border: '1.5px solid #0f1117',
            }} />
          )}
        </button>
      </div>

      {/* ── Filter Panel ─────────────────────────────────────────────────── */}
      {showFilters && (
        <div className="absolute top-20 left-4 right-4 z-[500]">
          <MapFiltersPanel filters={filters} onChange={setFilters} onClose={() => setShowFilters(false)} />
        </div>
      )}

      {/* ── Mapbox GL Map ────────────────────────────────────────────────── */}
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          latitude:  BIELSKO_CENTER.lat,
          longitude: BIELSKO_CENTER.lng,
          zoom:      DEFAULT_ZOOM,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={isDark ? STYLE_DARK : STYLE_LIGHT}
        onZoom={(e: any) => setZoom(e.viewState.zoom)}
        // Close bottom sheet on map click (not on a marker)
        onClick={(_e: any) => {
          if (selectedPlace) {
            setSelectedPlace(null)
            setShowBottomSheet(false)
          }
        }}
        attributionControl={false}
      >
        {/* Clusters + individual markers */}
        {clusters.map((feature) => {
          const [lng, lat] = feature.geometry.coordinates

          if (feature.properties.cluster) {
            const clusterId   = (feature as ClusterFeature).id as number
            const pointCount  = feature.properties.point_count
            return (
              <Marker key={`cluster-${clusterId}`} longitude={lng} latitude={lat} anchor="center">
                <ClusterMarker
                  count={pointCount}
                  onClick={() => {
                    const expansionZoom = supercluster.getClusterExpansionZoom(clusterId)
                    mapRef.current?.flyTo({ center: [lng, lat], zoom: expansionZoom + 1, duration: 800 })
                  }}
                />
              </Marker>
            )
          }

          // Individual place marker
          const placeId = feature.properties.placeId
          const place   = filteredPlaces.find(p => p.id === placeId)
          if (!place) return null

          const isSelected = selectedPlace?.id === place.id
          const stepNum    = stepNumberByPlace[place.id] ?? null

          return (
            <Marker key={place.id} longitude={place.longitude} latitude={place.latitude} anchor="center">
              <PlaceMarker
                place={place}
                isSelected={isSelected}
                stepNumber={stepNum}
                isDark={isDark}
                onClick={() => handleMarkerClick(place.id)}
              />
            </Marker>
          )
        })}

        {/* User position dot */}
        {userPos && (
          <Marker longitude={userPos.lng} latitude={userPos.lat} anchor="center">
            <UserDot isDark={isDark} />
          </Marker>
        )}
      </Map>

      {/* ── Location button (outside Map, absolute over it) ───────────────── */}
      <button
        onClick={handleLocate}
        style={{
          position: 'absolute',
          bottom: '108px', right: '16px',
          zIndex: 400,
          width: '44px', height: '44px',
          borderRadius: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: userPos ? 'rgba(34,197,94,0.15)' : 'rgba(26,29,39,0.95)',
          border: userPos ? '1.5px solid rgba(34,197,94,0.5)' : '1px solid rgba(45,49,72,0.9)',
          boxShadow: userPos
            ? '0 0 16px rgba(34,197,94,0.25), 0 4px 12px rgba(0,0,0,0.4)'
            : '0 4px 12px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(12px)',
          color: userPos ? '#4ade80' : '#94a3b8',
          transition: 'all 0.2s',
          cursor: 'pointer',
        }}
        title="Moja lokalizacja"
      >
        <Navigation className="w-5 h-5" style={{ fill: userPos ? 'rgba(74,222,128,0.2)' : 'none' }} />
      </button>

      {/* ── Count Pill ───────────────────────────────────────────────────── */}
      {!showBottomSheet && (
        <button
          onClick={() => setShowBottomSheet(true)}
          style={{
            position: 'absolute',
            bottom: '80px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 400,
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'rgba(15,17,23,0.88)',
            border: '1px solid rgba(45,49,72,0.9)',
            borderRadius: '999px',
            padding: '8px 16px',
            color: '#cbd5e1',
            fontSize: '13px', fontWeight: 600,
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

      {/* ── Bottom Sheet ─────────────────────────────────────────────────── */}
      {showBottomSheet && (
        <div
          className="animate-slide-up"
          onTouchStart={handleSheetTouchStart}
          onTouchMove={handleSheetTouchMove}
          onTouchEnd={handleSheetTouchEnd}
          style={{
            position: 'fixed',
            bottom: 'calc(72px + env(safe-area-inset-bottom))',
            left: '50%',
            transform: `translateX(-50%) translateY(${sheetDragY}px)`,
            transition: isDragging.current ? 'none' : 'transform 0.25s ease',
            width: '100%', maxWidth: '480px',
            background: isDark ? 'rgba(13,15,22,0.98)' : 'rgba(250,252,255,0.98)',
            backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
            borderTop: isDark ? '1px solid rgba(55,60,84,0.7)' : '1px solid rgba(200,210,230,0.7)',
            borderLeft: isDark ? '1px solid rgba(55,60,84,0.4)' : '1px solid rgba(200,210,230,0.4)',
            borderRight: isDark ? '1px solid rgba(55,60,84,0.4)' : '1px solid rgba(200,210,230,0.4)',
            borderRadius: '24px 24px 0 0',
            boxShadow: isDark ? '0 -12px 48px rgba(0,0,0,0.7)' : '0 -12px 48px rgba(0,0,0,0.15)',
            zIndex: 1000,
            maxHeight: '65vh',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Drag handle — powiększony obszar dotyku */}
          <div className="flex items-center justify-center flex-shrink-0"
            style={{ minHeight: 32, cursor: 'grab', paddingTop: 10, paddingBottom: 4 }}>
            <div style={{
              width: 44, height: 5, borderRadius: 99,
              background: isDark ? 'rgba(71,85,105,0.6)' : 'rgba(150,165,185,0.5)',
            }} />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-0 pb-2 flex-shrink-0">
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: isDark ? '#64748b' : '#94a3b8' }}>
              {selectedPlace ? 'Wybrany punkt' : userPos ? 'Blisko Ciebie' : 'Odkryj punkty'}
            </p>
            {/* 44×44 touch target wokół małego przycisku */}
            <button
              onClick={() => { setShowBottomSheet(false); setSelectedPlace(null) }}
              aria-label="Zamknij panel"
              style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'transparent', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', margin: '-8px -4px -8px 0',
              }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: 10,
                background: isDark ? 'rgba(45,49,72,0.7)' : 'rgba(220,225,235,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: isDark ? '1px solid rgba(71,85,105,0.4)' : '1px solid rgba(180,190,210,0.5)',
              }}>
                <X className="w-4 h-4" style={{ color: isDark ? '#94a3b8' : '#64748b' }} />
              </div>
            </button>
          </div>

          {/* ── Scrollable content ── */}
          <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>

            {/* Selected place detail */}
            {selectedPlace && (
              <div className="px-5 pb-5 space-y-4">

                {/* Meta badges + title */}
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
                      <span style={{ fontSize: 12, fontWeight: 500, color: isDark ? '#64748b' : '#94a3b8' }}>
                        {formatDistance(selectedPlace.distance)}
                      </span>
                    )}
                    {selectedPlace.user_status === 'completed' && (
                      <span className="text-brand-400 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Zaliczone
                      </span>
                    )}
                  </div>
                  <h2 style={{ color: isDark ? '#fff' : '#0f172a', fontSize: '20px', fontWeight: 900, lineHeight: 1.2 }}>
                    {selectedPlace.name}
                  </h2>
                  {selectedPlace.short_description && (
                    <p style={{ color: isDark ? '#94a3b8' : '#475569', fontSize: 14, marginTop: 6, lineHeight: 1.5 }}
                      className="line-clamp-2">
                      {selectedPlace.short_description}
                    </p>
                  )}
                </div>

                {/* Hint */}
                {selectedPlace.hint && (
                  <div style={{
                    padding: '12px 14px', borderRadius: 16,
                    background: isDark ? 'rgba(250,204,21,0.07)' : 'rgba(250,204,21,0.1)',
                    border: isDark ? '1px solid rgba(250,204,21,0.18)' : '1px solid rgba(250,204,21,0.35)',
                  }}>
                    <p style={{ color: '#facc15', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      💡 Wskazówka
                    </p>
                    <p style={{ color: isDark ? '#cbd5e1' : '#334155', fontSize: 14, lineHeight: 1.55 }}>
                      {selectedPlace.hint}
                    </p>
                  </div>
                )}

                {/* Task */}
                {selectedPlace.task_content && (
                  <div style={{
                    padding: '12px 14px', borderRadius: 16,
                    background: isDark ? 'rgba(34,197,94,0.07)' : 'rgba(34,197,94,0.08)',
                    border: isDark ? '1px solid rgba(34,197,94,0.18)' : '1px solid rgba(34,197,94,0.3)',
                  }}>
                    <p style={{ color: '#4ade80', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      🎯 Zadanie
                    </p>
                    <p style={{ color: isDark ? '#e2e8f0' : '#1e293b', fontSize: 14, lineHeight: 1.55 }}>
                      {selectedPlace.task_content}
                    </p>
                  </div>
                )}

                {/* Quest step */}
                {relatedSteps.length > 0 && (
                  <div style={{
                    padding: '12px 14px', borderRadius: 16,
                    background: isDark ? 'rgba(245,158,11,0.07)' : 'rgba(245,158,11,0.08)',
                    border: isDark ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(245,158,11,0.35)',
                  }}>
                    <p style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>
                      🗺️ Etap questa
                    </p>
                    <div className="space-y-2.5">
                      {relatedSteps.map((step: any) => (
                        <div key={step.id} className="flex items-start gap-3">
                          <div style={{
                            width: 24, height: 24, borderRadius: '50%',
                            background: 'rgba(245,158,11,0.25)', color: '#f59e0b',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 900, flexShrink: 0, marginTop: 1,
                          }}>
                            {step.step_number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p style={{ color: isDark ? '#fff' : '#0f172a', fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>
                              {step.title}
                            </p>
                            {step.quest?.title && (
                              <p style={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: 12, marginTop: 2 }}>
                                {step.quest.title}
                              </p>
                            )}
                          </div>
                          {selectedPlace.user_status === 'completed'
                            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#4ade80' }} />
                            : <Lock className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-600" />
                          }
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Nearby list (no selected place) */}
            {!selectedPlace && nearbyPlaces.length > 0 && (
              <div className="px-5 pb-5">
                <p style={{ color: '#64748b', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>
                  {userPos ? '📍 Blisko Ciebie' : '🗺️ Wszystkie miejsca'}
                </p>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {nearbyPlaces.map(p => (
                    <Link
                      key={p.id}
                      href={`/place/${p.id}`}
                      className="flex-shrink-0 w-40 p-3.5 rounded-2xl transition-all active:scale-95"
                      style={{
                        background: isDark ? 'rgba(22,26,38,0.9)' : 'rgba(240,244,250,0.9)',
                        border: isDark ? '1px solid rgba(55,60,84,0.7)' : '1px solid rgba(200,210,230,0.7)',
                      }}
                    >
                      <p className="text-2xl mb-2">{PLACE_TYPE_ICONS[p.type]}</p>
                      <p style={{ color: isDark ? '#fff' : '#0f172a', fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}
                        className="line-clamp-2 mb-1">
                        {p.name}
                      </p>
                      {p.distance != null && (
                        <p style={{ color: '#64748b', fontSize: 11 }}>{formatDistance(p.distance)}</p>
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

          {/* ── Sticky CTA ── */}
          {selectedPlace && (
            <div className="flex-shrink-0 px-5 pt-3 pb-5"
              style={{ borderTop: isDark ? '1px solid rgba(55,60,84,0.5)' : '1px solid rgba(200,210,230,0.5)' }}>
              <Link
                href={`/place/${selectedPlace.id}`}
                style={{
                  display: 'block', width: '100%', textAlign: 'center',
                  padding: '14px 20px', borderRadius: 16,
                  background: selectedPlace.user_status === 'completed'
                    ? 'rgba(34,197,94,0.15)'
                    : 'linear-gradient(135deg, #16a34a, #22c55e)',
                  color: selectedPlace.user_status === 'completed' ? '#4ade80' : '#fff',
                  fontWeight: 800, fontSize: 15,
                  border: selectedPlace.user_status === 'completed' ? '1px solid rgba(34,197,94,0.3)' : 'none',
                  boxShadow: selectedPlace.user_status === 'completed' ? 'none' : '0 6px 20px rgba(34,197,94,0.35)',
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
