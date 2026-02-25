/**
 * Script to generate blurhash for existing photos that don't have one.
 * Run with: npx tsx scripts/generate-blurhash.ts
 */

import { PrismaClient } from '@prisma/client'
import sharp from 'sharp'
import { encode } from 'blurhash'

const prisma = new PrismaClient()

async function generateBlurhash(imageUrl: string): Promise<string | null> {
  try {
    // Fetch image from URL
    const response = await fetch(imageUrl)
    if (!response.ok) return null

    const buffer = Buffer.from(await response.arrayBuffer())

    // Resize to small dimensions for blurhash
    const { data, info } = await sharp(buffer)
      .resize(32, 32, { fit: 'inside' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3)
  } catch (error) {
    console.error(`Failed to generate blurhash for ${imageUrl}:`, error)
    return null
  }
}

async function main() {
  console.log('Finding photos without blurhash...')

  const photos = await prisma.photo.findMany({
    where: { blurHash: null },
    select: { id: true, thumbnailPath: true }
  })

  console.log(`Found ${photos.length} photos without blurhash`)

  let processed = 0
  let failed = 0

  for (const photo of photos) {
    const blurHash = await generateBlurhash(photo.thumbnailPath)

    if (blurHash) {
      await prisma.photo.update({
        where: { id: photo.id },
        data: { blurHash }
      })
      processed++
    } else {
      failed++
    }

    if ((processed + failed) % 10 === 0) {
      console.log(`Progress: ${processed + failed}/${photos.length} (${processed} success, ${failed} failed)`)
    }
  }

  console.log(`\nDone! Processed: ${processed}, Failed: ${failed}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
