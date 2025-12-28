'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', username: '', name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setLoading(false)
    if (res.ok) router.push('/login')
    else setError((await res.json()).error || 'Registration failed')
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
              <h1 className="text-3xl text-white mb-3">Create your account</h1>
              <p className="text-neutral-500">Join the film photography community</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-400 text-sm mb-2">Username</label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    className="w-full p-4 rounded-lg bg-[#141414] text-white border border-neutral-800 focus:border-emerald-500 focus:outline-none transition-colors"
                    placeholder="johndoe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 text-sm mb-2">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full p-4 rounded-lg bg-[#141414] text-white border border-neutral-800 focus:border-emerald-500 focus:outline-none transition-colors"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 text-sm mb-2">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full p-4 rounded-lg bg-[#141414] text-white border border-neutral-800 focus:border-emerald-500 focus:outline-none transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-400 text-sm mb-2">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
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
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-neutral-500">
                Already have an account?{' '}
                <Link href="/login" className="text-emerald-500 hover:text-emerald-400">
                  Sign in
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
