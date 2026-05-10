import { createServerSupabase } from '@/lib/supabase-server'
import Sidebar from '@/components/Sidebar'
import { redirect } from 'next/navigation'

export default async function GovernmentPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: elections } = await supabase.from('elections').select('*').eq('status', 'open').order('created_at', { ascending: false })
  const { data: policies } = await supabase.from('government_policies').select('*').eq('is_active', true).order('created_at', { ascending: false })

  return (
    <div className="flex min-h-screen bg-vox-black">
      {profile && <Sidebar balance={profile.vox_balance} username={profile.username} />}
      <main className="flex-1 ml-60 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="text-gray-500 text-sm font-mono mb-1">DEMOCRACY</div>
            <h1 className="font-display text-5xl text-white tracking-wide">GOVERNMENT</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="panel p-6">
              <h2 className="font-display text-2xl text-white mb-4 tracking-wide">ACTIVE ELECTIONS</h2>
              {!elections || elections.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <div className="text-4xl mb-2">🗳️</div>
                  <p className="text-sm">No active elections</p>
                </div>
              ) : elections.map((e: { id: string; title: string; description: string; ends_at: string }) => (
                <div key={e.id} className="p-4 rounded-lg bg-vox-darker border border-vox-border mb-3">
                  <div className="font-semibold text-white mb-1">{e.title}</div>
                  <div className="text-xs text-gray-500 mb-3">{e.description}</div>
                  <div className="text-xs text-gray-600 font-mono">Ends: {new Date(e.ends_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>

            <div className="panel p-6">
              <h2 className="font-display text-2xl text-white mb-4 tracking-wide">ACTIVE POLICIES</h2>
              {!policies || policies.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <div className="text-4xl mb-2">📜</div>
                  <p className="text-sm">No active policies</p>
                </div>
              ) : policies.map((p: { id: string; title: string; description: string; policy_type: string; value: number }) => (
                <div key={p.id} className="p-4 rounded-lg bg-vox-darker border border-vox-border mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-white">{p.title}</div>
                    <div className="text-xs px-2 py-0.5 rounded-full bg-vox-gold/10 text-vox-gold font-mono">{p.policy_type}</div>
                  </div>
                  <div className="text-xs text-gray-500">{p.description}</div>
                  {p.value && <div className="text-xs text-vox-cyan font-mono mt-1">Value: {p.value}%</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 panel p-6" style={{ borderColor: '#c9a84c30', background: 'linear-gradient(135deg, #161625, #1a1a2e)' }}>
            <div className="font-display text-2xl text-gold mb-2">WANT TO RUN FOR OFFICE?</div>
            <p className="text-gray-400 text-sm">Contact the admin to register as a government candidate. Elections are created by admins. Winners gain control over tax rates and economic policy.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
