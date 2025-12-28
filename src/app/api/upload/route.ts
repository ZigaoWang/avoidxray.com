import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { processImage } from '@/lib/image'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const files = formData.getAll('files') as File[]
  const caption = formData.get('caption') as string | null
  const cameraId = formData.get('cameraId') as string | null
  const filmStockId = formData.get('filmStockId') as string | null

  if (!files.length) {
    return NextResponse.json({ error: 'No files' }, { status: 400 })
  }

  const userId = (session.user as { id: string }).id
  const photos = []

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer())
    const id = randomUUID()
    const { originalPath, mediumPath, thumbnailPath, width, height } = await processImage(buffer, id)

    const photo = await prisma.photo.create({
      data: {
        id,
        userId,
        originalPath,
        mediumPath,
        thumbnailPath,
        width,
        height,
        caption,
        cameraId: cameraId || null,
        filmStockId: filmStockId || null
      }
    })
    photos.push(photo)
  }

  return NextResponse.json({ photos })
}
