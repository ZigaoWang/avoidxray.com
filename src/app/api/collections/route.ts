import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const collections = await prisma.collection.findMany({
    where: { featured: true },
    include: {
      photos: {
        include: { photo: true },
        orderBy: { order: 'asc' },
        take: 4
      },
      _count: { select: { photos: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(collections)
}
