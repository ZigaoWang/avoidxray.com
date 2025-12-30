import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  // Get top photographers by total likes
  const users = await prisma.user.findMany({
    include: {
      photos: {
        include: { _count: { select: { likes: true } } }
      },
      _count: { select: { photos: true, followers: true } }
    }
  })

  const leaderboard = users
    .map(user => ({
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      photoCount: user._count.photos,
      followerCount: user._count.followers,
      totalLikes: user.photos.reduce((sum, p) => sum + p._count.likes, 0)
    }))
    .filter(u => u.photoCount > 0)
    .sort((a, b) => b.totalLikes - a.totalLikes)
    .slice(0, 10)

  return NextResponse.json(leaderboard)
}
