'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const STATS = [
  { label: 'ACTIVE CITIZENS', value: '0', suffix: '+' },
  { label: 'VOX TRADED', value: '0', suffix: 'M' },
  { label: 'STOCKS LISTED', value: '6', suffix: '' },
  { label: 'ITEMS IN MARKET', value: '8', suffix: '' },
]

const FEATURES = [
  { icon: '💰', title: 'Real Wallets', desc: 'Every account starts with 1,000 VOX. Send, receive, invest.' },
  { icon: '📈', title: 'Live Stock Market', desc: 'Prices move every cycle. Buy low, sell high, or crash the market.' },
  { icon: '🏛️', title: 'Government', desc: 'Run for office, set tax rates, pass policies, control the economy.' },
  { icon: '🎰', title: 'Casino', desc: 'Coinflip, dice, slots. High risk, high reward. Or lose everything.' },
  { icon: '🗝️', title: 'Black Market', desc: 'For rare items and off-the-record deals. Risk is part of the game.' },
  { icon: '⚡', title: 'QR Payments', desc: 'Generate a QR code, get paid in seconds. IRL transactions.' },
  { icon: '🏢', title: 'Businesses', desc: 'Open shops, hire employees, generate passive VOX income.' },
  { icon: '💀', title: 'Factions', desc: 'Join or create a gang. Control territory, share resources, dominate.' },
]

export default function Home() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="min-h-screen bg-vox-black">
      {/* Noise texture overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        backgroundRepeat: 'repeat',
        backgroundSize: '200px'
      }} />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-vox-border bg-vox-black/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-display text-2xl text-gold tracking-widest">VOXBANK</div>
          <div className="flex gap-3">
            <Link href="/login" className="btn-outline px-5 py-2 rounded-lg text-sm font-semibold">
              LOGIN
            </Link>
            <Link href="/register" className="btn-gold px-5 py-2 rounded-lg text-sm">
              OPEN ACCOUNT
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-4 py-1 border border-vox-gold/30 rounded-full text-vox-gold text-xs font-mono mb-8 tracking-widest">
            SCHOOL ECONOMY PLATFORM
          </div>
          <h1 className="font-display text-8xl md:text-[120px] leading-none mb-6" style={{ letterSpacing: '-2px' }}>
            <span className="text-gold">VOX</span>
            <br />
            <span className="text-white">ECONOMY</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-12 font-body">
            The complete economic simulation for your school. Trade stocks. Run businesses. 
            Win elections. Join factions. Every decision has consequences.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register" className="btn-gold px-8 py-4 rounded-xl text-lg font-bold">
              START WITH 1,000 VOX →
            </Link>
            <Link href="/leaderboard" className="btn-outline px-8 py-4 rounded-xl text-lg font-semibold">
              VIEW LEADERBOARD
            </Link>
          </div>
        </div>
      </section>

      {/* Ticker */}
      <div className="border-y border-vox-border py-3 bg-vox-darker overflow-hidden">
        <div className="ticker-wrap">
          <div className="ticker-content text-vox-gold font-mono text-sm">
            {['VXTECH +3.2%', 'EDUCO -1.8%', 'VXFOOD +0.9%', 'CRYPT +12.4%', 'MEDV -0.4%', 'XGAME +5.1%',
              'VXTECH +3.2%', 'EDUCO -1.8%', 'VXFOOD +0.9%', 'CRYPT +12.4%', 'MEDV -0.4%', 'XGAME +5.1%'].map((t, i) => (
              <span key={i} className="mx-8">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <div key={i} className="panel p-6 text-center">
              <div className="font-display text-4xl text-gold mb-1">{s.value}{s.suffix}</div>
              <div className="text-xs text-gray-500 tracking-widest font-mono">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-5xl text-center mb-12 text-white tracking-wider">
            WHAT YOU CAN DO
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="panel panel-hover p-6 cursor-default">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center panel p-12" style={{
          background: 'linear-gradient(135deg, #161625, #1a1a2e)',
          border: '1px solid #c9a84c30',
          boxShadow: '0 0 60px #c9a84c10'
        }}>
          <div className="font-display text-5xl text-gold mb-4">READY TO PLAY?</div>
          <p className="text-gray-400 mb-8">
            Create your account and receive your starting 1,000 VOX grant. 
            Build your empire or lose it all — your choice.
          </p>
          <Link href="/register" className="btn-gold px-10 py-4 rounded-xl text-lg font-bold inline-block">
            OPEN ACCOUNT — FREE
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-vox-border py-8 px-6 text-center text-gray-600 text-sm font-mono">
        VOXBANK © {new Date().getFullYear()} — SCHOOL ECONOMY PLATFORM — ALL TRANSACTIONS SIMULATED
      </footer>
    </div>
  )
}
