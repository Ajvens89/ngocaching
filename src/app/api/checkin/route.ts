import { NextRequest, NextResponse } from 'next/server'
import { createServerDataClient } from '@/lib/data-server'
import { getDistance } from '@/lib/geo'
import { POINTS_PER_ACTION } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { place_id, method, latitude, longitude, password, answer } = body

    if (!place_id || !method) {
      return NextResponse.json({ success: false, error: 'Brakuje wymaganych danych.' }, { status: 400 })
    }

    const dataClient = createServerDataClient()
    const { data: { user } } = await dataClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Musisz być zalogowany.' }, { status: 401 })
    }

    // Idempotency guard: sprawdź czy już zaliczone PRZED dalszą walidacją
    const { data: existingCheckin } = await dataClient
      .from('checkins').select('id, points_earned').eq('user_id', user.id).eq('place_id', place_id).maybeSingle()

    if (existingCheckin) {
      return NextResponse.json({
        success: true,
        already_checked: true,
        points_earned: existingCheckin.points_earned,
      })
    }

    // Pobierz punkt (verification_data tylko server-side — nigdy nie wraca do klienta)
    const { data: place } = await dataClient
      .from('places')
      .select('id, latitude, longitude, gps_radius, verification_type, verification_data, unlockable_content')
      .eq('id', place_id)
      .eq('is_active', true)
      .single()

    if (!place) {
      return NextResponse.json({ success: false, error: 'Punkt nie istnieje.' }, { status: 404 })
    }

    // ── Weryfikacja ────────────────────────────────────────────────
    switch (method) {
      case 'gps': {
        if (!latitude || !longitude) {
          return NextResponse.json({ success: false, error: 'Brak danych GPS.' }, { status: 400 })
        }
        const dist = getDistance(latitude, longitude, place.latitude, place.longitude)
        if (dist > (place.gps_radius || 50)) {
          return NextResponse.json({
            success: false,
            error: `Za daleko od punktu (${Math.round(dist)} m). Zbliż się na ${place.gps_radius || 50} m.`,
          }, { status: 400 })
        }
        break
      }
      case 'password': {
        // Porównanie TYLKO server-side — klient nigdy nie widzi hasła
        const expected = String((place.verification_data as any)?.password || '').trim().toLowerCase()
        const given    = String(password || '').trim().toLowerCase()
        if (expected && given !== expected) {
          return NextResponse.json({ success: false, error: 'Błędne hasło. Spróbuj ponownie.' }, { status: 400 })
        }
        break
      }
      case 'answer': {
        // Porównanie TYLKO server-side — klient nigdy nie widzi odpowiedzi
        const vData    = place.verification_data as any
        const given    = String(answer || '').trim().toLowerCase()
        const primary  = String(vData?.answer || '').trim().toLowerCase()
        // Opcjonalne accepted_answers[] — tablica akceptowanych wariantów
        const accepted: string[] = Array.isArray(vData?.accepted_answers)
          ? vData.accepted_answers.map((a: unknown) => String(a).trim().toLowerCase())
          : primary ? [primary] : []
        if (accepted.length > 0 && !accepted.includes(given)) {
          return NextResponse.json({ success: false, error: 'Błędna odpowiedź. Spróbuj ponownie.' }, { status: 400 })
        }
        break
      }
      case 'qr':
        break // walidacja QR odbywa się w /api/qr/[code]
      default:
        return NextResponse.json({ success: false, error: 'Nieznana metoda weryfikacji.' }, { status: 400 })
    }

    // ── Wstaw check-in ─────────────────────────────────────────────
    const pointsMap: Record<string, number> = {
      gps:      POINTS_PER_ACTION.gps_checkin,
      qr:       POINTS_PER_ACTION.qr_checkin,
      answer:   POINTS_PER_ACTION.answer_checkin,
      password: POINTS_PER_ACTION.answer_checkin,
    }
    const points = pointsMap[method] ?? 10

    await dataClient.from('checkins').insert({
      user_id: user.id,
      place_id,
      quest_step_id: null,
      verification_method: method,
      latitude_at_checkin:  latitude  ?? null,
      longitude_at_checkin: longitude ?? null,
      points_earned: points,
      verified_at: new Date().toISOString(),
      notes: null,
    })

    // ── Automatyczny update progresu questów ───────────────────────
    // Szukamy wszystkich etapów questów, w których ten punkt wystąpuje
    let questCompleted = false

    try {
      const { data: stepsForPlace, error: stepsError } = await dataClient
        .from('quest_steps')
        .select('id, quest_id, step_number')
        .eq('place_id', place_id)

      if (stepsError) throw stepsError

      if (stepsForPlace && stepsForPlace.length > 0) {
        // Track badges awarded in this request to avoid duplicate inserts
        const awardedBadgesThisRequest = new Set<string>()

        for (const step of stepsForPlace) {
          // Pobierz aktualny progress użytkownika dla tego questu
          const { data: progress } = await dataClient
            .from('user_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('quest_id', step.quest_id)
            .maybeSingle()

          if (!progress) continue // użytkownik nie rozpoczął tego questu — skip

          if (progress.steps_completed.includes(step.step_number)) continue // już zaliczone

          const newCompleted: number[] = [...new Set([...progress.steps_completed, step.step_number])].sort((a, b) => a - b)

          // Sprawdź czy quest ukończony
          const { data: allSteps, error: allStepsError } = await dataClient
            .from('quest_steps')
            .select('step_number, is_optional')
            .eq('quest_id', step.quest_id)

          if (allStepsError) throw allStepsError

          const requiredSteps = (allSteps ?? []).filter((s: any) => !s.is_optional)
          const requiredNums  = requiredSteps.map((s: any) => s.step_number)

          // Guard: quest with 0 required steps must not be auto-completed
          if (requiredNums.length === 0) continue

          const isCompleted = requiredNums.every((n: number) => newCompleted.includes(n))

          await dataClient.from('user_progress').update({
            steps_completed: newCompleted,
            current_step:    newCompleted[newCompleted.length - 1] + 1,
            is_completed:    isCompleted,
            completed_at:    isCompleted ? new Date().toISOString() : null,
          }).eq('id', progress.id)

          if (isCompleted) {
            questCompleted = true
            // Przyznaj odznakę jeśli quest ma badge
            const { data: quest } = await dataClient
              .from('quests').select('badge_id').eq('id', step.quest_id).single()
            if (quest?.badge_id) {
              // Guard against duplicate badge award within this request
              if (!awardedBadgesThisRequest.has(quest.badge_id)) {
                const { data: existingBadge } = await dataClient
                  .from('user_badges')
                  .select('badge_id')
                  .eq('user_id', user.id)
                  .eq('badge_id', quest.badge_id)
                  .maybeSingle()
                if (!existingBadge) {
                  awardedBadgesThisRequest.add(quest.badge_id)
                  await dataClient.from('user_badges').insert({
                    user_id: user.id,
                    badge_id: quest.badge_id,
                    earned_at: new Date().toISOString(),
                  })
                }
              }
            }
          }
        }
      }
    } catch (progressError) {
      // Quest progress update failure must not fail the checkin itself
      console.error('Quest progress update error (non-fatal):', progressError)
    }

    return NextResponse.json({
      success: true,
      points_earned: points,
      quest_completed: questCompleted,
      unlockable_content: (place.unlockable_content as string | null) ?? null,
    })
  } catch (error) {
    console.error('Checkin error:', error)
    return NextResponse.json({ success: false, error: 'Wewnętrzny błąd serwera.' }, { status: 500 })
  }
}
