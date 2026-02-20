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

    const { id: cameraId } = await params
    const { action } = await req.json()

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const camera = await prisma.camera.findUnique({
      where: { id: cameraId }
    })

    if (!camera) {
      return NextResponse.json({ error: 'Camera not found' }, { status: 404 })
    }

    if (camera.imageStatus !== 'pending') {
      return NextResponse.json(
        { error: 'Camera image is not pending approval' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      // Approve the image
      const updatedCamera = await prisma.camera.update({
        where: { id: cameraId },
        data: { imageStatus: 'approved' }
      })

      return NextResponse.json({
        message: 'Camera image approved',
        camera: updatedCamera
      })
    } else {
      // Reject and delete the image
      if (camera.imageUrl) {
        const key = camera.imageUrl.split('.com/')[1]
        if (key) {
          try {
            await deleteFromOSS(key)
          } catch (error) {
            console.error('Failed to delete rejected image:', error)
          }
        }
      }

      const updatedCamera = await prisma.camera.update({
        where: { id: cameraId },
        data: {
          imageUrl: null,
          imageStatus: 'rejected',
          imageUploadedBy: null,
          imageUploadedAt: null
        }
      })

      return NextResponse.json({
        message: 'Camera image rejected and deleted',
        camera: updatedCamera
      })
    }
  } catch (error) {
    console.error('Camera moderation error:', error)
    return NextResponse.json(
      { error: 'Failed to moderate camera image' },
      { status: 500 }
    )
  }
}
