import { createServerSupabase } from '@/lib/supabase-server'
import Sidebar from '@/components/Sidebar'
import { redirect } from 'next/navigation'

export default async function LeaderboardPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: leaderboard } = await supabase.rpc('get_leaderboard')

  const userRank = leaderboard?.find((r: { id: string }) => r.id === user.id)

  const MEDALS = ['🥇', '🥈', '🥉']

  return (
    <div className="flex min-h-screen bg-vox-black">
      {profile && <Sidebar balance={profile.vox_balance} username={profile.username} />}
      <main className="flex-1 ml-60 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <div className="text-gray-500 text-sm font-mono mb-1">RANKINGS</div>
            <h1 className="font-display text-5xl text-white tracking-wide">LEADERBOARD</h1>
          </div>

          {/* User's rank card */}
          {userRank && (
            <div className="mb-6 p-4 panel" style={{ background: 'linear-gradient(135deg, #1a1625, #12121e)', borderColor: '#c9a84c30' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="font-display text-3xl text-gold">#{userRank.rank}</div>
                  <div>
                    <div className="font-semibold text-white">Your Position</div>
                    <div className="text-xs text-gray-500 font-mono">@{userRank.username}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl text-gold">{userRank.vox_balance.toLocaleString()} VOX</div>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard table */}
          <div className="panel overflow-hidden">
            <div className="border-b border-vox-border px-6 py-4 flex items-center justify-between">
              <span className="font-display text-xl text-white tracking-wide">TOP EARNERS</span>
              <span className="text-xs font-mono text-gray-500">TOP 50</span>
            </div>

            <div className="divide-y divide-vox-border">
              {leaderboard?.map((entry: {
                rank: number
                id: string
                username: string
                display_name: string
                vox_balance: number
                reputation: number
                faction: string
              }, i: number) => {
                const isCurrentUser = entry.id === user.id
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-4 px-6 py-4 transition-colors ${isCurrentUser ? 'bg-vox-gold/5' : 'hover:bg-vox-panel'}`}
                  >
                    {/* Rank */}
                    <div className="w-12 text-center">
                      {i < 3 ? (
                        <span className="text-xl">{MEDALS[i]}</span>
                      ) : (
                        <span className="font-mono text-gray-500 text-sm">#{entry.rank}</span>
                      )}
                    </div>

                    {/* Avatar placeholder */}
                    <div className="w-9 h-9 rounded-full bg-vox-panel border border-vox-border flex items-center justify-center text-sm font-bold text-gray-400">
                      {entry.username[0].toUpperCase()}
                    </div>

                    {/* Name */}
                    <div className="flex-1">
                      <div className={`font-semibold ${isCurrentUser ? 'text-vox-gold' : 'text-white'}`}>
                        {entry.display_name || entry.username}
                        {isCurrentUser && <span className="ml-2 text-xs text-vox-gold/60">(you)</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-600 font-mono">@{entry.username}</span>
                        {entry.faction && (
                          <span className="text-xs text-vox-purple bg-vox-purple/10 px-2 py-0.5 rounded-full">{entry.faction}</span>
                        )}
                      </div>
                    </div>

                    {/* Rep */}
                    <div className="text-xs text-gray-600 font-mono w-20 text-center">
                      {entry.reputation} rep
                    </div>

                    {/* Balance */}
                    <div className="font-display text-xl text-right">
                      <span className="text-gold">{entry.vox_balance.toLocaleString()}</span>
                      <span className="text-xs text-gray-600 ml-1">VOX</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
