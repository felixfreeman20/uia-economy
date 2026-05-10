'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-vox-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center font-display text-4xl text-gold mb-12 tracking-widest hover:opacity-80 transition-opacity">
          VOXBANK
        </Link>

        <div className="panel p-8">
          <h1 className="font-display text-3xl text-white mb-2 tracking-wide">SIGN IN</h1>
          <p className="text-gray-500 text-sm mb-8">Access your VOX account</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-gray-400 mb-2 tracking-widest">EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-dark w-full px-4 py-3 text-sm"
                placeholder="you@school.edu"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-400 mb-2 tracking-widest">PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-dark w-full px-4 py-3 text-sm"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="text-vox-red text-sm p-3 bg-red-950/30 border border-red-900/30 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-3 rounded-lg font-bold text-sm tracking-wider disabled:opacity-50"
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            No account?{' '}
            <Link href="/register" className="text-vox-gold hover:text-vox-gold-light transition-colors">
              Open one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
