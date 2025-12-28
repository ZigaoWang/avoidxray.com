import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads')

export async function processImage(buffer: Buffer, id: string) {
  const metadata = await sharp(buffer).metadata()
  const width = metadata.width || 0
  const height = metadata.height || 0

  const originalPath = `/uploads/originals/${id}.jpg`
  const mediumPath = `/uploads/medium/${id}.jpg`
  const thumbnailPath = `/uploads/thumbs/${id}.jpg`

  // Save original
  await fs.writeFile(path.join(UPLOAD_DIR, `originals/${id}.jpg`), buffer)

  // Generate medium (1600px wide)
  await sharp(buffer)
    .resize(1600, null, { withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(path.join(UPLOAD_DIR, `medium/${id}.jpg`))

  // Generate thumbnail (800px wide)
  await sharp(buffer)
    .resize(800, null, { withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(path.join(UPLOAD_DIR, `thumbs/${id}.jpg`))

  return { originalPath, mediumPath, thumbnailPath, width, height }
}
