'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

interface Item { id: string; name: string; description: string; rarity: string; base_price: number; icon: string; max_supply: number | null; current_supply: number }
interface Listing { id: string; seller_id: string; item_id: string; quantity: number; price_per_unit: number; items: Item; seller: { username: string } }

export default function MarketPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<{ id: string; username: string; vox_balance: number } | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [tab, setTab] = useState<'shop' | 'market'>('shop')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [profileRes, itemsRes, listingsRes] = await Promise.all([
      supabase.from('profiles').select('id, username, vox_balance').eq('id', user.id).single(),
      supabase.from('items').select('*').eq('is_active', true),
      supabase.from('marketplace_listings').select('*, items(*), seller:seller_id(username)').eq('is_black_market', false).gt('expires_at', new Date().toISOString()),
    ])
    if (profileRes.data) setProfile(profileRes.data)
    if (itemsRes.data) setItems(itemsRes.data)
    if (listingsRes.data) setListings(listingsRes.data as unknown as Listing[])
  }

  async function buyItem(itemId: string, price: number) {
    setLoading(true)
    setMessage('')
    const res = await fetch('/api/market', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'buy_item', itemId }) })
    const data = await res.json()
    setMessage(res.ok ? '✓ Item purchased!' : `✗ ${data.error}`)
    if (res.ok) await loadData()
    setLoading(false)
  }

  async function buyListing(listingId: string) {
    setLoading(true)
    setMessage('')
    const res = await fetch('/api/market', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'buy_listing', listingId }) })
    const data = await res.json()
    setMessage(res.ok ? '✓ Purchased!' : `✗ ${data.error}`)
    if (res.ok) await loadData()
    setLoading(false)
  }

  const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary']
  const sortedItems = [...items].sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity))

  return (
    <div className="flex min-h-screen bg-vox-black">
      {profile && <Sidebar balance={profile.vox_balance} username={profile.username} />}
      <main className="flex-1 ml-60 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="text-gray-500 text-sm font-mono mb-1">ECONOMY</div>
            <h1 className="font-display text-5xl text-white tracking-wide">MARKETPLACE</h1>
          </div>

          <div className="flex gap-2 mb-6">
            {(['shop', 'market'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all uppercase ${tab === t ? 'btn-gold' : 'btn-outline'}`}>
                {t === 'shop' ? '🏪 Item Shop' : '🤝 Player Market'}
              </button>
            ))}
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${message.startsWith('✓') ? 'bg-green-950/30 text-vox-green' : 'bg-red-950/30 text-vox-red'}`}>{message}</div>
          )}

          {tab === 'shop' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedItems.map(item => (
                <div key={item.id} className={`panel p-5 transition-all hover:-translate-y-0.5`} style={{ borderColor: item.rarity === 'legendary' ? '#f59e0b60' : item.rarity === 'epic' ? '#a78bfa30' : item.rarity === 'rare' ? '#60a5fa30' : '' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{item.icon}</span>
                    <span className={`text-xs font-mono uppercase tracking-widest rarity-${item.rarity}`}>{item.rarity}</span>
                  </div>
                  <div className="font-semibold text-white mb-1">{item.name}</div>
                  <div className="text-xs text-gray-500 mb-4">{item.description}</div>
                  {item.max_supply && <div className="text-xs text-gray-600 font-mono mb-2">Supply: {item.current_supply}/{item.max_supply}</div>}
                  <button
                    onClick={() => buyItem(item.id, item.base_price)}
                    disabled={loading || !profile || profile.vox_balance < item.base_price}
                    className="btn-gold w-full py-2.5 rounded-lg text-sm font-bold disabled:opacity-50"
                  >
                    BUY — {item.base_price.toLocaleString()} VOX
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {listings.length === 0 ? (
                <div className="panel p-16 text-center text-gray-600">
                  <div className="text-5xl mb-3">🛒</div>
                  <p>No player listings yet</p>
                </div>
              ) : listings.map(listing => (
                <div key={listing.id} className="panel p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{listing.items?.icon}</span>
                    <div>
                      <div className="font-semibold text-white">{listing.items?.name} <span className="text-xs text-gray-500">x{listing.quantity}</span></div>
                      <div className="text-xs text-gray-500 font-mono">by @{listing.seller?.username}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-display text-xl text-gold">{listing.price_per_unit.toLocaleString()} VOX</div>
                      <div className="text-xs text-gray-600">per unit</div>
                    </div>
                    <button onClick={() => buyListing(listing.id)} disabled={loading} className="btn-gold px-5 py-2.5 rounded-lg text-sm font-bold disabled:opacity-50">BUY</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
