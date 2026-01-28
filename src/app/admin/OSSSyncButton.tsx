'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OSSSyncButton() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ ossTotal: number; dbTotal: number; orphaned: number } | null>(null)
  const router = useRouter()

  const checkOrphans = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/oss-sync')
      const data = await res.json()
      if (res.ok) {
        setStatus(data)
      } else {
        alert(data.error || 'Check failed')
      }
    } catch {
      alert('Check failed')
    } finally {
      setLoading(false)
    }
  }

  const cleanOrphans = async () => {
    if (!confirm('Delete all orphaned files from OSS? This cannot be undone.')) return

    setLoading(true)
    try {
      const res = await fetch('/api/admin/oss-sync', { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        alert(`Deleted ${data.deleted} orphaned files from OSS`)
        setStatus(null)
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
    <div className="bg-neutral-900 p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-lg font-bold text-white">OSS Storage</div>
          <div className="text-neutral-500 text-sm">Sync files with database</div>
        </div>
        <button
          onClick={checkOrphans}
          disabled={loading}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 disabled:opacity-50"
        >
          {loading ? '...' : 'Check'}
        </button>
      </div>

      {status && (
        <div className="mt-3 pt-3 border-t border-neutral-800">
          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            <div>
              <div className="text-white font-bold">{status.ossTotal}</div>
              <div className="text-neutral-500 text-xs">OSS Files</div>
            </div>
            <div>
              <div className="text-white font-bold">{status.dbTotal}</div>
              <div className="text-neutral-500 text-xs">DB Records</div>
            </div>
            <div>
              <div className={`font-bold ${status.orphaned > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                {status.orphaned}
              </div>
              <div className="text-neutral-500 text-xs">Orphaned</div>
            </div>
          </div>

          {status.orphaned > 0 && (
            <button
              onClick={cleanOrphans}
              disabled={loading}
              className="w-full text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-2 disabled:opacity-50"
            >
              {loading ? 'Cleaning...' : `Delete ${status.orphaned} Orphaned Files`}
            </button>
          )}

          {status.orphaned === 0 && (
            <div className="text-center text-green-500 text-sm">All files synced</div>
          )}
        </div>
      )}
    </div>
  )
}
