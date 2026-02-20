import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { deleteFromOSS } from '@/lib/oss'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: filmStockId } = await params
    const { action } = await req.json()

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const filmStock = await prisma.filmStock.findUnique({
      where: { id: filmStockId }
    })

    if (!filmStock) {
      return NextResponse.json({ error: 'Film stock not found' }, { status: 404 })
    }

    if (filmStock.imageStatus !== 'pending') {
      return NextResponse.json(
        { error: 'Film stock image is not pending approval' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      // Approve the image
      const updatedFilmStock = await prisma.filmStock.update({
        where: { id: filmStockId },
        data: { imageStatus: 'approved' }
      })

      return NextResponse.json({
        message: 'Film stock image approved',
        filmStock: updatedFilmStock
      })
    } else {
      // Reject and delete the image
      if (filmStock.imageUrl) {
        const key = filmStock.imageUrl.split('.com/')[1]
        if (key) {
          try {
            await deleteFromOSS(key)
          } catch (error) {
            console.error('Failed to delete rejected image:', error)
          }
        }
      }

      const updatedFilmStock = await prisma.filmStock.update({
        where: { id: filmStockId },
        data: {
          imageUrl: null,
          imageStatus: 'rejected',
          imageUploadedBy: null,
          imageUploadedAt: null
        }
      })

      return NextResponse.json({
        message: 'Film stock image rejected and deleted',
        filmStock: updatedFilmStock
      })
    }
  } catch (error) {
    console.error('Film stock moderation error:', error)
    return NextResponse.json(
      { error: 'Failed to moderate film stock image' },
      { status: 500 }
    )
  }
}
