'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Play } from 'lucide-react'
import { getAppClient } from '@/lib/data-client'

export default function StartQuestButton({ questId }: { questId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const dataClient = getAppClient()
  // Double-click guard
  const submittingRef = useRef(false)

  async function handleStart() {
    if (submittingRef.current) return
    submittingRef.current = true
    setLoading(true)

    try {
      const { data: { user } } = await dataClient.auth.getUser()
      if (!user) {
        setLoading(false)
        submittingRef.current = false
        router.push('/auth/login')
        return
      }

      // Sprawdź czy progress już istnieje
      const { data: existing } = await dataClient
        .from('user_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('quest_id', questId)
        .maybeSingle()

      if (!existing) {
        await dataClient.from('user_progress').insert({
          user_id: user.id,
          quest_id: questId,
          started_at: new Date().toISOString(),
          current_step: 1,
          steps_completed: [],
          is_completed: false,
          completed_at: null,
        })
      }

      setLoading(false)
      submittingRef.current = false
      // Odśwież stronę — pokaże postęp
      router.refresh()
    } catch (err) {
      console.error('StartQuest error:', err)
      setLoading(false)
      submittingRef.current = false
    }
  }

  return (
    <button
      onClick={handleStart}
      disabled={loading}
      className="btn-primary w-full flex items-center justify-center gap-2"
    >
      {loading
        ? <><Loader2 className="w-4 h-4 animate-spin" /> Rozpoczynanie...</>
        : <><Play className="w-4 h-4" /> Rozpocznij quest</>
      }
    </button>
  )
}
