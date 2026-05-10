import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase-server'

const SLOT_SYMBOLS = ['🍒', '💎', '7️⃣', '⭐', '🔔', '🍀']
const SLOT_PAYOUTS: Record<string, number> = {
  '💎💎💎': 20,
  '7️⃣7️⃣7️⃣': 15,
  '⭐⭐⭐': 10,
  '🍀🍀🍀': 8,
  '🔔🔔🔔': 5,
  '🍒🍒🍒': 3,
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const admin = createAdminSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { game, bet } = await req.json()
  if (!game || !bet || bet <= 0) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  if (profile.vox_balance < bet) return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })

  let won = false
  let winnings = 0
  let outcome = ''
  let slots: string[] | undefined

  if (game === 'coinflip') {
    const flip = Math.random() < 0.5
    won = flip
    winnings = won ? Math.floor(bet * 1.8) : 0
    outcome = flip ? 'HEADS — You win!' : 'TAILS — You lose!'
  }

  else if (game === 'dice') {
    const d1 = Math.floor(Math.random() * 6) + 1
    const d2 = Math.floor(Math.random() * 6) + 1
    const total = d1 + d2
    if (d1 === 1 && d2 === 1) {
      won = false
      outcome = '🐍 Snake eyes! Instant loss!'
    } else {
      won = total >= 7
      winnings = won ? bet * 2 : 0
      outcome = `Rolled ${d1}+${d2}=${total}. ${won ? 'Win!' : 'Loss.'}`
    }
  }

  else if (game === 'slots') {
    // Weighted RNG - bias toward losses
    const getSymbol = () => {
      const r = Math.random()
      if (r < 0.01) return '💎'  // 1%
      if (r < 0.04) return '7️⃣'  // 3%
      if (r < 0.10) return '⭐'  // 6%
      if (r < 0.20) return '🍀'  // 10%
      if (r < 0.40) return '🔔'  // 20%
      return '🍒'               // 60%
    }

    slots = [getSymbol(), getSymbol(), getSymbol()]
    const key = slots.join('')
    const multiplier = SLOT_PAYOUTS[key]

    if (multiplier) {
      won = true
      winnings = bet * multiplier
      outcome = `${key} — ${multiplier}x multiplier!`
    } else {
      won = false
      winnings = 0
      outcome = slots.join(' ') + ' — No match.'
    }
  }

  // Update balance
  const balanceChange = won ? winnings - bet : -bet
  await admin.from('profiles').update({ vox_balance: profile.vox_balance + balanceChange }).eq('id', user.id)

  // Log session
  await admin.from('gambling_sessions').insert({
    user_id: user.id,
    game_type: game,
    bet_amount: bet,
    outcome: balanceChange,
  })

  // Log transaction
  if (won) {
    await admin.from('transactions').insert({
      from_user: null,
      to_user: user.id,
      amount: winnings,
      type: 'gambling_win',
      description: `Casino win: ${game} — ${outcome}`,
    })
  } else {
    await admin.from('transactions').insert({
      from_user: user.id,
      to_user: null,
      amount: bet,
      type: 'gambling_loss',
      description: `Casino loss: ${game} — ${outcome}`,
    })
  }

  return NextResponse.json({ won, winnings, outcome, slots })
}
