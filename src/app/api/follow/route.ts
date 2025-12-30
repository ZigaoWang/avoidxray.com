import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { username } = await req.json()
  if (!username) {
    return NextResponse.json({ error: 'Missing username' }, { status: 400 })
  }

  const followerId = (session.user as { id: string }).id
  const targetUser = await prisma.user.findUnique({ where: { username } })

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (targetUser.id === followerId) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId: targetUser.id } }
  })

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } })
    return NextResponse.json({ following: false })
  }

  await prisma.follow.create({
    data: { followerId, followingId: targetUser.id }
  })

  // Create notification
  await prisma.notification.create({
    data: { type: 'follow', userId: targetUser.id, actorId: followerId }
  })

  return NextResponse.json({ following: true })
}
