'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Check username availability
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .single()

    if (existing) {
      setError('Username already taken')
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username.toLowerCase() }
      }
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        username: username.toLowerCase(),
        display_name: username,
        vox_balance: 1000,
      })

      if (profileError) {
        setError(profileError.message)
        setLoading(false)
        return
      }

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
          <h1 className="font-display text-3xl text-white mb-2 tracking-wide">OPEN ACCOUNT</h1>
          <p className="text-gray-500 text-sm mb-2">You'll receive <span className="text-vox-gold font-semibold">1,000 VOX</span> on registration</p>
          <div className="h-px bg-vox-border mb-8" />

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-gray-400 mb-2 tracking-widest">USERNAME</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                className="input-dark w-full px-4 py-3 text-sm"
                placeholder="satoshi_vox"
                minLength={3}
                maxLength={20}
                required
              />
              <p className="text-xs text-gray-600 mt-1">Letters, numbers, underscores only</p>
            </div>
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
                placeholder="Min. 8 characters"
                minLength={8}
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
              {loading ? 'CREATING...' : 'CREATE ACCOUNT + CLAIM 1,000 VOX'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-vox-gold hover:text-vox-gold-light transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
