import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const admin = createAdminSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { action, amount, loanId } = await req.json()
  const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  if (action === 'take') {
    if (amount < 100 || amount > 5000) return NextResponse.json({ error: 'Loan must be 100-5000 VOX' }, { status: 400 })
    const { data: activeLoans } = await admin.from('loans').select('id').eq('borrower_id', user.id).eq('status', 'active')
    if (activeLoans && activeLoans.length >= 2) return NextResponse.json({ error: 'Max 2 active loans' }, { status: 400 })
    const totalOwed = Math.round(amount * 1.1)
    await admin.from('loans').insert({ borrower_id: user.id, principal: amount, remaining_balance: totalOwed, interest_rate: 10, status: 'active', due_date: new Date(Date.now() + 7 * 86400000).toISOString() })
    await admin.from('profiles').update({ vox_balance: profile.vox_balance + amount }).eq('id', user.id)
    await admin.from('transactions').insert({ from_user: null, to_user: user.id, amount, type: 'loan_out', description: 'Bank loan received' })
    return NextResponse.json({ success: true })
  }

  if (action === 'repay') {
    const { data: loan } = await admin.from('loans').select('*').eq('id', loanId).single()
    if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
    if (profile.vox_balance < loan.remaining_balance) return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    await admin.from('profiles').update({ vox_balance: profile.vox_balance - loan.remaining_balance }).eq('id', user.id)
    await admin.from('loans').update({ status: 'paid', remaining_balance: 0 }).eq('id', loanId)
    await admin.from('transactions').insert({ from_user: user.id, to_user: null, amount: loan.remaining_balance, type: 'loan_repay', description: 'Loan repayment' })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
