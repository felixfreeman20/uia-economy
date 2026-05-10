import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const admin = createAdminSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { requestId } = await req.json()
  if (!requestId) return NextResponse.json({ error: 'No request ID' }, { status: 400 })

  // Get payment request
  const { data: request } = await admin
    .from('payment_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (!request) return NextResponse.json({ error: 'Payment request not found' }, { status: 404 })
  if (request.status !== 'pending') return NextResponse.json({ error: 'Request already processed or expired' }, { status: 400 })
  if (request.from_user === user.id) return NextResponse.json({ error: 'Cannot pay your own request' }, { status: 400 })
  if (new Date(request.expires_at) < new Date()) return NextResponse.json({ error: 'Request expired' }, { status: 400 })

  // Execute transfer
  const { data, error } = await admin.rpc('transfer_vox', {
    p_from_user: user.id,
    p_to_user: request.from_user,
    p_amount: request.amount,
    p_type: 'transfer',
    p_description: request.description || 'QR Payment',
    p_reference_id: request.id,
  })

  if (error || !data?.success) {
    return NextResponse.json({ error: data?.error || 'Payment failed' }, { status: 400 })
  }

  // Mark as completed
  await admin.from('payment_requests').update({ status: 'completed' }).eq('id', requestId)

  return NextResponse.json({ success: true, amount: request.amount })
}
