'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function TransferPage() {
  const supabase = createClient()
  const router = useRouter()
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const amt = parseInt(amount)
    if (isNaN(amt) || amt <= 0) {
      setError('Invalid amount')
      setLoading(false)
      return
    }

    const response = await fetch('/api/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient: recipient.toLowerCase(), amount: amt, note }),
    })

    const data = await response.json()

    if (!response.ok) {
      setError(data.error || 'Transfer failed')
    } else {
      setSuccess(`Successfully sent ${amt.toLocaleString()} VOX to @${recipient}!`)
      setRecipient('')
      setAmount('')
      setNote('')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <div className="text-gray-500 text-sm font-mono mb-1">WALLET</div>
        <h1 className="font-display text-5xl text-white tracking-wide">SEND VOX</h1>
      </div>

      <div className="panel p-8">
        <form onSubmit={handleTransfer} className="space-y-5">
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-2 tracking-widest">RECIPIENT USERNAME</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
              <input
                type="text"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                className="input-dark w-full pl-8 pr-4 py-3 text-sm"
                placeholder="username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-400 mb-2 tracking-widest">AMOUNT (VOX)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="input-dark w-full px-4 py-3 text-sm"
              placeholder="100"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-400 mb-2 tracking-widest">NOTE (OPTIONAL)</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="input-dark w-full px-4 py-3 text-sm"
              placeholder="Payment for lunch..."
              maxLength={100}
            />
          </div>

          {error && (
            <div className="text-vox-red text-sm p-3 bg-red-950/30 border border-red-900/30 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="text-vox-green text-sm p-3 bg-green-950/30 border border-green-900/30 rounded-lg">
              ✓ {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full py-3 rounded-lg font-bold tracking-wider disabled:opacity-50"
          >
            {loading ? 'SENDING...' : 'SEND VOX →'}
          </button>
        </form>
      </div>

      {/* Warning */}
      <div className="mt-4 p-4 rounded-lg border border-vox-border bg-vox-darker text-xs text-gray-500 font-mono">
        ⚠ TRANSFERS ARE INSTANT AND IRREVERSIBLE. DOUBLE-CHECK THE USERNAME.
      </div>
    </div>
  )
}
