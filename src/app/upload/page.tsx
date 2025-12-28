'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Combobox from '@/components/Combobox'
import Footer from '@/components/Footer'

type Camera = { id: string; name: string; brand: string | null }
type FilmStock = { id: string; name: string; brand: string | null }

export default function UploadPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [caption, setCaption] = useState('')
  const [cameras, setCameras] = useState<Camera[]>([])
  const [filmStocks, setFilmStocks] = useState<FilmStock[]>([])
  const [cameraId, setCameraId] = useState('')
  const [filmStockId, setFilmStockId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    fetch('/api/cameras').then(r => r.json()).then(setCameras)
    fetch('/api/filmstocks').then(r => r.json()).then(setFilmStocks)
  }, [])

  useEffect(() => {
    const urls = files.map(f => URL.createObjectURL(f))
    setPreviews(urls)
    return () => urls.forEach(u => URL.revokeObjectURL(u))
  }, [files])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (droppedFiles.length) setFiles(droppedFiles)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  if (status === 'loading') return null
  if (!session) {
    router.push('/login')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!files.length) return

    setUploading(true)
    setProgress(0)

    const formData = new FormData()
    files.forEach(f => formData.append('files', f))
    if (caption) formData.append('caption', caption)
    if (cameraId) formData.append('cameraId', cameraId)
    if (filmStockId) formData.append('filmStockId', filmStockId)

    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 10, 90))
    }, 500)

    await fetch('/api/upload', { method: 'POST', body: formData })
    clearInterval(interval)
    setProgress(100)
    router.push('/')
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
    <div className="min-h-screen bg-[#141414] flex flex-col">
      <header className="sticky top-0 z-50 bg-[#141414]/95 backdrop-blur-md border-b border-neutral-800/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-2xl">🎞️</span>
            <span className="text-xl text-white tracking-tight" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
              Film Gallery
            </span>
          </Link>
          <nav className="flex items-center gap-8">
            <Link href="/films" className="text-sm text-neutral-400 hover:text-white transition-colors">
              Film Stocks
            </Link>
            <Link href="/cameras" className="text-sm text-neutral-400 hover:text-white transition-colors">
              Cameras
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full py-12 px-6">
        <div className="mb-10">
          <h1 className="text-4xl text-white mb-3">Upload Photos</h1>
          <p className="text-neutral-400 text-lg">Share your film photography with the community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* File Drop Zone */}
          <div className="bg-[#1a1a1a] rounded-xl p-8 border border-neutral-800/50">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : files.length
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-neutral-700 hover:border-neutral-600'
              }`}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={e => setFiles(Array.from(e.target.files || []))}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer block">
                {isDragging ? (
                  <>
                    <div className="text-5xl mb-4">📥</div>
                    <p className="text-emerald-400 text-lg">Drop your photos here</p>
                  </>
                ) : files.length === 0 ? (
                  <>
                    <div className="text-5xl mb-4">📷</div>
                    <p className="text-white text-lg mb-2">Click to select photos</p>
                    <p className="text-neutral-500">or drag and drop your images here</p>
                  </>
                ) : (
                  <>
                    <p className="text-white text-lg mb-2">{files.length} photo{files.length > 1 ? 's' : ''} selected</p>
                    <p className="text-neutral-500">Click or drop to change selection</p>
                  </>
                )}
              </label>
            </div>

            {previews.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-6">
                {previews.slice(0, 8).map((url, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden bg-neutral-800">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
                {previews.length > 8 && (
                  <div className="aspect-square rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-400">
                    +{previews.length - 8}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="bg-[#1a1a1a] rounded-xl p-8 border border-neutral-800/50 space-y-6">
            <h2 className="text-lg text-white">Photo Details</h2>

            <div>
              <label className="block text-neutral-400 text-sm mb-2">Caption (optional)</label>
              <input
                type="text"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Add a caption to your photos..."
                className="w-full p-4 rounded-lg bg-[#141414] text-white border border-neutral-800 focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Combobox
                options={cameras}
                value={cameraId}
                onChange={setCameraId}
                onCreate={createCamera}
                placeholder="Search or add..."
                label="Camera (optional)"
              />
              <Combobox
                options={filmStocks}
                value={filmStockId}
                onChange={setFilmStockId}
                onCreate={createFilmStock}
                placeholder="Search or add..."
                label="Film Stock (optional)"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading || !files.length}
            className="w-full bg-emerald-600 text-white p-4 rounded-xl hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-4">
                <span>Uploading... {progress}%</span>
                <div className="w-32 h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all" style={{ width: `${progress}%` }} />
                </div>
              </span>
            ) : (
              `Upload ${files.length || ''} Photo${files.length !== 1 ? 's' : ''}`
            )}
          </button>
        </form>
      </main>

      <Footer />
    </div>
  )
}
