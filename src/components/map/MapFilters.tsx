'use client'

import { X } from 'lucide-react'
import { MapFilters, PlaceType } from '@/lib/types'
import { PLACE_TYPE_ICONS, cn } from '@/lib/utils'
import { DEFAULT_CATEGORIES } from '@/lib/constants'

interface MapFiltersPanelProps {
  filters: MapFilters
  onChange: (filters: MapFilters) => void
  onClose: () => void
}

const TYPE_OPTIONS: { value: PlaceType | 'all'; label: string }[] = [
  { value: 'all', label: 'Wszystkie' },
  { value: 'ngo', label: 'NGO' },
  { value: 'city', label: 'Miejsca' },
  { value: 'quest', label: 'Quest' },
  { value: 'event', label: 'Event' },
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'Wszystkie' },
  { value: 'undiscovered', label: '⚪ Nieodkryte' },
  { value: 'completed', label: '✅ Zaliczone' },
] as const

export default function MapFiltersPanel({ filters, onChange, onClose }: MapFiltersPanelProps) {
  const update = (patch: Partial<MapFilters>) => onChange({ ...filters, ...patch })
  const hasActiveFilters =
    filters.type !== 'all' || filters.category_id !== null || filters.status !== 'all'

  return (
    <div
      className="p-4 shadow-2xl animate-fade-in"
      style={{
        background: 'rgba(15,17,23,0.95)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(45,49,72,0.9)',
        borderRadius: '20px',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-bold text-sm">Filtry</h3>
          {hasActiveFilters && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}
            >
              Aktywne
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={() => onChange({ type: 'all', category_id: null, status: 'all', search: filters.search })}
              className="text-brand-400 text-xs font-semibold"
            >
              Wyczyść
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(45,49,72,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Type */}
      <div className="mb-4">
        <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-2">Typ</p>
        <div className="flex gap-1.5 flex-wrap">
          {TYPE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => update({ type: value })}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
              style={{
                background: filters.type === value
                  ? 'rgba(34,197,94,0.2)'
                  : 'rgba(26,29,39,0.8)',
                border: filters.type === value
                  ? '1px solid rgba(34,197,94,0.5)'
                  : '1px solid rgba(45,49,72,0.8)',
                color: filters.type === value ? '#4ade80' : '#94a3b8',
              }}
            >
              {value !== 'all' && <span className="mr-1">{PLACE_TYPE_ICONS[value as PlaceType]}</span>}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div className="mb-4">
        <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-2">Kategoria</p>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => update({ category_id: null })}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
            style={{
              background: filters.category_id === null ? 'rgba(34,197,94,0.2)' : 'rgba(26,29,39,0.8)',
              border: filters.category_id === null ? '1px solid rgba(34,197,94,0.5)' : '1px solid rgba(45,49,72,0.8)',
              color: filters.category_id === null ? '#4ade80' : '#94a3b8',
            }}
          >
            Wszystkie
          </button>
          {DEFAULT_CATEGORIES.slice(0, 6).map((cat) => (
            <button
              key={cat.slug}
              onClick={() => update({ category_id: cat.slug })}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
              style={{
                background: filters.category_id === cat.slug ? 'rgba(34,197,94,0.2)' : 'rgba(26,29,39,0.8)',
                border: filters.category_id === cat.slug ? '1px solid rgba(34,197,94,0.5)' : '1px solid rgba(45,49,72,0.8)',
                color: filters.category_id === cat.slug ? '#4ade80' : '#94a3b8',
              }}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div>
        <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-2">Status</p>
        <div className="flex gap-1.5">
          {STATUS_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => update({ status: value })}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
              style={{
                background: filters.status === value ? 'rgba(34,197,94,0.2)' : 'rgba(26,29,39,0.8)',
                border: filters.status === value ? '1px solid rgba(34,197,94,0.5)' : '1px solid rgba(45,49,72,0.8)',
                color: filters.status === value ? '#4ade80' : '#94a3b8',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
