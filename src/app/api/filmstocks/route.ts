import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const filmStocks = await prisma.filmStock.findMany()
  return NextResponse.json(filmStocks)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { name, brand, iso } = await req.json()
  const filmStock = await prisma.filmStock.create({ data: { name, brand, iso } })
  return NextResponse.json(filmStock)
}
