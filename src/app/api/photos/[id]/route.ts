import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import fs from 'fs/promises'
import path from 'path'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const photo = await prisma.photo.findUnique({
    where: { id },
    include: { camera: true, filmStock: true }
  })
  if (!photo) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(photo)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const userId = (session.user as { id: string }).id

  const photo = await prisma.photo.findUnique({ where: { id } })
  if (!photo || photo.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Delete files
  const uploadDir = path.join(process.cwd(), 'public')
  await Promise.all([
    fs.unlink(path.join(uploadDir, photo.originalPath)).catch(() => {}),
    fs.unlink(path.join(uploadDir, photo.mediumPath)).catch(() => {}),
    fs.unlink(path.join(uploadDir, photo.thumbnailPath)).catch(() => {})
  ])

  await prisma.photo.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const userId = (session.user as { id: string }).id
  const { caption, cameraId, filmStockId } = await req.json()

  const photo = await prisma.photo.findUnique({ where: { id } })
  if (!photo || photo.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updated = await prisma.photo.update({
    where: { id },
    data: { caption, cameraId: cameraId || null, filmStockId: filmStockId || null }
  })

  return NextResponse.json(updated)
}
