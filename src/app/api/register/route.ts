import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { email, password, username, name } = await req.json()

  if (!email || !password || !username) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const exists = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] }
  })

  if (exists) {
    return NextResponse.json({ error: 'User already exists' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { email, passwordHash, username, name }
  })

  return NextResponse.json({ id: user.id, email: user.email })
}
