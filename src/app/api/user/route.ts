import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as { id: string }).id
  const { name, avatar, bio, website, instagram, twitter } = await req.json()

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: name || null,
      avatar: avatar || null,
      bio: bio || null,
      website: website || null,
      instagram: instagram || null,
      twitter: twitter || null
    }
  })

  return NextResponse.json({ user })
}
