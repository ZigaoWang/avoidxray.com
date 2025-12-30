import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      photos: {
        include: {
          photo: {
            include: {
              user: { select: { username: true, name: true, avatar: true } },
              filmStock: true,
              _count: { select: { likes: true } }
            }
          }
        },
        orderBy: { order: 'asc' }
      },
      _count: { select: { photos: true } }
    }
  })

  if (!collection) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  }

  return NextResponse.json(collection)
}
