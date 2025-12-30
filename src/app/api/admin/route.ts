import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function isAdmin(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  return user?.isAdmin === true
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id

  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { type, id } = await req.json()

  if (type === 'user') {
    await prisma.user.delete({ where: { id } })
  } else if (type === 'photo') {
    await prisma.photo.delete({ where: { id } })
  } else if (type === 'comment') {
    await prisma.comment.delete({ where: { id } })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id

  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId: targetId, isAdmin: makeAdmin } = await req.json()

  await prisma.user.update({
    where: { id: targetId },
    data: { isAdmin: makeAdmin }
  })

  return NextResponse.json({ success: true })
}
