'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { useCallback, useTransition } from 'react'

export default function SearchBar({ defaultValue = '' }: { defaultValue?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const handleChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set('q', value)
      } else {
        params.delete('q')
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname, searchParams]
  )

  return (
    <div
      className="flex items-center gap-2 mt-4 px-3 py-2.5 rounded-xl"
      style={{ background: 'rgba(26,29,39,1)', border: '1px solid rgba(45,49,72,0.8)' }}
    >
      <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
      <input
        type="search"
        defaultValue={defaultValue}
        placeholder="Szukaj NGO, miejsc, kategorii..."
        onChange={(e) => handleChange(e.target.value)}
        className="flex-1 bg-transparent text-white text-sm placeholder-slate-600 outline-none"
      />
      {defaultValue && (
        <button onClick={() => handleChange('')}>
          <X className="w-4 h-4 text-slate-500" />
        </button>
      )}
    </div>
  )
}
