import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uploadToOSS, deleteFromOSS } from '@/lib/oss'
import { sendAdminModerationNotification } from '@/lib/email'
import sharp from 'sharp'

// Validation helpers
function validateISO(iso: string): boolean {
  const isoNum = parseInt(iso)
  return !isNaN(isoNum) && isoNum >= 1 && isoNum <= 100000
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
    const { id: filmStockId } = await params

    // Get film stock and user in parallel
    const [filmStock, user] = await Promise.all([
      prisma.filmStock.findUnique({ where: { id: filmStockId } }),
      prisma.user.findUnique({ where: { id: userId } })
    ])

    if (!filmStock) {
      return NextResponse.json({ error: 'Film stock not found' }, { status: 404 })
    }

    // Permission check: admin or first uploader
    const canEdit = user?.isAdmin ||
                    !filmStock.imageUploadedBy ||
                    filmStock.imageUploadedBy === userId

    if (!canEdit) {
      return NextResponse.json(
        { error: 'You can only edit film stocks you created or as an admin' },
        { status: 403 }
      )
    }

    // Parse form data
    const formData = await req.formData()
    const file = formData.get('image') as File | null
    const rawDescription = formData.get('description') as string | null
    const rawFilmType = formData.get('filmType') as string | null
    const rawFormat = formData.get('format') as string | null
    const rawProcess = formData.get('process') as string | null
    const rawExposures = formData.get('exposures') as string | null
    const rawIso = formData.get('iso') as string | null

    // Sanitize inputs
    const description = sanitizeString(rawDescription)
    const filmType = sanitizeString(rawFilmType)
    const format = sanitizeString(rawFormat)
    const process = sanitizeString(rawProcess)
    const exposures = sanitizeString(rawExposures)
    const iso = sanitizeString(rawIso)

    // Validate ISO if provided
    if (iso && !validateISO(iso)) {
      return NextResponse.json(
        { error: 'Invalid ISO. Must be between 1 and 100000.' },
        { status: 400 }
      )
    }

    // Check if any changes were made
    const descriptionChanged = description !== null && description !== filmStock.description
    const hasCategorizationChanges = filmType || format || process || exposures || iso

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

    let imageUrl = filmStock.imageUrl

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
        if (filmStock.imageUrl) {
          const oldKey = filmStock.imageUrl.split('.com/')[1]
          if (oldKey) {
            try {
              await deleteFromOSS(oldKey)
              console.log('[FilmStock] Deleted old image:', oldKey)
            } catch (error) {
              console.error('[FilmStock] Failed to delete old image:', error)
            }
          }
        }

        // Upload new image
        const timestamp = Date.now()
        const key = `filmstocks/${filmStockId}-${timestamp}.webp`
        imageUrl = await uploadToOSS(processedBuffer, key)
      } catch (error) {
        console.error('[FilmStock] Image processing error:', error)
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
    if (filmType) updateData.filmType = filmType
    if (format) updateData.format = format
    if (process) updateData.process = process
    if (exposures) updateData.exposures = exposures
    if (iso) updateData.iso = parseInt(iso)

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

    // Update film stock
    const updatedFilmStock = await prisma.filmStock.update({
      where: { id: filmStockId },
      data: updateData
    })

    // Send admin notification for ALL changes by non-admins (not just images)
    if (!user?.isAdmin && user) {
      sendAdminModerationNotification(
        'filmstock',
        filmStock.name,
        filmStock.brand,
        user.username || user.email || 'Unknown',
        filmStockId
      ).catch(err => {
        console.error('[FilmStock] Failed to send admin notification:', err)
      })
    }

    // Success message
    const message = user?.isAdmin
      ? 'Changes saved and approved.'
      : 'Changes submitted successfully. Waiting for admin review.'

    return NextResponse.json({
      success: true,
      message,
      filmStock: updatedFilmStock
    })

  } catch (error) {
    console.error('[FilmStock] Update error:', error)
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
    const { id: filmStockId } = await params

    // Get film stock and user in parallel
    const [filmStock, user] = await Promise.all([
      prisma.filmStock.findUnique({ where: { id: filmStockId } }),
      prisma.user.findUnique({ where: { id: userId } })
    ])

    if (!filmStock) {
      return NextResponse.json({ error: 'Film stock not found' }, { status: 404 })
    }

    // Permission check
    const canDelete = user?.isAdmin || filmStock.imageUploadedBy === userId

    if (!canDelete) {
      return NextResponse.json(
        { error: 'You can only delete images you uploaded or as an admin' },
        { status: 403 }
      )
    }

    // Delete from OSS
    if (filmStock.imageUrl) {
      const key = filmStock.imageUrl.split('.com/')[1]
      if (key) {
        try {
          await deleteFromOSS(key)
          console.log('[FilmStock] Deleted image:', key)
        } catch (error) {
          console.error('[FilmStock] Failed to delete image from OSS:', error)
          // Continue anyway
        }
      }
    }

    // Update film stock
    const updatedFilmStock = await prisma.filmStock.update({
      where: { id: filmStockId },
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
      filmStock: updatedFilmStock
    })

  } catch (error) {
    console.error('[FilmStock] Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    )
  }
}
