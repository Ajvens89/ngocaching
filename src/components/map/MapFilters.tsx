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
  { value: 'undiscovered', label: 'Nieodkryte' },
  { value: 'completed', label: 'Zaliczone' },
] as const

export default function MapFiltersPanel({ filters, onChange, onClose }: MapFiltersPanelProps) {
  const update = (patch: Partial<MapFilters>) => onChange({ ...filters, ...patch })

  const hasActiveFilters =
    filters.type !== 'all' || filters.category_id !== null || filters.status !== 'all'

  return (
    <div className="card-elevated p-4 shadow-xl animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm">Filtry</h3>
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={() => onChange({ type: 'all', category_id: null, status: 'all', search: filters.search })}
              className="text-brand-400 text-xs"
            >
              Wyczyść
            </button>
          )}
          <button onClick={onClose}>
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Typ punktu */}
      <div className="mb-4">
        <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Typ</p>
        <div className="flex gap-1.5 flex-wrap">
          {TYPE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => update({ type: value })}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filters.type === value
                  ? 'bg-brand-500 text-white'
                  : 'bg-surface-card border border-surface-border text-slate-400 hover:text-slate-200'
              )}
            >
              {value !== 'all' && <span className="mr-1">{PLACE_TYPE_ICONS[value as PlaceType]}</span>}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Kategoria */}
      <div className="mb-4">
        <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Kategoria</p>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => update({ category_id: null })}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              filters.category_id === null
                ? 'bg-brand-500 text-white'
                : 'bg-surface-card border border-surface-border text-slate-400'
            )}
          >
            Wszystkie
          </button>
          {DEFAULT_CATEGORIES.slice(0, 6).map((cat) => (
            <button
              key={cat.slug}
              onClick={() => update({ category_id: cat.slug })}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filters.category_id === cat.slug
                  ? 'bg-brand-500 text-white'
                  : 'bg-surface-card border border-surface-border text-slate-400'
              )}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div>
        <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Status</p>
        <div className="flex gap-1.5">
          {STATUS_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => update({ status: value })}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filters.status === value
                  ? 'bg-brand-500 text-white'
                  : 'bg-surface-card border border-surface-border text-slate-400'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
