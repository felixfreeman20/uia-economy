'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

type Game = 'coinflip' | 'dice' | 'slots'

const SLOT_SYMBOLS = ['🍒', '💎', '7️⃣', '⭐', '🔔', '🍀']
const SLOT_PAYOUTS: Record<string, number> = {
  '💎💎💎': 20,
  '7️⃣7️⃣7️⃣': 15,
  '⭐⭐⭐': 10,
  '🍀🍀🍀': 8,
  '🔔🔔🔔': 5,
  '🍒🍒🍒': 3,
}

export default function CasinoPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<{ id: string; username: string; vox_balance: number } | null>(null)
  const [game, setGame] = useState<Game>('coinflip')
  const [bet, setBet] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ outcome: string; won: boolean; amount: number } | null>(null)
  const [slots, setSlots] = useState(['🎰', '🎰', '🎰'])
  const [spinning, setSpinning] = useState(false)
  const [stats, setStats] = useState({ wins: 0, losses: 0, total: 0 })

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('id, username, vox_balance').eq('id', user.id).single()
    if (data) setProfile(data)

    // Load session stats
    const { data: sessions } = await supabase
      .from('gambling_sessions')
      .select('outcome')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (sessions) {
      const wins = sessions.filter(s => s.outcome > 0).length
      const total = sessions.reduce((sum, s) => sum + s.outcome, 0)
      setStats({ wins, losses: sessions.length - wins, total })
    }
  }

  async function playGame() {
    if (!bet || !profile) return
    const betAmount = parseInt(bet)
    if (isNaN(betAmount) || betAmount <= 0) return
    if (betAmount > profile.vox_balance) {
      setResult({ outcome: 'Insufficient balance', won: false, amount: 0 })
      return
    }

    setLoading(true)
    setResult(null)

    if (game === 'slots') {
      setSpinning(true)
      // Animate slots
      let frames = 0
      const interval = setInterval(() => {
        setSlots([
          SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
          SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
          SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
        ])
        frames++
        if (frames > 15) clearInterval(interval)
      }, 100)

      await new Promise(r => setTimeout(r, 1600))
      setSpinning(false)
    }

    const res = await fetch('/api/gambling', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game, bet: betAmount }),
    })
    const data = await res.json()

    if (data.slots) setSlots(data.slots)

    setResult({
      outcome: data.outcome,
      won: data.won,
      amount: data.won ? data.winnings : betAmount,
    })

    // Update balance
    setProfile(prev => prev ? { ...prev, vox_balance: prev.vox_balance + (data.won ? data.winnings - betAmount : -betAmount) } : prev)
    await loadProfile()
    setLoading(false)
  }

  const GAMES = [
    { id: 'coinflip' as Game, label: 'COINFLIP', icon: '🪙', desc: '50/50. Win = 1.8x your bet.' },
    { id: 'dice' as Game, label: 'DICE', icon: '🎲', desc: 'Roll 7+. Win = 2x. Snake eyes = instant loss.' },
    { id: 'slots' as Game, label: 'SLOTS', icon: '🎰', desc: 'Match 3 symbols. Diamond = 20x!' },
  ]

  return (
    <div className="flex min-h-screen bg-vox-black">
      {profile && <Sidebar balance={profile.vox_balance} username={profile.username} />}
      <main className="flex-1 ml-60 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="text-gray-500 text-sm font-mono mb-1">HIGH RISK</div>
            <h1 className="font-display text-5xl text-white tracking-wide">CASINO</h1>
          </div>

          {/* Risk warning */}
          <div className="mb-6 p-4 rounded-xl border border-vox-red/30 bg-red-950/10 text-vox-red text-xs font-mono">
            ⚠ GAMBLING IS HIGH RISK. YOU CAN AND WILL LOSE EVERYTHING. PLAY RESPONSIBLY.
          </div>

          {/* Session stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="panel p-4 text-center">
              <div className="text-xs font-mono text-gray-500 mb-1">WINS</div>
              <div className="font-display text-2xl text-vox-green">{stats.wins}</div>
            </div>
            <div className="panel p-4 text-center">
              <div className="text-xs font-mono text-gray-500 mb-1">LOSSES</div>
              <div className="font-display text-2xl text-vox-red">{stats.losses}</div>
            </div>
            <div className="panel p-4 text-center">
              <div className="text-xs font-mono text-gray-500 mb-1">NET</div>
              <div className={`font-display text-2xl ${stats.total >= 0 ? 'text-vox-green' : 'text-vox-red'}`}>
                {stats.total >= 0 ? '+' : ''}{stats.total}
              </div>
            </div>
          </div>

          {/* Game select */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {GAMES.map(g => (
              <button
                key={g.id}
                onClick={() => { setGame(g.id); setResult(null) }}
                className={`panel p-4 text-center transition-all ${game === g.id ? 'border-vox-gold/40 bg-vox-gold/5' : 'panel-hover'}`}
              >
                <div className="text-2xl mb-1">{g.icon}</div>
                <div className="text-xs font-mono text-gray-300 font-bold">{g.label}</div>
                <div className="text-xs text-gray-600 mt-1">{g.desc}</div>
              </button>
            ))}
          </div>

          {/* Slots display */}
          {game === 'slots' && (
            <div className="panel p-6 mb-4 text-center">
              <div className="flex justify-center gap-4 text-6xl mb-2">
                {slots.map((s, i) => (
                  <div key={i} className={`transition-all ${spinning ? 'animate-bounce' : ''}`}>{s}</div>
                ))}
              </div>
            </div>
          )}

          {/* Bet input */}
          <div className="panel p-6">
            <div className="mb-4">
              <label className="block text-xs font-mono text-gray-400 mb-2 tracking-widest">BET AMOUNT (VOX)</label>
              <div className="flex gap-2 mb-3">
                {[50, 100, 250, 500].map(v => (
                  <button
                    key={v}
                    onClick={() => setBet(String(v))}
                    className="px-3 py-1.5 text-xs font-mono border border-vox-border rounded-lg hover:border-vox-gold/40 text-gray-400 hover:text-vox-gold transition-colors"
                  >
                    {v}
                  </button>
                ))}
                {profile && (
                  <button
                    onClick={() => setBet(String(profile.vox_balance))}
                    className="px-3 py-1.5 text-xs font-mono border border-vox-red/40 rounded-lg text-vox-red hover:bg-vox-red/10 transition-colors"
                  >
                    ALL IN
                  </button>
                )}
              </div>
              <input
                type="number"
                value={bet}
                onChange={e => setBet(e.target.value)}
                className="input-dark w-full px-4 py-3 text-sm"
                placeholder="Enter bet amount"
                min="1"
              />
            </div>

            <button
              onClick={playGame}
              disabled={loading || !bet || spinning}
              className="btn-gold w-full py-4 rounded-xl font-display text-2xl tracking-widest disabled:opacity-50"
            >
              {loading || spinning ? 'SPINNING...' : 'PLAY'}
            </button>

            {result && (
              <div className={`mt-4 p-4 rounded-xl text-center ${result.won ? 'bg-green-950/30 border border-vox-green/30' : 'bg-red-950/30 border border-vox-red/30'}`}>
                <div className={`font-display text-3xl mb-1 ${result.won ? 'text-vox-green' : 'text-vox-red'}`}>
                  {result.won ? '🎉 WIN!' : '💀 LOSS'}
                </div>
                <div className="text-sm text-gray-400">{result.outcome}</div>
                <div className={`font-mono font-bold mt-1 ${result.won ? 'number-green' : 'number-red'}`}>
                  {result.won ? `+${result.amount}` : `-${result.amount}`} VOX
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
