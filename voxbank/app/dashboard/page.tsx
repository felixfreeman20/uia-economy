import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Recent transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, from_profile:from_user(username), to_profile:to_user(username)')
    .or(`from_user.eq.${user.id},to_user.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(8)

  // Active loans
  const { data: loans } = await supabase
    .from('loans')
    .select('*')
    .eq('borrower_id', user.id)
    .eq('status', 'active')
    .limit(3)

  // Active events
  const { data: events } = await supabase
    .from('economy_events')
    .select('*')
    .eq('is_active', true)
    .limit(2)

  // User rank
  const { data: leaderboard } = await supabase.rpc('get_leaderboard')
  const userRank = leaderboard?.find((r: { id: string }) => r.id === user.id)

  const totalDebt = loans?.reduce((sum: number, l: { remaining_balance: number }) => sum + l.remaining_balance, 0) || 0

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="text-gray-500 text-sm font-mono mb-1">WELCOME BACK</div>
        <h1 className="font-display text-5xl text-white tracking-wide">
          @{profile.username}
        </h1>
      </div>

      {/* Active events banner */}
      {events && events.length > 0 && (
        <div className="mb-6 p-4 rounded-xl border border-vox-cyan/30 bg-vox-cyan/5">
          <div className="text-xs font-mono text-vox-cyan tracking-widest mb-1">⚡ ACTIVE ECONOMY EVENT</div>
          {events.map((e: { id: string; title: string; description: string }) => (
            <div key={e.id} className="text-white font-semibold">{e.title} — <span className="text-gray-400 font-normal text-sm">{e.description}</span></div>
          ))}
        </div>
      )}

      {/* Key stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="panel p-6" style={{ background: 'linear-gradient(135deg, #12121e, #1a1625)' }}>
          <div className="text-xs font-mono text-gray-500 tracking-widest mb-2">VOX BALANCE</div>
          <div className="font-display text-4xl text-gold">{profile.vox_balance.toLocaleString()}</div>
          <div className="text-xs text-gray-600 mt-1">VOX</div>
        </div>

        <div className="panel p-6">
          <div className="text-xs font-mono text-gray-500 tracking-widest mb-2">GLOBAL RANK</div>
          <div className="font-display text-4xl text-white">#{userRank?.rank || '—'}</div>
          <div className="text-xs text-gray-600 mt-1">of {leaderboard?.length || 0} players</div>
        </div>

        <div className="panel p-6">
          <div className="text-xs font-mono text-gray-500 tracking-widest mb-2">REPUTATION</div>
          <div className="font-display text-4xl text-vox-cyan">{profile.reputation}</div>
          <div className="text-xs text-gray-600 mt-1">points</div>
        </div>

        <div className="panel p-6">
          <div className="text-xs font-mono text-gray-500 tracking-widest mb-2">ACTIVE DEBT</div>
          <div className={`font-display text-4xl ${totalDebt > 0 ? 'text-vox-red' : 'text-vox-green'}`}>
            {totalDebt > 0 ? `-${totalDebt.toLocaleString()}` : '0'}
          </div>
          <div className="text-xs text-gray-600 mt-1">VOX owed</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { href: '/dashboard/transfer', label: 'SEND VOX', icon: '↗', color: 'text-vox-gold' },
          { href: '/dashboard/qr', label: 'QR RECEIVE', icon: '▣', color: 'text-vox-cyan' },
          { href: '/stocks', label: 'TRADE STOCKS', icon: '📈', color: 'text-vox-green' },
          { href: '/casino', label: 'CASINO', icon: '🎰', color: 'text-vox-red' },
        ].map(action => (
          <Link
            key={action.href}
            href={action.href}
            className="panel panel-hover p-4 text-center cursor-pointer"
          >
            <div className={`text-2xl mb-2 ${action.color}`}>{action.icon}</div>
            <div className="text-xs font-mono text-gray-400 tracking-widest">{action.label}</div>
          </Link>
        ))}
      </div>

      {/* Recent transactions */}
      <div className="panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl text-white tracking-wide">RECENT TRANSACTIONS</h2>
          <span className="text-xs font-mono text-gray-500">LAST 8</span>
        </div>

        {!transactions || transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <div className="text-4xl mb-3">💸</div>
            <p>No transactions yet. Send some VOX!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx: {
              id: string
              from_user: string
              to_user: string
              amount: number
              type: string
              description: string
              created_at: string
              from_profile: { username: string }
              to_profile: { username: string }
            }) => {
              const isIncoming = tx.to_user === user.id
              return (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-vox-panel transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                      isIncoming ? 'bg-green-900/30 text-vox-green' : 'bg-red-900/30 text-vox-red'
                    }`}>
                      {isIncoming ? '↙' : '↗'}
                    </div>
                    <div>
                      <div className="text-sm text-white">
                        {isIncoming
                          ? `From @${tx.from_profile?.username || 'system'}`
                          : `To @${tx.to_profile?.username || 'system'}`
                        }
                      </div>
                      <div className="text-xs text-gray-500">{tx.description || tx.type} • {new Date(tx.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className={`font-mono font-bold ${isIncoming ? 'number-green' : 'number-red'}`}>
                    {isIncoming ? '+' : '-'}{tx.amount.toLocaleString()} VOX
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
