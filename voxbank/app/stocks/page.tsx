'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Sidebar from '@/components/Sidebar'

interface Stock {
  id: string
  ticker: string
  company_name: string
  current_price: number
  previous_price: number
  sector: string
  available_shares: number
}

interface UserStock {
  stock_id: string
  shares: number
  avg_buy_price: number
}

export default function StocksPage() {
  const supabase = createClient()
  const [stocks, setStocks] = useState<Stock[]>([])
  const [userStocks, setUserStocks] = useState<UserStock[]>([])
  const [profile, setProfile] = useState<{ id: string; username: string; vox_balance: number } | null>(null)
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [history, setHistory] = useState<{ price: number; recorded_at: string }[]>([])
  const [tradeAmount, setTradeAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadData()
    // Refresh stocks every 30 seconds
    const interval = setInterval(loadStocks, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [profileRes, stocksRes, userStocksRes] = await Promise.all([
      supabase.from('profiles').select('id, username, vox_balance').eq('id', user.id).single(),
      supabase.from('stocks').select('*').eq('is_active', true).order('ticker'),
      supabase.from('user_stocks').select('*').eq('user_id', user.id),
    ])

    if (profileRes.data) setProfile(profileRes.data)
    if (stocksRes.data) setStocks(stocksRes.data)
    if (userStocksRes.data) setUserStocks(userStocksRes.data)
  }

  async function loadStocks() {
    const { data } = await supabase.from('stocks').select('*').eq('is_active', true).order('ticker')
    if (data) setStocks(data)
  }

  async function selectStock(stock: Stock) {
    setSelectedStock(stock)
    setMessage('')
    const { data } = await supabase
      .from('stock_history')
      .select('price, recorded_at')
      .eq('stock_id', stock.id)
      .order('recorded_at', { ascending: true })
      .limit(30)
    setHistory(data || [])
  }

  async function executeTrade(action: 'buy' | 'sell') {
    if (!selectedStock || !tradeAmount) return
    setLoading(true)
    setMessage('')

    const res = await fetch('/api/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stockId: selectedStock.id, action, shares: parseInt(tradeAmount) }),
    })

    const data = await res.json()
    if (res.ok) {
      setMessage(`✓ ${action === 'buy' ? 'Bought' : 'Sold'} ${tradeAmount} shares of ${selectedStock.ticker}`)
      setTradeAmount('')
      await loadData()
    } else {
      setMessage(`✗ ${data.error}`)
    }
    setLoading(false)
  }

  const getUserShares = (stockId: string) => userStocks.find(us => us.stock_id === stockId)?.shares || 0

  return (
    <div className="flex min-h-screen bg-vox-black">
      {profile && <Sidebar balance={profile.vox_balance} username={profile.username} />}
      <main className="flex-1 ml-60 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="text-gray-500 text-sm font-mono mb-1">TRADING FLOOR</div>
            <h1 className="font-display text-5xl text-white tracking-wide">STOCK MARKET</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stock list */}
            <div className="lg:col-span-1 space-y-3">
              {stocks.map(stock => {
                const change = stock.current_price - stock.previous_price
                const pct = stock.previous_price ? (change / stock.previous_price * 100).toFixed(2) : '0'
                const owned = getUserShares(stock.id)
                return (
                  <button
                    key={stock.id}
                    onClick={() => selectStock(stock)}
                    className={`w-full panel panel-hover p-4 text-left transition-all ${selectedStock?.id === stock.id ? 'border-vox-gold/40 bg-vox-gold/5' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-mono font-bold text-white">{stock.ticker}</div>
                      <div className={`font-mono font-bold ${change >= 0 ? 'number-green' : 'number-red'}`}>
                        {stock.current_price} VOX
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">{stock.company_name}</div>
                      <div className={`text-xs font-mono ${change >= 0 ? 'number-green' : 'number-red'}`}>
                        {change >= 0 ? '+' : ''}{pct}%
                      </div>
                    </div>
                    {owned > 0 && (
                      <div className="mt-2 text-xs text-vox-cyan font-mono">You own: {owned} shares</div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Chart + trade panel */}
            <div className="lg:col-span-2">
              {selectedStock ? (
                <div className="space-y-4">
                  {/* Stock header */}
                  <div className="panel p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-display text-4xl text-white">{selectedStock.ticker}</div>
                        <div className="text-gray-400">{selectedStock.company_name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-display text-3xl text-gold">{selectedStock.current_price} VOX</div>
                        <div className={`text-sm font-mono ${selectedStock.current_price >= selectedStock.previous_price ? 'number-green' : 'number-red'}`}>
                          {selectedStock.current_price >= selectedStock.previous_price ? '▲' : '▼'} {Math.abs(selectedStock.current_price - selectedStock.previous_price)} VOX
                        </div>
                      </div>
                    </div>

                    {/* Chart */}
                    {history.length > 1 && (
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={history.map(h => ({ price: h.price, time: new Date(h.recorded_at).toLocaleTimeString() }))}>
                          <XAxis dataKey="time" hide />
                          <YAxis hide domain={['auto', 'auto']} />
                          <Tooltip
                            contentStyle={{ background: '#161625', border: '1px solid #1e1e35', borderRadius: '8px' }}
                            labelStyle={{ display: 'none' }}
                            formatter={(val: number) => [`${val} VOX`, 'Price']}
                          />
                          <Line type="monotone" dataKey="price" stroke="#c9a84c" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Trade panel */}
                  <div className="panel p-6">
                    <h3 className="font-display text-2xl text-white mb-4 tracking-wide">TRADE</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-mono text-gray-400 mb-2 tracking-widest">SHARES</label>
                        <input
                          type="number"
                          value={tradeAmount}
                          onChange={e => setTradeAmount(e.target.value)}
                          className="input-dark w-full px-4 py-3 text-sm"
                          placeholder="10"
                          min="1"
                        />
                      </div>

                      {tradeAmount && (
                        <div className="text-sm text-gray-400 font-mono">
                          Total: {(parseInt(tradeAmount) * selectedStock.current_price).toLocaleString()} VOX
                        </div>
                      )}

                      {message && (
                        <div className={`p-3 rounded-lg text-sm ${message.startsWith('✓') ? 'bg-green-950/30 text-vox-green' : 'bg-red-950/30 text-vox-red'}`}>
                          {message}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => executeTrade('buy')}
                          disabled={loading || !tradeAmount}
                          className="bg-vox-green/20 border border-vox-green/40 text-vox-green py-3 rounded-lg font-bold text-sm tracking-wider hover:bg-vox-green/30 transition-colors disabled:opacity-50"
                        >
                          BUY
                        </button>
                        <button
                          onClick={() => executeTrade('sell')}
                          disabled={loading || !tradeAmount || getUserShares(selectedStock.id) === 0}
                          className="bg-vox-red/20 border border-vox-red/40 text-vox-red py-3 rounded-lg font-bold text-sm tracking-wider hover:bg-vox-red/30 transition-colors disabled:opacity-50"
                        >
                          SELL
                        </button>
                      </div>

                      <div className="text-xs text-gray-600 font-mono">
                        Available: {selectedStock.available_shares.toLocaleString()} shares • You own: {getUserShares(selectedStock.id)} shares
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="panel h-full flex items-center justify-center p-20 text-center text-gray-600">
                  <div>
                    <div className="text-5xl mb-4">📈</div>
                    <p className="font-mono">Select a stock to view chart and trade</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
