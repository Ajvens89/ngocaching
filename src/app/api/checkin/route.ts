import { NextRequest, NextResponse } from 'next/server'
import { createServerDataClient } from '@/lib/data-server'
import { getDistance } from '@/lib/geo'
import { POINTS_PER_ACTION } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { place_id, method, latitude, longitude, password, answer, quest_step_id } = body

    if (!place_id || !method) {
      return NextResponse.json({ success: false, error: 'Brakuje wymaganych danych.' }, { status: 400 })
    }

    const dataClient = createServerDataClient()
    const { data: { user } } = await dataClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Musisz być zalogowany.' }, { status: 401 })
    }

    const { data: place } = await dataClient.from('places').select('*').eq('id', place_id).eq('is_active', true).single()
    if (!place) {
      return NextResponse.json({ success: false, error: 'Punkt nie istnieje.' }, { status: 404 })
    }

    const { data: existingCheckin } = await dataClient.from('checkins').select('*').eq('user_id', user.id).eq('place_id', place_id).maybeSingle()
    if (existingCheckin) {
      return NextResponse.json({ success: false, error: 'Ten punkt już jest zaliczony.' }, { status: 409 })
    }

    let verified = false
    switch (method) {
      case 'gps': {
        if (!latitude || !longitude) {
          return NextResponse.json({ success: false, error: 'Brak danych GPS.' }, { status: 400 })
        }
        const distance = getDistance(latitude, longitude, place.latitude, place.longitude)
        const radius = place.gps_radius || 50
        if (distance > radius) {
          return NextResponse.json({ success: false, error: `Za daleko od punktu (${Math.round(distance)} m).` }, { status: 400 })
        }
        verified = true
        break
      }
      case 'password': {
        const expected = (place.verification_data as any)?.password || 'pomoc'
        verified = String(password || '').trim().toLowerCase() === String(expected).trim().toLowerCase()
        if (!verified) return NextResponse.json({ success: false, error: 'Błędne hasło.' }, { status: 400 })
        break
      }
      case 'answer': {
        const expected = (place.verification_data as any)?.answer || 'bielsko'
        verified = String(answer || '').trim().toLowerCase() === String(expected).trim().toLowerCase()
        if (!verified) return NextResponse.json({ success: false, error: 'Błędna odpowiedź.' }, { status: 400 })
        break
      }
      case 'qr': {
        verified = true
        break
      }
      default:
        return NextResponse.json({ success: false, error: 'Nieznana metoda weryfikacji.' }, { status: 400 })
    }

    const pointsMap: Record<string, number> = {
      gps: POINTS_PER_ACTION.gps_checkin,
      qr: POINTS_PER_ACTION.qr_checkin,
      answer: POINTS_PER_ACTION.answer_checkin,
      password: POINTS_PER_ACTION.answer_checkin,
    }
    const points = pointsMap[method] || 10

    const { data: checkin } = await dataClient
      .from('checkins')
      .insert({
        user_id: user.id,
        place_id,
        quest_step_id: quest_step_id || null,
        verification_method: method,
        latitude_at_checkin: latitude || null,
        longitude_at_checkin: longitude || null,
        points_earned: points,
        verified_at: new Date().toISOString(),
        notes: null,
      })
      .select()
      .single()

    let questCompleted = false
    if (quest_step_id) {
      const { data: step } = await dataClient.from('quest_steps').select('*').eq('id', quest_step_id).single()
      if (step?.quest_id) {
        questCompleted = await updateQuestProgress(dataClient as any, user.id, step.quest_id, step.step_number)
      }
    }

    return NextResponse.json({ success: true, checkin, points_earned: points, quest_completed: questCompleted })
  } catch (error) {
    console.error('Checkin error:', error)
    return NextResponse.json({ success: false, error: 'Wewnętrzny błąd serwera.' }, { status: 500 })
  }
}

async function updateQuestProgress(client: any, userId: string, questId: string, stepNumber: number) {
  const { data: existing } = await client.from('user_progress').select('*').eq('user_id', userId).eq('quest_id', questId).maybeSingle()
  const currentSteps = Array.from(new Set([...(existing?.steps_completed || []), stepNumber])).sort((a, b) => a - b)

  if (!existing) {
    await client.from('user_progress').insert({
      user_id: userId,
      quest_id: questId,
      steps_completed: currentSteps,
      current_step: currentSteps[currentSteps.length - 1] + 1,
      is_completed: false,
      started_at: new Date().toISOString(),
      completed_at: null,
    })
  } else {
    await client.from('user_progress').update({
      steps_completed: currentSteps,
      current_step: currentSteps[currentSteps.length - 1] + 1,
    }).eq('id', existing.id)
  }

  const { data: quest } = await client.from('quests').select('*').eq('id', questId).single()
  const { data: steps } = await client.from('quest_steps').select('*').eq('quest_id', questId)
  const minSteps = quest?.completion_conditions?.min_steps || steps?.length || 1
  const completed = currentSteps.length >= minSteps

  if (completed) {
    const { data: progressRow } = await client.from('user_progress').select('*').eq('user_id', userId).eq('quest_id', questId).maybeSingle()
    if (progressRow) {
      await client.from('user_progress').update({ is_completed: true, completed_at: new Date().toISOString() }).eq('id', progressRow.id)
    }
  }

  return completed
}
