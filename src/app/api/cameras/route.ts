import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const cameras = await prisma.camera.findMany()

  // Only include imageUrl and description for approved images
  const sanitizedCameras = cameras.map(camera => ({
    ...camera,
    imageUrl: camera.imageStatus === 'approved' ? camera.imageUrl : null,
    description: camera.imageStatus === 'approved' ? camera.description : null,
    // Don't expose moderation fields to public
    imageStatus: undefined,
    imageUploadedBy: undefined,
    imageUploadedAt: undefined
  }))

  return NextResponse.json(sanitizedCameras)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const contentType = req.headers.get('content-type') || ''
    let name: string
    let brand: string | undefined
    let hasImageData = false
    let imageFile: File | null = null
    let description: string | undefined

    // Check if it's FormData (with image) or JSON (without image)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      name = formData.get('name') as string
      brand = (formData.get('brand') as string) || undefined
      imageFile = formData.get('image') as File | null
      description = (formData.get('description') as string) || undefined
      hasImageData = !!imageFile
    } else {
      const body = await req.json()
      name = body.name
      brand = body.brand
    }

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const userId = (session.user as { id: string }).id

    // Create camera
    const camera = await prisma.camera.create({
      data: { name, brand, userId }
    })

    // If image data was provided, upload it
    if (hasImageData && imageFile) {
      const { uploadToOSS } = await import('@/lib/oss')
      const { sendAdminModerationNotification } = await import('@/lib/email')
      const sharp = (await import('sharp')).default

      // Process image
      const buffer = Buffer.from(await imageFile.arrayBuffer())
      const processedBuffer = await sharp(buffer)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer()

      // Upload to OSS
      const key = `cameras/${camera.id}.webp`
      const imageUrl = await uploadToOSS(processedBuffer, key)

      // Update camera with pending image
      await prisma.camera.update({
        where: { id: camera.id },
        data: {
          imageUrl,
          description,
          imageStatus: 'pending',
          imageUploadedBy: userId,
          imageUploadedAt: new Date()
        }
      })

      // Send admin notification (non-blocking)
      const uploaderUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true }
      })

      if (uploaderUser) {
        sendAdminModerationNotification(
          'camera',
          camera.name,
          camera.brand,
          uploaderUser.username,
          camera.id
        ).catch(err => {
          console.error('Failed to send admin notification:', err)
        })
      }
    }

    return NextResponse.json(camera)
  } catch (error) {
    console.error('Create camera error:', error)
    return NextResponse.json(
      { error: 'Failed to create camera' },
      { status: 500 }
    )
  }
}
