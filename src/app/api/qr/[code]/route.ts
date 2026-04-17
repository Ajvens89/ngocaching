import { NextRequest, NextResponse } from 'next/server'
import { createServerDataClient } from '@/lib/data-server'
import { POINTS_PER_ACTION } from '@/lib/constants'

interface RouteParams {
  params: { code: string }
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const code = decodeURIComponent(params.code)
    const dataClient = createServerDataClient()
    const { data: { user } } = await dataClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Musisz być zalogowany.' }, { status: 401 })
    }

    const { data: qrCode } = await dataClient.from('qr_codes').select('*').eq('code', code).eq('is_active', true).maybeSingle()
    if (!qrCode?.place_id) {
      return NextResponse.json({ success: false, error: 'Nierozpoznany kod QR.' }, { status: 404 })
    }

    const { data: existingCheckin } = await dataClient.from('checkins').select('*').eq('user_id', user.id).eq('place_id', qrCode.place_id).maybeSingle()
    if (existingCheckin) {
      return NextResponse.json({ success: false, error: 'Ten punkt już jest zaliczony.', place_id: qrCode.place_id }, { status: 409 })
    }

    const points = POINTS_PER_ACTION.qr_checkin
    await dataClient.from('checkins').insert({
      user_id: user.id,
      place_id: qrCode.place_id,
      verification_method: 'qr',
      points_earned: points,
      verified_at: new Date().toISOString(),
      notes: null,
      quest_step_id: null,
      latitude_at_checkin: null,
      longitude_at_checkin: null,
    })

    await dataClient.from('qr_codes').update({ scan_count: (qrCode.scan_count || 0) + 1, is_active: qrCode.is_single_use ? false : true }).eq('id', qrCode.id)

    return NextResponse.json({ success: true, place_id: qrCode.place_id, points_earned: points })
  } catch (error) {
    console.error('QR route error:', error)
    return NextResponse.json({ success: false, error: 'Wewnętrzny błąd serwera.' }, { status: 500 })
  }
}
