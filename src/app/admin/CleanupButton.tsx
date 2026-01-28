'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CleanupButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCleanup = async () => {
    if (!confirm('Delete all unpublished photos? This will remove files from storage.')) return

    setLoading(true)
    try {
      const res = await fetch('/api/upload/cleanup', { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        alert(`Deleted ${data.deleted} unpublished photos`)
        router.refresh()
      } else {
        alert(data.error || 'Cleanup failed')
      }
    } catch {
      alert('Cleanup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCleanup}
      disabled={loading}
      className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 disabled:opacity-50"
    >
      {loading ? '...' : 'Clean'}
    </button>
  )
}
