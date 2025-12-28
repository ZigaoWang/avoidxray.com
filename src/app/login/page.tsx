'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) setError('Invalid email or password')
    else router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col">
      <header className="border-b border-neutral-800/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-2xl">🎞️</span>
            <span className="text-xl text-white tracking-tight" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
              Film Gallery
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="bg-[#1a1a1a] rounded-2xl p-10 border border-neutral-800/50">
            <div className="text-center mb-10">
              <h1 className="text-3xl text-white mb-3">Welcome back</h1>
              <p className="text-neutral-500">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-neutral-400 text-sm mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full p-4 rounded-lg bg-[#141414] text-white border border-neutral-800 focus:border-emerald-500 focus:outline-none transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-400 text-sm mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full p-4 rounded-lg bg-[#141414] text-white border border-neutral-800 focus:border-emerald-500 focus:outline-none transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white p-4 rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-neutral-500">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-emerald-500 hover:text-emerald-400">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
