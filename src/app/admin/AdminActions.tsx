'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface AdminActionsProps {
  type: 'user' | 'photo' | 'comment'
  id: string
  isAdmin?: boolean
}

export default function AdminActions({ type, id, isAdmin }: AdminActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Delete this ${type}?`)) return
    setLoading(true)

    await fetch('/api/admin', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id })
    })

    router.refresh()
    setLoading(false)
  }

  const handleToggleAdmin = async () => {
    if (!confirm(isAdmin ? 'Remove admin?' : 'Make admin?')) return
    setLoading(true)

    await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id, isAdmin: !isAdmin })
    })

    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex gap-2">
      {type === 'user' && (
        <button
          onClick={handleToggleAdmin}
          disabled={loading}
          className="text-xs text-neutral-500 hover:text-white disabled:opacity-50"
        >
          {isAdmin ? 'Remove Admin' : 'Make Admin'}
        </button>
      )}
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-xs text-red-500 hover:text-red-400 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  )
}
