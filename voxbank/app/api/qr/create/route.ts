import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase-server'
import QRCode from 'qrcode'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const admin = createAdminSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { amount, description } = await req.json()
  if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

  const { data: request, error } = await admin
    .from('payment_requests')
    .insert({
      from_user: user.id,
      amount,
      description,
    })
    .select()
    .single()

  if (error || !request) return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })

  const qrDataUrl = await QRCode.toDataURL(request.id, {
    width: 256,
    margin: 2,
    color: { dark: '#0a0a0f', light: '#ffffff' }
  })

  return NextResponse.json({ requestId: request.id, qrDataUrl })
}
