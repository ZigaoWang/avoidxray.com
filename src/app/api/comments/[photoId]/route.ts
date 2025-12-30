import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const { photoId } = await params

  const comments = await prisma.comment.findMany({
    where: { photoId },
    include: { user: { select: { username: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(comments)
}
