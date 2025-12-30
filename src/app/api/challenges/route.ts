import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const now = new Date()

  const challenges = await prisma.challenge.findMany({
    where: {
      active: true,
      endDate: { gte: now }
    },
    orderBy: { endDate: 'asc' }
  })

  // Get photo counts for each challenge tag
  const challengesWithCounts = await Promise.all(
    challenges.map(async challenge => {
      const tag = await prisma.tag.findUnique({
        where: { name: challenge.tagName },
        include: { _count: { select: { photos: true } } }
      })
      return {
        ...challenge,
        photoCount: tag?._count.photos || 0
      }
    })
  )

  return NextResponse.json(challengesWithCounts)
}
