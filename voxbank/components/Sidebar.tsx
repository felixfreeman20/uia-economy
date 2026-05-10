'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '⬡' },
  { href: '/dashboard/transfer', label: 'Transfer', icon: '↗' },
  { href: '/dashboard/qr', label: 'QR Pay', icon: '▣' },
  { href: '/stocks', label: 'Stocks', icon: '📈' },
  { href: '/market', label: 'Market', icon: '🏪' },
  { href: '/inventory', label: 'Inventory', icon: '🎒' },
  { href: '/loans', label: 'Loans', icon: '💳' },
  { href: '/government', label: 'Government', icon: '🏛️' },
  { href: '/casino', label: 'Casino', icon: '🎰' },
  { href: '/factions', label: 'Factions', icon: '💀' },
  { href: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
]

interface SidebarProps {
  balance: number
  username: string
}

export default function Sidebar({ balance, username }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-vox-darker border-r border-vox-border flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-vox-border">
        <div className="font-display text-3xl text-gold tracking-widest">VOXBANK</div>
        <div className="text-xs text-gray-600 font-mono mt-1">SCHOOL ECONOMY</div>
      </div>

      {/* Balance */}
      <div className="p-4 mx-4 my-4 panel" style={{ background: '#0d0d15' }}>
        <div className="text-xs text-gray-500 font-mono mb-1 tracking-widest">YOUR BALANCE</div>
        <div className="font-display text-2xl text-gold">{balance.toLocaleString()} <span className="text-base">VOX</span></div>
        <div className="text-xs text-gray-600 mt-1 truncate">@{username}</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <div className="space-y-1">
          {NAV.map(item => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-vox-gold/10 text-vox-gold border border-vox-gold/20'
                    : 'text-gray-400 hover:text-white hover:bg-vox-panel'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-vox-border">
        <button
          onClick={handleSignOut}
          className="w-full text-left px-3 py-2.5 text-sm text-gray-500 hover:text-vox-red transition-colors rounded-lg hover:bg-red-950/20"
        >
          ⎋ Sign Out
        </button>
      </div>
    </aside>
  )
}
