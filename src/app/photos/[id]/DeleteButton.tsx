'use client'
import { useRouter } from 'next/navigation'

export default function DeleteButton({ photoId }: { photoId: string }) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('Delete this photo?')) return
    await fetch(`/api/photos/${photoId}`, { method: 'DELETE' })
    router.push('/')
  }

  return (
    <button
      onClick={handleDelete}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
    >
      Delete
    </button>
  )
}
