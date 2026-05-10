import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const admin = createAdminSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { stockId, action, shares } = await req.json()

  if (!stockId || !action || !shares || shares <= 0) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Get stock
  const { data: stock } = await admin.from('stocks').select('*').eq('id', stockId).single()
  if (!stock) return NextResponse.json({ error: 'Stock not found' }, { status: 404 })

  // Get user profile
  const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  if (action === 'buy') {
    const totalCost = stock.current_price * shares

    if (profile.vox_balance < totalCost) {
      return NextResponse.json({ error: `Insufficient balance. Need ${totalCost} VOX, have ${profile.vox_balance}` }, { status: 400 })
    }
    if (stock.available_shares < shares) {
      return NextResponse.json({ error: 'Not enough shares available' }, { status: 400 })
    }

    // Deduct balance
    await admin.from('profiles').update({ vox_balance: profile.vox_balance - totalCost }).eq('id', user.id)

    // Update available shares
    await admin.from('stocks').update({ available_shares: stock.available_shares - shares }).eq('id', stockId)

    // Upsert user_stocks
    const { data: existing } = await admin.from('user_stocks').select('*').eq('user_id', user.id).eq('stock_id', stockId).single()

    if (existing) {
      const newShares = existing.shares + shares
      const newAvg = Math.round((existing.avg_buy_price * existing.shares + stock.current_price * shares) / newShares)
      await admin.from('user_stocks').update({ shares: newShares, avg_buy_price: newAvg }).eq('id', existing.id)
    } else {
      await admin.from('user_stocks').insert({ user_id: user.id, stock_id: stockId, shares, avg_buy_price: stock.current_price })
    }

    // Log transaction
    await admin.from('transactions').insert({
      from_user: user.id,
      to_user: null,
      amount: totalCost,
      type: 'stock_buy',
      description: `Bought ${shares}x ${stock.ticker} @ ${stock.current_price} VOX`,
    })

    return NextResponse.json({ success: true })
  }

  if (action === 'sell') {
    const { data: userStock } = await admin.from('user_stocks').select('*').eq('user_id', user.id).eq('stock_id', stockId).single()

    if (!userStock || userStock.shares < shares) {
      return NextResponse.json({ error: 'Insufficient shares to sell' }, { status: 400 })
    }

    const totalValue = stock.current_price * shares

    // Add to balance
    await admin.from('profiles').update({ vox_balance: profile.vox_balance + totalValue }).eq('id', user.id)

    // Update available shares
    await admin.from('stocks').update({ available_shares: stock.available_shares + shares }).eq('id', stockId)

    // Update user_stocks
    if (userStock.shares === shares) {
      await admin.from('user_stocks').delete().eq('id', userStock.id)
    } else {
      await admin.from('user_stocks').update({ shares: userStock.shares - shares }).eq('id', userStock.id)
    }

    // Log transaction
    await admin.from('transactions').insert({
      from_user: null,
      to_user: user.id,
      amount: totalValue,
      type: 'stock_sell',
      description: `Sold ${shares}x ${stock.ticker} @ ${stock.current_price} VOX`,
    })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

// Trigger stock price update (call this from a cron or manually)
export async function PUT(req: NextRequest) {
  const admin = createAdminSupabase()
  await admin.rpc('update_stock_prices')
  return NextResponse.json({ success: true })
}
