'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import ClientHeader from '@/components/ClientHeader'
import Footer from '@/components/Footer'
import { useToast } from '@/components/ui/Toast'

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [instagram, setInstagram] = useState('')
  const [twitter, setTwitter] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (session?.user) {
      const user = session.user as { name?: string; avatar?: string; bio?: string; website?: string; instagram?: string; twitter?: string }
      setName(user.name || '')
      setAvatar(user.avatar || null)
      setBio(user.bio || '')
      setWebsite(user.website || '')
      setInstagram(user.instagram || '')
      setTwitter(user.twitter || '')
    }
  }, [session])

  if (status === 'loading') return null
  if (!session) {
    router.push('/login')
    return null
  }

  const user = session.user as { username?: string; name?: string; avatar?: string }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatar(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    let avatarPath = user.avatar

    if (avatarFile) {
      const formData = new FormData()
      formData.append('file', avatarFile)
      const uploadRes = await fetch('/api/avatar', { method: 'POST', body: formData })
      if (uploadRes.ok) {
        const data = await uploadRes.json()
        avatarPath = data.path
      }
    }

    const res = await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, avatar: avatarPath, bio, website, instagram, twitter })
    })

    if (res.ok) {
      await update({ name, avatar: avatarPath })
      router.refresh()
      toast('Settings saved!', 'success')
    } else {
      toast('Error saving settings', 'error')
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
            <label className="block text-neutral-500 text-xs uppercase tracking-wider mb-2 font-medium">Avatar</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-neutral-800 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                {avatar ? (
                  <Image src={avatar} alt="" width={80} height={80} className="w-full h-full object-cover" />
                ) : (
                  (user.name || user.username || '?').charAt(0).toUpperCase()
                )}
              </div>
              <label className="cursor-pointer bg-neutral-800 text-white px-4 py-2 text-sm hover:bg-neutral-700 transition-colors">
                Change
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>
          </div>

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

          <div>
            <label className="block text-neutral-500 text-xs uppercase tracking-wider mb-2 font-medium">Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
              placeholder="Tell us about yourself..."
              className="w-full p-3 bg-neutral-900 text-white border border-neutral-800 focus:border-[#D32F2F] focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-neutral-500 text-xs uppercase tracking-wider mb-2 font-medium">Website</label>
            <input
              type="url"
              value={website}
              onChange={e => setWebsite(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="w-full p-3 bg-neutral-900 text-white border border-neutral-800 focus:border-[#D32F2F] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-neutral-500 text-xs uppercase tracking-wider mb-2 font-medium">Instagram</label>
            <div className="flex">
              <span className="p-3 bg-neutral-800 text-neutral-500 border border-r-0 border-neutral-800">@</span>
              <input
                type="text"
                value={instagram}
                onChange={e => setInstagram(e.target.value)}
                placeholder="username"
                className="flex-1 p-3 bg-neutral-900 text-white border border-neutral-800 focus:border-[#D32F2F] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-500 text-xs uppercase tracking-wider mb-2 font-medium">Twitter / X</label>
            <div className="flex">
              <span className="p-3 bg-neutral-800 text-neutral-500 border border-r-0 border-neutral-800">@</span>
              <input
                type="text"
                value={twitter}
                onChange={e => setTwitter(e.target.value)}
                placeholder="username"
                className="flex-1 p-3 bg-neutral-900 text-white border border-neutral-800 focus:border-[#D32F2F] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#D32F2F] text-white px-8 py-3 text-sm font-bold uppercase tracking-wider hover:bg-[#B71C1C] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  )
}
