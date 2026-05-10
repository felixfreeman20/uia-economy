import { createServerSupabase } from '@/lib/supabase-server'
import Sidebar from '@/components/Sidebar'
import { redirect } from 'next/navigation'

export default async function InventoryPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: inventory } = await supabase.from('user_inventory').select('*, items(*)').eq('user_id', user.id)

  const rarityBorder: Record<string, string> = {
    common: '#9ca3af30',
    uncommon: '#34d39930',
    rare: '#60a5fa30',
    epic: '#a78bfa30',
    legendary: '#f59e0b60',
  }

  return (
    <div className="flex min-h-screen bg-vox-black">
      {profile && <Sidebar balance={profile.vox_balance} username={profile.username} />}
      <main className="flex-1 ml-60 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="text-gray-500 text-sm font-mono mb-1">COLLECTION</div>
            <h1 className="font-display text-5xl text-white tracking-wide">INVENTORY</h1>
          </div>

          {!inventory || inventory.length === 0 ? (
            <div className="panel p-20 text-center text-gray-600">
              <div className="text-5xl mb-3">🎒</div>
              <p>Your inventory is empty. Visit the marketplace!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(inventory as { id: string; quantity: number; items: { name: string; description: string; rarity: string; icon: string; base_price: number } }[]).map(inv => (
                <div key={inv.id} className="panel p-5" style={{ borderColor: rarityBorder[inv.items.rarity] || '' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{inv.items.icon}</span>
                    <span className="font-mono text-xs bg-vox-panel px-2 py-1 rounded-lg text-gray-400">x{inv.quantity}</span>
                  </div>
                  <div className="font-semibold text-white text-sm mb-1">{inv.items.name}</div>
                  <div className={`text-xs rarity-${inv.items.rarity} uppercase font-mono tracking-widest`}>{inv.items.rarity}</div>
                  <div className="text-xs text-gray-600 mt-2 font-mono">≈{inv.items.base_price.toLocaleString()} VOX</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
