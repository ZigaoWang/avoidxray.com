import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { photoId, content } = await req.json()
  if (!photoId || !content?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const userId = (session.user as { id: string }).id

  const comment = await prisma.comment.create({
    data: { userId, photoId, content: content.trim() },
    include: { user: { select: { username: true, name: true, avatar: true } } }
  })

  // Create notification for photo owner
  const photo = await prisma.photo.findUnique({ where: { id: photoId }, select: { userId: true } })
  if (photo && photo.userId !== userId) {
    await prisma.notification.create({
      data: { type: 'comment', userId: photo.userId, actorId: userId, photoId }
    })
  }

  return NextResponse.json(comment)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const userId = (session.user as { id: string }).id
  const comment = await prisma.comment.findUnique({ where: { id } })

  if (!comment || comment.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.comment.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
