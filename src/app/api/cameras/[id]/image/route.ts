import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uploadToOSS, deleteFromOSS } from '@/lib/oss'
import { sendAdminModerationNotification } from '@/lib/email'
import sharp from 'sharp'

// Validation helpers
function validateYear(year: string): boolean {
  const yearNum = parseInt(year)
  return !isNaN(yearNum) && yearNum >= 1800 && yearNum <= new Date().getFullYear()
}

function sanitizeString(str: string | null): string | null {
  if (!str) return null
  const trimmed = str.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id
    const { id: cameraId } = await params

    // Get camera and user in parallel
    const [camera, user] = await Promise.all([
      prisma.camera.findUnique({ where: { id: cameraId } }),
      prisma.user.findUnique({ where: { id: userId } })
    ])

    if (!camera) {
      return NextResponse.json({ error: 'Camera not found' }, { status: 404 })
    }

    // Permission check: only owner or admin can edit
    if (camera.userId !== userId && !user?.isAdmin) {
      return NextResponse.json(
        { error: 'You can only edit your own cameras' },
        { status: 403 }
      )
    }

    // Parse form data
    const formData = await req.formData()
    const file = formData.get('image') as File | null
    const rawDescription = formData.get('description') as string | null
    const rawCameraType = formData.get('cameraType') as string | null
    const rawFormat = formData.get('format') as string | null
    const rawMountType = formData.get('mountType') as string | null
    const rawYear = formData.get('year') as string | null

    // Sanitize inputs
    const description = sanitizeString(rawDescription)
    const cameraType = sanitizeString(rawCameraType)
    const format = sanitizeString(rawFormat)
    const mountType = sanitizeString(rawMountType)
    const year = sanitizeString(rawYear)

    // Validate year if provided
    if (year && !validateYear(year)) {
      return NextResponse.json(
        { error: 'Invalid year. Must be between 1800 and current year.' },
        { status: 400 }
      )
    }

    // Check if any changes were made
    const descriptionChanged = description !== null && description !== camera.description
    const hasCategorizationChanges = cameraType || format || mountType || year

    if (!file && !descriptionChanged && !hasCategorizationChanges) {
      return NextResponse.json(
        { error: 'No changes detected. Please modify at least one field.' },
        { status: 400 }
      )
    }

    // Validate file if provided
    if (file) {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
      }
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image must be smaller than 10MB' }, { status: 400 })
      }
    }

    let imageUrl = camera.imageUrl

    // Process image if uploaded
    if (file) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer())

        // Process image: trim, pad, resize, convert to WebP
        const processedBuffer = await sharp(buffer)
          .trim({
            background: { r: 0, g: 0, b: 0, alpha: 0 },
            threshold: 10
          })
          .extend({
            top: 40,
            bottom: 40,
            left: 40,
            right: 40,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .resize(1200, 1200, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: 90 })
          .toBuffer()

        // Delete old image if exists
        if (camera.imageUrl) {
          const oldKey = camera.imageUrl.split('.com/')[1]
          if (oldKey) {
            try {
              await deleteFromOSS(oldKey)
              console.log('[Camera] Deleted old image:', oldKey)
            } catch (error) {
              console.error('[Camera] Failed to delete old image:', error)
            }
          }
        }

        // Upload new image
        const timestamp = Date.now()
        const key = `cameras/${cameraId}-${timestamp}.webp`
        imageUrl = await uploadToOSS(processedBuffer, key)
      } catch (error) {
        console.error('[Camera] Image processing error:', error)
        return NextResponse.json(
          { error: 'Failed to process image' },
          { status: 500 }
        )
      }
    }

    // Build update data
    const updateData: any = {}

    // All changes require moderation (unless admin)
    const needsModeration = !user?.isAdmin

    // Description and categorization
    if (descriptionChanged) {
      updateData.description = description
    }
    if (cameraType) updateData.cameraType = cameraType
    if (format) updateData.format = format
    if (mountType) updateData.mountType = mountType
    if (year) updateData.year = parseInt(year)

    // Image upload
    if (file) {
      updateData.imageUrl = imageUrl
      updateData.imageUploadedBy = userId
      updateData.imageUploadedAt = new Date()
    }

    // Set moderation status for ANY change
    if (needsModeration) {
      updateData.imageStatus = 'pending'
      updateData.imageUploadedBy = userId
      updateData.imageUploadedAt = new Date()
    } else {
      // Admin: auto-approve
      updateData.imageStatus = 'approved'
      if (file) {
        updateData.imageUploadedBy = userId
        updateData.imageUploadedAt = new Date()
      }
    }

    // Update camera
    const updatedCamera = await prisma.camera.update({
      where: { id: cameraId },
      data: updateData
    })

    // Send admin notification for ALL changes by non-admins (not just images)
    if (!user?.isAdmin && user) {
      sendAdminModerationNotification(
        'camera',
        camera.name,
        camera.brand,
        user.username || user.email || 'Unknown',
        cameraId
      ).catch(err => {
        console.error('[Camera] Failed to send admin notification:', err)
      })
    }

    // Success message
    const message = user?.isAdmin
      ? 'Changes saved and approved.'
      : 'Changes submitted successfully. Waiting for admin review.'

    return NextResponse.json({
      success: true,
      message,
      camera: updatedCamera
    })

  } catch (error) {
    console.error('[Camera] Update error:', error)
    return NextResponse.json(
      { error: 'Failed to save changes. Please try again.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id
    const { id: cameraId } = await params

    // Get camera and user in parallel
    const [camera, user] = await Promise.all([
      prisma.camera.findUnique({ where: { id: cameraId } }),
      prisma.user.findUnique({ where: { id: userId } })
    ])

    if (!camera) {
      return NextResponse.json({ error: 'Camera not found' }, { status: 404 })
    }

    // Permission check
    if (camera.userId !== userId && !user?.isAdmin) {
      return NextResponse.json(
        { error: 'You can only delete images for your own cameras' },
        { status: 403 }
      )
    }

    // Delete from OSS
    if (camera.imageUrl) {
      const key = camera.imageUrl.split('.com/')[1]
      if (key) {
        try {
          await deleteFromOSS(key)
          console.log('[Camera] Deleted image:', key)
        } catch (error) {
          console.error('[Camera] Failed to delete image from OSS:', error)
          // Continue anyway
        }
      }
    }

    // Update camera
    const updatedCamera = await prisma.camera.update({
      where: { id: cameraId },
      data: {
        imageUrl: null,
        imageStatus: 'none',
        imageUploadedBy: null,
        imageUploadedAt: null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
      camera: updatedCamera
    })

  } catch (error) {
    console.error('[Camera] Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    )
  }
}
