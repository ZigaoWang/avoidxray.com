import sharp from 'sharp'
import { encode } from 'blurhash'
import { uploadToOSS } from './oss'

export async function processImage(buffer: Buffer, id: string, originalExt: string = 'jpg') {
  const rotatedBuffer = await sharp(buffer).rotate().toBuffer()
  const metadata = await sharp(rotatedBuffer).metadata()
  const width = metadata.width || 0
  const height = metadata.height || 0

  // Generate blurhash from a small version of the image
  const { data, info } = await sharp(rotatedBuffer)
    .resize(32, 32, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const blurHash = encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3)

  // Generate compressed versions in parallel
  const [mediumBuffer, thumbBuffer] = await Promise.all([
    sharp(rotatedBuffer).resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer(),
    sharp(rotatedBuffer).resize(800, 800, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 75 }).toBuffer(),
  ])

  // Upload all in parallel (original as-is, others as webp)
  const [originalPath, mediumPath, thumbnailPath] = await Promise.all([
    uploadToOSS(buffer, `originals/${id}.${originalExt}`),
    uploadToOSS(mediumBuffer, `medium/${id}.webp`),
    uploadToOSS(thumbBuffer, `thumbs/${id}.webp`),
  ])

  return { originalPath, mediumPath, thumbnailPath, width, height, blurHash }
}
