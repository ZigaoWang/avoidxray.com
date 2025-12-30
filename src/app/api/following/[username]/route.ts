import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const following = await prisma.follow.findMany({
    where: { followerId: user.id },
    include: { following: { select: { username: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(following.map(f => f.following))
}
