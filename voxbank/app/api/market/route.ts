import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const admin = createAdminSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { action, itemId, listingId } = await req.json()
  const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  if (action === 'buy_item') {
    const { data: item } = await admin.from('items').select('*').eq('id', itemId).single()
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    if (profile.vox_balance < item.base_price) return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    if (item.max_supply && item.current_supply >= item.max_supply) return NextResponse.json({ error: 'Item sold out' }, { status: 400 })
    await admin.from('profiles').update({ vox_balance: profile.vox_balance - item.base_price }).eq('id', user.id)
    if (item.max_supply) await admin.from('items').update({ current_supply: item.current_supply + 1 }).eq('id', itemId)
    const { data: existing } = await admin.from('user_inventory').select('*').eq('user_id', user.id).eq('item_id', itemId).single()
    if (existing) {
      await admin.from('user_inventory').update({ quantity: existing.quantity + 1 }).eq('id', existing.id)
    } else {
      await admin.from('user_inventory').insert({ user_id: user.id, item_id: itemId, quantity: 1 })
    }
    await admin.from('transactions').insert({ from_user: user.id, to_user: null, amount: item.base_price, type: 'purchase', description: `Bought ${item.name}` })
    return NextResponse.json({ success: true })
  }

  if (action === 'buy_listing') {
    const { data: listing } = await admin.from('marketplace_listings').select('*').eq('id', listingId).single()
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    const total = listing.price_per_unit * listing.quantity
    if (profile.vox_balance < total) return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    await admin.rpc('transfer_vox', { p_from_user: user.id, p_to_user: listing.seller_id, p_amount: total, p_type: 'sale', p_description: 'Market purchase' })
    await admin.from('marketplace_listings').delete().eq('id', listingId)
    const { data: existing } = await admin.from('user_inventory').select('*').eq('user_id', user.id).eq('item_id', listing.item_id).single()
    if (existing) {
      await admin.from('user_inventory').update({ quantity: existing.quantity + listing.quantity }).eq('id', existing.id)
    } else {
      await admin.from('user_inventory').insert({ user_id: user.id, item_id: listing.item_id, quantity: listing.quantity })
    }
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
