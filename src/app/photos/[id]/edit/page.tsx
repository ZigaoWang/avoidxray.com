'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Combobox from '@/components/Combobox'

type Camera = { id: string; name: string; brand: string | null }
type FilmStock = { id: string; name: string; brand: string | null }
type Photo = { id: string; caption: string | null; cameraId: string | null; filmStockId: string | null }

export default function EditPhotoPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [caption, setCaption] = useState('')
  const [cameraId, setCameraId] = useState('')
  const [filmStockId, setFilmStockId] = useState('')
  const [cameras, setCameras] = useState<Camera[]>([])
  const [filmStocks, setFilmStocks] = useState<FilmStock[]>([])
  const [saving, setSaving] = useState(false)
  const [photoId, setPhotoId] = useState<string>('')

  useEffect(() => {
    params.then(p => setPhotoId(p.id))
  }, [params])

  useEffect(() => {
    if (!photoId) return
    fetch(`/api/photos/${photoId}`).then(r => r.json()).then(data => {
      setPhoto(data)
      setCaption(data.caption || '')
      setCameraId(data.cameraId || '')
      setFilmStockId(data.filmStockId || '')
    })
    fetch('/api/cameras').then(r => r.json()).then(setCameras)
    fetch('/api/filmstocks').then(r => r.json()).then(setFilmStocks)
  }, [photoId])

  if (status === 'loading' || !photo) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-neutral-500">Loading...</div>
    </div>
  )
  if (!session) {
    router.push('/login')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/photos/${photoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption, cameraId, filmStockId })
    })
    router.push(`/photos/${photoId}`)
  }

  const createCamera = async (name: string) => {
    const res = await fetch('/api/cameras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
    const camera = await res.json()
    setCameras(prev => [...prev, camera])
    return camera
  }

  const createFilmStock = async (name: string) => {
    const res = await fetch('/api/filmstocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
    const filmStock = await res.json()
    setFilmStocks(prev => [...prev, filmStock])
    return filmStock
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0a0a0a]/80 border-b border-neutral-800/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-semibold text-white tracking-tight">
            Film Gallery
          </Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto py-12 px-6">
        <Link href={`/photos/${photoId}`} className="text-neutral-500 hover:text-white text-sm mb-6 inline-block">
          ← Back to Photo
        </Link>
        <h1 className="text-3xl font-bold text-white mb-8">Edit Photo</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-neutral-300 mb-2 text-sm">Caption</label>
            <input
              type="text"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Add a caption..."
              className="w-full p-3 rounded-lg bg-neutral-800 text-white border border-neutral-700 focus:border-emerald-500 focus:outline-none transition-colors"
            />
          </div>

          <Combobox
            options={cameras}
            value={cameraId}
            onChange={setCameraId}
            onCreate={createCamera}
            placeholder="Search or add camera..."
            label="Camera"
          />

          <Combobox
            options={filmStocks}
            value={filmStockId}
            onChange={setFilmStockId}
            onCreate={createFilmStock}
            placeholder="Search or add film..."
            label="Film Stock"
          />

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-emerald-600 text-white p-3 rounded-lg font-medium hover:bg-emerald-500 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href={`/photos/${photoId}`}
              className="flex-1 bg-neutral-800 text-white p-3 rounded-lg font-medium hover:bg-neutral-700 text-center transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
