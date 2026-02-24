'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OrphanCleanupButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCleanup = async () => {
    if (!confirm('Clean up orphaned records from deleted users? This will remove notifications, moderation submissions, and unused cameras/film stocks.')) return

    setLoading(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'cleanup' })
      })
      const data = await res.json()
      if (res.ok) {
        alert(`Cleaned up:\n- ${data.cleaned.notifications} notifications\n- ${data.cleaned.moderationSubmissions} moderation submissions\n- ${data.cleaned.cameras} cameras\n- ${data.cleaned.filmStocks} film stocks`)
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
      className="bg-neutral-900 p-4 hover:bg-neutral-800 transition-colors text-left"
    >
      <div className="text-sm font-bold text-orange-500">{loading ? 'Cleaning...' : 'Clean Orphans'}</div>
      <div className="text-neutral-500 text-xs">Remove records from deleted users</div>
    </button>
  )
}
