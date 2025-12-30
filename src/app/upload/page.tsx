'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Combobox from '@/components/Combobox'
import ClientHeader from '@/components/ClientHeader'
import Footer from '@/components/Footer'
import TagInput from '@/components/TagInput'

type Camera = { id: string; name: string; brand: string | null }
type FilmStock = { id: string; name: string; brand: string | null }

export default function UploadPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [caption, setCaption] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [cameras, setCameras] = useState<Camera[]>([])
  const [filmStocks, setFilmStocks] = useState<FilmStock[]>([])
  const [cameraId, setCameraId] = useState('')
  const [filmStockId, setFilmStockId] = useState('')
  const [newCameraName, setNewCameraName] = useState('')
  const [newFilmName, setNewFilmName] = useState('')
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

    let finalCameraId = cameraId
    let finalFilmStockId = filmStockId

    // Create camera only on submit if it's new
    if (newCameraName && !cameraId) {
      const res = await fetch('/api/cameras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCameraName })
      })
      const camera = await res.json()
      finalCameraId = camera.id
    }

    // Create film stock only on submit if it's new
    if (newFilmName && !filmStockId) {
      const res = await fetch('/api/filmstocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFilmName })
      })
      const filmStock = await res.json()
      finalFilmStockId = filmStock.id
    }

    const formData = new FormData()
    files.forEach(f => formData.append('files', f))
    if (caption) formData.append('caption', caption)
    if (finalCameraId) formData.append('cameraId', finalCameraId)
    if (finalFilmStockId) formData.append('filmStockId', finalFilmStockId)
    if (tags.length > 0) formData.append('tags', JSON.stringify(tags))

    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 10, 90))
    }, 500)

    await fetch('/api/upload', { method: 'POST', body: formData })
    clearInterval(interval)
    setProgress(100)
    router.push('/')
  }

  const handleCameraCreate = async (name: string) => {
    setNewCameraName(name)
    const tempId = `new-${name}`
    const temp = { id: tempId, name, brand: null }
    setCameras(prev => [...prev, temp])
    return temp
  }

  const handleFilmCreate = async (name: string) => {
    setNewFilmName(name)
    const tempId = `new-${name}`
    const temp = { id: tempId, name, brand: null }
    setFilmStocks(prev => [...prev, temp])
    return temp
  }

  const handleCameraChange = (id: string) => {
    setCameraId(id)
    if (!id.startsWith('new-')) setNewCameraName('')
  }

  const handleFilmChange = (id: string) => {
    setFilmStockId(id)
    if (!id.startsWith('new-')) setNewFilmName('')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <ClientHeader />

      <main className="flex-1 max-w-xl mx-auto w-full py-16 px-6">
        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Upload</h1>
        <p className="text-neutral-500 mb-10">Share your film photography</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed p-12 text-center transition-colors cursor-pointer ${
              isDragging ? 'border-[#D32F2F] bg-[#D32F2F]/5' : files.length ? 'border-neutral-700' : 'border-neutral-800'
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
              {files.length === 0 ? (
                <>
                  <p className="text-neutral-400 mb-1">Drop images or click to select</p>
                  <p className="text-neutral-600 text-xs">JPG, PNG, TIFF</p>
                </>
              ) : (
                <p className="text-white font-medium">{files.length} file{files.length > 1 ? 's' : ''} selected</p>
              )}
            </label>
          </div>

          {previews.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {previews.slice(0, 8).map((url, i) => (
                <div key={i} className="aspect-square overflow-hidden bg-neutral-900">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              {previews.length > 8 && (
                <div className="aspect-square bg-neutral-900 flex items-center justify-center text-neutral-500 text-sm">
                  +{previews.length - 8}
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-neutral-500 text-xs uppercase tracking-wider mb-2 font-medium">Caption</label>
              <input
                type="text"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                className="w-full p-3 bg-neutral-900 text-white border border-neutral-800 focus:border-[#D32F2F] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Combobox
                options={cameras}
                value={cameraId}
                onChange={handleCameraChange}
                onCreate={handleCameraCreate}
                placeholder="Search..."
                label="Camera"
              />
              <Combobox
                options={filmStocks}
                value={filmStockId}
                onChange={handleFilmChange}
                onCreate={handleFilmCreate}
                placeholder="Search..."
                label="Film Stock"
              />
            </div>

            <div>
              <label className="block text-neutral-500 text-xs uppercase tracking-wider mb-2 font-medium">Tags</label>
              <TagInput value={tags} onChange={setTags} />
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading || !files.length}
            className="w-full bg-[#D32F2F] text-white py-4 text-sm font-bold uppercase tracking-wider hover:bg-[#B71C1C] disabled:opacity-30 transition-colors"
          >
            {uploading ? `Uploading... ${progress}%` : 'Upload'}
          </button>
        </form>
      </main>

      <Footer />
    </div>
  )
}
