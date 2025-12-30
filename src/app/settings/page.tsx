'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ClientHeader from '@/components/ClientHeader'
import Footer from '@/components/Footer'

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (session?.user) {
      setName((session.user as { name?: string }).name || '')
    }
  }, [session])

  if (status === 'loading') return null
  if (!session) {
    router.push('/login')
    return null
  }

  const user = session.user as { username?: string; name?: string }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const res = await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })

    if (res.ok) {
      await update({ name })
      router.refresh()
      setMessage('Saved!')
      setTimeout(() => setMessage(''), 2000)
    } else {
      setMessage('Error saving')
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <ClientHeader />

      <main className="flex-1 max-w-xl mx-auto w-full py-16 px-6">
        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Settings</h1>
        <p className="text-neutral-500 mb-10">Edit your profile</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-neutral-500 text-xs uppercase tracking-wider mb-2 font-medium">Username</label>
            <input
              type="text"
              value={user.username || ''}
              disabled
              className="w-full p-3 bg-neutral-900 text-neutral-500 border border-neutral-800 cursor-not-allowed"
            />
            <p className="text-neutral-600 text-xs mt-1">Username cannot be changed</p>
          </div>

          <div>
            <label className="block text-neutral-500 text-xs uppercase tracking-wider mb-2 font-medium">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-3 bg-neutral-900 text-white border border-neutral-800 focus:border-[#D32F2F] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#D32F2F] text-white px-8 py-3 text-sm font-bold uppercase tracking-wider hover:bg-[#B71C1C] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            {message && <span className="text-neutral-400 text-sm">{message}</span>}
          </div>
        </form>
      </main>

      <Footer />
    </div>
  )
}
