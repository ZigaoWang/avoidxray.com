import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const baseUrl = process.env.NEXTAUTH_URL || 'https://avoidxray.com'

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid', baseUrl))
  }

  const user = await prisma.user.findFirst({ where: { verificationToken: token } })
  if (!user) {
    return NextResponse.redirect(new URL('/login?error=invalid', baseUrl))
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationToken: null }
  })

  return NextResponse.redirect(new URL('/login?verified=true', baseUrl))
}
