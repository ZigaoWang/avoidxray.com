'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LikeButton({ photoId, initialLiked, initialCount }: { photoId: string; initialLiked: boolean; initialCount: number }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [animating, setAnimating] = useState(false)

  const handleLike = async () => {
    if (!session) {
      router.push('/login')
      return
    }

    const newLiked = !liked
    setLiked(newLiked)
    setCount(c => newLiked ? c + 1 : c - 1)

    if (newLiked) {
      setAnimating(true)
      setTimeout(() => setAnimating(false), 300)
    }

    await fetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId })
    })
  }

  return (
    <button
      onClick={handleLike}
      className={`flex items-center gap-2 text-sm transition-colors ${
        liked ? 'text-[#D32F2F]' : 'text-neutral-500 hover:text-white'
      }`}
    >
      <span className={`text-lg ${animating ? 'animate-heart-pop' : ''}`}>{liked ? '♥' : '♡'}</span>
      <span>{count}</span>
    </button>
  )
}
