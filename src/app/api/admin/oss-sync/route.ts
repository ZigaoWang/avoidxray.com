import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { listOSSObjects, deleteFromOSS } from '@/lib/oss'

// DELETE: Remove orphaned files from OSS that don't exist in database
export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as { id: string }).id }
  })

  if (!user?.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  // Get all photo paths from database
  const photos = await prisma.photo.findMany({
    select: { originalPath: true, mediumPath: true, thumbnailPath: true }
  })

  const dbPaths = new Set<string>()
  for (const photo of photos) {
    // Extract keys from URLs
    const extractKey = (url: string) => {
      const match = url.match(/aliyuncs\.com\/(.+)$/)
      return match ? match[1] : null
    }

    const keys = [photo.originalPath, photo.mediumPath, photo.thumbnailPath]
      .map(extractKey)
      .filter((k): k is string => k !== null)

    keys.forEach(k => dbPaths.add(k))
  }

  // List all objects in OSS
  const ossKeys = await listOSSObjects()

  // Find orphaned files (in OSS but not in database)
  const orphanedKeys = ossKeys.filter(key => !dbPaths.has(key))

  // Delete orphaned files
  let deleted = 0
  for (const key of orphanedKeys) {
    try {
      await deleteFromOSS(key)
      deleted++
    } catch (e) {
      console.error(`Failed to delete OSS key ${key}:`, e)
    }
  }

  return NextResponse.json({
    success: true,
    ossTotal: ossKeys.length,
    dbTotal: dbPaths.size,
    orphaned: orphanedKeys.length,
    deleted
  })
}

// GET: Check for orphaned files without deleting
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as { id: string }).id }
  })

  if (!user?.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  // Get all photo paths from database
  const photos = await prisma.photo.findMany({
    select: { originalPath: true, mediumPath: true, thumbnailPath: true }
  })

  const dbPaths = new Set<string>()
  for (const photo of photos) {
    const extractKey = (url: string) => {
      const match = url.match(/aliyuncs\.com\/(.+)$/)
      return match ? match[1] : null
    }

    const keys = [photo.originalPath, photo.mediumPath, photo.thumbnailPath]
      .map(extractKey)
      .filter((k): k is string => k !== null)

    keys.forEach(k => dbPaths.add(k))
  }

  // List all objects in OSS
  const ossKeys = await listOSSObjects()

  // Find orphaned files
  const orphanedKeys = ossKeys.filter(key => !dbPaths.has(key))

  return NextResponse.json({
    ossTotal: ossKeys.length,
    dbTotal: dbPaths.size,
    orphaned: orphanedKeys.length,
    orphanedKeys: orphanedKeys.slice(0, 20) // Show first 20 for preview
  })
}
