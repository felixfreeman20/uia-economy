import { createServerSupabase } from '@/lib/supabase-server'
import Sidebar from '@/components/Sidebar'
import { redirect } from 'next/navigation'

export default async function FactionsPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: factions } = await supabase.from('factions').select('*, leader:leader_id(username)').order('reputation', { ascending: false })

  return (
    <div className="flex min-h-screen bg-vox-black">
      {profile && <Sidebar balance={profile.vox_balance} username={profile.username} />}
      <main className="flex-1 ml-60 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="text-gray-500 text-sm font-mono mb-1">ALLIANCES</div>
            <h1 className="font-display text-5xl text-white tracking-wide">FACTIONS</h1>
          </div>

          {!factions || factions.length === 0 ? (
            <div className="panel p-20 text-center text-gray-600">
              <div className="text-5xl mb-3">💀</div>
              <p>No factions yet. Be the first to form one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(factions as { id: string; name: string; description: string; treasury: number; reputation: number; member_count: number; color: string; leader: { username: string } }[]).map(f => (
                <div key={f.id} className="panel panel-hover p-6" style={{ borderColor: f.color + '30' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-display text-2xl text-white">{f.name}</div>
                    <div className="w-3 h-3 rounded-full" style={{ background: f.color }} />
                  </div>
                  <div className="text-sm text-gray-400 mb-4">{f.description}</div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-vox-darker rounded-lg p-2">
                      <div className="text-xs text-gray-600 font-mono">MEMBERS</div>
                      <div className="font-display text-lg text-white">{f.member_count}</div>
                    </div>
                    <div className="bg-vox-darker rounded-lg p-2">
                      <div className="text-xs text-gray-600 font-mono">TREASURY</div>
                      <div className="font-display text-lg text-gold">{f.treasury.toLocaleString()}</div>
                    </div>
                    <div className="bg-vox-darker rounded-lg p-2">
                      <div className="text-xs text-gray-600 font-mono">REP</div>
                      <div className="font-display text-lg text-vox-cyan">{f.reputation}</div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-600 font-mono">Leader: @{f.leader?.username}</div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 panel p-6" style={{ borderColor: '#7c3aed30', background: 'linear-gradient(135deg, #16162580, #1a1628)' }}>
            <div className="font-display text-2xl text-vox-purple mb-2">START A FACTION</div>
            <p className="text-gray-400 text-sm">Contact admin to create your own faction. Requires 500 VOX to register. Build your crew, share treasury, dominate the economy.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
