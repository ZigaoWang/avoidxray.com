import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get pending cameras
    const pendingCameras = await prisma.camera.findMany({
      where: { imageStatus: 'pending' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { imageUploadedAt: 'desc' }
    })

    // Get pending film stocks
    const pendingFilmStocks = await prisma.filmStock.findMany({
      where: { imageStatus: 'pending' },
      orderBy: { imageUploadedAt: 'desc' }
    })

    // Get uploader info for film stocks
    const filmStocksWithUploader = await Promise.all(
      pendingFilmStocks.map(async (filmStock) => {
        const uploader = filmStock.imageUploadedBy
          ? await prisma.user.findUnique({
              where: { id: filmStock.imageUploadedBy },
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true
              }
            })
          : null

        return {
          ...filmStock,
          uploader
        }
      })
    )

    return NextResponse.json({
      cameras: pendingCameras,
      filmStocks: filmStocksWithUploader,
      total: pendingCameras.length + pendingFilmStocks.length
    })
  } catch (error) {
    console.error('Moderation list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending items' },
      { status: 500 }
    )
  }
}
