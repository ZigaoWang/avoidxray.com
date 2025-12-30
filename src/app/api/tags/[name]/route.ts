import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params

  const tag = await prisma.tag.findUnique({
    where: { name },
    include: {
      photos: {
        include: {
          photo: {
            include: {
              user: { select: { username: true, name: true, avatar: true } },
              filmStock: true,
              camera: true,
              _count: { select: { likes: true } }
            }
          }
        },
        orderBy: { photo: { createdAt: 'desc' } }
      }
    }
  })

  if (!tag) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
  }

  return NextResponse.json({
    tag: { id: tag.id, name: tag.name },
    photos: tag.photos.map(pt => pt.photo)
  })
}
