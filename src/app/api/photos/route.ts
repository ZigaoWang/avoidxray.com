import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tab = searchParams.get('tab') || 'recent'
  const offset = parseInt(searchParams.get('offset') || '0')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id

  let followingIds: string[] = []
  if (tab === 'following' && userId) {
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    })
    followingIds = following.map(f => f.followingId)
  }

  // Build where clause
  const where = {
    published: true,
    ...(tab === 'following' && userId ? { userId: { in: followingIds } } : {})
  }

  // Popular: order by likes count
  if (tab === 'popular') {
    const photos = await prisma.photo.findMany({
      where,
      include: { user: true, filmStock: true, camera: true, _count: { select: { likes: true } } },
      orderBy: { likes: { _count: 'desc' } },
      skip: offset,
      take: limit + 1
    })

    const hasMore = photos.length > limit
    return NextResponse.json({
      photos: hasMore ? photos.slice(0, limit) : photos,
      nextOffset: hasMore ? offset + limit : null
    })
  }

  // Recent/Following: order by createdAt
  const photos = await prisma.photo.findMany({
    where,
    include: { user: true, filmStock: true, camera: true, _count: { select: { likes: true } } },
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit + 1
  })

  const hasMore = photos.length > limit
  return NextResponse.json({
    photos: hasMore ? photos.slice(0, limit) : photos,
    nextOffset: hasMore ? offset + limit : null
  })
}
