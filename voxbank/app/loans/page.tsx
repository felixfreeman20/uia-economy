'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

interface Loan {
  id: string
  principal: number
  remaining_balance: number
  interest_rate: number
  status: string
  due_date: string
  created_at: string
}

export default function LoansPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<{ id: string; username: string; vox_balance: number } | null>(null)
  const [loans, setLoans] = useState<Loan[]>([])
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [profileRes, loansRes] = await Promise.all([
      supabase.from('profiles').select('id, username, vox_balance').eq('id', user.id).single(),
      supabase.from('loans').select('*').eq('borrower_id', user.id).order('created_at', { ascending: false }),
    ])
    if (profileRes.data) setProfile(profileRes.data)
    if (loansRes.data) setLoans(loansRes.data)
  }

  async function takeLoan() {
    if (!amount) return
    setLoading(true)
    setMessage('')
    const res = await fetch('/api/loans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'take', amount: parseInt(amount) }),
    })
    const data = await res.json()
    if (res.ok) {
      setMessage(`✓ Loan of ${amount} VOX approved! Interest rate: 10%`)
      setAmount('')
      await loadData()
    } else {
      setMessage(`✗ ${data.error}`)
    }
    setLoading(false)
  }

  async function repayLoan(loanId: string, amount: number) {
    setLoading(true)
    const res = await fetch('/api/loans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'repay', loanId, amount }),
    })
    const data = await res.json()
    setMessage(res.ok ? `✓ Repaid ${amount} VOX` : `✗ ${data.error}`)
    await loadData()
    setLoading(false)
  }

  const activeLoans = loans.filter(l => l.status === 'active')
  const totalDebt = activeLoans.reduce((sum, l) => sum + l.remaining_balance, 0)

  return (
    <div className="flex min-h-screen bg-vox-black">
      {profile && <Sidebar balance={profile.vox_balance} username={profile.username} />}
      <main className="flex-1 ml-60 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <div className="text-gray-500 text-sm font-mono mb-1">BANK OF VOX</div>
            <h1 className="font-display text-5xl text-white tracking-wide">LOANS & DEBT</h1>
          </div>

          {/* Debt summary */}
          {totalDebt > 0 && (
            <div className="mb-6 p-4 rounded-xl border border-vox-red/30 bg-red-950/10">
              <div className="text-xs font-mono text-vox-red tracking-widest mb-1">⚠ OUTSTANDING DEBT</div>
              <div className="font-display text-3xl text-vox-red">{totalDebt.toLocaleString()} VOX</div>
              <div className="text-xs text-gray-500 mt-1">Failure to repay may result in government-issued fines</div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Take loan */}
            <div className="panel p-6">
              <h2 className="font-display text-2xl text-white mb-1 tracking-wide">REQUEST LOAN</h2>
              <p className="text-xs text-gray-500 mb-4 font-mono">10% interest • 7-day term • Bank of Vox</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-2 tracking-widest">LOAN AMOUNT</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="input-dark w-full px-4 py-3 text-sm"
                    placeholder="Max 5000 VOX"
                    min="100"
                    max="5000"
                  />
                </div>

                {amount && (
                  <div className="text-xs text-gray-500 font-mono space-y-1">
                    <div>Principal: {parseInt(amount).toLocaleString()} VOX</div>
                    <div>Interest (10%): {Math.round(parseInt(amount) * 0.1).toLocaleString()} VOX</div>
                    <div className="text-vox-red">Total owed: {Math.round(parseInt(amount) * 1.1).toLocaleString()} VOX</div>
                  </div>
                )}

                <button
                  onClick={takeLoan}
                  disabled={loading || !amount}
                  className="btn-gold w-full py-3 rounded-lg font-bold tracking-wider disabled:opacity-50"
                >
                  {loading ? 'PROCESSING...' : 'REQUEST LOAN'}
                </button>

                {message && (
                  <div className={`p-3 rounded-lg text-sm ${message.startsWith('✓') ? 'bg-green-950/30 text-vox-green' : 'bg-red-950/30 text-vox-red'}`}>
                    {message}
                  </div>
                )}
              </div>
            </div>

            {/* Active loans */}
            <div className="panel p-6">
              <h2 className="font-display text-2xl text-white mb-4 tracking-wide">YOUR LOANS</h2>
              {activeLoans.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-sm">No active debt</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeLoans.map(loan => (
                    <div key={loan.id} className="p-4 rounded-lg bg-vox-darker border border-vox-border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-white font-semibold">
                          {loan.remaining_balance.toLocaleString()} VOX remaining
                        </div>
                        <div className="text-xs text-gray-500 font-mono">{loan.interest_rate}% int.</div>
                      </div>
                      <div className="text-xs text-gray-600 font-mono mb-3">
                        Due: {loan.due_date ? new Date(loan.due_date).toLocaleDateString() : 'N/A'}
                      </div>
                      <button
                        onClick={() => repayLoan(loan.id, loan.remaining_balance)}
                        disabled={loading || !profile || profile.vox_balance < loan.remaining_balance}
                        className="w-full py-2 text-xs font-bold tracking-wider rounded-lg border border-vox-green/40 text-vox-green hover:bg-vox-green/10 transition-colors disabled:opacity-40"
                      >
                        REPAY FULL ({loan.remaining_balance.toLocaleString()} VOX)
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
