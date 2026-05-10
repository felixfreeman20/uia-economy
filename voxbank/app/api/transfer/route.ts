import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const admin = createAdminSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { recipient, amount, note } = await req.json()

  if (!recipient || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Find recipient
  const { data: recipientProfile } = await admin
    .from('profiles')
    .select('id, username')
    .eq('username', recipient.toLowerCase())
    .single()

  if (!recipientProfile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (recipientProfile.id === user.id) {
    return NextResponse.json({ error: 'Cannot send to yourself' }, { status: 400 })
  }

  // Execute atomic transfer via database function
  const { data, error } = await admin.rpc('transfer_vox', {
    p_from_user: user.id,
    p_to_user: recipientProfile.id,
    p_amount: amount,
    p_type: 'transfer',
    p_description: note || `Transfer to @${recipient}`,
  })

  if (error || !data?.success) {
    return NextResponse.json({ error: data?.error || error?.message || 'Transfer failed' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
