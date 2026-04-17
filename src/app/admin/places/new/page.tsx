'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, MapPin } from 'lucide-react'
import Link from 'next/link'
import { PlaceType } from '@/lib/types'
import { getAppClient } from '@/lib/data-client'
import { PLACE_TYPE_LABELS } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(2, 'Nazwa musi mieć minimum 2 znaki'),
  type: z.enum(['ngo', 'city', 'quest', 'event']),
  short_description: z.string().max(200, 'Maksymalnie 200 znaków'),
  description: z.string(),
  full_description: z.string().optional(),
  latitude: z.number().min(49).max(51, 'Nieprawidłowa szerokość geograficzna'),
  longitude: z.number().min(18).max(21, 'Nieprawidłowa długość geograficzna'),
  address: z.string().optional(),
  hint: z.string().optional(),
  task_content: z.string().optional(),
  unlockable_content: z.string().optional(),
  verification_type: z.enum(['gps', 'qr', 'password', 'answer']),
  gps_radius: z.number().min(5).max(500).default(50),
  is_active: z.boolean().default(true),
  is_promoted: z.boolean().default(false),
})

type FormData = z.infer<typeof schema>

export default function NewPlacePage() {
  const router = useRouter()
  const defaultType: PlaceType = 'ngo'

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: defaultType,
      verification_type: 'gps',
      gps_radius: 50,
      is_active: true,
      is_promoted: false,
    },
  })

  const vType = watch('verification_type')

  async function onSubmit(data: FormData) {
    setSubmitting(true)
    setError('')

    const dataClient = getAppClient()
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Date.now()

    const { error: insertError } = await dataClient.from('places').insert({
      ...data,
      slug,
    })

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    router.push('/admin/places')
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/places" className="w-9 h-9 card flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-slate-400" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Nowy punkt</h1>
          <p className="text-slate-400 text-sm">Dodaj punkt do mapy MiejskiTrop</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Podstawowe informacje */}
        <section className="card p-5 space-y-4">
          <h2 className="text-white font-semibold">Podstawowe informacje</h2>

          <FormField label="Nazwa punktu *" error={errors.name?.message}>
            <input {...register('name')} placeholder="np. Caritas Diecezji Bielsko-Żywieckiej"
              className="input-field" />
          </FormField>

          <FormField label="Typ punktu *" error={errors.type?.message}>
            <div className="grid grid-cols-2 gap-2">
              {(['ngo', 'city', 'quest', 'event'] as PlaceType[]).map((type) => (
                <label key={type} className="flex items-center gap-2 card p-2.5 cursor-pointer">
                  <input type="radio" value={type} {...register('type')} className="accent-brand-500" />
                  <span className="text-slate-300 text-sm">{PLACE_TYPE_LABELS[type]}</span>
                </label>
              ))}
            </div>
          </FormField>

          <FormField label="Krótki opis (do 200 zn.)" error={errors.short_description?.message}>
            <textarea {...register('short_description')} rows={2}
              placeholder="Jednozdaniowy opis widoczny na liście"
              className="input-field resize-none" />
          </FormField>

          <FormField label="Pełny opis" error={errors.description?.message}>
            <textarea {...register('description')} rows={4}
              placeholder="Szczegółowy opis miejsca lub organizacji..."
              className="input-field resize-none" />
          </FormField>
        </section>

        {/* Lokalizacja */}
        <section className="card p-5 space-y-4">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-400" />
            Lokalizacja
          </h2>

          <FormField label="Adres" error={errors.address?.message}>
            <input {...register('address')} placeholder="ul. Przykładowa 1, Bielsko-Biała"
              className="input-field" />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Szerokość (lat) *" error={errors.latitude?.message}>
              <input type="number" step="0.000001" {...register('latitude', { valueAsNumber: true })}
                placeholder="49.8224" className="input-field" />
            </FormField>
            <FormField label="Długość (lng) *" error={errors.longitude?.message}>
              <input type="number" step="0.000001" {...register('longitude', { valueAsNumber: true })}
                placeholder="19.0444" className="input-field" />
            </FormField>
          </div>

          <p className="text-slate-500 text-xs">
            💡 Współrzędne możesz sprawdzić klikając prawym przyciskiem w Google Maps
          </p>
        </section>

        {/* Zaliczanie */}
        <section className="card p-5 space-y-4">
          <h2 className="text-white font-semibold">Sposób zaliczenia</h2>

          <FormField label="Typ weryfikacji *">
            <select {...register('verification_type')} className="input-field">
              <option value="gps">📍 GPS — wejście w promień</option>
              <option value="qr">📷 Kod QR</option>
              <option value="password">🔑 Hasło</option>
              <option value="answer">❓ Odpowiedź na pytanie</option>
            </select>
          </FormField>

          {vType === 'gps' && (
            <FormField label="Promień GPS (m)" error={errors.gps_radius?.message}>
              <input type="number" {...register('gps_radius', { valueAsNumber: true })}
                placeholder="50" className="input-field" />
            </FormField>
          )}

          <FormField label="Wskazówka" error={errors.hint?.message}>
            <input {...register('hint')} placeholder="Podpowiedź jak dotrzeć do punktu..."
              className="input-field" />
          </FormField>

          <FormField label="Treść zadania" error={errors.task_content?.message}>
            <textarea {...register('task_content')} rows={2}
              placeholder="Co użytkownik ma zrobić przy punkcie..."
              className="input-field resize-none" />
          </FormField>

          <FormField label="Treść odblokowana po zaliczeniu" error={errors.unlockable_content?.message}>
            <textarea {...register('unlockable_content')} rows={3}
              placeholder="Ciekawostka, informacja lub nagroda widoczna po zaliczeniu..."
              className="input-field resize-none" />
          </FormField>
        </section>

        {/* Ustawienia */}
        <section className="card p-5 space-y-3">
          <h2 className="text-white font-semibold">Ustawienia</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register('is_active')} className="accent-brand-500 w-4 h-4" />
            <span className="text-slate-300 text-sm">Aktywny (widoczny w aplikacji)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register('is_promoted')} className="accent-brand-500 w-4 h-4" />
            <span className="text-slate-300 text-sm">Promowany (wyróżniony na mapie)</span>
          </label>
        </section>

        {/* Błąd */}
        {error && (
          <div className="card p-3 border-red-500/40 bg-red-500/10">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <Link href="/admin/places" className="btn-secondary flex-1 text-center">
            Anuluj
          </Link>
          <button type="submit" disabled={submitting}
            className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            {submitting ? 'Zapisywanie...' : 'Zapisz punkt'}
          </button>
        </div>
      </form>
    </div>
  )
}

function FormField({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-slate-400 text-sm mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}
