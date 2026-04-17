'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
  fallbackHref?: string
  className?: string
}

export default function BackButton({ fallbackHref = '/', className }: BackButtonProps) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      aria-label="Wróć"
      className={
        className ??
        'w-10 h-10 rounded-xl bg-surface-card/80 backdrop-blur border border-surface-border flex items-center justify-center transition-all active:scale-95'
      }
    >
      <ArrowLeft className="w-5 h-5 text-white" />
    </button>
  )
}
