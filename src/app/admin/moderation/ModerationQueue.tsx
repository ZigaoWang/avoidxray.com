'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type Camera = {
  id: string
  name: string
  brand: string | null
  imageUrl: string | null
  description: string | null
  imageUploadedAt: string | null
  user: {
    id: string
    username: string
    name: string | null
    avatar: string | null
  }
}

type FilmStock = {
  id: string
  name: string
  brand: string | null
  iso: number | null
  imageUrl: string | null
  description: string | null
  imageUploadedAt: string | null
  uploader: {
    id: string
    username: string
    name: string | null
    avatar: string | null
  } | null
}

type ModerationData = {
  cameras: Camera[]
  filmStocks: FilmStock[]
  total: number
}

export default function ModerationQueue() {
  const [data, setData] = useState<ModerationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const fetchPendingItems = async () => {
    try {
      const res = await fetch('/api/admin/moderation')
      if (!res.ok) throw new Error('Failed to fetch')
      const result = await res.json()
      setData(result)
    } catch (error) {
      console.error('Failed to load pending items:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingItems()
  }, [])

  const handleModeration = async (
    type: 'camera' | 'filmstock',
    id: string,
    action: 'approve' | 'reject'
  ) => {
    setProcessing(id)
    try {
      const res = await fetch(`/api/admin/moderation/${type}/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (!res.ok) throw new Error('Failed to moderate')

      const result = await res.json()
      alert(result.message)

      // Refresh the list
      await fetchPendingItems()
    } catch (error) {
      console.error('Moderation error:', error)
      alert('Failed to process moderation action')
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="text-neutral-500">Loading pending items...</div>
      </div>
    )
  }

  if (!data || data.total === 0) {
    return (
      <div className="bg-neutral-900 p-6 text-center">
        <div className="text-neutral-500">No pending items to review</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Pending Cameras */}
      {data.cameras.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white mb-4">
            Pending Cameras ({data.cameras.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.cameras.map(camera => (
              <div
                key={camera.id}
                className="bg-neutral-900 border border-neutral-800 overflow-hidden"
              >
                {/* Image */}
                {camera.imageUrl && (
                  <div className="relative aspect-square bg-neutral-800">
                    <Image
                      src={camera.imageUrl}
                      alt={camera.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="font-bold text-white">{camera.name}</h4>
                    {camera.brand && (
                      <p className="text-sm text-neutral-500">{camera.brand}</p>
                    )}
                  </div>

                  {camera.description && (
                    <p className="text-sm text-neutral-400">{camera.description}</p>
                  )}

                  {/* Uploader */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-neutral-500">Uploaded by:</span>
                    <Link
                      href={`/${camera.user.username}`}
                      className="flex items-center gap-1 text-white hover:text-[#D32F2F]"
                    >
                      {camera.user.avatar && (
                        <Image
                          src={camera.user.avatar}
                          alt=""
                          width={16}
                          height={16}
                          className="rounded-full"
                        />
                      )}
                      @{camera.user.username}
                    </Link>
                  </div>

                  {camera.imageUploadedAt && (
                    <p className="text-xs text-neutral-600">
                      {new Date(camera.imageUploadedAt).toLocaleString()}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleModeration('camera', camera.id, 'approve')}
                      disabled={processing === camera.id}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-sm font-medium disabled:opacity-50"
                    >
                      {processing === camera.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleModeration('camera', camera.id, 'reject')}
                      disabled={processing === camera.id}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 text-sm font-medium disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Film Stocks */}
      {data.filmStocks.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white mb-4">
            Pending Film Stocks ({data.filmStocks.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.filmStocks.map(filmStock => (
              <div
                key={filmStock.id}
                className="bg-neutral-900 border border-neutral-800 overflow-hidden"
              >
                {/* Image */}
                {filmStock.imageUrl && (
                  <div className="relative aspect-square bg-neutral-800">
                    <Image
                      src={filmStock.imageUrl}
                      alt={filmStock.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="font-bold text-white">{filmStock.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      {filmStock.brand && <span>{filmStock.brand}</span>}
                      {filmStock.iso && (
                        <>
                          {filmStock.brand && <span>•</span>}
                          <span>ISO {filmStock.iso}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {filmStock.description && (
                    <p className="text-sm text-neutral-400">{filmStock.description}</p>
                  )}

                  {/* Uploader */}
                  {filmStock.uploader && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-neutral-500">Uploaded by:</span>
                      <Link
                        href={`/${filmStock.uploader.username}`}
                        className="flex items-center gap-1 text-white hover:text-[#D32F2F]"
                      >
                        {filmStock.uploader.avatar && (
                          <Image
                            src={filmStock.uploader.avatar}
                            alt=""
                            width={16}
                            height={16}
                            className="rounded-full"
                          />
                        )}
                        @{filmStock.uploader.username}
                      </Link>
                    </div>
                  )}

                  {filmStock.imageUploadedAt && (
                    <p className="text-xs text-neutral-600">
                      {new Date(filmStock.imageUploadedAt).toLocaleString()}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleModeration('filmstock', filmStock.id, 'approve')}
                      disabled={processing === filmStock.id}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-sm font-medium disabled:opacity-50"
                    >
                      {processing === filmStock.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleModeration('filmstock', filmStock.id, 'reject')}
                      disabled={processing === filmStock.id}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 text-sm font-medium disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
