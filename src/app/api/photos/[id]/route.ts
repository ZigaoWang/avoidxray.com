import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { deleteFromOSS } from '@/lib/oss'

function getOSSKey(url: string): string | null {
  const match = url.match(/aliyuncs\.com\/(.+)$/)
  return match ? match[1] : null
}

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
  const currentUserId = (session.user as { id: string }).id

  const photo = await prisma.photo.findUnique({ where: { id } })
  if (!photo) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Check permission: must be photo owner OR admin
  if (photo.userId !== currentUserId) {
    const currentUser = await prisma.user.findUnique({ where: { id: currentUserId } })
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }
  }

  // Delete files from OSS
  const keys = [photo.originalPath, photo.mediumPath, photo.thumbnailPath]
    .map(getOSSKey)
    .filter((k): k is string => k !== null)
  await Promise.all(keys.map(key => deleteFromOSS(key).catch(() => {})))

  await prisma.photo.delete({ where: { id } })

  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const currentUserId = (session.user as { id: string }).id
    const body = await req.json()
    const { caption, cameraId, filmStockId, takenDate } = body

    const photo = await prisma.photo.findUnique({ where: { id } })
    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // Check permission: must be photo owner OR admin
    let isAdmin = false
    if (photo.userId !== currentUserId) {
      const currentUser = await prisma.user.findUnique({ where: { id: currentUserId } })
      if (!currentUser?.isAdmin) {
        return NextResponse.json({ error: 'Not authorized to edit this photo' }, { status: 403 })
      }
      isAdmin = true
    }

    // Validate camera exists if provided
    if (cameraId) {
      const camera = await prisma.camera.findUnique({ where: { id: cameraId } })
      if (!camera) {
        console.error(`[Photo PATCH] Camera not found: ${cameraId}`)
        return NextResponse.json({ error: 'Camera not found' }, { status: 400 })
      }
    }

    // Validate film stock exists if provided
    if (filmStockId) {
      const filmStock = await prisma.filmStock.findUnique({ where: { id: filmStockId } })
      if (!filmStock) {
        console.error(`[Photo PATCH] Film stock not found: ${filmStockId}`)
        return NextResponse.json({ error: 'Film stock not found' }, { status: 400 })
      }
    }

    const updated = await prisma.photo.update({
      where: { id },
      data: {
        caption: caption !== undefined ? caption : photo.caption,
        cameraId: cameraId !== undefined ? (cameraId || null) : photo.cameraId,
        filmStockId: filmStockId !== undefined ? (filmStockId || null) : photo.filmStockId,
        published: true,
        takenDate: takenDate ? new Date(takenDate + 'T00:00:00Z') : photo.takenDate
      }
    })

    console.log(`[Photo PATCH] Updated photo ${id}: cameraId=${updated.cameraId}, filmStockId=${updated.filmStockId}, published=${updated.published}${isAdmin ? ' (by admin)' : ''}`)

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[Photo PATCH] Error:', error)
    return NextResponse.json({ error: 'Failed to update photo' }, { status: 500 })
  }
}
