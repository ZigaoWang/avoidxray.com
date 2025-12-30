import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const tags = await prisma.tag.findMany({
    include: { _count: { select: { photos: true } } },
    orderBy: { photos: { _count: 'desc' } },
    take: 50
  })

  return NextResponse.json(tags)
}

export async function POST(req: NextRequest) {
  const { name } = await req.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Missing name' }, { status: 400 })
  }

  const normalized = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '')

  const tag = await prisma.tag.upsert({
    where: { name: normalized },
    update: {},
    create: { name: normalized }
  })

  return NextResponse.json(tag)
}
