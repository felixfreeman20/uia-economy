'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function QRPage() {
  const supabase = createClient()
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'pending' | 'completed'>('idle')

  // Scan/Pay mode
  const [scanMode, setScanMode] = useState(false)
  const [payCode, setPayCode] = useState('')
  const [payLoading, setPayLoading] = useState(false)
  const [payResult, setPayResult] = useState('')

  async function generateQR() {
    setLoading(true)
    const res = await fetch('/api/qr/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseInt(amount), description: note }),
    })
    const data = await res.json()
    if (data.requestId && data.qrDataUrl) {
      setRequestId(data.requestId)
      setQrDataUrl(data.qrDataUrl)
      setStatus('pending')
    }
    setLoading(false)
  }

  async function payRequest() {
    setPayLoading(true)
    const res = await fetch('/api/qr/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: payCode.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      setPayResult(`✓ Paid! ${data.amount} VOX sent.`)
      router.refresh()
    } else {
      setPayResult(`✗ ${data.error}`)
    }
    setPayLoading(false)
  }

  // Poll for completion
  useEffect(() => {
    if (!requestId || status !== 'pending') return
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('payment_requests')
        .select('status')
        .eq('id', requestId)
        .single()
      if (data?.status === 'completed') {
        setStatus('completed')
        clearInterval(interval)
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [requestId, status])

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <div className="text-gray-500 text-sm font-mono mb-1">INSTANT PAYMENTS</div>
        <h1 className="font-display text-5xl text-white tracking-wide">QR PAY</h1>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setScanMode(false)}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${!scanMode ? 'btn-gold' : 'btn-outline'}`}
        >
          RECEIVE (Create QR)
        </button>
        <button
          onClick={() => setScanMode(true)}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${scanMode ? 'btn-gold' : 'btn-outline'}`}
        >
          PAY (Enter Code)
        </button>
      </div>

      {!scanMode ? (
        <div className="panel p-8">
          {status === 'completed' ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✅</div>
              <div className="font-display text-3xl text-vox-green mb-2">PAYMENT RECEIVED</div>
              <div className="text-gray-400">{amount} VOX added to your wallet</div>
              <button onClick={() => { setStatus('idle'); setQrDataUrl(null); setRequestId(null) }} className="btn-gold px-6 py-2 rounded-lg mt-6 font-bold">
                NEW REQUEST
              </button>
            </div>
          ) : qrDataUrl ? (
            <div className="text-center">
              <div className="text-xs font-mono text-gray-500 tracking-widest mb-4">WAITING FOR PAYMENT — {amount} VOX</div>
              <div className="inline-block p-4 bg-white rounded-xl mb-4">
                <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
              </div>
              <div className="text-xs font-mono text-gray-600 break-all">ID: {requestId}</div>
              <div className="mt-4 flex items-center justify-center gap-2 text-vox-cyan text-sm">
                <div className="w-2 h-2 rounded-full bg-vox-cyan animate-pulse" />
                Waiting for payment...
              </div>
              <p className="text-xs text-gray-500 mt-2">Tell the payer to enter the ID above</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-mono text-gray-400 mb-2 tracking-widest">AMOUNT (VOX)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="input-dark w-full px-4 py-3 text-sm"
                  placeholder="50"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-gray-400 mb-2 tracking-widest">NOTE</label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="input-dark w-full px-4 py-3 text-sm"
                  placeholder="For what?"
                />
              </div>
              <button
                onClick={generateQR}
                disabled={!amount || loading}
                className="btn-gold w-full py-3 rounded-lg font-bold tracking-wider disabled:opacity-50"
              >
                {loading ? 'GENERATING...' : 'GENERATE QR CODE'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="panel p-8">
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-mono text-gray-400 mb-2 tracking-widest">PAYMENT REQUEST ID</label>
              <input
                type="text"
                value={payCode}
                onChange={e => setPayCode(e.target.value)}
                className="input-dark w-full px-4 py-3 text-sm"
                placeholder="Paste the request ID here"
              />
            </div>
            <button
              onClick={payRequest}
              disabled={!payCode || payLoading}
              className="btn-gold w-full py-3 rounded-lg font-bold tracking-wider disabled:opacity-50"
            >
              {payLoading ? 'PROCESSING...' : 'PAY NOW'}
            </button>
            {payResult && (
              <div className={`p-3 rounded-lg text-sm ${payResult.startsWith('✓') ? 'bg-green-950/30 text-vox-green' : 'bg-red-950/30 text-vox-red'}`}>
                {payResult}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
