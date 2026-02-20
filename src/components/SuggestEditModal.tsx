'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

type SuggestEditModalProps = {
  type: 'camera' | 'filmstock'
  id: string
  name: string
  brand: string | null
  currentImage: string | null
  currentDescription: string | null
  onClose: () => void
}

export default function SuggestEditModal({
  type,
  id,
  name,
  brand,
  currentImage,
  currentDescription,
  onClose
}: SuggestEditModalProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [description, setDescription] = useState(currentDescription || '')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  if (!session) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-neutral-900 border border-neutral-800 p-8 max-w-md w-full">
          <h2 className="text-xl font-bold text-white mb-4">Sign in required</h2>
          <p className="text-neutral-400 mb-6">
            You need to sign in to suggest edits.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/login')}
              className="flex-1 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-4 py-2 font-medium"
            >
              Sign In
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async () => {
    if (!imageFile && !description && description === currentDescription) {
      alert('Please make some changes to submit')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      if (imageFile) {
        formData.append('image', imageFile)
      }
      formData.append('description', description)

      const endpoint = type === 'camera' ? `/api/cameras/${id}/image` : `/api/filmstocks/${id}/image`
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to submit')
      }

      const data = await res.json()
      alert(data.message || 'Edit submitted successfully! Waiting for admin review.')
      onClose()
      window.location.reload()
    } catch (error: any) {
      console.error('Submit error:', error)
      alert(error.message || 'Failed to submit edit')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 p-6 max-w-2xl w-full my-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Suggest Edit</h2>
            <p className="text-neutral-500 text-sm mt-1">
              {brand ? `${brand} ${name}` : name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Current Image */}
          {currentImage && (
            <div>
              <label className="block text-sm text-neutral-400 mb-2">Current Image</label>
              <div className="relative aspect-square max-w-xs bg-neutral-800">
                <Image
                  src={currentImage}
                  alt={name}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}

          {/* New Image Upload */}
          <div>
            <label className="block text-sm text-neutral-400 mb-2">
              {currentImage ? 'Replace Image' : 'Upload Image'}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="block w-full text-sm text-neutral-400
                file:mr-3 file:py-2 file:px-3
                file:border-0 file:text-sm file:font-medium
                file:bg-neutral-800 file:text-white
                hover:file:bg-neutral-700"
            />
            <p className="text-xs text-neutral-600 mt-1">
              Recommended: PNG with transparent background, max 800x800px
            </p>
          </div>

          {/* Preview */}
          {previewUrl && (
            <div>
              <label className="block text-sm text-neutral-400 mb-2">Preview</label>
              <div className="relative aspect-square max-w-xs bg-neutral-800">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm text-neutral-400 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Tell users about this ${type}...`}
              className="w-full bg-neutral-800 text-white p-3 text-sm"
              rows={4}
            />
          </div>

          {/* Info */}
          <div className="bg-neutral-800 border border-neutral-700 p-4">
            <p className="text-sm text-neutral-400">
              <strong className="text-white">Note:</strong> Your edit will be reviewed by admins before going live.
              This helps keep the community database accurate and high-quality.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={uploading}
              className="flex-1 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-4 py-3 font-medium disabled:opacity-50"
            >
              {uploading ? 'Submitting...' : 'Submit for Review'}
            </button>
            <button
              onClick={onClose}
              disabled={uploading}
              className="bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-3 font-medium disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
